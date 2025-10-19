#!/usr/bin/env bash
# ============================================================================
# CycleBees Services - List Deletion Candidates
# ============================================================================
# Searches for files marked with @deletion-candidate comments
# Usage: bash scripts/list-deletion-candidates.sh
# ============================================================================

set -e  # Exit on error

# Colors
YELLOW='\033[1;33m'
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Deletion Candidates Search${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Search for @deletion-candidate markers in code files
echo "Searching for @deletion-candidate markers..."
echo ""

# Search in TypeScript/JavaScript files
FOUND_IN_CODE=$(grep -r "@deletion-candidate" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=.git \
    . 2>/dev/null || true)

if [ -n "$FOUND_IN_CODE" ]; then
    echo -e "${YELLOW}Found @deletion-candidate markers in code:${NC}"
    echo "$FOUND_IN_CODE"
    echo ""
fi

# Search for DELETION_CANDIDATE.md files in directories
FOUND_IN_DIRS=$(find . -name "DELETION_CANDIDATE.md" \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./.git/*" \
    2>/dev/null || true)

if [ -n "$FOUND_IN_DIRS" ]; then
    echo -e "${YELLOW}Found DELETION_CANDIDATE.md markers in directories:${NC}"
    echo "$FOUND_IN_DIRS"
    echo ""
fi

# Check if docs/DELETION_CANDIDATES.md exists
if [ -f docs/DELETION_CANDIDATES.md ]; then
    echo -e "${GREEN}✅ Found tracking file: docs/DELETION_CANDIDATES.md${NC}"
    echo ""
    echo "Documented candidates:"
    echo "---------------------"
    # Extract just the table rows (lines with pipes)
    grep "^|" docs/DELETION_CANDIDATES.md | head -20
    echo ""
fi

# Summary
if [ -z "$FOUND_IN_CODE" ] && [ -z "$FOUND_IN_DIRS" ]; then
    echo -e "${GREEN}✅ No @deletion-candidate markers found in codebase${NC}"
    echo ""
    echo "All candidates should be tracked in docs/DELETION_CANDIDATES.md"
else
    echo -e "${YELLOW}⚠️  Found deletion candidate markers${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review each candidate in docs/DELETION_CANDIDATES.md"
    echo "2. Get approval from code owners"
    echo "3. Run: bash scripts/remove-deletion-candidates.sh --dry-run"
fi

echo ""
echo "============================================"
