import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib'
import type { PageNumberConfig } from '@/types/page-number.types'

interface Position {
  x: number
  y: number
}

interface TextAlignment {
  align: 'left' | 'center' | 'right'
}

export class PageNumberService {
  async applyPageNumbersToPDF(
    pdfDoc: PDFDocument,
    config: PageNumberConfig
  ): Promise<void> {
    const pages = pdfDoc.getPages()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const targetPages = this.getTargetPages(pages.length, config.pageRange)
    
    for (let i = 0; i < pages.length; i++) {
      if (!targetPages.includes(i + 1)) {
        continue
      }
      
      const page = pages[i]
      const pageNumber = i + 1 - (config.startNumber - 1)
      const text = this.formatPageNumber(pageNumber, config)
      const position = this.calculatePosition(page, config.position, text, font, config.fontSize)
      const color = this.convertColor(config.color)
      const alignment = this.getAlignment(config.position)
      
      const textWidth = font.widthOfTextAtSize(text, config.fontSize)
      let finalX = position.x
      
      if (alignment.align === 'center') {
        finalX = position.x - (textWidth / 2)
      } else if (alignment.align === 'right') {
        finalX = position.x - textWidth
      }
      
      page.drawText(text, {
        x: finalX,
        y: position.y,
        size: config.fontSize,
        font: font,
        color: rgb(color.r, color.g, color.b)
      })
    }
  }
  
  private getTargetPages(totalPages: number, pageRange: PageNumberConfig['pageRange']): number[] {
    if (pageRange.type === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    
    if (pageRange.type === 'range' && pageRange.start && pageRange.end) {
      const start = Math.max(1, pageRange.start)
      const end = Math.min(totalPages, pageRange.end)
      return Array.from({ length: end - start + 1 }, (_, i) => start + i)
    }
    
    return []
  }
  
  private formatPageNumber(pageNumber: number, config: PageNumberConfig): string {
    let formatted = ''
    
    if (config.format === 'numeric') {
      formatted = `${pageNumber}`
    } else if (config.format === 'text') {
      formatted = `Page ${pageNumber}`
    }
    
    if (config.prefix) {
      formatted = `${config.prefix}${formatted}`
    }
    
    if (config.suffix) {
      formatted = `${formatted}${config.suffix}`
    }
    
    return formatted
  }
  
  private calculatePosition(
    page: PDFPage,
    position: PageNumberConfig['position'],
    text: string,
    font: any,
    fontSize: number
  ): Position {
    const { width: pageWidth, height: pageHeight } = page.getSize()
    const margin = 50
    const verticalMargin = 30
    
    const positions: Record<PageNumberConfig['position'], Position> = {
      'top-left': { x: margin, y: pageHeight - verticalMargin },
      'top-center': { x: pageWidth / 2, y: pageHeight - verticalMargin },
      'top-right': { x: pageWidth - margin, y: pageHeight - verticalMargin },
      'bottom-left': { x: margin, y: verticalMargin },
      'bottom-center': { x: pageWidth / 2, y: verticalMargin },
      'bottom-right': { x: pageWidth - margin, y: verticalMargin }
    }
    
    return positions[position]
  }
  
  private getAlignment(position: PageNumberConfig['position']): TextAlignment {
    if (position.endsWith('-left')) {
      return { align: 'left' }
    } else if (position.endsWith('-center')) {
      return { align: 'center' }
    } else if (position.endsWith('-right')) {
      return { align: 'right' }
    }
    return { align: 'center' }
  }
  
  private convertColor(color: string): { r: number; g: number; b: number } {
    if (color.startsWith('oklch')) {
      return this.oklchToRgb(color)
    }
    
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      const r = parseInt(hex.slice(0, 2), 16) / 255
      const g = parseInt(hex.slice(2, 4), 16) / 255
      const b = parseInt(hex.slice(4, 6), 16) / 255
      return { r, g, b }
    }
    
    if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g)
      if (matches && matches.length >= 3) {
        return {
          r: parseInt(matches[0]) / 255,
          g: parseInt(matches[1]) / 255,
          b: parseInt(matches[2]) / 255
        }
      }
    }
    
    return { r: 0.5, g: 0.5, b: 0.5 }
  }
  
  private oklchToRgb(oklchStr: string): { r: number; g: number; b: number } {
    const matches = oklchStr.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
    if (!matches) {
      return { r: 0.5, g: 0.5, b: 0.5 }
    }
    
    const L = parseFloat(matches[1])
    const C = parseFloat(matches[2])
    const H = parseFloat(matches[3])
    
    const hRad = (H * Math.PI) / 180
    
    const a = C * Math.cos(hRad)
    const b = C * Math.sin(hRad)
    
    const fy = (L + 0.16) / 1.16
    const fx = a / 5 + fy
    const fz = fy - b / 2
    
    const xn = 0.9505
    const yn = 1.0
    const zn = 1.089
    
    const fx3 = fx * fx * fx
    const fy3 = fy * fy * fy
    const fz3 = fz * fz * fz
    
    const epsilon = 0.008856
    const kappa = 903.3
    
    const xr = fx3 > epsilon ? fx3 : (116 * fx - 16) / kappa
    const yr = fy3 > epsilon ? fy3 : (116 * fy - 16) / kappa
    const zr = fz3 > epsilon ? fz3 : (116 * fz - 16) / kappa
    
    const X = xr * xn
    const Y = yr * yn
    const Z = zr * zn
    
    let r = X * 3.2406 + Y * -1.5372 + Z * -0.4986
    let g = X * -0.9689 + Y * 1.8758 + Z * 0.0415
    let b_rgb = X * 0.0557 + Y * -0.204 + Z * 1.057
    
    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g
    b_rgb = b_rgb > 0.0031308 ? 1.055 * Math.pow(b_rgb, 1 / 2.4) - 0.055 : 12.92 * b_rgb
    
    r = Math.max(0, Math.min(1, r))
    g = Math.max(0, Math.min(1, g))
    b_rgb = Math.max(0, Math.min(1, b_rgb))
    
    return { r, g, b: b_rgb }
  }
}

export const pageNumberService = new PageNumberService()
