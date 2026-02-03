/**
 * Types for OCR (Optical Character Recognition) operations
 */

/**
 * Bounding box for OCR text elements
 */
export interface OCRBoundingBox {
  x0: number
  y0: number
  x1: number
  y1: number
}

/**
 * A single line of recognized text with its position
 */
export interface OCRLine {
  text: string
  bbox: OCRBoundingBox
  confidence: number
}

/**
 * A single word of recognized text with its position
 */
export interface OCRWord {
  text: string
  bbox: OCRBoundingBox
  confidence: number
}

/**
 * Result from recognizing text in a single image/page
 */
export interface OCRResult {
  text: string
  lines: OCRLine[]
  words: OCRWord[]
  confidence: number
}

/**
 * Result from extracting text from a single PDF page
 */
export interface OCRPageResult {
  pageNum: number
  text: string
  confidence: number
  lines: OCRLine[]
}

/**
 * Progress information during OCR operations
 */
export interface OCRProgress {
  stage: 'initializing' | 'loading' | 'processing' | 'saving' | 'complete'
  progress: number // 0-100 overall progress
  message: string
  currentPage?: number
  totalPages?: number
  pageProgress?: number // 0-100 progress within current page
}

/**
 * Supported OCR languages
 */
export type OCRLanguage =
  | 'eng'  // English
  | 'spa'  // Spanish
  | 'fra'  // French
  | 'deu'  // German
  | 'ita'  // Italian
  | 'por'  // Portuguese
  | 'nld'  // Dutch
  | 'pol'  // Polish
  | 'rus'  // Russian
  | 'jpn'  // Japanese
  | 'chi_sim'  // Chinese Simplified
  | 'chi_tra'  // Chinese Traditional
  | 'kor'  // Korean
  | 'ara'  // Arabic

/**
 * Human-readable labels for OCR languages
 */
export const OCR_LANGUAGE_LABELS: Record<OCRLanguage, string> = {
  eng: 'English',
  spa: 'Spanish',
  fra: 'French',
  deu: 'German',
  ita: 'Italian',
  por: 'Portuguese',
  nld: 'Dutch',
  pol: 'Polish',
  rus: 'Russian',
  jpn: 'Japanese',
  chi_sim: 'Chinese (Simplified)',
  chi_tra: 'Chinese (Traditional)',
  kor: 'Korean',
  ara: 'Arabic',
}

/**
 * OCR operation mode
 */
export type OCRMode = 'makeSearchable' | 'extractText'

/**
 * Options for OCR operations
 */
export interface OCROptions {
  language: OCRLanguage
  mode: OCRMode
  pages?: number[] // Specific pages to process, undefined means all pages
}

/**
 * Result from making a PDF searchable
 */
export interface SearchablePDFResult {
  blob: Blob
  pageCount: number
  processedPages: number
  averageConfidence: number
}

/**
 * Result from extracting text from a PDF
 */
export interface ExtractedTextResult {
  pages: OCRPageResult[]
  totalText: string
  averageConfidence: number
}
