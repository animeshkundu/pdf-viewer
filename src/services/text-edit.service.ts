/**
 * Text Edit Service
 *
 * Manages text editing state and coordinates between the UI and MuPDF service.
 * Follows the singleton pattern used by other services in the project.
 */

import { mupdfService } from './mupdf.service'
import type {
  TextBlock,
  TextEdit,
  TextStyle,
  TextBounds,
  TextEditState,
  PageTextState,
  TextEditProgress,
  TextPageViewport,
} from '@/types/text-edit.types'
import type {
  MuPDFStructuredText,
  MuPDFBlock,
  MuPDFLine,
  MuPDFSpan,
  MuPDFEditOperation,
} from '@/types/mupdf.types'

const MAX_HISTORY = 20

export function textBoundsToDisplay(
  bounds: TextBounds,
  viewport: TextPageViewport
): TextBounds {
  const scale = viewport.scale
  const rotation = ((viewport.rotation % 360) + 360) % 360

  switch (rotation) {
    case 90:
      return {
        x: (viewport.pageHeight - bounds.y - bounds.height) * scale,
        y: bounds.x * scale,
        width: bounds.height * scale,
        height: bounds.width * scale,
      }
    case 180:
      return {
        x: (viewport.pageWidth - bounds.x - bounds.width) * scale,
        y: (viewport.pageHeight - bounds.y - bounds.height) * scale,
        width: bounds.width * scale,
        height: bounds.height * scale,
      }
    case 270:
      return {
        x: bounds.y * scale,
        y: (viewport.pageWidth - bounds.x - bounds.width) * scale,
        width: bounds.height * scale,
        height: bounds.width * scale,
      }
    default:
      return {
        x: bounds.x * scale,
        y: bounds.y * scale,
        width: bounds.width * scale,
        height: bounds.height * scale,
      }
  }
}

class TextEditService {
  private static instance: TextEditService
  private subscribers = new Set<() => void>()
  private progressCallback?: (progress: TextEditProgress) => void
  private sourceIdentity: ArrayBuffer | null = null
  private sourceBytes: ArrayBuffer | null = null
  private workingBytes: Uint8Array | null = null
  private isDocumentLoaded = false
  private documentGeneration = 0
  private documentQueue: Promise<void> = Promise.resolve()
  private sourceBlocks = new Map<number, TextBlock[]>()
  private historyIncludesSource = true

  private state: TextEditState = {
    isEnabled: false,
    isLoading: false,
    loadingProgress: 0,
    loadingMessage: '',
    selectedBlockId: null,
    editingBlockId: null,
    pageStates: new Map(),
    pendingEdits: [],
    history: [],
    historyIndex: -1,
  }

  private constructor() {
    // Set up progress forwarding from MuPDF service
    mupdfService.onProgress((progress) => {
      this.updateProgress(
        progress.stage as TextEditProgress['stage'],
        progress.percent,
        progress.message
      )
    })
  }

