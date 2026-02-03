import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ComparisonService } from '../comparison.service'
import { PDFDocument } from 'pdf-lib'

// Mock pixelmatch
vi.mock('pixelmatch', () => ({
  default: vi.fn((img1, img2, output, width, height) => {
    // Simulate some different pixels based on input
    if (output) {
      // Fill output with red pixels for "differences"
      for (let i = 0; i < width * height * 4; i += 4) {
        output[i] = 255     // R
        output[i + 1] = 0   // G
        output[i + 2] = 0   // B
        output[i + 3] = 255 // A
      }
    }
    // Return a simulated number of different pixels
    return Math.floor(width * height * 0.05) // 5% different
  }),
}))

// Mock canvas-related functionality
class MockCanvasRenderingContext2D {
  canvas: { width: number; height: number }

  constructor(canvas: { width: number; height: number }) {
    this.canvas = canvas
  }

  drawImage() {}
  getImageData(x: number, y: number, width: number, height: number) {
    return {
      data: new Uint8ClampedArray(width * height * 4).fill(255),
      width,
      height,
    }
  }
  createImageData(width: number, height: number) {
    return {
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    }
  }
  putImageData() {}
  fillRect() {}
  set fillStyle(_: string) {}
  set globalAlpha(_: number) {}
}

// Mock HTMLCanvasElement
const createMockCanvas = () => {
  const canvas = {
    width: 612,
    height: 792,
    getContext: vi.fn((type: string) => {
      if (type === '2d') {
        return new MockCanvasRenderingContext2D(canvas)
      }
      return null
    }),
    toBlob: vi.fn((callback: (blob: Blob | null) => void, type?: string) => {
      callback(new Blob(['mock'], { type: type || 'image/png' }))
    }),
  }
  return canvas as unknown as HTMLCanvasElement
}

// Store original createElement
const originalCreateElement = document.createElement.bind(document)

// Mock document.createElement for canvas
vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
  if (tagName === 'canvas') {
    return createMockCanvas()
  }
  return originalCreateElement(tagName)
})

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 3,
      getPage: vi.fn(() =>
        Promise.resolve({
          pageNumber: 1,
          getViewport: vi.fn(() => ({
            width: 612,
            height: 792,
          })),
          render: vi.fn(() => ({
            promise: Promise.resolve(),
          })),
        })
      ),
      destroy: vi.fn(() => Promise.resolve()),
    }),
  })),
}))

