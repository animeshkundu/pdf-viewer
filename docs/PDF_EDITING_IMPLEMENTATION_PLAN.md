# PDF Editing Implementation Plan

## Overview

Based on comprehensive research (see `PDF_EDITING_RESEARCH.md`), this document outlines the implementation plan for adding **practical PDF editing capabilities** without introducing side effects or technical debt.

## Key Insight

**True PDF content editing (modifying existing text/images) is not feasible in a client-side web app** without:
- Complex content stream parsing (months of work)
- Server-side processing
- Risk of PDF corruption
- Poor user experience

**Instead**: Focus on high-value, feasible features that users actually need.

## What Users Want vs. What's Possible

| User Request | What They Really Need | Our Solution |
|--------------|----------------------|--------------|
| "Edit text" | Fix typos, change words | ❌ Not feasible. Offer: Text box overlay tool (already have!) |
| "Fill forms" | Complete PDF forms | ✅ Phase 10: Form Filling |
| "Remove images" | Delete/replace images | ⚠️ Partial: Cover with white/replacement (Phase 12) |
| "Black out info" | Redact sensitive data | ✅ Phase 11: Redaction tool |
| "Add pages" | Insert blank pages | ✅ Phase 11: Insert pages |
| "Page numbers" | Add page numbering | ✅ Phase 11: Page numbers |
| "Watermark" | Brand documents | ✅ Phase 11: Watermarks |

## Phase 10: Form Filling (Priority: ⭐⭐⭐ HIGH)

### Goal
Enable users to fill interactive PDF form fields (text inputs, checkboxes, radio buttons, dropdowns).

### Why This Matters
- Common use case (government forms, applications, surveys)
- Technically feasible with pdf-lib
- Competitive feature parity with Preview, Sejda, etc.
- High user value

### Technical Approach

#### 1. Form Detection

```typescript
// src/services/form.service.ts

export interface FormField {
  id: string
  name: string
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'multiline'
  value: string | boolean | string[]
  pageNum: number
  bounds: BoundingBox
  options?: string[]  // For dropdowns
  required?: boolean
  readOnly?: boolean
}

export class FormService {
  private fields: Map<string, FormField> = new Map()
  
  /**
   * Detect and extract form fields from PDF
   */
  async detectForms(pdfDoc: PDFDocument): Promise<FormField[]> {
    try {
      const form = pdfDoc.getForm()
      const fields = form.getFields()
      const formFields: FormField[] = []
      
      for (const field of fields) {
        const name = field.getName()
        const type = this.getFieldType(field)
        const widget = field.acroField.getWidgets()[0]
        
        if (!widget) continue
        
        // Get position from widget
        const rect = widget.getRectangle()
        const pageRef = widget.P()
        const pageNum = this.getPageNumber(pdfDoc, pageRef)
        
        const formField: FormField = {
          id: `field-${name}-${pageNum}`,
          name,
          type,
          value: this.getFieldValue(field),
          pageNum,
          bounds: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          },
          options: this.getFieldOptions(field),
          required: false,  // TODO: Parse flags
          readOnly: field.isReadOnly()
        }
        
        formFields.push(formField)
        this.fields.set(formField.id, formField)
      }
      
      return formFields
    } catch (error) {
      console.warn('No forms detected or error:', error)
      return []
    }
  }
  
  /**
   * Update field value in memory
   */
  updateField(fieldId: string, value: string | boolean | string[]): void {
    const field = this.fields.get(fieldId)
    if (field) {
      field.value = value
      this.notifyObservers('fieldUpdated', field)
    }
  }
  
  /**
   * Apply all field values to PDF document
   */
  async applyFieldValues(pdfDoc: PDFDocument): Promise<void> {
    const form = pdfDoc.getForm()
    
    for (const field of this.fields.values()) {
      try {
        switch (field.type) {
          case 'text':
          case 'multiline':
            const textField = form.getTextField(field.name)
            textField.setText(field.value as string)
            break
            
          case 'checkbox':
            const checkbox = form.getCheckBox(field.name)
            if (field.value) {
              checkbox.check()
            } else {
              checkbox.uncheck()
            }
            break
            
          case 'radio':
            const radioGroup = form.getRadioGroup(field.name)
            if (field.value) {
              radioGroup.select(field.value as string)
            }
            break
            
          case 'dropdown':
            const dropdown = form.getDropdown(field.name)
            dropdown.select(field.value as string)
            break
        }
      } catch (error) {
        console.error(`Failed to set field ${field.name}:`, error)
      }
    }
  }
  
  /**
   * Flatten form (make read-only and embed values)
   */
  flattenForm(pdfDoc: PDFDocument): void {
    const form = pdfDoc.getForm()
    form.flatten()
  }
  
  private getFieldType(field: any): FormField['type'] {
    const constructor = field.constructor.name
    if (constructor.includes('Text')) return field.isMultiline?.() ? 'multiline' : 'text'
    if (constructor.includes('CheckBox')) return 'checkbox'
    if (constructor.includes('RadioGroup')) return 'radio'
    if (constructor.includes('Dropdown')) return 'dropdown'
    return 'text'
  }
  
  private getFieldValue(field: any): string | boolean {
    const constructor = field.constructor.name
    if (constructor.includes('Text')) return field.getText?.() || ''
    if (constructor.includes('CheckBox')) return field.isChecked?.() || false
    if (constructor.includes('RadioGroup')) return field.getSelected?.() || ''
    if (constructor.includes('Dropdown')) return field.getSelected?.()[0] || ''
    return ''
  }
  
  private getFieldOptions(field: any): string[] | undefined {
    if (field.getOptions) {
      return field.getOptions()
    }
    return undefined
  }
  
  private getPageNumber(pdfDoc: PDFDocument, pageRef: any): number {
    const pages = pdfDoc.getPages()
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].ref === pageRef) return i + 1
    }
    return 1
  }
}
```

