# GitHub Copilot Instructions

This file provides context and guidelines for GitHub Copilot when working on the PDF Viewer & Editor project.

## Project Overview

This is a client-side PDF viewer and editor built with React + TypeScript, inspired by macOS Preview. All PDF processing happens in the browser with zero server dependencies.

**Key Technologies**:
- React 19 + TypeScript 5.7
- PDF.js (rendering) + pdf-lib (manipulation)
- Tailwind CSS + shadcn/ui components
- Vite for build tooling
- Vitest for testing

## Before You Start

**ALWAYS review these files first**:
1. `docs/README.md` - Documentation index
2. `docs/PRD.md` - Product requirements
3. `docs/ARCHITECTURE.md` - System architecture
4. `docs/TECHNICAL_SPEC.md` - Technical details
5. `docs/ADR/` - Architecture decisions
6. `docs/DESIGN_SYSTEM.md` - UI/UX guidelines

## Code Style & Standards

### TypeScript
- Use strict typing (no `any` without justification)
- Prefer interfaces for object shapes
- Use type inference where obvious
- Document complex types with comments

### React
- Functional components with hooks only
- Extract reusable logic into custom hooks
- Keep components focused (single responsibility)
- Use memo/useMemo/useCallback for performance-critical code

### Naming Conventions
```typescript
// Components: PascalCase
function PDFViewer() {}

// Hooks: camelCase with 'use' prefix
function usePDFDocument() {}

// Services: PascalCase with .service.ts suffix
// pdf.service.ts

// Types: PascalCase with .types.ts suffix
// pdf.types.ts

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 100_000_000
```

### File Organization
```
src/
├── components/
│   ├── ui/              # shadcn components (don't modify)
│   ├── PDFViewer/       # Feature components
│   ├── Toolbar/
│   └── ...
├── hooks/               # Custom hooks
├── services/            # Business logic
├── types/               # Type definitions
├── lib/                 # Utilities
└── styles/              # CSS
```

## Key Patterns

### State Management
```typescript
// Use React Context for global state
const PDFContext = createContext<PDFContextType | null>(null)

// Use local state for component-specific
const [zoom, setZoom] = useState(1.0)

// Use Spark KV for persistence
import { useKV } from '@github/spark/hooks'
const [signatures, setSignatures] = useKV('signatures', [])

// CRITICAL: Always use functional updates with useKV
setSignatures((current) => [...current, newSignature]) // ✅ Correct
// setSignatures([...signatures, newSignature]) // ❌ Wrong - causes data loss
```

### PDF Operations
```typescript
// Rendering (PDF.js)
import * as pdfjsLib from 'pdfjs-dist'

const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
const page = await pdf.getPage(pageNum)
await page.render({ canvasContext, viewport }).promise

// Manipulation (pdf-lib)
import { PDFDocument } from 'pdf-lib'

const pdfDoc = await PDFDocument.load(bytes)
const pages = pdfDoc.getPages()
const modifiedBytes = await pdfDoc.save()
```

### Component Pattern
```tsx
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Props {
  // Props interface
}

export function ComponentName({ prop1, prop2 }: Props) {
  // State
  const [state, setState] = useState()
  
  // Effects
  useEffect(() => {
    // side effects
  }, [deps])
  
  // Handlers
  const handleClick = () => {
    // logic
  }
  
  // Render
  return (
    <div className={cn('base-classes', conditionalClasses)}>
      <Button onClick={handleClick}>Action</Button>
    </div>
  )
}
```

## Testing Requirements

**Every feature must include**:
- Unit tests for logic/functions
- Component tests for UI
- E2E tests for workflows
- >90% code coverage

### Test Patterns
```typescript
// Unit test
describe('PDFService', () => {
  it('should load valid PDF', async () => {
    const doc = await PDFService.loadDocument(validFile)
    expect(doc.numPages).toBeGreaterThan(0)
  })
  
  it('should reject invalid files', async () => {
    await expect(PDFService.loadDocument(invalidFile))
      .rejects.toThrow('Invalid PDF')
  })
})

// Component test
describe('PDFViewer', () => {
  it('renders pages correctly', () => {
    render(<PDFViewer document={mockDoc} />)
    expect(screen.getByTestId('pdf-canvas')).toBeInTheDocument()
  })
})

// E2E test (Playwright)
test('user can annotate PDF', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles('input[type="file"]', 'test.pdf')
  await page.click('[data-testid="markup-button"]')
  await page.click('[data-testid="highlight-tool"]')
  // ... test annotation workflow
})
```

## UI/UX Guidelines

### Design System
- Use shadcn/ui components from `@/components/ui`
- Apply Tailwind utility classes
- Follow color palette in `index.css` (--primary, --accent, etc.)
- Maintain consistent spacing (Tailwind scale)

