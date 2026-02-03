# PDF Editor Enhancement Plan
## Goal: Match Stirling-PDF Capabilities (100% Client-Side, Offline)

---

## Executive Summary

Enhance the existing pdf-viewer to include **60+ features** matching Stirling-PDF, while maintaining:
- 100% client-side processing (no server)
- Full offline capability (PWA)
- Existing architecture patterns (services → hooks → components)

**Current Stack:** React 19 + TypeScript + Vite + Tailwind + shadcn/ui + PDF.js + pdf-lib

---

## Research Findings: Recommended Libraries

| Feature | Library | Bundle Size | Offline | Notes |
|---------|---------|-------------|---------|-------|
| Split/Merge/Extract | pdf-lib (existing) | 0 KB (have it) | ✅ | Full support |
| Multi-file ZIP | jszip + file-saver | ~25 KB | ✅ | For split exports |
| Encryption | pdf-lib-with-encrypt | +5 KB | ✅ | Drop-in replacement |
| OCR | Tesseract.js | ~12 MB | ✅ | Lazy-load on demand |
| Images→PDF | pdf-lib (existing) | 0 KB | ✅ | Already supported |
| PDF→Images | PDF.js (existing) | 0 KB | ✅ | Canvas export |
| HTML→PDF | html2pdf.js | ~80 KB | ✅ | Image-based output |
| Markdown→PDF | marked (existing) + html2pdf | ~8 KB new | ✅ | Chain conversion |
| Compression | Ghostscript-WASM | ~18 MB | ✅ | Lazy-load, 40-70% reduction |
| Image optimization | compressorjs | ~5 KB | ✅ | Pre-embed optimization |
| PDF Comparison | pixelmatch | ~3 KB | ✅ | Visual diff |
| Auto-redact | Custom regex + search | ~1 KB | ✅ | Pattern matching |

**Total new bundle (eager):** ~120 KB
**Total lazy-loaded (on-demand):** ~30 MB (OCR + Compression)

---

## Architecture: Following Existing Patterns

### Service Pattern (from pdf.service.ts, annotation.service.ts)
```typescript
// Singleton with getInstance() or direct export
class FeatureService {
  private static instance: FeatureService;
  static getInstance(): FeatureService { ... }

  // Subscriber pattern for state updates
  private subscribers = new Set<() => void>();
  subscribe(callback: () => void): () => void { ... }

  // Progress callbacks for long operations
  setProgressCallback(cb: (progress: Progress) => void): void { ... }

  // History support for undo/redo (MAX_HISTORY = 20)
  private history: State[] = [];
  private historyIndex = -1;
}
export const featureService = FeatureService.getInstance();
```

### Hook Pattern (from usePDF.tsx, useAnnotations.tsx)
```typescript
// Context + Provider + useHook
const FeatureContext = createContext<FeatureContextType | null>(null);

export function FeatureProvider({ children }: { children: ReactNode }) {
  // State synced with service via subscription
  useEffect(() => {
    const unsubscribe = featureService.subscribe(() => {
      setState(featureService.getState());
    });
    return unsubscribe;
  }, []);

  return <FeatureContext.Provider value={...}>{children}</FeatureContext.Provider>;
}

export function useFeature() {
  const context = useContext(FeatureContext);
  if (!context) throw new Error('useFeature must be used within FeatureProvider');
  return context;
}
```

### Component Pattern (from ExportDialog.tsx)
```typescript
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureDialog({ isOpen, onClose }: DialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);

  // Use shadcn/ui components (Dialog, Button, Progress, etc.)
  // Use sonner for toast notifications
  // Handle errors with try/catch + toast.error()
}
```

---

## Phase 1: Page Operations

### New Files
```
src/services/split-merge.service.ts
src/hooks/useSplitMerge.tsx
src/types/split-merge.types.ts
src/components/SplitDialog/SplitDialog.tsx
src/components/MergeDialog/MergeDialog.tsx
src/components/ExtractDialog/ExtractDialog.tsx
```

### Features & Implementation

#### 1.1 Split PDF
```typescript
// Using pdf-lib (already have)
async splitPDF(
  pdfBytes: ArrayBuffer,
  ranges: PageRange[] // [{start: 1, end: 5}, {start: 6, end: 10}]
): Promise<Blob[]> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const results: Blob[] = [];

  for (const range of ranges) {
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(
      sourcePdf,
      Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start - 1 + i)
    );
    pages.forEach(page => newPdf.addPage(page));
    results.push(new Blob([await newPdf.save()], { type: 'application/pdf' }));
  }
  return results;
}
```

