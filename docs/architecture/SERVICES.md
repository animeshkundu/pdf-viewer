# Services Documentation

This document describes all services in the PDF viewer/editor application. Services follow a singleton pattern with subscriber-based reactivity.

## Service Pattern

All services follow this pattern:

```typescript
class ExampleService {
  private static instance: ExampleService
  private progressCallback?: (progress: Progress) => void

  private constructor() {}

  static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService()
    }
    return ExampleService.instance
  }

  setProgressCallback(callback: (progress: Progress) => void): void {
    this.progressCallback = callback
  }

  private updateProgress(stage: string, progress: number, message: string): void {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message })
    }
  }
}

export const exampleService = ExampleService.getInstance()
```

---

## pdf.service.ts

**Purpose**: Core PDF loading, parsing, and rendering using PDF.js.

**Location**: `/src/services/pdf.service.ts`

### Key Methods

| Method | Description |
|--------|-------------|
| `loadDocument(file, onProgress)` | Load a PDF file with progress callback |
| `getPage(pageNumber)` | Get a specific page proxy |
| `renderPage(page, scale, canvas, rotation)` | Render page to canvas with caching |
| `getPageDimensions(pageNumber)` | Get page width and height |
| `getDocument()` | Get current document proxy |
| `getOriginalBytes()` | Get original file as ArrayBuffer |
| `getFilename()` | Get original filename |
| `cleanup()` | Release all resources |

### Features

- **Web Worker Integration**: Uses PDF.js worker for parsing
- **Canvas Caching**: LRU cache with 50MB limit
- **HiDPI Support**: Renders at device pixel ratio for crisp display
- **Progress Reporting**: Emits loading progress events

### Usage

```typescript
import { pdfService } from '@/services/pdf.service'

// Load document
const doc = await pdfService.loadDocument(file, (progress) => {
  console.log(`Loading: ${progress}%`)
})

// Render a page
const page = await pdfService.getPage(1)
await pdfService.renderPage(page, 1.5, canvasElement)
```

---

## annotation.service.ts

**Purpose**: Manage user annotations with undo/redo support.

**Location**: `/src/services/annotation.service.ts`

### Key Methods

| Method | Description |
|--------|-------------|
| `addAnnotation(annotation)` | Add new annotation, returns ID |
| `updateAnnotation(id, updates)` | Partial update annotation |
| `deleteAnnotation(id)` | Remove annotation |
| `getAnnotations(pageNum?)` | Get annotations, optionally filtered by page |
| `getAllAnnotations()` | Get all annotations |
| `undo()` | Undo last action |
| `redo()` | Redo last undone action |
| `canUndo()` / `canRedo()` | Check if undo/redo available |
| `subscribe(listener)` | Subscribe to changes |
| `exportAnnotations()` | Serialize to JSON |
| `importAnnotations(data)` | Load from JSON |

### Features

- **Subscriber Pattern**: React components subscribe to changes
- **History Management**: Up to 20 undo states
- **JSON Serialization**: Export/import annotation data

### Annotation Types

```typescript
interface Annotation {
  id: string
  type: 'highlight' | 'pen' | 'shape' | 'text' | 'signature' | 'redaction'
  pageNum: number
  bounds: { x: number; y: number; width: number; height: number }
  style: { color: string; opacity: number; thickness?: number }
  content?: string
  timestamp: number
}
```

---

## split-merge.service.ts

**Purpose**: Split, merge, extract pages, scale, and create N-up layouts.

**Location**: `/src/services/split-merge.service.ts`

### Key Methods

| Method | Description |
|--------|-------------|
| `splitPDF(pdfBytes, options, filename)` | Split PDF by ranges or every N pages |
| `extractPages(pdfBytes, pages, filename)` | Extract specific pages |
| `mergePDFs(files, options)` | Merge multiple PDF files |
| `scalePages(pdfBytes, target)` | Scale all pages to target size |
| `createNupLayout(pdfBytes, options)` | Create N-up layout (2, 4, 6, 9 per sheet) |
| `removePages(pdfBytes, pagesToRemove)` | Remove specific pages |
| `detectBlankPages(canvasData, options)` | Detect blank pages via pixel analysis |
| `getPageCount(file)` | Get page count from file |
| `downloadSplitResults(results, asZip)` | Download split results |

### Split Options

```typescript
interface SplitOptions {
  mode:
    | { type: 'ranges'; ranges: PageRange[] }
    | { type: 'everyN'; n: number }
    | { type: 'extractPages'; pages: number[] }
  filenamePattern?: string  // e.g., '{original}_{index}'
}
```

### N-up Options

