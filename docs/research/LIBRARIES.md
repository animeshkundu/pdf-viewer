# Library Choices and Rationale

This document explains the technical decisions behind library choices in the PDF viewer/editor.

## Core PDF Libraries

### PDF.js (Rendering)

**Version**: 5.4.449
**License**: Apache-2.0
**Bundle Size**: ~2MB (with worker)
**Purpose**: Render PDF documents to canvas

#### Why PDF.js?

| Criteria | PDF.js | Alternative |
|----------|--------|-------------|
| Battle-tested | Used by Firefox | - |
| Text extraction | Excellent | - |
| Maintenance | Mozilla-backed | - |
| License | Apache-2.0 | - |
| Browser support | All modern | - |

#### Alternatives Considered

**react-pdf**
- React wrapper around PDF.js
- Pro: Simpler API
- Con: Less control, lags behind PDF.js
- Rejected: Need low-level control for annotations

**PSPDFKit**
- Commercial SDK
- Pro: Feature-rich, professional support
- Con: Expensive ($5000+/year)
- Rejected: Cost prohibitive, not open source

**Browser native (embed/iframe)**
- Use browser's built-in viewer
- Pro: Zero bundle size
- Con: No customization, no annotations
- Rejected: Cannot meet requirements

---

### pdf-lib (Manipulation)

**Version**: 1.17.1
**License**: MIT
**Bundle Size**: ~300KB
**Purpose**: Create, modify, merge, split PDFs

#### Why pdf-lib?

| Criteria | pdf-lib | jsPDF | PDFKit |
|----------|---------|-------|--------|
| Modify existing PDFs | Excellent | Limited | Limited |
| Zero dependencies | Yes | No | No |
| Browser-native | Yes | Yes | Needs polyfills |
| TypeScript | Built-in | Available | Available |
| Bundle size | 300KB | 400KB | 500KB+ |

#### Alternatives Considered

**jsPDF**
- Pro: Popular, many plugins
- Con: Primarily for creation, not modification
- Rejected: Cannot edit existing PDFs

**PDFKit**
- Pro: Feature-rich, streaming API
- Con: Node.js-focused, needs polyfills
- Rejected: Bloated bundle with polyfills

---

## OCR

### Tesseract.js

**Version**: 7.0.0
**License**: Apache-2.0
**Bundle Size**: ~12MB (lazy-loaded)
**Purpose**: Optical character recognition

#### Why Tesseract.js?

| Criteria | Tesseract.js | Alternative |
|----------|--------------|-------------|
| Accuracy | State-of-the-art | - |
| Languages | 100+ supported | - |
| Client-side | 100% browser | - |
| Offline capable | Yes (after load) | - |

#### Why Lazy Loading?

12MB is too large for initial bundle. User experience:
1. User clicks "Make Searchable"
2. Progress shows "Loading OCR engine..."
3. Tesseract downloads (3-8 seconds)
4. Subsequent uses instant (cached)

#### Alternatives Considered

**Server-side OCR (Tesseract, Google Vision)**
- Pro: Better performance, faster
- Con: Privacy concerns, server required
- Rejected: Violates client-side principle

**Cloud APIs (AWS Textract, Google Cloud Vision)**
- Pro: High accuracy, no local processing
- Con: Cost, privacy, requires API keys
- Rejected: Violates client-side principle

---

## Image Processing

### CompressorJS

**Version**: 1.2.1
**License**: MIT
**Bundle Size**: ~5KB
**Purpose**: Image compression before PDF embedding

#### Why CompressorJS?

| Criteria | CompressorJS | Canvas API |
|----------|--------------|------------|
| Quality control | Excellent | Basic |
| EXIF handling | Automatic | Manual |
| Size reduction | 40-70% | Variable |
| API simplicity | Callback-based | Low-level |

#### Usage Pattern

```javascript
new Compressor(file, {
  quality: 0.7,
  maxWidth: 2000,
  maxHeight: 2000,
  success: (compressed) => { /* use compressed */ }
})
```

---

## PDF Comparison

### pixelmatch

**Version**: 7.1.0
**License**: ISC
**Bundle Size**: ~3KB
**Purpose**: Visual diff between PDF pages

#### Why pixelmatch?

| Criteria | pixelmatch | Alternative |
|----------|------------|-------------|
| Accuracy | Pixel-perfect | - |
| Speed | Fast | - |
| Size | 3KB | - |
| Anti-alias handling | Configurable | - |

#### Usage Pattern

```javascript
const diffPixels = pixelmatch(
  img1.data,
  img2.data,
  diff.data,
  width,
  height,
  { threshold: 0.1, diffColor: [255, 0, 0] }
)
```

---

## Format Conversion

### html2pdf.js

**Version**: 0.14.0
**License**: MIT
**Bundle Size**: ~80KB (lazy-loaded)
**Purpose**: Convert HTML to PDF

