import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { pdfService } from '@/services/pdf.service'
import { annotationService } from '@/services/annotation.service'
import { pageManagementService } from '@/services/page-management.service'
import { searchService } from '@/services/search.service'
import { toast } from 'sonner'

interface PDFContextValue {
  document: PDFDocumentProxy | null
  file: File | null
  currentPage: number
  zoom: number | 'fit-width' | 'fit-page'
  isLoading: boolean
  loadProgress: number
  error: string | null
  
  loadDocument: (file: File) => Promise<void>
  setCurrentPage: (page: number) => void
  setZoom: (zoom: number | 'fit-width' | 'fit-page') => void
  cleanup: () => void
  getOriginalBytes: () => ArrayBuffer | null
  getFilename: () => string | null
}

const PDFContext = createContext<PDFContextValue | undefined>(undefined)

export function PDFProvider({ children }: { children: ReactNode }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState<number | 'fit-width' | 'fit-page'>('fit-width')
  const [isLoading, setIsLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const loadDocument = useCallback(async (newFile: File) => {
    setIsLoading(true)
    setError(null)
    setLoadProgress(0)
    
    try {
      annotationService.clearAnnotations()
      searchService.cleanup()
      
      const doc = await pdfService.loadDocument(newFile, (progress) => {
        setLoadProgress(progress)
      })
      
      pageManagementService.initialize(doc.numPages)
      
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
    annotationService.clearAnnotations()
    searchService.cleanup()
    pageManagementService.initialize(0)
    setDocument(null)
    setFile(null)
    setCurrentPage(1)
    setZoom('fit-width')
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
