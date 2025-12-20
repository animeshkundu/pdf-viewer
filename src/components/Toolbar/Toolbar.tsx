import { FolderOpen, MagnifyingGlassPlus, MagnifyingGlassMinus, Sidebar, CaretLeft, CaretRight, MagnifyingGlass, PencilLine, Download, Question, TextT } from '@phosphor-icons/react'
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
  onFormClick?: () => void
  isFormOpen?: boolean
  hasForm?: boolean
  onExportClick?: () => void
  hasUnsavedChanges?: boolean
  onKeyboardShortcutsClick?: () => void
}

export function Toolbar({ 
  onToggleSidebar, 
  isSidebarOpen, 
  onSearchClick, 
  onMarkupClick, 
  isMarkupOpen,
  onFormClick,
  isFormOpen,
  hasForm,
  onExportClick, 
  hasUnsavedChanges, 
  onKeyboardShortcutsClick 
}: ToolbarProps) {
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
      <div className="flex items-center justify-between border-b border-border/60 bg-white/80 backdrop-blur-xl px-3 md:px-4 py-3 gap-3 md:gap-6 shadow-sm" role="toolbar" aria-label="Document toolbar">
        <div className="flex items-center gap-1.5 md:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="default"
                onClick={handleOpenClick}
                className="gap-2 button-press hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-primary to-accent border-0"
                aria-label="Open PDF file (Ctrl/Cmd+O)"
              >
                <FolderOpen size={18} weight="bold" aria-hidden="true" />
                <span className="hidden sm:inline font-medium">Open File</span>
                {hasUnsavedChanges && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-white animate-pulse" aria-label="Unsaved changes" />
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
              <div className="w-px h-6 bg-border/50 mx-1 hidden md:block" aria-hidden="true" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                    aria-pressed={isSidebarOpen}
                    className={cn(
                      "button-press transition-all duration-200",
                      isSidebarOpen && "bg-muted text-primary"
                    )}
                  >
                    <Sidebar size={20} weight={isSidebarOpen ? "fill" : "regular"} aria-hidden="true" />
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
                      className="button-press hover:bg-muted transition-all duration-200"
                    >
                      <MagnifyingGlass size={20} aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Search (Ctrl/Cmd+F)</TooltipContent>
                </Tooltip>
              )}

              <div className="w-px h-6 bg-border/50 mx-1 hidden md:block" aria-hidden="true" />
              
              {onMarkupClick && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isMarkupOpen ? 'default' : 'ghost'}
                      size="default"
                      onClick={onMarkupClick}
                      aria-label="Toggle markup toolbar (Ctrl/Cmd+Shift+A)"
                      aria-pressed={isMarkupOpen}
                      className={cn(
                        'gap-2 button-press transition-all duration-200',
                        isMarkupOpen && 'bg-primary text-primary-foreground shadow-md hover:shadow-lg'
                      )}
                    >
                      <PencilLine size={18} weight={isMarkupOpen ? 'fill' : 'regular'} aria-hidden="true" />
                      <span className="hidden sm:inline font-medium">Markup</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Markup (Ctrl/Cmd+Shift+A)</TooltipContent>
                </Tooltip>
              )}

              {hasForm && onFormClick && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isFormOpen ? 'default' : 'ghost'}
                      size="default"
                      onClick={onFormClick}
                      aria-label="Toggle form filling (F)"
                      aria-pressed={isFormOpen}
                      className={cn(
                        'gap-2 button-press transition-all duration-200',
                        isFormOpen && 'bg-accent text-accent-foreground shadow-md hover:shadow-lg'
                      )}
                    >
                      <TextT size={18} weight={isFormOpen ? 'fill' : 'regular'} aria-hidden="true" />
                      <span className="hidden sm:inline font-medium">Forms</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Forms (F)</TooltipContent>
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
                      className="gap-2 button-press hover:bg-muted transition-all duration-200"
                    >
                      <Download size={18} weight="bold" aria-hidden="true" />
                      <span className="hidden sm:inline font-medium">Export</span>
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
                      className="button-press hidden md:flex hover:bg-muted transition-all duration-200"
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
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1" role="group" aria-label="Page navigation">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                    className="button-press h-8 w-8 hover:bg-background/80"
                  >
                    <CaretLeft size={18} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous page (↑/k)</TooltipContent>
              </Tooltip>

              <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 px-1">
                <Input
                  type="text"
                  value={pageInputValue || currentPage}
                  onChange={handlePageInputChange}
                  onFocus={(e) => {
                    setPageInputValue(currentPage.toString())
                    e.target.select()
                  }}
                  onBlur={() => setPageInputValue('')}
                  className="w-12 md:w-14 h-7 text-center text-sm font-medium border-0 bg-background/80 focus:ring-2 focus:ring-primary/20 transition-all"
                  aria-label={`Current page ${currentPage} of ${document.numPages}`}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap font-mono" aria-hidden="true">
                  / {document.numPages}
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
                    className="button-press h-8 w-8 hover:bg-background/80"
                  >
                    <CaretRight size={18} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next page (↓/j)</TooltipContent>
              </Tooltip>
            </div>

            <div className="w-px h-6 bg-border/50 hidden md:block" aria-hidden="true" />

            <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1 hidden sm:flex" role="group" aria-label="Zoom controls">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    aria-label="Zoom out"
                    className="button-press h-8 w-8 hover:bg-background/80"
                  >
                    <MagnifyingGlassMinus size={18} aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom out (-)</TooltipContent>
              </Tooltip>

              <Select value={currentZoomLabel} onValueChange={handleZoomChange}>
                <SelectTrigger className="w-28 h-8 border-0 bg-background/80 text-sm font-medium transition-all hover:bg-background" aria-label={`Zoom level: ${currentZoomLabel}`}>
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
                    className="button-press h-8 w-8 hover:bg-background/80"
                  >
                    <MagnifyingGlassPlus size={18} aria-hidden="true" />
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
