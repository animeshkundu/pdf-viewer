# Testing and Validation

## The 90% Rule

**Minimum 90% code coverage is MANDATORY for all unit and integration tests.**

This is not a guideline—it is a requirement. Code that does not meet this threshold will not be accepted.

---

## 1. Testing Philosophy

### Why 90%?
- Catches regressions before they reach production
- Documents expected behavior through tests
- Enables confident refactoring
- Proves the implementation matches the specification
- Required for agentic development where multiple agents work in parallel

### What's Covered
- Unit tests: Individual functions, utilities, hooks
- Integration tests: Component interactions, service workflows
- E2E tests: Full user flows, critical paths

### What's Excluded from Coverage Calculations
- Generated code (types from schemas, etc.)
- Third-party library wrappers (minimal)
- Pure configuration files

---

## 2. Test-Driven Development (TDD)

### The Principle
**Write the test BEFORE or WITH the implementation, never after.**

### TDD Workflow

```
1. Write a failing test
         ↓
2. Write minimal code to pass
         ↓
3. Refactor while keeping green
         ↓
4. Repeat
```

### Why TDD?
- Forces clear thinking about requirements
- Creates documentation through tests
- Prevents over-engineering
- Results in more testable code
- Catches design issues early

---

## 3. Test Structure Requirements

### Unit Tests

For every function/utility:
```typescript
describe('functionName', () => {
  describe('normal cases', () => {
    it('should handle typical input', () => {
      // Test normal usage
    })

    it('should handle another typical case', () => {
      // Test variation
    })
  })

  describe('edge cases', () => {
    it('should handle empty input', () => {
      // Test empty array, null, undefined, etc.
    })

    it('should handle boundary values', () => {
      // Test min/max values, limits
    })
  })

  describe('error cases', () => {
    it('should throw on invalid input', () => {
      // Test error handling
    })

    it('should handle failure gracefully', () => {
      // Test recovery
    })
  })
})
```

### Component Tests

For every React component:
```typescript
describe('ComponentName', () => {
  describe('rendering', () => {
    it('should render with required props', () => {
      // Basic render test
    })

    it('should render with all props', () => {
      // Full props test
    })
  })

  describe('interactions', () => {
    it('should handle click events', () => {
      // User interaction test
    })

    it('should update on prop changes', () => {
      // Reactivity test
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // A11y test
    })

    it('should be keyboard navigable', () => {
      // Keyboard test
    })
  })
})
```

### Integration Tests

For service interactions:
```typescript
describe('FeatureWorkflow', () => {
  it('should complete the full workflow', async () => {
    // Setup
    const service = new FeatureService()
    
    // Execute
    const result = await service.performAction(input)
    
    // Verify
    expect(result).toMatchExpectedState()
    expect(sideEffects).toHaveOccurred()
  })

  it('should handle workflow errors', async () => {
    // Test error paths
  })
})
```

### E2E Tests

For user journeys:
```typescript
test.describe('User Journey: PDF Annotation', () => {
  test('user can open, annotate, and save PDF', async ({ page }) => {
    // Navigate
    await page.goto('/')
    
    // Open file
    await page.setInputFiles('input[type="file"]', 'test.pdf')
    
    // Annotate
    await page.click('[data-testid="highlight-tool"]')
    await page.dragTo(/* highlight area */)
    
    // Save
    await page.click('[data-testid="save-button"]')
    
    // Verify
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
  })
})
```

---

## 4. Self-Correction Protocol

### Before Committing ANY Change

```bash
# Run the validation script
./scripts/validate.sh

# Or manually:
npm run lint          # Check code style
npm run typecheck     # Check types
npm run test          # Run unit tests
npm run test:coverage # Verify coverage
```

### If Tests Fail

1. **Read the error message** - Understand what failed
2. **Check if it's your change** - Did you break existing functionality?
3. **Fix the issue** - Either in your code or update the test if requirement changed
4. **Run tests again** - Verify the fix
5. **Never skip failing tests** - Fix them or understand why they fail

### Coverage Check

```bash
# Run coverage report
npm run test:coverage

# View coverage report
open coverage/index.html  # Or check CI output
```

If coverage is below 90%:
1. Identify uncovered lines in the report
2. Write tests for those paths
3. Consider if the uncovered code is necessary

---

## 5. Test File Organization

### Location
```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── Button.test.tsx      # Unit/component tests next to source
├── services/
│   └── pdf.service.ts
│   └── pdf.service.test.ts      # Service tests next to source
├── hooks/
│   └── usePDF.ts
│   └── usePDF.test.ts           # Hook tests next to source
└── __tests__/                   # Integration tests (optional)
    └── workflows/

e2e/
└── specs/                       # E2E tests separate
    └── annotation.spec.ts
```

