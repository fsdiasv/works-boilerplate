#!/usr/bin/env tsx
import { execSync } from 'child_process'
import { config } from 'dotenv'
import { writeFileSync } from 'fs'

// Load environment variables
config()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

// Parse database URL
const url = new URL(DATABASE_URL)
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
const backupFile = `backup_${timestamp}.sql`

console.log('🔄 Starting database backup...')
console.log(`📁 Backup file: ${backupFile}`)

try {
  // Create pg_dump command with connection parameters
  const command = `docker run --rm -v $(pwd):/backup postgres:15 pg_dump "${DATABASE_URL}" > ${backupFile}`

  // Alternative: Use psql to export schema and data
  console.log('📝 Creating backup using SQL export...')

  // For Supabase, we can use the Supabase CLI or direct SQL
  execSync(
    `npx prisma db execute --file ./scripts/export-schema.sql --schema ./prisma/schema.prisma > ${backupFile}`,
    { stdio: 'inherit' }
  )

  console.log(`✅ Backup completed successfully: ${backupFile}`)
} catch (error) {
  console.error('❌ Backup failed:', error)
  process.exit(1)
}
