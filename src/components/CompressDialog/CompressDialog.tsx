import { useState, useCallback, useEffect, useRef } from 'react'
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
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  FileArrowDown,
  Image as ImageIcon,
  Trash,
  Plus,
  CheckCircle,
  Warning,
  ArrowRight,
} from '@phosphor-icons/react'
import { useAdvancedTools } from '@/hooks/useAdvancedTools'
import { toast } from 'sonner'
import type { CompressionResult } from '@/types/advanced-tools.types'

interface CompressDialogProps {
  isOpen: boolean
  onClose: () => void
  onCompressionComplete?: (result: CompressionResult) => void
}

export function CompressDialog({ isOpen, onClose, onCompressionComplete }: CompressDialogProps) {
  const {
    compressImage,
    isProcessing,
    progress,
    formatFileSize,
    calculateSavings,
    isCompressibleImage,
    getRecommendedQuality,
  } = useAdvancedTools()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(80)
  const [convertToJpeg, setConvertToJpeg] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup preview URL on unmount or when file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null)
      setCompressionResult(null)
      setError(null)
      setQuality(80)
      setConvertToJpeg(false)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    }
  }, [isOpen, previewUrl])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!isCompressibleImage(file)) {
        toast.error('Please select a valid image file (JPEG, PNG, WebP, or BMP)')
        return
      }

      // Revoke old preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setCompressionResult(null)
      setError(null)

      // Set recommended quality based on file size
      const recommended = getRecommendedQuality(file.size)
      setQuality(Math.round(recommended * 100))

      // Reset input
      e.target.value = ''
    },
    [isCompressibleImage, getRecommendedQuality, previewUrl]
  )

  const handleCompress = async () => {
    if (!selectedFile) {
      toast.error('Please select an image file first')
      return
    }

    setError(null)

    try {
      const result = await compressImage(selectedFile, {
        quality: quality / 100,
        convertToJpeg,
      })

      setCompressionResult(result)
      toast.success('Image compressed successfully!')

      if (onCompressionComplete) {
        onCompressionComplete(result)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error('Compression failed: ' + errorMessage)
    }
  }

  const handleDownload = () => {
    if (!compressionResult || !selectedFile) return

    const url = URL.createObjectURL(compressionResult.blob)
    const link = document.createElement('a')
    link.href = url

    // Generate filename with quality suffix
    const originalName = selectedFile.name
    const extension = convertToJpeg ? '.jpg' : originalName.substring(originalName.lastIndexOf('.'))
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'))
    link.download = `${baseName}_compressed_q${quality}${extension}`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Download started!')
  }

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setCompressionResult(null)
    setError(null)
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
    }
  }

  const savings = compressionResult
    ? calculateSavings(compressionResult.originalSize, compressionResult.compressedSize)
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArrowDown className="w-5 h-5" />
            Compress Image
          </DialogTitle>
          <DialogDescription>
            Compress images before embedding them in your PDF to reduce file size
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File selection */}
          <div className="space-y-2">
            <Label>Image File</Label>
            {selectedFile ? (
              <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/30">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Original: {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearFile}
                  disabled={isProcessing}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md text-muted-foreground hover:border-primary/50 transition-colors">
                <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm mb-2">Drop an image here or click to select</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="compress-file-input"
                  disabled={isProcessing}
                />
                <Button variant="outline" asChild disabled={isProcessing}>
                  <label htmlFor="compress-file-input" className="cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" />
                    Select Image
                  </label>
                </Button>
              </div>
            )}
          </div>

          {/* Quality slider */}
          {selectedFile && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Quality</Label>
                <span className="text-sm font-medium">{quality}%</span>
              </div>
              <Slider
                value={[quality]}
                onValueChange={(value) => setQuality(value[0])}
                min={10}
                max={100}
                step={5}
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                Lower quality = smaller file size. 70-85% is recommended for most images.
              </p>
            </div>
          )}

          {/* Convert to JPEG option */}
          {selectedFile && selectedFile.type !== 'image/jpeg' && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="convert-jpeg">Convert to JPEG</Label>
                <p className="text-xs text-muted-foreground">
                  JPEG often provides better compression for photos
                </p>
              </div>
              <Switch
                id="convert-jpeg"
                checked={convertToJpeg}
                onCheckedChange={setConvertToJpeg}
                disabled={isProcessing}
              />
            </div>
          )}

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

          {/* Compression result */}
          {compressionResult && (
            <div className="space-y-3 p-4 border rounded-md bg-muted/30">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" weight="fill" />
                <span className="font-medium">Compression Complete!</span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex-1">
                  <p className="text-muted-foreground">Original</p>
                  <p className="font-medium">{formatFileSize(compressionResult.originalSize)}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground">Compressed</p>
                  <p className="font-medium">{formatFileSize(compressionResult.compressedSize)}</p>
                </div>
                <div className="flex-1">
                  <p className="text-muted-foreground">Saved</p>
                  <p className="font-medium text-green-600 dark:text-green-400">{savings}%</p>
                </div>
              </div>

              {compressionResult.width > 0 && (
                <p className="text-xs text-muted-foreground">
                  Dimensions: {compressionResult.width} x {compressionResult.height} pixels
                </p>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive">
              <Warning className="w-5 h-5" weight="fill" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Info note */}
          <div className="text-xs text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">
            <p>
              <strong>Tip:</strong> Compressing images before embedding them in PDFs can
              significantly reduce the final PDF file size. This is especially useful for
              documents with many photos or high-resolution images.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {compressionResult ? 'Close' : 'Cancel'}
          </Button>
          {compressionResult ? (
            <Button onClick={handleDownload}>
              <FileArrowDown className="w-4 h-4 mr-2" />
              Download Compressed
            </Button>
          ) : (
            <Button
              onClick={handleCompress}
              disabled={isProcessing || !selectedFile}
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Compressing...
                </>
              ) : (
                <>
                  <FileArrowDown className="w-4 h-4 mr-2" />
                  Compress Image
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
