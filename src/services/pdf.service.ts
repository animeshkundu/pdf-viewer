import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export type PasswordReason = 'NEED_PASSWORD' | 'INCORRECT_PASSWORD'

export class PDFService {
  private static instance: PDFService
  private documentProxy: PDFDocumentProxy | null = null
  private pageCache: Map<string, HTMLCanvasElement> = new Map()
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024
  private originalBytes: ArrayBuffer | null = null
  private filename: string | null = null

  private constructor() {}

  static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService()
    }
    return PDFService.instance
  }

  async loadDocument(
    file: File,
    onProgress?: (progress: number) => void,
    onPasswordRequest?: (reason: PasswordReason) => Promise<string>
  ): Promise<PDFDocumentProxy> {
    try {
      if (this.documentProxy) {
        await this.documentProxy.destroy()
        this.documentProxy = null
      }
      this.clearCache()
      
      const arrayBuffer = await file.arrayBuffer()
      this.originalBytes = arrayBuffer
      this.filename = file.name
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })

      if (onProgress) {
        loadingTask.onProgress = ({ loaded, total }) => {
          const progress = (loaded / total) * 100
          onProgress(progress)
        }
      }

      // Handle password-protected PDFs
      if (onPasswordRequest) {
        loadingTask.onPassword = (updatePassword: (password: string | Error) => void, reason: number) => {
          const passwordReason: PasswordReason = reason === 1 ? 'NEED_PASSWORD' : 'INCORRECT_PASSWORD'
          
          onPasswordRequest(passwordReason)
            .then((password) => {
              updatePassword(password)
            })
            .catch((err) => {
              // User cancelled or error occurred
              updatePassword(err instanceof Error ? err : new Error('Password entry cancelled'))
            })
        }
      }

      this.documentProxy = await loadingTask.promise
      return this.documentProxy
    } catch (error) {
      // Check if it's a password error that wasn't handled
      if (error instanceof Error && error.name === 'PasswordException') {
        throw new Error('This PDF is password protected.')
      }
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
    canvas: HTMLCanvasElement,
    rotation: number = 0
  ): Promise<void> {
    const devicePixelRatio = window.devicePixelRatio || 1
    const cacheKey = `${page.pageNumber}-${scale}-${rotation}-${devicePixelRatio}`
    
    const cached = this.pageCache.get(cacheKey)
    if (cached && canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = cached.width
        canvas.height = cached.height
        canvas.style.width = `${cached.width / devicePixelRatio}px`
        canvas.style.height = `${cached.height / devicePixelRatio}px`
        ctx.drawImage(cached, 0, 0)
        return
      }
    }

    const viewport = page.getViewport({ scale: scale * devicePixelRatio, rotation })
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Could not get canvas context')
    }

    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = `${viewport.width / devicePixelRatio}px`
    canvas.style.height = `${viewport.height / devicePixelRatio}px`

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

  getOriginalBytes(): ArrayBuffer | null {
    return this.originalBytes
  }

  getFilename(): string | null {
    return this.filename
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
    this.originalBytes = null
    this.filename = null
  }
}

export const pdfService = PDFService.getInstance()
