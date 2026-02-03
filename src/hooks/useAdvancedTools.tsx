import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { compressionService } from '@/services/compression.service'
import { comparisonService } from '@/services/comparison.service'
import type {
  CompressionOptions,
  CompressionResult,
  CompressionProgress,
  BatchCompressionResult,
  ComparisonOptions,
  ComparisonResult,
  ComparisonProgress,
  AdvancedToolsProgress,
} from '@/types/advanced-tools.types'

interface AdvancedToolsContextValue {
  // State
  isProcessing: boolean
  progress: AdvancedToolsProgress | null

  // Compression operations
  compressImage: (file: File, options: CompressionOptions) => Promise<CompressionResult>
  compressImages: (files: File[], options: CompressionOptions) => Promise<BatchCompressionResult>
  previewCompression: (file: File, quality: number) => Promise<{ estimatedSize: number; estimatedRatio: number }>

  // Comparison operations
  comparePDFs: (
    pdf1Bytes: ArrayBuffer,
    pdf2Bytes: ArrayBuffer,
    pageNum: number,
    options?: ComparisonOptions
  ) => Promise<ComparisonResult>
  compareMultiplePages: (
    pdf1Bytes: ArrayBuffer,
    pdf2Bytes: ArrayBuffer,
    pageNumbers: number[],
    options?: ComparisonOptions
  ) => Promise<ComparisonResult[]>
  getComparisonPageCount: (pdfBytes: ArrayBuffer) => Promise<number>

  // Utility functions
  formatFileSize: (bytes: number) => string
  calculateSavings: (original: number, compressed: number) => number
  isCompressibleImage: (file: File) => boolean
  getRecommendedQuality: (fileSize: number) => number
  createSideBySideCanvas: (
    canvas1: HTMLCanvasElement,
    canvas2: HTMLCanvasElement,
    diffCanvas: HTMLCanvasElement
  ) => HTMLCanvasElement
  createOverlayCanvas: (
    originalCanvas: HTMLCanvasElement,
    diffCanvas: HTMLCanvasElement,
    opacity?: number
  ) => HTMLCanvasElement
  exportComparisonAsPng: (canvas: HTMLCanvasElement) => Promise<Blob>
  formatPercentage: (value: number) => string
  isSignificantlyDifferent: (percentDifferent: number, threshold?: number) => boolean
  blobToFile: (blob: Blob, filename: string) => File
}

const AdvancedToolsContext = createContext<AdvancedToolsContextValue | null>(null)

export function useAdvancedTools() {
  const context = useContext(AdvancedToolsContext)
  if (!context) {
    throw new Error('useAdvancedTools must be used within AdvancedToolsProvider')
  }
  return context
}

interface AdvancedToolsProviderProps {
  children: ReactNode
}

