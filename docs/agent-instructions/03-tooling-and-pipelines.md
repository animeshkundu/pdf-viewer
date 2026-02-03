# Tooling and Pipelines

## Tool Creation Philosophy

**If you perform a verification task twice, you MUST write a script for it.**

Automation reduces errors, speeds up development, and enables consistent validation across agents and developers.

---

## 1. The Automation Principle

### Why Automate?
- Consistency: Same process every time
- Speed: Faster than manual steps
- Documentation: Scripts document the process
- Sharing: Other agents/developers can use the same tools
- CI/CD: Scripts integrate into pipelines

### When to Create a Script
- Performed the same sequence of commands twice
- Task has multiple steps that must be done in order
- Validation requires specific checks
- Process is error-prone when done manually

---

## 2. Script Organization

### Directory Structure
```
scripts/
├── validate.sh          # Full validation (lint, test, build)
├── setup.sh             # Project setup for new developers
├── test-unit.sh         # Unit tests with coverage
├── test-e2e.sh          # E2E tests
├── lint-fix.sh          # Fix linting issues
└── README.md            # Script documentation
```

### Script Requirements

1. **Shebang**: Always include `#!/bin/bash` or appropriate interpreter
2. **Error handling**: Use `set -e` to exit on errors
3. **Documentation**: Comment what the script does
4. **Feedback**: Print status messages
5. **Exit codes**: Return appropriate codes

### Script Template

```bash
#!/bin/bash
# Description: What this script does
# Usage: ./scripts/script-name.sh [options]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "Starting [task name]..."

# Step 1
echo "Step 1: Doing something..."
command_here || { echo -e "${RED}Step 1 failed${NC}"; exit 1; }

# Step 2
echo "Step 2: Doing something else..."
command_here || { echo -e "${RED}Step 2 failed${NC}"; exit 1; }

echo -e "${GREEN}All steps completed successfully!${NC}"
exit 0
```

---

## 3. The Validation Script

### Purpose
The `validate.sh` script is the single command any agent or developer runs to verify their work.

### What It Does
1. Lint the code
2. Run type checking
3. Run unit tests with coverage
4. Build the project
5. Report results

### Usage
```bash
# Run full validation
./scripts/validate.sh

# Run in CI mode (no interactive prompts)
CI=true ./scripts/validate.sh
```

### Implementation

```bash
#!/bin/bash
# Description: Full validation pipeline for the project
# Usage: ./scripts/validate.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "  PDF Viewer/Editor Validation Pipeline"
echo "========================================"

# Step 1: Lint
echo ""
echo -e "${YELLOW}Step 1/4: Running linter...${NC}"
npm run lint || { echo -e "${RED}Linting failed${NC}"; exit 1; }
echo -e "${GREEN}✓ Linting passed${NC}"

# Step 2: Type check
echo ""
echo -e "${YELLOW}Step 2/4: Running type check...${NC}"
npm run typecheck || { echo -e "${RED}Type check failed${NC}"; exit 1; }
echo -e "${GREEN}✓ Type check passed${NC}"

# Step 3: Unit tests with coverage
echo ""
echo -e "${YELLOW}Step 3/4: Running unit tests...${NC}"
npm run test:coverage || { echo -e "${RED}Tests failed${NC}"; exit 1; }
echo -e "${GREEN}✓ Unit tests passed${NC}"

# Step 4: Build
echo ""
echo -e "${YELLOW}Step 4/4: Building project...${NC}"
npm run build || { echo -e "${RED}Build failed${NC}"; exit 1; }
echo -e "${GREEN}✓ Build succeeded${NC}"

echo ""
echo "========================================"
echo -e "${GREEN}All validations passed successfully!${NC}"
echo "========================================"
exit 0
```

---

## 4. CI/CD Standards

### GitHub Actions Priority
All automated checks MUST run in GitHub Actions CI/CD pipeline.

### Required Pipeline Steps

```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    name: Lint
    steps:
      - run: npm run lint

  typecheck:
    name: Type Check
    steps:
      - run: npm run typecheck

  test:
    name: Unit Tests
    steps:
      - run: npm run test:coverage
      # Upload coverage report

  build:
    name: Build
    needs: [lint, typecheck]
    steps:
      - run: npm run build

  e2e:
    name: E2E Tests
    needs: [build]
    steps:
      - run: npm run e2e

  security:
    name: Security Scan
    steps:
      # Run security scanning tools
```

### Pipeline Principles

1. **Fast feedback**: Lint and typecheck first (fastest)
2. **Fail early**: Stop on first failure
3. **Parallelize**: Run independent jobs in parallel
4. **Cache**: Cache dependencies for speed
5. **Artifacts**: Save build outputs and reports

