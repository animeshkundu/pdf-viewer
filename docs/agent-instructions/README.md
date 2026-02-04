# Agent Instructions

This directory contains the core protocols and philosophy that ALL AI agents must follow when working on this repository.

## Required Reading Order

Before performing ANY task, agents MUST read these files in order:

1. **[00-core-philosophy.md](./00-core-philosophy.md)** - Foundational principles
2. **[01-research-and-web.md](./01-research-and-web.md)** - Research requirements
3. **[02-testing-and-validation.md](./02-testing-and-validation.md)** - Quality standards
4. **[03-tooling-and-pipelines.md](./03-tooling-and-pipelines.md)** - Automation guidelines

## Quick Reference

| Principle | Requirement |
|-----------|-------------|
| Documentation | Write spec BEFORE code |
| Research | Search internet BEFORE implementing |
| Testing | Maintain 90%+ code coverage |
| Validation | Run `./scripts/validate.sh` before committing |
| History | Update `docs/history/` after completing work |

## Related Documentation

- [Architecture Decision Records](../ADR/) - Past architectural decisions
- [Technical Specifications](../specs/) - Feature specifications
- [Architecture Overview](../architecture/) - System design
- [Agent Development Guide](../AGENT.md) - Development patterns
