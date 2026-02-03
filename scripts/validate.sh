#!/bin/bash
# Description: Full validation pipeline for the PDF Viewer/Editor project
# Usage: ./scripts/validate.sh
#
# If you get a permission denied error, run: chmod +x scripts/validate.sh
#
# This script runs all validation checks:
# 1. ESLint for code quality
# 2. TypeScript for type checking
# 3. Vitest for unit tests with coverage
# 4. Vite build for production build
#
# Run this before committing any changes.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}========================================"
echo "  PDF Viewer/Editor Validation Pipeline"
echo -e "========================================${NC}"
echo ""

# Track time
START_TIME=$(date +%s)

# Step 1: Lint
echo -e "${YELLOW}Step 1/4: Running linter...${NC}"
if npm run lint; then
    echo -e "${GREEN}✓ Linting passed${NC}"
else
    echo -e "${RED}✗ Linting failed${NC}"
    echo ""
    echo "Fix linting issues with: npm run lint -- --fix"
    exit 1
fi
echo ""

# Step 2: Type check
echo -e "${YELLOW}Step 2/4: Running type check...${NC}"
if npm run typecheck; then
    echo -e "${GREEN}✓ Type check passed${NC}"
else
    echo -e "${RED}✗ Type check failed${NC}"
    exit 1
fi
echo ""

# Step 3: Unit tests with coverage
echo -e "${YELLOW}Step 3/4: Running unit tests with coverage...${NC}"
if npm run test:coverage; then
    echo -e "${GREEN}✓ Unit tests passed${NC}"
else
    echo -e "${RED}✗ Unit tests failed${NC}"
    exit 1
fi
echo ""

# Step 4: Build
echo -e "${YELLOW}Step 4/4: Building project...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Build succeeded${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo ""

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "${BLUE}========================================"
echo -e "${GREEN}All validations passed successfully!${NC}"
echo -e "Total time: ${DURATION}s"
echo -e "${BLUE}========================================${NC}"
echo ""
exit 0