  static getInstance(): TextEditService {
    if (!TextEditService.instance) {
      TextEditService.instance = new TextEditService()
    }
    return TextEditService.instance
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Set progress callback
   */
  setProgressCallback(callback: (progress: TextEditProgress) => void): void {
    this.progressCallback = callback
  }

  /**
   * Get current state
   */
  getState(): TextEditState {
    return { ...this.state }
  }

  /**
   * Bind editing state to the currently loaded source document.
   */
  setDocument(pdfBytes: ArrayBuffer | null): void {
    if (this.sourceIdentity === pdfBytes) return

    this.documentGeneration += 1
    mupdfService.terminate()
    this.sourceIdentity = pdfBytes
    this.sourceBytes = pdfBytes?.slice(0) ?? null
    this.workingBytes = null
    this.isDocumentLoaded = false
    this.sourceBlocks.clear()
    this.historyIncludesSource = true
    this.state = this.createInitialState()
    this.notifySubscribers()
  }

  dispose(): void {
    this.documentGeneration += 1
    mupdfService.terminate()
    this.sourceIdentity = null
    this.sourceBytes = null
    this.workingBytes = null
    this.isDocumentLoaded = false
    this.sourceBlocks.clear()
    this.historyIncludesSource = true
    this.state = this.createInitialState()
    this.notifySubscribers()
  }

  /**
   * Enable text editing mode
   */
  async enable(pdfBytes: ArrayBuffer): Promise<void> {
    if (this.state.isEnabled || this.state.isLoading) return

    if (this.sourceIdentity !== pdfBytes) {
      this.setDocument(pdfBytes)
    }
    const generation = this.documentGeneration

    this.setState({ isLoading: true, loadingProgress: 0, loadingMessage: 'Initializing...' })

    try {
      await this.withDocumentLock(async () => {
        await this.ensureWorkerDocument(generation)
      })

      this.setState({
        isEnabled: true,
        isLoading: false,
        loadingProgress: 100,
        loadingMessage: 'Ready',
      })
    } catch (error) {
      console.error('Text edit enable error:', error)
      if (generation === this.documentGeneration) {
        this.setState({ isLoading: false, loadingProgress: 0, loadingMessage: '' })
      }
      throw error
    }
  }

  /**
   * Disable text editing mode
   */
  disable(): void {
    if (!this.state.isEnabled) return

    this.setState({
      isEnabled: false,
      isLoading: false,
      selectedBlockId: null,
      editingBlockId: null,
    })
  }

  /**
   * Extract text blocks from a page
   * @param pageNum 1-indexed page number (converted to 0-indexed for MuPDF)
   */
  async extractTextBlocks(
    pageNum: number,
    scale: number,
    rotation = 0,
    pageWidth = 0,
    pageHeight = 0
  ): Promise<TextBlock[]> {
    const viewport: TextPageViewport = {
      scale,
      rotation: this.normalizeRotation(rotation),
      pageWidth,
      pageHeight,
    }
    const displayKey = `${scale}:${viewport.rotation}:${pageWidth}:${pageHeight}:${this.state.historyIndex}`
    const generation = this.documentGeneration
    const existingState = this.state.pageStates.get(pageNum)
    if (
      existingState &&
      existingState.displayKey === displayKey &&
      existingState.blocks.length > 0 &&
      !existingState.isLoading
    ) {
      return existingState.blocks
    }

    const sourceBlocks = this.sourceBlocks.get(pageNum)
    if (sourceBlocks) {
      const blocks = this.mergeEditedRuns(
        this.projectBlocks(sourceBlocks, viewport),
        pageNum,
        viewport
      )
      this.setPageState(pageNum, {
        isLoading: false,
        blocks,
        displayKey,
        edits: this.getActiveEdits().filter((edit) => edit.pageNum === pageNum),
        error: undefined,
      })
      return blocks
    }

    // Mark page as loading
    this.setPageState(pageNum, { isLoading: true, blocks: [], displayKey })

    try {
      return await this.withDocumentLock(async () => {
        await this.ensureWorkerDocument(generation)
        // MuPDF uses 0-indexed pages
        let structuredText: MuPDFStructuredText
        try {
          structuredText = await mupdfService.extractText(pageNum - 1)
        } catch (error) {
          if (generation !== this.documentGeneration || mupdfService.isInitialized()) {
            throw error
          }
          this.isDocumentLoaded = false
          await this.ensureWorkerDocument(generation)
          structuredText = await mupdfService.extractText(pageNum - 1)
        }
        this.assertDocumentGeneration(generation)
        const extractedBlocks = this.convertStructuredText(structuredText, pageNum, viewport)
        this.sourceBlocks.set(pageNum, extractedBlocks)
        const blocks = this.mergeEditedRuns(extractedBlocks, pageNum, viewport)

        this.setPageState(pageNum, {
          isLoading: false,
          blocks,
          displayKey,
          edits: this.getActiveEdits().filter((edit) => edit.pageNum === pageNum),
        })
        return blocks
      })
    } catch (error) {
      console.error('Extract text blocks error:', error)
      if (generation === this.documentGeneration) {
        this.setPageState(pageNum, {
          isLoading: false,
          blocks: [],
          edits: [],
          error: error instanceof Error ? error.message : 'Failed to extract text',
        })
      }
      throw error
    }
  }

  /**
   * Select a text block
   */
  selectBlock(blockId: string | null): void {
    this.setState({ selectedBlockId: blockId })
  }

  /**
   * Start editing a text block
   */
  startEditing(blockId: string): void {
    this.setState({ editingBlockId: blockId, selectedBlockId: blockId })
  }

  /**
   * Cancel editing
   */
  cancelEditing(): void {
    this.setState({ editingBlockId: null })
  }

  /**
   * Apply a text edit
   */
  async applyEdit(
    block: TextBlock,
    newText: string,
    newStyle: TextStyle
  ): Promise<void> {
    if (!this.isDocumentLoaded) {
      throw new Error('Text editing document is not loaded')
    }

    // Editor styles stay in PDF units so viewport zoom cannot alter exported text.
    const pdfStyle: TextStyle = { ...newStyle }

    const previousEdits = this.getActiveEdits()
    const previousEdit = previousEdits.find((edit) => edit.blockId === block.id)
    const originalPdfBounds = previousEdit?.operation.originalBounds ?? block.pdfBounds
    const pdfOrigin = previousEdit?.operation.origin ?? block.pdfOrigin
    const direction = previousEdit?.operation.direction ?? block.direction
    const originalText = previousEdit?.originalText ?? block.text
    const pdfBoundsForEdit = this.calculateNewBounds(
      originalPdfBounds,
      originalText,
      newText,
      pdfStyle,
      direction
    )
    const operation: MuPDFEditOperation = {
      pageNum: block.pageNum - 1,
      origin: pdfOrigin,
      direction,
      originalBounds: originalPdfBounds,
      newBounds: pdfBoundsForEdit,
      newText,
      style: {
        fontFamily: pdfStyle.fontFamily,
        fontSize: pdfStyle.fontSize,
        fontWeight: pdfStyle.fontWeight,
        fontStyle: pdfStyle.fontStyle,
        color: pdfStyle.color,
        textAlign: pdfStyle.textAlign,
      },
    }

    const edit: TextEdit = {
      id: `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      blockId: block.id,
      pageNum: block.pageNum,
      originalText,
      newText,
      originalBounds: previousEdit?.originalBounds ?? block.bounds,
      newBounds: block.viewport
        ? textBoundsToDisplay(pdfBoundsForEdit, block.viewport)
        : this.calculateNewBounds(block.bounds, block.text, newText, newStyle, direction),
      style: pdfStyle,
      operation,
      timestamp: Date.now(),
    }

    const generation = this.documentGeneration

    await this.withDocumentLock(async () => {
      const currentEdits = this.getActiveEdits()
      const nextEdits = [
        ...currentEdits.filter((activeEdit) => activeEdit.blockId !== block.id),
        edit,
      ]

      try {
        await this.rebuildDocumentFromEdits(nextEdits, generation)
        this.assertDocumentGeneration(generation)
        this.addToHistory(nextEdits)

        // Update page state
        const pageState = this.state.pageStates.get(block.pageNum)
        if (pageState) {
          this.setPageState(block.pageNum, {
            ...pageState,
            edits: this.getActiveEdits().filter((activeEdit) => activeEdit.pageNum === block.pageNum),
          })
        }
      } catch (error) {
        if (generation === this.documentGeneration) {
          await this.rebuildDocumentFromEdits(currentEdits, generation)
        }
        throw error
      }
    })
  }

  /**
   * Save the edited document
   */
  async saveDocument(): Promise<Blob> {
    const bytes = await this.getDocumentBytes()
    return new Blob([bytes], { type: 'application/pdf' })
  }

  /**
   * Return the current working PDF, including baked text replacements.
   */
  async getDocumentBytes(fallbackBytes?: ArrayBuffer): Promise<ArrayBuffer> {
    const generation = this.documentGeneration
    return this.withDocumentLock(async () => {
      if (this.state.historyIndex < 0) {
        const source = this.sourceBytes ?? fallbackBytes
        if (!source) throw new Error('No PDF document loaded')
        this.assertDocumentGeneration(generation)
        return source.slice(0)
      }

      await this.ensureWorkerDocument(generation)
      try {
        this.workingBytes = await mupdfService.saveDocument()
      } catch (error) {
        if (generation !== this.documentGeneration || mupdfService.isInitialized()) {
          throw error
        }
        this.isDocumentLoaded = false
        await this.ensureWorkerDocument(generation)
        this.workingBytes = await mupdfService.saveDocument()
      }

      this.assertDocumentGeneration(generation)
      return this.toArrayBuffer(this.workingBytes)
    })
  }

  /**
   * Undo last edit
   */
  async undo(): Promise<void> {
    await this.withDocumentLock(async () => {
      if (!this.canUndo()) return

      const historyIndex = this.state.historyIndex - 1
      await this.rebuildDocument(historyIndex)
      this.updateHistoryIndex(historyIndex)
    })
  }

  /**
   * Redo last undone edit
   */
  async redo(): Promise<void> {
    await this.withDocumentLock(async () => {
      if (this.state.historyIndex >= this.state.history.length - 1) return

      const historyIndex = this.state.historyIndex + 1
      await this.rebuildDocument(historyIndex)
      this.updateHistoryIndex(historyIndex)
    })
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.state.historyIndex > 0 ||
      (this.state.historyIndex === 0 && this.historyIncludesSource)
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.state.historyIndex < this.state.history.length - 1
  }

  /**
   * Get a text block by ID
   */
  getBlockById(blockId: string): TextBlock | undefined {
    for (const pageState of this.state.pageStates.values()) {
      const block = pageState.blocks.find((b) => b.id === blockId)
      if (block) return block
    }
    return undefined
  }

  /**
   * Get pending edits for a page
   */
  getPendingEditsForPage(pageNum: number): TextEdit[] {
    return this.state.pendingEdits.filter((e) => e.pageNum === pageNum)
  }

  // Private methods

  private setState(updates: Partial<TextEditState>): void {
    this.state = { ...this.state, ...updates }
    this.notifySubscribers()
  }

  private setPageState(pageNum: number, state: Partial<PageTextState>): void {
    const existing = this.state.pageStates.get(pageNum) || {
      pageNum,
      blocks: [],
      edits: [],
      isLoading: false,
    }
    const newPageStates = new Map(this.state.pageStates)
    newPageStates.set(pageNum, { ...existing, ...state })
    this.setState({ pageStates: newPageStates })
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback())
  }

  private updateProgress(
    stage: TextEditProgress['stage'],
    progress: number,
    message: string
  ): void {
    this.setState({
      loadingProgress: progress,
      loadingMessage: message,
    })
    this.progressCallback?.({ stage, progress, message })
  }

  private addToHistory(edits: TextEdit[]): void {
    const history = this.state.history.slice(0, this.state.historyIndex + 1)
    history.push(edits)

    if (history.length > MAX_HISTORY) {
      this.historyIncludesSource = false
    }
    if (history.length > MAX_HISTORY + 1) {
      history.shift()
    }

    this.setState({
      history,
      historyIndex: history.length - 1,
      pendingEdits: edits,
      editingBlockId: null,
    })
  }

  private getActiveEdits(historyIndex = this.state.historyIndex): TextEdit[] {
    if (historyIndex < 0) return []
    return this.state.history[historyIndex] ?? []
  }

  private async rebuildDocument(historyIndex: number): Promise<void> {
    await this.rebuildDocumentFromEdits(this.getActiveEdits(historyIndex))
  }

  private async rebuildDocumentFromEdits(
    edits: TextEdit[],
    generation = this.documentGeneration
  ): Promise<void> {
    if (!this.sourceBytes) {
      throw new Error('No source PDF document loaded')
    }

    this.assertDocumentGeneration(generation)
    this.isDocumentLoaded = false
    await mupdfService.loadDocument(this.sourceBytes.slice(0))
    this.assertDocumentGeneration(generation)

    for (const edit of edits) {
      await mupdfService.applyEdit(edit.operation)
      this.assertDocumentGeneration(generation)
    }

    this.isDocumentLoaded = true
    this.workingBytes = null
  }

  private async ensureWorkerDocument(generation: number): Promise<void> {
    this.assertDocumentGeneration(generation)
    if (this.isDocumentLoaded && mupdfService.isInitialized()) return

    this.isDocumentLoaded = false
    await this.rebuildDocumentFromEdits(this.getActiveEdits(), generation)
  }

  private assertDocumentGeneration(generation: number): void {
    if (generation !== this.documentGeneration) {
      throw new Error('The PDF document changed while text editing was in progress')
    }
  }

  private async withDocumentLock<T>(operation: () => Promise<T>): Promise<T> {
    const previousOperation = this.documentQueue
    let releaseLock: () => void = () => undefined
    this.documentQueue = new Promise<void>((resolve) => {
      releaseLock = resolve
    })

    await previousOperation
    try {
      return await operation()
    } finally {
      releaseLock()
    }
  }

  private updateHistoryIndex(historyIndex: number): void {
    const pendingEdits = this.getActiveEdits(historyIndex)
    const pageStates = new Map(this.state.pageStates)

    pageStates.forEach((pageState, pageNum) => {
      pageStates.set(pageNum, {
        ...pageState,
        edits: pendingEdits.filter((edit) => edit.pageNum === pageNum),
      })
    })

    this.setState({
      historyIndex,
      pendingEdits,
      pageStates,
      selectedBlockId: null,
      editingBlockId: null,
    })
  }

  private createInitialState(): TextEditState {
    return {
      isEnabled: false,
      isLoading: false,
      loadingProgress: 0,
      loadingMessage: '',
      selectedBlockId: null,
      editingBlockId: null,
      pageStates: new Map(),
      pendingEdits: [],
      history: [],
      historyIndex: -1,
    }
  }

  private toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const copy = new Uint8Array(bytes.byteLength)
    copy.set(bytes)
    return copy.buffer
  }

  private normalizeRotation(rotation: number): number {
    const normalized = ((rotation % 360) + 360) % 360
    return normalized === 90 || normalized === 180 || normalized === 270 ? normalized : 0
  }

  private convertStructuredText(
    structured: MuPDFStructuredText,
    pageNum: number,
    viewport: TextPageViewport
  ): TextBlock[] {
    const runs: TextBlock[] = []

    structured.blocks.forEach((block: MuPDFBlock, blockIndex: number) => {
      if (block.type !== 'text' || !block.lines) return

      block.lines.forEach((line: MuPDFLine, lineIndex: number) => {
        line.spans.forEach((span: MuPDFSpan, spanIndex: number) => {
          if (!span.text.trim()) return

          runs.push(
            this.convertSpan(
              span,
              line,
              pageNum,
              blockIndex,
              lineIndex,
              spanIndex,
              viewport
            )
          )
        })
      })
    })

    return runs
  }

  private convertSpan(
    span: MuPDFSpan,
    line: MuPDFLine,
    pageNum: number,
    blockIndex: number,
    lineIndex: number,
    spanIndex: number,
    viewport: TextPageViewport
  ): TextBlock {
    const pdfBounds = this.bboxToBounds(span.bbox)
    const bounds = textBoundsToDisplay(pdfBounds, viewport)
    const style: TextStyle = {
      fontFamily: this.cleanFontName(span.font),
      fontSize: span.size * viewport.scale,
      fontWeight: span.font.toLowerCase().includes('bold') ? 'bold' : 'normal',
      fontStyle: /italic|oblique/i.test(span.font) ? 'italic' : 'normal',
      color: this.packedColorToHex(span.color),
      textAlign: 'left',
    }

    return {
      id: `text-run-${pageNum}-${blockIndex}-${lineIndex}-${spanIndex}`,
      pageNum,
      bounds,
      pdfBounds,
      pdfOrigin: span.origin,
      direction: line.dir,
      text: span.text,
      lines: [
        {
          text: span.text,
          bounds,
          spans: [{
            text: span.text,
            bounds,
            style,
          }],
        },
      ],
      style,
      pdfStyle: {
        ...style,
        fontSize: span.size,
      },
      viewport,
    }
  }

  private mergeEditedRuns(
    blocks: TextBlock[],
    pageNum: number,
    viewport: TextPageViewport
  ): TextBlock[] {
    const mergedBlocks = [...blocks]
    const blockIds = new Set(blocks.map((block) => block.id))

    for (const edit of this.getActiveEdits()) {
      if (edit.pageNum !== pageNum || blockIds.has(edit.blockId)) continue

      const pdfBounds = edit.operation.newBounds
      const bounds = textBoundsToDisplay(pdfBounds, viewport)
      const style: TextStyle = {
        ...edit.operation.style,
        fontFamily: this.cleanFontName(edit.operation.style.fontFamily),
        fontSize: edit.operation.style.fontSize * viewport.scale,
      }
      const pdfStyle: TextStyle = {
        ...edit.operation.style,
        fontFamily: this.cleanFontName(edit.operation.style.fontFamily),
      }

      mergedBlocks.push({
        id: edit.blockId,
        pageNum,
        bounds,
        pdfBounds,
        pdfOrigin: edit.operation.origin,
        direction: edit.operation.direction,
        text: edit.newText,
        lines: [
          {
            text: edit.newText,
            bounds,
            spans: [{ text: edit.newText, bounds, style }],
          },
        ],
        style,
        pdfStyle,
        viewport,
      })
    }

    return mergedBlocks
  }

  private projectBlocks(blocks: TextBlock[], viewport: TextPageViewport): TextBlock[] {
    return blocks.map((block) => {
      const bounds = textBoundsToDisplay(block.pdfBounds, viewport)
      const style: TextStyle = {
        ...block.pdfStyle,
        fontSize: block.pdfStyle.fontSize * viewport.scale,
      }

      return {
        ...block,
        bounds,
        lines: [
          {
            text: block.text,
            bounds,
            spans: [{ text: block.text, bounds, style }],
          },
        ],
        style,
        viewport,
      }
    })
  }

  private bboxToBounds(bbox: [number, number, number, number]): TextBounds {
    return {
      x: bbox[0],
      y: bbox[1],
      width: bbox[2] - bbox[0],
      height: bbox[3] - bbox[1],
    }
  }

  /**
   * Convert packed RGB color to hex string
   */
  private packedColorToHex(packed: number): string {
    // MuPDF color is packed as 0xRRGGBB
    const r = (packed >> 16) & 0xff
    const g = (packed >> 8) & 0xff
    const b = packed & 0xff
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  /**
   * Clean font name (remove subset prefix like ABCDEF+)
   */
  private cleanFontName(fontName: string): string {
    // Remove subset prefix (e.g., "ABCDEF+Arial" -> "Arial")
    const cleaned = fontName.replace(/^[A-Z]{6}\+/, '')

    // Map common PDF fonts to web-safe fonts
    const fontMap: Record<string, string> = {
      'Times-Roman': 'Times New Roman',
      'Times-Bold': 'Times New Roman',
      'Times-Italic': 'Times New Roman',
      'Times-BoldItalic': 'Times New Roman',
      'Helvetica': 'Arial',
      'Helvetica-Bold': 'Arial',
      'Helvetica-Oblique': 'Arial',
      'Helvetica-BoldOblique': 'Arial',
      'Courier': 'Courier New',
      'Courier-Bold': 'Courier New',
      'Courier-Oblique': 'Courier New',
      'Courier-BoldOblique': 'Courier New',
    }

    return fontMap[cleaned] || cleaned
  }

  /**
   * Calculate new bounds based on text and style
   */
  private calculateNewBounds(
    originalBounds: TextBounds,
    originalText: string,
    newText: string,
    style: TextStyle,
    direction: [number, number]
  ): TextBounds {
    const lines = newText.split('\n')
    const originalLineLength = Math.max(originalText.length, 1)
    const longestLineLength = Math.max(...lines.map((line) => line.length), 1)
    const lineHeight = style.fontSize * 1.2
    const proportionalWidth = originalBounds.width * (longestLineLength / originalLineLength)
    const glyphWidth = longestLineLength * style.fontSize * 0.65 + style.fontSize

    const vertical = Math.abs(direction[1]) > Math.abs(direction[0])
    const longitudinalSize = Math.max(
      vertical ? originalBounds.height : originalBounds.width,
      proportionalWidth,
      glyphWidth
    )
    const crossSize = Math.max(
      vertical ? originalBounds.width : originalBounds.height,
      lines.length * lineHeight
    )
    const width = vertical ? crossSize : longitudinalSize
    const height = vertical ? longitudinalSize : crossSize

    return {
      x: direction[0] < 0
        ? originalBounds.x + originalBounds.width - width
        : originalBounds.x,
      y: direction[1] < 0
        ? originalBounds.y + originalBounds.height - height
        : originalBounds.y,
      width,
      height,
    }
  }
}

export const textEditService = TextEditService.getInstance()
