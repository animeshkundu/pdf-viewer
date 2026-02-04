import { useState } from 'react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Scissors,
  FileArchive,
  FilePdf,
  CheckCircle,
  Warning,
} from '@phosphor-icons/react'
import { useSplitMerge } from '@/hooks/useSplitMerge'
import { toast } from 'sonner'
import type { SplitOptions, PageRange } from '@/types/split-merge.types'

interface SplitDialogProps {
  isOpen: boolean
  onClose: () => void
  pdfBytes: ArrayBuffer | null
  originalFilename?: string
  pageCount: number
  selectedPages?: number[]
}

type SplitMode = 'ranges' | 'everyN' | 'extractPages'

export function SplitDialog({
  isOpen,
  onClose,
  pdfBytes,
  originalFilename,
  pageCount,
  selectedPages = [],
}: SplitDialogProps) {
  const { splitPDF, downloadSplitResults, isProcessing, progress } = useSplitMerge()

  const [splitMode, setSplitMode] = useState<SplitMode>('ranges')
  const [rangeInput, setRangeInput] = useState('') // e.g., "1-5, 6-10, 11-15"
  const [everyN, setEveryN] = useState(1)
  const [outputAsZip, setOutputAsZip] = useState(true)
  const [splitComplete, setSplitComplete] = useState(false)
  const [splitError, setSplitError] = useState<string | null>(null)

  const parseRanges = (input: string): PageRange[] => {
    const ranges: PageRange[] = []
    const parts = input.split(',').map((p) => p.trim())

    for (const part of parts) {
      if (!part) continue

      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map((s) => s.trim())
        const start = parseInt(startStr, 10)
        const end = parseInt(endStr, 10)

        if (isNaN(start) || isNaN(end)) {
          throw new Error(`Invalid range: ${part}`)
        }
        if (start < 1 || end > pageCount || start > end) {
          throw new Error(`Invalid range: ${part}. Document has ${pageCount} pages.`)
        }

        ranges.push({ start, end })
      } else {
        const page = parseInt(part, 10)
        if (isNaN(page) || page < 1 || page > pageCount) {
          throw new Error(`Invalid page number: ${part}`)
        }
        ranges.push({ start: page, end: page })
      }
    }

    return ranges
  }

  const handleSplit = async () => {
    if (!pdfBytes) {
      toast.error('No PDF loaded')
      return
    }

    setSplitError(null)
    setSplitComplete(false)

    try {
      let options: SplitOptions

      switch (splitMode) {
        case 'ranges': {
          const ranges = parseRanges(rangeInput)
          if (ranges.length === 0) {
            throw new Error('Please specify at least one page range')
          }
          options = {
            mode: { type: 'ranges', ranges },
            outputFormat: outputAsZip ? 'zip' : 'separate',
          }
          break
        }
        case 'everyN': {
          if (everyN < 1 || everyN > pageCount) {
            throw new Error(`Pages per file must be between 1 and ${pageCount}`)
          }
          options = {
            mode: { type: 'everyN', n: everyN },
            outputFormat: outputAsZip ? 'zip' : 'separate',
          }
          break
        }
        case 'extractPages': {
          if (selectedPages.length === 0) {
            throw new Error('No pages selected. Please select pages in the thumbnail sidebar first.')
          }
          options = {
            mode: { type: 'extractPages', pages: selectedPages },
            outputFormat: outputAsZip ? 'zip' : 'separate',
          }
          break
        }
      }

      const result = await splitPDF(pdfBytes, options, originalFilename)
      await downloadSplitResults(result, outputAsZip)

      setSplitComplete(true)
      toast.success(`Split into ${result.blobs.length} files!`)

      setTimeout(() => {
        onClose()
        setSplitComplete(false)
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setSplitError(errorMessage)
      toast.error('Split failed: ' + errorMessage)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
      setSplitError(null)
      setSplitComplete(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Split PDF
          </DialogTitle>
          <DialogDescription>
            Split your PDF into multiple files ({pageCount} pages total)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={splitMode}
            onValueChange={(v) => setSplitMode(v as SplitMode)}
            disabled={isProcessing}
          >
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="ranges" id="ranges" />
              <div className="space-y-1">
                <Label htmlFor="ranges" className="cursor-pointer">
                  Split by page ranges
                </Label>
                <p className="text-sm text-muted-foreground">
                  Specify custom ranges (e.g., "1-5, 6-10, 11-15")
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="everyN" id="everyN-radio" />
              <div className="space-y-1">
                <Label htmlFor="everyN-radio" className="cursor-pointer">
                  Split every N pages
                </Label>
                <p className="text-sm text-muted-foreground">
                  Split into equal parts
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="extractPages" id="extractPages" />
              <div className="space-y-1">
                <Label htmlFor="extractPages" className="cursor-pointer">
                  Extract selected pages
                </Label>
                <p className="text-sm text-muted-foreground">
                  {selectedPages.length > 0
                    ? `${selectedPages.length} page(s) selected`
                    : 'Select pages in the thumbnail sidebar'}
                </p>
              </div>
            </div>
          </RadioGroup>

          {splitMode === 'ranges' && (
            <div className="space-y-2">
              <Label htmlFor="rangeInput">Page Ranges</Label>
              <Input
                id="rangeInput"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="e.g., 1-5, 6-10, 11-15"
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                Separate ranges with commas. Single pages: "3". Ranges: "1-5".
              </p>
            </div>
          )}

          {splitMode === 'everyN' && (
            <div className="space-y-2">
              <Label htmlFor="everyNInput">Pages per file</Label>
              <Input
                id="everyNInput"
                type="number"
                min={1}
                max={pageCount}
                value={everyN}
                onChange={(e) => setEveryN(parseInt(e.target.value, 10) || 1)}
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                Will create {Math.ceil(pageCount / everyN)} file(s)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Output Format</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="outputZip"
                checked={outputAsZip}
                onCheckedChange={(checked) => setOutputAsZip(checked === true)}
                disabled={isProcessing}
              />
              <Label htmlFor="outputZip" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                <FileArchive className="w-4 h-4" />
                Download as ZIP archive
              </Label>
            </div>
            {!outputAsZip && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FilePdf className="w-3 h-3" />
                Individual PDF files will be downloaded separately
              </p>
            )}
          </div>

          {isProcessing && progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progress.message}</span>
                <span className="font-medium">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} />
            </div>
          )}

          {splitComplete && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-md text-green-700 dark:text-green-300">
              <CheckCircle className="w-5 h-5" weight="fill" />
              <span className="text-sm font-medium">Split completed successfully!</span>
            </div>
          )}

          {splitError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive">
              <Warning className="w-5 h-5" weight="fill" />
              <span className="text-sm">{splitError}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSplit} disabled={isProcessing || !pdfBytes}>
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Splitting...
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4 mr-2" />
                Split PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
