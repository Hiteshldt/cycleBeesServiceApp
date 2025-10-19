#!/usr/bin/env bash
# ============================================================================
# CycleBees Services - Environment Variable Verification Script
# ============================================================================
# Checks if all required environment variables are set
# Usage: bash scripts/verify-env.sh
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Environment Variable Verification${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local file not found${NC}"
    echo -e "${YELLOW}Create it by copying .env.example:${NC}"
    echo -e "   ${GREEN}cp .env.example .env.local${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found .env.local${NC}"
echo ""

# Load .env.local
set -a
source .env.local
set +a

# Required variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "N8N_WEBHOOK_URL"
    "JWT_SECRET"
)

# Optional variables
OPTIONAL_VARS=(
    "NEXT_PUBLIC_BASE_URL"
)

# Track failures
FAILED=0

echo "Checking required variables..."
echo "------------------------------"

for VAR in "${REQUIRED_VARS[@]}"; do
    VALUE="${!VAR}"
    if [ -z "$VALUE" ]; then
        echo -e "${RED}❌ Missing: $VAR${NC}"
        FAILED=$((FAILED + 1))
    elif [ "$VALUE" = "xxxx" ] || [ "$VALUE" = "xx" ] || [ "$VALUE" = "xxx" ]; then
        echo -e "${YELLOW}⚠️  Not configured: $VAR (still has placeholder value)${NC}"
        FAILED=$((FAILED + 1))
    else
        # Check minimum length for JWT_SECRET
        if [ "$VAR" = "JWT_SECRET" ]; then
            if [ ${#VALUE} -lt 64 ]; then
                echo -e "${YELLOW}⚠️  Warning: $VAR is too short (${#VALUE} chars, minimum 64 recommended)${NC}"
                FAILED=$((FAILED + 1))
            else
                echo -e "${GREEN}✅ $VAR (${#VALUE} chars)${NC}"
            fi
        else
            # Mask the value for security
            MASKED=$(echo "$VALUE" | head -c 20)...
            echo -e "${GREEN}✅ $VAR = $MASKED${NC}"
        fi
    fi
done

echo ""
echo "Checking optional variables..."
echo "------------------------------"

for VAR in "${OPTIONAL_VARS[@]}"; do
    VALUE="${!VAR}"
    if [ -z "$VALUE" ]; then
        echo -e "${BLUE}ℹ️  Not set: $VAR (will use default)${NC}"
    elif [ "$VALUE" = "xxxx" ] || [ "$VALUE" = "xx" ] || [ "$VALUE" = "xxx" ]; then
        echo -e "${BLUE}ℹ️  Not configured: $VAR (placeholder value, will use default)${NC}"
    else
        echo -e "${GREEN}✅ $VAR = $VALUE${NC}"
    fi
done

echo ""
echo "============================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All required environment variables are set!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run dev"
    echo "2. Test admin login"
    echo "3. Create a test service request"
    exit 0
else
    echo -e "${RED}❌ $FAILED issue(s) found${NC}"
    echo ""
    echo "Please fix the issues above and run this script again."
    echo ""
    echo "Refer to .env.example for guidance on each variable."
    exit 1
fi
