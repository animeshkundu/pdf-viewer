import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import DOMPurify from 'dompurify'
import type {
  ImagesToPDFOptions,
  PDFToImagesOptions,
  HTMLToPDFOptions,
  MarkdownToPDFOptions,
  ConversionProgress,
  PDFToImagesResult,
} from '@/types/conversion.types'

// Ensure PDF.js worker is configured
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

const PAGE_SIZES = {
  letter: { width: 612, height: 792 },
  a4: { width: 595, height: 842 },
}

export class ConversionService {
  private static instance: ConversionService
  private progressCallback?: (progress: ConversionProgress) => void

  private constructor() {}

  static getInstance(): ConversionService {
    if (!ConversionService.instance) {
      ConversionService.instance = new ConversionService()
    }
    return ConversionService.instance
  }

  setProgressCallback(callback: (progress: ConversionProgress) => void): void {
    this.progressCallback = callback
  }

  private updateProgress(
    stage: ConversionProgress['stage'],
    progress: number,
    message: string,
    currentItem?: number,
    totalItems?: number
  ): void {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message, currentItem, totalItems })
    }
  }

  /**
   * Convert multiple images to a single PDF document
   */
  async imagesToPDF(files: File[], options: ImagesToPDFOptions): Promise<Blob> {
    if (files.length === 0) {
      throw new Error('No images provided')
    }

    this.updateProgress('loading', 0, 'Creating PDF document...')
    const pdfDoc = await PDFDocument.create()
    const totalFiles = files.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      this.updateProgress(
        'processing',
        Math.round(((i + 1) / totalFiles) * 80),
        `Processing image ${i + 1} of ${totalFiles}...`,
        i + 1,
        totalFiles
      )

      const imageBytes = await file.arrayBuffer()
      const fileType = file.type.toLowerCase()

      let embeddedImage
      if (fileType === 'image/png') {
        embeddedImage = await pdfDoc.embedPng(imageBytes)
      } else if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
        embeddedImage = await pdfDoc.embedJpg(imageBytes)
      } else {
        // Try to convert other formats via canvas
        const converted = await this.convertImageToJpeg(file)
        embeddedImage = await pdfDoc.embedJpg(converted)
      }

      const { width: imgWidth, height: imgHeight } = embeddedImage
      const margin = options.margin

      let pageWidth: number
      let pageHeight: number

      if (options.pageSize === 'fit') {
        // Page size fits the image plus margins
        pageWidth = imgWidth + margin * 2
        pageHeight = imgHeight + margin * 2
      } else {
        // Standard page size
        const standardSize = PAGE_SIZES[options.pageSize]
        pageWidth = standardSize.width
        pageHeight = standardSize.height
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight])
      const availableWidth = pageWidth - margin * 2
      const availableHeight = pageHeight - margin * 2

      // Scale image to fit within available space while maintaining aspect ratio
      const scaleX = availableWidth / imgWidth
      const scaleY = availableHeight / imgHeight
      const scale = Math.min(scaleX, scaleY, 1) // Don't scale up

      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale

      // Center the image on the page
      const x = margin + (availableWidth - scaledWidth) / 2
      const y = margin + (availableHeight - scaledHeight) / 2

      page.drawImage(embeddedImage, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      })
    }

    this.updateProgress('saving', 90, 'Generating PDF...')
    const pdfBytes = await pdfDoc.save()

    this.updateProgress('complete', 100, 'Conversion complete!')
    return new Blob([pdfBytes], { type: 'application/pdf' })
  }

  /**
   * Convert a PDF to images (one image per page)
   */
  async pdfToImages(
    pdfBytes: ArrayBuffer,
    options: PDFToImagesOptions
  ): Promise<PDFToImagesResult> {
    this.updateProgress('loading', 0, 'Loading PDF...')
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes })
    const pdfDoc = await loadingTask.promise
    const pageCount = pdfDoc.numPages

    const pagesToConvert = options.pages || Array.from({ length: pageCount }, (_, i) => i + 1)
    const totalPages = pagesToConvert.length

    const blobs: Blob[] = []
    const filenames: string[] = []

    for (let i = 0; i < pagesToConvert.length; i++) {
      const pageNum = pagesToConvert[i]
      this.updateProgress(
        'rendering',
        Math.round(((i + 1) / totalPages) * 90),
        `Rendering page ${pageNum}...`,
        i + 1,
        totalPages
      )

      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale: options.scale })

      // Create canvas for rendering
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height

      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Could not get canvas context')
      }

      // Render the page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      } as any).promise

      // Convert canvas to blob
      const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg'
      const quality = options.format === 'jpg' ? 0.92 : undefined

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create image blob'))
            }
          },
          mimeType,
          quality
        )
      })

      blobs.push(blob)
      filenames.push(`page_${pageNum}.${options.format}`)
    }

    this.updateProgress('complete', 100, 'Conversion complete!')
    return { blobs, filenames }
  }

  /**
   * Convert HTML content to PDF
   */
  async htmlToPDF(html: string, options: HTMLToPDFOptions): Promise<Blob> {
    this.updateProgress('loading', 0, 'Preparing HTML content...')

    // Sanitize HTML to prevent XSS
    const sanitizedHtml = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ['style'],
      ADD_ATTR: ['style', 'class'],
    })

    this.updateProgress('processing', 30, 'Loading html2pdf library...')

    // Lazy-load html2pdf.js
    const { default: html2pdf } = await import('html2pdf.js')

    this.updateProgress('rendering', 50, 'Generating PDF from HTML...')

    // Create a temporary container for the HTML
    const container = document.createElement('div')
    container.innerHTML = sanitizedHtml
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = options.pageSize === 'letter' ? '8.5in' : '210mm'
    document.body.appendChild(container)

    try {
      const marginInches = options.margin / 72 // Convert points to inches

      const pdfBlob = await html2pdf()
        .set({
          margin: marginInches,
          filename: 'document.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
          },
          jsPDF: {
            unit: 'in',
            format: options.pageSize,
            orientation: 'portrait',
          },
        })
        .from(container)
        .outputPdf('blob')

      this.updateProgress('complete', 100, 'Conversion complete!')
      return pdfBlob
    } finally {
      // Clean up the temporary container
      document.body.removeChild(container)
    }
  }

  /**
   * Convert Markdown content to PDF
   */
  async markdownToPDF(
    markdown: string,
    options: MarkdownToPDFOptions = {}
  ): Promise<Blob> {
    this.updateProgress('loading', 0, 'Converting Markdown to HTML...')

    // Lazy-load marked
    const { marked } = await import('marked')

    // Convert markdown to HTML
    const rawHtml = await marked.parse(markdown)

    // Wrap in basic HTML structure with styling
    const styledHtml = `
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #333;
              max-width: 100%;
            }
            h1 { font-size: 24pt; margin-top: 0; margin-bottom: 16pt; }
            h2 { font-size: 20pt; margin-top: 20pt; margin-bottom: 12pt; }
            h3 { font-size: 16pt; margin-top: 16pt; margin-bottom: 8pt; }
            h4 { font-size: 14pt; margin-top: 12pt; margin-bottom: 6pt; }
            p { margin: 0 0 12pt 0; }
            ul, ol { margin: 0 0 12pt 0; padding-left: 24pt; }
            li { margin-bottom: 4pt; }
            code {
              background-color: #f4f4f4;
              padding: 2pt 4pt;
              border-radius: 3pt;
              font-family: 'Courier New', Consolas, monospace;
              font-size: 10pt;
            }
            pre {
              background-color: #f4f4f4;
              padding: 12pt;
              border-radius: 4pt;
              overflow-x: auto;
              margin: 0 0 12pt 0;
            }
            pre code {
              background-color: transparent;
              padding: 0;
            }
            blockquote {
              border-left: 4pt solid #ddd;
              margin: 0 0 12pt 0;
              padding-left: 16pt;
              color: #666;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 0 0 12pt 0;
            }
            th, td {
              border: 1pt solid #ddd;
              padding: 8pt;
              text-align: left;
            }
            th {
              background-color: #f4f4f4;
            }
            hr {
              border: none;
              border-top: 1pt solid #ddd;
              margin: 16pt 0;
            }
            a {
              color: #0066cc;
              text-decoration: none;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${rawHtml}
        </body>
      </html>
    `

    this.updateProgress('processing', 30, 'Generating PDF...')

    // Use htmlToPDF with the styled HTML
    return this.htmlToPDF(styledHtml, {
      pageSize: options.pageSize || 'a4',
      margin: options.margin || 72, // 1 inch default margin
    })
  }

  /**
   * Helper to convert any image format to JPEG via canvas
   */
  private async convertImageToJpeg(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(url)
          reject(new Error('Could not get canvas context'))
          return
        }

        // Fill with white background for transparency handling
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)

        URL.revokeObjectURL(url)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              blob.arrayBuffer().then(resolve).catch(reject)
            } else {
              reject(new Error('Failed to convert image'))
            }
          },
          'image/jpeg',
          0.92
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Download multiple images as a ZIP file
   */
  async downloadAsZip(result: PDFToImagesResult, zipFilename: string = 'images.zip'): Promise<void> {
    this.updateProgress('saving', 0, 'Creating ZIP archive...')
    const zip = new JSZip()

    result.blobs.forEach((blob, index) => {
      zip.file(result.filenames[index], blob)
    })

    this.updateProgress('saving', 50, 'Generating ZIP file...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    saveAs(zipBlob, zipFilename)
    this.updateProgress('complete', 100, 'Download started!')
  }

  /**
   * Download a single blob with a filename
   */
  downloadBlob(blob: Blob, filename: string): void {
    saveAs(blob, filename)
  }

  /**
   * Get image dimensions from a File
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: img.width, height: img.height })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Create a preview data URL for an image file
   */
  async createImagePreview(file: File, maxSize: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Scale down if needed
        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height)
          width = width * scale
          height = height * scale
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(url)
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)

        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }
}

export const conversionService = ConversionService.getInstance()
