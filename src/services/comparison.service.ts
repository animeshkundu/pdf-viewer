import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import pixelmatch from 'pixelmatch'
import type {
  ComparisonOptions,
  ComparisonResult,
  ComparisonProgress,
} from '@/types/advanced-tools.types'

// Ensure worker is configured
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export class ComparisonService {
  private static instance: ComparisonService
  private progressCallback?: (progress: ComparisonProgress) => void

  private constructor() {}

  static getInstance(): ComparisonService {
    if (!ComparisonService.instance) {
      ComparisonService.instance = new ComparisonService()
    }
    return ComparisonService.instance
  }

  setProgressCallback(callback: (progress: ComparisonProgress) => void): void {
    this.progressCallback = callback
  }

  private updateProgress(
    stage: ComparisonProgress['stage'],
    progress: number,
    message: string
  ): void {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message })
    }
  }

  /**
   * Load a PDF document from ArrayBuffer
   */
  private async loadPDF(bytes: ArrayBuffer): Promise<PDFDocumentProxy> {
    const loadingTask = pdfjsLib.getDocument({ data: bytes })
    return await loadingTask.promise
  }

  /**
   * Render a PDF page to a canvas at the specified scale
   */
  private async renderPageToCanvas(
    pdf: PDFDocumentProxy,
    pageNum: number,
    scale: number
  ): Promise<HTMLCanvasElement> {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not get canvas context')
    }

    await page.render({
      canvasContext: context,
      viewport,
    } as any).promise

    return canvas
  }

  /**
   * Resize a canvas to match target dimensions
   */
  private resizeCanvas(
    sourceCanvas: HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number
  ): HTMLCanvasElement {
    const resizedCanvas = document.createElement('canvas')
    resizedCanvas.width = targetWidth
    resizedCanvas.height = targetHeight

    const ctx = resizedCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Draw the source canvas scaled to fit the target dimensions
    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight)

    return resizedCanvas
  }

  /**
   * Compare two PDF pages and return the difference
   */
  async comparePDFs(
    pdf1Bytes: ArrayBuffer,
    pdf2Bytes: ArrayBuffer,
    pageNum: number,
    options: ComparisonOptions = {}
  ): Promise<ComparisonResult> {
    const {
      threshold = 0.1,
      includeAntiAliasing = false,
      diffColor = [255, 0, 0],
      scale = 1.5,
    } = options

    this.updateProgress('loading', 0, 'Loading PDF documents...')

    // Load both PDFs
    const [pdf1, pdf2] = await Promise.all([
      this.loadPDF(pdf1Bytes),
      this.loadPDF(pdf2Bytes),
    ])

    // Validate page number
    if (pageNum < 1 || pageNum > pdf1.numPages) {
      throw new Error(`Invalid page number for first PDF: ${pageNum}. Document has ${pdf1.numPages} pages.`)
    }
    if (pageNum < 1 || pageNum > pdf2.numPages) {
      throw new Error(`Invalid page number for second PDF: ${pageNum}. Document has ${pdf2.numPages} pages.`)
    }

    this.updateProgress('rendering', 30, 'Rendering PDF pages...')

    // Render both pages to canvas
    const [canvas1, canvas2] = await Promise.all([
      this.renderPageToCanvas(pdf1, pageNum, scale),
      this.renderPageToCanvas(pdf2, pageNum, scale),
    ])

    // Determine the common size (use the larger dimensions)
    const width = Math.max(canvas1.width, canvas2.width)
    const height = Math.max(canvas1.height, canvas2.height)

    this.updateProgress('rendering', 50, 'Normalizing page sizes...')

    // Resize canvases to match if needed
    const normalizedCanvas1 =
      canvas1.width === width && canvas1.height === height
        ? canvas1
        : this.resizeCanvas(canvas1, width, height)

    const normalizedCanvas2 =
      canvas2.width === width && canvas2.height === height
        ? canvas2
        : this.resizeCanvas(canvas2, width, height)

    this.updateProgress('comparing', 70, 'Comparing pages...')

    // Get image data from both canvases
    const ctx1 = normalizedCanvas1.getContext('2d')
    const ctx2 = normalizedCanvas2.getContext('2d')

    if (!ctx1 || !ctx2) {
      throw new Error('Could not get canvas context')
    }

    const imageData1 = ctx1.getImageData(0, 0, width, height)
    const imageData2 = ctx2.getImageData(0, 0, width, height)

    // Create output canvas for diff
    const diffCanvas = document.createElement('canvas')
    diffCanvas.width = width
    diffCanvas.height = height
    const diffCtx = diffCanvas.getContext('2d')

    if (!diffCtx) {
      throw new Error('Could not get diff canvas context')
    }

    const diffImageData = diffCtx.createImageData(width, height)

    this.updateProgress('comparing', 85, 'Calculating differences...')

    // Use pixelmatch to compare
    const diffPixels = pixelmatch(
      imageData1.data,
      imageData2.data,
      diffImageData.data,
      width,
      height,
      {
        threshold,
        includeAA: includeAntiAliasing,
        diffColor,
        alpha: 0.3, // Show original image faintly in background
      }
    )

    // Put the diff data onto the canvas
    diffCtx.putImageData(diffImageData, 0, 0)

    // Cleanup
    await pdf1.destroy()
    await pdf2.destroy()

    const totalPixels = width * height
    const percentDifferent = (diffPixels / totalPixels) * 100

    this.updateProgress('complete', 100, 'Comparison complete!')

    return {
      diffPixels,
      totalPixels,
      percentDifferent,
      diffCanvas,
      pdf1Canvas: normalizedCanvas1,
      pdf2Canvas: normalizedCanvas2,
      width,
      height,
    }
  }

  /**
   * Compare multiple pages and return results for each
   */
  async compareMultiplePages(
    pdf1Bytes: ArrayBuffer,
    pdf2Bytes: ArrayBuffer,
    pageNumbers: number[],
    options: ComparisonOptions = {}
  ): Promise<ComparisonResult[]> {
    const results: ComparisonResult[] = []

    for (let i = 0; i < pageNumbers.length; i++) {
      const pageNum = pageNumbers[i]
      this.updateProgress(
        'comparing',
        Math.round(((i + 1) / pageNumbers.length) * 100),
        `Comparing page ${pageNum}...`
      )

      const result = await this.comparePDFs(pdf1Bytes, pdf2Bytes, pageNum, options)
      results.push(result)
    }

    return results
  }

  /**
   * Get the page count from a PDF ArrayBuffer
   */
  async getPageCount(pdfBytes: ArrayBuffer): Promise<number> {
    const pdf = await this.loadPDF(pdfBytes)
    const count = pdf.numPages
    await pdf.destroy()
    return count
  }

  /**
   * Create a side-by-side comparison canvas
   */
  createSideBySideCanvas(
    canvas1: HTMLCanvasElement,
    canvas2: HTMLCanvasElement,
    diffCanvas: HTMLCanvasElement
  ): HTMLCanvasElement {
    const gap = 10
    const totalWidth = canvas1.width + canvas2.width + diffCanvas.width + gap * 2
    const maxHeight = Math.max(canvas1.height, canvas2.height, diffCanvas.height)

    const combinedCanvas = document.createElement('canvas')
    combinedCanvas.width = totalWidth
    combinedCanvas.height = maxHeight

    const ctx = combinedCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Fill background
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, totalWidth, maxHeight)

    // Draw canvases side by side
    ctx.drawImage(canvas1, 0, 0)
    ctx.drawImage(canvas2, canvas1.width + gap, 0)
    ctx.drawImage(diffCanvas, canvas1.width + gap + canvas2.width + gap, 0)

    return combinedCanvas
  }

  /**
   * Create an overlay comparison showing differences on top of original
   */
  createOverlayCanvas(
    originalCanvas: HTMLCanvasElement,
    diffCanvas: HTMLCanvasElement,
    opacity: number = 0.5
  ): HTMLCanvasElement {
    const overlayCanvas = document.createElement('canvas')
    overlayCanvas.width = originalCanvas.width
    overlayCanvas.height = originalCanvas.height

    const ctx = overlayCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Draw original
    ctx.drawImage(originalCanvas, 0, 0)

    // Draw diff with opacity
    ctx.globalAlpha = opacity
    ctx.drawImage(diffCanvas, 0, 0)
    ctx.globalAlpha = 1

    return overlayCanvas
  }

  /**
   * Export comparison result as PNG blob
   */
  async exportComparisonAsPng(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        },
        'image/png',
        1.0
      )
    })
  }

  /**
   * Format percentage for display
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`
  }

  /**
   * Determine if two PDFs are significantly different
   */
  isSignificantlyDifferent(percentDifferent: number, threshold: number = 1): boolean {
    return percentDifferent > threshold
  }
}

export const comparisonService = ComparisonService.getInstance()
