# Core Philosophy

## Fundamental Principles for AI-Enabled Development

This document establishes the foundational principles that govern all development work in this repository. Every agent and developer MUST internalize these principles before making changes.

---

## 1. Docs = Code

### The Principle
Documentation is not an afterthought—it is the source of truth. **No code is written without updating documentation first.**

### What This Means
- Before implementing a feature, write a specification in `docs/specs/`
- Before making an architectural decision, create an ADR in `docs/adrs/`
- When code and docs disagree, the docs are authoritative
- Outdated documentation is a bug, just like broken code

### Workflow
```
Documentation → Implementation → Verification → Update Docs if Needed
```

### Anti-Patterns to Avoid
- ❌ "I'll document it later"
- ❌ Writing code without a spec
- ❌ Making architectural changes without an ADR
- ❌ Leaving documentation out of sync with code

---

## 2. The Sync Protocol

### The Principle
After completing any work, you MUST synchronize documentation with reality.

### What to Update

| If You Did This | Update This |
|-----------------|-------------|
| Implemented a feature | `docs/specs/` - mark as Implemented |
| Made an architectural decision | `docs/adrs/` - create or update ADR |
| Deprecated/removed code | `docs/history/` - create history entry |
| Changed an API | Update relevant spec and code comments |
| Fixed a bug | Update any affected documentation |

### History Recording
When deprecating or removing functionality:
1. Create an entry in `docs/history/`
2. Document what was removed and why
3. Provide migration path if applicable
4. Reference in the ADR if architectural

---

## 3. The CEO Model

### The Principle
In agentic workflows, the **initiating agent is the CEO**. Sub-agents are workers with specific responsibilities.

### Role Hierarchy

```
┌─────────────────────────────────────┐
│           CEO Agent                 │
│  (Orchestrates, delegates, reviews) │
└─────────────────────────────────────┘
        ↓           ↓           ↓
┌───────────┐ ┌───────────┐ ┌───────────┐
│  Worker   │ │  Worker   │ │  Worker   │
│ (Research)│ │  (Code)   │ │  (Test)   │
└───────────┘ └───────────┘ └───────────┘
```

### CEO Responsibilities
- Understand the full context of the task
- Break down work into sub-tasks
- Delegate to appropriate sub-agents
- Review and integrate sub-agent work
- Ensure documentation sync
- Make final decisions

### Worker Responsibilities
- Execute assigned tasks within scope
- Report completion and any blockers
- Do NOT expand scope without CEO approval
- Follow all protocols in this directory
- Validate own work before reporting complete

### Communication Protocol
1. CEO defines task clearly with context
2. Worker acknowledges understanding
3. Worker executes and self-validates
4. Worker reports completion with summary
5. CEO reviews and integrates

---

## 4. First Principles Thinking

### The Principle
Before implementing anything, reason from first principles. Don't copy-paste patterns blindly.

### The Process

```
1. DEFINE: What problem are we solving?
         ↓
2. DECOMPOSE: What are the fundamental requirements?
         ↓
3. RESEARCH: What solutions exist? (See 01-research-and-web.md)
         ↓
4. REASON: Which approach best fits our constraints?
         ↓
5. PLAN: Create step-by-step implementation plan
         ↓
6. IMPLEMENT: Execute the plan
         ↓
7. VALIDATE: Test against original requirements
```

### Questions to Ask
- **Why** are we doing this? (Motivation)
- **What** are the constraints? (Boundaries)
- **How** does this fit with existing architecture? (Integration)
- **What if** this fails? (Error handling)
- **How do we know** it works? (Testing)

### Deep Thinking Requirements
- Take time to analyze before acting
- Consider multiple approaches
- Document your reasoning in specs/ADRs
- Question assumptions
- Consider long-term implications

---

## 5. The Documentation Hierarchy

### Reading Order for Any Task

```
1. docs/agent-instructions/  → Understand how to work
2. docs/adrs/               → Understand past decisions
3. docs/specs/              → Understand feature requirements
4. docs/architecture/       → Understand system design
5. Related source code      → Understand implementation
6. docs/history/            → Understand what was deprecated
```

### Writing Requirements

| Document Type | When to Write | Before or After Code |
|--------------|---------------|---------------------|
| Spec | New feature, major change | BEFORE |
| ADR | Architectural decision | BEFORE |
| Code comments | Implementation details | WITH |
| History | Deprecation, removal | AFTER (before delete) |

---

## 6. The Quality Gates

### Every Change Must Pass

1. **Specification Exists**: Feature is documented in `docs/specs/`
2. **Tests Exist**: Coverage >90% (see 02-testing-and-validation.md)
3. **CI Passes**: All automated checks green
4. **Docs Synced**: Documentation matches implementation
5. **Review Complete**: Changes reviewed (by human or CEO agent)

### Definition of Done

A task is complete when:
- [ ] Specification exists and is marked as Implemented
- [ ] Code implements the specification
- [ ] Tests verify the implementation (>90% coverage)
- [ ] Documentation is updated
- [ ] CI pipeline passes
- [ ] No regressions introduced

---

## Summary Checklist

Before making ANY change:
- [ ] I have read the agent instructions
- [ ] I have checked relevant ADRs
- [ ] I have written/updated the spec (if applicable)
- [ ] I understand the existing architecture

After making changes:
- [ ] I have written tests (>90% coverage)
- [ ] I have run tests locally
- [ ] I have updated documentation
- [ ] I have created ADR (if architectural)
- [ ] I have updated history (if deprecating)

---

## References

- [Docs as Code](https://www.writethedocs.org/guide/docs-as-code/)
- [Architecture Decision Records](https://adr.github.io/)
- [First Principles Thinking](https://fs.blog/first-principles/)
- Related files:
  - [01-research-and-web.md](./01-research-and-web.md)
  - [02-testing-and-validation.md](./02-testing-and-validation.md)
  - [03-tooling-and-pipelines.md](./03-tooling-and-pipelines.md)
