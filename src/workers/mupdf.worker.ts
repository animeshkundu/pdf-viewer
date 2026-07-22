/**
 * MuPDF.js Web Worker
 *
 * Handles PDF text editing operations in a background thread to avoid blocking the main UI.
 * Uses MuPDF.js for:
 * - Text extraction with positions
 * - Redaction (true text removal)
 * - FreeText appearance baking (permanent text insertion)
 */

import type {
  MuPDFWorkerRequest,
  MuPDFWorkerResponse,
  MuPDFEditOperation,
  MuPDFStructuredText,
  MuPDFDocumentInfo,
  MuPDFLine,
  MuPDFSpan,
  MuPDFTextBlock,
} from '@/types/mupdf.types'

// MuPDF.js module (lazy-loaded)
let mupdf: typeof import('mupdf') | null = null

// Current document instance
let currentDocument: import('mupdf').PDFDocument | null = null
const TEXT_EDIT_AUTHOR = '__pdf_viewer_text_edit_replacement__'

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
      doc.destroy()
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
    const blocks: MuPDFStructuredText['blocks'] = []
    try {
      const structuredText = page.toStructuredText('preserve-whitespace')
      try {
        let currentBlock: MuPDFTextBlock | null = null
        let currentLine: MuPDFLine | null = null
        let currentSpan: MuPDFSpan | null = null
        let currentSpanKey = ''

        structuredText.walk({
          beginTextBlock(bbox) {
            currentBlock = {
              type: 'text',
              bbox: [bbox[0], bbox[1], bbox[2], bbox[3]],
              lines: [],
            }
            blocks.push(currentBlock)
          },
          beginLine(bbox, wmode, direction) {
            if (!currentBlock) return
            const line: MuPDFLine = {
              bbox: [bbox[0], bbox[1], bbox[2], bbox[3]],
              wmode: wmode === 1 ? 1 : 0,
              dir: [direction[0], direction[1]],
              spans: [],
            }
            currentBlock.lines.push(line)
            currentLine = line
            currentSpan = null
            currentSpanKey = ''
          },
          onChar(character, origin, font, size, quad, color) {
            if (!currentLine) return

            const fontName = font.getName()
            const packedColor = packColor(color)
            const spanKey = `${fontName}:${size}:${packedColor}`
            const charBounds: [number, number, number, number] = [
              Math.min(quad[0], quad[2], quad[4], quad[6]),
              Math.min(quad[1], quad[3], quad[5], quad[7]),
              Math.max(quad[0], quad[2], quad[4], quad[6]),
              Math.max(quad[1], quad[3], quad[5], quad[7]),
            ]

            if (!currentSpan || currentSpanKey !== spanKey) {
              currentSpan = {
                font: fontName,
                size,
                color: packedColor,
                bbox: charBounds,
                origin: [origin[0], origin[1]],
                text: character,
              }
              currentLine.spans.push(currentSpan)
              currentSpanKey = spanKey
              return
            }

            currentSpan.text += character
            currentSpan.bbox = [
              Math.min(currentSpan.bbox[0], charBounds[0]),
              Math.min(currentSpan.bbox[1], charBounds[1]),
              Math.max(currentSpan.bbox[2], charBounds[2]),
              Math.max(currentSpan.bbox[3], charBounds[3]),
            ]
          },
          endLine() {
            currentLine = null
            currentSpan = null
            currentSpanKey = ''
          },
          endTextBlock() {
            currentBlock = null
          },
        })
      } finally {
        structuredText.destroy()
      }
    } finally {
      page.destroy()
    }

    postProgress('extracting', 100, 'Text extracted')

    return { blocks }
  } catch (error) {
    console.error('MuPDF extractText error:', error)
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function packColor(color: import('mupdf').Color): number {
  const channel = (value: number) => Math.round(Math.max(0, Math.min(1, value)) * 255)
  let red: number
  let green: number
  let blue: number

  if (color.length === 1) {
    red = green = blue = channel(color[0])
  } else if (color.length === 4) {
    red = channel((1 - color[0]) * (1 - color[3]))
    green = channel((1 - color[1]) * (1 - color[3]))
    blue = channel((1 - color[2]) * (1 - color[3]))
  } else {
    red = channel(color[0])
    green = channel(color[1])
    blue = channel(color[2])
  }

  return (red << 16) | (green << 8) | blue
}

/**
 * Apply a text edit operation (redaction + insertion)
 */
async function applyEdit(edit: MuPDFEditOperation): Promise<void> {
  if (!currentDocument || !mupdf) throw new Error('No document loaded')

  postProgress('extracting', 30, 'Applying text edit...')

  try {
    const fontName = resolveBase14Font(
      edit.style.fontFamily,
      edit.style.fontWeight,
      edit.style.fontStyle
    )
    if (edit.newText.trim()) {
      validateReplacementText(edit.newText, fontName)
    }
    const page = currentDocument.loadPage(edit.pageNum)

    try {
      // applyRedactions processes every Redact annotation on a page, so isolate
      // the edit operation from native pending redactions.
      const preservedRedactions = detachPageAnnotations(
        page,
        (annotation) => annotation.getType() === 'Redact'
      )
      try {
        // Step 1: Create redaction annotation over original text
        const redact = page.createAnnotation('Redact')
        try {
          const redactRect: [number, number, number, number] = [
            edit.originalBounds.x,
            edit.originalBounds.y,
            edit.originalBounds.x + edit.originalBounds.width,
            edit.originalBounds.y + edit.originalBounds.height,
          ]
          redact.setRect(redactRect)

          postProgress('extracting', 50, 'Applying redaction...')

          // Preserve overlapping images and vector art; this operation replaces text only.
          const REDACT_IMAGE_NONE = mupdf.PDFPage.REDACT_IMAGE_NONE ?? 0
          const REDACT_LINE_ART_NONE = mupdf.PDFPage.REDACT_LINE_ART_NONE ?? 0
          const REDACT_TEXT_REMOVE = mupdf.PDFPage.REDACT_TEXT_REMOVE ?? 0

          page.applyRedactions(
            false,
            REDACT_IMAGE_NONE,
            REDACT_LINE_ART_NONE,
            REDACT_TEXT_REMOVE
          )
        } finally {
          redact.destroy()
        }
      } finally {
        restoreAnnotationsOnPage(currentDocument, page, preservedRedactions)
      }

      postProgress('extracting', 70, 'Adding new text...')

      // Step 3: Create FreeText annotation with new text
      if (edit.newText.trim()) {
        const freeText = page.createAnnotation('FreeText')
        try {
          const pageRotation = getPageRotation(page)
          const textRotation = getDirectionRotation(edit.direction)
          const freeTextRect = getFreeTextRect(edit)
          freeText.setRect(freeTextRect)
          freeText.setContents(edit.newText)
          freeText.setAuthor(TEXT_EDIT_AUTHOR)

          const color = parseColor(edit.style.color)
          const fontSize = edit.style.fontSize || 12
          freeText.setDefaultAppearance(fontName, fontSize, color)
          freeText.setQuadding(
            edit.style.textAlign === 'center' ? 1 : edit.style.textAlign === 'right' ? 2 : 0
          )
          const annotationObject = freeText.getObject()
          annotationObject.put('Rotate', normalizeRotation(pageRotation - textRotation))
          annotationObject.destroy()
          freeText.setIntent('FreeTextTypeWriter')

          const IS_PRINT = mupdf.PDFAnnotation.IS_PRINT ?? 4
          freeText.setFlags(IS_PRINT)
          freeText.setBorderWidth(0)
          freeText.update()
        } finally {
          freeText.destroy()
        }
      }
    } finally {
      page.destroy()
    }

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
  if (!currentDocument || !mupdf) throw new Error('No document loaded')

  postProgress('extracting', 80, 'Saving document...')

  const snapshotBuffer = currentDocument.saveToBuffer('compress=yes')
  const outputDocument = mupdf.Document.openDocument(
    snapshotBuffer.asUint8Array(),
    'application/pdf'
  ).asPDF()
  if (!outputDocument) {
    snapshotBuffer.destroy()
    throw new Error('Failed to clone the working PDF document')
  }
  try {
    // Save from a clone so exporting does not alter the live editing document.
    // Temporarily detach native annotations so only text-edit replacements bake.
    const preservedAnnotations = detachNativeAnnotations(outputDocument)
    outputDocument.bake(true, false)
    restoreNativeAnnotations(outputDocument, preservedAnnotations)
    outputDocument.subsetFonts()
    const buffer = outputDocument.saveToBuffer(
      'garbage=4,compress=yes,compress-fonts=yes,compress-images=yes'
    )
    const bytes = buffer.asUint8Array()

    // Make a copy since the buffer might be cleaned up
    const result = new Uint8Array(bytes.length)
    result.set(bytes)

    buffer.destroy()

    postProgress('extracting', 100, 'Document saved')

    return result
  } catch (error) {
    throw new Error(`Failed to save document: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    outputDocument.destroy()
    snapshotBuffer.destroy()
  }
}

function detachNativeAnnotations(
  document: import('mupdf').PDFDocument
): import('mupdf').PDFObject[][] {
  const preservedAnnotations: import('mupdf').PDFObject[][] = []

  for (let pageNum = 0; pageNum < document.countPages(); pageNum += 1) {
    const page = document.loadPage(pageNum)
    const preservedOnPage: import('mupdf').PDFObject[] = []

    try {
      preservedOnPage.push(
        ...detachPageAnnotations(
          page,
          (annotation) => annotation.getAuthor() !== TEXT_EDIT_AUTHOR
        )
      )
    } finally {
      page.destroy()
    }
    preservedAnnotations.push(preservedOnPage)
  }

  return preservedAnnotations
}

function restoreNativeAnnotations(
  document: import('mupdf').PDFDocument,
  preservedAnnotations: import('mupdf').PDFObject[][]
): void {
  preservedAnnotations.forEach((annotations, pageNum) => {
    if (annotations.length === 0) return

    const page = document.loadPage(pageNum)
    try {
      restoreAnnotationsOnPage(document, page, annotations)
    } finally {
      page.destroy()
    }
  })
}

function detachPageAnnotations(
  page: import('mupdf').PDFPage,
  shouldDetach: (annotation: import('mupdf').PDFAnnotation) => boolean
): import('mupdf').PDFObject[] {
  const preserved: import('mupdf').PDFObject[] = []
  const annotations = [...page.getAnnotations()]

  for (const annotation of annotations) {
    if (shouldDetach(annotation)) {
      preserved.push(annotation.getObject())
      page.deleteAnnotation(annotation)
    }
    annotation.destroy()
  }
  page.update()
  return preserved
}

function restoreAnnotationsOnPage(
  document: import('mupdf').PDFDocument,
  page: import('mupdf').PDFPage,
  annotations: import('mupdf').PDFObject[]
): void {
  if (annotations.length === 0) return

  const pageObject = page.getObject()
  const annotationArray = document.newArray()
  const existingAnnotationReference = pageObject.get('Annots')
  if (!existingAnnotationReference.isNull()) {
    const existingAnnotations = existingAnnotationReference.resolve()
    if (existingAnnotations.isArray()) {
      existingAnnotations.forEach((annotation) => annotationArray.push(annotation))
    }
    existingAnnotations.destroy()
  }
  existingAnnotationReference.destroy()
  annotations.forEach((annotation) => annotationArray.push(annotation))
  pageObject.put('Annots', annotationArray)
  page.update()
  annotationArray.destroy()
  pageObject.destroy()
  annotations.forEach((annotation) => annotation.destroy())
}

function getFreeTextRect(edit: MuPDFEditOperation): [number, number, number, number] {
  const inset = edit.style.fontSize * 0.8
  const { x, y, width, height } = edit.newBounds
  const [dx, dy] = edit.direction

  if (Math.abs(dy) > Math.abs(dx)) {
    if (dy < 0) {
      const left = edit.origin[0] - inset
      return [left, y, left + width, edit.origin[1]]
    }
    const right = edit.origin[0] + inset
    return [right - width, edit.origin[1], right, y + height]
  }

  if (dx < 0) {
    const bottom = edit.origin[1] + inset
    return [x, bottom - height, edit.origin[0], bottom]
  }
  const top = edit.origin[1] - inset
  return [edit.origin[0], top, x + width, top + height]
}

function getPageRotation(page: import('mupdf').PDFPage): number {
  const pageObject = page.getObject()
  const rotationObject = pageObject.getInheritable('Rotate')
  const rotation = rotationObject.isNumber() ? rotationObject.asNumber() : 0
  rotationObject.destroy()
  pageObject.destroy()
  return normalizeRotation(rotation)
}

function getDirectionRotation(direction: [number, number]): number {
  return normalizeRotation(
    Math.round(Math.atan2(direction[1], direction[0]) * 180 / Math.PI / 90) * 90
  )
}

function normalizeRotation(rotation: number): number {
  return ((rotation % 360) + 360) % 360
}

function resolveBase14Font(
  fontFamily: string,
  fontWeight: 'normal' | 'bold',
  fontStyle: 'normal' | 'italic'
): string {
  const family = fontFamily.toLowerCase()
  const isBold = fontWeight === 'bold'
  const isItalic = fontStyle === 'italic'

  if (family.includes('courier') || family.includes('mono')) {
    if (isBold && isItalic) return 'Courier-BoldOblique'
    if (isBold) return 'Courier-Bold'
    if (isItalic) return 'Courier-Oblique'
    return 'Courier'
  }

  if (family.includes('times') || family.includes('serif')) {
    if (isBold && isItalic) return 'Times-BoldItalic'
    if (isBold) return 'Times-Bold'
    if (isItalic) return 'Times-Italic'
    return 'Times-Roman'
  }

  if (isBold && isItalic) return 'Helvetica-BoldOblique'
  if (isBold) return 'Helvetica-Bold'
  if (isItalic) return 'Helvetica-Oblique'
  return 'Helvetica'
}

function validateReplacementText(text: string, fontName: string): void {
  if (!mupdf) throw new Error('MuPDF not initialized')

  const font = new mupdf.Font(fontName)
  try {
    const unsupportedCharacter = Array.from(text).find(
      (character) => !/[\n\r\t]/.test(character) && font.encodeCharacter(character) === 0
    )
    if (unsupportedCharacter) {
      throw new Error(
        `The selected PDF font cannot encode the character "${unsupportedCharacter}"`
      )
    }
  } finally {
    font.destroy()
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

      case 'saveDocument': {
        const bytes = await saveDocument()
        // Transfer the buffer for better performance
        self.postMessage(
          { id, result: bytes } as MuPDFWorkerResponse,
          { transfer: [bytes.buffer] }
        )
        return
      }

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
