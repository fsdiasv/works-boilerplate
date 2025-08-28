/**
 * Database Backup Script
 * Creates a JSON backup of all important tables
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function backupDatabase() {
  console.log('🔄 Starting database backup...')

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(process.cwd(), 'backups')

  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const backupFile = path.join(backupDir, `backup_${timestamp}.json`)

  try {
    console.log('📊 Fetching data from database...')

    // Fetch all data from important tables
    const [
      users,
      orders,
      orderItems,
      products,
      productVersions,
      payments,
      subscriptions,
      disputes,
      refunds,
      workspaces,
      workspaceMembers,
      profiles,
      sessions,
      invitations,
      funnels,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.order.findMany(),
      prisma.orderItem.findMany(),
      prisma.product.findMany(),
      prisma.productLanguageVersion.findMany(),
      prisma.payment.findMany(),
      prisma.subscription.findMany(),
      prisma.dispute.findMany(),
      prisma.refund.findMany(),
      prisma.workspace.findMany(),
      prisma.workspaceMember.findMany(),
      prisma.profile.findMany(),
      prisma.session.findMany(),
      prisma.invitation.findMany(),
      prisma.funnel.findMany(),
    ])

    // Create backup object
    const backup = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        tables: {
          users: users.length,
          orders: orders.length,
          orderItems: orderItems.length,
          products: products.length,
          productVersions: productVersions.length,
          payments: payments.length,
          subscriptions: subscriptions.length,
          disputes: disputes.length,
          refunds: refunds.length,
          workspaces: workspaces.length,
          workspaceMembers: workspaceMembers.length,
          profiles: profiles.length,
          sessions: sessions.length,
          invitations: invitations.length,
          funnels: funnels.length,
        },
      },
      data: {
        users,
        orders,
        orderItems,
        products,
        productVersions,
        payments,
        subscriptions,
        disputes,
        refunds,
        workspaces,
        workspaceMembers,
        profiles,
        sessions,
        invitations,
        funnels,
      },
    }

    // Write backup to file
    console.log(`💾 Writing backup to ${backupFile}...`)
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2))

    // Create a summary file
    const summaryFile = path.join(backupDir, `backup_${timestamp}_summary.txt`)
    const summary = `
Database Backup Summary
=======================
Date: ${new Date().toISOString()}
File: ${backupFile}

Table Record Counts:
-------------------
Users: ${users.length}
Orders: ${orders.length}
Order Items: ${orderItems.length}
Products: ${products.length}
Product Versions: ${productVersions.length}
Payments: ${payments.length}
Subscriptions: ${subscriptions.length}
Disputes: ${disputes.length}
Refunds: ${refunds.length}
Workspaces: ${workspaces.length}
Workspace Members: ${workspaceMembers.length}
Profiles: ${profiles.length}
Sessions: ${sessions.length}
Invitations: ${invitations.length}
Funnels: ${funnels.length}

Total Records: ${Object.values(backup.metadata.tables).reduce((a, b) => a + b, 0)}
File Size: ${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB
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

// Script to restore from backup
async function restoreDatabase(backupFile: string) {
  console.log('⚠️  WARNING: This will REPLACE all data in the database!')
  console.log('Press Ctrl+C to cancel...')

  // Wait 5 seconds for user to cancel
  await new Promise(resolve => setTimeout(resolve, 5000))

  console.log('🔄 Starting database restore...')

  try {
    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'))

    console.log(`📊 Restoring from backup created at ${backupData.metadata.timestamp}`)

    // DANGER: Clear existing data (in reverse order of dependencies)
    await prisma.$transaction([
      prisma.invitation.deleteMany(),
      prisma.session.deleteMany(),
      prisma.profile.deleteMany(),
      prisma.workspaceMember.deleteMany(),
      prisma.workspace.deleteMany(),
      prisma.refund.deleteMany(),
      prisma.dispute.deleteMany(),
      prisma.subscription.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.orderItem.deleteMany(),
      prisma.order.deleteMany(),
      prisma.funnel.deleteMany(),
      prisma.productLanguageVersion.deleteMany(),
      prisma.product.deleteMany(),
      prisma.user.deleteMany(),
    ])

    console.log('🗑️  Existing data cleared')

    // Restore data (in order of dependencies)
    await prisma.user.createMany({ data: backupData.data.users })
    console.log(`✅ Restored ${backupData.data.users.length} users`)

    await prisma.product.createMany({ data: backupData.data.products })
    console.log(`✅ Restored ${backupData.data.products.length} products`)

    await prisma.productLanguageVersion.createMany({ data: backupData.data.productVersions })
    console.log(`✅ Restored ${backupData.data.productVersions.length} product versions`)

    await prisma.funnel.createMany({ data: backupData.data.funnels })
    console.log(`✅ Restored ${backupData.data.funnels.length} funnels`)

    await prisma.order.createMany({ data: backupData.data.orders })
    console.log(`✅ Restored ${backupData.data.orders.length} orders`)

    await prisma.orderItem.createMany({ data: backupData.data.orderItems })
    console.log(`✅ Restored ${backupData.data.orderItems.length} order items`)

    await prisma.payment.createMany({ data: backupData.data.payments })
    console.log(`✅ Restored ${backupData.data.payments.length} payments`)

    await prisma.subscription.createMany({ data: backupData.data.subscriptions })
    console.log(`✅ Restored ${backupData.data.subscriptions.length} subscriptions`)

    await prisma.dispute.createMany({ data: backupData.data.disputes })
    console.log(`✅ Restored ${backupData.data.disputes.length} disputes`)

    await prisma.refund.createMany({ data: backupData.data.refunds })
    console.log(`✅ Restored ${backupData.data.refunds.length} refunds`)

    await prisma.workspace.createMany({ data: backupData.data.workspaces })
    console.log(`✅ Restored ${backupData.data.workspaces.length} workspaces`)

    await prisma.workspaceMember.createMany({ data: backupData.data.workspaceMembers })
    console.log(`✅ Restored ${backupData.data.workspaceMembers.length} workspace members`)

    await prisma.profile.createMany({ data: backupData.data.profiles })
    console.log(`✅ Restored ${backupData.data.profiles.length} profiles`)

    await prisma.session.createMany({ data: backupData.data.sessions })
    console.log(`✅ Restored ${backupData.data.sessions.length} sessions`)

    await prisma.invitation.createMany({ data: backupData.data.invitations })
    console.log(`✅ Restored ${backupData.data.invitations.length} invitations`)

    console.log('✅ Database restore completed successfully!')
  } catch (error) {
    console.error('❌ Restore failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Main execution
async function main() {
  const command = process.argv[2]

  if (command === 'backup') {
    await backupDatabase()
  } else if (command === 'restore') {
    const backupFile = process.argv[3]
    if (!backupFile) {
      console.error('❌ Please provide backup file path')
      console.log('Usage: tsx scripts/backup-database.ts restore <backup-file>')
      process.exit(1)
    }
    await restoreDatabase(backupFile)
  } else {
    console.log('Database Backup/Restore Tool')
    console.log('============================')
    console.log('Usage:')
    console.log('  Backup:  npx tsx scripts/backup-database.ts backup')
    console.log('  Restore: npx tsx scripts/backup-database.ts restore <backup-file>')
    console.log()
    console.log('Running backup by default...')
    await backupDatabase()
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
