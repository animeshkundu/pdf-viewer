# System Architecture

## Overview

A client-side PDF viewer/editor built with React + TypeScript, processing all documents in-browser with zero server dependency.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React UI Layer                        │
│  • App.tsx (main orchestrator)                          │
│  • Components (toolbar, sidebar, canvas, modals)        │
│  • State management (React hooks + context)             │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Core Services Layer                     │
│  • PDFService (rendering, parsing)                      │
│  • AnnotationService (overlays, persistence)            │
│  • ExportService (PDF generation)                       │
│  • StorageService (signatures, preferences)             │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  External Libraries                      │
│  • PDF.js (rendering)                                   │
│  • pdf-lib (manipulation)                               │
│  • Spark KV (persistence)                               │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React 19 + TypeScript | Component architecture, type safety |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI development, consistency |
| **PDF Rendering** | PDF.js | Canvas-based page rendering |
| **PDF Manipulation** | pdf-lib | Create/modify PDFs with annotations |
| **State** | React hooks + Context | Local state management |
| **Persistence** | Spark KV API | Signatures, preferences storage |
| **Icons** | Phosphor Icons | Consistent iconography |

## Core Modules

### 1. PDFService
**Responsibility**: Load, parse, and render PDF documents

**Key Functions**:
- `loadDocument(file: File): Promise<PDFDocument>`
- `renderPage(pageNum: number, scale: number): Promise<HTMLCanvasElement>`
- `getPageText(pageNum: number): Promise<string>`
- `searchDocument(query: string): Promise<SearchResult[]>`

**Implementation Notes**:
- Uses Web Workers for parsing to avoid blocking UI
- Implements virtualized rendering (only visible pages + buffer)
- Caches rendered canvases with LRU eviction

### 2. AnnotationService
**Responsibility**: Manage user annotations (highlights, drawings, text)

**Key Functions**:
- `addAnnotation(type: AnnotationType, data: AnnotationData): string`
- `updateAnnotation(id: string, data: Partial<AnnotationData>): void`
- `deleteAnnotation(id: string): void`
- `getPageAnnotations(pageNum: number): Annotation[]`

**Data Structure**:
```typescript
interface Annotation {
  id: string
  type: 'highlight' | 'pen' | 'shape' | 'text' | 'signature'
  pageNum: number
  bounds: { x: number, y: number, width: number, height: number }
  style: { color: string, opacity: number, thickness?: number }
  content?: string
  timestamp: number
}
```

**Storage**: Annotations stored in React state, exported to PDF on save

### 3. ExportService
**Responsibility**: Generate downloadable PDF with all modifications

**Key Functions**:
- `exportPDF(originalDoc: PDFDocument, annotations: Annotation[]): Promise<Uint8Array>`
- `applyPageModifications(doc: PDFDocument, changes: PageChange[]): void`

**Implementation**:
- Uses pdf-lib to create new PDF
- Renders annotations as permanent PDF elements
- Applies page rotations, deletions, reordering

### 4. StorageService
**Responsibility**: Persist user data locally

**Key Functions**:
- `saveSignature(imageData: string): Promise<string>`
- `getSignatures(): Promise<Signature[]>`
- `savePreferences(prefs: UserPreferences): Promise<void>`

**Implementation**: Uses Spark KV API for persistence

## State Management

### Global State (React Context)
```typescript
interface AppState {
  document: PDFDocument | null
  currentPage: number
  zoom: number
  annotations: Annotation[]
  selectedTool: Tool | null
  history: HistoryState
}
```

### Local Component State
- UI-only state (modals, tooltips, hover) stays in components
- Document state lifted to context
- Performance-critical state (canvas refs) kept local

## Performance Optimizations

### 1. Virtualized Rendering
- Only render pages in viewport + 2-page buffer
- Cleanup off-screen canvases to free memory
- Use Intersection Observer to detect visible pages

### 2. Web Workers
- Parse PDF in background thread
- Process text extraction off main thread
- Search operations in worker

### 3. Canvas Caching
- Cache rendered pages at multiple zoom levels
- LRU eviction when cache exceeds 50MB
- Reuse canvases for same page at same zoom

### 4. Lazy Loading
- Load thumbnails on demand as sidebar scrolls
- Delay non-critical features until document ready

## Data Flow

### Document Loading Flow
```
User selects file
  ↓
PDFService.loadDocument()
  ↓
Worker parses PDF → emit progress events
  ↓
First page renders
  ↓
UI shows document + thumbnails load in background
  ↓
Document ready
```

### Annotation Flow
```
User selects tool (e.g., highlight)
  ↓
Canvas captures mouse events
  ↓
AnnotationService.addAnnotation()
  ↓
Annotation rendered on SVG overlay
  ↓
History updated (for undo)
  ↓
UI updates
```

### Export Flow
```
User clicks Download
  ↓
ExportService.exportPDF()
  ↓
pdf-lib creates new document
  ↓
Annotations embedded as PDF elements
  ↓
Page modifications applied
  ↓
Uint8Array generated
  ↓
Browser download triggered
```

## File Structure

```
src/
├── App.tsx                      # Main app component
├── components/
│   ├── PDFViewer/
│   │   ├── PDFViewer.tsx        # Main viewer component
│   │   ├── PDFCanvas.tsx        # Individual page canvas
│   │   ├── AnnotationLayer.tsx  # SVG overlay for annotations
│   │   └── VirtualPageList.tsx  # Virtualized page rendering
│   ├── Toolbar/
│   │   ├── Toolbar.tsx          # Main toolbar
│   │   ├── MarkupToolbar.tsx    # Annotation tools
│   │   └── ZoomControls.tsx     # Zoom UI
│   ├── Sidebar/
│   │   ├── ThumbnailSidebar.tsx # Page thumbnails
│   │   └── Thumbnail.tsx        # Individual thumbnail
│   ├── Modals/
│   │   ├── SignatureModal.tsx   # Signature creation
│   │   └── ShortcutsModal.tsx   # Keyboard shortcuts
│   └── ui/                      # shadcn components
├── services/
│   ├── pdf.service.ts           # PDF.js wrapper
│   ├── annotation.service.ts    # Annotation management
│   ├── export.service.ts        # PDF generation
│   └── storage.service.ts       # Persistence
├── hooks/
│   ├── usePDF.ts                # PDF state management
│   ├── useAnnotations.ts        # Annotation state
│   └── useKeyboardShortcuts.ts  # Keyboard handling
├── types/
│   ├── pdf.types.ts             # PDF-related types
│   └── annotation.types.ts      # Annotation types
└── utils/
    ├── canvas.utils.ts          # Canvas helpers
    └── geometry.utils.ts        # Coordinate math
```

## Security Considerations

1. **File Processing**: All done client-side, files never uploaded
2. **XSS Prevention**: Sanitize user text inputs in annotations
3. **Memory Safety**: Implement limits on document size (200MB max)
4. **CORS**: Not applicable (no external requests)

## Browser Compatibility

- **Chrome/Edge**: 100% support (target platform)
- **Firefox**: Full support
- **Safari**: Full support (requires some Canvas API polyfills)
- **Mobile**: Progressive enhancement (simplified UI)

## Deployment

- Static site deployment (Vercel, Netlify, GitHub Pages)
- No server required
- No build-time dependencies on external services
- PWA-ready for offline use
