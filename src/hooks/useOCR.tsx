import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ocrService } from '@/services/ocr.service'
import type {
  OCRProgress,
  OCRLanguage,
  SearchablePDFResult,
  ExtractedTextResult,
} from '@/types/ocr.types'

interface OCRContextValue {
  // State
  isProcessing: boolean
  progress: OCRProgress | null
  isInitialized: boolean

  // OCR operations
  makeSearchable: (
    pdfBytes: ArrayBuffer,
    language: OCRLanguage,
    onProgress?: (progress: number, page: number, total: number) => void
  ) => Promise<SearchablePDFResult>

  extractText: (
    pdfBytes: ArrayBuffer,
    language: OCRLanguage,
    pages?: number[],
    onProgress?: (progress: number, page: number, total: number) => void
  ) => Promise<ExtractedTextResult>

  // Control
  cancel: () => void
  terminate: () => Promise<void>
}

const OCRContext = createContext<OCRContextValue | null>(null)

export function useOCR() {
  const context = useContext(OCRContext)
  if (!context) {
    throw new Error('useOCR must be used within OCRProvider')
  }
  return context
}

interface OCRProviderProps {
  children: ReactNode
}

export function OCRProvider({ children }: OCRProviderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<OCRProgress | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Set up progress callback
  const setupProgress = useCallback(() => {
    ocrService.setProgressCallback((p) => {
      setProgress(p)
      if (p.stage === 'complete') {
        setTimeout(() => setProgress(null), 1500)
      }
      if (p.stage === 'initializing' && p.progress === 100) {
        setIsInitialized(true)
      }
    })
  }, [])

  // Make PDF searchable
  const makeSearchable = useCallback(
    async (
      pdfBytes: ArrayBuffer,
      language: OCRLanguage,
      onProgress?: (progress: number, page: number, total: number) => void
    ): Promise<SearchablePDFResult> => {
      setIsProcessing(true)
      setupProgress()
      try {
        return await ocrService.makeSearchable(pdfBytes, language, onProgress)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupProgress]
  )

  // Extract text from PDF
  const extractText = useCallback(
    async (
      pdfBytes: ArrayBuffer,
      language: OCRLanguage,
      pages?: number[],
      onProgress?: (progress: number, page: number, total: number) => void
    ): Promise<ExtractedTextResult> => {
      setIsProcessing(true)
      setupProgress()
      try {
        return await ocrService.extractTextFromPDF(pdfBytes, language, pages, onProgress)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupProgress]
  )

  // Cancel ongoing operation
  const cancel = useCallback(() => {
    ocrService.cancel()
  }, [])

  // Terminate worker
  const terminate = useCallback(async () => {
    await ocrService.terminate()
    setIsInitialized(false)
    setProgress(null)
  }, [])

  const value: OCRContextValue = {
    isProcessing,
    progress,
    isInitialized,
    makeSearchable,
    extractText,
    cancel,
    terminate,
  }

  return <OCRContext.Provider value={value}>{children}</OCRContext.Provider>
}
