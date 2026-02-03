# System Architecture Overview

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React 19 + TypeScript | Component architecture, type safety |
| **Build Tool** | Vite 7.x | Fast development, optimized production builds |
| **Styling** | Tailwind CSS 4.x + shadcn/ui | Utility-first styling, consistent components |
| **PDF Rendering** | PDF.js 5.x | Canvas-based page rendering, text extraction |
| **PDF Manipulation** | pdf-lib 1.17 | Create, modify, merge, split PDFs |
| **OCR** | Tesseract.js 7.x | Optical character recognition (lazy-loaded) |
| **State** | React Context + Hooks | Local and global state management |
| **Persistence** | IndexedDB (idb) | Signatures, preferences, offline storage |
| **Icons** | Phosphor Icons + Lucide | Consistent iconography |
| **Testing** | Vitest + Playwright | Unit, integration, and E2E testing |

## High-Level Architecture

```
+-----------------------------------------------------------------------+
|                         React UI Layer                                 |
|  - App.tsx (main orchestrator)                                        |
|  - Components (Toolbar, Sidebar, Viewer, Dialogs)                     |
|  - State management (React Context + Hooks)                           |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|                        Custom Hooks Layer                              |
|  - usePDF (document state)                                            |
|  - useAnnotations (markup state)                                      |
|  - useSplitMerge, useSecurity, useConversion                         |
|  - useSearch, useWatermark, usePageManagement                        |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|                     Services Layer (Singletons)                        |
|  - pdf.service.ts (rendering, parsing)                                |
|  - annotation.service.ts (overlays, undo/redo)                        |
|  - split-merge.service.ts (split, merge, extract, scale, N-up)       |
|  - security.service.ts (sanitize, auto-redact patterns)              |
|  - conversion.service.ts (images<->PDF, HTML/MD->PDF)                |
|  - ocr.service.ts (Tesseract.js integration, searchable PDF)         |
|  - compression.service.ts (image optimization)                        |
|  - comparison.service.ts (visual diff with pixelmatch)               |
|  - export.service.ts (PDF generation)                                 |
|  - search.service.ts (text extraction, matching)                      |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|                      External Libraries                                |
|  - PDF.js (rendering)         - Tesseract.js (OCR, lazy-loaded)      |
|  - pdf-lib (manipulation)     - pixelmatch (visual diff)             |
|  - jszip (archive creation)   - html2pdf.js (HTML conversion)        |
|  - compressorjs (image opt)   - file-saver (downloads)               |
+-----------------------------------------------------------------------+
```

## Design Principles

### 1. 100% Client-Side Processing
All document processing happens in the browser. Files never leave the user's device, ensuring:
- **Privacy**: Complete data sovereignty
- **Security**: No server-side data exposure
- **Availability**: Works offline as a PWA
- **Cost**: Zero server infrastructure

### 2. Service-Hook-Component Pattern
```
Service (Business Logic) -> Hook (React Bridge) -> Component (UI)
```

**Services**: Singleton classes that encapsulate business logic, maintain state, and provide subscriber patterns for reactivity.

**Hooks**: React bridges that subscribe to service changes and expose methods/state to components.

**Components**: Pure UI that consumes hooks and renders based on state.

### 3. Lazy Loading for Heavy Dependencies
Large libraries are dynamically imported only when needed:
- Tesseract.js (~12MB) - Loaded on OCR feature use
- html2pdf.js (~80KB) - Loaded on HTML conversion

### 4. Progressive Enhancement
Core functionality (view, annotate, export) works everywhere. Advanced features (OCR, compression) are additive.

## Data Flow

### Document Loading Flow
```
User selects file
       |
       v
pdfService.loadDocument()
       |
       v
PDF.js worker parses PDF (emits progress events)
       |
       v
First page renders to canvas
       |
       v
UI shows document + thumbnails load in background
       |
       v
Document ready for interaction
```

### Annotation Flow
```
User selects tool (e.g., highlight)
       |
       v
Canvas captures mouse events
       |
       v
annotationService.addAnnotation()
       |
       v
History updated (for undo/redo)
       |
       v
Subscribers notified
       |
       v
Annotation rendered on overlay layer
```

### Export Flow
```
User clicks Download
       |
       v
exportService.exportPDF()
       |
       v
pdf-lib loads original document bytes
       |
       v
Annotations embedded as PDF elements
       |
       v
Page modifications applied (rotate, delete, reorder)
       |
       v
Uint8Array generated
       |
       v
Browser download triggered via file-saver
```

