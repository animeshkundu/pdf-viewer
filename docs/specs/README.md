# Technical Specifications

## Overview

This directory contains Technical Specifications for features and components. **Before writing any code, agents and developers MUST write a specification here.**

## Purpose

Specifications ensure:
- Clear understanding of requirements before implementation
- Documentation of expected behavior
- Alignment between stakeholders
- A reference point during code review
- Historical record of feature intent

## The Spec-First Workflow

```
1. Receive task/feature request
         ↓
2. Research existing patterns and docs
         ↓
3. Write specification in docs/specs/
         ↓
4. Review and refine specification
         ↓
5. Implement code based on specification
         ↓
6. Update spec with any deviations
         ↓
7. Link spec in code comments/PR
```

## When to Create a Spec

Create a specification for:
- New features (any size)
- Significant refactors
- API changes
- Integration with external services
- Complex algorithms or business logic
- Performance-critical components

## Creating a New Spec

1. Create a new file: `YYYY-MM-DD-feature-name.md`
2. Use the template below
3. Fill out all applicable sections
4. Get review before implementation (if working in a team)
5. Reference the spec in your PR description

## Specification Template

```markdown
# Feature: [Feature Name]

## Metadata
- **Author**: [Name/GitHub handle]
- **Date**: YYYY-MM-DD
- **Status**: [Draft | In Review | Approved | Implemented]
- **Related ADRs**: [ADR-XXXX](../adrs/xxxx.md)

## Summary
One paragraph describing what this feature does.

## Motivation
Why is this feature needed? What problem does it solve?

## User Stories
As a [user type], I want [action] so that [benefit].

## Detailed Design

### Overview
High-level description of the approach.

### Components
List of components/files to be created or modified.

### Data Model
Any new types, interfaces, or data structures.

### API
Function signatures, props, events.

### UI/UX
Wireframes, user flows, accessibility considerations.

## Implementation Plan
1. Step 1
2. Step 2
3. Step 3

## Testing Strategy
- Unit tests for: [list]
- Integration tests for: [list]
- E2E tests for: [list]
- Edge cases to cover: [list]

## Security Considerations
Any security implications or mitigations.

## Performance Considerations
Expected performance impact and mitigations.

## Open Questions
- Question 1?
- Question 2?

## Out of Scope
What this feature explicitly does NOT include.

## References
- Links to research
- Related issues/PRs
- External documentation
```

## Spec Index

| Date | Feature | Status | Author |
|------|---------|--------|--------|
| _None yet_ | _Create your first spec!_ | - | - |

## Best Practices

### Writing Good Specs
1. **Be specific**: Vague specs lead to vague implementations
2. **Include examples**: Show expected inputs/outputs
3. **Consider edge cases**: Document how they should be handled
4. **Think about testing**: If you can't test it, reconsider the design
5. **Keep it updated**: Specs should reflect actual implementation

### Common Mistakes to Avoid
- ❌ Starting code before spec is reviewed
- ❌ Writing specs after implementation (unless documenting existing behavior)
- ❌ Being too vague about requirements
- ❌ Ignoring edge cases
- ❌ Forgetting security/accessibility requirements

## Spec Lifecycle

1. **Draft**: Initial writing, open for major changes
2. **In Review**: Being reviewed by team/stakeholders
3. **Approved**: Ready for implementation
4. **Implemented**: Code complete, spec may need minor updates
5. **Deprecated**: Feature removed, spec kept for history

## Linking Specs to Code

Always reference specs in your code:

```typescript
/**
 * Implements PDF page splitting functionality.
 * @see docs/specs/2025-01-15-pdf-splitting.md
 */
export function splitPDF(document: PDFDocument, pages: number[]): PDFDocument[] {
  // Implementation
}
```

And in PR descriptions:
```
## Description
Implements PDF splitting feature per specification.

## Specification
See: docs/specs/2025-01-15-pdf-splitting.md

## Changes
- Added splitPDF function in src/services/split.service.ts
- Added SplitDialog component
- Added unit and e2e tests
```

## Questions?

If unsure whether something needs a spec:
- **Yes**: If it takes more than a day to implement
- **Yes**: If it involves user-facing changes
- **Yes**: If it changes existing behavior
- **Maybe**: If it's a simple bug fix (use judgment)
- **No**: If it's purely a style/formatting change
