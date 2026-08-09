#!/bin/bash
set -euo pipefail

# Validation script for pre-commit checks
# Run this before every commit to ensure code quality

echo "========================================"
echo "Running validation checks..."
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# 1. Lint check
echo -e "${YELLOW}[1/3] Running ESLint...${NC}"
if npm run lint; then
    echo -e "${GREEN}✓ Lint passed${NC}"
else
    echo -e "${RED}✗ Lint failed${NC}"
    FAILED=1
fi
echo ""

# 2. Type check
echo -e "${YELLOW}[2/3] Running TypeScript check...${NC}"
if npm run typecheck; then
    echo -e "${GREEN}✓ Type check passed${NC}"
else
    echo -e "${RED}✗ Type check failed${NC}"
    FAILED=1
fi
echo ""

# 3. Unit tests
echo -e "${YELLOW}[3/3] Running unit tests...${NC}"
if npm run test -- --run; then
    echo -e "${GREEN}✓ Tests passed${NC}"
else
    echo -e "${RED}✗ Tests failed${NC}"
    FAILED=1
fi
echo ""

# Summary
echo "========================================"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All checks passed! Ready to commit.${NC}"
    exit 0
else
    echo -e "${RED}Some checks failed. Please fix before committing.${NC}"
    exit 1
fi
