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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  GitDiff,
  FilePdf,
  Trash,
  Plus,
  Warning,
  ArrowsLeftRight,
  Eye,
  Download,
  Stack,
} from '@phosphor-icons/react'
import { useAdvancedTools } from '@/hooks/useAdvancedTools'
import { toast } from 'sonner'
import type { ComparisonResult, PDFComparisonFile } from '@/types/advanced-tools.types'

interface CompareDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function CompareDialog({ isOpen, onClose }: CompareDialogProps) {
  const {
    comparePDFs,
    getComparisonPageCount,
    exportComparisonAsPng,
    formatPercentage,
    isSignificantlyDifferent,
    isProcessing,
    progress,
  } = useAdvancedTools()

  const [pdf1, setPdf1] = useState<PDFComparisonFile | null>(null)
  const [pdf2, setPdf2] = useState<PDFComparisonFile | null>(null)
  const [selectedPage, setSelectedPage] = useState(1)
  const [threshold, setThreshold] = useState(10) // 0-100 scale for UI, converted to 0-1 for API
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay' | 'diff'>('side-by-side')

  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setPdf1(null)
      setPdf2(null)
      setSelectedPage(1)
      setComparisonResult(null)
      setError(null)
      setThreshold(10)
    }
  }, [isOpen])

  const handleFileSelect = useCallback(
    async (target: 'pdf1' | 'pdf2', e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file')
        return
      }

      try {
        const bytes = await file.arrayBuffer()
        const pageCount = await getComparisonPageCount(bytes)

        const pdfFile: PDFComparisonFile = {
          id: `${target}-${Date.now()}`,
          file,
          name: file.name,
          pageCount,
          bytes,
        }

        if (target === 'pdf1') {
          setPdf1(pdfFile)
        } else {
          setPdf2(pdfFile)
        }

        // Reset comparison when files change
        setComparisonResult(null)
        setError(null)

        // Reset page selection if needed
        if (selectedPage > pageCount) {
          setSelectedPage(1)
        }
      } catch (err) {
        toast.error(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }

      // Reset input
      e.target.value = ''
    },
    [getComparisonPageCount, selectedPage]
  )

  const handleCompare = async () => {
    if (!pdf1?.bytes || !pdf2?.bytes) {
      toast.error('Please select two PDF files to compare')
      return
    }

    setError(null)

    try {
      const result = await comparePDFs(pdf1.bytes, pdf2.bytes, selectedPage, {
        threshold: threshold / 100, // Convert from 0-100 to 0-1
      })

      setComparisonResult(result)

      if (isSignificantlyDifferent(result.percentDifferent)) {
        toast.info(`Pages differ by ${formatPercentage(result.percentDifferent)}`)
      } else {
        toast.success('Pages are nearly identical!')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error('Comparison failed: ' + errorMessage)
    }
  }

  const handleExportDiff = async () => {
    if (!comparisonResult) return

    try {
      const blob = await exportComparisonAsPng(comparisonResult.diffCanvas)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `diff_page_${selectedPage}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Diff image downloaded!')
    } catch {
      toast.error('Failed to export diff image')
    }
  }

  const handleClearFile = (target: 'pdf1' | 'pdf2') => {
    if (target === 'pdf1') {
      setPdf1(null)
    } else {
      setPdf2(null)
    }
    setComparisonResult(null)
    setError(null)
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
    }
  }

  // Get the maximum page count between both PDFs
  const maxPages = Math.min(pdf1?.pageCount || 1, pdf2?.pageCount || 1)

  // Render the appropriate view based on viewMode
  const renderComparisonView = () => {
    if (!comparisonResult) return null

    const { pdf1Canvas, pdf2Canvas, diffCanvas } = comparisonResult

    switch (viewMode) {
      case 'side-by-side':
        return (
          <div className="flex gap-2 overflow-x-auto">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-center text-muted-foreground mb-1">Original (PDF 1)</p>
              <canvas
                ref={(el) => {
                  if (el) {
                    const ctx = el.getContext('2d')
                    if (ctx) {
                      el.width = pdf1Canvas.width
                      el.height = pdf1Canvas.height
                      ctx.drawImage(pdf1Canvas, 0, 0)
                    }
                  }
                }}
                className="w-full h-auto border rounded"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-center text-muted-foreground mb-1">Compared (PDF 2)</p>
              <canvas
                ref={(el) => {
                  if (el) {
                    const ctx = el.getContext('2d')
                    if (ctx) {
                      el.width = pdf2Canvas.width
                      el.height = pdf2Canvas.height
                      ctx.drawImage(pdf2Canvas, 0, 0)
                    }
                  }
                }}
                className="w-full h-auto border rounded"
              />
            </div>
          </div>
        )

      case 'overlay':
        return (
          <div className="flex justify-center">
            <div>
              <p className="text-xs text-center text-muted-foreground mb-1">
                Overlay (differences in red)
              </p>
              <canvas
                ref={(el) => {
                  if (el) {
                    const ctx = el.getContext('2d')
                    if (ctx) {
                      el.width = pdf1Canvas.width
                      el.height = pdf1Canvas.height
                      // Draw PDF1 as base
                      ctx.drawImage(pdf1Canvas, 0, 0)
                      // Draw diff with transparency
                      ctx.globalAlpha = 0.5
                      ctx.drawImage(diffCanvas, 0, 0)
                      ctx.globalAlpha = 1
                    }
                  }
                }}
                className="max-w-full h-auto border rounded"
              />
            </div>
          </div>
        )

      case 'diff':
        return (
          <div className="flex justify-center">
            <div>
              <p className="text-xs text-center text-muted-foreground mb-1">
                Difference Map (red = different)
              </p>
              <canvas
                ref={(el) => {
                  if (el) {
                    const ctx = el.getContext('2d')
                    if (ctx) {
                      el.width = diffCanvas.width
                      el.height = diffCanvas.height
                      ctx.drawImage(diffCanvas, 0, 0)
                    }
                  }
                }}
                className="max-w-full h-auto border rounded"
              />
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitDiff className="w-5 h-5" />
            Compare PDFs
          </DialogTitle>
          <DialogDescription>
            Compare two PDF files side-by-side and visualize differences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File selection */}
          <div className="grid grid-cols-2 gap-4">
            {/* PDF 1 */}
            <div className="space-y-2">
              <Label>First PDF</Label>
              {pdf1 ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                  <FilePdf className="w-8 h-8 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pdf1.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pdf1.pageCount} page{pdf1.pageCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleClearFile('pdf1')}
                    disabled={isProcessing}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handleFileSelect('pdf1', e)}
                    className="hidden"
                    id="compare-pdf1-input"
                    disabled={isProcessing}
                  />
                  <Button
                    variant="outline"
                    asChild
                    disabled={isProcessing}
                    className="w-full h-20"
                  >
                    <label htmlFor="compare-pdf1-input" className="cursor-pointer flex flex-col items-center gap-1">
                      <Plus className="w-5 h-5" />
                      <span className="text-xs">Select PDF 1</span>
                    </label>
                  </Button>
                </>
              )}
            </div>

            {/* PDF 2 */}
            <div className="space-y-2">
              <Label>Second PDF</Label>
              {pdf2 ? (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                  <FilePdf className="w-8 h-8 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pdf2.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pdf2.pageCount} page{pdf2.pageCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleClearFile('pdf2')}
                    disabled={isProcessing}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handleFileSelect('pdf2', e)}
                    className="hidden"
                    id="compare-pdf2-input"
                    disabled={isProcessing}
                  />
                  <Button
                    variant="outline"
                    asChild
                    disabled={isProcessing}
                    className="w-full h-20"
                  >
                    <label htmlFor="compare-pdf2-input" className="cursor-pointer flex flex-col items-center gap-1">
                      <Plus className="w-5 h-5" />
                      <span className="text-xs">Select PDF 2</span>
                    </label>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Page selection and threshold */}
          {pdf1 && pdf2 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Page to Compare</Label>
                <Select
                  value={String(selectedPage)}
                  onValueChange={(value) => {
                    setSelectedPage(Number(value))
                    setComparisonResult(null)
                  }}
                  disabled={isProcessing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select page" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxPages }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        Page {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Sensitivity</Label>
                  <span className="text-sm text-muted-foreground">{threshold}%</span>
                </div>
                <Slider
                  value={[threshold]}
                  onValueChange={(value) => setThreshold(value[0])}
                  min={1}
                  max={50}
                  step={1}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Lower = more sensitive to differences
                </p>
              </div>
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

          {/* Comparison result */}
          {comparisonResult && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Difference</p>
                    <p
                      className={`text-lg font-bold ${
                        isSignificantlyDifferent(comparisonResult.percentDifferent)
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {formatPercentage(comparisonResult.percentDifferent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Different Pixels</p>
                    <p className="text-sm font-medium">
                      {comparisonResult.diffPixels.toLocaleString()} / {comparisonResult.totalPixels.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportDiff}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Diff
                </Button>
              </div>

              {/* View mode tabs */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="side-by-side">
                    <ArrowsLeftRight className="w-4 h-4 mr-1" />
                    Side by Side
                  </TabsTrigger>
                  <TabsTrigger value="overlay">
                    <Stack className="w-4 h-4 mr-1" />
                    Overlay
                  </TabsTrigger>
                  <TabsTrigger value="diff">
                    <Eye className="w-4 h-4 mr-1" />
                    Diff Only
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={viewMode} className="mt-4">
                  <div
                    ref={canvasContainerRef}
                    className="max-h-[400px] overflow-auto border rounded-md p-2 bg-muted/20"
                  >
                    {renderComparisonView()}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-destructive">
              <Warning className="w-5 h-5" weight="fill" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Close
          </Button>
          <Button
            onClick={handleCompare}
            disabled={isProcessing || !pdf1 || !pdf2}
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Comparing...
              </>
            ) : (
              <>
                <GitDiff className="w-4 h-4 mr-2" />
                Compare Page {selectedPage}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
