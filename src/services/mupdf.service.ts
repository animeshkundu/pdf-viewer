/**
 * MuPDF Service
 *
 * Main thread service that communicates with the MuPDF.js Web Worker.
 * Provides a promise-based API for PDF text editing operations.
 */

import type {
  MuPDFWorkerRequest,
  MuPDFWorkerResponse,
  MuPDFEditOperation,
  MuPDFStructuredText,
  MuPDFDocumentInfo,
  MuPDFServiceInterface,
} from '@/types/mupdf.types'

class MuPDFService implements MuPDFServiceInterface {
  private static instance: MuPDFService
  private worker: Worker | null = null
  private messageId = 0
  private pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>()
  private progressCallback?: (progress: { stage: string; percent: number; message: string }) => void
  private _isInitialized = false

  private constructor() {}

  static getInstance(): MuPDFService {
    if (!MuPDFService.instance) {
      MuPDFService.instance = new MuPDFService()
    }
    return MuPDFService.instance
  }

  /**
   * Set callback for progress updates
   */
  onProgress(callback: (progress: { stage: string; percent: number; message: string }) => void): void {
    this.progressCallback = callback
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this._isInitialized
  }

  /**
   * Initialize the worker
   */
  async initialize(): Promise<void> {
    if (this.worker) return

    return new Promise((resolve, reject) => {
      try {
        // Create worker using Vite's URL import pattern
        this.worker = new Worker(
          new URL('../workers/mupdf.worker.ts', import.meta.url),
          { type: 'module' }
        )

        this.worker.onmessage = (e: MessageEvent<MuPDFWorkerResponse>) => {
          const { id, result, error, progress } = e.data

          // Handle progress updates (id = -1)
          if (progress && id === -1) {
            this.progressCallback?.(progress)
            return
          }

          // Handle request responses
          const handler = this.pending.get(id)
          if (handler) {
            if (error) {
              handler.reject(new Error(error))
            } else {
              handler.resolve(result)
            }
            this.pending.delete(id)
          }
        }

        this.worker.onerror = (error) => {
          console.error('MuPDF Worker error:', error)
          reject(new Error(`Worker error: ${error.message}`))
        }

        // Initialize the worker
        this.send('initialize')
          .then(() => {
            this._isInitialized = true
            resolve()
          })
          .catch(reject)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Send a message to the worker and wait for response
   */
  private send<T>(type: string, payload?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'))
        return
      }

      const id = ++this.messageId
      this.pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      })

      const message: MuPDFWorkerRequest = { id, type: type as MuPDFWorkerRequest['type'], payload }
      this.worker.postMessage(message)
    })
  }

  /**
   * Load a PDF document
   */
  async loadDocument(bytes: ArrayBuffer): Promise<MuPDFDocumentInfo> {
    await this.initialize()
    return this.send<MuPDFDocumentInfo>('loadDocument', { bytes })
  }

  /**
   * Extract structured text from a page
   * @param pageNum 0-indexed page number
   */
  async extractText(pageNum: number): Promise<MuPDFStructuredText> {
    return this.send<MuPDFStructuredText>('extractText', { pageNum })
  }

  /**
   * Apply a text edit operation
   */
  async applyEdit(edit: MuPDFEditOperation): Promise<void> {
    await this.send<{ success: boolean }>('applyEdit', edit)
  }

  /**
   * Save the document with all edits
   */
  async saveDocument(): Promise<Uint8Array> {
    return this.send<Uint8Array>('saveDocument')
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (!this.worker) return

    try {
      await this.send('cleanup')
    } finally {
      this.worker.terminate()
      this.worker = null
      this._isInitialized = false
      this.pending.clear()
    }
  }

  /**
   * Terminate the worker immediately without cleanup
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this._isInitialized = false
      this.pending.clear()
    }
  }
}

export const mupdfService = MuPDFService.getInstance()
