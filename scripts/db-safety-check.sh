#!/bin/bash

# 🚨 Database Safety Check Script
# This script ensures developers follow safety protocols before database operations

set -e

echo "🛡️  DATABASE SAFETY CHECK"
echo "========================="
echo ""

# Check if safety documentation exists
if [ ! -f "docs/CRITICAL-DATABASE-SAFETY.md" ]; then
    echo "❌ CRITICAL: Safety documentation missing!"
    echo "   Please ensure docs/CRITICAL-DATABASE-SAFETY.md exists"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set"
    echo "   Please configure your database connection"
    exit 1
fi

# Warn about production databases
echo "🔍 Current DATABASE_URL: ${DATABASE_URL:0:50}..."
echo ""
echo "⚠️  SAFETY CHECKLIST:"
echo "   [ ] Is this a development database with disposable data?"
echo "   [ ] Have you read docs/CRITICAL-DATABASE-SAFETY.md?"
echo "   [ ] Do you have a recent backup?"
echo "   [ ] Are you using the correct migration commands?"
echo ""
echo "🚨 REMEMBER:"
echo "   - NEVER use 'db:push' on production data"
echo "   - ALWAYS create backups before schema changes"
echo "   - USE 'db:migrate' for safe schema changes"
echo ""
echo "📖 Full safety guide: docs/CRITICAL-DATABASE-SAFETY.md"
echo ""

# Prompt for confirmation
echo "Do you acknowledge these safety rules? (yes/no)"
read -r confirmation
if [ "$confirmation" != "yes" ]; then
    echo "❌ Safety acknowledgment required. Aborting."
    exit 1
fi

echo "✅ Safety check passed. Proceed with caution!"