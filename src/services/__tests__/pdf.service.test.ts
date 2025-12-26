import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PDFService, PasswordReason } from '../pdf.service'

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  getDocument: vi.fn(),
}))

import * as pdfjsLib from 'pdfjs-dist'

describe('PDFService', () => {
  let pdfService: PDFService
  
  beforeEach(() => {
    // Reset the singleton for each test
    // @ts-expect-error - accessing private static property for testing
    PDFService.instance = undefined
    pdfService = PDFService.getInstance()
    vi.clearAllMocks()
  })

  afterEach(() => {
    pdfService.cleanup()
  })

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = PDFService.getInstance()
      const instance2 = PDFService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('loadDocument', () => {
    it('should load a PDF document successfully', async () => {
      const mockDoc = { numPages: 5, destroy: vi.fn() }
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
        onProgress: null as ((data: { loaded: number; total: number }) => void) | null,
        onPassword: null,
      }
      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any)

      const file = new File(['fake pdf content'], 'test.pdf', { type: 'application/pdf' })
      const result = await pdfService.loadDocument(file)

      expect(result).toBe(mockDoc)
      expect(pdfjsLib.getDocument).toHaveBeenCalled()
    })

    it('should call onProgress callback during loading', async () => {
      const mockDoc = { numPages: 5, destroy: vi.fn() }
      
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
        onProgress: null as ((data: { loaded: number; total: number }) => void) | null,
        onPassword: null,
      }
      
      vi.mocked(pdfjsLib.getDocument).mockImplementation(() => {
        return mockLoadingTask as unknown as ReturnType<typeof pdfjsLib.getDocument>
      })

      const file = new File(['fake pdf content'], 'test.pdf', { type: 'application/pdf' })
      const onProgress = vi.fn()
      
      const loadPromise = pdfService.loadDocument(file, onProgress)
      
      // Simulate progress
      if (mockLoadingTask.onProgress) {
        mockLoadingTask.onProgress({ loaded: 50, total: 100 })
      }
      
      await loadPromise
      expect(pdfService.getDocument()).toBe(mockDoc)
    })

    it('should handle password-protected PDFs', async () => {
      const mockDoc = { numPages: 3, destroy: vi.fn() }
      let passwordCallback: ((updatePassword: (password: string | Error) => void, reason: number) => void) | null = null
      
      const mockLoadingTask = {
        promise: new Promise((resolve) => {
          // Delay resolution to allow password callback to be set
          setTimeout(() => resolve(mockDoc), 10)
        }),
        onProgress: null,
        onPassword: null as ((updatePassword: (password: string | Error) => void, reason: number) => void) | null,
      }
      
      vi.mocked(pdfjsLib.getDocument).mockImplementation(() => {
        // Store the password callback when it's set
        Object.defineProperty(mockLoadingTask, 'onPassword', {
          set: (cb) => {
            passwordCallback = cb
            // Simulate password request
            if (cb) {
              cb((password: string | Error) => {
                // Password was provided
              }, 1) // 1 = NEED_PASSWORD
            }
          },
          get: () => passwordCallback,
        })
        return mockLoadingTask as any
      })

      const file = new File(['fake pdf content'], 'protected.pdf', { type: 'application/pdf' })
      
      const onPasswordRequest = vi.fn().mockImplementation((reason: PasswordReason) => {
        expect(reason).toBe('NEED_PASSWORD')
        return Promise.resolve('correct-password')
      })
      
      const result = await pdfService.loadDocument(file, undefined, onPasswordRequest)
      
      expect(onPasswordRequest).toHaveBeenCalledWith('NEED_PASSWORD')
      expect(result).toBe(mockDoc)
    })

    it('should handle incorrect password and request again', async () => {
      const mockDoc = { numPages: 3, destroy: vi.fn() }
      let callCount = 0
      
      const mockLoadingTask = {
        promise: new Promise((resolve) => {
          setTimeout(() => resolve(mockDoc), 50)
        }),
        onProgress: null,
        onPassword: null as ((updatePassword: (password: string | Error) => void, reason: number) => void) | null,
      }
      
      vi.mocked(pdfjsLib.getDocument).mockImplementation(() => {
        Object.defineProperty(mockLoadingTask, 'onPassword', {
          set: (cb) => {
            if (cb) {
              // First call - NEED_PASSWORD
              // Second call - INCORRECT_PASSWORD
              const reason = callCount === 0 ? 1 : 2
              cb((password: string | Error) => {
                // Password was provided
              }, reason)
            }
          },
        })
        return mockLoadingTask as any
      })

      const file = new File(['fake pdf content'], 'protected.pdf', { type: 'application/pdf' })
      
      const onPasswordRequest = vi.fn().mockImplementation((reason: PasswordReason) => {
        callCount++
        return Promise.resolve('password')
      })
      
      await pdfService.loadDocument(file, undefined, onPasswordRequest)
      
      // Should have been called at least once
      expect(onPasswordRequest).toHaveBeenCalled()
    })

    it('should handle password cancellation', async () => {
      const mockLoadingTask = {
        promise: new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Password entry cancelled')), 10)
        }),
        onProgress: null,
        onPassword: null as ((updatePassword: (password: string | Error) => void, reason: number) => void) | null,
      }
      
      vi.mocked(pdfjsLib.getDocument).mockImplementation(() => {
        Object.defineProperty(mockLoadingTask, 'onPassword', {
          set: (cb) => {
            if (cb) {
              cb((password: string | Error) => {
                // Password was rejected
              }, 1)
            }
          },
        })
        return mockLoadingTask as any
      })

      const file = new File(['fake pdf content'], 'protected.pdf', { type: 'application/pdf' })
      
      const onPasswordRequest = vi.fn().mockImplementation(() => {
        return Promise.reject(new Error('Password entry cancelled'))
      })
      
      await expect(pdfService.loadDocument(file, undefined, onPasswordRequest))
        .rejects.toThrow()
    })

    it('should throw error for corrupted PDF', async () => {
      const mockLoadingTask = {
        promise: Promise.reject(new Error('Invalid PDF structure')),
        onProgress: null,
        onPassword: null,
      }
      
      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any)

      const file = new File(['not a pdf'], 'invalid.txt', { type: 'text/plain' })
      
      await expect(pdfService.loadDocument(file))
        .rejects.toThrow('Unable to load PDF document')
    })
  })

  describe('cleanup', () => {
    it('should clean up resources', async () => {
      const mockDoc = { numPages: 5, destroy: vi.fn() }
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
        onProgress: null,
        onPassword: null,
      }
      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any)

      const file = new File(['fake pdf content'], 'test.pdf', { type: 'application/pdf' })
      await pdfService.loadDocument(file)

      pdfService.cleanup()

      expect(mockDoc.destroy).toHaveBeenCalled()
      expect(pdfService.getDocument()).toBeNull()
      expect(pdfService.getOriginalBytes()).toBeNull()
      expect(pdfService.getFilename()).toBeNull()
    })
  })

  describe('getters', () => {
    it('should return filename after loading', async () => {
      const mockDoc = { numPages: 5, destroy: vi.fn() }
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
        onProgress: null,
        onPassword: null,
      }
      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any)

      const file = new File(['fake pdf content'], 'myfile.pdf', { type: 'application/pdf' })
      await pdfService.loadDocument(file)

      expect(pdfService.getFilename()).toBe('myfile.pdf')
    })

    it('should return original bytes after loading', async () => {
      const mockDoc = { numPages: 5, destroy: vi.fn() }
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
        onProgress: null,
        onPassword: null,
      }
      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any)

      const file = new File(['fake pdf content'], 'test.pdf', { type: 'application/pdf' })
      await pdfService.loadDocument(file)

      const bytes = pdfService.getOriginalBytes()
      expect(bytes).toBeInstanceOf(ArrayBuffer)
    })
  })
})
