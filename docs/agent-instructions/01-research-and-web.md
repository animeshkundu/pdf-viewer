# Research and Web Protocols

## Internet is First-Class

Research is not optional—it is a **mandatory first step** before any significant implementation.

---

## 1. The Research-First Principle

### Why Research Matters
- Libraries evolve rapidly; documentation may be outdated
- Best practices change over time
- Security vulnerabilities are discovered regularly
- New tools and approaches emerge constantly
- Avoiding the "not invented here" syndrome

### When to Research
- Before choosing a library or tool
- Before implementing a pattern or algorithm
- When encountering unfamiliar technology
- When troubleshooting unexpected behavior
- Before making performance optimizations

---

## 2. Research Workflow

### Step-by-Step Process

```
1. IDENTIFY: What do I need to know?
         ↓
2. SEARCH: Use web search to find information
         ↓
3. VERIFY: Cross-reference multiple sources
         ↓
4. VALIDATE: Check against official documentation
         ↓
5. APPLY: Use verified information in implementation
         ↓
6. DOCUMENT: Record findings in appropriate docs
```

### Search Strategies

#### For Library/Tool Selection
```
Search: "[problem] best [language] library 2024"
Search: "[library A] vs [library B] comparison"
Search: "[library] security vulnerabilities"
Search: "[library] performance benchmarks"
```

#### For Implementation Patterns
```
Search: "[language] [pattern] best practices"
Search: "[framework] recommended [feature] approach"
Search: "[library] [feature] example"
Search: "[technology] gotchas and pitfalls"
```

#### For Troubleshooting
```
Search: "[exact error message]"
Search: "[library] [problem description]"
Search: "[library] github issues [problem]"
```

---

## 3. Validation Requirements

### Library Version Validation

Before using any library:
1. **Check latest version**: Search "[library] latest version"
2. **Check changelog**: Look for breaking changes
3. **Check compatibility**: Ensure it works with our stack
4. **Check security**: Search for recent vulnerabilities
5. **Check maintenance**: Is it actively maintained?

### Pattern Validation

Before implementing a pattern:
1. **Verify it's current**: Patterns evolve; ensure it's still recommended
2. **Check our ADRs**: Have we made decisions about this pattern?
3. **Check our codebase**: Is there an existing pattern we should follow?
4. **Consider alternatives**: Are there better approaches now?

### API Validation

Before using an API:
1. **Check current docs**: APIs change; docs may be stale
2. **Verify endpoint**: Ensure the endpoint exists and is current
3. **Check authentication**: Understand auth requirements
4. **Test in isolation**: Verify behavior before integrating

---

## 4. Information Saturation

### The Principle
Research until you reach **information saturation**—the point where new searches provide no new useful information.

### Signs of Saturation
- Multiple sources agree on the approach
- You've found the official documentation
- You understand the trade-offs
- You can explain the approach to someone else
- New searches return previously seen results

### Saturation Checklist
- [ ] Found official documentation
- [ ] Read at least 3 independent sources
- [ ] Understand the "why" not just the "how"
- [ ] Identified potential pitfalls
- [ ] Know the alternatives and why they're not chosen

---

## 5. Source Hierarchy

### Trustworthiness Ranking

1. **Official Documentation** - Most authoritative
2. **Library GitHub Repo** - Issues, discussions, examples
3. **Peer-Reviewed/Conference Papers** - For algorithms/approaches
4. **Reputable Tech Blogs** - (Company blogs, well-known authors)
5. **Stack Overflow** - Verified answers (check dates!)
6. **Medium/Dev.to** - Use with caution (verify independently)
7. **AI-Generated Content** - Always verify, never trust blindly

### Red Flags
- ⚠️ No date on the article
- ⚠️ Library version not specified
- ⚠️ No working code examples
- ⚠️ Comments report issues/outdated
- ⚠️ Single source, no corroboration

---

## 6. Documentation of Research

### When to Document Research
- Library selection → Create ADR
- Complex implementation → Add to spec
- Security-related findings → Document in code and spec
- Performance insights → Add to relevant documentation

### Research Documentation Template

```markdown
## Research: [Topic]

### Date
YYYY-MM-DD

### Question
What was being researched?

### Sources Consulted
1. [Source 1](url) - Summary of findings
2. [Source 2](url) - Summary of findings
3. [Source 3](url) - Summary of findings

### Findings
Key insights and recommendations.

### Decision
What was decided based on research?

### References
- Links to relevant documentation
```

---

## 7. Anti-Patterns to Avoid

### ❌ Don't Do This

1. **Hallucinating APIs**
   - Never assume an API exists; verify it
   - Never guess library function names
   - Always check for current method signatures

2. **Outdated Information**
   - Don't trust old Stack Overflow answers blindly
   - Always check when the answer was written
   - Verify against current documentation

3. **Single Source Reliance**
   - Don't base decisions on one article
   - Cross-reference multiple sources
   - When sources disagree, investigate why

4. **Skipping Research**
   - Never think "I already know this"
   - Things change; verify current state
   - Even experts need to refresh knowledge

5. **Copying Without Understanding**
   - Don't copy code you don't understand
   - Understand WHY it works
   - Adapt to our patterns and style

---

## 8. Research Examples

### Example 1: Choosing a PDF Library

```
Task: Select a PDF manipulation library

Research Steps:
1. Search: "best javascript pdf manipulation library 2024"
2. Search: "pdf-lib vs pdfjs comparison"
3. Search: "pdf-lib security vulnerabilities"
4. Check: npm downloads and GitHub stars
5. Check: Recent commits and issue responses
6. Read: Official documentation for both
7. Test: Create small proof-of-concept

Outcome: Create ADR documenting decision
```

### Example 2: Implementing a Feature

```
Task: Add PDF text extraction

Research Steps:
1. Search: "pdf.js text extraction example"
2. Search: "pdf.js getTextContent best practices"
3. Check: PDF.js official documentation
4. Check: Our existing PDF.js usage patterns
5. Search: "pdf text extraction performance optimization"

Outcome: Write spec with implementation approach
```

### Example 3: Debugging an Issue

```
Task: Fix canvas rendering issue on Retina displays

Research Steps:
1. Search: "canvas blurry retina display"
2. Search: "canvas devicePixelRatio handling"
3. Search: "pdf.js high dpi rendering"
4. Check: Our ADRs for related decisions
5. Check: PDF.js GitHub issues

Outcome: Implement fix, create ADR if architectural
```

---

## Summary

### Before Implementation Checklist
- [ ] Researched the problem domain
- [ ] Found official documentation
- [ ] Verified library versions
- [ ] Cross-referenced multiple sources
- [ ] Reached information saturation
- [ ] Documented findings appropriately

### Remember
> "An hour of research can save days of debugging."

---

## References

- [How to Research](https://www.coursera.org/articles/how-to-do-research)
- [Source Evaluation](https://guides.lib.berkeley.edu/evaluating-resources)
- Related files:
  - [00-core-philosophy.md](./00-core-philosophy.md)
  - [02-testing-and-validation.md](./02-testing-and-validation.md)
  - [03-tooling-and-pipelines.md](./03-tooling-and-pipelines.md)