#### 2. React Hook

```typescript
// src/hooks/useForm.tsx

interface FormContextValue {
  fields: FormField[]
  hasForm: boolean
  isFormMode: boolean
  setFormMode: (enabled: boolean) => void
  updateField: (fieldId: string, value: any) => void
  getField: (fieldId: string) => FormField | undefined
  flattenOnExport: boolean
  setFlattenOnExport: (flatten: boolean) => void
}

export function useForm(): FormContextValue {
  const formService = useMemo(() => new FormService(), [])
  const { document } = usePDF()
  const [fields, setFields] = useState<FormField[]>([])
  const [isFormMode, setFormMode] = useState(false)
  const [flattenOnExport, setFlattenOnExport] = useState(false)
  
  // Detect forms when document loads
  useEffect(() => {
    if (!document) {
      setFields([])
      return
    }
    
    const loadForms = async () => {
      // Load original PDF with pdf-lib
      const originalBytes = await getOriginalBytes()
      if (!originalBytes) return
      
      const pdfDoc = await PDFDocument.load(originalBytes)
      const detectedFields = await formService.detectForms(pdfDoc)
      setFields(detectedFields)
      
      // Auto-enable form mode if fields found
      if (detectedFields.length > 0) {
        setFormMode(true)
      }
    }
    
    loadForms()
  }, [document])
  
  const updateField = useCallback((fieldId: string, value: any) => {
    formService.updateField(fieldId, value)
    setFields([...formService.getAllFields()])
  }, [])
  
  const getField = useCallback((fieldId: string) => {
    return formService.getField(fieldId)
  }, [])
  
  return {
    fields,
    hasForm: fields.length > 0,
    isFormMode,
    setFormMode,
    updateField,
    getField,
    flattenOnExport,
    setFlattenOnExport
  }
}

export function FormProvider({ children }: { children: ReactNode }) {
  const value = useForm()
  return <FormContext.Provider value={value}>{children}</FormContext.Provider>
}
```

#### 3. UI Components

