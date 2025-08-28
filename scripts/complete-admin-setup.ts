import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function completeAdminSetup() {
  console.log('🔧 Completing admin user setup...\n')

  try {
    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'felipe@digitalsalesclub.com' },
    })

    if (!adminUser) {
      console.log('❌ Admin user not found. Creating...')

      // Create admin user
      const newUser = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: 'felipe@digitalsalesclub.com',
          fullName: 'Felipe Admin',
          locale: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          emailVerified: true,
          metadata: {
            role: 'admin',
            createdBy: 'migration_script',
          },
        },
      })

      console.log(`✅ Created admin user: ${newUser.email}`)
    } else {
      console.log(`✅ Admin user found: ${adminUser.email}`)
    }

    // Get the user again (in case we just created it)
    const user = await prisma.user.findUnique({
      where: { email: 'felipe@digitalsalesclub.com' },
    })

    if (!user) {
      throw new Error('Failed to create or find user')
    }

    // Find default workspace
    const workspace = await prisma.workspace.findFirst({
      where: { slug: 'default' },
    })

    if (!workspace) {
      throw new Error('Default workspace not found')
    }

    console.log(`✅ Found workspace: ${workspace.name}`)

    // Check if membership already exists
    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspace.id,
        },
      },
    })

    if (!existingMembership) {
      // Create workspace membership
      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: 'owner',
        },
      })
      console.log(`✅ Added ${user.email} as owner of ${workspace.name}`)
    } else {
      console.log(
        `✅ Membership already exists: ${user.email} is ${existingMembership.role} of ${workspace.name}`
      )
    }

    // Update user's active workspace
    await prisma.user.update({
      where: { id: user.id },
      data: { activeWorkspaceId: workspace.id },
    })
    console.log(`✅ Set active workspace for ${user.email}`)

    // Create profile if it doesn't exist
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
    })

    if (!existingProfile) {
      await prisma.profile.create({
        data: {
          userId: user.id,
          company: 'Digital Sales Club',
          jobTitle: 'Administrator',
        },
      })
      console.log(`✅ Created profile for ${user.email}`)
    } else {
      console.log(`✅ Profile already exists for ${user.email}`)
    }

    // Check if user has a corresponding customer record
    const customer = await prisma.customer.findUnique({
      where: { email: user.email },
    })

    if (customer) {
      // Check if mapping exists
      const existingMapping = await prisma.userCustomerMapping.findUnique({
        where: {
          userId_customerId: {
            userId: user.id,
            customerId: customer.id,
          },
        },
      })

      if (!existingMapping) {
        await prisma.userCustomerMapping.create({
          data: {
            userId: user.id,
            customerId: customer.id,
          },
        })
        console.log(`✅ Linked user to existing customer data`)
      } else {
        console.log(`✅ User-customer mapping already exists`)
      }
    } else {
      console.log(`ℹ️  No customer record found for ${user.email}`)
    }

    // Final summary
    console.log('\n📊 Setup Complete:')
    console.log('==================')

    const finalUser = await prisma.user.findUnique({
      where: { email: 'felipe@digitalsalesclub.com' },
      include: {
        profile: true,
        workspaceMemberships: {
          include: {
            workspace: true,
          },
        },
        customerMappings: {
          include: {
            customer: true,
          },
        },
      },
    })

    if (finalUser) {
      console.log(`User: ${finalUser.email}`)
      console.log(`Name: ${finalUser.fullName}`)
      console.log(`Profile: ${finalUser.profile ? 'Created' : 'Missing'}`)
      console.log(
        `Workspaces: ${finalUser.workspaceMemberships.map(m => `${m.workspace.name} (${m.role})`).join(', ')}`
      )
      console.log(
        `Customer Data: ${finalUser.customerMappings.length > 0 ? 'Linked' : 'Not linked'}`
      )
    }

    console.log('\n✅ Admin setup completed successfully!')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

completeAdminSetup().catch(console.error)
