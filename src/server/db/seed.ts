import bcrypt from 'bcryptjs'

import { db } from '@/server/db'

async function main() {
  // console.log('🌱 Starting database seed...')

  try {
    // Check if data already exists
    const existingUser = await db.user.findUnique({
      where: { email: 'test@example.com' },
    })

    if (existingUser) {
      // console.log('⚠️  Test data already exists. Cleaning up...')

      // Delete existing test data in correct order due to foreign key constraints
      await db.invitation.deleteMany({
        where: { invitedById: existingUser.id },
      })

      await db.workspaceMember.deleteMany({
        where: { userId: existingUser.id },
      })

      await db.profile.deleteMany({
        where: { userId: existingUser.id },
      })

      await db.session.deleteMany({
        where: { userId: existingUser.id },
      })

      // Delete workspaces where this user is the only member
      const workspacesToDelete = await db.workspace.findMany({
        where: {
          members: {
            every: { userId: existingUser.id },
          },
        },
      })

      for (const workspace of workspacesToDelete) {
        await db.workspace.delete({
          where: { id: workspace.id },
        })
      }

      await db.user.delete({
        where: { id: existingUser.id },
      })

      // console.log('✅ Cleaned up existing test data')
    }

    // Also clean up any workspaces with our test slugs
    await db.workspace.deleteMany({
      where: {
        OR: [{ slug: 'test-workspace' }, { slug: 'secondary-workspace' }],
      },
    })

    // Create a test user
    await bcrypt.hash('password123', 10)

    const testUser = await db.user.create({
      data: {
        email: 'test@example.com',
        fullName: 'Test User',
        emailVerified: true,
        locale: 'en',
        timezone: 'UTC',
      },
    })

    // console.log('✅ Created test user:', testUser.email)

    // Create a profile for the test user
    await db.profile.create({
      data: {
        userId: testUser.id,
        bio: 'This is a test user profile',
        company: 'Test Company',
        jobTitle: 'Software Developer',
        website: 'https://example.com',
      },
    })

    // console.log('✅ Created user profile')

    // Create a test workspace
    const workspace = await db.workspace.create({
      data: {
        name: 'Test Workspace',
        slug: 'test-workspace',
        settings: {
          theme: 'light',
          notifications: true,
        },
      },
    })

    // console.log('✅ Created test workspace:', workspace.name)

    // Add the user as owner of the workspace
    await db.workspaceMember.create({
      data: {
        userId: testUser.id,
        workspaceId: workspace.id,
        role: 'owner',
      },
    })

    // console.log('✅ Added user as workspace owner')

    // Update user's active workspace
    await db.user.update({
      where: { id: testUser.id },
      data: { activeWorkspaceId: workspace.id },
    })

    // console.log('✅ Set active workspace for user')

    // Create a second workspace
    const secondWorkspace = await db.workspace.create({
      data: {
        name: 'Secondary Workspace',
        slug: 'secondary-workspace',
        settings: {
          theme: 'dark',
          notifications: false,
        },
      },
    })

    // Add user as member to second workspace
    await db.workspaceMember.create({
      data: {
        userId: testUser.id,
        workspaceId: secondWorkspace.id,
        role: 'member',
      },
    })

    // console.log('✅ Created secondary workspace and added user as member')

    // Create an invitation
    await db.invitation.create({
      data: {
        workspaceId: workspace.id,
        email: 'invited@example.com',
        role: 'member',
        invitedById: testUser.id,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    })

    // console.log('✅ Created workspace invitation')

    // console.log('\n🎉 Database seeding completed successfully!')
    // console.log('\n📝 Test credentials:')
    // console.log('   Email: test@example.com')
    // console.log('   Password: password123')
    // console.log(`   Workspace: ${workspace.name} (${workspace.slug})`)
  } catch (error) {
    // console.error('❌ Error seeding database:', error)
    throw error
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    void db.$disconnect()
  })
