import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMigration() {
  console.log('🔍 Verificando status da migração...\n')

  try {
    // Check if customers table exists and has data
    try {
      const customerCount = await prisma.$queryRaw<
        [{ count: bigint }]
      >`SELECT COUNT(*) as count FROM customers`
      console.log(`✅ Tabela 'customers' existe com ${customerCount[0].count} registros`)
    } catch (error: any) {
      console.log(`❌ Tabela 'customers' não encontrada: ${error.message}`)
    }

    // Check if users table exists
    try {
      const userCount = await prisma.$queryRaw<
        [{ count: bigint }]
      >`SELECT COUNT(*) as count FROM users`
      console.log(`✅ Tabela 'users' existe com ${userCount[0].count} registros`)
    } catch (error: any) {
      console.log(`❌ Tabela 'users' não encontrada: ${error.message}`)
    }

    // Check if user_customer_mappings exists
    try {
      const mappingCount = await prisma.$queryRaw<
        [{ count: bigint }]
      >`SELECT COUNT(*) as count FROM user_customer_mappings`
      console.log(
        `✅ Tabela 'user_customer_mappings' existe com ${mappingCount[0].count} registros`
      )
    } catch (error: any) {
      console.log(`❌ Tabela 'user_customer_mappings' não encontrada: ${error.message}`)
    }

    // Check if customer_id column exists in orders
    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name IN ('customer_id', 'user_id')
        ORDER BY column_name
      `
      console.log(`\n📋 Colunas na tabela 'orders': ${result.map(r => r.column_name).join(', ')}`)
    } catch (error: any) {
      console.log(`❌ Erro ao verificar colunas: ${error.message}`)
    }

    // Check migration audit
    try {
      const audit = await prisma.$queryRaw<any[]>`
        SELECT * FROM migration_audit 
        WHERE migration_name = 'separate_users_customers'
      `
      if (audit.length > 0) {
        console.log(`\n✅ Registro de auditoria encontrado:`)
        console.log(`   - Ação: ${audit[0].action}`)
        console.log(`   - Executado em: ${audit[0].executed_at}`)
      } else {
        console.log(`\n⚠️  Nenhum registro de auditoria encontrado`)
      }
    } catch (error: any) {
      console.log(`\n⚠️  Tabela migration_audit não existe`)
    }
  } catch (error) {
    console.error('❌ Erro ao verificar migração:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMigration()