---

## 5. Standard NPM Scripts

### Required Scripts

Every project should have these npm scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    
    "validate": "./scripts/validate.sh"
  }
}
```

### Script Naming Conventions

| Pattern | Purpose | Example |
|---------|---------|---------|
| `verb` | Main action | `build`, `test`, `lint` |
| `verb:modifier` | Variant of action | `test:coverage`, `test:ui` |
| `pre*` | Runs before * | `prebuild` |
| `post*` | Runs after * | `postbuild` |

---

## 6. Tool Selection Guidelines

### Before Adding a New Tool

1. **Research**: Is there a better alternative? (See 01-research-and-web.md)
2. **Necessity**: Do we actually need this?
3. **Maintenance**: Is it actively maintained?
4. **Bundle size**: What's the impact?
5. **Security**: Any known vulnerabilities?

### Tool Categories

| Category | Tool | Purpose |
|----------|------|---------|
| Bundler | Vite | Build and dev server |
| Testing | Vitest | Unit and integration tests |
| E2E | Playwright | End-to-end tests |
| Linting | ESLint | Code quality |
| Types | TypeScript | Type checking |
| Formatting | Prettier (optional) | Code formatting |
| Security | npm audit | Dependency scanning |

### Adding a New Tool

1. Research alternatives
2. Create ADR justifying the choice
3. Update package.json
4. Update CI pipeline if needed
5. Update `scripts/validate.sh` if needed
6. Document in README

---

## 7. Environment Management

### Environment Variables

```bash
# .env.example (committed)
VITE_API_URL=http://localhost:3000
VITE_FEATURE_FLAG=false

# .env (not committed)
VITE_API_URL=https://prod.example.com
VITE_FEATURE_FLAG=true
```

### CI Environment Variables

```yaml
# In GitHub Actions
env:
  NODE_ENV: production
  CI: true

# For secrets
- run: npm run build
  env:
    API_KEY: ${{ secrets.API_KEY }}
```

---

## 8. Dependency Management

### Adding Dependencies

```bash
# Production dependency
npm install package-name

# Development dependency
npm install --save-dev package-name
```

### Auditing Dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check outdated
npm outdated
```

### Lockfile

- **ALWAYS** commit `package-lock.json`
- Use `npm ci` in CI (not `npm install`)
- Pin exact versions for critical dependencies

---

## 9. Local Development Scripts

### Setup Script

```bash
#!/bin/bash
# scripts/setup.sh
# Run this after cloning the repo

set -e

echo "Setting up development environment..."

# Install dependencies
echo "Installing npm dependencies..."
npm ci

# Setup git hooks (if using)
echo "Setting up git hooks..."
# npx husky install

# Create local env file
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cp .env.example .env
fi

# Install Playwright browsers
echo "Installing Playwright browsers..."
npx playwright install

echo "Setup complete! Run 'npm run dev' to start."
```

### Quick Test Script

```bash
#!/bin/bash
# scripts/test-quick.sh
# Run quick tests for rapid feedback

set -e

echo "Running quick tests..."
npm run lint -- --max-warnings=0
npm run typecheck
npm run test -- --run --reporter=dot

echo "Quick tests passed!"
```

---

## 10. Debugging and Profiling

### Debug Scripts

```bash
#!/bin/bash
# scripts/debug-tests.sh
# Run tests with debugging enabled

DEBUG=true npm run test -- --run --reporter=verbose
```

### Performance Profiling

```bash
#!/bin/bash
# scripts/profile-build.sh
# Profile the build process

echo "Profiling build..."
time npm run build

# For more detailed profiling
npm run build -- --profile
```

---

## Summary

### Automation Checklist

- [ ] `scripts/validate.sh` exists and works
- [ ] All npm scripts are defined
- [ ] CI pipeline runs all validations
- [ ] New tools are documented in ADRs
- [ ] Scripts have proper error handling
- [ ] README documents how to use scripts

### Quick Reference Commands

```bash
# Full validation
./scripts/validate.sh

# Quick check
npm run lint && npm run typecheck

# Run tests
npm run test:coverage

# Build
npm run build

# E2E tests
npm run e2e
```

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Scripts](https://docs.npmjs.com/cli/v8/using-npm/scripts)
- [Bash Best Practices](https://bertvv.github.io/cheat-sheets/Bash.html)
- Related files:
  - [00-core-philosophy.md](./00-core-philosophy.md)
  - [01-research-and-web.md](./01-research-and-web.md)
  - [02-testing-and-validation.md](./02-testing-and-validation.md)
