import type { MuPDFEditOperation } from './mupdf.types'

/**
 * Text editing types for PDF text manipulation
 */

/** Bounding box for text elements */
export interface TextBounds {
  x: number
  y: number
  width: number
  height: number
}

/** Style information for text */
export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  color: string
  textAlign: 'left' | 'center' | 'right'
}

/** A single text span (continuous text with same formatting) */
export interface TextSpan {
  text: string
  bounds: TextBounds
  style: TextStyle
}

/** A line of text (multiple spans) */
export interface TextLine {
  spans: TextSpan[]
  bounds: TextBounds
  text: string
}

/** A text block (paragraph or text region) */
export interface TextBlock {
  id: string
  pageNum: number
  bounds: TextBounds
  /** Original PDF coordinates (unscaled) for MuPDF operations */
  pdfBounds: TextBounds
  /** First glyph origin and writing direction in MuPDF page coordinates */
  pdfOrigin: [number, number]
  direction: [number, number]
  text: string
  lines: TextLine[]
  style: TextStyle
  /** Original unscaled style used for PDF content generation */
  pdfStyle: TextStyle
  /** Viewport used to map edited PDF bounds back onto the rendered page */
  viewport?: TextPageViewport
}

/** Display viewport used to map MuPDF page coordinates onto the rendered page */
export interface TextPageViewport {
  scale: number
  rotation: number
  pageWidth: number
  pageHeight: number
}

/** A text edit operation */
export interface TextEdit {
  id: string
  blockId: string
  pageNum: number
  originalText: string
  newText: string
  originalBounds: TextBounds
  newBounds: TextBounds
  style: TextStyle
  operation: MuPDFEditOperation
  timestamp: number
}

/** Text edit state for a page */
export interface PageTextState {
  pageNum: number
  blocks: TextBlock[]
  edits: TextEdit[]
  isLoading: boolean
  displayKey?: string
  error?: string
}

/** Overall text editing state */
export interface TextEditState {
  isEnabled: boolean
  isLoading: boolean
  loadingProgress: number
  loadingMessage: string
  selectedBlockId: string | null
  editingBlockId: string | null
  pageStates: Map<number, PageTextState>
  pendingEdits: TextEdit[]
  history: TextEdit[][]
  historyIndex: number
}

/** Progress callback for loading operations */
export interface TextEditProgress {
  stage: 'initializing' | 'loading' | 'extracting' | 'ready'
  progress: number
  message: string
}

/** Context type for text editing */
export interface TextEditContextType {
  state: TextEditState
  enableTextEdit: () => Promise<void>
  disableTextEdit: () => void
  extractTextBlocks: (
    pageNum: number,
    scale?: number,
    rotation?: number,
    pageWidth?: number,
    pageHeight?: number
  ) => Promise<TextBlock[]>
  selectBlock: (blockId: string | null) => void
  startEditing: (blockId: string) => void
  cancelEditing: () => void
  applyEdit: (newText: string, newStyle: TextStyle) => Promise<void>
  getDocumentBytes: () => Promise<ArrayBuffer>
  undo: () => Promise<void>
  redo: () => Promise<void>
  canUndo: boolean
  canRedo: boolean
}
