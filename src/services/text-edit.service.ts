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
} from '@/types/text-edit.types'
import type { MuPDFStructuredText, MuPDFBlock, MuPDFLine, MuPDFSpan } from '@/types/mupdf.types'

const MAX_HISTORY = 20

class TextEditService {
  private static instance: TextEditService
  private subscribers = new Set<() => void>()
  private progressCallback?: (progress: TextEditProgress) => void

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
   * Enable text editing mode
   */
  async enable(pdfBytes: ArrayBuffer): Promise<void> {
    if (this.state.isEnabled) return

    this.setState({ isLoading: true, loadingProgress: 0, loadingMessage: 'Initializing...' })

    try {
      // Copy the buffer to avoid detached ArrayBuffer issues
      const pdfBytesCopy = pdfBytes.slice(0)
      await mupdfService.loadDocument(pdfBytesCopy)
      this.setState({
        isEnabled: true,
        isLoading: false,
        loadingProgress: 100,
        loadingMessage: 'Ready',
      })
    } catch (error) {
      console.error('Text edit enable error:', error)
      this.setState({ isLoading: false, loadingProgress: 0, loadingMessage: '' })
      throw error
    }
  }

  /**
   * Disable text editing mode
   */
  async disable(): Promise<void> {
    if (!this.state.isEnabled) return

    await mupdfService.cleanup()
    this.setState({
      isEnabled: false,
      isLoading: false,
      selectedBlockId: null,
      editingBlockId: null,
      pageStates: new Map(),
      pendingEdits: [],
      history: [],
      historyIndex: -1,
    })
  }

