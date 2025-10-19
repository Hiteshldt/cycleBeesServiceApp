#!/usr/bin/env bash
# ============================================================================
# CycleBees Services - Remove Deletion Candidates
# ============================================================================
# Removes files marked for deletion (with safety checks)
# Usage:
#   bash scripts/remove-deletion-candidates.sh --dry-run    # Preview only
#   bash scripts/remove-deletion-candidates.sh --execute    # Actually delete
# ============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MODE="${1:---dry-run}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Deletion Candidates Removal${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

if [ "$MODE" = "--dry-run" ]; then
    echo -e "${YELLOW}🔍 DRY RUN MODE (no files will be deleted)${NC}"
    echo ""
elif [ "$MODE" = "--execute" ]; then
    echo -e "${RED}⚠️  EXECUTE MODE (files will be permanently deleted!)${NC}"
    echo ""
    read -p "Are you sure you want to delete files? (type 'yes' to confirm): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Aborted by user"
        exit 0
    fi
    echo ""
else
    echo -e "${RED}Invalid mode: $MODE${NC}"
    echo "Usage:"
    echo "  bash scripts/remove-deletion-candidates.sh --dry-run"
    echo "  bash scripts/remove-deletion-candidates.sh --execute"
    exit 1
fi

# Check if docs/DELETION_CANDIDATES.md exists
if [ ! -f docs/DELETION_CANDIDATES.md ]; then
    echo -e "${RED}❌ Error: docs/DELETION_CANDIDATES.md not found${NC}"
    echo "No deletion tracking file exists. Nothing to do."
    exit 1
fi

# Define candidates from docs/DELETION_CANDIDATES.md
# NOTE: Update this array based on approved candidates
CANDIDATES=(
    "app/o/[slug]/page.tsx.bak_dup_prop"
)

echo "Deletion candidates:"
echo "-------------------"

DELETED_COUNT=0

for CANDIDATE in "${CANDIDATES[@]}"; do
    if [ -f "$CANDIDATE" ]; then
        if [ "$MODE" = "--dry-run" ]; then
            echo -e "${YELLOW}[DRY RUN] Would delete: $CANDIDATE${NC}"
        else
            echo -e "${RED}Deleting: $CANDIDATE${NC}"
            git rm "$CANDIDATE"
            DELETED_COUNT=$((DELETED_COUNT + 1))
        fi
    elif [ -d "$CANDIDATE" ]; then
        if [ "$MODE" = "--dry-run" ]; then
            echo -e "${YELLOW}[DRY RUN] Would delete directory: $CANDIDATE${NC}"
        else
            echo -e "${RED}Deleting directory: $CANDIDATE${NC}"
            git rm -r "$CANDIDATE"
            DELETED_COUNT=$((DELETED_COUNT + 1))
        fi
    else
        echo -e "${BLUE}ℹ️  Not found (may already be deleted): $CANDIDATE${NC}"
    fi
done

echo ""
echo "============================================"

if [ "$MODE" = "--dry-run" ]; then
    echo -e "${YELLOW}🔍 Dry run complete - no files were deleted${NC}"
    echo ""
    echo "To actually delete files, run:"
    echo -e "${GREEN}bash scripts/remove-deletion-candidates.sh --execute${NC}"
else
    echo -e "${GREEN}✅ Deleted $DELETED_COUNT file(s)${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify changes: git status"
    echo "2. Run tests: npm test"
    echo "3. Run build: npm run build"
    echo "4. If all good, commit: git commit -m 'chore: remove deprecated files'"
fi

echo ""
