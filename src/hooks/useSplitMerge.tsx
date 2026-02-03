import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { splitMergeService } from '@/services/split-merge.service'
import type {
  SplitOptions,
  SplitResult,
  MergeFile,
  MergeOptions,
  ScaleTarget,
  NupOptions,
  BlankPageDetectionOptions,
  SplitMergeProgress,
} from '@/types/split-merge.types'

interface SplitMergeContextValue {
  // State
  isProcessing: boolean
  progress: SplitMergeProgress | null
  mergeFiles: MergeFile[]

  // Split operations
  splitPDF: (pdfBytes: ArrayBuffer, options: SplitOptions, originalFilename?: string) => Promise<SplitResult>
  extractPages: (pdfBytes: ArrayBuffer, pages: number[], originalFilename?: string) => Promise<Blob>

  // Merge operations
  addMergeFile: (file: File) => Promise<void>
  removeMergeFile: (id: string) => void
  reorderMergeFiles: (fromIndex: number, toIndex: number) => void
  setMergeFilePages: (id: string, pages: number[] | undefined) => void
  clearMergeFiles: () => void
  mergePDFs: (options?: MergeOptions) => Promise<Blob>

  // Page operations
  scalePages: (pdfBytes: ArrayBuffer, target: ScaleTarget) => Promise<Blob>
  createNupLayout: (pdfBytes: ArrayBuffer, options: NupOptions) => Promise<Blob>
  detectBlankPages: (canvasDataArray: ImageData[], options: BlankPageDetectionOptions) => Promise<number[]>
  removePages: (pdfBytes: ArrayBuffer, pagesToRemove: number[]) => Promise<Blob>

  // Download helpers
  downloadSplitResults: (results: SplitResult, asZip?: boolean) => Promise<void>
  downloadBlob: (blob: Blob, filename: string) => void
  getPageCount: (file: File) => Promise<number>
}

const SplitMergeContext = createContext<SplitMergeContextValue | null>(null)

export function useSplitMerge() {
  const context = useContext(SplitMergeContext)
  if (!context) {
    throw new Error('useSplitMerge must be used within SplitMergeProvider')
  }
  return context
}

interface SplitMergeProviderProps {
  children: ReactNode
}

export function SplitMergeProvider({ children }: SplitMergeProviderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<SplitMergeProgress | null>(null)
  const [mergeFiles, setMergeFiles] = useState<MergeFile[]>([])

  // Set up progress callback
  const setupProgress = useCallback(() => {
    splitMergeService.setProgressCallback((p) => {
      setProgress(p)
      if (p.stage === 'complete') {
        setTimeout(() => setProgress(null), 1500)
      }
    })
  }, [])

  // Split operations
  const splitPDF = useCallback(
    async (pdfBytes: ArrayBuffer, options: SplitOptions, originalFilename?: string): Promise<SplitResult> => {
      setIsProcessing(true)
      setupProgress()
      try {
        return await splitMergeService.splitPDF(pdfBytes, options, originalFilename)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupProgress]
  )

  const extractPages = useCallback(
    async (pdfBytes: ArrayBuffer, pages: number[], originalFilename?: string): Promise<Blob> => {
      setIsProcessing(true)
      setupProgress()
      try {
        return await splitMergeService.extractPages(pdfBytes, pages, originalFilename)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupProgress]
  )

  // Merge file management
  const addMergeFile = useCallback(async (file: File) => {
    const pageCount = await splitMergeService.getPageCount(file)
    const newFile: MergeFile = {
      id: `merge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      pageCount,
      order: mergeFiles.length,
    }
    setMergeFiles((prev) => [...prev, newFile])
  }, [mergeFiles.length])

  const removeMergeFile = useCallback((id: string) => {
    setMergeFiles((prev) => {
      const filtered = prev.filter((f) => f.id !== id)
      // Update order indices
      return filtered.map((f, index) => ({ ...f, order: index }))
    })
  }, [])

  const reorderMergeFiles = useCallback((fromIndex: number, toIndex: number) => {
    setMergeFiles((prev) => {
      const newFiles = [...prev]
      const [moved] = newFiles.splice(fromIndex, 1)
      newFiles.splice(toIndex, 0, moved)
      // Update order indices
      return newFiles.map((f, index) => ({ ...f, order: index }))
    })
  }, [])

  const setMergeFilePages = useCallback((id: string, pages: number[] | undefined) => {
    setMergeFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selectedPages: pages } : f))
    )
  }, [])

  const clearMergeFiles = useCallback(() => {
    setMergeFiles([])
  }, [])

  const mergePDFs = useCallback(
    async (options?: MergeOptions): Promise<Blob> => {
      if (mergeFiles.length === 0) {
        throw new Error('No files to merge')
      }
      setIsProcessing(true)
      setupProgress()
      try {
        return await splitMergeService.mergePDFs(mergeFiles, options)
      } finally {
        setIsProcessing(false)
      }
    },
    [mergeFiles, setupProgress]
  )

  // Page operations
  const scalePages = useCallback(
    async (pdfBytes: ArrayBuffer, target: ScaleTarget): Promise<Blob> => {
      setIsProcessing(true)
      setupProgress()
      try {
        return await splitMergeService.scalePages(pdfBytes, target)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupProgress]
  )

  const createNupLayout = useCallback(
    async (pdfBytes: ArrayBuffer, options: NupOptions): Promise<Blob> => {
      setIsProcessing(true)
      setupProgress()
      try {
        return await splitMergeService.createNupLayout(pdfBytes, options)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupProgress]
  )

  const detectBlankPages = useCallback(
    async (canvasDataArray: ImageData[], options: BlankPageDetectionOptions): Promise<number[]> => {
      setIsProcessing(true)
      setupProgress()
      try {
        return await splitMergeService.detectBlankPages(canvasDataArray, options)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupProgress]
  )

  const removePages = useCallback(
    async (pdfBytes: ArrayBuffer, pagesToRemove: number[]): Promise<Blob> => {
      setIsProcessing(true)
      setupProgress()
      try {
        return await splitMergeService.removePages(pdfBytes, pagesToRemove)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupProgress]
  )

  // Download helpers
  const downloadSplitResults = useCallback(
    async (results: SplitResult, asZip: boolean = true): Promise<void> => {
      await splitMergeService.downloadSplitResults(results, asZip)
    },
    []
  )

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    splitMergeService.downloadBlob(blob, filename)
  }, [])

  const getPageCount = useCallback(async (file: File): Promise<number> => {
    return await splitMergeService.getPageCount(file)
  }, [])

  const value: SplitMergeContextValue = {
    isProcessing,
    progress,
    mergeFiles,
    splitPDF,
    extractPages,
    addMergeFile,
    removeMergeFile,
    reorderMergeFiles,
    setMergeFilePages,
    clearMergeFiles,
    mergePDFs,
    scalePages,
    createNupLayout,
    detectBlankPages,
    removePages,
    downloadSplitResults,
    downloadBlob,
    getPageCount,
  }

  return (
    <SplitMergeContext.Provider value={value}>
      {children}
    </SplitMergeContext.Provider>
  )
}