```typescript
interface NupOptions {
  pagesPerSheet: 2 | 4 | 6 | 9
  orientation: 'portrait' | 'landscape'
  pageOrder: 'horizontal' | 'vertical'
  margin: number
}
```

### Supported Page Sizes

- Letter (612 x 792 pt)
- A4 (595 x 842 pt)
- A3 (842 x 1191 pt)
- Legal (612 x 1008 pt)

---

## security.service.ts

**Purpose**: PDF sanitization and sensitive data pattern detection.

**Location**: `/src/services/security.service.ts`

### Key Methods

| Method | Description |
|--------|-------------|
| `getMetadata(pdfBytes)` | Extract PDF metadata |
| `sanitizePDF(pdfBytes, options)` | Remove selected metadata |
| `scanTextForSensitiveData(text, patterns, pageNum)` | Scan text for patterns |
| `scanPagesForSensitiveData(pageTexts, patterns)` | Scan multiple pages |
| `validatePattern(pattern)` | Validate custom regex |
| `getAvailablePatterns()` | Get built-in patterns |
| `isEncryptionSupported()` | Returns false (client-side limitation) |

### Sanitize Options

```typescript
interface SanitizeOptions {
  removeTitle: boolean
  removeAuthor: boolean
  removeSubject: boolean
  removeKeywords: boolean
  removeProducer: boolean
  removeCreator: boolean
  removeDates: boolean
}
```

### Built-in Sensitive Data Patterns

| Pattern | Description |
|---------|-------------|
| `ssn` | Social Security Numbers (XXX-XX-XXXX) |
| `creditCard` | Credit card numbers |
| `email` | Email addresses |
| `phone` | Phone numbers (US format) |

### Encryption Limitation

Password protection (encryption) is not supported because pdf-lib doesn't support encryption natively, and client-side JavaScript cannot provide cryptographically secure PDF encryption without server-side components.

---

## conversion.service.ts

**Purpose**: Convert between images and PDFs, HTML/Markdown to PDF.

**Location**: `/src/services/conversion.service.ts`

### Key Methods

| Method | Description |
|--------|-------------|
| `imagesToPDF(files, options)` | Convert images to single PDF |
| `pdfToImages(pdfBytes, options)` | Export PDF pages as images |
| `htmlToPDF(html, options)` | Convert HTML to PDF |
| `markdownToPDF(markdown, options)` | Convert Markdown to PDF |
| `downloadAsZip(result, filename)` | Download images as ZIP |
| `getImageDimensions(file)` | Get image dimensions |
| `createImagePreview(file, maxSize)` | Create thumbnail preview |

### Image to PDF Options

```typescript
interface ImagesToPDFOptions {
  pageSize: 'letter' | 'a4' | 'fit'
  margin: number  // in points
}
```

### PDF to Images Options

```typescript
interface PDFToImagesOptions {
  format: 'png' | 'jpg'
  scale: number      // 1 = 72 DPI, 2 = 144 DPI, etc.
  pages?: number[]   // specific pages, or all if undefined
}
```

### Supported Image Formats

- Input: PNG, JPEG, WebP, BMP (converted via canvas)
- Output: PNG, JPEG

---

## ocr.service.ts

**Purpose**: OCR processing using Tesseract.js (lazy-loaded).

**Location**: `/src/services/ocr.service.ts`

### Key Methods

| Method | Description |
|--------|-------------|
| `initialize(language)` | Lazy-load Tesseract.js worker |
| `recognizeText(imageData)` | Run OCR on image data |
| `makeSearchable(pdfBytes, language, onProgress)` | Create searchable PDF |
| `extractTextFromPDF(pdfBytes, language, pages, onProgress)` | Extract text via OCR |
| `cancel()` | Cancel ongoing operation |
| `isReady()` | Check if worker initialized |
| `terminate()` | Free worker resources |

### Supported Languages

| Code | Language |
|------|----------|
| `eng` | English |
| `fra` | French |
| `deu` | German |
| `spa` | Spanish |
| `ita` | Italian |
| `por` | Portuguese |
| `chi_sim` | Chinese (Simplified) |
| `jpn` | Japanese |

### Features

- **Lazy Loading**: Tesseract.js (~12MB) loaded only when needed
- **Progress Reporting**: Per-page and overall progress
- **Cancellation**: Can cancel long-running operations
- **Invisible Text Layer**: OCR text added as invisible layer for search

### Usage

```typescript
import { ocrService } from '@/services/ocr.service'

// Make scanned PDF searchable
const result = await ocrService.makeSearchable(pdfBytes, 'eng', (progress, page, total) => {
  console.log(`Page ${page}/${total}: ${progress}%`)
})

// Download result
saveAs(result.blob, 'searchable.pdf')
```