#### 1.2 Merge PDFs
```typescript
// Multi-file input, drag-to-reorder UI
async mergePDFs(files: File[]): Promise<Blob> {
  const resultPdf = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(bytes);
    const pages = await resultPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    pages.forEach(page => resultPdf.addPage(page));
  }

  return new Blob([await resultPdf.save()], { type: 'application/pdf' });
}
```

#### 1.3 Extract Pages
- Extend existing ThumbnailSidebar multi-select
- Add "Extract Selected" button
- Export as single PDF or ZIP of individual pages

#### 1.4 Scale Pages
```typescript
async scalePages(
  pdfBytes: ArrayBuffer,
  targetSize: 'letter' | 'a4' | 'a3' | { width: number; height: number }
): Promise<Blob>
```

#### 1.5 N-up Layout (2-up, 4-up)
```typescript
async createNupLayout(
  pdfBytes: ArrayBuffer,
  pagesPerSheet: 2 | 4 | 6 | 9,
  orientation: 'portrait' | 'landscape'
): Promise<Blob>
```

#### 1.6 Remove Blank Pages
```typescript
// Render each page, analyze canvas for near-white pixels
async detectBlankPages(
  document: PDFDocumentProxy,
  threshold: number = 0.99 // 99% white
): Promise<number[]>
```

### New Dependencies
```bash
npm install jszip file-saver
npm install -D @types/file-saver
```

---

## Phase 2: Security Features

### New Files
```
src/services/security.service.ts
src/services/sanitize.service.ts
src/hooks/useSecurity.tsx
src/types/security.types.ts
src/components/EncryptDialog/EncryptDialog.tsx
src/components/DecryptDialog/DecryptDialog.tsx
src/components/AutoRedactDialog/AutoRedactDialog.tsx
src/components/SanitizeDialog/SanitizeDialog.tsx
```

### Features & Implementation

#### 2.1 Password Protection (Encrypt)
```typescript
// Replace pdf-lib import with pdf-lib-with-encrypt (drop-in)
import { PDFDocument } from 'pdf-lib-with-encrypt';

async encryptPDF(
  pdfBytes: ArrayBuffer,
  options: {
    userPassword?: string;
    ownerPassword: string;
    permissions: {
      printing: 'none' | 'lowResolution' | 'highResolution';
      modifying: boolean;
      copying: boolean;
      annotating: boolean;
      fillingForms: boolean;
    };
  }
): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const encrypted = await pdfDoc.save({
    encrypt: {
      userPassword: options.userPassword,
      ownerPassword: options.ownerPassword,
      permissions: options.permissions,
    },
  });
  return new Blob([encrypted], { type: 'application/pdf' });
}
```

#### 2.2 Remove Password
```typescript
async decryptPDF(pdfBytes: ArrayBuffer, password: string): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { password });
  const decrypted = await pdfDoc.save(); // Save without encryption
  return new Blob([decrypted], { type: 'application/pdf' });
}
```

#### 2.3 Auto-Redact (Pattern Detection)
```typescript
const SENSITIVE_PATTERNS = {
  SSN: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  CREDIT_CARD: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b/g,
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
  IP_ADDRESS: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
};

// Integrate with existing searchService for text extraction
// Convert matches to RedactionAnnotation[] for preview
// User confirms before applying
```

#### 2.4 Sanitize PDF
```typescript
async sanitizePDF(pdfBytes: ArrayBuffer): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Remove metadata
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('');
  pdfDoc.setCreator('');
  pdfDoc.setCreationDate(new Date(0));
  pdfDoc.setModificationDate(new Date(0));

  // Note: pdf-lib cannot remove embedded JavaScript or attachments
  // Document this limitation in UI

  return new Blob([await pdfDoc.save()], { type: 'application/pdf' });
}
```

### New Dependencies
```bash
npm install pdf-lib-with-encrypt
# Then update imports from 'pdf-lib' to 'pdf-lib-with-encrypt'
```

---

## Phase 3: Format Conversion

