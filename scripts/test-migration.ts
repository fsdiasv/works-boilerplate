/**
 * Migration Validation Test
 *
 * This script validates that the users/customers separation
 * migration has been applied correctly.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TestResult {
  test: string
  passed: boolean
  message: string
  details?: any
}

const results: TestResult[] = []

// Helper function to run a test
async function runTest(name: string, testFn: () => Promise<boolean>, errorMessage: string) {
  try {
    const passed = await testFn()
    results.push({
      test: name,
      passed,
      message: passed ? '✅ Passed' : `❌ Failed: ${errorMessage}`,
    })
    return passed
  } catch (error) {
    results.push({
      test: name,
      passed: false,
      message: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    })
    return false
  }
}

async function validateSchema() {
  console.log('🔍 Validating Database Schema...\n')

  // Test 1: Check customers table exists
  await runTest(
    'Customers table exists',
    async () => {
      const count = await prisma.customer.count()
      console.log(`   Found ${count} customers`)
      return true
    },
    'Customers table not found'
  )

  // Test 2: Check users table exists
  await runTest(
    'Users table exists',
    async () => {
      const count = await prisma.user.count()
      console.log(`   Found ${count} users`)
      return true
    },
    'Users table not found'
  )

  // Test 3: Check user_customer_mappings table exists
  await runTest(
    'UserCustomerMapping table exists',
    async () => {
      const count = await prisma.userCustomerMapping.count()
      console.log(`   Found ${count} mappings`)
      return true
    },
    'UserCustomerMapping table not found'
  )

  // Test 4: Verify column rename in orders table
  await runTest(
    'Orders table has customer_id column',
    async () => {
      const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_id'
      `
      return result.length > 0
    },
    'customer_id column not found in orders table'
  )

  // Test 5: Verify foreign keys are correct
  await runTest(
    'Orders table references customers table',
    async () => {
      const result = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'orders'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%customer%'
      `
      return result.length > 0
    },
    'Foreign key to customers not found in orders table'
  )

  // Test 6: Check if admin users were created
  await runTest(
    'Admin users exist',
    async () => {
      const adminUsers = await prisma.user.findMany({
        where: {
          metadata: {
            path: ['role'],
            equals: 'admin',
          },
        },
      })
      console.log(`   Found ${adminUsers.length} admin users`)
      if (adminUsers.length > 0) {
        console.log(`   Admin emails: ${adminUsers.map(u => u.email).join(', ')}`)
      }
      return adminUsers.length > 0
    },
    'No admin users found'
  )

  // Test 7: Check workspace exists
  await runTest(
    'Default workspace exists',
    async () => {
      const workspace = await prisma.workspace.findFirst({
        where: { slug: 'default' },
      })
      if (workspace) {
        console.log(`   Found workspace: ${workspace.name}`)
      }
      return workspace !== null
    },
    'Default workspace not found'
  )

  // Test 8: Verify data integrity
  await runTest(
    'Customer data integrity',
    async () => {
      const customers = await prisma.customer.findMany({
        take: 5,
        include: {
          orders: {
            take: 1,
          },
        },
      })

      // Check if customers have required fields
      for (const customer of customers) {
        if (!customer.email || !customer.name) {
          console.log(`   ⚠️  Customer ${customer.id} missing required fields`)
          return false
        }
      }

      console.log(`   Checked ${customers.length} customers - all have required fields`)
      return true
    },
    'Customer data integrity check failed'
  )

  // Test 9: Check migration audit
  await runTest(
    'Migration audit exists',
    async () => {
      const result = await prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count
        FROM migration_audit
        WHERE migration_name IN ('separate_users_customers', 'seed_admin_users')
      `
      const auditCount = result[0]?.count || 0
      console.log(`   Found ${auditCount} audit records`)
      return auditCount > 0
    },
    'Migration audit records not found'
  )

  // Test 10: Verify analytics queries still work
  await runTest(
    'Analytics queries work with new schema',
    async () => {
      const recentOrders = await prisma.order.findMany({
        take: 5,
        include: {
          customer: true,
          orderItems: true,
        },
      })

      console.log(`   Successfully queried ${recentOrders.length} orders with customer data`)
      return true
    },
    'Analytics queries failed with new schema'
  )
}

async function printResults() {
  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Results Summary')
  console.log('='.repeat(50) + '\n')

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  results.forEach(result => {
    console.log(`${result.message} - ${result.test}`)
  })

  console.log('\n' + '='.repeat(50))
  console.log(`Total Tests: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('='.repeat(50))

  if (failed > 0) {
    console.log('\n⚠️  Migration validation failed!')
    console.log('Please review the failed tests above.')
    return false
  } else {
    console.log('\n🎉 All tests passed! Migration validated successfully.')
    return true
  }
}

async function main() {
  console.log('========================================')
  console.log('Migration Validation Test')
  console.log('========================================\n')

  try {
    await validateSchema()
    const success = await printResults()

    if (!success) {
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Fatal error during validation:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the validation
main().catch(error => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})