```typescript
// src/components/FormFieldOverlay.tsx

interface FormFieldOverlayProps {
  field: FormField
  onUpdate: (fieldId: string, value: any) => void
  scale: number  // Current zoom level
}

export function FormFieldOverlay({ field, onUpdate, scale }: FormFieldOverlayProps) {
  const { currentPage, zoom } = usePDF()
  
  // Only render if on current page
  if (field.pageNum !== currentPage) return null
  
  // Convert PDF coordinates to screen coordinates
  const bounds = convertPDFToScreenCoords(field.bounds, zoom, scale)
  
  const handleChange = (e: React.ChangeEvent<any>) => {
    const value = field.type === 'checkbox' 
      ? e.target.checked 
      : e.target.value
    onUpdate(field.id, value)
  }
  
  const style: CSSProperties = {
    position: 'absolute',
    left: bounds.x,
    top: bounds.y,
    width: bounds.width,
    height: bounds.height,
    zIndex: 25  // Above text layer (10) and annotations (20)
  }
  
  switch (field.type) {
    case 'text':
      return (
        <input
          type="text"
          value={field.value as string}
          onChange={handleChange}
          disabled={field.readOnly}
          required={field.required}
          style={style}
          className="form-field-input"
        />
      )
      
    case 'multiline':
      return (
        <textarea
          value={field.value as string}
          onChange={handleChange}
          disabled={field.readOnly}
          required={field.required}
          style={style}
          className="form-field-textarea"
        />
      )
      
    case 'checkbox':
      return (
        <div style={style} className="form-field-checkbox-container">
          <input
            type="checkbox"
            checked={field.value as boolean}
            onChange={handleChange}
            disabled={field.readOnly}
            className="form-field-checkbox"
          />
        </div>
      )
      
    case 'dropdown':
      return (
        <select
          value={field.value as string}
          onChange={handleChange}
          disabled={field.readOnly}
          style={style}
          className="form-field-select"
        >
          <option value="">Select...</option>
          {field.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )
      
    default:
      return null
  }
}

// src/components/FormModeToggle.tsx

export function FormModeToggle() {
  const { hasForm, isFormMode, setFormMode, fields } = useForm()
  
  if (!hasForm) return null
  
  return (
    <div className="flex items-center gap-2 px-3">
      <Switch
        checked={isFormMode}
        onCheckedChange={setFormMode}
        id="form-mode"
      />
      <Label htmlFor="form-mode" className="text-sm">
        Form Mode <Badge variant="secondary">{fields.length} fields</Badge>
      </Label>
    </div>
  )
}
```

#### 4. Integration with PDFCanvas

```typescript
// Update PDFCanvas to render form overlays

export function PDFCanvas({ pageNum }: PDFCanvasProps) {
  const { fields, isFormMode, updateField } = useForm()
  const { zoom, scale } = usePDF()
  
  // Filter fields for this page
  const pageFields = fields.filter(f => f.pageNum === pageNum)
  
  return (
    <div className="relative">
      {/* Existing canvas rendering */}
      <canvas ref={canvasRef} />
      
      {/* Text layer (existing) */}
      <PDFTextLayer pageNum={pageNum} />
      
      {/* Form fields */}
      {isFormMode && pageFields.map(field => (
        <FormFieldOverlay
          key={field.id}
          field={field}
          onUpdate={updateField}
          scale={scale}
        />
      ))}
      
      {/* Annotation layer (existing) */}
      <AnnotationLayer pageNum={pageNum} />
    </div>
  )
}
```

#### 5. Export Integration

```typescript
// Update ExportService to apply form values

export async function exportPDF(/* ... */): Promise<void> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes)
  
  // ... existing transformations ...
  
  // Apply form values (NEW)
  if (formFields && formFields.length > 0) {
    updateProgress({ stage: 'forms', progress: 0, message: 'Applying form values...' })
    await formService.applyFieldValues(pdfDoc)
    
    // Optionally flatten
    if (flattenForm) {
      formService.flattenForm(pdfDoc)
    }
  }
  
  // ... annotations, etc ...
}
```

### Implementation Checklist

#### Core Service
- [ ] Create `FormService` class
- [ ] Implement `detectForms()` method
- [ ] Implement field type detection
- [ ] Implement coordinate extraction
- [ ] Implement `updateField()` method
- [ ] Implement `applyFieldValues()` method
- [ ] Implement `flattenForm()` method
- [ ] Add observer pattern for updates

