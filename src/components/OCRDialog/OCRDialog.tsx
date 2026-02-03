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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
  TextT,
  MagnifyingGlass,
  FileText,
  CheckCircle,
  Warning,
  X,
  Copy,
  DownloadSimple,
} from '@phosphor-icons/react'
import { useOCR } from '@/hooks/useOCR'
import { toast } from 'sonner'
import { saveAs } from 'file-saver'
import type { OCRLanguage, OCRMode, ExtractedTextResult } from '@/types/ocr.types'
import { OCR_LANGUAGE_LABELS } from '@/types/ocr.types'

interface OCRDialogProps {
  isOpen: boolean
  onClose: () => void
  pdfBytes: ArrayBuffer | null
  originalFilename?: string
  pageCount: number
}

const LANGUAGES: OCRLanguage[] = [
  'eng',
  'spa',
  'fra',
  'deu',
  'ita',
  'por',
  'nld',
  'pol',
  'rus',
  'jpn',
  'chi_sim',
  'chi_tra',
  'kor',
  'ara',
]

export function OCRDialog({
  isOpen,
  onClose,
  pdfBytes,
  originalFilename,
  pageCount,
}: OCRDialogProps) {
  const { makeSearchable, extractText, cancel, terminate, isProcessing, progress } = useOCR()

  const [language, setLanguage] = useState<OCRLanguage>('eng')
  const [mode, setMode] = useState<OCRMode>('makeSearchable')
  const [ocrComplete, setOcrComplete] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<ExtractedTextResult | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setOcrComplete(false)
      setOcrError(null)
      setExtractedText(null)
      setCurrentPage(0)
      setTotalPages(0)
    }
  }, [isOpen])

  // Cleanup worker when dialog closes
  useEffect(() => {
    return () => {
      // Terminate worker when component unmounts
      terminate()
    }
  }, [terminate])

  const handleProgress = (prog: number, page: number, total: number) => {
    setCurrentPage(page)
    setTotalPages(total)
  }

  const handleOCR = async () => {
    if (!pdfBytes) {
      toast.error('No PDF loaded')
      return
    }

    setOcrError(null)
    setOcrComplete(false)
    setExtractedText(null)

    try {
      if (mode === 'makeSearchable') {
        const result = await makeSearchable(pdfBytes, language, handleProgress)

        // Generate filename
        const baseName = originalFilename?.replace('.pdf', '') || 'document'
        const filename = `${baseName}_searchable.pdf`

        // Save the file
        saveAs(result.blob, filename)

        setOcrComplete(true)
        toast.success(
          `PDF made searchable! Average confidence: ${Math.round(result.averageConfidence)}%`
        )
      } else {
        const result = await extractText(pdfBytes, language, undefined, handleProgress)
        setExtractedText(result)
        setOcrComplete(true)
        toast.success(
          `Text extracted from ${result.pages.length} pages! Average confidence: ${Math.round(result.averageConfidence)}%`
        )
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage === 'OCR operation cancelled') {
        toast.info('OCR operation cancelled')
      } else {
        setOcrError(errorMessage)
        toast.error('OCR failed: ' + errorMessage)
      }
    }
  }

  const handleCancel = () => {
    if (isProcessing) {
      cancel()
    }
  }

  const handleClose = () => {
    if (isProcessing) {
      // Ask user to confirm cancellation
      if (confirm('OCR is in progress. Cancel and close?')) {
        cancel()
        onClose()
      }
    } else {
      onClose()
      // Reset state
      setOcrComplete(false)
      setOcrError(null)
      setExtractedText(null)
    }
  }

  const handleCopyText = async () => {
    if (extractedText) {
      try {
        await navigator.clipboard.writeText(extractedText.totalText)
        toast.success('Text copied to clipboard')
      } catch {
        toast.error('Failed to copy text')
      }
    }
  }

  const handleDownloadText = () => {
    if (extractedText) {
      const baseName = originalFilename?.replace('.pdf', '') || 'document'
      const blob = new Blob([extractedText.totalText], { type: 'text/plain' })
      saveAs(blob, `${baseName}_extracted.txt`)
      toast.success('Text file downloaded')
    }
  }

  const estimatedTime = Math.ceil(pageCount * 3) // Rough estimate: ~3 seconds per page

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TextT className="w-5 h-5" weight="bold" />
            OCR - Text Recognition
          </DialogTitle>
          <DialogDescription>
            Extract text from scanned PDFs using optical character recognition ({pageCount} pages)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language">Document Language</Label>
            <Select
              value={language}
              onValueChange={(v) => setLanguage(v as OCRLanguage)}
              disabled={isProcessing}
            >
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {OCR_LANGUAGE_LABELS[lang]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the primary language of the document for best results
            </p>
          </div>

          {/* Mode Selection */}
          <div className="space-y-3">
            <Label>OCR Mode</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as OCRMode)}
              disabled={isProcessing}
            >
              <div className="flex items-start space-x-3 p-3 rounded-md border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="makeSearchable" id="makeSearchable" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="makeSearchable" className="cursor-pointer flex items-center gap-2">
                    <MagnifyingGlass className="w-4 h-4" />
                    Make PDF Searchable
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add invisible text layer to enable search and copy
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-md border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="extractText" id="extractText" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="extractText" className="cursor-pointer flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Extract Text Only
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Extract all text content for copying or saving
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Warning for large documents */}
          {pageCount > 10 && !isProcessing && !ocrComplete && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-md text-amber-700 dark:text-amber-300">
              <Warning className="w-5 h-5 flex-shrink-0 mt-0.5" weight="fill" />
              <div className="text-sm">
                <p className="font-medium">Large document warning</p>
                <p className="text-amber-600 dark:text-amber-400">
                  This document has {pageCount} pages. OCR may take approximately{' '}
                  {estimatedTime > 60
                    ? `${Math.ceil(estimatedTime / 60)} minutes`
                    : `${estimatedTime} seconds`}
                  . You can cancel at any time.
                </p>
              </div>
            </div>
          )}

          {/* Progress */}
          {isProcessing && progress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progress.message}</span>
                <span className="font-medium">{Math.round(progress.progress)}%</span>
              </div>
              <Progress value={progress.progress} />
              {currentPage > 0 && totalPages > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>
          )}

          {/* Success message */}
          {ocrComplete && !extractedText && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-md text-green-700 dark:text-green-300">
              <CheckCircle className="w-5 h-5" weight="fill" />
              <span className="text-sm font-medium">
                Searchable PDF created and downloaded!
              </span>
            </div>
          )}

          {/* Extracted text display */}
          {extractedText && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Extracted Text</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyText}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadText}
                  >
                    <DownloadSimple className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-48 rounded-md border p-3">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {extractedText.totalText || '(No text found)'}
                </pre>
              </ScrollArea>
              <p className="text-xs text-muted-foreground text-center">
                {extractedText.pages.length} pages processed | Average confidence:{' '}
                {Math.round(extractedText.averageConfidence)}%
              </p>
            </div>
          )}

          {/* Error message */}
          {ocrError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive">
              <Warning className="w-5 h-5" weight="fill" />
              <span className="text-sm">{ocrError}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          {isProcessing ? (
            <Button variant="destructive" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                {ocrComplete ? 'Done' : 'Cancel'}
              </Button>
              {!ocrComplete && (
                <Button onClick={handleOCR} disabled={!pdfBytes}>
                  <TextT className="w-4 h-4 mr-2" weight="bold" />
                  {mode === 'makeSearchable' ? 'Make Searchable' : 'Extract Text'}
                </Button>
              )}
              {ocrComplete && extractedText && (
                <Button onClick={() => {
                  setOcrComplete(false)
                  setExtractedText(null)
                }}>
                  <TextT className="w-4 h-4 mr-2" weight="bold" />
                  Run Again
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
