import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyWorkspaceTables() {
  console.log('🔍 Verificando tabelas de workspace...\n')

  try {
    // Check workspaces table
    const workspaceCount = await prisma.$queryRaw<
      [{ count: bigint }]
    >`SELECT COUNT(*) as count FROM workspaces`
    console.log(`✅ Tabela 'workspaces' existe com ${workspaceCount[0].count} registros`)

    // Check workspace_members table
    const membersCount = await prisma.$queryRaw<
      [{ count: bigint }]
    >`SELECT COUNT(*) as count FROM workspace_members`
    console.log(`✅ Tabela 'workspace_members' existe com ${membersCount[0].count} registros`)

    // Check profiles table
    const profilesCount = await prisma.$queryRaw<
      [{ count: bigint }]
    >`SELECT COUNT(*) as count FROM profiles`
    console.log(`✅ Tabela 'profiles' existe com ${profilesCount[0].count} registros`)

    // Check sessions table
    const sessionsCount = await prisma.$queryRaw<
      [{ count: bigint }]
    >`SELECT COUNT(*) as count FROM sessions`
    console.log(`✅ Tabela 'sessions' existe com ${sessionsCount[0].count} registros`)

    // Check invitations table
    const invitationsCount = await prisma.$queryRaw<
      [{ count: bigint }]
    >`SELECT COUNT(*) as count FROM invitations`
    console.log(`✅ Tabela 'invitations' existe com ${invitationsCount[0].count} registros`)

    // Check if default workspace was created
    const defaultWorkspace = await prisma.workspace.findFirst({
      where: { slug: 'default' },
    })

    if (defaultWorkspace) {
      console.log(`\n✅ Workspace padrão encontrado:`)
      console.log(`   ID: ${defaultWorkspace.id}`)
      console.log(`   Nome: ${defaultWorkspace.name}`)
      console.log(`   Slug: ${defaultWorkspace.slug}`)
    } else {
      console.log(`\n⚠️  Workspace padrão não encontrado`)
    }

    console.log('\n✅ Todas as tabelas de workspace foram criadas com sucesso!')
  } catch (error: any) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verifyWorkspaceTables()
