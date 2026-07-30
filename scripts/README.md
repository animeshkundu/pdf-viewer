# Scripts

This directory contains automation scripts for development workflows.

## Available Scripts

### `validate.sh`

Full validation pipeline that runs all checks before committing.

**Usage:**
```bash
./scripts/validate.sh
```

**What it does:**
1. Runs ESLint for code quality
2. Runs TypeScript compiler for type checking
3. Runs Vitest with coverage reporting
4. Runs Vite build for production

**When to use:**
- Before every commit
- Before creating a pull request
- After major changes

## Creating New Scripts

When adding a new script:

1. Follow the template structure in `validate.sh`
2. Include proper error handling (`set -e`)
3. Add colored output for readability
4. Document the script's purpose
5. Make it executable (`chmod +x script.sh`)
6. Update this README

## Script Template

```bash
#!/bin/bash
# Description: What this script does
# Usage: ./scripts/script-name.sh [options]

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Starting task..."

# Your logic here

echo -e "${GREEN}Done!${NC}"
exit 0
```

## Related Documentation

- [docs/agent-instructions/03-tooling-and-pipelines.md](../docs/agent-instructions/03-tooling-and-pipelines.md) - Tooling philosophy
- [.github/workflows/ci.yml](../.github/workflows/ci.yml) - CI pipeline that runs these validations
