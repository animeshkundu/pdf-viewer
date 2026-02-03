import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Image,
  Trash,
  DotsSixVertical,
  Plus,
  CheckCircle,
  Warning,
  FilePdf,
} from '@phosphor-icons/react'
import { useConversion } from '@/hooks/useConversion'
import { toast } from 'sonner'
import type { PageSize } from '@/types/conversion.types'

interface ImagesToPdfDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ImagesToPdfDialog({ isOpen, onClose }: ImagesToPdfDialogProps) {
  const {
    imageFiles,
    addImageFiles,
    removeImageFile,
    reorderImageFiles,
    clearImageFiles,
    imagesToPDF,
    downloadBlob,
    isProcessing,
    progress,
  } = useConversion()

  const [filename, setFilename] = useState('images.pdf')
  const [pageSize, setPageSize] = useState<PageSize>('a4')
  const [margin, setMargin] = useState(36) // 0.5 inch default
  const [conversionComplete, setConversionComplete] = useState(false)
  const [conversionError, setConversionError] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return

      try {
        await addImageFiles(Array.from(files))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add images'
        toast.error(message)
      }

      // Reset input
      e.target.value = ''
    },
    [addImageFiles]
  )

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderImageFiles(draggedIndex, index)
      setDraggedIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleConvert = async () => {
    if (imageFiles.length === 0) {
      toast.error('Please add at least one image')
      return
    }

    setConversionError(null)
    setConversionComplete(false)

    try {
      const blob = await imagesToPDF({
        pageSize,
        margin,
      })

      downloadBlob(blob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`)

      setConversionComplete(true)
      toast.success('PDF created successfully!')

      setTimeout(() => {
        onClose()
        setConversionComplete(false)
        clearImageFiles()
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
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Images to PDF
          </DialogTitle>
          <DialogDescription>
            Convert multiple images into a single PDF document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Images ({imageFiles.length})</Label>
              {imageFiles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearImageFiles}
                  disabled={isProcessing}
                >
                  Clear all
                </Button>
              )}
            </div>

            <ScrollArea className="h-[200px] border rounded-md">
              {imageFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <Image className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">No images added yet</p>
                  <p className="text-xs">Add images to convert to PDF</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {imageFiles.map((file, index) => (
                    <div
                      key={file.id}
                      draggable={!isProcessing}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 p-2 rounded-md border bg-background hover:bg-accent/50 transition-colors ${
                        draggedIndex === index ? 'opacity-50' : ''
                      }`}
                    >
                      <DotsSixVertical
                        className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing"
                        weight="bold"
                      />
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.width} x {file.height}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeImageFile(file.id)}
                        disabled={isProcessing}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="image-file-input"
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                asChild
                disabled={isProcessing}
                className="flex-1"
              >
                <label htmlFor="image-file-input" className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Images
                </label>
              </Button>
            </div>

            {imageFiles.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Drag to reorder. Images will appear in this order in the PDF.
              </p>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pageSize">Page Size</Label>
              <Select
                value={pageSize}
                onValueChange={(value: PageSize) => setPageSize(value)}
                disabled={isProcessing}
              >
                <SelectTrigger id="pageSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                  <SelectItem value="fit">Fit to Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="margin">Margin (points)</Label>
              <Input
                id="margin"
                type="number"
                min={0}
                max={144}
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">72 points = 1 inch</p>
            </div>
          </div>

          {/* Output filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Output Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="images.pdf"
              disabled={isProcessing}
            />
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
              <span className="text-sm font-medium">PDF created successfully!</span>
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
            disabled={isProcessing || imageFiles.length === 0}
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">...</span>
                Converting...
              </>
            ) : (
              <>
                <FilePdf className="w-4 h-4 mr-2" />
                Create PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