#### State Management
- [ ] Create `useForm` hook
- [ ] Create `FormProvider` component
- [ ] Integrate with App.tsx
- [ ] Auto-detect forms on document load
- [ ] Persist form values during session

#### UI Components
- [ ] Create `FormFieldOverlay` component
- [ ] Support text inputs
- [ ] Support textareas
- [ ] Support checkboxes
- [ ] Support radio buttons
- [ ] Support dropdowns
- [ ] Add coordinate conversion utility
- [ ] Style form inputs to match PDF
- [ ] Create `FormModeToggle` component
- [ ] Add form indicator to toolbar

#### Integration
- [ ] Update `PDFCanvas` to render form overlays
- [ ] Add form layer to z-index stack
- [ ] Update `ExportService` to apply form values
- [ ] Add flatten option to export dialog
- [ ] Add "Form Mode" button to toolbar
- [ ] Update keyboard shortcuts (F for form mode?)

#### Testing
- [ ] Test with various PDF forms
- [ ] Test text field filling
- [ ] Test checkbox toggling
- [ ] Test dropdown selection
- [ ] Test radio button groups
- [ ] Test form flattening
- [ ] Test export with form values
- [ ] Test coordinate alignment at various zooms
- [ ] Test read-only fields
- [ ] Cross-browser testing

#### Documentation
- [ ] Update PRD with form filling feature
- [ ] Create ADR for form implementation
- [ ] Update user documentation
- [ ] Add form filling to feature list
- [ ] Update IMPLEMENTATION_STATUS.md

### Estimated Time: 2-3 days

### Acceptance Criteria
- [ ] Automatically detects PDFs with forms
- [ ] Shows form field overlays in form mode
- [ ] All field types supported (text, checkbox, radio, dropdown)
- [ ] Form values persist during session
- [ ] Export applies form values to PDF
- [ ] Option to flatten form (make read-only)
- [ ] Form fields align correctly at all zoom levels
- [ ] Visual indicator shows PDF has forms
- [ ] Toggle form mode on/off

---

## Phase 11: Document Enhancements (Priority: ⭐⭐ MEDIUM)

### Goal
Add useful document modification features: blank pages, redaction, watermarks, page numbers.

### 11.1: Insert Blank Pages

**Implementation**:

```typescript
// src/services/page-management.service.ts

export async function insertBlankPage(
  position: number,
  size: 'letter' | 'a4' | 'legal' = 'letter',
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<void> {
  const sizes = {
    letter: [612, 792],
    a4: [595, 842],
    legal: [612, 1008]
  }
  
  let [width, height] = sizes[size]
  if (orientation === 'landscape') {
    [width, height] = [height, width]
  }
  
  // Create blank page in PDF
  // Will require pdf-lib instance in export phase
  
  // For now, store intention
  this.blankPages.set(position, { size, orientation })
  this.notifyObservers('blankPageInserted', position)
}

// Apply during export
export async function applyBlankPages(pdfDoc: PDFDocument): Promise<void> {
  // Sort by position (descending) to avoid index shifting
  const positions = Array.from(this.blankPages.entries())
    .sort(([a], [b]) => b - a)
  
  for (const [position, config] of positions) {
    const page = pdfDoc.insertPage(position, [config.width, config.height])
    
    // Optional: Add subtle background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: config.width,
      height: config.height,
      color: rgb(1, 1, 1)
    })
  }
}
```

**UI**:
- Right-click context menu on thumbnail: "Insert Blank Page Before" / "After"
- Dialog for page size and orientation
- Visual indicator in thumbnail sidebar (placeholder page)

### 11.2: Redaction Tool

**Implementation**:

```typescript
// src/types/annotation.types.ts

export interface RedactionAnnotation extends BaseAnnotation {
  type: 'redaction'
  boxes: BoundingBox[]
  locked: true  // Cannot be deleted or modified
}

// src/components/MarkupToolbar/MarkupToolbar.tsx

// Add redaction tool button
<Button
  variant={activeTool === 'redaction' ? 'default' : 'ghost'}
  size="sm"
  onClick={() => setActiveTool('redaction')}
>
  <RectangleDashed className="h-4 w-4 mr-2" />
  Redact
</Button>

// Redaction tool works like highlight but:
// - Always black color
// - Opacity 1.0
// - Locked (can't be deleted without special action)
// - Shows warning on first use
```

