# Migration Summary: Users/Customers Separation

## 📋 What Was Done

### 1. **Schema Separation** ✅

- Created separate `Customer` and `User` models in Prisma schema
- Customer: For e-commerce buyers (BigInt ID, maintains existing data)
- User: For system authentication (BigInt ID for consistency)
- Added `UserCustomerMapping` table to link users to their customer data

### 2. **Column Renaming** ✅

- Renamed `user_id` → `customer_id` in:
  - orders table
  - order_items table
  - subscriptions table
  - disputes table
- This provides clarity about which entity is being referenced

### 3. **Migration Scripts Created** ✅

- `/prisma/migrations/20250828_separate_users_customers/migration.sql` - Schema
  migration
- `/prisma/seed-admin-users.ts` - Admin user seeding script
- `/scripts/execute-migration.sh` - Safe migration execution with rollback
- `/scripts/test-migration.ts` - Validation test suite

### 4. **Code Updates** ✅

- Updated analytics router to reference `customer` instead of `user`
- Maintained BigInt IDs for both tables (addressing critic's concern)
- Created mapping table for users who are also customers

## 🚀 How to Execute the Migration

### Step 1: Review Current State

```bash
# Check current database state
pnpm prisma db pull
pnpm prisma validate
```

### Step 2: Create Backup (CRITICAL)

```bash
# The migration script will create a backup automatically, but you can also do it manually:
pg_dump $DATABASE_URL > backup_before_migration.sql
```

### Step 3: Run the Migration

```bash
# Execute the safe migration script
./scripts/execute-migration.sh

# Or run manually:
# 1. Apply schema changes
npx prisma db execute --file prisma/migrations/20250828_separate_users_customers/migration.sql

# 2. Seed admin users
npx tsx prisma/seed-admin-users.ts

# 3. Generate new Prisma client
pnpm prisma generate
```

### Step 4: Validate Migration

```bash
# Run validation tests
npx tsx scripts/test-migration.ts

# Check TypeScript compilation
pnpm typecheck
```

### Step 5: Update Admin Users

Edit `/prisma/seed-admin-users.ts` and modify the `ADMIN_USERS` array with your
actual admin emails:

```typescript
const ADMIN_USERS = [
  {
    email: 'your-admin@example.com', // Change this!
    fullName: 'Your Name',
    locale: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    emailVerified: true,
  },
]
```

## ⚠️ Critical Issues Addressed

### 1. **Empty Users Table Problem** ✅

- Created seed script that populates admin users
- Links admin users to existing customer data if email matches
- Creates default workspace for admin users

### 2. **ID Type Consistency** ✅

- Kept BigInt for both tables (not UUID)
- Avoids complex type conversions
- Maintains compatibility with existing data

### 3. **Column Name Clarity** ✅

- Properly renamed columns to `customer_id`
- No confusion about `user_id` pointing to customers

### 4. **Rollback Strategy** ✅

- Migration script includes automatic backup
- Rollback function to restore from backup
- Audit trail for tracking changes

## 🔍 What Still Needs to Be Done

### 1. **Supabase Auth Integration**

```typescript
// Need to sync Supabase Auth with new users table
// In your auth callback:
const { data: authUser } = await supabase.auth.getUser()
const dbUser = await prisma.user.upsert({
  where: { email: authUser.email },
  update: { lastActiveAt: new Date() },
  create: {
    email: authUser.email,
    fullName: authUser.user_metadata.full_name,
    emailVerified: true,
  },
})
```

### 2. **Update Auth Context**

The auth context may need updates to work with the new User model structure.

### 3. **Production Deployment**

1. Test thoroughly in staging environment
2. Schedule maintenance window
3. Run migration during low-traffic period
4. Monitor for issues

### 4. **Data Cleanup**

After successful migration:

- Clean up orphaned records
- Remove old backup files
- Update documentation

## 📊 Migration Validation Checklist

- [ ] Backup created successfully
- [ ] `customers` table exists with all data
- [ ] `users` table created
- [ ] Admin users seeded
- [ ] Foreign keys updated correctly
- [ ] Column names changed to `customer_id`
- [ ] Analytics queries work
- [ ] Authentication works
- [ ] TypeScript compiles without errors
- [ ] All tests pass

## 🆘 Troubleshooting

### If Migration Fails

```bash
# Rollback using the script
./scripts/execute-migration.sh --rollback

# Or manually restore backup
psql $DATABASE_URL < backup_before_migration.sql
```

### If TypeScript Errors Occur

```bash
# Regenerate Prisma client
pnpm prisma generate

# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

### If Analytics Break

- Check that all queries use `customer` instead of `user`
- Verify foreign keys are properly set
- Check indexes on `customer_id` columns

## 📝 Next Steps

1. **Test in Development**
   - Run the migration in your local environment
   - Test all features thoroughly

2. **Update Environment Variables**
   - Ensure `DATABASE_URL` points to correct database
   - Add any new environment variables needed

3. **Deploy to Staging**
   - Run migration on staging database
   - Perform full regression testing

4. **Production Deployment**
   - Schedule maintenance window
   - Create production backup
   - Execute migration
   - Monitor for issues

## 🎯 Success Metrics

After successful migration, you should have:

- ✅ Separate `customers` and `users` tables
- ✅ Admin users able to log in
- ✅ Analytics dashboard working with authentication required
- ✅ All existing customer data preserved
- ✅ Clear separation between buyers and system users

---

**Migration created on:** 2025-08-28 **Author:** Migration Script **Status:**
Ready for Execution

⚠️ **IMPORTANT**: Always test in a non-production environment first!
