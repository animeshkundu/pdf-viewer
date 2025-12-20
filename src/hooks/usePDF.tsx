import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { pdfService } from '@/services/pdf.service'
import { toast } from 'sonner'

interface PDFContextValue {
  document: PDFDocumentProxy | null
  file: File | null
  currentPage: number
  zoom: number
  isLoading: boolean
  loadProgress: number
  error: string | null
  
  loadDocument: (file: File) => Promise<void>
  setCurrentPage: (page: number) => void
  setZoom: (zoom: number) => void
  cleanup: () => void
  getOriginalBytes: () => ArrayBuffer | null
  getFilename: () => string | null
}

const PDFContext = createContext<PDFContextValue | undefined>(undefined)

export function PDFProvider({ children }: { children: ReactNode }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1.0)
  const [isLoading, setIsLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const loadDocument = useCallback(async (newFile: File) => {
    setIsLoading(true)
    setError(null)
    setLoadProgress(0)
    
    try {
      const doc = await pdfService.loadDocument(newFile, (progress) => {
        setLoadProgress(progress)
      })
      
      setDocument(doc)
      setFile(newFile)
      setCurrentPage(1)
      setIsLoading(false)
      setLoadProgress(100)
      
      const pageCount = doc.numPages
      const pageWord = pageCount === 1 ? 'page' : 'pages'
      toast.success('Loaded ' + pageCount + ' ' + pageWord)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load PDF'
      setError(message)
      setIsLoading(false)
      toast.error(message)
    }
  }, [])

  const cleanup = useCallback(() => {
    pdfService.cleanup()
    setDocument(null)
    setFile(null)
    setCurrentPage(1)
    setZoom(1.0)
    setError(null)
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
    loadDocument,
    setCurrentPage,
    setZoom,
    cleanup,
    getOriginalBytes,
    getFilename,
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