### Naming Conventions
- Unit/component tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`
- Test utilities: `*.test-utils.ts`
- Fixtures: `__fixtures__/` folder

---

## 6. Mocking Guidelines

### When to Mock
- External APIs
- File system operations
- Time-dependent functions
- Heavy dependencies (only if necessary)

### When NOT to Mock
- The code under test
- Simple utilities
- Data transformations
- Most of our own services (test integration)

### Mock Examples

```typescript
// Mock external dependency
vi.mock('external-library', () => ({
  expensiveOperation: vi.fn().mockResolvedValue({ data: 'mocked' })
}))

// Mock time
vi.useFakeTimers()
vi.setSystemTime(new Date('2025-01-01'))

// Don't over-mock
// ❌ Don't mock everything
// ✅ Test real integration when possible
```

---

## 7. Test Data Management

### Fixtures
```typescript
// src/__fixtures__/pdf.fixtures.ts
export const mockPDFDocument = {
  numPages: 5,
  // ... minimal data for testing
}

export const createMockPage = (overrides = {}) => ({
  pageNumber: 1,
  width: 612,
  height: 792,
  ...overrides
})
```

### Test PDFs
```
public/test-fixtures/
├── simple.pdf          # Basic PDF for quick tests
├── multipage.pdf       # 10-page document
├── with-annotations.pdf # Pre-annotated
└── corrupted.pdf       # For error handling tests
```

---

## 8. Coverage Requirements

### Minimum Thresholds

| Type | Target | Minimum |
|------|--------|---------|
| Statements | 95% | 90% |
| Branches | 90% | 85% |
| Functions | 95% | 90% |
| Lines | 95% | 90% |

### Coverage Configuration

```typescript
// vitest.config.ts
export default {
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/types/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/test-utils/'
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90
      }
    }
  }
}
```

---

## 9. CI Integration

### Tests in CI Pipeline

```yaml
# .github/workflows/ci.yml
test:
  name: Unit Tests
  steps:
    - run: npm run test:coverage
    - uses: codecov/codecov-action@v4
      with:
        files: ./coverage/lcov.info
        fail_ci_if_error: true
        thresholds: "90 85"  # Overall and patch coverage
```

### Pre-commit Validation
Consider adding pre-commit hooks:
```bash
# Run tests before committing
npm run test -- --run
```

---

## 10. Common Testing Pitfalls

### ❌ Avoid These

1. **Testing implementation, not behavior**
   ```typescript
   // ❌ Bad: Testing internal state
   expect(component.state.count).toBe(1)
   
   // ✅ Good: Testing visible behavior
   expect(screen.getByText('Count: 1')).toBeInTheDocument()
   ```

2. **Fragile tests**
   ```typescript
   // ❌ Bad: Depends on specific DOM structure
   expect(wrapper.find('div > span > button')).toExist()
   
   // ✅ Good: Uses test IDs
   expect(screen.getByTestId('submit-button')).toBeInTheDocument()
   ```

3. **Not testing edge cases**
   ```typescript
   // ❌ Bad: Only happy path
   it('adds items', () => { /* only tests normal input */ })
   
   // ✅ Good: Also test edges
   it('handles empty list')
   it('handles max items')
   it('handles duplicate items')
   ```

4. **Flaky async tests**
   ```typescript
   // ❌ Bad: Race condition
   fireEvent.click(button)
   expect(result).toBe(expected)
   
   // ✅ Good: Wait for state
   fireEvent.click(button)
   await waitFor(() => expect(result).toBe(expected))
   ```

---

## Summary

### Test Checklist for Every Change

- [ ] Wrote tests BEFORE or WITH implementation
- [ ] Unit tests cover all functions/utilities
- [ ] Component tests cover rendering and interactions
- [ ] Edge cases and error paths are tested
- [ ] Coverage is above 90%
- [ ] All tests pass locally
- [ ] Tests are not flaky

### Commands to Remember

```bash
npm run test              # Run tests in watch mode
npm run test:coverage     # Run with coverage
npm run test -- --run     # Run once (CI mode)
npm run e2e               # Run E2E tests
./scripts/validate.sh     # Run all validations
```

---

## References

- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- Related files:
  - [00-core-philosophy.md](./00-core-philosophy.md)
  - [01-research-and-web.md](./01-research-and-web.md)
  - [03-tooling-and-pipelines.md](./03-tooling-and-pipelines.md)