#### Why html2pdf.js?

| Criteria | html2pdf.js | Alternative |
|----------|-------------|-------------|
| HTML fidelity | Good | - |
| CSS support | Most properties | - |
| Client-side | Yes | - |
| Page breaks | Automatic | - |

#### How It Works

1. Renders HTML to canvas via html2canvas
2. Converts canvas to PDF via jsPDF
3. Handles page breaks automatically

#### Alternatives Considered

**Puppeteer/Playwright**
- Pro: Perfect HTML rendering
- Con: Requires server (headless browser)
- Rejected: Server-side only

**wkhtmltopdf**
- Pro: Excellent quality
- Con: Binary, cannot run in browser
- Rejected: Not browser-compatible

---

### marked

**Version**: 15.0.7
**License**: MIT
**Bundle Size**: ~40KB (lazy-loaded)
**Purpose**: Parse Markdown to HTML

#### Why marked?

| Criteria | marked | markdown-it |
|----------|--------|-------------|
| Speed | Fastest | Fast |
| Size | 40KB | 60KB |
| GFM support | Yes | Via plugin |
| Security | Configurable | Good |

#### Usage with DOMPurify

```javascript
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const rawHtml = await marked.parse(markdown)
const cleanHtml = DOMPurify.sanitize(rawHtml)
```

---

## Utilities

### JSZip

**Version**: 3.10.1
**License**: MIT or GPLv3
**Bundle Size**: ~25KB
**Purpose**: Create ZIP archives for split results

#### Why JSZip?

| Criteria | JSZip | Alternative |
|----------|-------|-------------|
| Browser support | Excellent | - |
| API simplicity | Promise-based | - |
| Streaming | Supported | - |
| Compression | Deflate | - |

#### Usage Pattern

```javascript
const zip = new JSZip()
results.forEach((blob, i) => {
  zip.file(`page_${i + 1}.pdf`, blob)
})
const zipBlob = await zip.generateAsync({ type: 'blob' })
```

---

### file-saver

**Version**: 2.0.5
**License**: MIT
**Bundle Size**: ~3KB
**Purpose**: Trigger browser downloads

#### Why file-saver?

| Criteria | file-saver | Native |
|----------|------------|--------|
| Cross-browser | Excellent | Inconsistent |
| Large files | Handles well | May fail |
| API | Simple | Complex |

#### Usage Pattern

```javascript
import { saveAs } from 'file-saver'
saveAs(blob, 'document.pdf')
```

---

## Security

### DOMPurify

**Version**: 3.3.1
**License**: Apache-2.0 or MPL-2.0
**Bundle Size**: ~15KB
**Purpose**: Sanitize HTML to prevent XSS

#### Why DOMPurify?

| Criteria | DOMPurify | Alternative |
|----------|-----------|-------------|
| Security | Best-in-class | - |
| Speed | Fast | - |
| Customizable | Highly | - |
| Maintained | Actively | - |

#### Usage Pattern

```javascript
import DOMPurify from 'dompurify'

const clean = DOMPurify.sanitize(dirty, {
  USE_PROFILES: { html: true },
  ADD_TAGS: ['style'],
  ADD_ATTR: ['style', 'class']
})
```

---

## Bundle Size Summary

| Library | Size | Loading |
|---------|------|---------|
| PDF.js + worker | ~2MB | Eager |
| pdf-lib | ~300KB | Eager |
| React + DOM | ~150KB | Eager |
| shadcn/ui components | ~100KB | Eager |
| **Subtotal (Eager)** | **~2.5MB** | - |
| Tesseract.js | ~12MB | Lazy |
| html2pdf.js | ~80KB | Lazy |
| marked | ~40KB | Lazy |
| **Subtotal (Lazy)** | **~12.1MB** | - |
| pixelmatch | ~3KB | Eager |
| JSZip | ~25KB | Eager |
| file-saver | ~3KB | Eager |
| DOMPurify | ~15KB | Eager |
| CompressorJS | ~5KB | Eager |
| **Utilities** | **~51KB** | - |

**Initial Bundle**: ~2.6MB (gzipped: ~800KB)
**Maximum Bundle**: ~14.7MB (if all lazy features used)

---

## Version Pinning Strategy

All dependencies are pinned to specific versions to ensure:
- Reproducible builds
- No surprise breaking changes
- Security audit trail

Updates are performed manually with testing:
1. Check release notes for breaking changes
2. Update in development branch
3. Run full test suite
4. Update documentation if needed
5. Merge to main

---

## Security Considerations

| Library | Risk | Mitigation |
|---------|------|------------|
| PDF.js | Malformed PDF parsing | Sandboxed worker, regular updates |
| pdf-lib | Malformed PDF handling | Input validation |
| Tesseract.js | WASM execution | Trusted source (npm) |
| DOMPurify | XSS prevention | Primary defense layer |
| marked | Markdown injection | DOMPurify post-processing |
