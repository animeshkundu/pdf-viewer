/**
 * MuPDF.js Web Worker
 *
 * Handles PDF text editing operations in a background thread to avoid blocking the main UI.
 * Uses MuPDF.js for:
 * - Text extraction with positions
 * - Redaction (true text removal)
 * - FreeText annotation (text insertion)
 */

import type {
  MuPDFWorkerRequest,
  MuPDFWorkerResponse,
  MuPDFEditOperation,
  MuPDFStructuredText,
  MuPDFDocumentInfo,
} from '@/types/mupdf.types'

// MuPDF.js module (lazy-loaded)
let mupdf: typeof import('mupdf') | null = null

// Current document instance
let currentDocument: import('mupdf').PDFDocument | null = null

/**
 * Initialize MuPDF.js module
 */
async function initialize(): Promise<void> {
  if (mupdf) return

  postProgress('initializing', 10, 'Loading MuPDF.js module...')

  try {
    mupdf = await import('mupdf')
    postProgress('initializing', 100, 'MuPDF.js loaded')
  } catch (error) {
    throw new Error(`Failed to load MuPDF.js: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Load a PDF document
 */
async function loadDocument(bytes: ArrayBuffer): Promise<MuPDFDocumentInfo> {
  await initialize()
  if (!mupdf) throw new Error('MuPDF not initialized')

  postProgress('loading', 20, 'Loading PDF document...')

  // Clean up previous document if any
  if (currentDocument) {
    currentDocument.destroy()
    currentDocument = null
  }

  try {
    // Open document using static method
    const doc = mupdf.Document.openDocument(bytes, 'application/pdf')

    // Check if it's a PDF and get the PDF-specific document
    const pdfDoc = doc.asPDF()
    if (!pdfDoc) {
      throw new Error('Document is not a valid PDF')
    }
    currentDocument = pdfDoc

    const pageCount = currentDocument.countPages()
    const title = currentDocument.getMetaData(mupdf.Document.META_INFO_TITLE) || undefined
    const author = currentDocument.getMetaData(mupdf.Document.META_INFO_AUTHOR) || undefined

    postProgress('loading', 100, 'Document loaded')

    return { pageCount, title, author }
  } catch (error) {
    console.error('MuPDF loadDocument error:', error)
    throw new Error(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract structured text from a page
 */
async function extractText(pageNum: number): Promise<MuPDFStructuredText> {
  if (!currentDocument) throw new Error('No document loaded')

  postProgress('extracting', 50, `Extracting text from page ${pageNum + 1}...`)

  try {
    const page = currentDocument.loadPage(pageNum)
    const structuredText = page.toStructuredText('preserve-whitespace')
    const jsonStr = structuredText.asJSON()

    // Clean up
    structuredText.destroy()
    page.destroy()

    postProgress('extracting', 100, 'Text extracted')

    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('MuPDF extractText error:', error)
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Apply a text edit operation (redaction + insertion)
 */
async function applyEdit(edit: MuPDFEditOperation): Promise<void> {
  if (!currentDocument || !mupdf) throw new Error('No document loaded')

  postProgress('extracting', 30, 'Applying text edit...')

  try {
    const page = currentDocument.loadPage(edit.pageNum)

    // Step 1: Create redaction annotation over original text
    const redact = page.createAnnotation('Redact')
    const redactRect: [number, number, number, number] = [
      edit.originalBounds.x,
      edit.originalBounds.y,
      edit.originalBounds.x + edit.originalBounds.width,
      edit.originalBounds.y + edit.originalBounds.height,
    ]
    redact.setRect(redactRect)

    postProgress('extracting', 50, 'Applying redaction...')

    // Step 2: Apply redaction (removes content)
    // Use static constants from the PDFPage class with fallbacks
    const REDACT_IMAGE_REMOVE = mupdf.PDFPage.REDACT_IMAGE_REMOVE ?? 1
    const REDACT_LINE_ART_REMOVE_IF_COVERED = mupdf.PDFPage.REDACT_LINE_ART_REMOVE_IF_COVERED ?? 1
    const REDACT_TEXT_REMOVE = mupdf.PDFPage.REDACT_TEXT_REMOVE ?? 0

    page.applyRedactions(
      false, // black_boxes - false means white
      REDACT_IMAGE_REMOVE,
      REDACT_LINE_ART_REMOVE_IF_COVERED,
      REDACT_TEXT_REMOVE
    )

    postProgress('extracting', 70, 'Adding new text...')

    // Step 3: Create FreeText annotation with new text
    if (edit.newText.trim()) {
      const freeText = page.createAnnotation('FreeText')

      // Set position and size
      const freeTextRect: [number, number, number, number] = [
        edit.newBounds.x,
        edit.newBounds.y,
        edit.newBounds.x + edit.newBounds.width,
        edit.newBounds.y + edit.newBounds.height,
      ]
      freeText.setRect(freeTextRect)

      // Set text content
      freeText.setContents(edit.newText)

      // Parse color (expecting hex like #000000)
      const color = parseColor(edit.style.color)

      // Set appearance (font, size, color)
      const fontName = edit.style.fontFamily || 'Helvetica'
      const fontSize = edit.style.fontSize || 12
      freeText.setDefaultAppearance(fontName, fontSize, color)

      // Make annotation print and not editable
      const IS_PRINT = mupdf.PDFAnnotation.IS_PRINT ?? 4
      freeText.setFlags(IS_PRINT)

      // Remove border
      freeText.setBorderWidth(0)

      // Update the annotation to apply changes
      freeText.update()
    }

    // Clean up
    page.destroy()

    postProgress('extracting', 100, 'Text edit applied')
  } catch (error) {
    console.error('MuPDF applyEdit error:', error)
    throw new Error(`Failed to apply edit: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Save the document with all edits
 */
async function saveDocument(): Promise<Uint8Array> {
  if (!currentDocument) throw new Error('No document loaded')

  postProgress('extracting', 80, 'Saving document...')

  try {
    const buffer = currentDocument.saveToBuffer('incremental')
    const bytes = buffer.asUint8Array()

    // Make a copy since the buffer might be cleaned up
    const result = new Uint8Array(bytes.length)
    result.set(bytes)

    buffer.destroy()

    postProgress('extracting', 100, 'Document saved')

    return result
  } catch (error) {
    throw new Error(`Failed to save document: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Clean up resources
 */
async function cleanup(): Promise<void> {
  if (currentDocument) {
    currentDocument.destroy()
    currentDocument = null
  }
}

/**
 * Parse hex color to MuPDF color array
 */
function parseColor(hex: string): [number, number, number] {
  // Remove # if present
  const cleanHex = hex.replace('#', '')

  // Parse RGB values (0-1 range)
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  return [r, g, b]
}

/**
 * Post progress update to main thread
 */
function postProgress(stage: string, percent: number, message: string): void {
  self.postMessage({
    id: -1, // Progress messages don't have a request ID
    progress: { stage, percent, message },
  } as MuPDFWorkerResponse)
}

/**
 * Handle messages from main thread
 */
self.onmessage = async (e: MessageEvent<MuPDFWorkerRequest>) => {
  const { id, type, payload } = e.data

  try {
    let result: unknown

    switch (type) {
      case 'initialize':
        await initialize()
        result = { success: true }
        break

      case 'loadDocument':
        result = await loadDocument((payload as { bytes: ArrayBuffer }).bytes)
        break

      case 'extractText':
        result = await extractText((payload as { pageNum: number }).pageNum)
        break

      case 'applyEdit':
        await applyEdit(payload as MuPDFEditOperation)
        result = { success: true }
        break

      case 'saveDocument':
        const bytes = await saveDocument()
        // Transfer the buffer for better performance
        self.postMessage(
          { id, result: bytes } as MuPDFWorkerResponse,
          { transfer: [bytes.buffer] }
        )
        return

      case 'cleanup':
        await cleanup()
        result = { success: true }
        break

      default:
        throw new Error(`Unknown message type: ${type}`)
    }

    self.postMessage({ id, result } as MuPDFWorkerResponse)
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
    } as MuPDFWorkerResponse)
  }
}

// Export for TypeScript module resolution
export {}
