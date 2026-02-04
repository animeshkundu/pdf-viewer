# Testing and Validation

## 1. The 90% Rule

**Principle:** Maintain a minimum of 90% code coverage for all new code.

### Coverage Requirements

| Test Type | Minimum Coverage | Tool |
|-----------|------------------|------|
| Unit Tests | 90% | Vitest |
| Integration Tests | Key workflows | Vitest |
| E2E Tests | Critical paths | Playwright |

### What Counts Toward Coverage

- Line coverage: 90%+
- Branch coverage: 85%+
- Function coverage: 90%+

### Exceptions

Coverage can be lower ONLY for:
- Generated code (with justification)
- Third-party integration wrappers
- Debug/development-only code

Document any exceptions in the PR description.

## 2. Test-Driven Development

**Principle:** Write the test WITH or BEFORE the implementation.

### The TDD Cycle

```
1. Write a failing test
2. Write minimal code to pass
3. Refactor
4. Repeat
```

### When TDD is Required

- New features: Write test first
- Bug fixes: Write regression test first
- Refactoring: Ensure tests exist before changing

### Test Structure

```typescript
describe('FeatureName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Test Naming Convention

```
should [expected outcome] when [condition/input]
```

Examples:
- `should return empty array when no annotations exist`
- `should throw error when PDF is corrupted`
- `should highlight text when search matches`

## 3. Self-Correction Protocol

**Principle:** Validate your own work before committing.

### Pre-Commit Checklist

Before every commit, run:

```bash
./scripts/validate.sh
```

This runs:
1. Linting (`npm run lint`)
2. Type checking (`npm run typecheck`)
3. Unit tests (`npm run test`)

### If Tests Fail

1. **DO NOT** commit with failing tests
2. **DO NOT** skip or disable tests
3. **DO** fix the issue
4. **DO** re-run validation
5. **DO** document if fix reveals a larger issue

### Self-Review Checklist

Before marking work complete:

- [ ] All tests pass locally
- [ ] No linting errors
- [ ] No type errors
- [ ] Coverage meets 90% threshold
- [ ] Edge cases are tested
- [ ] Error cases are tested

## 4. Test Categories

### Unit Tests (`src/**/__tests__/*.test.ts`)

**Purpose:** Test individual functions/components in isolation

**Guidelines:**
- Mock external dependencies
- Test one thing per test
- Fast execution (< 100ms each)
- No network calls
- No file system access

**Example:**
```typescript
describe('annotationService', () => {
  it('should create highlight annotation with correct properties', () => {
    const result = createHighlight({ x: 10, y: 20, width: 100, height: 20 });

    expect(result.type).toBe('highlight');
    expect(result.rect).toEqual({ x: 10, y: 20, width: 100, height: 20 });
    expect(result.id).toBeDefined();
  });
});
```

### Integration Tests

**Purpose:** Test multiple components working together

**Guidelines:**
- Test service interactions
- Test hook + component combinations
- May use test utilities (testing-library)
- Mock at boundaries only

### E2E Tests (`e2e/*.spec.ts`)

**Purpose:** Test complete user workflows

**Guidelines:**
- Test critical user journeys
- Use realistic test data
- Run against built application
- Test across browsers (CI)

**Example:**
```typescript
test('user can upload and annotate PDF', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('[data-testid="file-input"]', 'test.pdf');
  await page.click('[data-testid="highlight-tool"]');
  // ... complete workflow
});
```

## 5. Testing Patterns

### Testing React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Async Code

```typescript
it('should load PDF successfully', async () => {
  const result = await loadPDF(testFile);

  expect(result.numPages).toBe(5);
  expect(result.error).toBeUndefined();
});
```

### Testing Error Cases

```typescript
it('should throw when file is invalid', async () => {
  await expect(loadPDF(invalidFile)).rejects.toThrow('Invalid PDF');
});
```

### Mocking

```typescript
vi.mock('../services/pdf.service', () => ({
  loadPDF: vi.fn().mockResolvedValue({ numPages: 1 }),
}));
```

## 6. Continuous Integration

### CI Pipeline Validation

Every PR triggers:
1. Lint check
2. Type check
3. Unit tests with coverage
4. E2E tests (8 shards)
5. Build verification

### Coverage Reporting

- Coverage uploaded to Codecov
- PR blocked if coverage drops
- Coverage diff shown in PR

### Debugging CI Failures

1. Check CI logs for specific failure
2. Reproduce locally with same commands
3. Fix and push
4. Never force-merge with failures