export function AdvancedToolsProvider({ children }: AdvancedToolsProviderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<AdvancedToolsProgress | null>(null)

  // Set up compression progress callback
  const setupCompressionProgress = useCallback(() => {
    compressionService.setProgressCallback((p: CompressionProgress) => {
      setProgress(p)
      if (p.stage === 'complete') {
        setTimeout(() => setProgress(null), 1500)
      }
    })
  }, [])

  // Set up comparison progress callback
  const setupComparisonProgress = useCallback(() => {
    comparisonService.setProgressCallback((p: ComparisonProgress) => {
      setProgress(p)
      if (p.stage === 'complete') {
        setTimeout(() => setProgress(null), 1500)
      }
    })
  }, [])

  // Compression operations
  const compressImage = useCallback(
    async (file: File, options: CompressionOptions): Promise<CompressionResult> => {
      setIsProcessing(true)
      setupCompressionProgress()
      try {
        return await compressionService.compressImage(file, options)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupCompressionProgress]
  )

  const compressImages = useCallback(
    async (files: File[], options: CompressionOptions): Promise<BatchCompressionResult> => {
      setIsProcessing(true)
      setupCompressionProgress()
      try {
        return await compressionService.compressImages(files, options)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupCompressionProgress]
  )

  const previewCompression = useCallback(
    async (file: File, quality: number): Promise<{ estimatedSize: number; estimatedRatio: number }> => {
      return await compressionService.previewCompression(file, quality)
    },
    []
  )

  // Comparison operations
  const comparePDFs = useCallback(
    async (
      pdf1Bytes: ArrayBuffer,
      pdf2Bytes: ArrayBuffer,
      pageNum: number,
      options?: ComparisonOptions
    ): Promise<ComparisonResult> => {
      setIsProcessing(true)
      setupComparisonProgress()
      try {
        return await comparisonService.comparePDFs(pdf1Bytes, pdf2Bytes, pageNum, options)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupComparisonProgress]
  )

  const compareMultiplePages = useCallback(
    async (
      pdf1Bytes: ArrayBuffer,
      pdf2Bytes: ArrayBuffer,
      pageNumbers: number[],
      options?: ComparisonOptions
    ): Promise<ComparisonResult[]> => {
      setIsProcessing(true)
      setupComparisonProgress()
      try {
        return await comparisonService.compareMultiplePages(
          pdf1Bytes,
          pdf2Bytes,
          pageNumbers,
          options
        )
      } finally {
        setIsProcessing(false)
      }
    },
    [setupComparisonProgress]
  )

  const getComparisonPageCount = useCallback(async (pdfBytes: ArrayBuffer): Promise<number> => {
    return await comparisonService.getPageCount(pdfBytes)
  }, [])

  // Utility functions (no state needed)
  const formatFileSize = useCallback((bytes: number): string => {
    return compressionService.formatFileSize(bytes)
  }, [])

  const calculateSavings = useCallback((original: number, compressed: number): number => {
    return compressionService.calculateSavings(original, compressed)
  }, [])

  const isCompressibleImage = useCallback((file: File): boolean => {
    return compressionService.isCompressibleImage(file)
  }, [])

  const getRecommendedQuality = useCallback((fileSize: number): number => {
    return compressionService.getRecommendedQuality(fileSize)
  }, [])

  const createSideBySideCanvas = useCallback(
    (
      canvas1: HTMLCanvasElement,
      canvas2: HTMLCanvasElement,
      diffCanvas: HTMLCanvasElement
    ): HTMLCanvasElement => {
      return comparisonService.createSideBySideCanvas(canvas1, canvas2, diffCanvas)
    },
    []
  )

  const createOverlayCanvas = useCallback(
    (
      originalCanvas: HTMLCanvasElement,
      diffCanvas: HTMLCanvasElement,
      opacity?: number
    ): HTMLCanvasElement => {
      return comparisonService.createOverlayCanvas(originalCanvas, diffCanvas, opacity)
    },
    []
  )

  const exportComparisonAsPng = useCallback(async (canvas: HTMLCanvasElement): Promise<Blob> => {
    return await comparisonService.exportComparisonAsPng(canvas)
  }, [])

  const formatPercentage = useCallback((value: number): string => {
    return comparisonService.formatPercentage(value)
  }, [])

  const isSignificantlyDifferent = useCallback(
    (percentDifferent: number, threshold?: number): boolean => {
      return comparisonService.isSignificantlyDifferent(percentDifferent, threshold)
    },
    []
  )

  const blobToFile = useCallback((blob: Blob, filename: string): File => {
    return compressionService.blobToFile(blob, filename)
  }, [])

  const value: AdvancedToolsContextValue = {
    isProcessing,
    progress,
    compressImage,
    compressImages,
    previewCompression,
    comparePDFs,
    compareMultiplePages,
    getComparisonPageCount,
    formatFileSize,
    calculateSavings,
    isCompressibleImage,
    getRecommendedQuality,
    createSideBySideCanvas,
    createOverlayCanvas,
    exportComparisonAsPng,
    formatPercentage,
    isSignificantlyDifferent,
    blobToFile,
  }

  return (
    <AdvancedToolsContext.Provider value={value}>
      {children}
    </AdvancedToolsContext.Provider>
  )
}
