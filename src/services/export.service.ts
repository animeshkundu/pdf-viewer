import { PDFDocument, rgb, PDFPage, degrees, StandardFonts } from 'pdf-lib'
import type { Annotation, HighlightAnnotation, PenAnnotation, ShapeAnnotation, TextAnnotation, SignatureAnnotation, RedactionAnnotation } from '@/types/annotation.types'
import type { PageTransformation, BlankPage } from '@/types/page-management.types'
import type { Watermark } from '@/types/watermark.types'
import type { PageNumberConfig } from '@/types/page-number.types'
import { formService } from './form.service'
import { watermarkService } from './watermark.service'
import { pageNumberService } from './page-number.service'

export interface ExportOptions {
  filename?: string
  includeAnnotations?: boolean
  includeFormData?: boolean
  flattenForms?: boolean
  quality?: 'high' | 'medium' | 'low'
}

export interface ExportProgress {
  stage: 'loading' | 'processing' | 'page-numbers' | 'watermark' | 'forms' | 'annotations' | 'finalizing' | 'complete'
  progress: number
  message: string
}

export class ExportService {
  private progressCallback?: (progress: ExportProgress) => void

  setProgressCallback(callback: (progress: ExportProgress) => void): void {
    this.progressCallback = callback
  }

  private updateProgress(stage: ExportProgress['stage'], progress: number, message: string): void {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message })
    }
  }

  async exportPDF(
    originalPdfBytes: ArrayBuffer,
    annotations: Annotation[],
    transformations: Map<number, PageTransformation>,
    pageOrder: number[],
    blankPages: BlankPage[],
    watermark: Watermark | null,
    pageNumberConfig: PageNumberConfig | null,
    options: ExportOptions = {}
  ): Promise<Blob> {
    const { includeAnnotations = true, includeFormData = true, flattenForms = false } = options

    try {
      this.updateProgress('loading', 0, 'Loading PDF document...')
      const pdfDoc = await PDFDocument.load(originalPdfBytes)

      this.updateProgress('processing', 15, 'Applying page transformations...')
      await this.applyPageTransformations(pdfDoc, transformations, pageOrder)

      if (blankPages.length > 0) {
        this.updateProgress('processing', 25, 'Inserting blank pages...')
        await this.insertBlankPages(pdfDoc, blankPages)
      }

      if (pageNumberConfig && pageNumberConfig.enabled) {
        this.updateProgress('page-numbers', 30, 'Adding page numbers...')
        await pageNumberService.applyPageNumbersToPDF(pdfDoc, pageNumberConfig)
      }

      if (watermark) {
        this.updateProgress('watermark', 35, 'Applying watermark...')
        await watermarkService.applyWatermarksToPDF(pdfDoc, watermark)
      }

      if (includeFormData && formService.hasFields()) {
        this.updateProgress('forms', 50, 'Filling form fields...')
        try {
          await formService.applyFieldValues(pdfDoc)
          
          if (flattenForms) {
            await formService.flattenFields(pdfDoc)
          }
        } catch (error) {
          console.warn('Failed to apply form data:', error)
        }
      }

      if (includeAnnotations && annotations.length > 0) {
        this.updateProgress('annotations', 70, 'Embedding annotations...')
        await this.embedAnnotations(pdfDoc, annotations, transformations, pageOrder)
      }

      this.updateProgress('finalizing', 90, 'Generating final PDF...')
      const pdfBytes = await pdfDoc.save()

      this.updateProgress('complete', 100, 'Export complete!')
      return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
    } catch (error) {
      console.error('Export error:', error)
      throw new Error('Failed to export PDF: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  private async applyPageTransformations(
    pdfDoc: PDFDocument,
    transformations: Map<number, PageTransformation>,
    pageOrder: number[]
  ): Promise<void> {
    const pages = pdfDoc.getPages()
    const pagesToRemove: number[] = []
    const rotations: Map<number, number> = new Map()

    transformations.forEach((transform, pageNum) => {
      if (transform.isDeleted) {
        pagesToRemove.push(pageNum - 1)
      }
      if (transform.rotation !== 0) {
        rotations.set(pageNum - 1, transform.rotation)
      }
    })

    pagesToRemove.sort((a, b) => b - a).forEach(pageIndex => {
      if (pageIndex >= 0 && pageIndex < pages.length) {
        pdfDoc.removePage(pageIndex)
      }
    })

    rotations.forEach((rotation, pageIndex) => {
      if (pageIndex >= 0 && pageIndex < pdfDoc.getPageCount()) {
        const page = pdfDoc.getPage(pageIndex)
        const currentRotation = page.getRotation().angle
        page.setRotation(degrees(currentRotation + rotation))
      }
    })

    const newPageOrder: PDFPage[] = []
    pageOrder.forEach(pageNum => {
      const transform = transformations.get(pageNum)
      if (!transform?.isDeleted) {
        const pageIndex = transform?.originalIndex ?? pageNum - 1
        if (pageIndex >= 0 && pageIndex < pages.length) {
          newPageOrder.push(pages[pageIndex])
        }
      }
    })

    if (newPageOrder.length > 0 && newPageOrder.length !== pages.length) {
      const tempDoc = await PDFDocument.create()
      for (const page of newPageOrder) {
        const [copiedPage] = await tempDoc.copyPages(pdfDoc, [pages.indexOf(page)])
        tempDoc.addPage(copiedPage)
      }
      
      while (pdfDoc.getPageCount() > 0) {
        pdfDoc.removePage(0)
      }
      
      const copiedPages = await pdfDoc.copyPages(tempDoc, tempDoc.getPageIndices())
      copiedPages.forEach(page => pdfDoc.addPage(page))
    }
  }

  private async insertBlankPages(pdfDoc: PDFDocument, blankPages: BlankPage[]): Promise<void> {
    const sortedBlankPages = [...blankPages].sort((a, b) => b.position - a.position)
    
    for (const blankPage of sortedBlankPages) {
      const page = pdfDoc.insertPage(blankPage.position, [blankPage.width, blankPage.height])
      
      page.drawRectangle({
        x: 0,
        y: 0,
        width: blankPage.width,
        height: blankPage.height,
        color: rgb(1, 1, 1),
      })
    }
  }

  private async embedAnnotations(
    pdfDoc: PDFDocument,
    annotations: Annotation[],
    transformations: Map<number, PageTransformation>,
    pageOrder: number[]
  ): Promise<void> {
    const pageMapping = this.createPageMapping(transformations, pageOrder)
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    // Bold font reserved for future use with annotation text styling
    const _boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    for (const annotation of annotations) {
      const newPageIndex = pageMapping.get(annotation.pageNum)
      if (newPageIndex === undefined || newPageIndex < 0 || newPageIndex >= pdfDoc.getPageCount()) {
        continue
      }

      const page = pdfDoc.getPage(newPageIndex)

      try {
        switch (annotation.type) {
          case 'highlight':
            await this.embedHighlight(page, annotation as HighlightAnnotation)
            break
          case 'pen':
            await this.embedPenStroke(page, annotation as PenAnnotation)
            break
          case 'rectangle':
          case 'circle':
          case 'arrow':
          case 'line':
            await this.embedShape(page, annotation as ShapeAnnotation)
            break
          case 'text':
            await this.embedText(page, annotation as TextAnnotation, font)
            break
          case 'signature':
            await this.embedSignature(pdfDoc, page, annotation as SignatureAnnotation)
            break
          case 'redaction':
            await this.embedRedaction(page, annotation as RedactionAnnotation)
            break
        }
      } catch (error) {
        console.error(`Failed to embed annotation ${annotation.id}:`, error)
      }
    }
  }

  private createPageMapping(
    transformations: Map<number, PageTransformation>,
    pageOrder: number[]
  ): Map<number, number> {
    const mapping = new Map<number, number>()
    let newIndex = 0

    pageOrder.forEach(pageNum => {
      const transform = transformations.get(pageNum)
      if (!transform?.isDeleted) {
        mapping.set(pageNum, newIndex)
        newIndex++
      }
    })

    return mapping
  }

  private async embedHighlight(page: PDFPage, annotation: HighlightAnnotation): Promise<void> {
    const { height } = page.getSize()
    const color = this.parseColor(annotation.color)

    annotation.boxes.forEach(box => {
      page.drawRectangle({
        x: box.x,
        y: height - box.y - box.height,
        width: box.width,
        height: box.height,
        color: rgb(color.r, color.g, color.b),
        opacity: annotation.opacity,
      })
    })
  }

  private async embedRedaction(page: PDFPage, annotation: RedactionAnnotation): Promise<void> {
    const { height } = page.getSize()

    annotation.boxes.forEach(box => {
      page.drawRectangle({
        x: box.x,
        y: height - box.y - box.height,
        width: box.width,
        height: box.height,
        color: rgb(0, 0, 0),
        opacity: 1,
      })
    })
  }

  private async embedPenStroke(page: PDFPage, annotation: PenAnnotation): Promise<void> {
    const { height } = page.getSize()
    const color = this.parseColor(annotation.color)
    const points = annotation.points

    if (points.length < 2) return

    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i]
      const end = points[i + 1]

      page.drawLine({
        start: { x: start.x, y: height - start.y },
        end: { x: end.x, y: height - end.y },
        thickness: annotation.thickness,
        color: rgb(color.r, color.g, color.b),
        opacity: 1,
      })
    }
  }

  private async embedShape(page: PDFPage, annotation: ShapeAnnotation): Promise<void> {
    const { height } = page.getSize()
    const color = this.parseColor(annotation.color)
    const start = annotation.start
    const end = annotation.end

    switch (annotation.type) {
      case 'rectangle':
        page.drawRectangle({
          x: Math.min(start.x, end.x),
          y: height - Math.max(start.y, end.y),
          width: Math.abs(end.x - start.x),
          height: Math.abs(end.y - start.y),
          borderColor: rgb(color.r, color.g, color.b),
          borderWidth: annotation.thickness,
          opacity: annotation.fill ? 0.3 : 1,
          color: annotation.fill ? rgb(color.r, color.g, color.b) : undefined,
        })
        break

      case 'circle': {
        const centerX = (start.x + end.x) / 2
        const centerY = (start.y + end.y) / 2
        const radiusX = Math.abs(end.x - start.x) / 2
        const radiusY = Math.abs(end.y - start.y) / 2

        page.drawEllipse({
          x: centerX,
          y: height - centerY,
          xScale: radiusX,
          yScale: radiusY,
          borderColor: rgb(color.r, color.g, color.b),
          borderWidth: annotation.thickness,
          opacity: annotation.fill ? 0.3 : 1,
          color: annotation.fill ? rgb(color.r, color.g, color.b) : undefined,
        })
        break
      }

      case 'line':
      case 'arrow':
        page.drawLine({
          start: { x: start.x, y: height - start.y },
          end: { x: end.x, y: height - end.y },
          thickness: annotation.thickness,
          color: rgb(color.r, color.g, color.b),
          opacity: 1,
        })

        if (annotation.type === 'arrow') {
          const angle = Math.atan2(end.y - start.y, end.x - start.x)
          const arrowLength = 10 * annotation.thickness
          const arrowAngle = Math.PI / 6

          const arrow1End = {
            x: end.x - arrowLength * Math.cos(angle - arrowAngle),
            y: end.y - arrowLength * Math.sin(angle - arrowAngle),
          }
          const arrow2End = {
            x: end.x - arrowLength * Math.cos(angle + arrowAngle),
            y: end.y - arrowLength * Math.sin(angle + arrowAngle),
          }

          page.drawLine({
            start: { x: end.x, y: height - end.y },
            end: { x: arrow1End.x, y: height - arrow1End.y },
            thickness: annotation.thickness,
            color: rgb(color.r, color.g, color.b),
            opacity: 1,
          })
          page.drawLine({
            start: { x: end.x, y: height - end.y },
            end: { x: arrow2End.x, y: height - arrow2End.y },
            thickness: annotation.thickness,
            color: rgb(color.r, color.g, color.b),
            opacity: 1,
          })
        }
        break
    }
  }

  private async embedText(page: PDFPage, annotation: TextAnnotation, font: any): Promise<void> {
    const { height } = page.getSize()
    const color = this.parseColor(annotation.color)

    page.drawText(annotation.content, {
      x: annotation.position.x,
      y: height - annotation.position.y - annotation.fontSize,
      size: annotation.fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      maxWidth: annotation.width,
    })
  }

  private async embedSignature(pdfDoc: PDFDocument, page: PDFPage, annotation: SignatureAnnotation): Promise<void> {
    const { height } = page.getSize()

    try {
      const imageData = annotation.imageData
      let embeddedImage

      if (imageData.startsWith('data:image/png')) {
        const base64Data = imageData.split(',')[1]
        const pngImageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
        embeddedImage = await pdfDoc.embedPng(pngImageBytes)
      } else if (imageData.startsWith('data:image/jpeg') || imageData.startsWith('data:image/jpg')) {
        const base64Data = imageData.split(',')[1]
        const jpgImageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
        embeddedImage = await pdfDoc.embedJpg(jpgImageBytes)
      } else {
        console.warn('Unsupported signature image format')
        return
      }

      page.drawImage(embeddedImage, {
        x: annotation.position.x,
        y: height - annotation.position.y - annotation.height,
        width: annotation.width,
        height: annotation.height,
      })
    } catch (error) {
      console.error('Failed to embed signature:', error)
    }
  }

  private parseColor(colorString: string): { r: number; g: number; b: number } {
    if (colorString.startsWith('oklch')) {
      return this.oklchToRgb(colorString)
    }
    
    if (colorString.startsWith('#')) {
      const hex = colorString.slice(1)
      const r = parseInt(hex.slice(0, 2), 16) / 255
      const g = parseInt(hex.slice(2, 4), 16) / 255
      const b = parseInt(hex.slice(4, 6), 16) / 255
      return { r, g, b }
    }

    if (colorString.startsWith('rgb')) {
      const match = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (match) {
        return {
          r: parseInt(match[1]) / 255,
          g: parseInt(match[2]) / 255,
          b: parseInt(match[3]) / 255,
        }
      }
    }

    return { r: 0, g: 0, b: 0 }
  }

  private oklchToRgb(oklch: string): { r: number; g: number; b: number } {
    const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
    if (!match) return { r: 0, g: 0, b: 0 }

    const l = parseFloat(match[1])
    const c = parseFloat(match[2])
    const h = parseFloat(match[3])

    const a = c * Math.cos((h * Math.PI) / 180)
    const b = c * Math.sin((h * Math.PI) / 180)

    const L = l * 100
    const A = a * 100
    const B = b * 100

    let y = (L + 16) / 116
    let x = A / 500 + y
    let z = y - B / 200

    x = 0.95047 * (x * x * x > 0.008856 ? x * x * x : (x - 16 / 116) / 7.787)
    y = 1.0 * (y * y * y > 0.008856 ? y * y * y : (y - 16 / 116) / 7.787)
    z = 1.08883 * (z * z * z > 0.008856 ? z * z * z : (z - 16 / 116) / 7.787)

    let r = x * 3.2406 + y * -1.5372 + z * -0.4986
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415
    let bl = x * 0.0557 + y * -0.204 + z * 1.057

    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g
    bl = bl > 0.0031308 ? 1.055 * Math.pow(bl, 1 / 2.4) - 0.055 : 12.92 * bl

    return {
      r: Math.max(0, Math.min(1, r)),
      g: Math.max(0, Math.min(1, g)),
      b: Math.max(0, Math.min(1, bl)),
    }
  }

  generateFilename(originalFilename?: string): string {
    const timestamp = new Date().toISOString().slice(0, 10)
    const base = originalFilename ? originalFilename.replace('.pdf', '') : 'document'
    return `${base}_edited_${timestamp}.pdf`
  }

  async downloadPDF(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const exportService = new ExportService()
