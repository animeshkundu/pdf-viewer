import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileImage,
  CheckCircle,
  Warning,
  Download,
  FilePdf,
} from '@phosphor-icons/react'
import { useConversion } from '@/hooks/useConversion'
import { toast } from 'sonner'
import type { ImageFormat, PDFToImagesResult } from '@/types/conversion.types'

interface PdfToImagesDialogProps {
  isOpen: boolean
  onClose: () => void
  pdfBytes: ArrayBuffer | null
  pageCount: number
  filename?: string
}

export function PdfToImagesDialog({
  isOpen,
  onClose,
  pdfBytes,
  pageCount,
  filename = 'document',
}: PdfToImagesDialogProps) {
  const {
    pdfToImages,
    downloadAsZip,
    downloadBlob,
    isProcessing,
    progress,
  } = useConversion()

  const [format, setFormat] = useState<ImageFormat>('png')
  const [scale, setScale] = useState(2) // 200% for good quality
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(true)
  const [downloadAsZipFile, setDownloadAsZipFile] = useState(true)
  const [conversionComplete, setConversionComplete] = useState(false)
  const [conversionError, setConversionError] = useState<string | null>(null)
  const [result, setResult] = useState<PDFToImagesResult | null>(null)

  const handleSelectAllChange = useCallback((checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedPages(new Set())
    }
  }, [])

  const handlePageToggle = useCallback((page: number) => {
    setSelectAll(false)
    setSelectedPages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(page)) {
        newSet.delete(page)
      } else {
        newSet.add(page)
      }
      return newSet
    })
  }, [])

  const handleConvert = async () => {
    if (!pdfBytes) {
      toast.error('No PDF loaded')
      return
    }

    const pagesToConvert = selectAll
      ? undefined
      : Array.from(selectedPages).sort((a, b) => a - b)

    if (!selectAll && selectedPages.size === 0) {
      toast.error('Please select at least one page')
      return
    }

    setConversionError(null)
    setConversionComplete(false)

    try {
      const convertedResult = await pdfToImages(pdfBytes, {
        format,
        scale,
        pages: pagesToConvert,
      })

      setResult(convertedResult)

      if (downloadAsZipFile || convertedResult.blobs.length > 1) {
        const baseName = filename.replace('.pdf', '')
        await downloadAsZip(convertedResult, `${baseName}_images.zip`)
      } else if (convertedResult.blobs.length === 1) {
        const baseName = filename.replace('.pdf', '')
        downloadBlob(convertedResult.blobs[0], `${baseName}.${format}`)
      }

      setConversionComplete(true)
      toast.success('Images extracted successfully!')

      setTimeout(() => {
        onClose()
        setConversionComplete(false)
        setResult(null)
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setConversionError(errorMessage)
      toast.error('Conversion failed: ' + errorMessage)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
      setConversionError(null)
      setConversionComplete(false)
      setResult(null)
      setSelectedPages(new Set())
      setSelectAll(true)
    }
  }

  const effectivePageCount = selectAll ? pageCount : selectedPages.size

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            PDF to Images
          </DialogTitle>
          <DialogDescription>
            Extract pages from the PDF as images
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current PDF info */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
            <FilePdf className="w-5 h-5 text-red-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{filename}</p>
              <p className="text-xs text-muted-foreground">
                {pageCount} page{pageCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Format selection */}
          <div className="space-y-2">
            <Label htmlFor="format">Image Format</Label>
            <Select
              value={format}
              onValueChange={(value: ImageFormat) => setFormat(value)}
              disabled={isProcessing}
            >
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (Lossless)</SelectItem>
                <SelectItem value="jpg">JPEG (Smaller size)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scale selection */}
          <div className="space-y-2">
            <Label htmlFor="scale">Quality / Scale</Label>
            <Select
              value={String(scale)}
              onValueChange={(value) => setScale(Number(value))}
              disabled={isProcessing}
            >
              <SelectTrigger id="scale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">100% (Standard)</SelectItem>
                <SelectItem value="1.5">150% (Good)</SelectItem>
                <SelectItem value="2">200% (High Quality)</SelectItem>
                <SelectItem value="3">300% (Very High)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Higher scale = better quality but larger files
            </p>
          </div>

          {/* Page selection */}
          <div className="space-y-2">
            <Label>Pages to Convert</Label>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="selectAll"
                checked={selectAll}
                onCheckedChange={handleSelectAllChange}
                disabled={isProcessing}
              />
              <label
                htmlFor="selectAll"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                All pages
              </label>
            </div>

            {!selectAll && (
              <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                    <div key={page} className="flex items-center space-x-1">
                      <Checkbox
                        id={`page-${page}`}
                        checked={selectedPages.has(page)}
                        onCheckedChange={() => handlePageToggle(page)}
                        disabled={isProcessing}
                      />
                      <label
                        htmlFor={`page-${page}`}
                        className="text-xs cursor-pointer"
                      >
                        {page}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {effectivePageCount} page{effectivePageCount !== 1 ? 's' : ''} will be converted
            </p>
          </div>

          {/* Download option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="downloadAsZip"
              checked={downloadAsZipFile}
              onCheckedChange={(checked) => setDownloadAsZipFile(!!checked)}
              disabled={isProcessing}
            />
            <label
              htmlFor="downloadAsZip"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Download as ZIP file
            </label>
          </div>

          {/* Progress */}
          {isProcessing && progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progress.message}</span>
                <span className="font-medium">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} />
            </div>
          )}

          {/* Success message */}
          {conversionComplete && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-md text-green-700 dark:text-green-300">
              <CheckCircle className="w-5 h-5" weight="fill" />
              <span className="text-sm font-medium">
                {result?.blobs.length} image{result?.blobs.length !== 1 ? 's' : ''} extracted!
              </span>
            </div>
          )}

          {/* Error message */}
          {conversionError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive">
              <Warning className="w-5 h-5" weight="fill" />
              <span className="text-sm">{conversionError}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={isProcessing || !pdfBytes || (!selectAll && selectedPages.size === 0)}
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">...</span>
                Converting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Extract Images
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
