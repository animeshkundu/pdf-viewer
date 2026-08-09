# Technical Specifications

This directory contains technical specifications for features and changes.

## The Specs-Before-Code Workflow

**Principle:** Every non-trivial feature must have a specification written BEFORE implementation begins.

### When a Spec is Required

- New features
- Significant refactoring
- API changes
- Architecture changes
- Complex bug fixes

### When a Spec is NOT Required

- Typo fixes
- Simple bug fixes with obvious solutions
- Documentation updates
- Dependency updates

## Writing a Specification

1. Copy `0000-template.md` to a new file with the next number
2. Fill in all sections
3. Get review/approval before implementing
4. Update spec if implementation diverges

## Specification Lifecycle

```
Draft → Review → Approved → Implementing → Complete
```

### Status Definitions

| Status | Meaning |
|--------|---------|
| Draft | Work in progress, not ready for review |
| Review | Ready for feedback |
| Approved | Ready for implementation |
| Implementing | Currently being built |
| Complete | Implementation done |
| Superseded | Replaced by newer spec |

## File Naming

```
NNNN-short-description.md
```

Examples:
- `0001-annotation-export.md`
- `0002-dark-mode-support.md`
- `0003-keyboard-navigation.md`

## Current Specifications

<!-- Add links to specs as they are created -->

_No specifications yet. Create one using the template!_
