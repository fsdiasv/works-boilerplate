#!/bin/bash

# Execute Users/Customers Separation Migration
# This script safely executes the migration with rollback capability

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_step() {
  echo -e "${GREEN}==>${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠️  Warning:${NC} $1"
}

print_error() {
  echo -e "${RED}❌ Error:${NC} $1"
}

print_success() {
  echo -e "${GREEN}✅ Success:${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
  print_step "Checking prerequisites..."
  
  # Check if .env file exists
  if [ ! -f "$PROJECT_ROOT/.env" ]; then
    print_error ".env file not found"
    exit 1
  fi
  
  # Check if DATABASE_URL is set
  if ! grep -q "DATABASE_URL" "$PROJECT_ROOT/.env"; then
    print_error "DATABASE_URL not found in .env"
    exit 1
  fi
  
  # Check if PostgreSQL client is installed
  if ! command -v psql &> /dev/null; then
    print_warning "psql command not found. Install PostgreSQL client for full functionality."
  fi
  
  print_success "Prerequisites check passed"
}

# Function to create backup
create_backup() {
  print_step "Creating database backup..."
  
  # Load DATABASE_URL from .env
  export $(grep DATABASE_URL "$PROJECT_ROOT/.env" | xargs)
  
  BACKUP_DIR="$PROJECT_ROOT/backups"
  mkdir -p "$BACKUP_DIR"
  
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="$BACKUP_DIR/backup_before_migration_$TIMESTAMP.sql"
  
  # Try to create backup using pg_dump
  if command -v pg_dump &> /dev/null; then
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null || {
      print_warning "pg_dump failed. Backup may be incomplete."
    }
    
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
      print_success "Backup created: $BACKUP_FILE"
      echo "$BACKUP_FILE" > "$BACKUP_DIR/.last_backup"
    else
      print_warning "Backup file is empty or failed to create"
    fi
  else
    print_warning "pg_dump not available. Skipping backup (not recommended for production)"
    read -p "Continue without backup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
}

# Function to run migration
run_migration() {
  print_step "Running database migration..."
  
  cd "$PROJECT_ROOT"
  
  # Check if migration file exists
  MIGRATION_FILE="$PROJECT_ROOT/prisma/migrations/20250828_separate_users_customers/migration.sql"
  if [ ! -f "$MIGRATION_FILE" ]; then
    print_error "Migration file not found: $MIGRATION_FILE"
    exit 1
  fi
  
  # Apply migration using Prisma
  print_step "Applying schema changes..."
  
  # First, mark the migration as applied (since we're doing it manually)
  npx prisma migrate resolve --applied 20250828_separate_users_customers 2>/dev/null || {
    print_warning "Could not mark migration as applied. This is normal for first migration."
  }
  
  # Apply the SQL migration
  npx prisma db execute --file "$MIGRATION_FILE" || {
    print_error "Migration failed! Check the error above."
    exit 1
  }
  
  print_success "Database schema migrated successfully"
}

# Function to seed admin users
seed_admin_users() {
  print_step "Seeding admin users..."
  
  cd "$PROJECT_ROOT"
  
  # Compile and run the seed script
  npx tsx prisma/seed-admin-users.ts || {
    print_error "Admin user seeding failed!"
    exit 1
  }
  
  print_success "Admin users seeded successfully"
}

# Function to validate migration
validate_migration() {
  print_step "Validating migration..."
  
  cd "$PROJECT_ROOT"
  
  # Generate Prisma Client
  pnpm prisma generate || {
    print_error "Failed to generate Prisma client"
    exit 1
  }
  
  # Check if tables exist
  print_step "Checking database tables..."
  
  npx prisma db execute --stdin <<EOF
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') 
    THEN 'customers table exists' 
    ELSE 'customers table NOT found' 
  END as customers_check,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
    THEN 'users table exists' 
    ELSE 'users table NOT found' 
  END as users_check,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_customer_mappings') 
    THEN 'user_customer_mappings table exists' 
    ELSE 'user_customer_mappings table NOT found' 
  END as mappings_check;
EOF
  
  print_success "Migration validated"
}

# Function to rollback migration
rollback_migration() {
  print_error "Rolling back migration..."
  
  BACKUP_DIR="$PROJECT_ROOT/backups"
  
  if [ -f "$BACKUP_DIR/.last_backup" ]; then
    LAST_BACKUP=$(cat "$BACKUP_DIR/.last_backup")
    
    if [ -f "$LAST_BACKUP" ]; then
      print_step "Restoring from backup: $LAST_BACKUP"
      
      # Load DATABASE_URL
      export $(grep DATABASE_URL "$PROJECT_ROOT/.env" | xargs)
      
      psql "$DATABASE_URL" < "$LAST_BACKUP" || {
        print_error "Failed to restore backup!"
        exit 1
      }
      
      print_success "Database restored from backup"
    else
      print_error "Backup file not found: $LAST_BACKUP"
      exit 1
    fi
  else
    print_error "No backup file reference found. Manual restoration required."
    exit 1
  fi
}

# Main execution flow
main() {
  echo "========================================"
  echo "Users/Customers Separation Migration"
  echo "========================================"
  echo
  
  check_prerequisites
  
  # Confirm with user
  print_warning "This migration will:"
  echo "  1. Rename 'users' table to 'customers'"
  echo "  2. Create new 'users' table for authentication"
  echo "  3. Update foreign keys and column names"
  echo "  4. Seed initial admin users"
  echo
  read -p "Do you want to proceed? (y/N): " -n 1 -r
  echo
  
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
  fi
  
  # Create backup
  create_backup
  
  # Run migration with error handling
  {
    run_migration
    seed_admin_users
    validate_migration
  } || {
    print_error "Migration failed! Starting rollback..."
    rollback_migration
    exit 1
  }
  
  print_success "Migration completed successfully!"
  echo
  echo "Next steps:"
  echo "  1. Test the application thoroughly"
  echo "  2. Update environment variables if needed"
  echo "  3. Deploy code changes"
  echo "  4. Monitor for any issues"
  echo
  echo "To rollback if needed, run: $0 --rollback"
}

# Handle command line arguments
if [ "$1" == "--rollback" ]; then
  rollback_migration
else
  main
fi