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
                  origin: [72, 94],
                  text: 'Hello World',
                },
              ],
            },
          ],
        },
      ],
    }),
    applyEdit: vi.fn().mockResolvedValue(undefined),
    saveDocument: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])),
    terminate: vi.fn().mockResolvedValue(undefined),
    isInitialized: vi.fn().mockReturnValue(true),
    onProgress: vi.fn(),
  },
}))

describe('TextEditService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mupdfService.loadDocument).mockResolvedValue({ pageCount: 1 })
    vi.mocked(mupdfService.saveDocument).mockResolvedValue(new Uint8Array([37, 80, 68, 70]))
    vi.mocked(mupdfService.isInitialized).mockReturnValue(true)
  })

  afterEach(async () => {
    await textEditService.dispose()
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

    it('maps text runs correctly on rotated pages', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))
      const blocks = await textEditService.extractTextBlocks(1, 1, 90, 612, 792)

      expect(blocks[0].bounds).toEqual({
        x: 692,
        y: 72,
        width: 28,
        height: 468,
      })
      expect(blocks[0].pdfBounds).toEqual({
        x: 72,
        y: 72,
        width: 468,
        height: 28,
      })
    })

    it('retains native writing direction for replacement layout', async () => {
      vi.mocked(mupdfService.extractText).mockResolvedValueOnce({
        blocks: [{
          type: 'text',
          bbox: [214, 40, 242, 198],
          lines: [{
            bbox: [214, 40, 242, 198],
            wmode: 0,
            dir: [0, 1],
            spans: [{
              font: 'Helvetica',
              size: 20,
              color: 0,
              bbox: [214, 40, 242, 198],
              origin: [220, 40],
              text: 'Vertical source',
            }],
          }],
        }],
      })
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([420, 300])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))
      const [block] = await textEditService.extractTextBlocks(1, 1, 0, 300, 420)
      await textEditService.applyEdit(
        block,
        'A substantially longer vertical replacement',
        block.pdfStyle
      )

      const applyCalls = vi.mocked(mupdfService.applyEdit).mock.calls
      const operation = applyCalls[applyCalls.length - 1]?.[0]
      expect(operation?.origin).toEqual([220, 40])
      expect(operation?.direction).toEqual([0, 1])
      expect(operation?.newBounds.width).toBe(block.pdfBounds.width)
      expect(operation?.newBounds.height).toBeGreaterThan(block.pdfBounds.height)
    })

    it('keeps source text-run identities stable after edits and viewport changes', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))
      const [originalBlock] = await textEditService.extractTextBlocks(1, 1)
      await textEditService.applyEdit(originalBlock, 'First replacement', originalBlock.pdfStyle)

      const [zoomedBlock] = await textEditService.extractTextBlocks(1, 2)
      await textEditService.applyEdit(zoomedBlock, 'Second replacement', zoomedBlock.pdfStyle)

      expect(zoomedBlock.id).toBe(originalBlock.id)
      expect(zoomedBlock.bounds.x).toBe(originalBlock.bounds.x * 2)
      expect(mupdfService.extractText).toHaveBeenCalledTimes(1)

      const applyCalls = vi.mocked(mupdfService.applyEdit).mock.calls
      const lastOperation = applyCalls[applyCalls.length - 1]?.[0]
      expect(lastOperation?.originalBounds).toEqual(originalBlock.pdfBounds)
      expect(textEditService.getState().pendingEdits).toHaveLength(1)
      expect(textEditService.getState().pendingEdits[0].newText).toBe('Second replacement')
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
        fontSize: 12,
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

      // Font size is already expressed in stable PDF units.
      expect(editArg.style.fontSize).toBe(12)

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

      await textEditService.applyEdit(blocks[0], 'New Text', blocks[0].pdfStyle)

      const state = textEditService.getState()
      expect(state.editingBlockId).toBeNull()
      expect(state.pendingEdits.length).toBe(1)
    })

    it('maps replacement growth along the text direction on rotated pages', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))
      const [block] = await textEditService.extractTextBlocks(1, 1, 90, 612, 792)
      await textEditService.applyEdit(
        block,
        'A replacement that is substantially longer than the source',
        block.pdfStyle
      )

      const [edit] = textEditService.getState().pendingEdits
      expect(edit.newBounds.width).toBe(block.bounds.width)
      expect(edit.newBounds.height).toBeGreaterThan(block.bounds.height)
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

    it('preserves edited bytes when text edit mode is disabled', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))
      const [block] = await textEditService.extractTextBlocks(1, 1)
      await textEditService.applyEdit(block, 'Persisted text', block.pdfStyle)
      const terminationCount = vi.mocked(mupdfService.terminate).mock.calls.length
      await textEditService.disable()

      const editedBytes = await textEditService.getDocumentBytes()

      expect(new Uint8Array(editedBytes)).toEqual(new Uint8Array([37, 80, 68, 70]))
      expect(mupdfService.saveDocument).toHaveBeenCalledTimes(1)
      expect(mupdfService.terminate).toHaveBeenCalledTimes(terminationCount)
    })

    it('replays snapshots to implement undo and redo', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))
      const [block] = await textEditService.extractTextBlocks(1, 1)
      await textEditService.applyEdit(block, 'Persisted text', block.pdfStyle)

      await textEditService.undo()
      expect(textEditService.getState().pendingEdits).toHaveLength(0)
      expect(mupdfService.terminate).toHaveBeenCalledTimes(1)

      await textEditService.redo()
      expect(textEditService.getState().pendingEdits).toHaveLength(1)
      expect(mupdfService.applyEdit).toHaveBeenCalledTimes(2)
    })

    it('does not jump to pristine source at the bounded-history edge', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))
      const [block] = await textEditService.extractTextBlocks(1, 1)
      for (let editNumber = 1; editNumber <= 21; editNumber += 1) {
        await textEditService.applyEdit(block, `Edit ${editNumber}`, block.pdfStyle)
      }
      for (let undoNumber = 0; undoNumber < 20; undoNumber += 1) {
        await textEditService.undo()
      }

      expect(textEditService.getState().pendingEdits[0]?.newText).toBe('Edit 1')
      expect(textEditService.canUndo()).toBe(false)
    })

    it('rebuilds edit history after a worker failure', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))
      const [block] = await textEditService.extractTextBlocks(1, 1)
      await textEditService.applyEdit(block, 'Recovered text', block.pdfStyle)
      const loadCount = vi.mocked(mupdfService.loadDocument).mock.calls.length

      vi.mocked(mupdfService.isInitialized).mockReturnValue(false)
      await textEditService.getDocumentBytes()

      expect(mupdfService.loadDocument).toHaveBeenCalledTimes(loadCount + 1)
      expect(mupdfService.applyEdit).toHaveBeenCalledTimes(2)
      expect(mupdfService.saveDocument).toHaveBeenCalledTimes(1)
    })

    it('does not roll an old edit into a newly loaded document', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))
      const [block] = await textEditService.extractTextBlocks(1, 1)

      let resolveLoad: (info: { pageCount: number }) => void = () => undefined
      vi.mocked(mupdfService.loadDocument).mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveLoad = resolve
        })
      )

      const loadCount = vi.mocked(mupdfService.loadDocument).mock.calls.length
      const pendingEdit = textEditService.applyEdit(block, 'Old document edit', block.pdfStyle)
      await vi.waitFor(() => {
        expect(mupdfService.loadDocument).toHaveBeenCalledTimes(loadCount + 1)
      })
      textEditService.setDocument(new ArrayBuffer(16))
      resolveLoad({ pageCount: 1 })

      await expect(pendingEdit).rejects.toThrow('document changed')
      expect(textEditService.getState().pendingEdits).toHaveLength(0)
    })

    it('serializes concurrent edits so neither operation is lost', async () => {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.addPage([612, 792])
      const bytes = await pdfDoc.save()

      await textEditService.enable(bytes.buffer.slice(0))
      const [firstBlock] = await textEditService.extractTextBlocks(1, 1)
      const secondBlock = {
        ...firstBlock,
        id: 'text-run-1-1-0-0',
        bounds: { ...firstBlock.bounds, y: firstBlock.bounds.y + 40 },
        pdfBounds: { ...firstBlock.pdfBounds, y: firstBlock.pdfBounds.y + 40 },
        text: 'Second run',
      }

      await Promise.all([
        textEditService.applyEdit(firstBlock, 'First replacement', firstBlock.pdfStyle),
        textEditService.applyEdit(secondBlock, 'Second replacement', secondBlock.pdfStyle),
      ])

      expect(textEditService.getState().pendingEdits).toHaveLength(2)
      expect(mupdfService.applyEdit).toHaveBeenCalledTimes(3)
    })
  })
})
