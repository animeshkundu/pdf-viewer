# Deprecated Features and Migration History

## Overview

This directory contains documentation for deprecated features, removed components, and migration guides. These records help understand the evolution of the codebase and provide historical context for architectural decisions.

## Purpose

- Document why features were removed
- Provide migration paths for developers
- Preserve institutional knowledge
- Help debug issues related to removed code
- Understand the evolution of the application

## Structure

Each deprecated feature should have its own markdown file:

```
YYYY-MM-DD-feature-name.md
```

Example: `2025-01-15-old-annotation-system.md`

## What to Document

Create a history entry when:
- Removing a major feature
- Deprecating a component or service
- Changing a public API
- Migrating from one technology/library to another
- Removing a dependency
- Restructuring code in a breaking way

## Template

Use this template for history entries:

```markdown
# [Feature/Component Name] - Deprecated

## Deprecation Date
YYYY-MM-DD

## Final Version
Last version where this feature was available: vX.Y.Z

## Reason for Deprecation
Why was this feature/component removed or changed?

## What It Did
Brief description of the feature's functionality and purpose.

## Replacement
What should be used instead? Link to new implementation.

## Migration Guide
Step-by-step instructions for migrating from old to new.

### Before (Old Code)
\`\`\`typescript
// Example of old usage
\`\`\`

### After (New Code)
\`\`\`typescript
// Example of new usage
\`\`\`

## Breaking Changes
List any breaking changes that resulted from this deprecation.

## Code Location (Historical)
Where the code used to live (for git history reference):
- Files: `src/path/to/old/file.ts`
- Commit: `abc123...`
- PR: #123

## Related ADRs
- [ADR-XXXX](../ADR/xxxx-title.md): Why we made this change

## Timeline
- YYYY-MM-DD: Initial implementation
- YYYY-MM-DD: Deprecated
- YYYY-MM-DD: Removed

## Known Issues
Any known issues with the old implementation that led to deprecation.

## References
- GitHub Issues: #123, #456
- Pull Requests: #789
- Related Documentation
```

## History Index

| Date | Feature | Reason | Replacement |
|------|---------|--------|-------------|
| _None yet_ | _This project is new_ | - | - |

## Best Practices

### When Deprecating
1. **Announce early**: Document deprecation before removal
2. **Provide warnings**: Add console warnings in code
3. **Migration path**: Always provide clear migration guide
4. **Timeline**: Give users time to migrate (if applicable)
5. **Preserve history**: Keep git history, don't force-push

### Writing Good History Docs
1. **Be honest**: Explain real reasons, not just "it was old"
2. **Be helpful**: Focus on how to migrate, not just what's gone
3. **Be thorough**: Include code examples
4. **Be searchable**: Use clear titles and keywords
5. **Link liberally**: Connect to ADRs, issues, PRs

### Maintaining History
- Never delete history files
- Update index when adding new entries
- Keep files even after code is removed (historical record)
- Reference in ADRs when making related decisions

## Common Deprecation Patterns

### API Change
When changing function signatures or component props:
```markdown
### Before
\`\`\`typescript
function oldApi(param1: string, param2: number) {
  // old implementation
}
\`\`\`

### After
\`\`\`typescript
function newApi(options: { param1: string; param2: number; param3?: boolean }) {
  // new implementation
}
\`\`\`

### Migration
\`\`\`typescript
// Old code
oldApi('value', 42)

// New code
newApi({ param1: 'value', param2: 42 })
\`\`\`
```

### Component Replacement
When replacing one component with another:
```markdown
### Before
\`\`\`tsx
import { OldButton } from './components/OldButton'

<OldButton onClick={handler} label="Click me" />
\`\`\`

### After
\`\`\`tsx
import { Button } from './components/ui/button'

<Button onClick={handler}>Click me</Button>
\`\`\`
```

### Library Migration
When switching from one library to another:
```markdown
### Before (Using old-library)
\`\`\`typescript
import { oldFunction } from 'old-library'

const result = oldFunction(data)
\`\`\`

### After (Using new-library)
\`\`\`typescript
import { newFunction } from 'new-library'

const result = newFunction(data)
\`\`\`

### Changes
- Method names changed: `oldFunction` → `newFunction`
- Return type changed: `OldType` → `NewType`
- Error handling: Now throws exceptions instead of returning null
```

## Finding Deprecated Code

To find references to deprecated features in git history:

```bash
# Search for deleted files
git log --all --full-history -- path/to/deleted/file.ts

# Search for deleted code
git log -S "searchterm" --all

# View file at specific commit
git show commit_hash:path/to/file.ts

# Browse repository at specific time
git checkout commit_hash
```

## Resources

- [Semantic Versioning](https://semver.org/) - Version numbering conventions
- [Keep a Changelog](https://keepachangelog.com/) - Changelog best practices
- ADR README: [../ADR/README.md](../ADR/README.md)
- Main Documentation: [../README.md](../README.md)

## Questions?

When in doubt about what to document:
- If someone might wonder "where did X go?", document it
- If there's a migration path, document it
- If it took >1 day to build, document why it was removed
- If it might come back in different form, document it