### New Files
```
src/services/conversion.service.ts
src/hooks/useConversion.tsx
src/types/conversion.types.ts
src/components/ImagesToPdfDialog/ImagesToPdfDialog.tsx
src/components/PdfToImagesDialog/PdfToImagesDialog.tsx
src/components/HtmlToPdfDialog/HtmlToPdfDialog.tsx
src/components/MarkdownToPdfDialog/MarkdownToPdfDialog.tsx
```

### Features & Implementation

#### 3.1 Images to PDF
```typescript
// Reuse pattern from signature.service.ts for image handling
async imagesToPDF(
  files: File[],
  options: {
    pageSize: 'letter' | 'a4' | 'fit';
    margin: number;
    quality: 'high' | 'medium' | 'low';
  }
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const image = file.type === 'image/png'
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);

    // Auto-size page to image or fit to standard size
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  return new Blob([await pdfDoc.save()], { type: 'application/pdf' });
}
```

#### 3.2 PDF to Images
```typescript
// Using existing PDF.js rendering from pdf.service.ts
async pdfToImages(
  document: PDFDocumentProxy,
  options: {
    format: 'png' | 'jpg' | 'webp';
    quality: number; // 0.1-1.0 for lossy formats
    scale: number;   // 1=96DPI, 2=192DPI, 3=288DPI
    pages?: number[]; // Specific pages, or all if undefined
  }
): Promise<Blob[]> {
  const pages = options.pages || Array.from({ length: document.numPages }, (_, i) => i + 1);
  const results: Blob[] = [];

  for (const pageNum of pages) {
    const page = await document.getPage(pageNum);
    const canvas = document.createElement('canvas');
    await pdfService.renderPage(page, options.scale, canvas);

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(resolve, `image/${options.format}`, options.quality);
    });
    results.push(blob);
  }

  return results;
}
```

#### 3.3 HTML to PDF
```typescript
// Lazy-load html2pdf.js
async htmlToPDF(
  html: string,
  options: { pageSize: 'a4' | 'letter'; margin: number }
): Promise<Blob> {
  const { default: html2pdf } = await import('html2pdf.js');

  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const blob = await html2pdf()
      .set({
        margin: options.margin,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: options.pageSize },
      })
      .from(container)
      .output('blob');
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}
```

#### 3.4 Markdown to PDF
```typescript
import { marked } from 'marked';
import DOMPurify from 'dompurify';

async markdownToPDF(markdown: string): Promise<Blob> {
  const rawHtml = await marked.parse(markdown);
  const cleanHtml = DOMPurify.sanitize(rawHtml);

  const styledHtml = `
    <html><head><style>
      body { font-family: system-ui, sans-serif; line-height: 1.6; padding: 20px; }
      code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
      pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
      blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
    </style></head><body>${cleanHtml}</body></html>
  `;

  return this.htmlToPDF(styledHtml, { pageSize: 'a4', margin: 10 });
}
```

### New Dependencies
```bash
npm install html2pdf.js dompurify
npm install -D @types/dompurify
```

---

## Phase 4: OCR Integration

### New Files
```
src/services/ocr.service.ts
src/hooks/useOCR.tsx
src/types/ocr.types.ts
src/components/OCRDialog/OCRDialog.tsx
```

### Features & Implementation

#### 4.1 OCR Service (Lazy-loaded)
```typescript
import type { Worker } from 'tesseract.js';

class OCRService {
  private worker: Worker | null = null;
  private isInitialized = false;

  // Lazy initialization - only loads when first needed
  async initialize(language: string = 'eng'): Promise<void> {
    if (this.isInitialized) return;

    const Tesseract = await import('tesseract.js');
    this.worker = await Tesseract.createWorker(language, undefined, {
      logger: (m) => this.progressCallback?.(m.progress * 100),
    });
    this.isInitialized = true;
  }

  async recognizeText(imageData: ImageData | HTMLCanvasElement): Promise<{
    text: string;
    lines: Array<{ text: string; bbox: BoundingBox }>;
  }> {
    if (!this.worker) await this.initialize();
    const result = await this.worker!.recognize(imageData);
    return {
      text: result.data.text,
      lines: result.data.lines.map(line => ({
        text: line.text,
        bbox: line.bbox,
      })),
    };
  }

  async terminate(): Promise<void> {
    await this.worker?.terminate();
    this.worker = null;
    this.isInitialized = false;
  }
}
```

