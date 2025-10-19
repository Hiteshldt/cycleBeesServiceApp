#!/usr/bin/env bash
# ============================================================================
# CycleBees Services - Sanity Check Script
# ============================================================================
# Runs comprehensive checks: dependencies, env vars, lint, type-check, build
# Usage: bash scripts/sanity-check.sh
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Track results
CHECKS_PASSED=0
CHECKS_FAILED=0

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════╗"
echo "║   CycleBees Services - Sanity Check       ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to run a check
run_check() {
    local CHECK_NAME="$1"
    local CHECK_COMMAND="$2"

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Running: $CHECK_NAME${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if eval "$CHECK_COMMAND"; then
        echo -e "${GREEN}✅ PASSED: $CHECK_NAME${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED: $CHECK_NAME${NC}"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
    echo ""
}

# 1. Check Node.js version
run_check "Node.js Version (>= 18)" "node --version && node -v | awk -F. '{if (\$1 >= 19 || (\$1 == 18 && \$2 >= 0)) exit 0; else exit 1}'"

# 2. Check if package.json exists
run_check "package.json exists" "test -f package.json"

# 3. Check if node_modules exists (dependencies installed)
run_check "Dependencies installed" "test -d node_modules"

# 4. Environment variables check (if verify-env.sh exists)
if [ -f scripts/verify-env.sh ]; then
    run_check "Environment Variables" "bash scripts/verify-env.sh"
else
    echo -e "${YELLOW}⚠️  Skipping: Environment variable check (scripts/verify-env.sh not found)${NC}"
    echo ""
fi

# 5. ESLint check
run_check "ESLint (code linting)" "npm run lint"

# 6. TypeScript type check
run_check "TypeScript (type checking)" "npx tsc --noEmit"

# 7. Build check
run_check "Production Build" "npm run build"

# 8. Test suite (if tests exist)
if grep -q '"test"' package.json; then
    run_check "Test Suite" "npm test"
else
    echo -e "${YELLOW}⚠️  Skipping: Tests (no test script in package.json)${NC}"
    echo ""
fi

# Summary
echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              SUMMARY                       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}❌ Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   🎉 ALL CHECKS PASSED! 🎉                ║${NC}"
    echo -e "${GREEN}║   Your application is ready to deploy!    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ⚠️  SOME CHECKS FAILED                   ║${NC}"
    echo -e "${RED}║   Please fix the issues above             ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════╝${NC}"
    exit 1
fi
