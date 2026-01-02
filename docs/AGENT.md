# Agent Development Guide

## Overview

This document provides comprehensive guidance for AI agents (LLMs, Copilot, etc.) working on the PDF Viewer & Editor project. All agents should read this document and the `docs/` folder contents before making any changes.

---

## ⚠️ MANDATORY: Pre-PR Validation Requirements

**Before raising any PR or marking work as complete, ALL of the following checks MUST pass with ZERO ERRORS:**

```bash
# 1. Lint - MUST have 0 errors
npm run lint

# 2. TypeScript type checking - MUST pass with no errors
npm run typecheck

# 3. Build - MUST complete successfully
npm run build

# 4. Unit tests - ALL tests MUST pass
npm run test -- --run

# 5. E2E tests - ALL tests MUST pass
npm run e2e
```

**This is non-negotiable.** A PR or task completion with failing checks is considered incomplete and will be rejected.

⚠️ **Note**: Lint warnings are acceptable, but lint errors are not. TypeScript errors, build failures, and test failures of any kind are blockers.

---

## Critical: Recent Fixes and Known Patterns

### Text Layer Implementation (ADR-009)
**What**: An invisible text layer overlays the PDF canvas to enable text selection and highlighting.

**Key Points**:
- Text must be selectable for copying and highlighting
- Layer uses transparent text positioned to overlay canvas rendering
- Z-index management: Text layer (10/20) < Drawing layer (5/30)
- Highlight tool works via text selection, not drawing
- See `src/components/PDFViewer/PDFTextLayer.tsx`
- See `docs/ADR/ADR-009-text-layer-implementation.md`

**Common Mistakes to Avoid**:
- ❌ Don't block text selection with pointer-events: none
- ❌ Don't try to make highlights via SVG drawing (use text selection)
- ❌ Don't forget to apply proper scaling to text positions
- ❌ Don't remove or modify the text layer without understanding implications

### Search Highlighting Precision
**What**: Search highlights individual matched words, not entire text blocks.

**Key Points**:
- `calculateBoundingBoxes()` computes character-level positions
- Calculates character width: `totalWidth / textLength`
- Applies precise offsets and widths for each match
- See `src/services/search.service.ts`

**Common Mistakes to Avoid**:
- ❌ Don't return full text item widths (will highlight entire blocks)
- ❌ Don't forget to apply scale transformations correctly
- ❌ Don't modify search service without understanding coordinate systems

### Layer Stack and Z-Index
All overlays on the PDF canvas follow this strict z-index hierarchy:
```
Annotation Drawing (z: 30 when drawing, 5 otherwise)
  ↑
Text Layer (z: 20 in highlight mode, 10 otherwise)
  ↑
Annotation Layer (z: auto)
  ↑
Search Highlights (z: auto)
  ↑
Canvas (z: 0)
```

**Common Mistakes to Avoid**:
- ❌ Don't change z-index without understanding the full stack
- ❌ Don't block pointer events on text layer (needed for selection)
- ❌ Don't let drawing layer block text layer when highlighting

---

## Pre-Work: Read These Documents First

Before starting any work, **ALWAYS** review:

1. **`docs/README.md`** - Documentation index and overview
2. **`PRD.md`** - Product requirements and feature specifications
3. **`docs/ARCHITECTURE.md`** - System architecture and design patterns
4. **`docs/TECHNICAL_SPEC.md`** - Technical implementation details
5. **`docs/DESIGN_SYSTEM.md`** - UI/UX guidelines and component library
6. **`docs/ADR/`** - Architecture Decision Records (understand why choices were made)
7. **`docs/history/`** - Deprecated features and migration notes

---

## Development Workflow

### 1. Understanding the Task

- Read the user's request carefully
- Check if related ADRs exist in `docs/ADR/`
- Review relevant sections of technical documentation
- Check `docs/history/` for any deprecated patterns to avoid

### 2. Planning Changes

Before implementing:
- Identify which components/services are affected
- Consider architectural implications (document as ADR if significant)
- Plan test coverage (unit + E2E)
- Identify documentation updates needed

### 3. Implementation Standards

