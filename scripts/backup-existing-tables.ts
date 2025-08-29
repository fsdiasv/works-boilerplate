/**
 * Backup Script for Existing Tables Only
 * This script backs up only the tables that exist in the current database
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function backupDatabase() {
  console.log('🔄 Starting database backup (existing tables only)...')

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(process.cwd(), 'backups')

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const backupFile = path.join(backupDir, `backup_${timestamp}.json`)

  try {
    console.log('📊 Fetching data from database...')

    const backup: any = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        tables: {},
      },
      data: {},
    }

    // Try to backup each table, skip if it doesn't exist
    const tables = [
      { name: 'users', fetch: () => prisma.user.findMany() },
      { name: 'orders', fetch: () => prisma.order.findMany() },
      { name: 'orderItems', fetch: () => prisma.orderItem.findMany() },
      { name: 'products', fetch: () => prisma.product.findMany() },
      { name: 'productVersions', fetch: () => prisma.productLanguageVersion.findMany() },
      { name: 'payments', fetch: () => prisma.payment.findMany() },
      { name: 'subscriptions', fetch: () => prisma.subscription.findMany() },
      { name: 'disputes', fetch: () => prisma.dispute.findMany() },
      { name: 'refunds', fetch: () => prisma.refund.findMany() },
      { name: 'funnels', fetch: () => prisma.funnel.findMany() },
    ]

    for (const table of tables) {
      try {
        console.log(`  📁 Backing up ${table.name}...`)
        const data = await table.fetch()
        backup.data[table.name] = data
        backup.metadata.tables[table.name] = data.length
        console.log(`     ✅ ${data.length} records`)
      } catch (error: any) {
        if (error.code === 'P2021' || error.code === 'P2022') {
          console.log(`     ⚠️  Table ${table.name} does not exist, skipping...`)
        } else {
          console.log(`     ❌ Error backing up ${table.name}: ${error.message}`)
        }
      }
    }

    // Try workspace-related tables (may not exist)
    const workspaceTables = [
      { name: 'workspaces', fetch: () => prisma.workspace.findMany() },
      { name: 'workspaceMembers', fetch: () => prisma.workspaceMember.findMany() },
      { name: 'profiles', fetch: () => prisma.profile.findMany() },
      { name: 'sessions', fetch: () => prisma.session.findMany() },
      { name: 'invitations', fetch: () => prisma.invitation.findMany() },
    ]

    console.log('\n📂 Checking workspace tables...')
    for (const table of workspaceTables) {
      try {
        console.log(`  📁 Checking ${table.name}...`)
        const data = await table.fetch()
        backup.data[table.name] = data
        backup.metadata.tables[table.name] = data.length
        console.log(`     ✅ ${data.length} records`)
      } catch (error: any) {
        console.log(`     ⚠️  Table ${table.name} does not exist or is empty`)
      }
    }

    // Write backup to file (with BigInt support)
    console.log(`\n💾 Writing backup to ${backupFile}...`)
    fs.writeFileSync(
      backupFile,
      JSON.stringify(
        backup,
        (key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      )
    )

    // Create a summary file
    const summaryFile = path.join(backupDir, `backup_${timestamp}_summary.txt`)
    const summary = `
Database Backup Summary
=======================
Date: ${new Date().toISOString()}
File: ${backupFile}

Table Record Counts:
-------------------
${Object.entries(backup.metadata.tables)
  .map(([name, count]) => `${name}: ${count}`)
  .join('\n')}

Total Records: ${Object.values(backup.metadata.tables).reduce((a: any, b: any) => a + b, 0)}
File Size: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB

⚠️  IMPORTANT: This backup was created BEFORE the users/customers migration.
The 'users' table contains mixed customer and user data.
`

    fs.writeFileSync(summaryFile, summary)

    console.log('✅ Backup completed successfully!')
    console.log(`📁 Backup file: ${backupFile}`)
    console.log(`📄 Summary file: ${summaryFile}`)
    console.log('\nBackup Summary:')
    console.log(summary)

    return backupFile
  } catch (error) {
    console.error('❌ Backup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Main execution
async function main() {
  await backupDatabase()
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
