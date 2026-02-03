import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  ShieldCheck,
  CheckCircle,
  Warning,
  User,
  Calendar,
  Tag,
  FileText,
  Code,
} from '@phosphor-icons/react'
import { useSecurity } from '@/hooks/useSecurity'
import { toast } from 'sonner'
import type { SanitizeOptions, PDFMetadata } from '@/types/security.types'
import { DEFAULT_SANITIZE_OPTIONS } from '@/types/security.types'

interface SanitizeDialogProps {
  isOpen: boolean
  onClose: () => void
  pdfBytes: ArrayBuffer | null
  originalFilename?: string
  onSanitized?: (blob: Blob) => void
}

export function SanitizeDialog({
  isOpen,
  onClose,
  pdfBytes,
  originalFilename,
  onSanitized,
}: SanitizeDialogProps) {
  const { sanitizePDF, getMetadata, downloadBlob, isProcessing, progress } = useSecurity()

  const [options, setOptions] = useState<SanitizeOptions>(DEFAULT_SANITIZE_OPTIONS)
  const [currentMetadata, setCurrentMetadata] = useState<PDFMetadata | null>(null)
  const [loadingMetadata, setLoadingMetadata] = useState(false)
  const [sanitizeComplete, setSanitizeComplete] = useState(false)
  const [sanitizeError, setSanitizeError] = useState<string | null>(null)

  // Load current metadata when dialog opens
  useEffect(() => {
    if (isOpen && pdfBytes) {
      setLoadingMetadata(true)
      getMetadata(pdfBytes)
        .then((metadata) => {
          setCurrentMetadata(metadata)
        })
        .catch((error) => {
          console.error('Failed to load metadata:', error)
        })
        .finally(() => {
          setLoadingMetadata(false)
        })
    }
  }, [isOpen, pdfBytes, getMetadata])

  const handleOptionChange = (key: keyof SanitizeOptions, value: boolean) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  const handleSelectAll = () => {
    setOptions(DEFAULT_SANITIZE_OPTIONS)
  }

  const handleSelectNone = () => {
    setOptions({
      removeTitle: false,
      removeAuthor: false,
      removeSubject: false,
      removeKeywords: false,
      removeProducer: false,
      removeCreator: false,
      removeDates: false,
      removeCustomMetadata: false,
    })
  }

  const hasAnyOption = Object.values(options).some(Boolean)

  const handleSanitize = async () => {
    if (!pdfBytes) {
      toast.error('No PDF loaded')
      return
    }

    setSanitizeError(null)
    setSanitizeComplete(false)

    try {
      const result = await sanitizePDF(pdfBytes, options)

      if (result.success) {
        const removedCount = Object.values(result.removedMetadata).filter(Boolean).length

        if (onSanitized) {
          onSanitized(result.blob)
        } else {
          // Download the sanitized PDF
          const filename = originalFilename
            ? originalFilename.replace('.pdf', '_sanitized.pdf')
            : 'sanitized.pdf'
          downloadBlob(result.blob, filename)
        }

        setSanitizeComplete(true)
        toast.success(`Removed ${removedCount} metadata field(s)`)

        setTimeout(() => {
          onClose()
          setSanitizeComplete(false)
        }, 1500)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setSanitizeError(errorMessage)
      toast.error('Sanitization failed: ' + errorMessage)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
      setSanitizeError(null)
      setSanitizeComplete(false)
      setOptions(DEFAULT_SANITIZE_OPTIONS)
    }
  }

  const MetadataItem = ({
    icon: Icon,
    label,
    value,
    optionKey,
  }: {
    icon: React.ElementType
    label: string
    value: string | string[] | Date | undefined
    optionKey: keyof SanitizeOptions
  }) => {
    const displayValue =
      value instanceof Date
        ? value.toLocaleDateString()
        : Array.isArray(value)
          ? value.join(', ')
          : value

    const hasValue = value !== undefined && value !== null && value !== ''

    return (
      <div className="flex items-start space-x-3 py-2">
        <Checkbox
          id={optionKey}
          checked={options[optionKey]}
          onCheckedChange={(checked) => handleOptionChange(optionKey, checked === true)}
          disabled={isProcessing}
        />
        <div className="flex-1 min-w-0">
          <Label
            htmlFor={optionKey}
            className="flex items-center gap-2 text-sm font-medium cursor-pointer"
          >
            <Icon className="w-4 h-4 text-muted-foreground" />
            {label}
          </Label>
          {hasValue ? (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Current: {displayValue}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/50 mt-0.5 italic">
              Not set
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Sanitize PDF
          </DialogTitle>
          <DialogDescription>
            Remove metadata and identifying information from your PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isProcessing}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectNone}
              disabled={isProcessing}
            >
              Select None
            </Button>
          </div>

          {/* Metadata options */}
          <div className="border rounded-lg p-3 space-y-1">
            {loadingMetadata ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Loading metadata...
              </div>
            ) : (
              <>
                <MetadataItem
                  icon={FileText}
                  label="Title"
                  value={currentMetadata?.title}
                  optionKey="removeTitle"
                />
                <MetadataItem
                  icon={User}
                  label="Author"
                  value={currentMetadata?.author}
                  optionKey="removeAuthor"
                />
                <MetadataItem
                  icon={Tag}
                  label="Subject"
                  value={currentMetadata?.subject}
                  optionKey="removeSubject"
                />
                <MetadataItem
                  icon={Tag}
                  label="Keywords"
                  value={currentMetadata?.keywords}
                  optionKey="removeKeywords"
                />
                <MetadataItem
                  icon={Code}
                  label="Producer"
                  value={currentMetadata?.producer}
                  optionKey="removeProducer"
                />
                <MetadataItem
                  icon={Code}
                  label="Creator"
                  value={currentMetadata?.creator}
                  optionKey="removeCreator"
                />
                <MetadataItem
                  icon={Calendar}
                  label="Creation/Modification Dates"
                  value={
                    currentMetadata?.creationDate || currentMetadata?.modificationDate
                      ? `${currentMetadata?.creationDate?.toLocaleDateString() || 'N/A'} / ${currentMetadata?.modificationDate?.toLocaleDateString() || 'N/A'}`
                      : undefined
                  }
                  optionKey="removeDates"
                />
              </>
            )}
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
          {sanitizeComplete && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-md text-green-700 dark:text-green-300">
              <CheckCircle className="w-5 h-5" weight="fill" />
              <span className="text-sm font-medium">PDF sanitized successfully!</span>
            </div>
          )}

          {/* Error message */}
          {sanitizeError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive">
              <Warning className="w-5 h-5" weight="fill" />
              <span className="text-sm">{sanitizeError}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleSanitize}
            disabled={isProcessing || !pdfBytes || !hasAnyOption}
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">&#8987;</span>
                Sanitizing...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Sanitize PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
