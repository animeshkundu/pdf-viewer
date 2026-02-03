# ADR-002: Lazy Loading Heavy Dependencies

## Status
Accepted

## Date
2025-01-XX (Original decision)
2026-02-03 (Documented)

## Context

The client-side architecture (ADR-001) requires several large JavaScript libraries:

| Library | Size (min) | Purpose |
|---------|------------|---------|
| Tesseract.js | ~12 MB | OCR processing |
| html2pdf.js | ~80 KB | HTML to PDF conversion |
| marked | ~40 KB | Markdown parsing |
| Ghostscript WASM | ~18 MB | Full PDF compression (optional) |

Loading all dependencies at startup would:
- Increase initial bundle from ~2MB to ~32MB
- Slow Time-to-Interactive significantly
- Waste bandwidth for users who don't use these features
- Cause mobile devices to struggle with parsing

Most users will only use core features (view, annotate, export) and never need OCR or format conversion.

## Decision

We will use **dynamic `import()`** to lazy-load heavy dependencies only when the user explicitly requests the feature that needs them.

Implementation pattern:
```typescript
// Service initialization
async initialize(language: string): Promise<void> {
  // Only load Tesseract when user clicks "Make Searchable" or similar
  const Tesseract = await import('tesseract.js')
  this.worker = await Tesseract.createWorker(language)
}
```

## Consequences

### Positive

1. **Fast Initial Load**: Core bundle stays at ~2MB
2. **Bandwidth Efficiency**: Users only download what they use
3. **Mobile Friendly**: Reduced memory pressure at startup
4. **Progressive Enhancement**: Core features work immediately
5. **Better Perceived Performance**: App is interactive quickly

### Negative

1. **First-Use Delay**: User waits when first invoking OCR/conversion
2. **Error Handling Complexity**: Must handle import failures gracefully
3. **Offline Considerations**: Features unavailable if dependencies not cached
4. **Testing Complexity**: Must test both loaded and unloaded states
5. **Code Splitting Configuration**: Vite/Rollup configuration needed

### Mitigations

| Issue | Mitigation |
|-------|------------|
| First-use delay | Show progress indicator with "Loading OCR engine..." message |
| Import failures | Try-catch with user-friendly error message and retry option |
| Offline | Service worker caches dependencies after first use |
| Testing | Unit tests mock imports; E2E tests cover actual loading |

## Implementation Details

### Lazy-Loaded Dependencies

**Tesseract.js (OCR Service)**
```typescript
class OCRService {
  private worker: TesseractWorker | null = null

  async initialize(language: OCRLanguage): Promise<void> {
    this.updateProgress('initializing', 0, 'Loading OCR engine...')

    // Dynamic import - only downloaded when called
    const Tesseract = await import('tesseract.js')

    this.worker = await Tesseract.createWorker(language, undefined, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          this.updateProgress('processing', m.progress * 100, 'Recognizing...')
        }
      }
    })
  }
}
```

**html2pdf.js (Conversion Service)**
```typescript
async htmlToPDF(html: string, options: HTMLToPDFOptions): Promise<Blob> {
  this.updateProgress('processing', 30, 'Loading html2pdf library...')

  // Dynamic import
  const { default: html2pdf } = await import('html2pdf.js')

  // ... rest of conversion
}
```

**marked (Markdown Conversion)**
```typescript
async markdownToPDF(markdown: string): Promise<Blob> {
  const { marked } = await import('marked')
  const rawHtml = await marked.parse(markdown)
  // ... convert to PDF
}
```

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core PDF libraries always loaded
          'pdf-core': ['pdfjs-dist', 'pdf-lib'],
          // Lazy chunks
          'tesseract': ['tesseract.js'],
          'html2pdf': ['html2pdf.js'],
        }
      }
    }
  }
})
```

### User Experience

When a user clicks "Make PDF Searchable (OCR)":

1. Dialog opens immediately
2. "Loading OCR engine..." progress shown
3. Tesseract.js downloads (~12MB)
4. Worker initializes
5. "Ready to process" state shown
6. User proceeds with OCR

Subsequent uses skip steps 2-4 (cached in browser).

## Alternatives Considered

### Eager Loading Everything
- **Pros**: No first-use delay, simpler code
- **Cons**: 32MB+ initial bundle, slow TTI, wasted bandwidth
- **Why rejected**: Unacceptable UX for majority of users

### Separate "Full" and "Lite" Builds
- **Pros**: Users choose their experience
- **Cons**: Deployment complexity, confusion, maintenance burden
- **Why rejected**: Dynamic imports solve this more elegantly

### Web Worker Pre-loading
- **Pros**: Background download during idle time
- **Cons**: Wastes bandwidth, complex idle detection, still impacts mobile
- **Why rejected**: On-demand loading is more predictable

## Success Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Initial bundle size | < 3MB | ~2.5MB |
| Time to Interactive | < 3s | ~2s |
| OCR first-use delay | < 10s | ~5-8s (network dependent) |
| Subsequent OCR delay | < 1s | ~500ms |

## References

- [Vite Code Splitting](https://vite.dev/guide/build#chunking-strategy)
- [Dynamic Import Spec](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- ADR-001: Client-Side Only Architecture
