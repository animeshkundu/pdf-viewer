# Research and Web Usage

## 1. Internet is First-Class

**Principle:** Web search is a required tool, not optional.

### When to Search

**ALWAYS search before:**
- Using a library or API you haven't used recently
- Implementing a pattern you're not 100% certain about
- Making security-related decisions
- Choosing between multiple approaches
- Encountering unfamiliar error messages

**Search for:**
- Current best practices (include year in query)
- Library documentation and changelogs
- Security advisories
- Performance benchmarks
- Community solutions to similar problems

### Search Strategy

1. **Be Specific**
   ```
   Bad:  "react state management"
   Good: "react 19 zustand vs jotai comparison 2024"
   ```

2. **Include Context**
   ```
   Bad:  "pdf.js text layer"
   Good: "pdf.js 4.x text layer selection not working typescript"
   ```

3. **Verify Recency**
   - Check publication/update dates
   - Prefer official documentation
   - Cross-reference multiple sources

## 2. Validation Protocol

**Principle:** Never trust memory alone; verify everything.

### Library Validation

Before using any library:

1. **Check Current Version**
   ```bash
   npm info <package> version
   ```

2. **Verify API Compatibility**
   - Read changelog for breaking changes
   - Check TypeScript types match expected usage
   - Look for deprecation warnings

3. **Security Check**
   ```bash
   npm audit
   ```
   - Check for known vulnerabilities
   - Review recent security advisories

### Pattern Validation

Before implementing a pattern:

1. **Search for Current Best Practice**
   - Is this pattern still recommended?
   - Are there newer alternatives?

2. **Check Project Consistency**
   - Does this pattern exist elsewhere in codebase?
   - Does it align with existing ADRs?

3. **Verify with Documentation**
   - Does official docs recommend this approach?
   - Are there known gotchas?

## 3. Information Saturation

**Principle:** Research until you stop learning new relevant information.

### Saturation Indicators

You've reached saturation when:
- Multiple sources agree on the approach
- You understand the tradeoffs
- You can explain WHY, not just HOW
- You've seen the edge cases
- You know what NOT to do

### Research Depth by Task Type

| Task Type | Minimum Research |
|-----------|------------------|
| Bug fix | Check issue trackers, similar bugs |
| New feature | Best practices, similar implementations |
| Architecture | Multiple approaches, tradeoffs, ADRs |
| Security | OWASP, CVEs, official security guides |
| Performance | Benchmarks, profiling strategies |

### When to Stop Researching

- Time-boxed: Set a limit (e.g., 15 min for simple, 1 hour for complex)
- Diminishing returns: New searches yield same information
- Clear path: You have enough to make an informed decision
- Blocked: You need to experiment to learn more

## 4. Source Hierarchy

**Principle:** Not all sources are equal.

### Trustworthiness Ranking

1. **Official Documentation** - Primary source of truth
2. **Official GitHub Issues/Discussions** - Known issues and solutions
3. **Reputable Tech Blogs** - In-depth analysis (verify date)
4. **Stack Overflow** - Community solutions (check votes and dates)
5. **Personal Blogs** - Supplementary (verify against official docs)
6. **AI-Generated Content** - Cross-reference always

### Red Flags

- No date or very old date
- Contradicts official documentation
- No code examples or untested code
- Single source with no corroboration
- Overly complex solution to simple problem

## 5. Research Documentation

**Principle:** Document what you learned for future agents.

### When to Document Research

- Significant decisions based on research
- Non-obvious solutions found
- Important gotchas discovered
- Library limitations identified

### Where to Document

| Finding Type | Location |
|--------------|----------|
| Architectural decision | `docs/ADR/` |
| Library research | `docs/research/` |
| Implementation pattern | `docs/AGENT.md` |
| Bug workaround | Code comment + ADR if significant |

### Research Note Template

```markdown
## Research: [Topic]

**Date:** YYYY-MM-DD
**Context:** Why this research was needed

### Findings
- Key finding 1
- Key finding 2

### Sources
- [Source 1](url)
- [Source 2](url)

### Decision
What was decided based on this research

### Alternatives Considered
- Alternative 1: Why rejected
- Alternative 2: Why rejected
```
