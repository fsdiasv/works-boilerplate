import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runMigration() {
  console.log('🚀 Starting multi-tenancy migration...\n')
  
  const steps = []
  
  try {
    // Step 1: Check current users.id type
    console.log('📊 Checking current users.id type...')
    const currentType = await prisma.$queryRaw<Array<{data_type: string}>>`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
    `
    console.log(`Current type: ${currentType[0]?.data_type}`)
    steps.push('Checked users.id type')
    
    // Step 2: Drop foreign key constraints
    console.log('\n🔧 Dropping foreign key constraints...')
    const constraints = await prisma.$queryRaw<Array<{table_name: string, constraint_name: string}>>`
      SELECT DISTINCT
        tc.table_name, 
        tc.constraint_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND ccu.table_name = 'users'
      AND ccu.column_name = 'id'
    `
    
    for (const c of constraints) {
      await prisma.$executeRawUnsafe(`ALTER TABLE ${c.table_name} DROP CONSTRAINT IF EXISTS ${c.constraint_name}`)
      console.log(`  Dropped: ${c.constraint_name} from ${c.table_name}`)
    }
    steps.push(`Dropped ${constraints.length} foreign key constraints`)
    
    // Step 3: Convert users.id to TEXT if needed
    if (currentType[0]?.data_type === 'bigint') {
      console.log('\n🔄 Converting users.id from BIGINT to TEXT...')
      
      // Drop primary key
      await prisma.$executeRawUnsafe(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey`)
      
      // Alter column type
      await prisma.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN id TYPE TEXT USING id::TEXT`)
      
      // Re-add primary key
      await prisma.$executeRawUnsafe(`ALTER TABLE users ADD PRIMARY KEY (id)`)
      
      console.log('  ✅ Converted users.id to TEXT')
      steps.push('Converted users.id to TEXT')
    } else {
      console.log('\n✅ users.id is already TEXT type')
      steps.push('users.id already TEXT')
    }
    
    // Step 4: Update user_customer_mappings.user_id if needed
    const ucmType = await prisma.$queryRaw<Array<{data_type: string}>>`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_customer_mappings' AND column_name = 'user_id'
    `
    
    if (ucmType[0]?.data_type === 'bigint') {
      console.log('\n🔄 Converting user_customer_mappings.user_id to TEXT...')
      await prisma.$executeRawUnsafe(`ALTER TABLE user_customer_mappings ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`)
      await prisma.$executeRawUnsafe(`ALTER TABLE user_customer_mappings ADD CONSTRAINT user_customer_mappings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`)
      console.log('  ✅ Converted')
      steps.push('Converted user_customer_mappings.user_id to TEXT')
    }
    
    // Step 5: Update active_workspace_id if exists
    const awsIdColumns = await prisma.$queryRaw<Array<{column_name: string, data_type: string}>>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'active_workspace_id'
    `
    
    if (awsIdColumns.length > 0 && awsIdColumns[0].data_type !== 'text' && awsIdColumns[0].data_type !== 'character varying') {
      console.log('\n🔄 Converting users.active_workspace_id to TEXT...')
      await prisma.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN active_workspace_id TYPE TEXT USING active_workspace_id::TEXT`)
      console.log('  ✅ Converted')
      steps.push('Converted users.active_workspace_id to TEXT')
    }
    
    // Step 6: Create WorkspaceRole enum
    console.log('\n🎨 Creating WorkspaceRole enum...')
    const enumExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
      SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspacerole')
    `
    
    if (!enumExists[0]?.exists) {
      await prisma.$executeRawUnsafe(`CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'admin', 'member')`)
      console.log('  ✅ Created WorkspaceRole enum')
      steps.push('Created WorkspaceRole enum')
    } else {
      console.log('  ✅ WorkspaceRole enum already exists')
      steps.push('WorkspaceRole enum already exists')
    }
    
    // Step 7: Create sessions table
    console.log('\n📋 Creating sessions table...')
    const sessionsExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions')
    `
    
    if (!sessionsExists[0]?.exists) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_active_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)
      await prisma.$executeRawUnsafe(`CREATE INDEX idx_sessions_user_id ON sessions(user_id)`)
      await prisma.$executeRawUnsafe(`CREATE INDEX idx_sessions_token ON sessions(token)`)
      console.log('  ✅ Created sessions table')
      steps.push('Created sessions table')
    } else {
      // Check if user_id needs conversion
      const sessionUserIdType = await prisma.$queryRaw<Array<{data_type: string}>>`
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'user_id'
      `
      if (sessionUserIdType[0]?.data_type === 'bigint') {
        await prisma.$executeRawUnsafe(`ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey`)
        await prisma.$executeRawUnsafe(`ALTER TABLE sessions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`)
        await prisma.$executeRawUnsafe(`ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`)
        console.log('  ✅ Updated sessions.user_id to TEXT')
        steps.push('Updated sessions.user_id to TEXT')
      } else {
        console.log('  ✅ Sessions table already exists')
        steps.push('Sessions table already exists')
      }
    }
    
    // Step 8: Create profiles table
    console.log('\n👤 Creating profiles table...')
    const profilesExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
    `
    
    if (!profilesExists[0]?.exists) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          bio TEXT,
          website TEXT,
          company TEXT,
          job_title TEXT,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)
      await prisma.$executeRawUnsafe(`CREATE INDEX idx_profiles_user_id ON profiles(user_id)`)
      console.log('  ✅ Created profiles table')
      steps.push('Created profiles table')
    } else {
      // Check if user_id needs conversion
      const profileUserIdType = await prisma.$queryRaw<Array<{data_type: string}>>`
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'user_id'
      `
      if (profileUserIdType[0]?.data_type === 'bigint') {
        await prisma.$executeRawUnsafe(`ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey`)
        await prisma.$executeRawUnsafe(`ALTER TABLE profiles ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`)
        await prisma.$executeRawUnsafe(`ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`)
        console.log('  ✅ Updated profiles.user_id to TEXT')
        steps.push('Updated profiles.user_id to TEXT')
      } else {
        console.log('  ✅ Profiles table already exists')
        steps.push('Profiles table already exists')
      }
    }
    
    // Step 9: Create workspaces table
    console.log('\n🏢 Creating workspaces table...')
    const workspacesExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaces')
    `
    
    if (!workspacesExists[0]?.exists) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE workspaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
          slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) >= 3 AND char_length(slug) <= 50),
          logo TEXT,
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP WITHOUT TIME ZONE
        )
      `)
      await prisma.$executeRawUnsafe(`CREATE INDEX idx_workspaces_slug ON workspaces(slug)`)
      console.log('  ✅ Created workspaces table')
      steps.push('Created workspaces table')
    } else {
      console.log('  ✅ Workspaces table already exists')
      steps.push('Workspaces table already exists')
    }
    
    // Step 10: Create workspace_members table
    console.log('\n👥 Creating workspace_members table...')
    const membersExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspace_members')
    `
    
    if (!membersExists[0]?.exists) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE workspace_members (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          role "WorkspaceRole" NOT NULL,
          joined_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, workspace_id)
        )
      `)
      await prisma.$executeRawUnsafe(`CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id)`)
      await prisma.$executeRawUnsafe(`CREATE INDEX idx_workspace_members_user ON workspace_members(user_id)`)
      console.log('  ✅ Created workspace_members table')
      steps.push('Created workspace_members table')
    } else {
      // Check if user_id needs conversion
      const memberUserIdType = await prisma.$queryRaw<Array<{data_type: string}>>`
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'workspace_members' AND column_name = 'user_id'
      `
      if (memberUserIdType[0]?.data_type === 'bigint') {
        await prisma.$executeRawUnsafe(`ALTER TABLE workspace_members DROP CONSTRAINT IF EXISTS workspace_members_pkey`)
        await prisma.$executeRawUnsafe(`ALTER TABLE workspace_members DROP CONSTRAINT IF EXISTS workspace_members_user_id_fkey`)
        await prisma.$executeRawUnsafe(`ALTER TABLE workspace_members ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`)
        await prisma.$executeRawUnsafe(`ALTER TABLE workspace_members ADD PRIMARY KEY (user_id, workspace_id)`)
        await prisma.$executeRawUnsafe(`ALTER TABLE workspace_members ADD CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`)
        console.log('  ✅ Updated workspace_members.user_id to TEXT')
        steps.push('Updated workspace_members.user_id to TEXT')
      } else {
        console.log('  ✅ Workspace_members table already exists')
        steps.push('Workspace_members table already exists')
      }
    }
    
    // Step 11: Create invitations table
    console.log('\n📧 Creating invitations table...')
    const invitationsExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations')
    `
    
    if (!invitationsExists[0]?.exists) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE invitations (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          role "WorkspaceRole" NOT NULL,
          invited_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
          accepted_at TIMESTAMP WITHOUT TIME ZONE,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)
      await prisma.$executeRawUnsafe(`CREATE INDEX idx_invitations_token ON invitations(token)`)
      await prisma.$executeRawUnsafe(`CREATE INDEX idx_invitations_email ON invitations(email)`)
      await prisma.$executeRawUnsafe(`CREATE INDEX idx_invitations_workspace ON invitations(workspace_id)`)
      console.log('  ✅ Created invitations table')
      steps.push('Created invitations table')
    } else {
      // Check if invited_by_id needs conversion
      const inviteUserIdType = await prisma.$queryRaw<Array<{data_type: string}>>`
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'invitations' AND column_name = 'invited_by_id'
      `
      if (inviteUserIdType[0]?.data_type === 'bigint') {
        await prisma.$executeRawUnsafe(`ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_invited_by_id_fkey`)
        await prisma.$executeRawUnsafe(`ALTER TABLE invitations ALTER COLUMN invited_by_id TYPE TEXT USING invited_by_id::TEXT`)
        await prisma.$executeRawUnsafe(`ALTER TABLE invitations ADD CONSTRAINT invitations_invited_by_id_fkey FOREIGN KEY (invited_by_id) REFERENCES users(id) ON DELETE CASCADE`)
        console.log('  ✅ Updated invitations.invited_by_id to TEXT')
        steps.push('Updated invitations.invited_by_id to TEXT')
      } else {
        console.log('  ✅ Invitations table already exists')
        steps.push('Invitations table already exists')
      }
    }
    
    // Step 12: Add foreign key for users.active_workspace_id if not exists
    console.log('\n🔗 Adding foreign key for users.active_workspace_id...')
    const fkExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name = 'users_active_workspace_id_fkey'
      )
    `
    
    if (!fkExists[0]?.exists) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE users 
        ADD CONSTRAINT users_active_workspace_id_fkey 
        FOREIGN KEY (active_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
      `)
      console.log('  ✅ Added foreign key')
      steps.push('Added foreign key for users.active_workspace_id')
    } else {
      console.log('  ✅ Foreign key already exists')
      steps.push('Foreign key already exists')
    }
    
    // Step 13: Create updated_at trigger function
    console.log('\n⚙️ Creating updated_at trigger function...')
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `)
    console.log('  ✅ Created/Updated trigger function')
    steps.push('Created/Updated trigger function')
    
    // Step 14: Add triggers
    console.log('\n🔔 Adding updated_at triggers...')
    
    // Profiles trigger
    const profileTriggerExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_profiles_updated_at'
      )
    `
    if (!profileTriggerExists[0]?.exists) {
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER update_profiles_updated_at 
        BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `)
      console.log('  ✅ Added profiles trigger')
    }
    
    // Workspaces trigger
    const workspaceTriggerExists = await prisma.$queryRaw<Array<{exists: boolean}>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_workspaces_updated_at'
      )
    `
    if (!workspaceTriggerExists[0]?.exists) {
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER update_workspaces_updated_at 
        BEFORE UPDATE ON workspaces
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `)
      console.log('  ✅ Added workspaces trigger')
    }
    
    steps.push('Added updated_at triggers')
    
    // Step 15: Log migration
    console.log('\n📝 Logging migration...')
    await prisma.$executeRawUnsafe(`
      INSERT INTO migration_audit (migration_name, action, details)
      VALUES (
        'create_multitenancy_tables',
        'migration_complete',
        $1::jsonb
      )
    `, JSON.stringify({
      users_id_converted: true,
      sessions_table_created: true,
      profiles_table_created: true,
      workspaces_table_created: true,
      workspace_members_table_created: true,
      invitations_table_created: true,
      steps: steps
    }))
    
    // Final verification
    console.log('\n✅ Migration completed successfully!')
    console.log('\n📊 Final verification:')
    
    const finalType = await prisma.$queryRaw<Array<{data_type: string}>>`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
    `
    console.log(`  - users.id type: ${finalType[0]?.data_type}`)
    
    const tables = await prisma.$queryRaw<Array<{table_name: string}>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sessions', 'profiles', 'workspaces', 'workspace_members', 'invitations')
      ORDER BY table_name
    `
    console.log('  - Multi-tenancy tables:')
    tables.forEach(t => console.log(`    ✓ ${t.table_name}`))
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\nSteps completed:', steps)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

runMigration().catch(console.error)