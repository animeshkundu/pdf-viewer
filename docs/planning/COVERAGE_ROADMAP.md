# Test Coverage Roadmap to 90%

## Current Status (as of commit 63b7f77)

**Coverage Metrics:**
- Lines: 42.05% → Target: 90%
- Branches: 35.71% → Target: 90%
- Functions: 69.56% → Target: 90%
- Statements: 42.34% → Target: 90%

**Current Tests:**
- Unit Tests: 17 tests passing
  - useLocalStorage hook (6 tests)
  - signature.service (11 tests)
- E2E Tests: 12 comprehensive tests

## What Needs Testing

### Services (~2000 LOC, Currently 34% Coverage)

#### 1. PDF Service (173 LOC) - Priority: HIGH
**Methods to Test:**
- `loadDocument()` - Load PDF from file
- `getPage()` - Get specific page
- `renderPage()` - Render page to canvas
- `clearCache()` - Cache management
- `getDocument()` - Get document proxy
- `getOriginalBytes()` - Get raw PDF data
- `getFilename()` - Get filename
- `getPageDimensions()` - Get page size
- `cleanup()` - Cleanup resources

**Test Scenarios:**
- Valid PDF loading
- Invalid/corrupted PDF handling
- Page rendering with different scales
- Cache hit/miss scenarios
- Memory management
- Error recovery

#### 2. Annotation Service (124 LOC) - Priority: HIGH
**Methods to Test:**
- `subscribe()` / notification system
- `addAnnotation()` - Add various annotation types
- `updateAnnotation()` - Modify annotations
- `deleteAnnotation()` - Remove annotations
- `getAnnotations()` - Retrieve with/without page filter
- `getAnnotation()` - Get by ID
- `getAllAnnotations()` - Get all
- `clearAnnotations()` - Clear all
- `undo()` / `redo()` - History management
- `canUndo()` / `canRedo()` - History state
- `exportAnnotations()` - Export to JSON
- `importAnnotations()` - Import from JSON

**Test Scenarios:**
- All annotation types (highlight, draw, shape, text, note, signature, redaction)
- Undo/redo with multiple operations
- History limit (MAX_HISTORY = 20)
- Export/import with valid/invalid data
- Listener notifications
- Concurrent modifications

#### 3. Search Service (155 LOC) - Priority: MEDIUM
**Methods to Test:**
- `extractPageText()` - Extract text from page
- `searchInDocument()` - Search with options
- `searchInPage()` - Page-level search
- `calculateCharacterBoundingBoxes()` - Position calculation
- `clearCache()` - Cache management
- `cleanup()` - Resource cleanup

**Test Scenarios:**
- Case-sensitive/insensitive search
- Whole word search
- Multi-page search
- Special characters
- Empty queries
- Text caching
- Progress callbacks

#### 4. Export Service (503 LOC) - Priority: HIGH
**Methods to Test:**
- `exportPDF()` - Main export function
- `applyAnnotations()` - Apply all annotation types
- `applyHighlight()` - Highlight rendering
- `applyDrawing()` - Freehand drawing
- `applyShape()` - Shape rendering
- `applyText()` - Text box
- `applyNote()` - Sticky note
- `applySignature()` - Signature embedding
- `applyRedaction()` - Redaction boxes
- `embedFonts()` - Font handling
- `createPDFPages()` - Page creation
- `applyPageOperations()` - Reorder/delete/rotate
- `applyWatermark()` - Watermark overlay
- `applyPageNumbers()` - Page numbering

**Test Scenarios:**
- Export with no annotations
- Export with each annotation type
- Export with page operations
- Watermark application
- Page number formatting
- Font embedding
- Error handling for corrupted data
- Large PDFs (100+ pages)

#### 5. Form Service (277 LOC) - Priority: MEDIUM
**Methods to Test:**
- `extractFormFields()` - Parse form fields
- `getFormFieldValue()` - Get field value
- `setFormFieldValue()` - Set field value
- `getFormFieldsByType()` - Filter by type
- `validateFormField()` - Validation
- `exportFormData()` - Export values
- `importFormData()` - Import values
- `clearFormData()` - Clear all fields

**Test Scenarios:**
- Text fields
- Checkboxes
- Radio buttons
- Dropdowns
- Validation rules
- Import/export
- Empty forms

#### 6. Page Management Service (333 LOC) - Priority: MEDIUM
**Methods to Test:**
- `reorderPages()` - Change page order
- `deletePage()` - Remove pages
- `rotatePage()` - Rotate pages
- `insertBlankPage()` - Add blank pages
- `duplicatePage()` - Copy pages
- `extractPages()` - Extract to new PDF
- `mergePDFs()` - Combine PDFs

**Test Scenarios:**
- Reorder multiple pages
- Delete first/middle/last pages
- Rotate by 90/180/270 degrees
- Insert at different positions
- Duplicate with annotations
- Extract ranges
- Merge with different sizes