#### Code Quality
- **TypeScript**: Use strict typing, no `any` types without justification
- **React**: Use functional components with hooks
- **Naming**: Clear, descriptive names (no abbreviations except standard ones)
- **Comments**: Only when code intent is not self-evident
- **Formatting**: Follows project ESLint/Prettier configuration

#### Testing Requirements
Every change MUST include:
- **Unit Tests**: Test individual functions/components in isolation
- **E2E Tests**: Test complete user workflows
- **Coverage**: Maintain >90% code coverage at all times
- **Test Quality**: Tests should be readable, maintainable, and test behavior not implementation

**Testing Framework**:
```bash
# Unit tests with Vitest
npm run test:unit

# E2E tests with Playwright (when configured)
npm run test:e2e

# Coverage report
npm run test:coverage
```

**Test File Locations**:
- Unit tests: `src/**/__tests__/*.test.tsx` or co-located `*.test.tsx`
- E2E tests: `tests/e2e/**/*.spec.ts`
- Test utilities: `tests/utils/`

**Coverage Requirements**:
- Line coverage: >90%
- Branch coverage: >85%
- Function coverage: >90%
- Statement coverage: >90%

### 4. Build and Validation (MANDATORY - ZERO ERRORS REQUIRED)

**⚠️ CRITICAL: ALL of the following commands MUST pass with ZERO ERRORS before raising any PR or marking work complete:**

```bash
# 1. Lint code - MUST have 0 errors (warnings are acceptable)
npm run lint

# 2. Type checking - MUST pass with no errors
npm run typecheck

# 3. Build - MUST complete successfully
npm run build

# 4. Run unit tests - ALL tests MUST pass
npm run test -- --run

# 5. Run E2E tests - ALL tests MUST pass
npm run e2e

# 6. (Optional) Check coverage
npm run test:coverage
```

**A PR with ANY of the following is considered INCOMPLETE and will be REJECTED:**
- ❌ Lint errors (warnings are OK)
- ❌ TypeScript type errors
- ❌ Build failures
- ❌ Failing unit tests
- ❌ Failing E2E tests

**Fix all errors before submitting**. If errors cannot be resolved:
- Document the issue clearly
- Explain attempted solutions
- Provide recommendations for resolution
- Do NOT submit the PR as complete

### 5. Documentation Updates

Update relevant documentation for every change:

#### Always Update:
- **Code comments** (when adding complex logic)
- **Type definitions** (when changing interfaces)
- **README.md** (when adding new features)

#### Update When Relevant:
- **`docs/ARCHITECTURE.md`** - For structural changes
- **`docs/TECHNICAL_SPEC.md`** - For implementation details
- **`docs/USER_WORKFLOWS.md`** - For UX changes
- **`docs/DESIGN_SYSTEM.md`** - For UI component changes

#### Create New ADR When:
- Making significant architectural decisions
- Choosing between multiple viable approaches
- Changing existing architectural patterns
- Adding new libraries or dependencies
- Modifying build/deployment processes

#### Update History When:
- Deprecating a feature
- Removing a component
- Changing a public API
- Migrating from one pattern to another

---

## Architecture Decision Records (ADRs)

### When to Create an ADR

Create an ADR for any decision that:
- Affects system architecture or structure
- Impacts multiple components or services
- Introduces new technologies or libraries
- Changes development workflows or processes
- Has long-term consequences
- Involves trade-offs between alternatives

### ADR Format

Use this template (save in `docs/ADR/NNNN-short-title.md`):

```markdown
# ADR-NNNN: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-XXXX]

## Date
YYYY-MM-DD

## Context
What is the issue we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?

### Positive
- Benefit 1
- Benefit 2

### Negative
- Trade-off 1
- Trade-off 2

### Neutral
- Other impact 1

## Alternatives Considered
What other options were evaluated?

### Alternative 1: [Name]
- Description
- Pros
- Cons
- Why rejected

## Implementation Notes
Any specific guidance for implementing this decision.

## References
- Links to relevant documentation
- Related ADRs
- External resources
```

### ADR Numbering
- Use sequential numbering: `0001`, `0002`, etc.
- Check existing ADRs to find next number
- Never reuse numbers

### Example ADRs to Create:
- Using PDF.js for rendering
- Choosing pdf-lib for manipulation
- Virtualized rendering approach
- Annotation data structure design
- State management strategy
- Testing framework selection

---