---

## compression.service.ts

**Purpose**: Image compression for PDF optimization.

**Location**: `/src/services/compression.service.ts`

### Key Methods

| Method | Description |
|--------|-------------|
| `compressImage(file, options)` | Compress single image |
| `compressImages(files, options)` | Batch compress images |
| `previewCompression(file, quality)` | Preview compression result |
| `formatFileSize(bytes)` | Format bytes for display |
| `calculateSavings(original, compressed)` | Calculate savings percentage |
| `isCompressibleImage(file)` | Check if file is compressible |
| `getRecommendedQuality(fileSize)` | Get suggested quality setting |

### Compression Options

```typescript
interface CompressionOptions {
  quality: number         // 0.1 - 1.0
  maxWidth?: number       // Max width in pixels
  maxHeight?: number      // Max height in pixels
  convertToJpeg?: boolean // Convert PNG/WebP to JPEG
  mimeType?: string       // Output format
}
```

### Recommended Quality by File Size

| File Size | Recommended Quality |
|-----------|-------------------|
| > 5 MB | 0.6 |
| > 2 MB | 0.7 |
| > 1 MB | 0.8 |
| < 1 MB | 0.85 |

---

## comparison.service.ts

**Purpose**: Visual comparison of PDF pages using pixelmatch.

**Location**: `/src/services/comparison.service.ts`

### Key Methods

| Method | Description |
|--------|-------------|
| `comparePDFs(pdf1Bytes, pdf2Bytes, pageNum, options)` | Compare single page |
| `compareMultiplePages(pdf1Bytes, pdf2Bytes, pages, options)` | Compare multiple pages |
| `getPageCount(pdfBytes)` | Get page count |
| `createSideBySideCanvas(c1, c2, diff)` | Create comparison view |
| `createOverlayCanvas(original, diff, opacity)` | Create overlay view |
| `exportComparisonAsPng(canvas)` | Export as PNG |
| `isSignificantlyDifferent(percent, threshold)` | Check if difference significant |

### Comparison Options

```typescript
interface ComparisonOptions {
  threshold?: number        // Pixel difference threshold (0-1), default 0.1
  includeAntiAliasing?: boolean  // Include anti-aliasing differences
  diffColor?: [number, number, number]  // RGB color for diff pixels
  scale?: number           // Render scale, default 1.5
}
```

### Comparison Result

```typescript
interface ComparisonResult {
  diffPixels: number       // Count of different pixels
  totalPixels: number      // Total pixels compared
  percentDifferent: number // Percentage different
  diffCanvas: HTMLCanvasElement  // Visual diff
  pdf1Canvas: HTMLCanvasElement  // First PDF render
  pdf2Canvas: HTMLCanvasElement  // Second PDF render
  width: number
  height: number
}
```

---

## export.service.ts

**Purpose**: Generate downloadable PDFs with annotations.

**Location**: `/src/services/export.service.ts`

### Key Methods

| Method | Description |
|--------|-------------|
| `exportPDF(originalBytes, annotations, options)` | Generate PDF with annotations |
| `applyAnnotations(pdfDoc, annotations)` | Apply annotations to document |
| `applyPageModifications(pdfDoc, modifications)` | Apply rotations, deletions |

### Export Options

```typescript
interface ExportOptions {
  flattenAnnotations?: boolean  // Make annotations permanent
  includeWatermark?: boolean
  watermarkConfig?: WatermarkConfig
  filename?: string
}
```

---

## search.service.ts

**Purpose**: Text extraction and search across document.

**Location**: `/src/services/search.service.ts`

### Key Methods

| Method | Description |
|--------|-------------|
| `extractPageText(page, pageNum)` | Extract text with positions |
| `searchInDocument(doc, query, options)` | Search entire document |
| `searchInPage(textContent, query, options)` | Search single page |
| `calculateBoundingBoxes(textContent, start, length)` | Get highlight regions |

### Search Options

```typescript
interface SearchOptions {
  caseSensitive?: boolean
  wholeWord?: boolean
}
```

### Features

- **Text Caching**: Extracted text cached per page
- **Position Tracking**: Stores transform matrices for highlighting
- **Progress Reporting**: For long document searches

---

## Additional Services

### watermark.service.ts
Applies text or image watermarks to PDF pages.

### page-management.service.ts
Handles page reordering, rotation, and deletion state.

### signature.service.ts
Manages saved signatures in IndexedDB.

### form.service.ts
Handles PDF form field detection and filling.
