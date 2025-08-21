# Supabase + Prisma Setup Guide

This guide explains how to set up Prisma with Supabase for the Works Boilerplate
project.

## Prerequisites

- A Supabase project (create one at [supabase.com](https://supabase.com))
- Node.js and pnpm installed
- Access to your Supabase project dashboard

## Initial Setup

### 1. Create a Dedicated Prisma User (Recommended)

For better security and access control, create a dedicated user for Prisma:

1. Go to your Supabase project's SQL Editor
2. Run the script located at `prisma/sql/setup-prisma-user.sql`
3. **Important**: Replace `'your-secure-password-here'` with a strong, unique
   password
4. Save this password securely - you'll need it for the connection string

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env.local`
2. Get your database credentials from Supabase:
   - Go to Settings → Database
   - Find your project reference, region, and database password

3. Update your `.env.local`:

```env
# For development (Session pooler - port 5432)
DATABASE_URL="postgresql://prisma:[prisma-password]@aws-0-[aws-region].pooler.supabase.com:5432/postgres?schema=public"

# For migrations (Direct connection)
DIRECT_URL="postgresql://postgres:[db-password]@db.[project-ref].supabase.com:5432/postgres?schema=public"

# For production/serverless (Transaction pooler - port 6543)
# DATABASE_URL="postgresql://prisma:[prisma-password]@aws-0-[aws-region].pooler.supabase.com:6543/postgres?schema=public&pgbouncer=true"
```

Replace:

- `[prisma-password]`: The password you set for the prisma user
- `[aws-region]`: Your Supabase project region (e.g., `us-east-1`)
- `[project-ref]`: Your Supabase project reference
- `[db-password]`: Your main database password

### 3. Sync Existing Database (If Applicable)

If you have an existing Supabase database:

```bash
# Pull the current database schema
pnpm db:pull

# Generate Prisma Client
pnpm db:generate
```

### 4. Create Initial Migration

For a new project:

```bash
# Create and apply migration
pnpm db:migrate

# Seed the database (optional)
pnpm db:seed
```

## Connection Pooling

The boilerplate is configured to handle different connection modes:

- **Development**: Uses Session pooler (port 5432) for better developer
  experience
- **Production**: Should use Transaction pooler (port 6543) for serverless
  compatibility
- **Migrations**: Always use the direct connection URL

## Important Considerations

### Row Level Security (RLS)

- Prisma bypasses RLS by default when using a privileged user
- The `prisma` user we created has `BYPASSRLS` permission for migrations
- Your application should still implement proper authorization checks

### Migrations

1. Always test migrations locally first
2. Use `pnpm db:migrate:deploy` for production deployments
3. Consider creating a migration review process for your team

### Performance

- Use connection pooling in production
- Monitor your connection count in Supabase dashboard
- Consider implementing query optimization for heavy operations

## Common Commands

```bash
# Development
pnpm db:push          # Push schema changes (dev only)
pnpm db:migrate       # Create new migration
pnpm db:studio        # Open Prisma Studio

# Production
pnpm db:migrate:deploy # Apply migrations in production

# Utilities
pnpm db:generate      # Regenerate Prisma Client
pnpm db:pull          # Pull schema from database
pnpm db:diff          # Show schema differences
```

## Troubleshooting

### Connection Issues

1. **"Can't reach database server"**
   - Check your connection string format
   - Ensure you're using the correct port (5432 vs 6543)
   - Verify your Supabase project is not paused

2. **"Permission denied"**
   - Ensure the prisma user has proper permissions
   - Re-run the setup script if needed

3. **"Too many connections"**
   - Switch to Transaction pooler for serverless
   - Check for connection leaks in your code

### Migration Issues

1. **"Database schema drift"**
   - Run `pnpm db:pull` to sync local schema
   - Use `pnpm db:diff` to see differences

2. **"Migration failed"**
   - Check SQL syntax in the migration file
   - Ensure no conflicting RLS policies

## Best Practices

1. **Environment-Specific Configs**
   - Use Session pooler for development
   - Use Transaction pooler for production
   - Always use Direct URL for migrations

2. **Security**
   - Never commit `.env` files
   - Use strong passwords for database users
   - Regularly rotate credentials

3. **Development Workflow**
   - Pull before making schema changes
   - Test migrations on a staging database
   - Document breaking changes

## Additional Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Prisma Guide](https://supabase.com/docs/guides/database/prisma)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)