**Warning Dialog**:
```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Redaction Notice</AlertDialogTitle>
      <AlertDialogDescription>
        Redaction covers text with black boxes, but does not permanently 
        remove it from the PDF. The original text remains in the file 
        structure and could potentially be recovered.
        
        For true redaction, use professional tools or edit the source document.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogAction>I Understand</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 11.3: Watermarks

**Implementation**:

```typescript
// src/services/enhancement.service.ts

export interface Watermark {
  text: string
  fontSize: number
  color: string
  opacity: number
  rotation: number  // degrees
  position: 'center' | 'diagonal' | 'custom'
  customX?: number
  customY?: number
  pages: 'all' | number[]
}

export async function applyWatermark(
  pdfDoc: PDFDocument,
  watermark: Watermark
): Promise<void> {
  const pages = pdfDoc.getPages()
  const targetPages = watermark.pages === 'all' 
    ? pages 
    : watermark.pages.map(n => pages[n - 1])
  
  for (const page of targetPages) {
    const { width, height } = page.getSize()
    
    let x: number, y: number
    if (watermark.position === 'center') {
      x = width / 2
      y = height / 2
    } else if (watermark.position === 'diagonal') {
      x = width / 2
      y = height / 2
    } else {
      x = watermark.customX!
      y = watermark.customY!
    }
    
    page.drawText(watermark.text, {
      x,
      y,
      size: watermark.fontSize,
      color: parseColor(watermark.color),
      opacity: watermark.opacity,
      rotate: degrees(watermark.rotation)
    })
  }
}
```

**UI**: Dialog with preview
- Text input
- Font size slider
- Color picker
- Opacity slider
- Rotation slider
- Position selector
- Page range selector
- Live preview on first page

### 11.4: Page Numbers

**Implementation**:

```typescript
export interface PageNumberConfig {
  format: (pageNum: number, totalPages: number) => string
  position: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right'
  fontSize: number
  color: string
  startPage: number  // First page to number (skip cover)
  startNumber: number  // What number to start with
  margin: number  // Distance from edge
}