#### 4.2 Create Searchable PDF
```typescript
async makeSearchable(
  pdfBytes: ArrayBuffer,
  language: string = 'eng',
  onProgress?: (progress: number, page: number, total: number) => void
): Promise<Blob> {
  const sourcePdf = await PDFDocument.load(pdfBytes);
  const document = await pdfService.loadDocument(new Blob([pdfBytes]));

  for (let i = 0; i < document.numPages; i++) {
    onProgress?.(0, i + 1, document.numPages);

    // Render page to canvas
    const page = await document.getPage(i + 1);
    const canvas = document.createElement('canvas');
    await pdfService.renderPage(page, 2, canvas);

    // Run OCR
    const ocrResult = await ocrService.recognizeText(canvas);

    // Add invisible text layer to PDF page
    const pdfPage = sourcePdf.getPage(i);
    for (const line of ocrResult.lines) {
      pdfPage.drawText(line.text, {
        x: line.bbox.x0,
        y: pdfPage.getHeight() - line.bbox.y1, // Flip Y coordinate
        size: (line.bbox.y1 - line.bbox.y0) * 0.8,
        opacity: 0, // Invisible but searchable
      });
    }

    onProgress?.(100, i + 1, document.numPages);
  }

  return new Blob([await sourcePdf.save()], { type: 'application/pdf' });
}
```

### New Dependencies
```bash
npm install tesseract.js
```

**Note:** Tesseract.js is ~12MB and should be lazy-loaded. Worker is only downloaded when user clicks "Make Searchable".

---

## Phase 5: Compression & Advanced Tools

### New Files
```
src/services/compression.service.ts
src/services/comparison.service.ts
src/services/pipeline.service.ts
src/hooks/useCompression.tsx
src/hooks/useComparison.tsx
src/components/CompressDialog/CompressDialog.tsx
src/components/CompareDialog/CompareDialog.tsx
src/components/PipelineBuilder/PipelineBuilder.tsx
```

### Features & Implementation

#### 5.1 PDF Compression (Two Approaches)

**Approach A: Image Optimization (Lightweight)**
```typescript
import Compressor from 'compressorjs';

// Compress images before embedding - reduces new PDFs by 30-50%
async compressImage(file: File, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality,
      maxWidth: 2000,
      maxHeight: 2000,
      mimeType: 'image/jpeg',
      success: resolve,
      error: reject,
    });
  });
}
```

**Approach B: Ghostscript WASM (Full Compression, Lazy-loaded)**
```typescript
// Only load when user explicitly requests compression
async compressPDF(
  pdfBytes: ArrayBuffer,
  quality: 'screen' | 'ebook' | 'printer' | 'prepress'
): Promise<Blob> {
  const gs = await import('ghostscript-wasm');
  // Process in web worker to avoid UI blocking
  // Returns 40-70% smaller PDF
}
```

#### 5.2 PDF Comparison
```typescript
import pixelmatch from 'pixelmatch';

async comparePDFs(
  doc1: PDFDocumentProxy,
  doc2: PDFDocumentProxy,
  pageNum: number
): Promise<{
  diffPixels: number;
  percentDifferent: number;
  diffCanvas: HTMLCanvasElement;
}> {
  // Render both pages to canvas
  const canvas1 = await this.renderPageToCanvas(doc1, pageNum);
  const canvas2 = await this.renderPageToCanvas(doc2, pageNum);

  const ctx1 = canvas1.getContext('2d')!;
  const ctx2 = canvas2.getContext('2d')!;
  const img1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
  const img2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = canvas1.width;
  diffCanvas.height = canvas1.height;
  const diffCtx = diffCanvas.getContext('2d')!;
  const diff = diffCtx.createImageData(canvas1.width, canvas1.height);

  const diffPixels = pixelmatch(
    img1.data, img2.data, diff.data,
    canvas1.width, canvas1.height,
    { threshold: 0.1, diffColor: [255, 0, 0] }
  );

  diffCtx.putImageData(diff, 0, 0);

  return {
    diffPixels,
    percentDifferent: (diffPixels / (canvas1.width * canvas1.height)) * 100,
    diffCanvas,
  };
}
```

