import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument, rgb } from 'pdf-lib'
import type {
  OCRResult,
  OCRPageResult,
  OCRProgress,
  OCRLanguage,
  SearchablePDFResult,
  ExtractedTextResult,
  OCRLine,
  OCRWord,
} from '@/types/ocr.types'

// Ensure PDF.js worker is configured
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

// Type for Tesseract.js worker (lazy loaded)
type TesseractWorker = Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>>

export class OCRService {
  private static instance: OCRService
  private worker: TesseractWorker | null = null
  private isInitialized = false
  private currentLanguage: OCRLanguage | null = null
  private progressCallback?: (progress: OCRProgress) => void
  private isCancelled = false

  private constructor() {}

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService()
    }
    return OCRService.instance
  }

  setProgressCallback(callback: (progress: OCRProgress) => void): void {
    this.progressCallback = callback
  }

  private updateProgress(
    stage: OCRProgress['stage'],
    progress: number,
    message: string,
    currentPage?: number,
    totalPages?: number,
    pageProgress?: number
  ): void {
    if (this.progressCallback) {
      this.progressCallback({
        stage,
        progress,
        message,
        currentPage,
        totalPages,
        pageProgress,
      })
    }
  }

  /**
   * Lazy initialization - only loads Tesseract.js when first needed
   * Tesseract.js is ~12MB so we must lazy-load it
   */
  async initialize(language: OCRLanguage = 'eng'): Promise<void> {
    // If already initialized with the same language, skip
    if (this.isInitialized && this.currentLanguage === language) {
      return
    }

    // If initialized with a different language, terminate and reinitialize
    if (this.isInitialized && this.currentLanguage !== language) {
      await this.terminate()
    }

    this.updateProgress('initializing', 0, 'Loading OCR engine...')

    try {
      // Lazy-load Tesseract.js
      const Tesseract = await import('tesseract.js')

      this.updateProgress('initializing', 20, `Initializing ${language} language model...`)

      // Create worker with progress logging
      this.worker = await Tesseract.createWorker(language, undefined, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            this.updateProgress(
              'processing',
              20 + m.progress * 60,
              'Recognizing text...',
              undefined,
              undefined,
              Math.round(m.progress * 100)
            )
          }
        },
      })

      this.isInitialized = true
      this.currentLanguage = language
      this.updateProgress('initializing', 100, 'OCR engine ready')
    } catch (error) {
      this.isInitialized = false
      this.currentLanguage = null
      throw new Error(`Failed to initialize OCR engine: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Recognize text from an image (ImageData or HTMLCanvasElement)
   */
  async recognizeText(
    imageData: ImageData | HTMLCanvasElement
  ): Promise<OCRResult> {
    if (!this.worker || !this.isInitialized) {
      throw new Error('OCR engine not initialized. Call initialize() first.')
    }

    const result = await this.worker.recognize(imageData)
    const { data } = result

    // Extract lines and words from the nested block structure
    // Page -> Blocks -> Paragraphs -> Lines -> Words
    const lines: OCRLine[] = []
    const words: OCRWord[] = []

    if (data.blocks) {
      for (const block of data.blocks) {
        for (const paragraph of block.paragraphs) {
          for (const line of paragraph.lines) {
            lines.push({
              text: line.text,
              bbox: {
                x0: line.bbox.x0,
                y0: line.bbox.y0,
                x1: line.bbox.x1,
                y1: line.bbox.y1,
              },
              confidence: line.confidence,
            })

            for (const word of line.words) {
              words.push({
                text: word.text,
                bbox: {
                  x0: word.bbox.x0,
                  y0: word.bbox.y0,
                  x1: word.bbox.x1,
                  y1: word.bbox.y1,
                },
                confidence: word.confidence,
              })
            }
          }
        }
      }
    }

    return {
      text: data.text,
      lines,
      words,
      confidence: data.confidence,
    }
  }

  /**
   * Make a scanned PDF searchable by adding an invisible text layer
   */
  async makeSearchable(
    pdfBytes: ArrayBuffer,
    language: OCRLanguage,
    onProgress?: (progress: number, page: number, total: number) => void
  ): Promise<SearchablePDFResult> {
    this.isCancelled = false

    // Initialize OCR engine
    await this.initialize(language)

    this.updateProgress('loading', 0, 'Loading PDF...')

    // Copy the buffer to avoid detached ArrayBuffer issues
    // pdf.js may transfer the buffer, making it unavailable for pdf-lib
    const pdfBytesForPdfJs = pdfBytes.slice(0)
    const pdfBytesForPdfLib = pdfBytes.slice(0)

    // Load source PDF with pdf.js for rendering
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytesForPdfJs })
    const pdfDoc = await loadingTask.promise
    const pageCount = pdfDoc.numPages

    // Load source PDF with pdf-lib for modification
    const pdfLibDoc = await PDFDocument.load(pdfBytesForPdfLib)

    let totalConfidence = 0
    let processedPages = 0

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      if (this.isCancelled) {
        throw new Error('OCR operation cancelled')
      }

      const overallProgress = Math.round(((pageNum - 1) / pageCount) * 100)
      this.updateProgress(
        'processing',
        overallProgress,
        `Processing page ${pageNum} of ${pageCount}...`,
        pageNum,
        pageCount,
        0
      )

      if (onProgress) {
        onProgress(overallProgress, pageNum, pageCount)
      }

      // Render page to canvas
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 2.0 }) // Higher scale for better OCR

      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height

      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Could not get canvas context')
      }

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      } as any).promise

      // Run OCR on the canvas
      const ocrResult = await this.recognizeText(canvas)
      totalConfidence += ocrResult.confidence
      processedPages++

      // Add invisible text layer to the page
      const pdfPage = pdfLibDoc.getPage(pageNum - 1)
      const { width: pageWidth, height: pageHeight } = pdfPage.getSize()

      // Calculate scale factors
      const scaleX = pageWidth / viewport.width
      const scaleY = pageHeight / viewport.height

      // Add each word as invisible text
      for (const word of ocrResult.words) {
        if (!word.text.trim()) continue

        // Convert coordinates from canvas space to PDF space
        const x = word.bbox.x0 * scaleX
        // PDF coordinates are from bottom-left, canvas from top-left
        const y = pageHeight - (word.bbox.y1 * scaleY)

        // Calculate font size based on word height
        const wordHeight = (word.bbox.y1 - word.bbox.y0) * scaleY
        const fontSize = Math.max(1, wordHeight * 0.8)

        try {
          pdfPage.drawText(word.text, {
            x,
            y,
            size: fontSize,
            color: rgb(0, 0, 0),
            opacity: 0, // Invisible text
          })
        } catch {
          // Skip words that can't be rendered (e.g., unsupported characters)
        }
      }
    }

    this.updateProgress('saving', 95, 'Generating searchable PDF...')

    const resultPdfBytes = await pdfLibDoc.save()
    const blob = new Blob([resultPdfBytes], { type: 'application/pdf' })

    this.updateProgress('complete', 100, 'OCR complete!')

    return {
      blob,
      pageCount,
      processedPages,
      averageConfidence: processedPages > 0 ? totalConfidence / processedPages : 0,
    }
  }

  /**
   * Extract text from PDF pages using OCR
   */
  async extractTextFromPDF(
    pdfBytes: ArrayBuffer,
    language: OCRLanguage,
    pages?: number[],
    onProgress?: (progress: number, page: number, total: number) => void
  ): Promise<ExtractedTextResult> {
    this.isCancelled = false

    // Initialize OCR engine
    await this.initialize(language)

    this.updateProgress('loading', 0, 'Loading PDF...')

    // Copy the buffer to avoid detached ArrayBuffer issues
    const pdfBytesCopy = pdfBytes.slice(0)

    // Load PDF with pdf.js for rendering
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytesCopy })
    const pdfDoc = await loadingTask.promise
    const pageCount = pdfDoc.numPages

    // Determine which pages to process
    const pagesToProcess = pages || Array.from({ length: pageCount }, (_, i) => i + 1)
    const totalPages = pagesToProcess.length

    const results: OCRPageResult[] = []
    let totalConfidence = 0

    for (let i = 0; i < pagesToProcess.length; i++) {
      if (this.isCancelled) {
        throw new Error('OCR operation cancelled')
      }

      const pageNum = pagesToProcess[i]
      const overallProgress = Math.round((i / totalPages) * 100)

      this.updateProgress(
        'processing',
        overallProgress,
        `Processing page ${pageNum} of ${pageCount}...`,
        pageNum,
        pageCount,
        0
      )

      if (onProgress) {
        onProgress(overallProgress, pageNum, totalPages)
      }

      // Render page to canvas
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 2.0 })

      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height

      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Could not get canvas context')
      }

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      } as any).promise

      // Run OCR on the canvas
      const ocrResult = await this.recognizeText(canvas)
      totalConfidence += ocrResult.confidence

      results.push({
        pageNum,
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        lines: ocrResult.lines,
      })
    }

    this.updateProgress('complete', 100, 'Text extraction complete!')

    const totalText = results.map((r) => r.text).join('\n\n')

    return {
      pages: results,
      totalText,
      averageConfidence: results.length > 0 ? totalConfidence / results.length : 0,
    }
  }

  /**
   * Cancel ongoing OCR operation
   */
  cancel(): void {
    this.isCancelled = true
  }

  /**
   * Check if OCR engine is initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * Get current language
   */
  getLanguage(): OCRLanguage | null {
    return this.currentLanguage
  }

  /**
   * Terminate the OCR worker to free up resources
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }
    this.isInitialized = false
    this.currentLanguage = null
    this.isCancelled = false
  }
}

export const ocrService = OCRService.getInstance()
