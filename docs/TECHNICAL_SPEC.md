# Technical Specification

## PDF Rendering Implementation

### PDF.js Integration

**Setup**:
```typescript
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
```

**Loading Document**:
```typescript
const loadPDF = async (file: File): Promise<PDFDocumentProxy> => {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  
  loadingTask.onProgress = ({ loaded, total }) => {
    const progress = (loaded / total) * 100
    updateProgress(progress)
  }
  
  return await loadingTask.promise
}
```

**Rendering Page**:
```typescript
const renderPage = async (
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number
) => {
  const viewport = page.getViewport({ scale })
  const context = canvas.getContext('2d')!
  
  canvas.width = viewport.width
  canvas.height = viewport.height
  
  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise
}
```

## Virtualized Page Rendering

### Strategy

Only render pages in viewport + buffer zone:

```typescript
const useVirtualPages = (
  totalPages: number,
  containerRef: RefObject<HTMLElement>
) => {
  const [visiblePages, setVisiblePages] = useState<number[]>([])
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .map(e => parseInt(e.target.dataset.pageNum!))
        setVisiblePages(visible)
      },
      { 
        root: containerRef.current,
        rootMargin: '200px', // Buffer zone
      }
    )
    
    // Observe all page placeholders
    const placeholders = containerRef.current?.querySelectorAll('.page-placeholder')
    placeholders?.forEach(p => observer.observe(p))
    
    return () => observer.disconnect()
  }, [totalPages])
  
  return visiblePages
}
```

## Annotation System

### Data Model

```typescript
type AnnotationType = 'highlight' | 'pen' | 'shape' | 'text' | 'signature'

interface BaseAnnotation {
  id: string
  type: AnnotationType
  pageNum: number
  timestamp: number
}

interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight'
  rects: DOMRect[]  // Multiple rects for multi-line highlights
  color: string
}

interface PenAnnotation extends BaseAnnotation {
  type: 'pen'
  points: Point[]
  color: string
  thickness: number
}

interface ShapeAnnotation extends BaseAnnotation {
  type: 'shape'
  shape: 'rectangle' | 'circle' | 'arrow' | 'line'
  bounds: { x: number, y: number, width: number, height: number }
  color: string
  thickness: number
}

interface TextAnnotation extends BaseAnnotation {
  type: 'text'
  position: Point
  content: string
  fontSize: number
  color: string
}

interface SignatureAnnotation extends BaseAnnotation {
  type: 'signature'
  position: Point
  imageData: string  // Base64 PNG
  width: number
  height: number
}

type Annotation = 
  | HighlightAnnotation 
  | PenAnnotation 
  | ShapeAnnotation 
  | TextAnnotation 
  | SignatureAnnotation
```

### SVG Overlay Implementation

Each page has an SVG overlay for annotations:

```typescript
const AnnotationLayer = ({ 
  pageNum, 
  annotations, 
  scale 
}: AnnotationLayerProps) => {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ 
        width: pageWidth * scale, 
        height: pageHeight * scale 
      }}
    >
      {annotations.map(annotation => (
        <AnnotationRenderer 
          key={annotation.id}
          annotation={annotation}
          scale={scale}
        />
      ))}
    </svg>
  )
}
```

### Highlight Implementation

Text highlighting using text layer coordinates:

```typescript
const addHighlight = async (
  page: PDFPageProxy,
  selection: Selection
): Promise<HighlightAnnotation> => {
  const textContent = await page.getTextContent()
  const viewport = page.getViewport({ scale: 1 })
  
  // Convert selection to PDF coordinates
  const rects = Array.from(selection.getRangeAt(0).getClientRects())
    .map(rect => convertToPDFCoords(rect, viewport))
  
  return {
    id: generateId(),
    type: 'highlight',
    pageNum: page.pageNumber,
    rects,
    color: currentHighlightColor,
    timestamp: Date.now(),
  }
}
```

### Pen Drawing

Smooth pen strokes with quadratic curves:

```typescript
const smoothPenStroke = (points: Point[]): string => {
  if (points.length < 2) return ''
  
  let path = `M ${points[0].x} ${points[0].y}`
  
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2
    const yc = (points[i].y + points[i + 1].y) / 2
    path += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`
  }
  
  const last = points[points.length - 1]
  path += ` L ${last.x} ${last.y}`
  
  return path
}
```

## PDF Export with pdf-lib

### Embedding Annotations

```typescript
import { PDFDocument, rgb } from 'pdf-lib'

const exportPDF = async (
  originalFile: File,
  annotations: Annotation[]
): Promise<Uint8Array> => {
  // Load original PDF
  const arrayBuffer = await originalFile.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  
  // Group annotations by page
  const annotsByPage = groupBy(annotations, 'pageNum')
  
  // Apply annotations to each page
  for (const [pageNum, pageAnnotations] of Object.entries(annotsByPage)) {
    const page = pdfDoc.getPage(parseInt(pageNum) - 1)
    
    for (const annotation of pageAnnotations) {
      await embedAnnotation(page, annotation)
    }
  }
  
  return await pdfDoc.save()
}

