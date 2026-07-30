# Architecture Decision Records (ADRs)

## Overview

This directory contains Architecture Decision Records (ADRs) for the PDF Viewer & Editor project. ADRs document significant architectural and design decisions made during development.

> **Note**: This directory (`docs/adrs/`) follows the AI-Enabled repository structure. Legacy ADRs may also exist in `docs/ADR/` and `docs/adr/`.

## Purpose

ADRs capture the "why" behind architectural decisions, helping future developers (and AI agents) understand:
- The context and constraints at the time of the decision
- Alternatives that were considered
- Trade-offs that were accepted
- The reasoning process

## When to Create an ADR

Create an ADR when:
- Making significant architectural decisions
- Choosing between multiple viable technical approaches
- Selecting libraries, frameworks, or tools
- Establishing coding patterns or conventions
- Changing existing architectural patterns
- Making decisions that will impact future development

## Creating a New ADR

1. Copy `0000-template.md` to a new file with the next sequential number
2. Fill out all sections thoughtfully
3. Submit for review if working in a team
4. Update the index below once accepted

## ADR Index

| Number | Title | Status | Date |
|--------|-------|--------|------|
| [0000](0000-template.md) | ADR Template | Template | - |

> See also: [../ADR/README.md](../ADR/README.md) for additional ADRs

## Best Practices

### Writing Good ADRs
1. **Be concise**: 1-2 pages is usually sufficient
2. **Focus on "why"**: Explain the reasoning, not just the solution
3. **Document alternatives**: Show what was considered and rejected
4. **Be honest about trade-offs**: Every decision has pros and cons
5. **Use plain language**: Avoid unnecessary jargon
6. **Link to references**: Provide context and supporting materials

### ADR Lifecycle
- **Proposed**: Under consideration
- **Accepted**: Approved and being implemented
- **Deprecated**: No longer valid but kept for historical context
- **Superseded**: Replaced by a newer ADR (link to replacement)

### Rules
- Never delete ADRs
- Never modify the decision in an accepted ADR
- If a decision changes, create a new ADR and mark the old one as "Superseded"

## Resources

- [Architecture Decision Records](https://adr.github.io/) - Official ADR website
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Original article by Michael Nygard
