# Agent Instructions

## Overview

This directory contains critical instruction files for AI agents working on this repository. **All agents MUST read these files before making any changes.**

## Purpose

These instructions establish:
- Core development philosophy
- Research and validation protocols
- Testing requirements
- Tooling and automation standards

## Instruction Files

| File | Purpose |
|------|---------|
| [00-core-philosophy.md](./00-core-philosophy.md) | Fundamental principles: Docs=Code, CEO Model, First Principles |
| [01-research-and-web.md](./01-research-and-web.md) | Internet research protocols and validation |
| [02-testing-and-validation.md](./02-testing-and-validation.md) | Testing requirements (90% coverage) and TDD |
| [03-tooling-and-pipelines.md](./03-tooling-and-pipelines.md) | Tool creation and CI/CD standards |

## Reading Order

1. **00-core-philosophy.md** - Understand the fundamental approach
2. **01-research-and-web.md** - Know how to research before coding
3. **02-testing-and-validation.md** - Understand testing requirements
4. **03-tooling-and-pipelines.md** - Know how to automate your work

## Quick Reference for Agents

### Before Starting Any Task
```
1. Read docs/agent-instructions/* (if not already done)
2. Check docs/adrs/ for relevant architectural decisions
3. Check docs/specs/ for existing specifications
4. Review related code and tests
5. Research best practices (see 01-research-and-web.md)
```

### During Implementation
```
1. Write/update specification in docs/specs/
2. Follow TDD: Write tests first
3. Implement minimal changes
4. Self-validate: Run tests locally
5. Document decisions in ADRs if architectural
```

### After Completion
```
1. Ensure >90% test coverage for new code
2. Update docs/history/ if deprecating anything
3. Update relevant documentation
4. Verify CI passes
5. Create summary of changes
```

## For Human Developers

These instructions are written for AI agents but apply equally to human developers. Following these protocols ensures:
- Consistent code quality
- Comprehensive documentation
- Maintainable codebase
- Knowledge preservation

## Updating These Instructions

When updating agent instructions:
1. Discuss changes with the team
2. Update all relevant files consistently
3. Update root context files (`.github/copilot-instructions.md`, `claude.md`)
4. Consider creating an ADR for significant changes
