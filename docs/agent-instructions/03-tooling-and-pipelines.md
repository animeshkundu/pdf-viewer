# Tooling and Pipelines

## 1. Tool Creation Rule

**Principle:** If you perform a verification task twice, automate it.

### When to Create a Tool

- Repeated manual steps
- Complex command sequences
- Validation that should be consistent
- Setup procedures

### Tool Location

```
scripts/
├── validate.sh      # Pre-commit validation
├── setup.sh         # Development environment setup
├── test-e2e.sh      # E2E test runner with options
└── [new-tool].sh    # Your automation
```

### Tool Standards

1. **Shebang and set flags:**
   ```bash
   #!/bin/bash
   set -euo pipefail
   ```

2. **Help documentation:**
   ```bash
   if [[ "${1:-}" == "--help" ]]; then
     echo "Usage: $0 [options]"
     echo "Description of what this does"
     exit 0
   fi
   ```

3. **Exit codes:**
   - 0: Success
   - 1: General error
   - 2: Usage error

4. **Logging:**
   ```bash
   echo "[INFO] Starting process..."
   echo "[ERROR] Something failed" >&2
   ```

## 2. CI/CD Priority

**Principle:** GitHub Actions is the source of truth for build/test/deploy.

### Pipeline Structure

```yaml
# .github/workflows/ci.yml
jobs:
  lint:        # Code quality
  typecheck:   # Type safety
  build:       # Production build
  test:        # Unit tests + coverage
  e2e:         # End-to-end tests
  deploy:      # Deployment (on main)
```

### Job Dependencies

```
lint ──────┬──► build ──► e2e ──► deploy
typecheck ─┘       │
                   └──► test
```

### Adding New CI Steps

When adding automation:

1. **Prefer CI over local scripts** for:
   - Security scanning
   - Dependency audits
   - Coverage enforcement
   - Deployment

2. **Use local scripts** for:
   - Quick validation
   - Development workflows
   - Debugging

3. **Both** for:
   - Linting (fast feedback locally, enforced in CI)
   - Testing (develop locally, validate in CI)

## 3. Available Tools

### Validation Script

```bash
./scripts/validate.sh
```

Runs:
- `npm run lint` - ESLint
- `npm run typecheck` - TypeScript
- `npm run test` - Vitest

Use before every commit.

### NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run test:ui` | Test UI |
| `npm run test:coverage` | Tests with coverage |
| `npm run e2e` | Playwright tests |
| `npm run e2e:ui` | Playwright UI mode |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

### Git Hooks (Recommended)

Consider setting up:
```bash
# .husky/pre-commit
./scripts/validate.sh
```

## 4. Debugging Workflows

### Local Debugging

```bash
# Run specific test file
npm run test -- src/services/__tests__/pdf.service.test.ts

# Run tests in watch mode
npm run test -- --watch

# Run E2E with UI
npm run e2e:ui

# Debug E2E
npm run e2e -- --debug
```

### CI Debugging

1. **Check logs:** GitHub Actions → Failed job → View logs
2. **Reproduce locally:** Use exact same commands from CI
3. **Use artifacts:** Download test reports, screenshots

### Common Issues

| Issue | Solution |
|-------|----------|
| Tests pass locally, fail in CI | Check Node version, clean install |
| E2E flaky | Add proper waits, check selectors |
| Build fails | Check for missing dependencies |
| Type errors | Run `npm run typecheck` locally |

## 5. Environment Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Git

### Initial Setup

```bash
# Clone and install
git clone <repo>
cd pdf-viewer
npm ci

# Verify setup
./scripts/validate.sh

# Start development
npm run dev
```

### IDE Configuration

**VSCode recommended extensions:**
- ESLint
- TypeScript
- Tailwind CSS IntelliSense
- Playwright Test for VSCode

**Settings (`.vscode/settings.json`):**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 6. Dependency Management

### Adding Dependencies

1. **Research first** (see `01-research-and-web.md`)
2. **Check bundle size:** https://bundlephobia.com/
3. **Check maintenance:** Recent commits, open issues
4. **Install:**
   ```bash
   npm install <package>
   ```
5. **Document:** If significant, create ADR

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update (careful)
npm update

# Audit for security
npm audit
```

### Dependabot

Automated PRs for dependency updates via `.github/dependabot.yml`.

Review carefully before merging - check changelogs for breaking changes.