  /**
   * Extract text blocks from a page
   * @param pageNum 1-indexed page number (converted to 0-indexed for MuPDF)
   */
  async extractTextBlocks(pageNum: number, scale: number): Promise<TextBlock[]> {
    const existingState = this.state.pageStates.get(pageNum)
    if (existingState && existingState.blocks.length > 0 && !existingState.isLoading) {
      return existingState.blocks
    }

    // Mark page as loading
    this.setPageState(pageNum, { isLoading: true, blocks: [], edits: [] })

    try {
      // MuPDF uses 0-indexed pages
      const structuredText = await mupdfService.extractText(pageNum - 1)
      const blocks = this.convertStructuredText(structuredText, pageNum, scale)

      this.setPageState(pageNum, { isLoading: false, blocks, edits: [] })
      return blocks
    } catch (error) {
      console.error('Extract text blocks error:', error)
      this.setPageState(pageNum, {
        isLoading: false,
        blocks: [],
        edits: [],
        error: error instanceof Error ? error.message : 'Failed to extract text',
      })
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
    // Use pdfBounds (unscaled) for MuPDF operations, bounds (scaled) for display
    const scale = block.bounds.width > 0 ? block.bounds.width / block.pdfBounds.width : 1

    const pdfBoundsForEdit = this.calculateNewBounds(block.pdfBounds, newText, {
      ...newStyle,
      // Use original PDF font size (unscaled)
      fontSize: block.style.fontSize / scale,
    })

    const edit: TextEdit = {
      id: `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pageNum: block.pageNum,
      originalText: block.text,
      newText,
      originalBounds: block.bounds,
      newBounds: this.calculateNewBounds(block.bounds, newText, newStyle),
      style: newStyle,
      timestamp: Date.now(),
    }

    // Add to pending edits for preview
    this.setState({
      pendingEdits: [...this.state.pendingEdits, edit],
      editingBlockId: null,
    })

    // Add to history
    this.addToHistory(edit)

    try {
      // Apply to MuPDF document using PDF coordinates (unscaled)
      const pdfFontSize = newStyle.fontSize / scale

      await mupdfService.applyEdit({
        pageNum: block.pageNum - 1, // Convert to 0-indexed
        originalBounds: block.pdfBounds, // Use original PDF coordinates
        newBounds: pdfBoundsForEdit,
        newText: edit.newText,
        style: {
          fontFamily: edit.style.fontFamily,
          fontSize: pdfFontSize, // Unscaled font size
          color: edit.style.color,
        },
      })

      // Update page state
      const pageState = this.state.pageStates.get(block.pageNum)
      if (pageState) {
        this.setPageState(block.pageNum, {
          ...pageState,
          edits: [...pageState.edits, edit],
        })
      }
    } catch (error) {
      // Remove from pending edits on failure
      this.setState({
        pendingEdits: this.state.pendingEdits.filter((e) => e.id !== edit.id),
      })
      throw error
    }
  }

  /**
   * Save the edited document
   */
  async saveDocument(): Promise<Blob> {
    const bytes = await mupdfService.saveDocument()
    return new Blob([bytes], { type: 'application/pdf' })
  }

  /**
   * Undo last edit
   */
  undo(): void {
    if (this.state.historyIndex < 0) return

    // Note: True undo would require reloading the document and re-applying all edits except the last
    // For now, we just track the state
    this.setState({ historyIndex: this.state.historyIndex - 1 })
  }

  /**
   * Redo last undone edit
   */
  redo(): void {
    if (this.state.historyIndex >= this.state.history.length - 1) return

    this.setState({ historyIndex: this.state.historyIndex + 1 })
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.state.historyIndex >= 0
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

  private addToHistory(edit: TextEdit): void {
    // Truncate history if we're not at the end
    const history = this.state.history.slice(0, this.state.historyIndex + 1)

    // Add new state
    history.push([edit])

    // Limit history size
    if (history.length > MAX_HISTORY) {
      history.shift()
    }

    this.setState({
      history,
      historyIndex: history.length - 1,
    })
  }

  /**
   * Convert MuPDF structured text to our TextBlock format
   */
  private convertStructuredText(
    structured: MuPDFStructuredText,
    pageNum: number,
    scale: number
  ): TextBlock[] {
    const blocks: TextBlock[] = []

    structured.blocks.forEach((block: MuPDFBlock, blockIndex: number) => {
      if (block.type !== 'text' || !block.lines) return

      const textBlock = this.convertBlock(block, pageNum, blockIndex, scale)
      if (textBlock.text.trim()) {
        blocks.push(textBlock)
      }
    })

    return blocks
  }

  private convertBlock(
    block: MuPDFBlock,
    pageNum: number,
    blockIndex: number,
    scale: number
  ): TextBlock {
    const lines = block.lines || []

    // Collect all text and find dominant style
    let text = ''
    let dominantFont = 'Helvetica'
    let dominantSize = 12
    let dominantColor = '#000000'
    let maxSpanLength = 0

    lines.forEach((line: MuPDFLine) => {
      line.spans.forEach((span: MuPDFSpan) => {
        text += span.text
        if (span.text.length > maxSpanLength) {
          maxSpanLength = span.text.length
          dominantFont = span.font
          dominantSize = span.size
          dominantColor = this.packedColorToHex(span.color)
        }
      })
      text += '\n'
    })

    // Remove trailing newline
    text = text.trimEnd()

    // Convert bounds - scaled for display
    const bounds = this.bboxToBounds(block.bbox, scale)
    // Original PDF bounds - unscaled for MuPDF operations
    const pdfBounds = this.bboxToBounds(block.bbox, 1)

    return {
      id: `block-${pageNum}-${blockIndex}`,
      pageNum,
      bounds,
      pdfBounds,
      text,
      lines: lines.map((line, lineIndex) => this.convertLine(line, lineIndex, scale)),
      style: {
        fontFamily: this.cleanFontName(dominantFont),
        fontSize: dominantSize * scale,
        fontWeight: dominantFont.toLowerCase().includes('bold') ? 'bold' : 'normal',
        fontStyle: dominantFont.toLowerCase().includes('italic') ? 'italic' : 'normal',
        color: dominantColor,
        textAlign: 'left',
      },
    }
  }

  private convertLine(line: MuPDFLine, lineIndex: number, scale: number) {
    return {
      spans: line.spans.map((span, spanIndex) => ({
        text: span.text,
        bounds: this.bboxToBounds(span.bbox, scale),
        style: {
          fontFamily: this.cleanFontName(span.font),
          fontSize: span.size * scale,
          fontWeight: span.font.toLowerCase().includes('bold') ? 'bold' : 'normal' as 'bold' | 'normal',
          fontStyle: span.font.toLowerCase().includes('italic') ? 'italic' : 'normal' as 'italic' | 'normal',
          color: this.packedColorToHex(span.color),
          textAlign: 'left' as const,
        },
      })),
      bounds: this.bboxToBounds(line.bbox, scale),
      text: line.spans.map((s) => s.text).join(''),
    }
  }

  /**
   * Convert MuPDF bbox [x0, y0, x1, y1] to our bounds format
   * Note: MuPDF uses top-left origin, same as browser
   */
  private bboxToBounds(bbox: [number, number, number, number], scale: number): TextBounds {
    return {
      x: bbox[0] * scale,
      y: bbox[1] * scale,
      width: (bbox[2] - bbox[0]) * scale,
      height: (bbox[3] - bbox[1]) * scale,
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
    newText: string,
    style: TextStyle
  ): TextBounds {
    // For simplicity, keep the same position but adjust height based on line count
    const lineCount = newText.split('\n').length
    const lineHeight = style.fontSize * 1.2
    const estimatedHeight = Math.max(lineCount * lineHeight, originalBounds.height)

    return {
      x: originalBounds.x,
      y: originalBounds.y,
      width: originalBounds.width,
      height: estimatedHeight,
    }
  }
}

export const textEditService = TextEditService.getInstance()
