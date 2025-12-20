import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Download, FileText, CheckCircle, Warning, Stamp } from '@phosphor-icons/react'
import { exportService, ExportProgress } from '@/services/export.service'
import { formService } from '@/services/form.service'
import { toast } from 'sonner'
import type { BlankPage } from '@/types/page-management.types'
import type { Watermark } from '@/types/watermark.types'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  originalFilename?: string
  originalPdfBytes: ArrayBuffer | null
  annotations: any[]
  transformations: Map<number, any>
  pageOrder: number[]
  blankPages: BlankPage[]
  watermark: Watermark | null
}

export function ExportDialog({
  isOpen,
  onClose,
  originalFilename,
  originalPdfBytes,
  annotations,
  transformations,
  pageOrder,
  blankPages,
  watermark,
}: ExportDialogProps) {
  const [filename, setFilename] = useState(() => 
    exportService.generateFilename(originalFilename)
  )
  const [includeAnnotations, setIncludeAnnotations] = useState(true)
  const [includeFormData, setIncludeFormData] = useState(true)
  const [flattenForms, setFlattenForms] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)
  const [exportComplete, setExportComplete] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExport = async () => {
    if (!originalPdfBytes) {
      toast.error('No PDF loaded')
      return
    }

    setIsExporting(true)
    setExportError(null)
    setExportComplete(false)

    exportService.setProgressCallback(setExportProgress)

    try {
      const blob = await exportService.exportPDF(
        originalPdfBytes,
        annotations,
        transformations,
        pageOrder,
        blankPages,
        watermark,
        { 
          filename, 
          includeAnnotations,
          includeFormData,
          flattenForms
        }
      )

      await exportService.downloadPDF(blob, filename)
      setExportComplete(true)
      toast.success('PDF exported successfully!')

      setTimeout(() => {
        onClose()
        setIsExporting(false)
        setExportComplete(false)
        setExportProgress(null)
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setExportError(errorMessage)
      toast.error('Export failed: ' + errorMessage)
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    if (!isExporting) {
      onClose()
      setExportProgress(null)
      setExportComplete(false)
      setExportError(null)
    }
  }

  const annotationCount = annotations.length
  const redactionCount = annotations.filter(a => a.type === 'redaction').length
  const blankPageCount = blankPages.length
  const hasTransformations = Array.from(transformations.values()).some(
    t => t.rotation !== 0 || t.isDeleted
  )
  const isReordered = pageOrder.some((pageNum, index) => pageNum !== index + 1)
  const hasFormFields = formService.hasFields()
  const formFieldCount = formService.getAllFields().length

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export PDF
          </DialogTitle>
          <DialogDescription>
            Download your modified PDF with all changes applied
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              disabled={isExporting}
              placeholder="document.pdf"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Changes to Apply</Label>
            <div className="space-y-2 text-sm text-muted-foreground">
              {annotationCount > 0 && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{annotationCount} annotation{annotationCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              {redactionCount > 0 && (
                <div className="flex items-center gap-2">
                  <Warning className="w-4 h-4 text-destructive" />
                  <span className="text-destructive font-medium">{redactionCount} redaction{redactionCount !== 1 ? 's' : ''} (content will be blacked out)</span>
                </div>
              )}
              {blankPageCount > 0 && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{blankPageCount} blank page{blankPageCount !== 1 ? 's' : ''} to insert</span>
                </div>
              )}
              {watermark && (
                <div className="flex items-center gap-2">
                  <Stamp className="w-4 h-4" />
                  <span>Watermark: "{watermark.text}"</span>
                </div>
              )}
              {hasFormFields && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{formFieldCount} form field{formFieldCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              {hasTransformations && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Page rotations and deletions</span>
                </div>
              )}
              {isReordered && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Custom page order</span>
                </div>
              )}
              {!annotationCount && !hasFormFields && !hasTransformations && !isReordered && !blankPageCount && (
                <div className="text-muted-foreground">No changes to apply</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {annotationCount > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-annotations"
                  checked={includeAnnotations}
                  onCheckedChange={(checked) => setIncludeAnnotations(checked === true)}
                  disabled={isExporting}
                />
                <Label
                  htmlFor="include-annotations"
                  className="text-sm font-normal cursor-pointer"
                >
                  Include annotations in export
                </Label>
              </div>
            )}

            {hasFormFields && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-form-data"
                    checked={includeFormData}
                    onCheckedChange={(checked) => setIncludeFormData(checked === true)}
                    disabled={isExporting}
                  />
                  <Label
                    htmlFor="include-form-data"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Include form field values
                  </Label>
                </div>

                {includeFormData && (
                  <div className="flex items-center space-x-2 ml-6">
                    <Checkbox
                      id="flatten-forms"
                      checked={flattenForms}
                      onCheckedChange={(checked) => setFlattenForms(checked === true)}
                      disabled={isExporting}
                    />
                    <Label
                      htmlFor="flatten-forms"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Flatten forms (make read-only)
                    </Label>
                  </div>
                )}
              </>
            )}
          </div>

          {isExporting && exportProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{exportProgress.message}</span>
                <span className="font-medium">{exportProgress.progress}%</span>
              </div>
              <Progress value={exportProgress.progress} />
            </div>
          )}

          {exportComplete && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-md text-green-700 dark:text-green-300">
              <CheckCircle className="w-5 h-5" weight="fill" />
              <span className="text-sm font-medium">Export completed successfully!</span>
            </div>
          )}

          {exportError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive">
              <Warning className="w-5 h-5" weight="fill" />
              <span className="text-sm">{exportError}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !originalPdfBytes}
          >
            {isExporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
