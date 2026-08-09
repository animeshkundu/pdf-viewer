# Claude Code Instructions for PDF Viewer & Editor

## Before ANY Task

You MUST read the following documentation in order:

1. `docs/agent-instructions/00-core-philosophy.md` - Core principles
2. `docs/agent-instructions/01-research-and-web.md` - Research requirements
3. `docs/agent-instructions/02-testing-and-validation.md` - Testing standards
4. `docs/agent-instructions/03-tooling-and-pipelines.md` - Tooling guidelines

## Critical Rules

### 1. Documentation First

- Check `docs/specs/` for existing specifications before implementing
- Write a spec in `docs/specs/` BEFORE writing new feature code
- Update `docs/history/` after completing significant work

### 2. Check Past Decisions

- Review `docs/ADR/` for architectural decisions
- Do NOT contradict existing ADRs without explicit approval
- Create new ADR if making architectural changes

### 3. Research Before Implementing

- Use web search for current best practices
- Validate library versions and APIs via search
- Do NOT hallucinate APIs - verify everything
- Document research findings in ADRs when significant

### 4. Testing is Mandatory

- Maintain 90%+ code coverage
- Write tests WITH or BEFORE implementation
- Run `./scripts/validate.sh` before every commit
- Never commit with failing tests

### 5. Self-Validation

Before marking any task complete:

```bash
./scripts/validate.sh
```

This runs lint, typecheck, and tests. ALL must pass.

## Project Context

### Tech Stack

- **Framework:** React 19 + TypeScript 5.7
- **Build:** Vite 7
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **PDF:** PDF.js (rendering) + pdf-lib (manipulation)
- **Testing:** Vitest (unit) + Playwright (E2E)
- **State:** React Context + React Query

### Key Patterns

- Service-singleton pattern for business logic
- Custom hooks wrap services for React integration
- All services in `src/services/`
- All hooks in `src/hooks/`
- All components in `src/components/`

### Important Files

| File | Purpose |
|------|---------|
| `docs/AGENT.md` | Development patterns and critical fixes |
| `docs/llm-guide/SELECTORS.md` | UI test selectors reference |
| `docs/architecture/OVERVIEW.md` | System architecture |
| `docs/architecture/SERVICES.md` | Service API reference |

## Quick Reference

### Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Unit tests
npm run e2e          # E2E tests
npm run lint         # Lint check
npm run typecheck    # Type check
./scripts/validate.sh # All validation
```

### Directory Structure

```
src/
├── components/      # React components
│   └── ui/         # shadcn components
├── services/       # Business logic
├── hooks/          # Custom React hooks
├── types/          # TypeScript types
└── lib/            # Utilities
```

## Delegation Model

When delegating to sub-agents:

1. Provide full context from this file
2. Reference specific docs they need
3. Require validation before completion
4. Synthesize results carefully

## Related Documentation

- [Agent Instructions](docs/agent-instructions/) - Detailed protocols
- [Architecture Decision Records](docs/ADR/) - Past decisions
- [Technical Specifications](docs/specs/) - Feature specs
- [Copilot Instructions](.github/copilot-instructions.md) - GitHub Copilot config
