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
  text: string
}

/** A line of text (horizontal or vertical) */
export interface MuPDFLine {
  bbox: MuPDFBBox
  wmode: 0 | 1 // 0 = horizontal, 1 = vertical
  dir: [number, number] // Direction vector
  spans: MuPDFSpan[]
}

/** A text or image block */
export interface MuPDFBlock {
  type: 'text' | 'image'
  bbox: MuPDFBBox
  lines?: MuPDFLine[] // Only for text blocks
}

/** Structured text output from toStructuredText().asJSON() */
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
    color: string
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
