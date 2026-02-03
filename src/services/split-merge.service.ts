import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type {
  PageRange,
  SplitOptions,
  SplitResult,
  MergeFile,
  MergeOptions,
  ScaleTarget,
  NupOptions,
  BlankPageDetectionOptions,
  SplitMergeProgress,
} from '@/types/split-merge.types'

const PAGE_SIZES = {
  letter: { width: 612, height: 792 },
  a4: { width: 595, height: 842 },
  a3: { width: 842, height: 1191 },
  legal: { width: 612, height: 1008 },
}

export class SplitMergeService {
  private static instance: SplitMergeService
  private progressCallback?: (progress: SplitMergeProgress) => void

  private constructor() {}

  static getInstance(): SplitMergeService {
    if (!SplitMergeService.instance) {
      SplitMergeService.instance = new SplitMergeService()
    }
    return SplitMergeService.instance
  }

  setProgressCallback(callback: (progress: SplitMergeProgress) => void): void {
    this.progressCallback = callback
  }

  private updateProgress(
    stage: SplitMergeProgress['stage'],
    progress: number,
    message: string,
    currentFile?: number,
    totalFiles?: number
  ): void {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message, currentFile, totalFiles })
    }
  }

  /**
   * Split a PDF into multiple documents based on the specified options
   */
  async splitPDF(
    pdfBytes: ArrayBuffer,
    options: SplitOptions,
    originalFilename?: string
  ): Promise<SplitResult> {
    this.updateProgress('loading', 0, 'Loading PDF...')
    const sourcePdf = await PDFDocument.load(pdfBytes)
    const pageCount = sourcePdf.getPageCount()
    const results: Blob[] = []
    const filenames: string[] = []

    let ranges: PageRange[] = []

    // Determine ranges based on split mode
    switch (options.mode.type) {
      case 'ranges':
        ranges = options.mode.ranges
        break
      case 'everyN': {
        const n = options.mode.n
        for (let i = 1; i <= pageCount; i += n) {
          ranges.push({ start: i, end: Math.min(i + n - 1, pageCount) })
        }
        break
      }
      case 'extractPages': {
        // Each page becomes its own range
        ranges = options.mode.pages.map(p => ({ start: p, end: p }))
        break
      }
    }

    // Validate ranges
    for (const range of ranges) {
      if (range.start < 1 || range.end > pageCount || range.start > range.end) {
        throw new Error(`Invalid page range: ${range.start}-${range.end}. Document has ${pageCount} pages.`)
      }
    }

    const totalRanges = ranges.length
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i]
      this.updateProgress(
        'processing',
        Math.round(((i + 1) / totalRanges) * 80),
        `Extracting pages ${range.start}-${range.end}...`,
        i + 1,
        totalRanges
      )

      const newPdf = await PDFDocument.create()
      const pageIndices = Array.from(
        { length: range.end - range.start + 1 },
        (_, idx) => range.start - 1 + idx
      )

      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices)
      copiedPages.forEach(page => newPdf.addPage(page))

      const pdfData = await newPdf.save()
      results.push(new Blob([pdfData], { type: 'application/pdf' }))

      // Generate filename
      const baseName = originalFilename?.replace('.pdf', '') || 'document'
      const filename = this.generateSplitFilename(baseName, range, i + 1, options.filenamePattern)
      filenames.push(filename)
    }

    this.updateProgress('complete', 100, 'Split complete!')
    return { blobs: results, filenames }
  }

  /**
   * Extract specific pages from a PDF
   */
  async extractPages(pdfBytes: ArrayBuffer, pages: number[], originalFilename?: string): Promise<Blob> {
    this.updateProgress('loading', 0, 'Loading PDF...')
    const sourcePdf = await PDFDocument.load(pdfBytes)
    const pageCount = sourcePdf.getPageCount()

    // Validate pages
    for (const page of pages) {
      if (page < 1 || page > pageCount) {
        throw new Error(`Invalid page number: ${page}. Document has ${pageCount} pages.`)
      }
    }

    this.updateProgress('processing', 30, 'Extracting pages...')
    const newPdf = await PDFDocument.create()
    const pageIndices = pages.map(p => p - 1)
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices)
    copiedPages.forEach(page => newPdf.addPage(page))

    this.updateProgress('saving', 80, 'Saving PDF...')
    const pdfData = await newPdf.save()

    this.updateProgress('complete', 100, 'Extraction complete!')
    return new Blob([pdfData], { type: 'application/pdf' })
  }

  /**
   * Merge multiple PDF files into a single document
   */
  async mergePDFs(files: MergeFile[], _options?: MergeOptions): Promise<Blob> {
    if (files.length === 0) {
      throw new Error('No files to merge')
    }

    this.updateProgress('loading', 0, 'Preparing merge...')

    // Sort files by order
    const sortedFiles = [...files].sort((a, b) => a.order - b.order)
    const resultPdf = await PDFDocument.create()
    const totalFiles = sortedFiles.length

    for (let i = 0; i < sortedFiles.length; i++) {
      const mergeFile = sortedFiles[i]
      this.updateProgress(
        'processing',
        Math.round(((i + 1) / totalFiles) * 80),
        `Adding ${mergeFile.name}...`,
        i + 1,
        totalFiles
      )

      const fileBytes = await mergeFile.file.arrayBuffer()
      const sourcePdf = await PDFDocument.load(fileBytes)

      // Determine which pages to copy
      let pageIndices: number[]
      if (mergeFile.selectedPages && mergeFile.selectedPages.length > 0) {
        pageIndices = mergeFile.selectedPages.map(p => p - 1)
      } else {
        pageIndices = sourcePdf.getPageIndices()
      }

      const copiedPages = await resultPdf.copyPages(sourcePdf, pageIndices)
      copiedPages.forEach(page => resultPdf.addPage(page))
    }

    this.updateProgress('saving', 90, 'Generating merged PDF...')
    const pdfData = await resultPdf.save()

    this.updateProgress('complete', 100, 'Merge complete!')
    return new Blob([pdfData], { type: 'application/pdf' })
  }

  /**
   * Get page count from a PDF file
   */
  async getPageCount(file: File): Promise<number> {
    const bytes = await file.arrayBuffer()
    const pdf = await PDFDocument.load(bytes)
    return pdf.getPageCount()
  }

  /**
   * Scale all pages in a PDF to a target size
   */
  async scalePages(pdfBytes: ArrayBuffer, target: ScaleTarget): Promise<Blob> {
    this.updateProgress('loading', 0, 'Loading PDF...')
    const sourcePdf = await PDFDocument.load(pdfBytes)
    const pageCount = sourcePdf.getPageCount()

    const targetSize =
      target.type === 'standard'
        ? PAGE_SIZES[target.size]
        : { width: target.width, height: target.height }

    const resultPdf = await PDFDocument.create()

    for (let i = 0; i < pageCount; i++) {
      this.updateProgress(
        'processing',
        Math.round(((i + 1) / pageCount) * 80),
        `Scaling page ${i + 1} of ${pageCount}...`
      )

      const [embeddedPage] = await resultPdf.embedPdf(sourcePdf, [i])
      const { width: origWidth, height: origHeight } = embeddedPage

      // Calculate scale to fit target while maintaining aspect ratio
      const scaleX = targetSize.width / origWidth
      const scaleY = targetSize.height / origHeight
      const scale = Math.min(scaleX, scaleY)

      const scaledWidth = origWidth * scale
      const scaledHeight = origHeight * scale

      // Center on page
      const x = (targetSize.width - scaledWidth) / 2
      const y = (targetSize.height - scaledHeight) / 2

      const newPage = resultPdf.addPage([targetSize.width, targetSize.height])
      newPage.drawPage(embeddedPage, {
        x,
        y,
        xScale: scale,
        yScale: scale,
      })
    }

    this.updateProgress('saving', 90, 'Saving PDF...')
    const pdfData = await resultPdf.save()

    this.updateProgress('complete', 100, 'Scaling complete!')
    return new Blob([pdfData], { type: 'application/pdf' })
  }

  /**
   * Create N-up layout (multiple pages per sheet)
   */
  async createNupLayout(pdfBytes: ArrayBuffer, options: NupOptions): Promise<Blob> {
    this.updateProgress('loading', 0, 'Loading PDF...')
    const sourcePdf = await PDFDocument.load(pdfBytes)
    const pageCount = sourcePdf.getPageCount()
    const { pagesPerSheet, orientation, pageOrder, margin } = options

    // Calculate grid dimensions
    let cols: number, rows: number
    switch (pagesPerSheet) {
      case 2:
        cols = 2
        rows = 1
        break
      case 4:
        cols = 2
        rows = 2
        break
      case 6:
        cols = 3
        rows = 2
        break
      case 9:
        cols = 3
        rows = 3
        break
    }

    // Swap cols/rows based on orientation
    if (orientation === 'portrait') {
      [cols, rows] = [rows, cols]
    }

    // Use A4 as base size
    const baseSize = PAGE_SIZES.a4
    const sheetWidth = orientation === 'landscape' ? baseSize.height : baseSize.width
    const sheetHeight = orientation === 'landscape' ? baseSize.width : baseSize.height

    const cellWidth = (sheetWidth - margin * 2) / cols
    const cellHeight = (sheetHeight - margin * 2) / rows

    const resultPdf = await PDFDocument.create()
    const totalSheets = Math.ceil(pageCount / pagesPerSheet)

    for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
      this.updateProgress(
        'processing',
        Math.round(((sheetIndex + 1) / totalSheets) * 80),
        `Creating sheet ${sheetIndex + 1} of ${totalSheets}...`
      )

      const sheet = resultPdf.addPage([sheetWidth, sheetHeight])

      for (let cellIndex = 0; cellIndex < pagesPerSheet; cellIndex++) {
        const pageIndex =
          pageOrder === 'horizontal'
            ? sheetIndex * pagesPerSheet + cellIndex
            : sheetIndex * pagesPerSheet + cellIndex

        if (pageIndex >= pageCount) break

        const [embeddedPage] = await resultPdf.embedPdf(sourcePdf, [pageIndex])
        const { width: origWidth, height: origHeight } = embeddedPage

        // Calculate position in grid
        let col: number, row: number
        if (pageOrder === 'horizontal') {
          col = cellIndex % cols
          row = Math.floor(cellIndex / cols)
        } else {
          col = Math.floor(cellIndex / rows)
          row = cellIndex % rows
        }

        // Calculate scale to fit cell
        const scale = Math.min(cellWidth / origWidth, cellHeight / origHeight) * 0.95

        const scaledWidth = origWidth * scale
        const scaledHeight = origHeight * scale

        // Position in cell (centered)
        const cellX = margin + col * cellWidth
        const cellY = sheetHeight - margin - (row + 1) * cellHeight
        const x = cellX + (cellWidth - scaledWidth) / 2
        const y = cellY + (cellHeight - scaledHeight) / 2

        sheet.drawPage(embeddedPage, {
          x,
          y,
          xScale: scale,
          yScale: scale,
        })
      }
    }

    this.updateProgress('saving', 90, 'Saving PDF...')
    const pdfData = await resultPdf.save()

    this.updateProgress('complete', 100, 'N-up layout complete!')
    return new Blob([pdfData], { type: 'application/pdf' })
  }

  /**
   * Detect blank pages in a PDF using canvas analysis
   * Note: This requires rendering pages which needs PDF.js, so it accepts
   * pre-rendered canvas data for analysis
   */
  async detectBlankPages(
    canvasDataArray: ImageData[],
    options: BlankPageDetectionOptions
  ): Promise<number[]> {
    const blankPages: number[] = []
    const { threshold, ignoreMargins, marginSize } = options

    for (let i = 0; i < canvasDataArray.length; i++) {
      this.updateProgress(
        'processing',
        Math.round(((i + 1) / canvasDataArray.length) * 100),
        `Analyzing page ${i + 1}...`
      )

      const imageData = canvasDataArray[i]
      const { width, height, data } = imageData

      let whitePixels = 0
      let totalPixels = 0

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Skip margins if configured
          if (ignoreMargins) {
            if (x < marginSize || x > width - marginSize) continue
            if (y < marginSize || y > height - marginSize) continue
          }

          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]

          // Consider near-white pixels (allowing for slight variations)
          const isWhite = r > 250 && g > 250 && b > 250

          totalPixels++
          if (isWhite) whitePixels++
        }
      }

      const whiteRatio = whitePixels / totalPixels
      if (whiteRatio >= threshold) {
        blankPages.push(i + 1) // 1-indexed
      }
    }

    return blankPages
  }

  /**
   * Remove specific pages from a PDF
   */
  async removePages(pdfBytes: ArrayBuffer, pagesToRemove: number[]): Promise<Blob> {
    this.updateProgress('loading', 0, 'Loading PDF...')
    const sourcePdf = await PDFDocument.load(pdfBytes)
    const pageCount = sourcePdf.getPageCount()

    // Get pages to keep (all except those to remove)
    const pagesToKeep = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
      p => !pagesToRemove.includes(p)
    )

    if (pagesToKeep.length === 0) {
      throw new Error('Cannot remove all pages from PDF')
    }

    this.updateProgress('processing', 30, 'Creating new PDF...')
    const newPdf = await PDFDocument.create()
    const pageIndices = pagesToKeep.map(p => p - 1)
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices)
    copiedPages.forEach(page => newPdf.addPage(page))

    this.updateProgress('saving', 80, 'Saving PDF...')
    const pdfData = await newPdf.save()

    this.updateProgress('complete', 100, 'Pages removed!')
    return new Blob([pdfData], { type: 'application/pdf' })
  }

  /**
   * Download split results as ZIP or individual files
   */
  async downloadSplitResults(results: SplitResult, asZip: boolean = true): Promise<void> {
    if (asZip) {
      this.updateProgress('saving', 0, 'Creating ZIP archive...')
      const zip = new JSZip()

      results.blobs.forEach((blob, index) => {
        zip.file(results.filenames[index], blob)
      })

      this.updateProgress('saving', 50, 'Generating ZIP...')
      const zipBlob = await zip.generateAsync({ type: 'blob' })

      saveAs(zipBlob, 'split-documents.zip')
      this.updateProgress('complete', 100, 'Download started!')
    } else {
      // Download each file individually
      results.blobs.forEach((blob, index) => {
        saveAs(blob, results.filenames[index])
      })
      this.updateProgress('complete', 100, 'Downloads started!')
    }
  }

  /**
   * Download a single blob with a filename
   */
  downloadBlob(blob: Blob, filename: string): void {
    saveAs(blob, filename)
  }

  private generateSplitFilename(
    baseName: string,
    range: PageRange,
    index: number,
    pattern?: string
  ): string {
    if (pattern) {
      return (
        pattern
          .replace('{original}', baseName)
          .replace('{index}', String(index))
          .replace('{start}', String(range.start))
          .replace('{end}', String(range.end)) + '.pdf'
      )
    }

    if (range.start === range.end) {
      return `${baseName}_page_${range.start}.pdf`
    }
    return `${baseName}_pages_${range.start}-${range.end}.pdf`
  }
}

export const splitMergeService = SplitMergeService.getInstance()
