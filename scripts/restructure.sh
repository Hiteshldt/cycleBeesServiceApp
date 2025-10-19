#!/usr/bin/env bash
# ============================================================================
# CycleBees Services - Non-Destructive Restructure Script
# ============================================================================
# This script uses git mv to preserve file history
# NO DELETIONS - Only moves and renames
# Run from repository root: bash scripts/restructure.sh
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

echo "🚀 Starting CycleBees Services Restructure..."
echo "================================================"

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository root"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo "⚠️  Warning: You have uncommitted changes"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted by user"
        exit 1
    fi
fi

echo ""
echo "📁 Creating new directory structure..."
echo "---------------------------------------"

# Create new directories
mkdir -p docs/database
mkdir -p scripts/db
mkdir -p scripts/admin
mkdir -p tests
mkdir -p _archive

echo "✅ Directories created"
echo ""
echo "📦 Moving documentation files..."
echo "---------------------------------------"

# Move documentation files to docs/
if [ -f BUILD_PLAN.md ]; then
    git mv BUILD_PLAN.md docs/BUILD_PLAN.md
    echo "✅ Moved BUILD_PLAN.md"
fi

if [ -f DEPLOYMENT_GUIDE.md ]; then
    git mv DEPLOYMENT_GUIDE.md docs/DEPLOYMENT_GUIDE.md
    echo "✅ Moved DEPLOYMENT_GUIDE.md"
fi

if [ -f TESTING_GUIDE.md ]; then
    git mv TESTING_GUIDE.md docs/TESTING_GUIDE.md
    echo "✅ Moved TESTING_GUIDE.md"
fi

if [ -f WEBHOOK_DOCUMENTATION.md ]; then
    git mv WEBHOOK_DOCUMENTATION.md docs/WEBHOOK_DOCUMENTATION.md
    echo "✅ Moved WEBHOOK_DOCUMENTATION.md"
fi

echo ""
echo "🗄️  Renaming database directory..."
echo "---------------------------------------"

if [ -d database ]; then
    # Move database COPY_DATA_TO_TEST.md first
    if [ -f database/COPY_DATA_TO_TEST.md ]; then
        git mv database/COPY_DATA_TO_TEST.md docs/database/COPY_DATA_TO_TEST.md
        echo "✅ Moved database/COPY_DATA_TO_TEST.md"
    fi

    # Rename database → db
    git mv database db
    echo "✅ Renamed database/ → db/"
fi

echo ""
echo "🔧 Reorganizing scripts..."
echo "---------------------------------------"

if [ -f scripts/check-database.ts ]; then
    git mv scripts/check-database.ts scripts/db/check-database.ts
    echo "✅ Moved scripts/check-database.ts → scripts/db/"
fi

if [ -f scripts/hash-passwords.ts ]; then
    git mv scripts/hash-passwords.ts scripts/admin/hash-passwords.ts
    echo "✅ Moved scripts/hash-passwords.ts → scripts/admin/"
fi

echo ""
echo "🗑️  Moving deletion candidates to _archive..."
echo "---------------------------------------"

# Move backup/deprecated files to _archive
if [ -f "app/o/[slug]/page.tsx.bak_dup_prop" ]; then
    git mv "app/o/[slug]/page.tsx.bak_dup_prop" "_archive/page.tsx.bak_dup_prop"
    echo "✅ Moved app/o/[slug]/page.tsx.bak_dup_prop → _archive/"
fi

echo ""
echo "================================================"
echo "✅ Restructure complete!"
echo "================================================"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm install (ensure dependencies still work)"
echo "2. Update import paths in scripts/db/check-database.ts"
echo "3. Run: npm run dev (verify app still works)"
echo "4. Run: bash scripts/sanity-check.sh (when created)"
echo "5. Review changes: git status"
echo "6. Commit changes: git add . && git commit -m 'refactor: restructure project directories'"
echo ""
echo "⚠️  Files that need import path updates:"
echo "   - scripts/db/check-database.ts (update ../lib/supabase → ../../lib/supabase)"
echo ""
