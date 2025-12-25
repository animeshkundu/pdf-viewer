import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { pdfService, PasswordReason } from '@/services/pdf.service'
import { annotationService } from '@/services/annotation.service'
import { pageManagementService } from '@/services/page-management.service'
import { searchService } from '@/services/search.service'
import { toast } from 'sonner'

interface PasswordState {
  isOpen: boolean
  isIncorrectPassword: boolean
  resolve: ((password: string) => void) | null
  reject: ((error: Error) => void) | null
}

interface PDFContextValue {
  document: PDFDocumentProxy | null
  file: File | null
  currentPage: number
  zoom: number | 'fit-width' | 'fit-page'
  isLoading: boolean
  loadProgress: number
  error: string | null
  passwordState: PasswordState
  
  loadDocument: (file: File) => Promise<void>
  setCurrentPage: (page: number) => void
  setZoom: (zoom: number | 'fit-width' | 'fit-page') => void
  cleanup: () => void
  getOriginalBytes: () => ArrayBuffer | null
  getFilename: () => string | null
  submitPassword: (password: string) => void
  cancelPassword: () => void
}

const PDFContext = createContext<PDFContextValue | undefined>(undefined)

const initialPasswordState: PasswordState = {
  isOpen: false,
  isIncorrectPassword: false,
  resolve: null,
  reject: null,
}

export function PDFProvider({ children }: { children: ReactNode }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState<number | 'fit-width' | 'fit-page'>('fit-width')
  const [isLoading, setIsLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [passwordState, setPasswordState] = useState<PasswordState>(initialPasswordState)
  
  // Use ref to track the current password promise callbacks
  const passwordCallbacksRef = useRef<{
    resolve: ((password: string) => void) | null
    reject: ((error: Error) => void) | null
  }>({ resolve: null, reject: null })

  const handlePasswordRequest = useCallback((reason: PasswordReason): Promise<string> => {
    return new Promise((resolve, reject) => {
      passwordCallbacksRef.current = { resolve, reject }
      setPasswordState({
        isOpen: true,
        isIncorrectPassword: reason === 'INCORRECT_PASSWORD',
        resolve,
        reject,
      })
    })
  }, [])

  const submitPassword = useCallback((password: string) => {
    const { resolve } = passwordCallbacksRef.current
    if (resolve) {
      resolve(password)
      // Don't close the dialog yet - it will be closed on success or show error on failure
      setPasswordState(prev => ({ ...prev, isOpen: false }))
      passwordCallbacksRef.current = { resolve: null, reject: null }
    }
  }, [])

  const cancelPassword = useCallback(() => {
    const { reject } = passwordCallbacksRef.current
    if (reject) {
      reject(new Error('Password entry cancelled'))
      passwordCallbacksRef.current = { resolve: null, reject: null }
    }
    setPasswordState(initialPasswordState)
    setIsLoading(false)
  }, [])

  const loadDocument = useCallback(async (newFile: File) => {
    setIsLoading(true)
    setError(null)
    setLoadProgress(0)
    
    try {
      annotationService.clearAnnotations()
      searchService.cleanup()
      
      const doc = await pdfService.loadDocument(
        newFile,
        (progress) => {
          setLoadProgress(progress)
        },
        handlePasswordRequest
      )
      
      pageManagementService.initialize(doc.numPages)
      
      setDocument(doc)
      setFile(newFile)
      setCurrentPage(1)
      setIsLoading(false)
      setLoadProgress(100)
      setPasswordState(initialPasswordState)
      
      const pageCount = doc.numPages
      const pageWord = pageCount === 1 ? 'page' : 'pages'
      toast.success('Loaded ' + pageCount + ' ' + pageWord)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load PDF'
      // Don't show error toast if user cancelled password entry
      if (message !== 'Password entry cancelled') {
        setError(message)
        toast.error(message)
      }
      setIsLoading(false)
      setPasswordState(initialPasswordState)
    }
  }, [handlePasswordRequest])

  const cleanup = useCallback(() => {
    pdfService.cleanup()
    annotationService.clearAnnotations()
    searchService.cleanup()
    pageManagementService.initialize(0)
    setDocument(null)
    setFile(null)
    setCurrentPage(1)
    setZoom('fit-width')
    setError(null)
    setPasswordState(initialPasswordState)
  }, [])

  const getOriginalBytes = useCallback(() => {
    return pdfService.getOriginalBytes()
  }, [])

  const getFilename = useCallback(() => {
    return pdfService.getFilename()
  }, [])

  const contextValue = {
    document,
    file,
    currentPage,
    zoom,
    isLoading,
    loadProgress,
    error,
    passwordState,
    loadDocument,
    setCurrentPage,
    setZoom,
    cleanup,
    getOriginalBytes,
    getFilename,
    submitPassword,
    cancelPassword,
  }

  return (
    <PDFContext.Provider value={contextValue}>
      {children}
    </PDFContext.Provider>
  )
}

export function usePDF() {
  const context = useContext(PDFContext)
  if (!context) {
    throw new Error('usePDF must be used within PDFProvider')
  }
  return context
}
