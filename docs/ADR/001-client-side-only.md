# ADR-001: Client-Side Only Architecture

## Status
Accepted

## Date
2025-01-XX (Original decision)
2026-02-03 (Documented)

## Context

The PDF viewer/editor was designed to match the capabilities of Stirling-PDF, a popular open-source PDF toolkit. However, while Stirling-PDF runs as a server application (Docker-based), we needed to decide whether to:

1. Build a server-side application with full feature parity
2. Build a 100% client-side application with some limitations
3. Build a hybrid with optional server components

Key considerations:
- **Privacy**: Users handling sensitive documents need assurance their files aren't uploaded
- **Deployment**: Server infrastructure has cost and complexity
- **Offline Use**: Many users work offline or in restricted networks
- **Trust**: Open source is meaningless if data goes to unknown servers
- **Performance**: Network latency for every operation would degrade UX

## Decision

We will build a **100% client-side application** that runs entirely in the browser with no server dependency.

All PDF processing, including:
- Rendering and viewing
- Annotations and signatures
- Split, merge, extract, scale
- Format conversion (images, HTML, Markdown)
- OCR (via Tesseract.js WASM)
- Compression and comparison

...will be performed using JavaScript libraries running in the user's browser.

## Consequences

### Positive

1. **Complete Privacy**: Documents never leave the user's device
2. **Zero Server Costs**: No hosting, bandwidth, or scaling costs
3. **Offline Capable**: Full functionality as a PWA without internet
4. **Simple Deployment**: Static files on any CDN or hosting
5. **User Trust**: Verifiable that no data is transmitted
6. **GDPR/Compliance**: No data processing agreements needed
7. **Performance**: No network latency for operations
8. **Scalability**: Unlimited users with zero marginal cost

### Negative

1. **No Password Encryption**: pdf-lib cannot encrypt PDFs; would require server-side tools or native WASM libraries that don't exist for this use case
2. **Large WASM Bundles**: Tesseract.js is ~12MB, requiring lazy loading
3. **Memory Constraints**: Browser memory limits affect large document handling
4. **Limited CPU**: Single-threaded except for Web Workers
5. **No Server-Side Formats**: Cannot convert Office documents (Word, Excel, PPT) without LibreOffice server
6. **No TSA Timestamps**: Certificate signatures with timestamp authority require server

### Mitigations

| Limitation | Mitigation |
|------------|------------|
| No encryption | Document limitation clearly; suggest OS-level encryption |
| Large bundles | Lazy-load Tesseract.js only when OCR requested |
| Memory limits | Page-by-page processing, canvas cleanup, 200MB file limit |
| Office formats | Explicitly out of scope; focus on PDF operations |

## Alternatives Considered

### Server-Side Processing
- **Pros**: Full feature parity, better compression, Office format support
- **Cons**: Hosting costs, privacy concerns, latency, complexity
- **Why rejected**: Conflicts with core privacy principle

### Hybrid Architecture
- **Pros**: Best of both worlds, optional server features
- **Cons**: Complex deployment, partial privacy, feature fragmentation
- **Why rejected**: Muddies the privacy story; either it's private or it's not

### Electron/Tauri Desktop App
- **Pros**: No browser constraints, native performance, true offline
- **Cons**: Download/install friction, platform-specific builds, update distribution
- **Why rejected**: Web-first approach maximizes accessibility

## References

- [Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) - Inspiration project
- [PDF.js](https://mozilla.github.io/pdf.js/) - Client-side rendering
- [pdf-lib](https://pdf-lib.js.org/) - Client-side manipulation
- [Tesseract.js](https://tesseract.projectnaptha.com/) - Client-side OCR