## History Documentation

### When to Document in History

Add to `docs/history/` when:
- Deprecating a feature
- Removing a component or service
- Changing a public API
- Migrating from one technology to another
- Removing a dependency

### History Entry Format

Create file: `docs/history/YYYY-MM-DD-feature-name.md`

```markdown
# [Feature/Component Name] - Deprecated

## Deprecation Date
YYYY-MM-DD

## Reason for Deprecation
Why was this feature/component removed or changed?

## What It Did
Brief description of the feature's functionality.

## Replacement
What should be used instead? How to migrate?

## Migration Guide
Step-by-step instructions if applicable.

## Code Location (Historical)
Where the code used to live (for git history reference).

## Related ADRs
- ADR-XXXX: [Related decision]

## References
- PR #XXX
- Issue #XXX
```

---

## Common Patterns and Best Practices

### State Management
- Use React Context for global state (PDF document, annotations)
- Use local useState for component-specific state
- Use Spark KV for persistent data (signatures, preferences)
- Use useReducer for complex state logic with multiple actions

### Performance
- Virtualize long lists (PDF pages, thumbnails)
- Lazy load non-critical components
- Memoize expensive calculations with useMemo
- Debounce user input (search, text entry)
- Use Web Workers for CPU-intensive operations (PDF parsing)

### Error Handling
- Use Error Boundaries for component errors
- Provide user-friendly error messages
- Log errors for debugging (but never log sensitive data)
- Always have fallback UI for error states

### Accessibility
- Use semantic HTML elements
- Provide ARIA labels where needed
- Support keyboard navigation (all features)
- Maintain sufficient color contrast (WCAG AA)
- Test with screen readers

### Testing Patterns
```typescript
// Unit test example
describe('PDFService', () => {
  it('should load document successfully', async () => {
    const file = new File(['...'], 'test.pdf', { type: 'application/pdf' })
    const doc = await PDFService.loadDocument(file)
    expect(doc).toBeDefined()
    expect(doc.numPages).toBeGreaterThan(0)
  })
})

// E2E test example
test('user can open and view PDF', async ({ page }) => {
  await page.goto('http://localhost:5000')
  await page.setInputFiles('input[type="file"]', 'test.pdf')
  await expect(page.locator('.pdf-canvas')).toBeVisible()
  await expect(page.locator('.page-counter')).toContainText('1')
})
```

---

## File Organization

### Directory Structure
```
src/
├── components/          # React components
│   ├── ui/             # shadcn components (DO NOT MODIFY)
│   ├── PDFViewer/      # PDF viewing components
│   ├── Toolbar/        # Toolbar components
│   └── ...
├── hooks/              # Custom React hooks
├── services/           # Business logic (PDF, annotations, etc.)
├── types/              # TypeScript type definitions
├── lib/                # Utility functions
└── styles/             # CSS/styling

docs/
├── ADR/                # Architecture Decision Records
├── history/            # Deprecated features
├── README.md           # Documentation index
├── ARCHITECTURE.md     # System architecture
├── TECHNICAL_SPEC.md   # Technical details
├── DESIGN_SYSTEM.md    # UI/UX guidelines
└── ...

tests/
├── unit/               # Unit tests
├── e2e/                # End-to-end tests
└── utils/              # Test utilities
```

### Naming Conventions
- **Components**: PascalCase (`PDFViewer.tsx`)
- **Hooks**: camelCase with `use` prefix (`usePDF.ts`)
- **Services**: PascalCase with `.service.ts` suffix (`pdf.service.ts`)
- **Types**: PascalCase with `.types.ts` suffix (`pdf.types.ts`)
- **Utilities**: camelCase (`formatPageNumber.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ZOOM_LEVEL`)

---

## Key Technologies

### PDF Libraries
- **PDF.js** (v5.4.449): Rendering PDF pages to canvas
- **pdf-lib** (v1.17.1): Creating/modifying PDF documents

### React Ecosystem
- **React 19**: UI framework
- **TypeScript 5.7**: Type safety
- **Vite 7**: Build tool and dev server

### UI Components
- **shadcn/ui**: Pre-built accessible components
- **Tailwind CSS 4**: Utility-first styling
- **Phosphor Icons**: Icon library
- **Framer Motion**: Animations (use sparingly)

