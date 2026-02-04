# Core Philosophy

## 1. Documentation = Code

**Principle:** No code is written without documentation first.

### The Workflow

1. **Before ANY implementation:**
   - Check `docs/specs/` for existing specifications
   - If none exists, write a specification first
   - Get the spec reviewed/approved before coding

2. **During implementation:**
   - Keep documentation in sync with code changes
   - Update architecture docs if patterns change
   - Add inline comments only for non-obvious logic

3. **After implementation:**
   - Update `docs/history/` with completion summary
   - Create/update ADR if architectural decisions were made
   - Verify all docs reflect current state

### Why This Matters

- Documentation serves as the source of truth
- Future agents can understand context without re-exploring
- Reduces knowledge loss between sessions
- Enables parallel agent work without conflicts

## 2. The CEO Model

**Principle:** The initiating agent orchestrates; sub-agents execute.

### Hierarchy

```
CEO Agent (Orchestrator)
├── Research Agent - Explores codebase, gathers context
├── Planning Agent - Designs implementation approach
├── Implementation Agent - Writes code
├── Testing Agent - Validates changes
└── Review Agent - Quality assurance
```

### Responsibilities

**CEO Agent:**
- Breaks down complex tasks into subtasks
- Assigns work to specialized sub-agents
- Monitors progress and handles blockers
- Synthesizes results into final output
- Makes final decisions on approach

**Sub-Agents:**
- Execute assigned tasks autonomously
- Report findings/results back to CEO
- Escalate blockers or unclear requirements
- Stay within their designated scope

### When to Delegate

- Task requires multiple distinct skills
- Research phase is extensive
- Implementation spans multiple files/areas
- Testing requires specialized setup

## 3. First Principles Thinking

**Principle:** Reason deeply before acting.

### The Process

1. **Understand the Problem**
   - What is actually being asked?
   - What are the constraints?
   - What does success look like?

2. **Research Thoroughly**
   - Check existing code for patterns
   - Review relevant ADRs
   - Search internet for best practices
   - Reach information saturation

3. **Plan Step-by-Step**
   - Break into atomic tasks
   - Identify dependencies
   - Consider edge cases
   - Plan for failure modes

4. **Execute Methodically**
   - One task at a time
   - Validate each step
   - Document as you go

5. **Verify Completely**
   - Run all tests
   - Check for regressions
   - Review against requirements

### Anti-Patterns to Avoid

- Jumping to implementation without understanding
- Copying code without understanding its purpose
- Making assumptions without verification
- Skipping validation steps
- Ignoring existing patterns

## 4. Synchronization Protocol

**Principle:** Keep the knowledge base current.

### After Every Work Session

1. **Update History**
   ```
   docs/history/YYYY-MM-DD-<brief-description>.md
   ```
   Include: what was done, decisions made, blockers encountered

2. **Update Architecture Docs** (if applicable)
   - New components? Update `docs/architecture/`
   - New patterns? Update `docs/AGENT.md`
   - New decisions? Create ADR in `docs/ADR/`

3. **Update Specs** (if applicable)
   - Implementation deviated from spec? Update spec
   - New requirements discovered? Document them

### Context Handoff

When work will continue in another session:
- Summarize current state clearly
- List remaining tasks
- Note any blockers or open questions
- Reference all relevant files

## 5. Autonomous Operation

**Principle:** Agents should be able to work independently.

### Self-Sufficiency Checklist

Before starting work, ensure you have:
- [ ] Read all agent instructions
- [ ] Checked relevant ADRs
- [ ] Reviewed existing specs
- [ ] Understood the codebase structure
- [ ] Identified testing requirements

### Decision Authority

Agents CAN autonomously:
- Choose implementation details within spec
- Select appropriate libraries (after research)
- Refactor for clarity
- Add tests beyond minimum requirements
- Fix obvious bugs encountered

Agents MUST escalate:
- Changes to public APIs
- Architectural changes
- Security-sensitive modifications
- Deviations from approved spec
- Dependency additions/upgrades