const embedAnnotation = async (
  page: PDFPage,
  annotation: Annotation
) => {
  switch (annotation.type) {
    case 'highlight':
      return embedHighlight(page, annotation)
    case 'pen':
      return embedPenStroke(page, annotation)
    case 'text':
      return embedText(page, annotation)
    case 'signature':
      return embedSignature(page, annotation)
  }
}

const embedHighlight = (page: PDFPage, annotation: HighlightAnnotation) => {
  const { r, g, b } = parseColor(annotation.color)
  
  annotation.rects.forEach(rect => {
    page.drawRectangle({
      x: rect.x,
      y: page.getHeight() - rect.y - rect.height,
      width: rect.width,
      height: rect.height,
      color: rgb(r, g, b),
      opacity: 0.3,
    })
  })
}

const embedSignature = async (
  page: PDFPage,
  annotation: SignatureAnnotation
) => {
  const pdfDoc = page.doc
  const imageBytes = base64ToUint8Array(annotation.imageData)
  const image = await pdfDoc.embedPng(imageBytes)
  
  page.drawImage(image, {
    x: annotation.position.x,
    y: page.getHeight() - annotation.position.y - annotation.height,
    width: annotation.width,
    height: annotation.height,
  })
}
```

## Undo/Redo System

```typescript
interface HistoryState {
  past: Annotation[][]
  present: Annotation[]
  future: Annotation[][]
}

const useHistory = (initialState: Annotation[]) => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialState,
    future: [],
  })
  
  const addToHistory = (newAnnotations: Annotation[]) => {
    setHistory({
      past: [...history.past, history.present],
      present: newAnnotations,
      future: [],
    })
  }
  
  const undo = () => {
    if (history.past.length === 0) return
    
    const previous = history.past[history.past.length - 1]
    const newPast = history.past.slice(0, -1)
    
    setHistory({
      past: newPast,
      present: previous,
      future: [history.present, ...history.future],
    })
  }
  
  const redo = () => {
    if (history.future.length === 0) return
    
    const next = history.future[0]
    const newFuture = history.future.slice(1)
    
    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: newFuture,
    })
  }
  
  return { annotations: history.present, addToHistory, undo, redo }
}
```

## Signature Storage

Using Spark KV for persistence:

```typescript
import { useKV } from '@github/spark/hooks'

interface StoredSignature {
  id: string
  imageData: string  // Base64 PNG
  timestamp: number
}

const useSignatures = () => {
  const [signatures, setSignatures] = useKV<StoredSignature[]>('pdf-signatures', [])
  
  const addSignature = async (imageData: string) => {
    const newSignature: StoredSignature = {
      id: generateId(),
      imageData,
      timestamp: Date.now(),
    }
    
    setSignatures(current => [...current, newSignature].slice(-5))  // Keep last 5
  }
  
  const deleteSignature = (id: string) => {
    setSignatures(current => current.filter(sig => sig.id !== id))
  }
  
  return { signatures, addSignature, deleteSignature }
}
```

## Search Implementation

```typescript
const searchDocument = async (
  pdfDoc: PDFDocumentProxy,
  query: string
): Promise<SearchResult[]> => {
  const results: SearchResult[] = []
  const normalizedQuery = query.toLowerCase()
  
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()
    
    const pageText = textContent.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
    
    const normalizedText = pageText.toLowerCase()
    let index = 0
    
    while ((index = normalizedText.indexOf(normalizedQuery, index)) !== -1) {
      results.push({
        pageNum,
        index,
        context: pageText.substring(index - 20, index + query.length + 20),
      })
      index += query.length
    }
  }
  
  return results
}
```

## Performance Monitoring

```typescript
const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    framesPerSecond: 60,
  })
  
  useEffect(() => {
    const measureRender = () => {
      const start = performance.now()
      requestAnimationFrame(() => {
        const duration = performance.now() - start
        setMetrics(prev => ({ ...prev, renderTime: duration }))
      })
    }
    
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = memory.usedJSHeapSize / 1048576
        setMetrics(prev => ({ ...prev, memoryUsage: usedMB }))
        
        // Warn if approaching limits
        if (usedMB > 500) {
          console.warn('High memory usage:', usedMB, 'MB')
        }
      }
    }
    
    const interval = setInterval(() => {
      measureRender()
      checkMemory()
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return metrics
}
```

## Error Handling

```typescript
class PDFError extends Error {
  constructor(
    message: string,
    public code: 'LOAD_FAILED' | 'RENDER_FAILED' | 'EXPORT_FAILED',
    public originalError?: Error
  ) {
    super(message)
    this.name = 'PDFError'
  }
}

const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    console.error(errorMessage, error)
    throw new PDFError(errorMessage, 'LOAD_FAILED', error as Error)
  }
}

// Usage
const safeLoadPDF = (file: File) => 
  withErrorHandling(
    () => loadPDF(file),
    'Failed to load PDF document'
  )
```