export async function applyPageNumbers(
  pdfDoc: PDFDocument,
  config: PageNumberConfig
): Promise<void> {
  const pages = pdfDoc.getPages()
  
  for (let i = config.startPage - 1; i < pages.length; i++) {
    const page = pages[i]
    const { width, height } = page.getSize()
    
    const pageNum = config.startNumber + (i - config.startPage + 1)
    const text = config.format(pageNum, pages.length)
    
    // Calculate position
    const textWidth = estimateTextWidth(text, config.fontSize)
    let x: number, y: number
    
    switch (config.position) {
      case 'bottom-center':
        x = (width - textWidth) / 2
        y = config.margin
        break
      case 'bottom-left':
        x = config.margin
        y = config.margin
        break
      case 'bottom-right':
        x = width - textWidth - config.margin
        y = config.margin
        break
      // ... other positions
    }
    
    page.drawText(text, {
      x,
      y,
      size: config.fontSize,
      color: parseColor(config.color)
    })
  }
}
```

### Implementation Checklist

#### Insert Blank Pages
- [ ] Add method to PageManagementService
- [ ] Context menu option on thumbnails
- [ ] Page size/orientation dialog
- [ ] Visual indicator in sidebar
- [ ] Apply during export

#### Redaction Tool
- [ ] Add 'redaction' annotation type
- [ ] Add redaction button to toolbar
- [ ] Show warning on first use
- [ ] Lock redactions (special delete)
- [ ] Export as black rectangles

#### Watermarks (Optional)
- [ ] Create WatermarkService
- [ ] Watermark configuration dialog
- [ ] Live preview
- [ ] Apply during export

#### Page Numbers (Optional)
- [ ] Create PageNumberService
- [ ] Page number configuration dialog
- [ ] Format options
- [ ] Position options
- [ ] Apply during export

### Estimated Time: 2-3 days total
- Insert pages: 2-3 hours
- Redaction: 4-6 hours
- Watermarks: 2-3 hours (optional)
- Page numbers: 4-6 hours (optional)

---

## Phase 12: Advanced Features (Priority: ⭐ LOW / OPTIONAL)

### 12.1: Image Replacement

**Challenges**:
- PDF.js doesn't easily expose image locations
- Need image detection algorithm
- Complex coordinate calculations

**Recommendation**: Defer unless user demand is high

### 12.2: Bookmarks/Outline

**Feature**: Add/edit PDF bookmarks (navigation panel)

**Recommendation**: Low priority, niche use case

### 12.3: Link Editing

**Feature**: Add/edit hyperlinks and internal links

**Recommendation**: Low priority, complex UI

---

## Side Effect Mitigation Strategy

### 1. Layer Separation

```
Z-Index Stack (Final):
┌─────────────────────────────────┐
│ 30: Annotation Drawing          │ ← Active drawing
├─────────────────────────────────┤
│ 25: Form Fields                 │ ← NEW - Form inputs
├─────────────────────────────────┤
│ 20: Text Layer (highlight mode) │ ← Text selection
├─────────────────────────────────┤
│ 15: Annotations                 │ ← Rendered annotations
├─────────────────────────────────┤
│ 10: Text Layer (select mode)    │ ← Text selection
├─────────────────────────────────┤
│ 5: Search Highlights            │ ← Search results
├─────────────────────────────────┤
│ 0: Canvas                       │ ← PDF rendering
└─────────────────────────────────┘
```

**Principle**: Each layer has specific purpose, no conflicts

### 2. State Isolation

```typescript
// Each feature has isolated state
const { document, zoom } = usePDF()              // View state
const { annotations } = useAnnotations()          // Annotation state
const { transformations } = usePageManagement()   // Page state
const { fields } = useForm()                     // Form state (NEW)
const { enhancements } = useEnhancements()       // Watermarks, etc (NEW)
```

**Principle**: No cross-contamination of state

### 3. Export Order of Operations

```typescript
export async function exportPDF(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes)
  
  // 1. Page transformations (delete/rotate/reorder)
  await applyPageTransformations(pdfDoc, transformations)
  
  // 2. Structural additions (blank pages)
  await applyBlankPages(pdfDoc, blankPages)
  
  // 3. Document enhancements (watermarks, page numbers)
  await applyEnhancements(pdfDoc, enhancements)
  
  // 4. Form field values
  await applyFormValues(pdfDoc, fields)
  
  // 5. Annotations (always last - on top of everything)
  await embedAnnotations(pdfDoc, annotations)
  
  return await pdfDoc.save()
}
```

**Principle**: Deterministic, predictable order prevents conflicts

### 4. Coordinate System Consistency

```typescript
// All services use same coordinate conversion
export const CoordinateUtils = {
  pdfToScreen(pdfCoords: Point, viewport: PageViewport): Point {
    // ... consistent implementation
  },
  
  screenToPDF(screenCoords: Point, viewport: PageViewport): Point {
    // ... consistent implementation
  }
}

// Used by:
// - AnnotationService
// - FormService
// - TextLayer
// - SearchService
```

**Principle**: One source of truth for coordinate math

### 5. Performance Monitoring

```typescript
// Add performance tracking
export class PerformanceMonitor {
  trackMemory(): void {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize / 1048576
      console.log(`Memory usage: ${used.toFixed(2)} MB`)
      
      if (used > 500) {
        console.warn('High memory usage detected')
        // Trigger aggressive cleanup
      }
    }
  }
  
  trackRenderTime(operation: string, duration: number): void {
    if (duration > 500) {
      console.warn(`Slow operation: ${operation} took ${duration}ms`)
    }
  }
}
```

**Principle**: Monitor for regressions

### 6. Feature Flags

```typescript
// Enable features progressively
export const FEATURES = {
  FORMS: true,
  REDACTION: true,
  BLANK_PAGES: true,
  WATERMARKS: false,  // Not ready yet
  PAGE_NUMBERS: false,
  IMAGE_EDIT: false
}

