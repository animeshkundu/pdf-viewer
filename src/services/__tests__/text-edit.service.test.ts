import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { textEditService } from '../text-edit.service'
import { mupdfService } from '../mupdf.service'

// Mock mupdfService
vi.mock('../mupdf.service', () => ({
  mupdfService: {
    loadDocument: vi.fn().mockResolvedValue({ pageCount: 1 }),
    extractText: vi.fn().mockResolvedValue({
      blocks: [
        {
          type: 'text',
          bbox: [72, 72, 540, 100], // x0, y0, x1, y1
          lines: [
            {
              bbox: [72, 72, 540, 100],
              wmode: 0,
              dir: [1, 0],
              spans: [
                {
                  font: 'Helvetica',
                  size: 12,
                  color: 0x000000,
                  bbox: [72, 72, 540, 100],
                  text: 'Hello World',
                },
              ],
            },
          ],
        },
      ],
    }),
    applyEdit: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn().mockResolvedValue(undefined),
    onProgress: vi.fn(),
  },
}))

describe('TextEditService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    // Clean up state between tests
    await textEditService.disable()
  })

  describe('enable', () => {
    it('should enable text editing mode with valid PDF bytes', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()
      const arrayBuffer = bytes.buffer.slice(0)

      await textEditService.enable(arrayBuffer)

      expect(mupdfService.loadDocument).toHaveBeenCalledTimes(1)
      expect(textEditService.getState().isEnabled).toBe(true)
    })

    it('should not re-enable if already enabled', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()
      const arrayBuffer = bytes.buffer.slice(0)

      await textEditService.enable(arrayBuffer)
      await textEditService.enable(arrayBuffer)

      // Should only call loadDocument once
      expect(mupdfService.loadDocument).toHaveBeenCalledTimes(1)
    })
  })

  describe('extractTextBlocks', () => {
    it('should extract and convert text blocks with correct coordinates', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))

      // Extract with scale = 1 (no scaling)
      const blocks = await textEditService.extractTextBlocks(1, 1)

      expect(blocks.length).toBe(1)
      expect(blocks[0].text).toBe('Hello World')
      // Bounds should match the original bbox (scaled by 1)
      expect(blocks[0].bounds.x).toBe(72)
      expect(blocks[0].bounds.y).toBe(72)
      expect(blocks[0].bounds.width).toBe(540 - 72) // x1 - x0
      expect(blocks[0].bounds.height).toBe(100 - 72) // y1 - y0
      // PDF bounds should also be unscaled
      expect(blocks[0].pdfBounds.x).toBe(72)
      expect(blocks[0].pdfBounds.width).toBe(540 - 72)
    })

    it('should extract text blocks with correct scaled bounds', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))

      // Extract with scale = 2 (double scaling for display)
      const blocks = await textEditService.extractTextBlocks(1, 2)

      expect(blocks.length).toBe(1)
      // Display bounds should be scaled
      expect(blocks[0].bounds.x).toBe(72 * 2)
      expect(blocks[0].bounds.y).toBe(72 * 2)
      expect(blocks[0].bounds.width).toBe((540 - 72) * 2)
      // PDF bounds should remain unscaled
      expect(blocks[0].pdfBounds.x).toBe(72)
      expect(blocks[0].pdfBounds.y).toBe(72)
      expect(blocks[0].pdfBounds.width).toBe(540 - 72)
    })

    it('should convert 0-indexed page numbers for MuPDF', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))
      await textEditService.extractTextBlocks(1, 1) // 1-indexed

      // MuPDF should receive 0-indexed page number
      expect(mupdfService.extractText).toHaveBeenCalledWith(0)
    })
  })

  describe('applyEdit', () => {
    it('should send correct PDF coordinates to MuPDF', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))

      // Extract with scale = 2
      const blocks = await textEditService.extractTextBlocks(1, 2)
      const block = blocks[0]

      // Apply edit
      await textEditService.applyEdit(block, 'New Text', {
        fontFamily: 'Arial',
        fontSize: 24, // Scaled font size (for display)
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#ff0000',
        textAlign: 'left',
      })

      // Verify MuPDF was called with unscaled (PDF) coordinates
      expect(mupdfService.applyEdit).toHaveBeenCalledTimes(1)

      const editArg = (mupdfService.applyEdit as ReturnType<typeof vi.fn>).mock.calls[0][0]

      // Page should be 0-indexed
      expect(editArg.pageNum).toBe(0)

      // originalBounds should be PDF coordinates (unscaled)
      expect(editArg.originalBounds.x).toBe(72)
      expect(editArg.originalBounds.y).toBe(72)

      // Font size should be unscaled
      expect(editArg.style.fontSize).toBe(12) // 24 / 2 (scale factor)

      // Color should be passed through
      expect(editArg.style.color).toBe('#ff0000')
    })

    it('should update state after successful edit', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))
      const blocks = await textEditService.extractTextBlocks(1, 1)

      textEditService.startEditing(blocks[0].id)

      await textEditService.applyEdit(blocks[0], 'New Text', blocks[0].style)

      const state = textEditService.getState()
      expect(state.editingBlockId).toBeNull()
      expect(state.pendingEdits.length).toBe(1)
    })
  })

  describe('state management', () => {
    it('should track selected and editing blocks', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))
      const blocks = await textEditService.extractTextBlocks(1, 1)

      textEditService.selectBlock(blocks[0].id)
      expect(textEditService.getState().selectedBlockId).toBe(blocks[0].id)

      textEditService.startEditing(blocks[0].id)
      expect(textEditService.getState().editingBlockId).toBe(blocks[0].id)

      textEditService.cancelEditing()
      expect(textEditService.getState().editingBlockId).toBeNull()
    })
  })
})