## File Structure

```
src/
├── App.tsx                      # Main app component
├── main.tsx                     # Entry point
├── components/
│   ├── PDFViewer/               # Core viewer components
│   │   ├── PDFViewer.tsx        # Main viewer orchestrator
│   │   ├── PDFCanvas.tsx        # Individual page canvas
│   │   └── PDFTextLayer.tsx     # Text selection layer
│   ├── Toolbar/                 # Main application toolbar
│   ├── ThumbnailSidebar/        # Page navigation sidebar
│   ├── AnnotationLayer/         # Annotation rendering
│   ├── AnnotationDrawing/       # Annotation creation tools
│   ├── MarkupToolbar/           # Annotation tool selection
│   ├── SplitDialog/             # Split PDF dialog
│   ├── MergeDialog/             # Merge PDFs dialog
│   ├── EncryptDialog/           # Encryption (informational)
│   ├── SanitizeDialog/          # Metadata removal
│   ├── ImagesToPdfDialog/       # Image to PDF conversion
│   ├── PdfToImagesDialog/       # PDF to image export
│   ├── OCRDialog/               # OCR processing
│   ├── CompressDialog/          # Image compression
│   ├── CompareDialog/           # PDF visual comparison
│   ├── PresentationMode/        # Fullscreen presentation
│   ├── BookmarksPanel/          # PDF outline navigation
│   ├── PDFInfoPanel/            # Document metadata display
│   └── ui/                      # shadcn/ui components
├── services/
│   ├── pdf.service.ts           # PDF.js wrapper (singleton)
│   ├── annotation.service.ts    # Annotation management
│   ├── split-merge.service.ts   # Split/merge/extract/scale
│   ├── security.service.ts      # Sanitize, pattern detection
│   ├── conversion.service.ts    # Format conversion
│   ├── ocr.service.ts           # Tesseract.js integration
│   ├── compression.service.ts   # Image compression
│   ├── comparison.service.ts    # Visual diff
│   ├── export.service.ts        # PDF generation
│   ├── search.service.ts        # Text search
│   ├── watermark.service.ts     # Watermark application
│   └── page-management.service.ts # Page operations
├── hooks/
│   ├── usePDF.tsx               # Document state
│   ├── useAnnotations.tsx       # Annotation state
│   ├── useSplitMerge.tsx        # Split/merge operations
│   ├── useSecurity.tsx          # Security operations
│   ├── useSearch.tsx            # Search state
│   └── ...                      # Other feature hooks
├── types/
│   ├── pdf.types.ts             # PDF-related types
│   ├── annotation.types.ts      # Annotation types
│   ├── split-merge.types.ts     # Split/merge types
│   ├── security.types.ts        # Security types
│   ├── conversion.types.ts      # Conversion types
│   ├── ocr.types.ts             # OCR types
│   └── advanced-tools.types.ts  # Compression/comparison types
└── utils/
    └── performance.ts           # Performance monitoring
```

## Performance Optimizations

### Virtualized Rendering
- Only render pages in viewport + 2-page buffer
- Use Intersection Observer to detect visible pages
- Cleanup off-screen canvases to free memory

### Canvas Caching
- Cache rendered pages at current zoom level
- LRU eviction when cache exceeds 50MB
- Reuse canvases for same page at same zoom

### Web Workers
- PDF.js parses documents in background thread
- Main thread stays responsive during heavy operations

### Lazy Loading
- Heavy dependencies loaded on-demand
- Thumbnails load progressively as sidebar scrolls
- Non-critical features initialize after document ready

## Browser Compatibility

| Browser | Support Level |
|---------|--------------|
| Chrome/Edge 90+ | Full support (target platform) |
| Firefox 90+ | Full support |
| Safari 15+ | Full support |
| Mobile browsers | Progressive enhancement |

## PWA Capabilities

- **Offline**: Full functionality without internet
- **Installable**: Add to home screen
- **Service Worker**: Caches application assets
- **Responsive**: Works on desktop and mobile

## Security Considerations

1. **File Processing**: All processing is client-side; files never uploaded
2. **XSS Prevention**: User inputs sanitized with DOMPurify
3. **Memory Safety**: Document size limits (200MB max)
4. **CORS**: Not applicable (no external requests)
