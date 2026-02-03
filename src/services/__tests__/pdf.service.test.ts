import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { pdfService } from '../pdf.service'

// Mock pdf.js to simulate buffer transfer behavior
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn().mockImplementation(({ data }) => {
    // Simulate what pdf.js does - it may transfer the buffer
    // The key test is that originalBytes should still be usable
    return {
      promise: Promise.resolve({
        numPages: 1,
        destroy: vi.fn(),
        getPage: vi.fn().mockResolvedValue({
          getViewport: vi.fn().mockReturnValue({ width: 612, height: 792 }),
          render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
        }),
      }),
      onProgress: null,
    }
  }),
}))

describe('PDFService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadDocument', () => {
    it('should store originalBytes that remain usable after pdf.js load', async () => {
      // Create a test PDF
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()
      const file = new File([bytes], 'test.pdf', { type: 'application/pdf' })

      // Load the document
      await pdfService.loadDocument(file)

      // Get the stored bytes
      const originalBytes = pdfService.getOriginalBytes()
      expect(originalBytes).not.toBeNull()

      // This is the critical test - the buffer should NOT be detached
      // If the fix is not applied, this would throw:
      // "Cannot perform ArrayBuffer.prototype.slice on a detached ArrayBuffer"
      expect(() => originalBytes!.slice(0)).not.toThrow()

      // Verify the bytes are valid (not empty)
      expect(originalBytes!.byteLength).toBeGreaterThan(0)
    })

    it('should store a copy of the buffer, not the original reference', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage()
      const bytes = await pdfDoc.save()
      const file = new File([bytes], 'test.pdf', { type: 'application/pdf' })

      await pdfService.loadDocument(file)

      const originalBytes = pdfService.getOriginalBytes()

      // The stored bytes should be a copy, so operations on the original
      // ArrayBuffer (which may be transferred to workers) shouldn't affect it
      expect(originalBytes).not.toBeNull()
      expect(originalBytes!.byteLength).toBe(bytes.length)
    })

    it('should allow multiple .slice() calls on originalBytes', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage()
      const bytes = await pdfDoc.save()
      const file = new File([bytes], 'test.pdf', { type: 'application/pdf' })

      await pdfService.loadDocument(file)

      const originalBytes = pdfService.getOriginalBytes()!

      // Multiple services (OCR, text edit) may call .slice() on the same buffer
      // This should work without issues
      const copy1 = originalBytes.slice(0)
      const copy2 = originalBytes.slice(0)
      const copy3 = originalBytes.slice(0)

      expect(copy1.byteLength).toBe(originalBytes.byteLength)
      expect(copy2.byteLength).toBe(originalBytes.byteLength)
      expect(copy3.byteLength).toBe(originalBytes.byteLength)
    })
  })

  describe('getFilename', () => {
    it('should return the original filename', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage()
      const bytes = await pdfDoc.save()
      const file = new File([bytes], 'my-document.pdf', { type: 'application/pdf' })

      await pdfService.loadDocument(file)

      expect(pdfService.getFilename()).toBe('my-document.pdf')
    })
  })
})
