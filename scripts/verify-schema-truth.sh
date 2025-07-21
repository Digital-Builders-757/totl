#!/bin/bash

# 🚨 SCHEMA TRUTH VERIFICATION SCRIPT
# This script helps verify that database_schema_audit.md remains the single source of truth

echo "🔍 VERIFYING SCHEMA TRUTH RULES..."
echo "=================================="

# Check if database_schema_audit.md exists
if [ ! -f "database_schema_audit.md" ]; then
    echo "❌ ERROR: database_schema_audit.md not found!"
    echo "   This file is the SINGLE SOURCE OF TRUTH and must exist."
    exit 1
fi

echo "✅ database_schema_audit.md exists"

# Check if types/database.ts exists
if [ ! -f "types/database.ts" ]; then
    echo "❌ ERROR: types/database.ts not found!"
    echo "   This file must match the audit file exactly."
    exit 1
fi

echo "✅ types/database.ts exists"

# Check for any 'any' types in database-related files
echo "🔍 Checking for 'any' types in database code..."
ANY_COUNT=$(grep -r "any" types/database.ts lib/ app/ --include="*.ts" --include="*.tsx" | wc -l)

if [ $ANY_COUNT -gt 0 ]; then
    echo "⚠️  WARNING: Found $ANY_COUNT instances of 'any' type in database code"
    echo "   Consider replacing with proper types from database_schema_audit.md"
    grep -r "any" types/database.ts lib/ app/ --include="*.ts" --include="*.tsx"
else
    echo "✅ No 'any' types found in database code"
fi

# Check TypeScript compilation
echo "🔍 Checking TypeScript compilation..."
if npx tsc --noEmit; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    echo "   Fix type errors before proceeding"
    exit 1
fi

# Check if audit file has been modified recently
echo "🔍 Checking audit file modification..."
AUDIT_MODIFIED=$(git log --oneline -1 -- database_schema_audit.md)
if [ -z "$AUDIT_MODIFIED" ]; then
    echo "⚠️  WARNING: database_schema_audit.md has no recent commits"
    echo "   Consider if schema changes have been made without updating the audit"
else
    echo "✅ database_schema_audit.md has recent activity: $AUDIT_MODIFIED"
fi

echo ""
echo "🎯 SCHEMA TRUTH VERIFICATION COMPLETE"
echo "====================================="
echo ""
echo "📋 REMEMBER:"
echo "   - database_schema_audit.md is the SINGLE SOURCE OF TRUTH"
echo "   - Always update it BEFORE making schema changes"
echo "   - Sync types/database.ts with the audit file"
echo "   - Test the application after changes"
echo ""
echo "📖 See SCHEMA_TRUTH_RULES.md for complete workflow" 