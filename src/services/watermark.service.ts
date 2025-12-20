import { PDFDocument, PDFPage, rgb, degrees } from 'pdf-lib'
import type { Watermark, WatermarkPosition, PageRange } from '../types/watermark.types'

interface Position {
  x: number
  y: number
}

export class WatermarkService {
  private watermark: Watermark | null = null

  setWatermark(watermark: Watermark): void {
    this.watermark = watermark
  }

  getWatermark(): Watermark | null {
    return this.watermark
  }

  removeWatermark(): void {
    this.watermark = null
  }

  hasWatermark(): boolean {
    return this.watermark !== null
  }

  async applyWatermarksToPDF(pdfDoc: PDFDocument, watermark: Watermark): Promise<void> {
    const pages = pdfDoc.getPages()
    const targetPages = this.getTargetPages(pages, watermark.pageRange)

    for (const page of targetPages) {
      await this.applyWatermarkToPage(page, watermark)
    }
  }

  private async applyWatermarkToPage(page: PDFPage, watermark: Watermark): Promise<void> {
    const { width, height } = page.getSize()
    const position = this.calculatePosition(watermark, width, height)
    const color = this.convertColor(watermark.color)

    const font = await page.doc.embedFont('Helvetica-Bold')
    const textWidth = font.widthOfTextAtSize(watermark.text, watermark.fontSize)
    const textHeight = watermark.fontSize

    let finalX = position.x
    let finalY = position.y

    if (watermark.position !== 'custom') {
      finalX = finalX - (textWidth / 2)
      finalY = finalY - (textHeight / 2)
    }

    page.drawText(watermark.text, {
      x: finalX,
      y: finalY,
      size: watermark.fontSize,
      font: font,
      color: color,
      opacity: watermark.opacity,
      rotate: degrees(watermark.rotation)
    })
  }

  private getTargetPages(pages: PDFPage[], pageRange: PageRange): PDFPage[] {
    if (pageRange.type === 'all') {
      return pages
    }

    if (pageRange.type === 'range') {
      const start = Math.max(0, pageRange.start - 1)
      const end = Math.min(pages.length, pageRange.end)
      return pages.slice(start, end)
    }

    if (pageRange.type === 'specific') {
      return pageRange.pages
        .map(pageNum => pages[pageNum - 1])
        .filter(page => page !== undefined)
    }

    return pages
  }

  private calculatePosition(watermark: Watermark, pageWidth: number, pageHeight: number): Position {
    if (watermark.position === 'custom') {
      return {
        x: watermark.customX ?? pageWidth / 2,
        y: watermark.customY ?? pageHeight / 2
      }
    }

    const positions: Record<WatermarkPosition, Position> = {
      'center': {
        x: pageWidth / 2,
        y: pageHeight / 2
      },
      'diagonal': {
        x: pageWidth / 2,
        y: pageHeight / 2
      },
      'top-left': {
        x: 50,
        y: pageHeight - 50
      },
      'top-center': {
        x: pageWidth / 2,
        y: pageHeight - 50
      },
      'top-right': {
        x: pageWidth - 50,
        y: pageHeight - 50
      },
      'bottom-left': {
        x: 50,
        y: 50
      },
      'bottom-center': {
        x: pageWidth / 2,
        y: 50
      },
      'bottom-right': {
        x: pageWidth - 50,
        y: 50
      },
      'custom': {
        x: pageWidth / 2,
        y: pageHeight / 2
      }
    }

    return positions[watermark.position]
  }

  private convertColor(colorStr: string): ReturnType<typeof rgb> {
    if (colorStr.startsWith('oklch')) {
      const rgbColor = this.oklchToRgb(colorStr)
      return rgb(rgbColor.r, rgbColor.g, rgbColor.b)
    }

    if (colorStr.startsWith('#')) {
      const hex = colorStr.slice(1)
      const r = parseInt(hex.slice(0, 2), 16) / 255
      const g = parseInt(hex.slice(2, 4), 16) / 255
      const b = parseInt(hex.slice(4, 6), 16) / 255
      return rgb(r, g, b)
    }

    return rgb(0.5, 0.5, 0.5)
  }

  private oklchToRgb(oklchStr: string): { r: number; g: number; b: number } {
    const match = oklchStr.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
    if (!match) return { r: 0.5, g: 0.5, b: 0.5 }

    const l = parseFloat(match[1])
    const c = parseFloat(match[2])
    const h = parseFloat(match[3])

    const a = c * Math.cos((h * Math.PI) / 180)
    const b = c * Math.sin((h * Math.PI) / 180)

    const fy = (l + 16) / 116
    const fx = a / 500 + fy
    const fz = fy - b / 200

    const xr = fx ** 3 > 0.008856 ? fx ** 3 : (116 * fx - 16) / 903.3
    const yr = l > 8 ? ((l + 16) / 116) ** 3 : l / 903.3
    const zr = fz ** 3 > 0.008856 ? fz ** 3 : (116 * fz - 16) / 903.3

    const x = xr * 0.95047
    const y = yr * 1.0
    const z = zr * 1.08883

    let r = x * 3.2406 + y * -1.5372 + z * -0.4986
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415
    let bl = x * 0.0557 + y * -0.204 + z * 1.057

    const gammaCorrect = (c: number) => {
      return c > 0.0031308 ? 1.055 * c ** (1 / 2.4) - 0.055 : 12.92 * c
    }

    r = Math.max(0, Math.min(1, gammaCorrect(r)))
    g = Math.max(0, Math.min(1, gammaCorrect(g)))
    bl = Math.max(0, Math.min(1, gammaCorrect(bl)))

    return { r, g, b: bl }
  }
}

export const watermarkService = new WatermarkService()