#### 5.3 Pipeline Builder (Multi-tool Chaining)
```typescript
interface PipelineStep {
  type: 'split' | 'merge' | 'compress' | 'encrypt' | 'watermark' | 'ocr';
  options: Record<string, unknown>;
}

async executePipeline(
  input: ArrayBuffer,
  steps: PipelineStep[],
  onProgress?: (step: number, total: number, message: string) => void
): Promise<Blob> {
  let currentPdf = input;

  for (let i = 0; i < steps.length; i++) {
    onProgress?.(i + 1, steps.length, `Executing ${steps[i].type}...`);

    switch (steps[i].type) {
      case 'compress':
        currentPdf = await compressionService.compress(currentPdf, steps[i].options);
        break;
      case 'encrypt':
        currentPdf = await securityService.encrypt(currentPdf, steps[i].options);
        break;
      // ... other operations
    }
  }

  return new Blob([currentPdf], { type: 'application/pdf' });
}
```

### New Dependencies
```bash
npm install pixelmatch compressorjs
# Optional (lazy-loaded, ~18MB):
npm install ghostscript-wasm
```

---

## Phase 6: Enhanced Viewing

### New Files
```
src/components/PresentationMode/PresentationMode.tsx
src/components/BookmarksPanel/BookmarksPanel.tsx
src/components/AttachmentsPanel/AttachmentsPanel.tsx
src/components/PDFInfoPanel/PDFInfoPanel.tsx
```

### Features

#### 6.1 Presentation Mode
- Fullscreen single-page view
- Arrow key / spacebar navigation
- Auto-advance option
- Exit with Escape key

#### 6.2 Bookmarks Panel
```typescript
// PDF.js already supports outline extraction
const outline = await document.getOutline();
// Render as collapsible tree, click to navigate
```

#### 6.3 PDF Info Panel
```typescript
const metadata = await document.getMetadata();
// Display: title, author, subject, keywords, creator, producer, dates, page count, file size
```

---

## Implementation Priority

### Quick Wins (1-2 days each)
1. Split/Merge/Extract - pdf-lib already supports this
2. PDF Info Panel - PDF.js already has metadata API
3. Bookmarks Panel - PDF.js has outline API
4. Auto-redact patterns - Extend existing search service

### Medium Effort (3-5 days each)
5. Encryption/Decryption - Drop-in library replacement
6. Images↔PDF conversion - Extend existing patterns
7. PDF Comparison - pixelmatch is lightweight
8. Presentation Mode - UI only

### Higher Effort (1-2 weeks each)
9. HTML/Markdown to PDF - New dependency, testing
10. OCR integration - Large lazy-loaded dependency
11. Pipeline builder - Complex UI orchestration
12. Full compression - Ghostscript WASM integration

---

## Verification Plan

### Unit Tests (Vitest)
- Each new service: split, merge, encrypt, convert, compress, compare
- Pattern matching for auto-redact
- Pipeline execution

### E2E Tests (Playwright)
- Full workflow: upload → edit → export
- Split PDF → download ZIP
- Merge multiple PDFs
- Encrypt → Decrypt round-trip
- OCR on scanned document

### Manual Testing
- Large PDFs (100+ pages) for memory management
- Various image formats for conversion
- Different PDF versions for compatibility
- Offline mode verification
- Cross-browser (Chrome, Firefox, Safari)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Memory with large PDFs | Page-by-page processing, canvas cleanup |
| Tesseract.js load time | Lazy-load, progress indicator, cancel option |
| Ghostscript WASM size | Optional feature, lazy-load on explicit request |
| pdf-lib-with-encrypt maintenance | Fork if needed, it's MIT licensed |
| Browser compatibility | Feature detection, graceful degradation |

---

## Out of Scope

- **Office documents (Word, Excel, PPT)** - Requires LibreOffice server
- **Certificate-based signatures with TSA** - CORS restrictions
- **Full PDF/A compliance** - Requires font subsetting infrastructure
- **Booklet imposition** - Complex layout, low priority

---

## Key Files to Modify

1. `package.json` - Add new dependencies
2. `src/App.tsx` - Add new providers, toolbar integration
3. `src/services/export.service.ts` - Integration point for new features
4. `src/components/Toolbar/Toolbar.tsx` - New tool buttons
5. `src/services/search.service.ts` - Extend for auto-redact

---

## LLM Self-Validation & Testing Framework

### Philosophy: Test-Driven AI Development

Every feature implementation follows this cycle:
1. **Write tests first** - Define expected behavior
2. **Run tests** - Verify they fail (red)
3. **Implement feature** - Write code to pass tests
4. **Run tests** - Verify they pass (green)
5. **Refactor** - Clean up while tests stay green

### Structured Test Output for LLM Interpretation

