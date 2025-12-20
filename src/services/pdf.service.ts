import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export class PDFService {
  private static instance: PDFService
  private documentProxy: PDFDocumentProxy | null = null
  private pageCache: Map<string, HTMLCanvasElement> = new Map()
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024

  private constructor() {}

  static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService()
    }
    return PDFService.instance
  }

  async loadDocument(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<PDFDocumentProxy> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })

      if (onProgress) {
        loadingTask.onProgress = ({ loaded, total }) => {
          const progress = (loaded / total) * 100
          onProgress(progress)
        }
      }

      this.documentProxy = await loadingTask.promise
      return this.documentProxy
    } catch (error) {
      console.error('Failed to load PDF:', error)
      throw new Error('Unable to load PDF document. The file may be corrupted or invalid.')
    }
  }

  async getPage(pageNumber: number): Promise<PDFPageProxy> {
    if (!this.documentProxy) {
      throw new Error('No document loaded')
    }
    return await this.documentProxy.getPage(pageNumber)
  }

  async renderPage(
    page: PDFPageProxy,
    scale: number,
    canvas: HTMLCanvasElement
  ): Promise<void> {
    const cacheKey = `${page.pageNumber}-${scale}`
    
    const cached = this.pageCache.get(cacheKey)
    if (cached && canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = cached.width
        canvas.height = cached.height
        ctx.drawImage(cached, 0, 0)
        return
      }
    }

    const viewport = page.getViewport({ scale })
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Could not get canvas context')
    }

    canvas.width = viewport.width
    canvas.height = viewport.height

    const renderTask = page.render({
      canvasContext: context,
      viewport: viewport,
    } as any)

    await renderTask.promise

    const cacheCanvas = document.createElement('canvas')
    cacheCanvas.width = canvas.width
    cacheCanvas.height = canvas.height
    const cacheCtx = cacheCanvas.getContext('2d')
    if (cacheCtx) {
      cacheCtx.drawImage(canvas, 0, 0)
      this.cacheCanvas(cacheKey, cacheCanvas)
    }
  }

  private cacheCanvas(key: string, canvas: HTMLCanvasElement): void {
    const size = canvas.width * canvas.height * 4
    
    if (this.getCacheSize() + size > this.MAX_CACHE_SIZE) {
      this.evictOldestCache()
    }
    
    this.pageCache.set(key, canvas)
  }

  private getCacheSize(): number {
    let total = 0
    this.pageCache.forEach((canvas) => {
      total += canvas.width * canvas.height * 4
    })
    return total
  }

  private evictOldestCache(): void {
    const firstKey = this.pageCache.keys().next().value
    if (firstKey) {
      this.pageCache.delete(firstKey)
    }
  }

  clearCache(): void {
    this.pageCache.clear()
  }

  getDocument(): PDFDocumentProxy | null {
    return this.documentProxy
  }

  async getPageDimensions(pageNumber: number): Promise<{ width: number; height: number }> {
    const page = await this.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 1 })
    return { width: viewport.width, height: viewport.height }
  }

  cleanup(): void {
    this.clearCache()
    if (this.documentProxy) {
      this.documentProxy.destroy()
      this.documentProxy = null
    }
  }
}

export const pdfService = PDFService.getInstance()
