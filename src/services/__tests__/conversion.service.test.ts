import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ConversionService } from '../conversion.service'
import { PDFDocument } from 'pdf-lib'

// Mock file-saver to avoid browser-specific API issues in tests
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}))

// Mock html2pdf.js
vi.mock('html2pdf.js', () => ({
  default: () => ({
    set: () => ({
      from: () => ({
        outputPdf: () => Promise.resolve(new Blob(['pdf content'], { type: 'application/pdf' })),
      }),
    }),
  }),
}))

// Mock marked
vi.mock('marked', () => ({
  marked: {
    parse: vi.fn((text: string) => Promise.resolve(`<p>${text}</p>`)),
  },
}))

// Mock dompurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((html: string) => html),
  },
}))

describe('ConversionService', () => {
  let service: ConversionService

  // Minimal 1x1 red PNG file (base64 encoded)
  const minimalPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='

  // Minimal 1x1 red JPEG file (base64 encoded)
  const minimalJpegBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsLCgwMDRAODxAQDQ4RERYSEBITFBUXFRgMGBkYFxIaFx3/2wBDAQMEBAUEBQkFBQkdERIRHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAAJSP/Z'

  // Helper to create a test image file from base64
  function createTestImageFromBase64(
    base64: string,
    name: string,
    type: string
  ): File {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new File([bytes], name, { type })
  }

  // Helper to create a test PNG file
  function createTestPngFile(name: string = 'test.png'): File {
    return createTestImageFromBase64(minimalPngBase64, name, 'image/png')
  }

  // Helper to create a test JPEG file
  function createTestJpegFile(name: string = 'test.jpg'): File {
    return createTestImageFromBase64(minimalJpegBase64, name, 'image/jpeg')
  }

  // Helper to create a test PDF with N pages
  async function createTestPDF(pageCount: number): Promise<ArrayBuffer> {
    const pdfDoc = await PDFDocument.create()
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.addPage([612, 792]) // Letter size
      page.drawText(`Page ${i + 1}`, { x: 50, y: 700, size: 24 })
    }
    const bytes = await pdfDoc.save()
    return bytes.buffer as ArrayBuffer
  }

  beforeEach(() => {
    // Use getInstance() and cast to allow resetting state between tests
    service = ConversionService.getInstance()
    // Clear any progress callback from previous tests
    service.setProgressCallback(() => {})
    // Mock DOM APIs that might not be available in test environment
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.createElement('div'))
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.createElement('div'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConversionService.getInstance()
      const instance2 = ConversionService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('imagesToPDF', () => {
    it('should throw error when no images provided', async () => {
      await expect(
        service.imagesToPDF([], { pageSize: 'a4', margin: 36 })
      ).rejects.toThrow('No images provided')
    })

    it('should convert a single PNG image to PDF', async () => {
      const imageFile = createTestPngFile('test.png')

      const result = await service.imagesToPDF([imageFile], {
        pageSize: 'a4',
        margin: 36,
      })

      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('application/pdf')

      // Verify the PDF has one page
      const arrayBuffer = await result.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      expect(pdfDoc.getPageCount()).toBe(1)
    })

    it('should convert a single JPEG image to PDF', async () => {
      const imageFile = createTestJpegFile('test.jpg')

      const result = await service.imagesToPDF([imageFile], {
        pageSize: 'letter',
        margin: 72,
      })

      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('application/pdf')
    })

    it('should convert multiple images to a multi-page PDF', async () => {
      const images = [
        createTestPngFile('image1.png'),
        createTestPngFile('image2.png'),
        createTestPngFile('image3.png'),
      ]

      const result = await service.imagesToPDF(images, {
        pageSize: 'a4',
        margin: 36,
      })

      expect(result).toBeInstanceOf(Blob)

      // Verify the PDF has three pages
      const arrayBuffer = await result.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      expect(pdfDoc.getPageCount()).toBe(3)
    })

    it('should handle different page sizes', async () => {
      const imageFile = createTestPngFile('test.png')

      // A4 page
      const resultA4 = await service.imagesToPDF([imageFile], {
        pageSize: 'a4',
        margin: 0,
      })
      const pdfA4 = await PDFDocument.load(await resultA4.arrayBuffer())
      const pageA4 = pdfA4.getPage(0)
      expect(pageA4.getSize().width).toBe(595) // A4 width
      expect(pageA4.getSize().height).toBe(842) // A4 height

      // Letter page
      const resultLetter = await service.imagesToPDF([imageFile], {
        pageSize: 'letter',
        margin: 0,
      })
      const pdfLetter = await PDFDocument.load(await resultLetter.arrayBuffer())
      const pageLetter = pdfLetter.getPage(0)
      expect(pageLetter.getSize().width).toBe(612) // Letter width
      expect(pageLetter.getSize().height).toBe(792) // Letter height
    })

    it('should use "fit" page size correctly', async () => {
      const imageFile = createTestPngFile('test.png')

      const result = await service.imagesToPDF([imageFile], {
        pageSize: 'fit',
        margin: 0,
      })

      expect(result).toBeInstanceOf(Blob)

      // With fit and 0 margin, page size should match image dimensions (1x1 for minimal PNG)
      const arrayBuffer = await result.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const page = pdfDoc.getPage(0)
      const { width, height } = page.getSize()

      // The minimal PNG is 1x1
      expect(width).toBe(1)
      expect(height).toBe(1)
    })

    it('should add margins with fit page size', async () => {
      const imageFile = createTestPngFile('test.png')

      const result = await service.imagesToPDF([imageFile], {
        pageSize: 'fit',
        margin: 50, // 50 points margin
      })

      const arrayBuffer = await result.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const page = pdfDoc.getPage(0)
      const { width, height } = page.getSize()

      // Page size should be image (1x1) + 2*margin
      expect(width).toBe(101) // 1 + 50*2
      expect(height).toBe(101) // 1 + 50*2
    })
  })

  // Note: pdfToImages tests are skipped because PDF.js requires a web worker
  // that doesn't work properly in the happy-dom test environment.
  // These should be tested in e2e tests instead.
  describe.skip('pdfToImages (requires browser environment)', () => {
    it('should convert all pages by default', async () => {
      const pdfBuffer = await createTestPDF(3)

      const result = await service.pdfToImages(pdfBuffer, {
        format: 'png',
        scale: 1,
      })

      expect(result.blobs.length).toBe(3)
      expect(result.filenames.length).toBe(3)
      expect(result.filenames[0]).toBe('page_1.png')
      expect(result.filenames[1]).toBe('page_2.png')
      expect(result.filenames[2]).toBe('page_3.png')
    })

    it('should convert only specified pages', async () => {
      const pdfBuffer = await createTestPDF(5)

      const result = await service.pdfToImages(pdfBuffer, {
        format: 'jpg',
        scale: 1,
        pages: [1, 3, 5],
      })

      expect(result.blobs.length).toBe(3)
      expect(result.filenames).toEqual(['page_1.jpg', 'page_3.jpg', 'page_5.jpg'])
    })

    it('should generate PNG format correctly', async () => {
      const pdfBuffer = await createTestPDF(1)

      const result = await service.pdfToImages(pdfBuffer, {
        format: 'png',
        scale: 1,
      })

      expect(result.blobs[0].type).toBe('image/png')
    })

    it('should generate JPG format correctly', async () => {
      const pdfBuffer = await createTestPDF(1)

      const result = await service.pdfToImages(pdfBuffer, {
        format: 'jpg',
        scale: 1,
      })

      expect(result.blobs[0].type).toBe('image/jpeg')
    })

    it('should scale images based on scale option', async () => {
      const pdfBuffer = await createTestPDF(1)

      // Scale 1
      const result1 = await service.pdfToImages(pdfBuffer, {
        format: 'png',
        scale: 1,
      })

      // Scale 2
      const result2 = await service.pdfToImages(pdfBuffer, {
        format: 'png',
        scale: 2,
      })

      // Higher scale should produce larger file
      expect(result2.blobs[0].size).toBeGreaterThan(result1.blobs[0].size)
    })
  })

  describe('htmlToPDF', () => {
    it('should convert HTML to PDF', async () => {
      const html = '<h1>Test Document</h1><p>This is a test.</p>'

      const result = await service.htmlToPDF(html, {
        pageSize: 'a4',
        margin: 72,
      })

      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('application/pdf')
    })

    it('should handle different page sizes', async () => {
      const html = '<p>Test content</p>'

      const resultA4 = await service.htmlToPDF(html, {
        pageSize: 'a4',
        margin: 36,
      })

      const resultLetter = await service.htmlToPDF(html, {
        pageSize: 'letter',
        margin: 36,
      })

      expect(resultA4).toBeInstanceOf(Blob)
      expect(resultLetter).toBeInstanceOf(Blob)
    })

    it('should sanitize HTML input', async () => {
      const DOMPurify = await import('dompurify')
      const sanitizeSpy = vi.spyOn(DOMPurify.default, 'sanitize')

      const html = '<script>alert("xss")</script><p>Safe content</p>'

      await service.htmlToPDF(html, {
        pageSize: 'a4',
        margin: 72,
      })

      expect(sanitizeSpy).toHaveBeenCalledWith(html, expect.any(Object))
    })
  })

  describe('markdownToPDF', () => {
    it('should convert markdown to PDF', async () => {
      const markdown = '# Hello World\n\nThis is a **test** document.'

      const result = await service.markdownToPDF(markdown)

      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('application/pdf')
    })

    it('should use default options when not provided', async () => {
      const markdown = '## Test\n\n- Item 1\n- Item 2'

      const result = await service.markdownToPDF(markdown)

      expect(result).toBeInstanceOf(Blob)
    })

    it('should respect custom options', async () => {
      const markdown = '# Title\n\nParagraph text here.'

      const result = await service.markdownToPDF(markdown, {
        pageSize: 'letter',
        margin: 36,
      })

      expect(result).toBeInstanceOf(Blob)
    })
  })

  describe('progress callbacks', () => {
    it('should call progress callback during imagesToPDF', async () => {
      const progressCallback = vi.fn()
      service.setProgressCallback(progressCallback)

      const imageFile = createTestPngFile('test.png')
      await service.imagesToPDF([imageFile], { pageSize: 'a4', margin: 36 })

      expect(progressCallback).toHaveBeenCalled()

      const stages = progressCallback.mock.calls.map((call) => call[0].stage)
      expect(stages).toContain('loading')
      expect(stages).toContain('processing')
      expect(stages).toContain('complete')
    })

    // Note: pdfToImages progress test skipped because PDF.js requires browser environment
    it.skip('should call progress callback during pdfToImages (requires browser)', async () => {
      const progressCallback = vi.fn()
      service.setProgressCallback(progressCallback)

      const pdfBuffer = await createTestPDF(2)
      await service.pdfToImages(pdfBuffer, { format: 'png', scale: 1 })

      expect(progressCallback).toHaveBeenCalled()

      const stages = progressCallback.mock.calls.map((call) => call[0].stage)
      expect(stages).toContain('loading')
      expect(stages).toContain('rendering')
      expect(stages).toContain('complete')
    })

    it('should include currentItem and totalItems in progress', async () => {
      const progressCallback = vi.fn()
      service.setProgressCallback(progressCallback)

      const images = [createTestPngFile('img1.png'), createTestPngFile('img2.png')]

      await service.imagesToPDF(images, { pageSize: 'a4', margin: 36 })

      const processingCalls = progressCallback.mock.calls.filter(
        (call) => call[0].stage === 'processing'
      )

      expect(processingCalls.length).toBeGreaterThan(0)
      expect(processingCalls[0][0]).toHaveProperty('currentItem')
      expect(processingCalls[0][0]).toHaveProperty('totalItems')
    })
  })

  describe('downloadBlob', () => {
    it('should call saveAs with correct arguments', async () => {
      const { saveAs } = await import('file-saver')

      const blob = new Blob(['test'], { type: 'application/pdf' })
      service.downloadBlob(blob, 'test.pdf')

      expect(saveAs).toHaveBeenCalledWith(blob, 'test.pdf')
    })
  })
})