### Styling
```tsx
// Use Tailwind utilities
<div className="flex items-center gap-4 p-4 bg-card rounded-lg">
  
// Use cn() for conditional classes
<div className={cn(
  'base-class',
  isActive && 'active-class',
  variant === 'primary' && 'primary-class'
)}>

// Custom CSS only when Tailwind insufficient
```

### Accessibility
- Use semantic HTML (`<button>`, `<nav>`, etc.)
- Provide ARIA labels where needed
- Support keyboard navigation
- Maintain color contrast (WCAG AA)
- Test with screen readers

## Common Tasks

### Adding a New Feature
1. Check PRD for requirements
2. Review related ADRs
3. Plan component structure
4. Implement with tests
5. Update documentation
6. Create ADR if architecturally significant

### Adding a Component
```bash
# Use shadcn for UI components
npx shadcn@latest add button

# Create custom components in appropriate directory
src/components/FeatureName/ComponentName.tsx
```

### Working with PDFs
```typescript
// Always use virtualized rendering (see ADR-0003)
// Only render visible pages + buffer
// Cache rendered canvases with LRU eviction
// Use Web Workers for parsing
```

### Handling Errors
```typescript
// User-facing errors
try {
  await loadDocument(file)
} catch (error) {
  toast.error('Failed to load PDF. Please try again.')
  console.error('PDF load error:', error)
}

// Use Error Boundaries for component errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <PDFViewer />
</ErrorBoundary>
```

## Architecture Decisions

Key decisions documented in ADRs:
- **ADR-0001**: Using PDF.js for rendering
- **ADR-0002**: Using pdf-lib for manipulation  
- **ADR-0003**: Virtualized page rendering strategy
- **ADR-0004**: Annotation data structure
- **ADR-0005**: React Context for state management
- **ADR-0006**: Testing strategy

Read full ADRs in `docs/ADR/` before making related changes.

## Performance Requirements

- First page visible in <1 second
- 60fps scrolling
- <200MB memory for 100-page PDFs
- Virtualized rendering for large documents
- Web Workers for CPU-intensive tasks
- Debounced user input

## Security Considerations

- Never send PDFs to external servers
- No tracking or analytics on document content
- Sanitize user input (annotations, text)
- Validate file types before processing
- Handle errors gracefully (no sensitive info in errors)

## Build & Test Commands

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Tests
npm run test:unit
npm run test:e2e
npm run test:coverage

# Type check
tsc --noEmit
```

## Documentation Requirements

**Always update documentation when**:
- Adding/changing features
- Modifying APIs
- Making architectural decisions (create ADR)
- Deprecating features (add to history/)
- Changing build/deploy process

## Common Pitfalls to Avoid

❌ **Don't**:
- Modify shadcn components in `src/components/ui/`
- Use `any` type without justification
- Render all PDF pages at once (use virtualization)
- Store large data in component state
- Make breaking changes without ADR
- Skip tests
- Forget to update documentation

✅ **Do**:
- Follow existing patterns
- Write tests first (TDD when possible)
- Use TypeScript strictly
- Document complex logic
- Keep components small and focused
- Use Web Workers for heavy computation
- Implement progressive enhancement
- Test on multiple browsers

## Questions?

When unsure:
1. Check existing code for patterns
2. Read relevant ADRs
3. Review PRD for requirements
4. Look at similar implementations
5. Ask for clarification in PR comments

## Useful Snippets

### Loading a PDF
```typescript
import { PDFService } from '@/services/pdf.service'

const handleFileSelect = async (file: File) => {
  try {
    const document = await PDFService.loadDocument(file)
    // Use document
  } catch (error) {
    toast.error('Failed to load PDF')
  }
}
```

### Rendering a Page
```typescript
const renderPage = async (pageNum: number, canvas: HTMLCanvasElement) => {
  const page = await pdfDoc.getPage(pageNum)
  const viewport = page.getViewport({ scale: zoom })
  
  canvas.width = viewport.width
  canvas.height = viewport.height
  
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise
}
```

### Using Spark KV
```typescript
import { useKV } from '@github/spark/hooks'

function Component() {
  const [data, setData, deleteData] = useKV('key', defaultValue)
  
  // ALWAYS use functional updates
  const addItem = (item) => {
    setData((current) => [...current, item])
  }
  
  return <div>...</div>
}
```

## Resources

- [PDF.js Docs](https://mozilla.github.io/pdf.js/)
- [pdf-lib Docs](https://pdf-lib.js.org/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Remember**: This is a privacy-focused, client-side application. Every decision should prioritize user privacy, performance, and code quality.