### Testing
- **Vitest**: Unit testing framework
- **@testing-library/react**: React component testing
- **Playwright** (to be configured): E2E testing

### Utilities
- **Spark KV**: Client-side key-value storage
- **sonner**: Toast notifications
- **zod**: Runtime type validation

---

## Common Tasks

### Adding a New Feature

1. **Research**: Check PRD, existing code, and ADRs
2. **Design**: Plan component structure and data flow
3. **ADR**: Create ADR if architecturally significant
4. **Implement**: Write code following patterns above
5. **Test**: Write unit tests (>90% coverage)
6. **E2E**: Add end-to-end test for user workflow
7. **Document**: Update relevant docs
8. **Validate**: Run build, lint, all tests
9. **Review**: Self-review checklist (see below)

### Fixing a Bug

1. **Reproduce**: Understand the bug and create minimal reproduction
2. **Root Cause**: Identify the underlying issue
3. **Test First**: Write failing test that captures the bug
4. **Fix**: Implement the fix
5. **Verify**: Ensure test passes, no regressions
6. **Document**: Add comments if fix is non-obvious
7. **Update**: Update docs if bug was due to misunderstanding

### Refactoring Code

1. **Tests**: Ensure good test coverage before refactoring
2. **ADR**: Document decision if changing architectural patterns
3. **Small Steps**: Make incremental changes
4. **Run Tests**: After each change, ensure tests pass
5. **Document**: Update technical docs for significant refactors
6. **History**: Document deprecated patterns in history/

### Updating Dependencies

1. **Check**: Review changelog for breaking changes
2. **Update**: Update package.json
3. **Test**: Run full test suite
4. **Update Code**: Fix any breaking changes
5. **Document**: Note significant updates in CHANGELOG or ADR
6. **Verify**: Run build, lint, tests

---

## Self-Review Checklist

Before marking work as complete:

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Follows project coding conventions
- [ ] No console.log or debugger statements
- [ ] Proper error handling
- [ ] No hardcoded values (use constants)

### Testing
- [ ] Unit tests written for new code
- [ ] E2E test covers user workflow
- [ ] All tests pass
- [ ] Coverage >90%
- [ ] Tests are maintainable and readable
- [ ] Edge cases tested

### Documentation
- [ ] Code comments for complex logic
- [ ] README updated if needed
- [ ] Relevant docs updated
- [ ] ADR created if needed
- [ ] History entry if deprecating

### Build & Validation
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run test:unit` passes
- [ ] `npm run test:e2e` passes
- [ ] No console errors in browser

### User Experience
- [ ] Feature works as expected
- [ ] Keyboard navigation works
- [ ] Mobile responsive (if applicable)
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Accessibility considered

---

## Troubleshooting

### Build Failures
1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Check TypeScript errors: `npm run build`
3. Review recent changes for type issues

### Test Failures
1. Run single test: `npm run test:unit -- path/to/test.test.tsx`
2. Check test isolation (tests should not depend on each other)
3. Verify test data and mocks

### Linting Issues
1. Auto-fix: `npm run lint -- --fix`
2. Review ESLint rules in `eslint.config.js`
3. Document exceptions with inline comments (rare)

### Runtime Errors
1. Check browser console for errors
2. Verify all dependencies are installed
3. Check for version mismatches
4. Review recent changes

---

## Resources

### Internal Documentation
- PRD: `/PRD.md`
- Architecture: `/docs/ARCHITECTURE.md`
- Technical Spec: `/docs/TECHNICAL_SPEC.md`
- Design System: `/docs/DESIGN_SYSTEM.md`

### External Resources
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

## Contact and Questions

For questions about:
- **Architecture**: Review ADRs and ARCHITECTURE.md
- **Features**: Check PRD.md and USER_WORKFLOWS.md
- **Design**: See DESIGN_SYSTEM.md
- **Testing**: See test examples in `/tests` directory

When in doubt:
1. Read the documentation first
2. Check existing code for patterns
3. Review related ADRs
4. Make conservative changes
5. Document your decisions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-XX | Initial agent guide created |

---

**Remember**: Quality over speed. Take time to understand the codebase, follow patterns, write tests, and document decisions. Good documentation today saves hours of debugging tomorrow.
