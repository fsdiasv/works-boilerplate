/**
 * Seed Admin Users Script
 *
 * This script populates the users table with initial admin users
 * and creates mappings to their customer data if they exist.
 *
 * Run after the schema migration is complete.
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Define admin users to create
const ADMIN_USERS = [
  {
    email: 'felipe@digitalsalesclub.com',
    fullName: 'Felipe Admin',
    locale: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    emailVerified: true,
  },
  // Add more admin users here as needed
]

async function seedAdminUsers() {
  console.log('🚀 Starting admin user seeding...')

  try {
    // Create a default workspace if it doesn't exist
    let defaultWorkspace = await prisma.workspace.findFirst({
      where: { slug: 'default' },
    })

    if (!defaultWorkspace) {
      defaultWorkspace = await prisma.workspace.create({
        data: {
          name: 'Default Workspace',
          slug: 'default',
          settings: {},
        },
      })
      console.log('✅ Created default workspace')
    }

    // Process each admin user
    for (const adminData of ADMIN_USERS) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: adminData.email },
      })

      if (existingUser) {
        console.log(`⚠️  User ${adminData.email} already exists, skipping...`)
        continue
      }

      // Create the admin user
      const newUser = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: adminData.email,
          fullName: adminData.fullName,
          locale: adminData.locale,
          timezone: adminData.timezone,
          emailVerified: adminData.emailVerified,
          activeWorkspaceId: defaultWorkspace.id,
          metadata: {
            role: 'admin',
            createdBy: 'migration_script',
          },
        },
      })

      console.log(`✅ Created admin user: ${adminData.email}`)

      // Create workspace membership
      await prisma.workspaceMember.create({
        data: {
          userId: newUser.id,
          workspaceId: defaultWorkspace.id,
          role: 'owner',
        },
      })

      console.log(`✅ Added ${adminData.email} as owner of default workspace`)

      // Check if there's a customer with the same email
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: adminData.email },
      })

      if (existingCustomer) {
        // Create mapping between user and customer
        await prisma.userCustomerMapping.create({
          data: {
            userId: newUser.id,
            customerId: existingCustomer.id,
          },
        })
        console.log(`✅ Linked user ${adminData.email} to existing customer data`)
      }

      // Create a profile for the user
      await prisma.profile.create({
        data: {
          userId: newUser.id,
          company: 'Admin',
          jobTitle: 'System Administrator',
        },
      })
    }

    // Audit the migration
    await prisma.$executeRaw`
      INSERT INTO migration_audit (migration_name, action, table_name, record_count, details)
      VALUES (
        'seed_admin_users',
        'data_migration',
        'users',
        ${ADMIN_USERS.length},
        ${JSON.stringify({
          admin_users_created: ADMIN_USERS.map(u => u.email),
          workspace_created: defaultWorkspace.name,
        })}::jsonb
      )
    `

    console.log('✅ Admin user seeding completed successfully!')

    // Display summary
    const userCount = await prisma.user.count()
    const customerCount = await prisma.customer.count()
    const mappingCount = await prisma.userCustomerMapping.count()

    console.log('\n📊 Migration Summary:')
    console.log(`   Total Users: ${userCount}`)
    console.log(`   Total Customers: ${customerCount}`)
    console.log(`   User-Customer Mappings: ${mappingCount}`)
  } catch (error) {
    console.error('❌ Error seeding admin users:', error)
    throw error
  }
}

// Function to migrate existing workspace-related data
async function migrateExistingWorkspaceUsers() {
  console.log('\n🔄 Checking for existing workspace relationships...')

  try {
    // Check if there are orphaned workspace members (from old schema)
    const orphanedMembers = await prisma.$queryRaw<Array<{ workspace_id: string; count: number }>>`
      SELECT workspace_id, COUNT(*) as count 
      FROM workspace_members 
      WHERE user_id NOT IN (SELECT id FROM users)
      GROUP BY workspace_id
    `

    if (orphanedMembers && orphanedMembers.length > 0) {
      console.log('⚠️  Found orphaned workspace members. These will need manual review.')
      console.log('   Orphaned members by workspace:', orphanedMembers)
    }

    // Check for orphaned profiles
    const orphanedProfiles = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count 
      FROM profiles 
      WHERE user_id NOT IN (SELECT id FROM users)
    `

    if (
      orphanedProfiles &&
      orphanedProfiles.length > 0 &&
      orphanedProfiles[0] &&
      orphanedProfiles[0].count > 0
    ) {
      console.log(
        `⚠️  Found ${orphanedProfiles[0].count} orphaned profiles. These will need manual review.`
      )
    }

    // Check for orphaned sessions
    const orphanedSessions = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count 
      FROM sessions 
      WHERE user_id NOT IN (SELECT id FROM users)
    `

    if (
      orphanedSessions &&
      orphanedSessions.length > 0 &&
      orphanedSessions[0] &&
      orphanedSessions[0].count > 0
    ) {
      console.log(
        `⚠️  Found ${orphanedSessions[0].count} orphaned sessions. These should be cleaned up.`
      )

      // Clean up orphaned sessions
      await prisma.$executeRaw`
        DELETE FROM sessions 
        WHERE user_id NOT IN (SELECT id FROM users)
      `
      console.log('✅ Cleaned up orphaned sessions')
    }
  } catch (error) {
    console.error('⚠️  Error checking workspace relationships:', error)
    // Non-critical error, continue
  }
}

async function main() {
  try {
    await seedAdminUsers()
    await migrateExistingWorkspaceUsers()
    console.log('\n✅ All migration tasks completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