```typescript
// tests/utils/llm-test-reporter.ts
interface LLMFriendlyTestOutput {
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    successRate: number;
  };
  failures: {
    testName: string;
    category: 'assertion' | 'syntax' | 'runtime' | 'timeout';
    details: {
      expectedBehavior: string;
      actualBehavior: string;
      affectedCode: { file: string; line: number; snippet: string };
    };
    suggestedFix: string;
  }[];
  recommendations: string[];
}
```

### Test Structure Per Feature

Each new feature requires these test layers:

```
src/services/split-merge.service.ts
├── __tests__/
│   ├── split-merge.service.test.ts    # Unit tests
│   └── split-merge.integration.test.ts # Integration tests
e2e/
├── split-merge.spec.ts                 # E2E workflow tests
```

### Feature Acceptance Criteria Tests

```typescript
// Example: Split PDF Feature
describe('Split PDF Feature', () => {
  // Acceptance Criteria 1: Can split by page range
  it('AC1: splits PDF by specified page ranges', async () => {
    const pdf = await loadPDF('10-page.pdf');
    const result = await splitService.splitByRanges(pdf, [
      { start: 1, end: 3 },
      { start: 4, end: 7 },
      { start: 8, end: 10 }
    ]);

    expect(result.length).toBe(3);
    expect(await getPageCount(result[0])).toBe(3);
    expect(await getPageCount(result[1])).toBe(4);
    expect(await getPageCount(result[2])).toBe(3);
  });

  // Acceptance Criteria 2: Preserves annotations
  it('AC2: preserves annotations in split PDFs', async () => {
    const pdf = await loadPDF('annotated.pdf');
    const originalAnnotations = await getAnnotations(pdf, 2);

    const result = await splitService.splitByRanges(pdf, [{ start: 1, end: 3 }]);
    const splitAnnotations = await getAnnotations(result[0], 2);

    expect(splitAnnotations.length).toBe(originalAnnotations.length);
  });

  // Acceptance Criteria 3: Handles edge cases
  it('AC3: throws error for invalid page range', async () => {
    const pdf = await loadPDF('5-page.pdf');

    await expect(
      splitService.splitByRanges(pdf, [{ start: 1, end: 10 }])
    ).rejects.toThrow('Page range exceeds document length');
  });
});
```

### Progress Tracking via Tests

```typescript
// tests/progress/feature-checklist.ts
interface FeatureProgress {
  feature: string;
  phase: number;
  acceptanceCriteria: {
    id: string;
    description: string;
    testFile: string;
    status: 'pending' | 'passing' | 'failing';
  }[];
  overallProgress: number;
}

const featureProgress: FeatureProgress[] = [
  {
    feature: 'Split PDF',
    phase: 1,
    acceptanceCriteria: [
      { id: 'AC1', description: 'Split by page ranges', testFile: 'split.test.ts', status: 'pending' },
      { id: 'AC2', description: 'Preserve annotations', testFile: 'split.test.ts', status: 'pending' },
      { id: 'AC3', description: 'Handle edge cases', testFile: 'split.test.ts', status: 'pending' },
      { id: 'AC4', description: 'Export as ZIP', testFile: 'split.test.ts', status: 'pending' },
    ],
    overallProgress: 0
  },
  // ... more features
];
```

### Visual Regression Testing

```typescript
// e2e/visual/pdf-rendering.spec.ts
test('PDF page renders consistently', async ({ page }) => {
  await page.goto('/viewer');
  await uploadPDF(page, 'test-documents/sample.pdf');

  // Wait for canvas rendering
  await page.waitForSelector('canvas');
  await page.waitForLoadState('networkidle');

  // Visual snapshot with tolerance for anti-aliasing
  await expect(page.locator('.pdf-viewer')).toHaveScreenshot('pdf-page-1.png', {
    maxDiffPixels: 100,
    threshold: 0.2
  });
});

test('Annotations render correctly', async ({ page }) => {
  await page.goto('/viewer');
  await uploadPDF(page, 'test-documents/sample.pdf');

  // Add annotation
  await page.click('[data-tool="highlight"]');
  await page.mouse.click(200, 300);
  await page.mouse.move(400, 320);
  await page.mouse.click(400, 320);

  await expect(page.locator('.annotation-layer')).toHaveScreenshot('highlight-annotation.png');
});
```

### Self-Validation Workflow

