import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { securityService } from '@/services/security.service'
import type {
  SecurityProgress,
  SanitizeOptions,
  SanitizeResult,
  PDFMetadata,
  SensitiveDataType,
  ScanResult,
  ScanSummary,
} from '@/types/security.types'

interface SecurityContextValue {
  // State
  isProcessing: boolean
  progress: SecurityProgress | null

  // Metadata operations
  getMetadata: (pdfBytes: ArrayBuffer) => Promise<PDFMetadata>
  sanitizePDF: (pdfBytes: ArrayBuffer, options: SanitizeOptions) => Promise<SanitizeResult>

  // Scanning operations
  scanTextForSensitiveData: (
    text: string,
    enabledPatterns: SensitiveDataType[],
    pageNumber?: number
  ) => ScanResult[]
  scanPagesForSensitiveData: (
    pageTexts: { pageNumber: number; text: string }[],
    enabledPatterns: SensitiveDataType[]
  ) => { results: ScanResult[]; summary: ScanSummary }

  // Utility
  validatePattern: (pattern: string) => { valid: boolean; error?: string }
  getAvailablePatterns: () => ReturnType<typeof securityService.getAvailablePatterns>
  isEncryptionSupported: () => boolean
  getEncryptionSupportMessage: () => string
  downloadBlob: (blob: Blob, filename: string) => void
}

const SecurityContext = createContext<SecurityContextValue | null>(null)

export function useSecurity() {
  const context = useContext(SecurityContext)
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider')
  }
  return context
}

interface SecurityProviderProps {
  children: ReactNode
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<SecurityProgress | null>(null)

  // Set up progress callback
  const setupProgress = useCallback(() => {
    securityService.setProgressCallback((p) => {
      setProgress(p)
      if (p.stage === 'complete') {
        setTimeout(() => setProgress(null), 1500)
      }
    })
  }, [])

  // Metadata operations
  const getMetadata = useCallback(
    async (pdfBytes: ArrayBuffer): Promise<PDFMetadata> => {
      return await securityService.getMetadata(pdfBytes)
    },
    []
  )

  const sanitizePDF = useCallback(
    async (pdfBytes: ArrayBuffer, options: SanitizeOptions): Promise<SanitizeResult> => {
      setIsProcessing(true)
      setupProgress()
      try {
        return await securityService.sanitizePDF(pdfBytes, options)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupProgress]
  )

  // Scanning operations
  const scanTextForSensitiveData = useCallback(
    (
      text: string,
      enabledPatterns: SensitiveDataType[],
      pageNumber?: number
    ): ScanResult[] => {
      return securityService.scanTextForSensitiveData(text, enabledPatterns, pageNumber)
    },
    []
  )

  const scanPagesForSensitiveData = useCallback(
    (
      pageTexts: { pageNumber: number; text: string }[],
      enabledPatterns: SensitiveDataType[]
    ): { results: ScanResult[]; summary: ScanSummary } => {
      setIsProcessing(true)
      setupProgress()
      try {
        return securityService.scanPagesForSensitiveData(pageTexts, enabledPatterns)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupProgress]
  )

  // Utility functions
  const validatePattern = useCallback(
    (pattern: string): { valid: boolean; error?: string } => {
      return securityService.validatePattern(pattern)
    },
    []
  )

  const getAvailablePatterns = useCallback(() => {
    return securityService.getAvailablePatterns()
  }, [])

  const isEncryptionSupported = useCallback(() => {
    return securityService.isEncryptionSupported()
  }, [])

  const getEncryptionSupportMessage = useCallback(() => {
    return securityService.getEncryptionSupportMessage()
  }, [])

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    securityService.downloadBlob(blob, filename)
  }, [])

  const value: SecurityContextValue = {
    isProcessing,
    progress,
    getMetadata,
    sanitizePDF,
    scanTextForSensitiveData,
    scanPagesForSensitiveData,
    validatePattern,
    getAvailablePatterns,
    isEncryptionSupported,
    getEncryptionSupportMessage,
    downloadBlob,
  }

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  )
}
