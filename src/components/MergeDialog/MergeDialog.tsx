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
  GitMerge,
  FilePdf,
  Trash,
  DotsSixVertical,
  Plus,
  CheckCircle,
  Warning,
  Download,
} from '@phosphor-icons/react'
import { useSplitMerge } from '@/hooks/useSplitMerge'
import { toast } from 'sonner'

interface MergeDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function MergeDialog({ isOpen, onClose }: MergeDialogProps) {
  const {
    mergeFiles,
    addMergeFile,
    removeMergeFile,
    reorderMergeFiles,
    clearMergeFiles,
    mergePDFs,
    downloadBlob,
    isProcessing,
    progress,
  } = useSplitMerge()

  const [filename, setFilename] = useState('merged.pdf')
  const [mergeComplete, setMergeComplete] = useState(false)
  const [mergeError, setMergeError] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return

      for (const file of Array.from(files)) {
        if (file.type === 'application/pdf') {
          try {
            await addMergeFile(file)
          } catch (error) {
            toast.error(`Failed to add ${file.name}`)
          }
        } else {
          toast.error(`${file.name} is not a PDF file`)
        }
      }

      // Reset input
      e.target.value = ''
    },
    [addMergeFile]
  )

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderMergeFiles(draggedIndex, index)
      setDraggedIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleMerge = async () => {
    if (mergeFiles.length < 2) {
      toast.error('Please add at least 2 PDF files to merge')
      return
    }

    setMergeError(null)
    setMergeComplete(false)

    try {
      const blob = await mergePDFs()
      downloadBlob(blob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`)

      setMergeComplete(true)
      toast.success('PDFs merged successfully!')

      setTimeout(() => {
        onClose()
        setMergeComplete(false)
        clearMergeFiles()
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setMergeError(errorMessage)
      toast.error('Merge failed: ' + errorMessage)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
      setMergeError(null)
      setMergeComplete(false)
    }
  }

  const totalPages = mergeFiles.reduce((sum, f) => sum + f.pageCount, 0)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="w-5 h-5" />
            Merge PDFs
          </DialogTitle>
          <DialogDescription>
            Combine multiple PDF files into a single document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>PDF Files ({mergeFiles.length})</Label>
              {mergeFiles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMergeFiles}
                  disabled={isProcessing}
                >
                  Clear all
                </Button>
              )}
            </div>

            <ScrollArea className="h-[200px] border rounded-md">
              {mergeFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <FilePdf className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">No files added yet</p>
                  <p className="text-xs">Add PDF files to merge</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {mergeFiles.map((file, index) => (
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
                      <FilePdf className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.pageCount} page{file.pageCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeMergeFile(file.id)}
                        disabled={isProcessing}
                        aria-label={`Remove ${file.name}`}
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
                accept=".pdf,application/pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="merge-file-input"
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                asChild
                disabled={isProcessing}
                className="flex-1"
              >
                <label htmlFor="merge-file-input" className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Add PDF Files
                </label>
              </Button>
            </div>

            {mergeFiles.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Drag to reorder. Total: {totalPages} pages
              </p>
            )}
          </div>

          {/* Output filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Output Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="merged.pdf"
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
          {mergeComplete && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-md text-green-700 dark:text-green-300">
              <CheckCircle className="w-5 h-5" weight="fill" />
              <span className="text-sm font-medium">Merge completed successfully!</span>
            </div>
          )}

          {/* Error message */}
          {mergeError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive">
              <Warning className="w-5 h-5" weight="fill" />
              <span className="text-sm">{mergeError}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={isProcessing || mergeFiles.length < 2}
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Merging...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Merge & Download
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
