# Feature Roadmap

This document tracks the implementation status of features in the PDF viewer/editor, organized by phase.

## Overview

The project aims to match Stirling-PDF capabilities while maintaining 100% client-side processing. Features are implemented in phases, with each phase building on the previous.

---

## Phase 1: Core Viewing & Annotations
**Status: Complete**

| Feature | Status | Notes |
|---------|--------|-------|
| PDF rendering (PDF.js) | Done | Canvas-based, HiDPI support |
| Page navigation | Done | Keyboard, scroll, thumbnails |
| Zoom controls | Done | Fit width, fit page, custom % |
| Text selection | Done | Native text layer |
| Highlight annotation | Done | Multi-color with opacity |
| Pen/freehand drawing | Done | Pressure sensitivity support |
| Text annotations | Done | Custom font, size, color |
| Shape annotations | Done | Rectangle, circle, arrow, line |
| Signature creation | Done | Draw, type, or upload |
| Undo/redo | Done | 20-level history |
| Export with annotations | Done | Embedded in PDF |

---

## Phase 2: Page Operations (Split/Merge/Extract)
**Status: Complete**

| Feature | Status | Notes |
|---------|--------|-------|
| Split PDF by ranges | Done | Custom page ranges |
| Split PDF every N pages | Done | Automatic division |
| Extract specific pages | Done | Multi-select from thumbnails |
| Merge multiple PDFs | Done | Drag to reorder |
| Reorder pages | Done | Drag-and-drop in sidebar |
| Rotate pages | Done | 90, 180, 270 degrees |
| Delete pages | Done | With confirmation |
| Insert blank pages | Done | After selected page |
| Scale pages to size | Done | Letter, A4, A3, Legal, custom |
| N-up layout | Done | 2, 4, 6, 9 pages per sheet |
| Remove blank pages | Done | Pixel analysis detection |
| Download as ZIP | Done | For split results |

---

## Phase 3: Security Features
**Status: Complete**

| Feature | Status | Notes |
|---------|--------|-------|
| View PDF metadata | Done | Title, author, dates, etc. |
| Sanitize/remove metadata | Done | Selective removal |
| Auto-redact patterns | Done | SSN, credit card, email, phone |
| Custom redact patterns | Done | User-defined regex |
| Redaction preview | Done | Review before applying |
| Password encryption | Documented Limitation | Not supported client-side |
| Password decryption | Documented Limitation | Cannot open encrypted PDFs |

**Note**: Password protection (encryption) is not supported due to pdf-lib limitations. This is documented in the UI with recommendations for OS-level encryption.

---

## Phase 4: Format Conversion
**Status: Complete**

| Feature | Status | Notes |
|---------|--------|-------|
| Images to PDF | Done | PNG, JPEG, WebP, BMP |
| PDF to images | Done | PNG, JPEG export |
| HTML to PDF | Done | Via html2pdf.js |
| Markdown to PDF | Done | Styled output |
| Batch image conversion | Done | Multiple images at once |
| Download images as ZIP | Done | For multi-page export |
| Page size options | Done | Fit, A4, Letter |
| DPI/scale options | Done | 1x, 2x, 3x for images |

---

## Phase 5: OCR (Optical Character Recognition)
**Status: Complete**

| Feature | Status | Notes |
|---------|--------|-------|
| Make PDF searchable | Done | Invisible text layer |
| Extract text via OCR | Done | Full document or pages |
| Language selection | Done | 8 languages supported |
| Progress tracking | Done | Per-page progress |
| Cancellation | Done | Cancel long operations |
| Confidence reporting | Done | OCR quality metric |

**Supported Languages**: English, French, German, Spanish, Italian, Portuguese, Chinese (Simplified), Japanese

---

## Phase 6: Compression & Comparison
**Status: Complete**

| Feature | Status | Notes |
|---------|--------|-------|
| Image compression | Done | Quality slider, preview |
| Batch compression | Done | Multiple images |
| PDF visual diff | Done | Page-by-page comparison |
| Side-by-side view | Done | Original, modified, diff |
| Overlay diff view | Done | Adjustable opacity |
| Difference percentage | Done | Quantified comparison |
| Export diff as image | Done | PNG export |

---

## Phase 7: Enhanced Viewing
**Status: Complete**

| Feature | Status | Notes |
|---------|--------|-------|
| Presentation mode | Done | Fullscreen, keyboard nav |
| Bookmarks panel | Done | PDF outline navigation |
| PDF info panel | Done | Metadata display |
| Dark mode | Done | System preference support |
| Mobile responsive | Done | Touch gestures |
| Keyboard shortcuts | Done | Full keyboard navigation |
| Search in document | Done | With highlighting |
| Print support | Done | Native browser print |

---

## Future Enhancements (Planned)

### Phase 8: Advanced Signatures
| Feature | Priority | Notes |
|---------|----------|-------|
| Certificate-based signatures | Medium | Requires server or WebCrypto |
| Timestamp authority (TSA) | Low | Requires server |
| Signature verification | Medium | Read-only verification |
| Multiple signature fields | Medium | Form field detection |

### Phase 9: PDF/A Compliance
| Feature | Priority | Notes |
|---------|----------|-------|
| PDF/A validation | Low | Complex specification |
| PDF/A conversion | Low | Font embedding required |

### Phase 10: Collaboration
| Feature | Priority | Notes |
|---------|----------|-------|
| Comment threads | Low | Annotation replies |
| Export annotations as JSON | Medium | For backup/restore |
| Annotation templates | Low | Preset stamps |

### Phase 11: Performance Enhancements
| Feature | Priority | Notes |
|---------|----------|-------|
| Web Worker PDF processing | Medium | Non-blocking operations |
| Streaming PDF loading | Medium | For very large files |
| GPU-accelerated rendering | Low | WebGL canvas |

---

## Out of Scope

These features are explicitly not planned due to technical or architectural constraints:

| Feature | Reason |
|---------|--------|
| Office document conversion | Requires LibreOffice server |
| Full PDF/A compliance | Complex font subsetting |
| Password encryption | pdf-lib limitation |
| Server-side processing | Conflicts with privacy principle |
| Real-time collaboration | Requires backend infrastructure |
| Cloud storage integration | Requires OAuth/server |

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.0 | 2025-01 | Initial release with core features |
| 1.1.0 | 2025-02 | Split/Merge/Extract added |
| 1.2.0 | 2025-03 | Security features |
| 1.3.0 | 2025-04 | Format conversion |
| 1.4.0 | 2025-05 | OCR integration |
| 1.5.0 | 2025-06 | Compression/Comparison |
| 1.6.0 | 2025-07 | Enhanced viewing |

---

## Contributing

To propose a new feature:

1. Check if it's in "Out of Scope" - if so, explain why it should be reconsidered
2. Check if it maintains 100% client-side architecture
3. Estimate bundle size impact
4. Create an issue with use case description
5. If approved, create an ADR for architectural decisions
