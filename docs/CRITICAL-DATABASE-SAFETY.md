# 🚨 CRITICAL DATABASE SAFETY RULES

## ⚠️ EMERGENCY WARNING ⚠️

**THIS DOCUMENT CONTAINS LIFE-SAVING RULES FOR DATABASE OPERATIONS**

A single wrong command can **DESTROY YEARS OF PRODUCTION DATA** in seconds.
These rules exist because data loss has already occurred and must never happen
again.

---

## 🚫 ABSOLUTELY FORBIDDEN COMMANDS

### ❌ NEVER EXECUTE THESE COMMANDS:

```bash
# THESE COMMANDS WILL DESTROY ALL DATA PERMANENTLY
prisma db push --accept-data-loss    # ❌ DESTROYS DATA INSTANTLY
prisma db push                       # ❌ ON EXISTING DATA = DATA LOSS RISK
DROP DATABASE                        # ❌ CATASTROPHIC DATA LOSS
TRUNCATE TABLE                       # ❌ DELETES ALL ROWS
DELETE FROM table_name;              # ❌ WITHOUT WHERE CLAUSE = DISASTER
UPDATE table_name SET;               # ❌ WITHOUT WHERE CLAUSE = CORRUPTION
```

### 🚨 HIGH-RISK OPERATIONS:

- Any SQL command without WHERE clause on production data
- Database schema changes without migrations
- Direct database manipulation without backup
- Running database commands without user explicit approval

---

## ✅ SAFE DATABASE OPERATIONS

### 🟢 ALWAYS USE THESE COMMANDS:

```bash
# SAFE SCHEMA OPERATIONS
prisma migrate dev --name "descriptive_name"    # ✅ Safe development migration
prisma migrate deploy                           # ✅ Safe production deployment
prisma migrate diff                              # ✅ Preview changes (read-only)
prisma db pull                                   # ✅ Sync schema (read-only)
prisma generate                                  # ✅ Generate client (safe)

# SAFE BACKUP OPERATIONS
pg_dump $DATABASE_URL > backup.sql               # ✅ Create backup
pg_restore backup.sql                            # ✅ Restore from backup
```

---

## 📋 MANDATORY SAFETY PROCEDURES

### Before ANY Database Operation:

1. **🛡️ BACKUP FIRST**

   ```bash
   # Create timestamped backup
   pg_dump $DATABASE_URL > "backup_$(date +%Y%m%d_%H%M%S).sql"

   # Verify backup was created
   ls -la backup_*.sql
   ```

2. **🔍 VERIFY ENVIRONMENT**

   ```bash
   # Check which database you're connected to
   echo $DATABASE_URL

   # Confirm this is the correct environment
   psql $DATABASE_URL -c "SELECT current_database();"
   ```

3. **📝 DOCUMENT THE CHANGE**
   - Write what you're doing and why
   - Document rollback plan
   - Get approval for production changes

4. **🧪 TEST IN DEVELOPMENT FIRST**
   - Never test new commands in production
   - Use development database for experiments
   - Verify migrations work before production deploy

---

## 🚨 EMERGENCY DATA RECOVERY

### If Data Loss Occurs:

1. **🛑 STOP ALL OPERATIONS IMMEDIATELY**
   - Do not run any more commands
   - Do not try to "fix" it yourself
   - Notify team immediately

2. **📞 RECOVERY PROCESS**
   - Check Supabase dashboard for automatic backups
   - Look for Point-in-Time Recovery (PITR) options
   - Check local backup files
   - Contact database administrator

3. **🔍 ASSESSMENT**
   - Document what was lost
   - Identify last known good backup
   - Calculate recovery time objective (RTO)

---

## 🏥 PREVENTION CHECKLIST

Before executing ANY database command, verify:

- [ ] **Backup Created**: Recent backup exists and is verified
- [ ] **Correct Database**: Confirmed you're connected to the right DB
- [ ] **Migration Ready**: Using proper migration commands, not direct SQL
- [ ] **Rollback Plan**: Know how to undo this change
- [ ] **Team Approval**: Production changes are approved
- [ ] **Testing Complete**: Command tested in development environment
- [ ] **Documentation**: Change is documented with rationale

---

## 🚨 ESCALATION PROCEDURES

### When in Doubt:

1. **ASK FIRST** - Never guess with database operations
2. **BACKUP FIRST** - Always create backup before changes
3. **TEST FIRST** - Use development database for testing
4. **DOCUMENT FIRST** - Write down what you're doing and why

### Emergency Contacts:

- Database Administrator: [Add contact info]
- DevOps Team: [Add contact info]
- Technical Lead: [Add contact info]

---

## 📚 EDUCATIONAL RESOURCES

### Learn Safe Database Practices:

- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
- [Database Schema Versioning](https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/)

---

## 🎯 REMEMBER

> **"Data is irreplaceable. Code is not."**
>
> You can rewrite code in hours. You cannot recreate lost production data.
>
> When in doubt, ask. When uncertain, backup. When risky, test elsewhere first.

**These rules save careers, projects, and businesses.**

---

_Last updated: $(date)_ _Next review: Monthly_ _Severity: CRITICAL_
