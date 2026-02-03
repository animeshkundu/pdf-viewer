# Claude Instructions for PDF Viewer & Editor

This file provides context and guidelines for Claude (and other AI assistants) when working on the PDF Viewer & Editor project.

> **IMPORTANT**: This file is synced with `.github/copilot-instructions.md`. Keep both files updated together.

---

## ⚠️ BEFORE ANSWERING ANY REQUEST

You **MUST** complete these steps before making any code changes:

### 1. Read Agent Instructions
```
docs/agent-instructions/00-core-philosophy.md   # Understand Docs=Code, CEO Model
docs/agent-instructions/01-research-and-web.md  # Understand research requirements
docs/agent-instructions/02-testing-and-validation.md  # Understand 90% coverage rule
docs/agent-instructions/03-tooling-and-pipelines.md   # Understand automation
```

### 2. Check Architecture Decisions
```
docs/adrs/                    # New AI-enabled ADR structure
docs/ADR/                     # Legacy ADRs (still valid)
```
Review relevant ADRs to avoid making decisions that contradict past choices.

### 3. Check Specifications
```
docs/specs/                   # Feature specifications
```
If a spec exists for your task, follow it. If not, create one before implementing.

### 4. Understand the Architecture
```
docs/architecture/            # System architecture
docs/ARCHITECTURE.md          # Legacy architecture doc
docs/TECHNICAL_SPEC.md        # Technical details
```

---

## Core Principles

### Documentation = Code
- **No code without documentation**: Write a spec in `docs/specs/` before implementing
- **No architectural change without ADR**: Create an ADR in `docs/adrs/` for significant decisions
- **Sync after changes**: Update documentation when code changes

### Research Before Coding
- **Use web search**: Find current best practices before implementing
- **Verify libraries**: Check for latest versions and security issues
- **Reach saturation**: Research until information stops being new

### Testing is Mandatory
- **90% coverage minimum**: All new code must have >90% test coverage
- **Test-Driven Development**: Write tests before or with implementation
- **Self-validate**: Run tests locally before committing

### Automate Everything
- **If done twice, script it**: Create shell scripts for repeated tasks
- **Use validation script**: Run `./scripts/validate.sh` before committing
- **CI/CD is truth**: All checks must pass in the pipeline

---

## Project Overview

This is a client-side PDF viewer and editor built with React + TypeScript, inspired by macOS Preview. All PDF processing happens in the browser with zero server dependencies.

**Key Technologies**:
- React 19 + TypeScript 5.7
- PDF.js (rendering) + pdf-lib (manipulation)
- Tailwind CSS + shadcn/ui components
- Vite for build tooling
- Vitest for testing, Playwright for E2E

---

## Quick Reference

### File Structure
```
src/
├── components/
│   ├── ui/              # shadcn components (don't modify)
│   └── ...              # Feature components
├── hooks/               # Custom hooks
├── services/            # Business logic (singleton pattern)
├── types/               # Type definitions
├── lib/                 # Utilities
└── styles/              # CSS

docs/
├── agent-instructions/  # READ THESE FIRST
├── adrs/                # New ADR structure
├── ADR/                 # Legacy ADRs
├── specs/               # Specifications
├── architecture/        # System design
└── history/             # Deprecated features

scripts/
└── validate.sh          # Run before committing
```

### Commands
```bash
npm run dev              # Development server
npm run build            # Production build
npm run lint             # Lint code
npm run typecheck        # Type check
npm run test             # Run tests
npm run test:coverage    # Tests with coverage
npm run e2e              # E2E tests
./scripts/validate.sh    # Full validation
```

### Code Style
- Use strict TypeScript (no `any` without justification)
- Functional components with hooks only
- Follow existing patterns in codebase
- Document complex logic

### Testing
- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts` in `e2e/` folder
- Target: >90% coverage

---

## When Modifying Code

### Before Starting
1. Read `docs/agent-instructions/`
2. Check `docs/adrs/` for relevant decisions
3. Check `docs/specs/` for existing specifications
4. Research best practices (web search)

### During Implementation
1. Create/update spec in `docs/specs/`
2. Write tests (TDD preferred)
3. Implement with minimal changes
4. Run `./scripts/validate.sh`

### After Completion
1. Update any affected documentation
2. Create ADR if architectural decision made
3. Update `docs/history/` if deprecating anything
4. Verify CI passes

---

## What NOT to Do

❌ Don't hallucinate APIs - verify they exist
❌ Don't skip writing specs
❌ Don't skip tests
❌ Don't ignore coverage requirements
❌ Don't modify shadcn components in `src/components/ui/`
❌ Don't make architectural changes without ADRs
❌ Don't commit without running validation

---

## Security Considerations

- Never send PDFs to external servers
- No tracking or analytics on document content
- Sanitize user input (annotations, text)
- Validate file types before processing
- Handle errors gracefully (no sensitive info in errors)

---

## Resources

- [PDF.js Docs](https://mozilla.github.io/pdf.js/)
- [pdf-lib Docs](https://pdf-lib.js.org/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Remember**: This is a privacy-focused, client-side application. Every decision should prioritize user privacy, performance, and code quality. When unsure, search the internet—do not hallucinate APIs or patterns.
