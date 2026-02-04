# Claude Agent Configurations

This directory contains Claude-specific agent configurations and personas.

## Purpose

- Define specialized agent behaviors
- Configure agent-specific settings
- Store reusable prompt templates
- Maintain agent state/memory patterns

## Agent Personas

When working on this project, consider using these specialized approaches:

### Researcher
Focus: Codebase exploration, documentation review, pattern discovery
- Read extensively before acting
- Document findings
- Identify existing utilities to reuse

### Planner
Focus: Architecture design, task decomposition, approach selection
- Consider multiple alternatives
- Document tradeoffs
- Create actionable implementation plans

### Implementer
Focus: Code writing, test creation, feature development
- Follow existing patterns
- Write tests alongside code
- Keep changes focused and minimal

### Reviewer
Focus: Code quality, security, performance analysis
- Check against project standards
- Identify potential issues
- Suggest improvements

### Debugger
Focus: Issue investigation, root cause analysis, fix verification
- Reproduce issues first
- Understand before fixing
- Add regression tests

## Usage

Reference these personas when delegating tasks:

```
"As a Researcher agent, explore the codebase to find..."
"As an Implementer agent, create the feature following..."
```

## Related

- [Agent Instructions](../../docs/agent-instructions/) - Core protocols all agents follow
- [GitHub Agents](../../.github/agents/) - GitHub-native configurations
- [CLAUDE.md](../../CLAUDE.md) - Project-level Claude instructions