```typescript
// scripts/validate-feature.ts
async function validateFeature(featureName: string): Promise<ValidationResult> {
  const feature = featureProgress.find(f => f.feature === featureName);

  // 1. Run unit tests
  const unitResults = await runTests(`**/${featureName.toLowerCase()}*.test.ts`);

  // 2. Run integration tests
  const integrationResults = await runTests(`**/${featureName.toLowerCase()}*.integration.test.ts`);

  // 3. Run E2E tests
  const e2eResults = await runPlaywright(`${featureName.toLowerCase()}.spec.ts`);

  // 4. Check coverage
  const coverage = await getCoverageForFiles([
    `src/services/${featureName.toLowerCase()}.service.ts`,
    `src/hooks/use${featureName}.tsx`
  ]);

  // 5. Generate structured report
  return {
    feature: featureName,
    unitTests: { passed: unitResults.passed, failed: unitResults.failed },
    integrationTests: { passed: integrationResults.passed, failed: integrationResults.failed },
    e2eTests: { passed: e2eResults.passed, failed: e2eResults.failed },
    coverage: { lines: coverage.lines, branches: coverage.branches },
    allCriteriaMet: feature.acceptanceCriteria.every(ac => ac.status === 'passing'),
    recommendations: generateRecommendations(unitResults, integrationResults, e2eResults, coverage)
  };
}
```

### Test Commands

```bash
# Run all tests with structured output
npm run test:validate

# Validate specific feature
npm run test:feature split-merge

# Run visual regression tests
npm run test:visual

# Generate progress report
npm run test:progress
```

### CI/CD Integration

```yaml
# .github/workflows/feature-validation.yml
name: Feature Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests with coverage
        run: npm run test:coverage

      - name: Check coverage thresholds
        run: |
          npm run test:coverage -- --reporter=json > coverage.json
          node scripts/check-coverage.js

      - name: Run E2E tests
        run: npm run e2e

      - name: Generate validation report
        run: npm run test:validate -- --json > validation-report.json

      - name: Post results to PR
        if: github.event_name == 'pull_request'
        run: node scripts/post-validation-results.js
```

### Error Feedback Format for LLM

```typescript
// When a test fails, generate actionable feedback
interface TestFailureFeedback {
  testName: string;
  file: string;
  line: number;

  // What the test expected
  expected: {
    description: string;
    value: unknown;
  };

  // What actually happened
  actual: {
    description: string;
    value: unknown;
  };

  // Where to look
  codeLocation: {
    file: string;
    function: string;
    line: number;
    snippet: string;
  };

  // Suggested fix
  suggestion: string;

  // Related tests that pass (for context)
  relatedPassingTests: string[];
}
```

### Validation Checkpoints

Before moving to next phase, verify:

| Checkpoint | Criteria |
|------------|----------|
| Unit tests pass | 100% of feature unit tests green |
| Integration tests pass | All service interactions work |
| E2E tests pass | User workflows complete successfully |
| Coverage met | >80% line coverage for new code |
| Visual regression | No unexpected UI changes |
| No TypeScript errors | `npm run typecheck` passes |
| No lint errors | `npm run lint` passes |
| Build succeeds | `npm run build` completes |

### Test-First Implementation Pattern

For each feature:

1. **Create test file first**
   ```typescript
   // src/services/__tests__/new-feature.test.ts
   describe('NewFeature', () => {
     it.todo('should do X'); // Define what to test
     it.todo('should handle Y error');
     it.todo('should integrate with Z');
   });
   ```

2. **Implement tests** (they will fail)
   ```typescript
   it('should do X', async () => {
     const result = await newFeatureService.doX(input);
     expect(result).toBe(expectedOutput);
   });
   ```

3. **Run tests** - confirm red
   ```bash
   npm test new-feature
   ```

4. **Implement feature** until tests pass

5. **Run full validation**
   ```bash
   npm run test:validate new-feature
   ```

### Sources

- [Domain-Driven TDD for AI Agents](https://langwatch.ai/blog/from-scenario-to-finished-how-to-test-ai-agents-with-domain-driven-tdd)
- [AgentCoder: Multi-Agent Code Generation with Testing](https://arxiv.org/html/2312.13010v1)
- [Visual Testing for PDFs](https://applitools.com/blog/3-steps-visual-testing-pdf/)
- [TestGen-LLM Framework](https://www.qodo.ai/blog/we-created-the-first-open-source-implementation-of-metas-testgen-llm/)