#### 7. Watermark Service (193 LOC) - Priority: LOW
**Methods to Test:**
- `createTextWatermark()` - Text watermarks
- `createImageWatermark()` - Image watermarks
- `applyWatermark()` - Apply to PDF
- `removeWatermark()` - Remove watermarks
- `previewWatermark()` - Preview before apply

**Test Scenarios:**
- Text with different fonts/sizes/colors
- Image watermarks
- Opacity variations
- Position options
- Multi-page application

#### 8. Page Number Service (202 LOC) - Priority: LOW
**Methods to Test:**
- `addPageNumbers()` - Add numbers
- `removePageNumbers()` - Remove numbers
- `formatPageNumber()` - Format styles
- `getPageNumberPosition()` - Calculate positions

**Test Scenarios:**
- Different formats (1, i, I, a, A)
- Various positions
- Starting numbers
- Prefix/suffix
- Exclusions

### React Components - Priority: MEDIUM

#### Components to Test:
1. **MarkupToolbar** - Annotation tools
2. **RedactionWarningDialog** - Warning dialogs
3. **SignatureCreator** - Signature management
4. **Toolbar** - Main toolbar
5. **WatermarkOverlay** - Watermark UI
6. **PageNumberDialog** - Page number UI
7. **AnnotationDrawing** - Drawing canvas
8. **TextBoxEditor** - Text editing
9. **NoteEditor** - Note editing
10. **FormFieldOverlay** - Form UI

**Test Scenarios per Component:**
- Rendering with different props
- User interactions (clicks, input)
- State management
- Error boundaries
- Accessibility

### Hooks - Priority: HIGH

#### Hooks to Test:
1. **useAnnotations** - Annotation state
2. **usePDF** - PDF document state
3. **usePageManagement** - Page operations
4. **useSearch** - Search state
5. **useForm** - Form state
6. **useWatermark** - Watermark state
7. **useGestures** - Touch gestures
8. **useInstall** - PWA install

**Test Scenarios:**
- Initial state
- State updates
- Side effects
- Cleanup
- Error handling

### Utilities - Priority: LOW

#### Files to Test:
- **performance.ts** - Performance monitoring
- Type definitions (mostly no testing needed)

## Estimated Effort

### Time Estimates (hours):
- PDF Service: 4-6 hours
- Annotation Service: 3-4 hours
- Search Service: 2-3 hours
- Export Service: 8-10 hours (largest, most complex)
- Form Service: 4-5 hours
- Page Management: 4-5 hours
- Watermark Service: 2-3 hours
- Page Number Service: 2-3 hours
- React Components (10 components): 10-15 hours
- Hooks (8 hooks): 4-6 hours
- Utilities: 1-2 hours

**Total Estimated Time: 44-62 hours**

## Recommended Approach

### Phase 1: Core Services (15-20 hours)
1. PDF Service
2. Annotation Service
3. Export Service

### Phase 2: Feature Services (10-15 hours)
1. Search Service
2. Form Service
3. Page Management Service

### Phase 3: Components (10-15 hours)
1. MarkupToolbar
2. SignatureCreator
3. Other critical components

### Phase 4: Hooks & Utilities (8-10 hours)
1. All custom hooks
2. Utility functions

### Phase 5: Polish (5-7 hours)
1. Edge cases
2. Error scenarios
3. Integration tests
4. Coverage gap analysis

## Test Writing Guidelines

### Service Test Template:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ServiceName } from '../service-name.service'

describe('ServiceName', () => {
  let service: ServiceName

  beforeEach(() => {
    service = new ServiceName() // or getInstance()
    // Reset any state
  })

  describe('methodName', () => {
    it('should handle success case', () => {
      // Arrange
      // Act
      // Assert
    })

    it('should handle error case', () => {
      // Test error scenarios
    })

    it('should handle edge cases', () => {
      // Test boundaries
    })
  })
})
```

### Component Test Template:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName {...props} />)
    expect(screen.getByText('Expected')).toBeInTheDocument()
  })

  it('handles user interaction', () => {
    render(<ComponentName {...props} />)
    fireEvent.click(screen.getByRole('button'))
    // Assert behavior
  })
})
```

## Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test src/services/__tests__/pdf.service.test.ts

# Watch mode
npm run test -- --watch

# UI mode
npm run test:ui
```

## Coverage Goals by Phase

- **Phase 1 Complete:** 60-65% coverage
- **Phase 2 Complete:** 75-80% coverage
- **Phase 3 Complete:** 85-88% coverage
- **Phase 4 Complete:** 90-92% coverage
- **Phase 5 Complete:** 92-95% coverage

## Notes

- Current infrastructure supports 90% thresholds
- All test utilities are configured
- Mocks are set up for browser APIs
- CI/CD will enforce coverage on merge
- Focus on critical paths first
- Don't test third-party code
- Don't test type definitions
- Skip shadcn/ui components (excluded from coverage)
