/**
 * MuPDF.js type definitions for structured text extraction
 */

/** Bounding box from MuPDF (x0, y0, x1, y1 format) */
export type MuPDFBBox = [number, number, number, number]

/** A span of text with consistent formatting */
export interface MuPDFSpan {
  font: string
  size: number
  color: number // Packed RGB value
  bbox: MuPDFBBox
  origin: [number, number]
  text: string
}

/** A line of text (horizontal or vertical) */
export interface MuPDFLine {
  bbox: MuPDFBBox
  wmode: 0 | 1 // 0 = horizontal, 1 = vertical
  dir: [number, number] // Direction vector
  spans: MuPDFSpan[]
}

/** A text block */
export interface MuPDFTextBlock {
  type: 'text'
  bbox: MuPDFBBox
  lines: MuPDFLine[]
}

/** A non-text block retained for compatibility with structured text output */
export interface MuPDFImageBlock {
  type: 'image'
  bbox: MuPDFBBox
}

export type MuPDFBlock = MuPDFTextBlock | MuPDFImageBlock

/** Structured text output assembled from MuPDF's text walker */
export interface MuPDFStructuredText {
  blocks: MuPDFBlock[]
}

/** Worker message types */
export type MuPDFWorkerMessageType =
  | 'initialize'
  | 'loadDocument'
  | 'extractText'
  | 'applyEdit'
  | 'saveDocument'
  | 'cleanup'

/** Message sent to worker */
export interface MuPDFWorkerRequest {
  id: number
  type: MuPDFWorkerMessageType
  payload?: unknown
}

/** Message received from worker */
export interface MuPDFWorkerResponse {
  id: number
  result?: unknown
  error?: string
  progress?: {
    stage: string
    percent: number
    message: string
  }
}

/** Document info returned after loading */
export interface MuPDFDocumentInfo {
  pageCount: number
  title?: string
  author?: string
}

/** Edit operation sent to worker */
export interface MuPDFEditOperation {
  pageNum: number
  origin: [number, number]
  direction: [number, number]
  originalBounds: {
    x: number
    y: number
    width: number
    height: number
  }
  newBounds: {
    x: number
    y: number
    width: number
    height: number
  }
  newText: string
  style: {
    fontFamily: string
    fontSize: number
    fontWeight: 'normal' | 'bold'
    fontStyle: 'normal' | 'italic'
    color: string
    textAlign: 'left' | 'center' | 'right'
  }
}

/** Service interface for MuPDF operations */
export interface MuPDFServiceInterface {
  initialize(): Promise<void>
  loadDocument(bytes: ArrayBuffer): Promise<MuPDFDocumentInfo>
  extractText(pageNum: number): Promise<MuPDFStructuredText>
  applyEdit(edit: MuPDFEditOperation): Promise<void>
  saveDocument(): Promise<Uint8Array>
  cleanup(): Promise<void>
  isInitialized(): boolean
  onProgress(callback: (progress: { stage: string; percent: number; message: string }) => void): void
}
