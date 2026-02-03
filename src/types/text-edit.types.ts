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
  text: string
  lines: TextLine[]
  style: TextStyle
}

/** A text edit operation */
export interface TextEdit {
  id: string
  pageNum: number
  originalText: string
  newText: string
  originalBounds: TextBounds
  newBounds: TextBounds
  style: TextStyle
  timestamp: number
}

/** Text edit state for a page */
export interface PageTextState {
  pageNum: number
  blocks: TextBlock[]
  edits: TextEdit[]
  isLoading: boolean
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
  disableTextEdit: () => Promise<void>
  extractTextBlocks: (pageNum: number, scale?: number) => Promise<TextBlock[]>
  selectBlock: (blockId: string | null) => void
  startEditing: (blockId: string) => void
  cancelEditing: () => void
  applyEdit: (newText: string, newStyle: TextStyle) => Promise<void>
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}
