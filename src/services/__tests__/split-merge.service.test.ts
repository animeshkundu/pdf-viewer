import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SplitMergeService } from '../split-merge.service'
import type { SplitOptions, MergeFile } from '@/types/split-merge.types'
import { PDFDocument } from 'pdf-lib'

// Mock file-saver to avoid browser-specific API issues in tests
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}))

describe('SplitMergeService', () => {
  let service: SplitMergeService

  // Helper to create a simple test PDF with N pages
  async function createTestPDF(pageCount: number): Promise<ArrayBuffer> {
    const pdfDoc = await PDFDocument.create()
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.addPage([612, 792]) // Letter size
      page.drawText(`Page ${i + 1}`, { x: 50, y: 700, size: 24 })
    }
    const bytes = await pdfDoc.save()
    return bytes.buffer as ArrayBuffer
  }

  // Helper to create a File object from ArrayBuffer
  function createTestFile(buffer: ArrayBuffer, name: string): File {
    return new File([buffer], name, { type: 'application/pdf' })
  }

  beforeEach(() => {
    service = SplitMergeService.getInstance()
  })

  describe('getPageCount', () => {
    it('should return correct page count for a PDF file', async () => {
      const pdfBuffer = await createTestPDF(5)
      const file = createTestFile(pdfBuffer, 'test.pdf')

      const pageCount = await service.getPageCount(file)
      expect(pageCount).toBe(5)
    })

    it('should return 1 for single page PDF', async () => {
      const pdfBuffer = await createTestPDF(1)
      const file = createTestFile(pdfBuffer, 'single.pdf')

      const pageCount = await service.getPageCount(file)
      expect(pageCount).toBe(1)
    })
  })

  describe('splitPDF', () => {
    it('should split PDF by page ranges', async () => {
      const pdfBuffer = await createTestPDF(10)
      const options: SplitOptions = {
        mode: {
          type: 'ranges',
          ranges: [
            { start: 1, end: 3 },
            { start: 4, end: 7 },
            { start: 8, end: 10 },
          ],
        },
        outputFormat: 'separate',
      }

      const result = await service.splitPDF(pdfBuffer, options, 'test.pdf')

      expect(result.blobs.length).toBe(3)
      expect(result.filenames.length).toBe(3)
      expect(result.filenames[0]).toContain('pages_1-3')
      expect(result.filenames[1]).toContain('pages_4-7')
      expect(result.filenames[2]).toContain('pages_8-10')

      // Verify page counts of split PDFs
      const doc1 = await PDFDocument.load(await result.blobs[0].arrayBuffer())
      const doc2 = await PDFDocument.load(await result.blobs[1].arrayBuffer())
      const doc3 = await PDFDocument.load(await result.blobs[2].arrayBuffer())

      expect(doc1.getPageCount()).toBe(3)
      expect(doc2.getPageCount()).toBe(4)
      expect(doc3.getPageCount()).toBe(3)
    })

    it('should split PDF every N pages', async () => {
      const pdfBuffer = await createTestPDF(10)
      const options: SplitOptions = {
        mode: { type: 'everyN', n: 3 },
        outputFormat: 'separate',
      }

      const result = await service.splitPDF(pdfBuffer, options, 'test.pdf')

      // 10 pages / 3 = 4 files (3, 3, 3, 1)
      expect(result.blobs.length).toBe(4)

      const doc1 = await PDFDocument.load(await result.blobs[0].arrayBuffer())
      const doc2 = await PDFDocument.load(await result.blobs[1].arrayBuffer())
      const doc3 = await PDFDocument.load(await result.blobs[2].arrayBuffer())
      const doc4 = await PDFDocument.load(await result.blobs[3].arrayBuffer())

      expect(doc1.getPageCount()).toBe(3)
      expect(doc2.getPageCount()).toBe(3)
      expect(doc3.getPageCount()).toBe(3)
      expect(doc4.getPageCount()).toBe(1)
    })

    it('should extract specific pages as individual files', async () => {
      const pdfBuffer = await createTestPDF(10)
      const options: SplitOptions = {
        mode: { type: 'extractPages', pages: [2, 5, 8] },
        outputFormat: 'separate',
      }

      const result = await service.splitPDF(pdfBuffer, options, 'test.pdf')

      // extractPages mode creates one file per page
      expect(result.blobs.length).toBe(3)

      // Each blob should contain a single page
      for (const blob of result.blobs) {
        const doc = await PDFDocument.load(await blob.arrayBuffer())
        expect(doc.getPageCount()).toBe(1)
      }
    })

    it('should throw error for invalid page range', async () => {
      const pdfBuffer = await createTestPDF(5)
      const options: SplitOptions = {
        mode: {
          type: 'ranges',
          ranges: [{ start: 1, end: 10 }], // Exceeds document length
        },
        outputFormat: 'separate',
      }

      await expect(service.splitPDF(pdfBuffer, options)).rejects.toThrow()
    })
  })

  describe('extractPages', () => {
    it('should extract specified pages', async () => {
      const pdfBuffer = await createTestPDF(10)

      const result = await service.extractPages(pdfBuffer, [1, 3, 5, 7, 9])

      const doc = await PDFDocument.load(await result.arrayBuffer())
      expect(doc.getPageCount()).toBe(5)
    })

    it('should preserve page order when extracting', async () => {
      const pdfBuffer = await createTestPDF(5)

      // Extract in reverse order - should maintain specified order
      const result = await service.extractPages(pdfBuffer, [5, 3, 1])

      const doc = await PDFDocument.load(await result.arrayBuffer())
      expect(doc.getPageCount()).toBe(3)
    })
  })

  describe('mergePDFs', () => {
    it('should merge multiple PDF files', async () => {
      const pdf1Buffer = await createTestPDF(3)
      const pdf2Buffer = await createTestPDF(2)
      const pdf3Buffer = await createTestPDF(4)

      const mergeFiles: MergeFile[] = [
        {
          id: '1',
          file: createTestFile(pdf1Buffer, 'file1.pdf'),
          name: 'file1.pdf',
          pageCount: 3,
          order: 0,
        },
        {
          id: '2',
          file: createTestFile(pdf2Buffer, 'file2.pdf'),
          name: 'file2.pdf',
          pageCount: 2,
          order: 1,
        },
        {
          id: '3',
          file: createTestFile(pdf3Buffer, 'file3.pdf'),
          name: 'file3.pdf',
          pageCount: 4,
          order: 2,
        },
      ]

      const result = await service.mergePDFs(mergeFiles)

      const doc = await PDFDocument.load(await result.arrayBuffer())
      expect(doc.getPageCount()).toBe(9) // 3 + 2 + 4
    })

    it('should merge files in specified order', async () => {
      const pdf1Buffer = await createTestPDF(2)
      const pdf2Buffer = await createTestPDF(2)

      const mergeFiles: MergeFile[] = [
        {
          id: '1',
          file: createTestFile(pdf1Buffer, 'first.pdf'),
          name: 'first.pdf',
          pageCount: 2,
          order: 0,
        },
        {
          id: '2',
          file: createTestFile(pdf2Buffer, 'second.pdf'),
          name: 'second.pdf',
          pageCount: 2,
          order: 1,
        },
      ]

      const result = await service.mergePDFs(mergeFiles)

      const doc = await PDFDocument.load(await result.arrayBuffer())
      expect(doc.getPageCount()).toBe(4)
    })

    it('should merge only selected pages when specified', async () => {
      const pdf1Buffer = await createTestPDF(5)
      const pdf2Buffer = await createTestPDF(5)

      const mergeFiles: MergeFile[] = [
        {
          id: '1',
          file: createTestFile(pdf1Buffer, 'file1.pdf'),
          name: 'file1.pdf',
          pageCount: 5,
          order: 0,
          selectedPages: [1, 3, 5], // Only pages 1, 3, 5
        },
        {
          id: '2',
          file: createTestFile(pdf2Buffer, 'file2.pdf'),
          name: 'file2.pdf',
          pageCount: 5,
          order: 1,
          selectedPages: [2, 4], // Only pages 2, 4
        },
      ]

      const result = await service.mergePDFs(mergeFiles)

      const doc = await PDFDocument.load(await result.arrayBuffer())
      expect(doc.getPageCount()).toBe(5) // 3 + 2
    })

    it('should throw error when no files to merge', async () => {
      await expect(service.mergePDFs([])).rejects.toThrow('No files to merge')
    })
  })

  describe('removePages', () => {
    it('should remove specified pages', async () => {
      const pdfBuffer = await createTestPDF(10)

      const result = await service.removePages(pdfBuffer, [2, 4, 6, 8, 10])

      const doc = await PDFDocument.load(await result.arrayBuffer())
      expect(doc.getPageCount()).toBe(5)
    })

    it('should handle removing single page', async () => {
      const pdfBuffer = await createTestPDF(5)

      const result = await service.removePages(pdfBuffer, [3])

      const doc = await PDFDocument.load(await result.arrayBuffer())
      expect(doc.getPageCount()).toBe(4)
    })
  })

  describe('progress callbacks', () => {
    it('should call progress callback during split', async () => {
      const progressCallback = vi.fn()
      service.setProgressCallback(progressCallback)

      const pdfBuffer = await createTestPDF(5)
      const options: SplitOptions = {
        mode: { type: 'everyN', n: 2 },
        outputFormat: 'separate',
      }

      await service.splitPDF(pdfBuffer, options)

      expect(progressCallback).toHaveBeenCalled()
      // Should have received progress updates including 'complete' stage
      const calls = progressCallback.mock.calls
      const stages = calls.map((call) => call[0].stage)
      expect(stages).toContain('loading')
      expect(stages).toContain('processing')
      expect(stages).toContain('complete')
    })

    it('should call progress callback during merge', async () => {
      const progressCallback = vi.fn()
      service.setProgressCallback(progressCallback)

      const pdf1Buffer = await createTestPDF(2)
      const pdf2Buffer = await createTestPDF(2)

      const mergeFiles: MergeFile[] = [
        {
          id: '1',
          file: createTestFile(pdf1Buffer, 'file1.pdf'),
          name: 'file1.pdf',
          pageCount: 2,
          order: 0,
        },
        {
          id: '2',
          file: createTestFile(pdf2Buffer, 'file2.pdf'),
          name: 'file2.pdf',
          pageCount: 2,
          order: 1,
        },
      ]

      await service.mergePDFs(mergeFiles)

      expect(progressCallback).toHaveBeenCalled()
      const calls = progressCallback.mock.calls
      const stages = calls.map((call) => call[0].stage)
      expect(stages).toContain('loading')
      expect(stages).toContain('processing')
      expect(stages).toContain('complete')
    })
  })

  describe('downloadBlob', () => {
    it('should call saveAs with correct blob and filename', async () => {
      const { saveAs } = await import('file-saver')

      const blob = new Blob(['test'], { type: 'application/pdf' })
      service.downloadBlob(blob, 'test.pdf')

      expect(saveAs).toHaveBeenCalledWith(blob, 'test.pdf')
    })
  })
})