describe('ComparisonService', () => {
  let service: ComparisonService

  // Helper to create a simple test PDF
  async function createTestPDF(pageCount: number = 1): Promise<ArrayBuffer> {
    const pdfDoc = await PDFDocument.create()
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.addPage([612, 792])
      page.drawText(`Page ${i + 1}`, { x: 50, y: 700, size: 24 })
    }
    const bytes = await pdfDoc.save()
    return bytes.buffer as ArrayBuffer
  }

  beforeEach(() => {
    service = ComparisonService.getInstance()
  })

  describe('getPageCount', () => {
    it('should return the correct page count', async () => {
      const pdfBuffer = await createTestPDF(5)
      // Note: The mock returns 3 pages regardless of actual content
      const pageCount = await service.getPageCount(pdfBuffer)
      expect(pageCount).toBe(3)
    })
  })

  describe('comparePDFs', () => {
    it('should compare two PDFs and return a result', async () => {
      const pdf1 = await createTestPDF(1)
      const pdf2 = await createTestPDF(1)

      const result = await service.comparePDFs(pdf1, pdf2, 1)

      expect(result).toBeDefined()
      expect(result.diffPixels).toBeGreaterThanOrEqual(0)
      expect(result.totalPixels).toBeGreaterThan(0)
      expect(result.percentDifferent).toBeGreaterThanOrEqual(0)
      expect(result.diffCanvas).toBeDefined()
      expect(result.pdf1Canvas).toBeDefined()
      expect(result.pdf2Canvas).toBeDefined()
    })

    it('should calculate correct percentage difference', async () => {
      const pdf1 = await createTestPDF(1)
      const pdf2 = await createTestPDF(1)

      const result = await service.comparePDFs(pdf1, pdf2, 1)

      // Based on our mock returning 5% different
      expect(result.percentDifferent).toBeCloseTo(5, 0)
    })

    it('should accept custom threshold option', async () => {
      const pdf1 = await createTestPDF(1)
      const pdf2 = await createTestPDF(1)

      const result = await service.comparePDFs(pdf1, pdf2, 1, {
        threshold: 0.2,
      })

      expect(result).toBeDefined()
    })

    it('should accept custom scale option', async () => {
      const pdf1 = await createTestPDF(1)
      const pdf2 = await createTestPDF(1)

      const result = await service.comparePDFs(pdf1, pdf2, 1, {
        scale: 2.0,
      })

      expect(result).toBeDefined()
    })

    it('should accept custom diffColor option', async () => {
      const pdf1 = await createTestPDF(1)
      const pdf2 = await createTestPDF(1)

      const result = await service.comparePDFs(pdf1, pdf2, 1, {
        diffColor: [0, 255, 0], // Green instead of red
      })

      expect(result).toBeDefined()
    })
  })

  describe('createSideBySideCanvas', () => {
    it('should create a combined canvas with all three views', () => {
      const canvas1 = createMockCanvas()
      const canvas2 = createMockCanvas()
      const diffCanvas = createMockCanvas()

      const result = service.createSideBySideCanvas(
        canvas1 as unknown as HTMLCanvasElement,
        canvas2 as unknown as HTMLCanvasElement,
        diffCanvas as unknown as HTMLCanvasElement
      )

      expect(result).toBeDefined()
      // Combined width should be greater than any single canvas
      expect(result.width).toBeGreaterThan(canvas1.width)
    })
  })

  describe('createOverlayCanvas', () => {
    it('should create an overlay canvas', () => {
      const originalCanvas = createMockCanvas()
      const diffCanvas = createMockCanvas()

      const result = service.createOverlayCanvas(
        originalCanvas as unknown as HTMLCanvasElement,
        diffCanvas as unknown as HTMLCanvasElement
      )

      expect(result).toBeDefined()
      expect(result.width).toBe(originalCanvas.width)
      expect(result.height).toBe(originalCanvas.height)
    })

    it('should accept custom opacity', () => {
      const originalCanvas = createMockCanvas()
      const diffCanvas = createMockCanvas()

      const result = service.createOverlayCanvas(
        originalCanvas as unknown as HTMLCanvasElement,
        diffCanvas as unknown as HTMLCanvasElement,
        0.7
      )

      expect(result).toBeDefined()
    })
  })

  describe('exportComparisonAsPng', () => {
    it('should export canvas as PNG blob', async () => {
      const canvas = createMockCanvas()
      const blob = await service.exportComparisonAsPng(canvas as unknown as HTMLCanvasElement)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/png')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage with 2 decimal places', () => {
      expect(service.formatPercentage(5.123)).toBe('5.12%')
      expect(service.formatPercentage(0)).toBe('0.00%')
      expect(service.formatPercentage(100)).toBe('100.00%')
      expect(service.formatPercentage(33.3333)).toBe('33.33%')
    })
  })

  describe('isSignificantlyDifferent', () => {
    it('should return true when difference exceeds threshold', () => {
      expect(service.isSignificantlyDifferent(5, 1)).toBe(true)
      expect(service.isSignificantlyDifferent(10, 5)).toBe(true)
    })

    it('should return false when difference is below threshold', () => {
      expect(service.isSignificantlyDifferent(0.5, 1)).toBe(false)
      expect(service.isSignificantlyDifferent(0, 1)).toBe(false)
    })

    it('should use default threshold of 1 if not specified', () => {
      expect(service.isSignificantlyDifferent(2)).toBe(true)
      expect(service.isSignificantlyDifferent(0.5)).toBe(false)
    })
  })

  describe('progress callbacks', () => {
    it('should call progress callback during comparison', async () => {
      const progressCallback = vi.fn()
      service.setProgressCallback(progressCallback)

      const pdf1 = await createTestPDF(1)
      const pdf2 = await createTestPDF(1)

      await service.comparePDFs(pdf1, pdf2, 1)

      expect(progressCallback).toHaveBeenCalled()

      // Should have received progress updates including 'complete' stage
      const calls = progressCallback.mock.calls
      const stages = calls.map((call) => call[0].stage)
      expect(stages).toContain('loading')
      expect(stages).toContain('rendering')
      expect(stages).toContain('comparing')
      expect(stages).toContain('complete')
    })
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ComparisonService.getInstance()
      const instance2 = ComparisonService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })
})
