import { FolderOpen, MagnifyingGlassPlus, MagnifyingGlassMinus, Sidebar, CaretLeft, CaretRight, MagnifyingGlass, PencilLine, Download, Question } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { usePDF } from '@/hooks/usePDF.tsx'
import { ZOOM_LEVELS } from '@/types/pdf.types'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ToolbarProps {
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
  onSearchClick?: () => void
  onMarkupClick?: () => void
  isMarkupOpen?: boolean
  onExportClick?: () => void
  hasUnsavedChanges?: boolean
  onKeyboardShortcutsClick?: () => void
}

export function Toolbar({ onToggleSidebar, isSidebarOpen, onSearchClick, onMarkupClick, isMarkupOpen, onExportClick, hasUnsavedChanges, onKeyboardShortcutsClick }: ToolbarProps) {
  const { zoom, setZoom, document, loadDocument, currentPage, setCurrentPage } = usePDF()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pageInputValue, setPageInputValue] = useState('')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      await loadDocument(file)
    }
  }

  const handleOpenClick = () => {
    fileInputRef.current?.click()
  }

  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(z => z.value === zoom)
    if (currentIndex < ZOOM_LEVELS.length - 1 && typeof ZOOM_LEVELS[currentIndex + 1].value === 'number') {
      setZoom(ZOOM_LEVELS[currentIndex + 1].value as number)
    }
  }

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(z => z.value === zoom)
    if (currentIndex > 0 && typeof ZOOM_LEVELS[currentIndex - 1].value === 'number') {
      setZoom(ZOOM_LEVELS[currentIndex - 1].value as number)
    }
  }

  const handleZoomChange = (value: string) => {
    const zoomLevel = ZOOM_LEVELS.find(z => z.label === value)
    if (zoomLevel && typeof zoomLevel.value === 'number') {
      setZoom(zoomLevel.value)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (document && currentPage < document.numPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value)
  }

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const pageNum = parseInt(pageInputValue)
    if (document && !isNaN(pageNum) && pageNum >= 1 && pageNum <= document.numPages) {
      setCurrentPage(pageNum)
      setPageInputValue('')
    }
  }

  const currentZoomLabel = ZOOM_LEVELS.find(z => z.value === zoom)?.label || '100%'

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between border-b border-border bg-canvas-gray px-3 py-3 gap-4" role="toolbar" aria-label="Document toolbar">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="default"
                onClick={handleOpenClick}
                className="gap-2"
                aria-label="Open PDF file (Ctrl/Cmd+O)"
              >
                <FolderOpen size={20} aria-hidden="true" />
                Open File
                {hasUnsavedChanges && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-destructive" aria-label="Unsaved changes" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open PDF file (Ctrl/Cmd+O)</TooltipContent>
          </Tooltip>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="File input"
          />
          
          {document && onToggleSidebar && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                    aria-pressed={isSidebarOpen}
                  >
                    <Sidebar size={20} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}</TooltipContent>
              </Tooltip>
              
              {onSearchClick && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onSearchClick}
                      aria-label="Search document (Ctrl/Cmd+F)"
                    >
                      <MagnifyingGlass size={20} aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Search (Ctrl/Cmd+F)</TooltipContent>
                </Tooltip>
              )}
              
              {onMarkupClick && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isMarkupOpen ? 'default' : 'ghost'}
                      size="default"
                      onClick={onMarkupClick}
                      aria-label="Toggle markup toolbar (Ctrl/Cmd+Shift+A)"
                      aria-pressed={isMarkupOpen}
                      className={cn('gap-2', isMarkupOpen && 'bg-primary text-primary-foreground')}
                    >
                      <PencilLine size={20} weight={isMarkupOpen ? 'fill' : 'regular'} aria-hidden="true" />
                      Markup
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Markup (Ctrl/Cmd+Shift+A)</TooltipContent>
                </Tooltip>
              )}
              
              {onExportClick && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={onExportClick}
                      aria-label="Export PDF (Ctrl/Cmd+S)"
                      className="gap-2"
                    >
                      <Download size={20} aria-hidden="true" />
                      Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export (Ctrl/Cmd+S)</TooltipContent>
                </Tooltip>
              )}

              {onKeyboardShortcutsClick && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onKeyboardShortcutsClick}
                      aria-label="Keyboard shortcuts (?)"
                    >
                      <Question size={20} aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>

        {document && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" role="group" aria-label="Page navigation">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                  >
                    <CaretLeft size={20} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous page (↑/k)</TooltipContent>
              </Tooltip>

              <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
                <Input
                  type="text"
                  value={pageInputValue || currentPage}
                  onChange={handlePageInputChange}
                  onFocus={(e) => {
                    setPageInputValue(currentPage.toString())
                    e.target.select()
                  }}
                  onBlur={() => setPageInputValue('')}
                  className="w-14 h-8 text-center text-sm"
                  aria-label={`Current page ${currentPage} of ${document.numPages}`}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap" aria-hidden="true">
                  of {document.numPages}
                </span>
              </form>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextPage}
                    disabled={currentPage >= document.numPages}
                    aria-label="Next page"
                  >
                    <CaretRight size={20} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next page (↓/j)</TooltipContent>
              </Tooltip>
            </div>

            <div className="h-5 w-px bg-border" aria-hidden="true" />

            <div className="flex items-center gap-2" role="group" aria-label="Zoom controls">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    aria-label="Zoom out"
                  >
                    <MagnifyingGlassMinus size={20} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom out (-)</TooltipContent>
              </Tooltip>

              <Select value={currentZoomLabel} onValueChange={handleZoomChange}>
                <SelectTrigger className="w-32" aria-label={`Zoom level: ${currentZoomLabel}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZOOM_LEVELS.map((level) => (
                    <SelectItem key={level.label} value={level.label}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 4.0}
                    aria-label="Zoom in"
                  >
                    <MagnifyingGlassPlus size={20} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom in (+/=)</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
