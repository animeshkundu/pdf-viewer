# ADR-0001: Using PDF.js for PDF Rendering

## Status
Accepted

## Date
2025-01-XX

## Context

The PDF Viewer & Editor requires a robust, client-side solution for rendering PDF documents to the browser. The solution must:
- Run entirely in the browser (no server dependencies)
- Handle complex PDFs with various content types (text, images, vectors)
- Provide text extraction for search and selection
- Perform well with large documents (100+ pages)
- Be actively maintained and well-documented
- Have a permissive open-source license

## Decision

We will use **PDF.js** (v5.4.449) as the primary library for rendering PDF documents.

PDF.js is Mozilla's open-source JavaScript library that renders PDFs using HTML5 Canvas and SVG. It's the same technology used in Firefox's built-in PDF viewer.

## Consequences

### Positive
- **Battle-tested**: Used by Firefox and millions of users daily
- **Comprehensive**: Handles virtually all PDF specifications
- **Client-side**: 100% browser-based, no server required
- **Text layer**: Provides text extraction for search and selection
- **Web Worker support**: Can parse PDFs in background threads for better performance
- **Active maintenance**: Regular updates and security patches from Mozilla
- **Free and open**: Apache 2.0 license
- **Good documentation**: Extensive examples and API documentation
- **Large community**: Easy to find solutions to common problems

### Negative
- **Bundle size**: ~2MB when including the worker (~500KB gzipped)
- **Canvas-based**: Uses more memory than native browser rendering
- **Learning curve**: API can be complex for advanced use cases
- **Version updates**: Sometimes breaking changes between major versions
- **Font handling**: May need to include additional font data for some PDFs

### Neutral
- Requires Web Workers for optimal performance (must configure build tools)
- Canvas-based rendering means we control the entire rendering pipeline
- Need to handle PDF.js worker file separately in build process

## Alternatives Considered

### Alternative 1: react-pdf
- **Description**: React wrapper around PDF.js
- **Pros**: 
  - React-friendly API
  - Handles PDF.js complexity
  - Pre-built components
- **Cons**: 
  - Additional abstraction layer
  - Less control over rendering
  - May lag behind PDF.js updates
  - Smaller community than PDF.js directly
- **Why rejected**: We need low-level control for advanced features (annotations, editing). Direct PDF.js usage provides more flexibility.

### Alternative 2: PSPDFKit
- **Description**: Commercial PDF SDK with web version
- **Pros**: 
  - Feature-rich
  - Professional support
  - Advanced editing capabilities
  - Better performance
- **Cons**: 
  - Commercial license ($$$)
  - Not open source
  - Vendor lock-in
  - Overkill for our needs
- **Why rejected**: Cost prohibitive and violates "100% free" requirement. We want open source for transparency and community trust.

### Alternative 3: pdf.js-viewer
- **Description**: Pre-built PDF viewer using PDF.js
- **Pros**: 
  - Ready-made UI
  - Full-featured out of the box
  - Minimal setup
- **Cons**: 
  - Limited customization
  - Difficult to match our design system
  - Harder to integrate advanced features
- **Why rejected**: We need custom UI that matches Apple Preview's design philosophy. Pre-built viewer would constrain our UX goals.

### Alternative 4: Browser native PDF rendering (embed/iframe)
- **Description**: Use browser's built-in PDF viewer
- **Pros**: 
  - Zero bundle size
  - Native performance
  - No maintenance
- **Cons**: 
  - No control over UI
  - No access to PDF internals
  - Cannot add annotations
  - Cannot export modified PDFs
  - Inconsistent across browsers
- **Why rejected**: Cannot meet requirements for annotation, editing, or custom UI.

## Implementation Notes

### Setup Requirements
1. Install PDF.js: `npm install pdfjs-dist`
2. Configure Vite to handle worker files
3. Set worker source in application:
   ```typescript
   import * as pdfjsLib from 'pdfjs-dist'
   pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
   ```

### Key APIs to Use
- `pdfjsLib.getDocument()`: Load PDF from file/URL/array
- `PDFDocumentProxy.getPage()`: Access individual pages
- `PDFPageProxy.render()`: Render page to canvas
- `PDFPageProxy.getTextContent()`: Extract text for search/selection

### Performance Considerations
- Always use Web Worker for document parsing
- Implement virtualized rendering (only render visible pages)
- Cache rendered canvases with LRU eviction
- Use lower resolution for thumbnails
- Consider progressive page rendering for very large PDFs

### Version Management
- Pin to specific version (5.4.449) to avoid breaking changes
- Test thoroughly before upgrading major versions
- Monitor Mozilla's release notes for security patches

## References
- [PDF.js Official Site](https://mozilla.github.io/pdf.js/)
- [PDF.js GitHub Repository](https://github.com/mozilla/pdf.js)
- [PDF.js API Documentation](https://mozilla.github.io/pdf.js/api/)
- [PDF.js Examples](https://github.com/mozilla/pdf.js/tree/master/examples)
- PRD Section: "Technology Stack" (PDF Rendering)
- ARCHITECTURE.md: "PDFService"