// In components
if (FEATURES.FORMS) {
  return <FormModeToggle />
}
```

**Principle**: Safe rollout, easy disable if issues

### 7. Backwards Compatibility

```typescript
// Ensure old exports still work
export async function exportPDF_v2(): Promise<Uint8Array> {
  // New implementation with forms, etc.
}

// Fallback if issues
export async function exportPDF_v1(): Promise<Uint8Array> {
  // Original implementation
}

// Use v2 by default, v1 as emergency fallback
```

---

## User Communication Strategy

### Feature Explanations

```tsx
// src/components/FeatureGuide.tsx

export function FeatureGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What You Can Edit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            You CAN:
          </h4>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Add highlights, drawings, and text boxes</li>
            <li>Fill interactive form fields</li>
            <li>Insert, delete, and reorder pages</li>
            <li>Add signatures and watermarks</li>
            <li>Redact sensitive information (cover with black)</li>
            <li>Add page numbers and blank pages</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            You CANNOT:
          </h4>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Edit existing text in the PDF</li>
            <li>Remove or modify embedded images</li>
            <li>Convert PDF to Word/Excel</li>
            <li>OCR scanned documents</li>
          </ul>
        </div>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Why can't I edit text?</strong> PDFs are like printed pages - 
            text is positioned precisely, not editable like a Word document. 
            To modify existing text, use text boxes to overlay corrections or 
            edit the source document before converting to PDF.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
```

### In-App Tips

```tsx
// Show contextual tips
<Tooltip>
  <TooltipTrigger>
    <Button variant="ghost">Text Box</Button>
  </TooltipTrigger>
  <TooltipContent>
    Add new text to the PDF. To modify existing text, 
    position a text box over it.
  </TooltipContent>
</Tooltip>
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('FormService', () => {
  test('detects form fields', async () => {
    const pdf = await loadTestPDF('with-form.pdf')
    const fields = await formService.detectForms(pdf)
    expect(fields.length).toBeGreaterThan(0)
  })
  
  test('applies field values', async () => {
    // ...
  })
})

describe('PageManagementService', () => {
  test('inserts blank page', async () => {
    // ...
  })
})
```

### Integration Tests

```typescript
describe('Form Filling Workflow', () => {
  test('complete workflow', async () => {
    // 1. Load PDF with form
    // 2. Detect fields
    // 3. Fill fields
    // 4. Export
    // 5. Verify values in exported PDF
  })
})
```

### Manual Testing Checklist

- [ ] Test PDFs with various form types
- [ ] Test blank page insertion at different positions
- [ ] Test redaction with different selections
- [ ] Test watermark positioning
- [ ] Test page numbers with different configs
- [ ] Test export with all features combined
- [ ] Test performance with large PDFs
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsive testing

---

## Summary

### Implementation Priority

1. **Phase 10: Form Filling** (2-3 days) - Highest value, most requested
2. **Phase 11.1: Insert Blank Pages** (2-3 hours) - Easy win
3. **Phase 11.2: Redaction Tool** (4-6 hours) - Security feature
4. **Phase 11.3: Watermarks** (2-3 hours) - Professional feature
5. **Phase 11.4: Page Numbers** (4-6 hours) - Nice polish

### Total Estimated Time: 4-6 days

### What NOT to Build

- ❌ Text content editing (too complex, poor results)
- ❌ OCR (requires ML models, better as service)
- ❌ PDF to Word (better as external tool)
- ❌ Image detection/replacement (complex, low value)

### Success Metrics

- [ ] Forms can be filled and exported
- [ ] Blank pages can be inserted
- [ ] Sensitive info can be redacted
- [ ] Documents can be watermarked
- [ ] Page numbers can be added
- [ ] No performance regressions
- [ ] No state conflicts between features
- [ ] Export remains reliable
- [ ] User confusion reduced (clear messaging)

### Next Steps

1. Review and approve this plan
2. Begin Phase 10 implementation (Form Filling)
3. Test thoroughly before moving to Phase 11
4. Gather user feedback
5. Iterate on UX
6. Consider Phase 12 based on demand
