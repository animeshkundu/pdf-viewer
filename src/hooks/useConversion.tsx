import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { conversionService } from '@/services/conversion.service'
import type {
  ImagesToPDFOptions,
  PDFToImagesOptions,
  HTMLToPDFOptions,
  MarkdownToPDFOptions,
  ConversionProgress,
  PDFToImagesResult,
  ImageFile,
} from '@/types/conversion.types'

interface ConversionContextValue {
  // State
  isProcessing: boolean
  progress: ConversionProgress | null
  imageFiles: ImageFile[]

  // Image to PDF operations
  addImageFile: (file: File) => Promise<void>
  addImageFiles: (files: File[]) => Promise<void>
  removeImageFile: (id: string) => void
  reorderImageFiles: (fromIndex: number, toIndex: number) => void
  clearImageFiles: () => void
  imagesToPDF: (options: ImagesToPDFOptions) => Promise<Blob>

  // PDF to Images operations
  pdfToImages: (pdfBytes: ArrayBuffer, options: PDFToImagesOptions) => Promise<PDFToImagesResult>

  // HTML/Markdown to PDF operations
  htmlToPDF: (html: string, options: HTMLToPDFOptions) => Promise<Blob>
  markdownToPDF: (markdown: string, options?: MarkdownToPDFOptions) => Promise<Blob>

  // Download helpers
  downloadAsZip: (result: PDFToImagesResult, zipFilename?: string) => Promise<void>
  downloadBlob: (blob: Blob, filename: string) => void
}

const ConversionContext = createContext<ConversionContextValue | null>(null)

export function useConversion() {
  const context = useContext(ConversionContext)
  if (!context) {
    throw new Error('useConversion must be used within ConversionProvider')
  }
  return context
}

interface ConversionProviderProps {
  children: ReactNode
}

export function ConversionProvider({ children }: ConversionProviderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ConversionProgress | null>(null)
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([])

  // Set up progress callback
  const setupProgress = useCallback(() => {
    conversionService.setProgressCallback((p) => {
      setProgress(p)
      if (p.stage === 'complete') {
        setTimeout(() => setProgress(null), 1500)
      }
    })
  }, [])

  // Image file management
  const addImageFile = useCallback(async (file: File) => {
    try {
      const [dimensions, preview] = await Promise.all([
        conversionService.getImageDimensions(file),
        conversionService.createImagePreview(file),
      ])

      const newFile: ImageFile = {
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        preview,
        width: dimensions.width,
        height: dimensions.height,
        order: imageFiles.length,
      }

      setImageFiles((prev) => [...prev, newFile])
    } catch {
      throw new Error(`Failed to process image: ${file.name}`)
    }
  }, [imageFiles.length])

  const addImageFiles = useCallback(async (files: File[]) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp']
    const errors: string[] = []

    for (const file of files) {
      if (!validTypes.includes(file.type.toLowerCase())) {
        errors.push(`${file.name}: unsupported format`)
        continue
      }

      try {
        const [dimensions, preview] = await Promise.all([
          conversionService.getImageDimensions(file),
          conversionService.createImagePreview(file),
        ])

        const newFile: ImageFile = {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          preview,
          width: dimensions.width,
          height: dimensions.height,
          order: 0, // Will be updated below
        }

        setImageFiles((prev) => {
          const updated = [...prev, { ...newFile, order: prev.length }]
          return updated
        })
      } catch {
        errors.push(`${file.name}: failed to process`)
      }
    }

    if (errors.length > 0) {
      throw new Error(`Some files could not be added:\n${errors.join('\n')}`)
    }
  }, [])

  const removeImageFile = useCallback((id: string) => {
    setImageFiles((prev) => {
      const filtered = prev.filter((f) => f.id !== id)
      // Update order indices
      return filtered.map((f, index) => ({ ...f, order: index }))
    })
  }, [])

  const reorderImageFiles = useCallback((fromIndex: number, toIndex: number) => {
    setImageFiles((prev) => {
      const newFiles = [...prev]
      const [moved] = newFiles.splice(fromIndex, 1)
      newFiles.splice(toIndex, 0, moved)
      // Update order indices
      return newFiles.map((f, index) => ({ ...f, order: index }))
    })
  }, [])

  const clearImageFiles = useCallback(() => {
    setImageFiles([])
  }, [])

  // Conversion operations
  const imagesToPDF = useCallback(
    async (options: ImagesToPDFOptions): Promise<Blob> => {
      if (imageFiles.length === 0) {
        throw new Error('No images to convert')
      }

      setIsProcessing(true)
      setupProgress()

      try {
        const sortedFiles = [...imageFiles].sort((a, b) => a.order - b.order)
        const files = sortedFiles.map((f) => f.file)
        return await conversionService.imagesToPDF(files, options)
      } finally {
        setIsProcessing(false)
      }
    },
    [imageFiles, setupProgress]
  )

  const pdfToImages = useCallback(
    async (pdfBytes: ArrayBuffer, options: PDFToImagesOptions): Promise<PDFToImagesResult> => {
      setIsProcessing(true)
      setupProgress()

      try {
        return await conversionService.pdfToImages(pdfBytes, options)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupProgress]
  )

  const htmlToPDF = useCallback(
    async (html: string, options: HTMLToPDFOptions): Promise<Blob> => {
      setIsProcessing(true)
      setupProgress()

      try {
        return await conversionService.htmlToPDF(html, options)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupProgress]
  )

  const markdownToPDF = useCallback(
    async (markdown: string, options?: MarkdownToPDFOptions): Promise<Blob> => {
      setIsProcessing(true)
      setupProgress()

      try {
        return await conversionService.markdownToPDF(markdown, options)
      } finally {
        setIsProcessing(false)
      }
    },
    [setupProgress]
  )

  // Download helpers
  const downloadAsZip = useCallback(
    async (result: PDFToImagesResult, zipFilename?: string): Promise<void> => {
      await conversionService.downloadAsZip(result, zipFilename)
    },
    []
  )

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    conversionService.downloadBlob(blob, filename)
  }, [])

  const value: ConversionContextValue = {
    isProcessing,
    progress,
    imageFiles,
    addImageFile,
    addImageFiles,
    removeImageFile,
    reorderImageFiles,
    clearImageFiles,
    imagesToPDF,
    pdfToImages,
    htmlToPDF,
    markdownToPDF,
    downloadAsZip,
    downloadBlob,
  }

  return (
    <ConversionContext.Provider value={value}>
      {children}
    </ConversionContext.Provider>
  )
}
