import { useEffect, useRef, useState } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { usePDF } from '@/hooks/usePDF.tsx'
import { usePageManagement } from '@/hooks/usePageManagement'
import { pdfService } from '@/services/pdf.service'
import { cn } from '@/lib/utils'
import { X, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageContextMenu } from './PageContextMenu'
import { InsertBlankPageDialog } from '@/components/InsertBlankPageDialog'
import type { PageSize, PageOrientation } from '@/types/page-management.types'
import { toast } from 'sonner'

interface ThumbnailProps {
  page: PDFPageProxy
  pageNumber: number
  isCurrentPage: boolean
  isSelected: boolean
  isDeleted: boolean
  rotation: number
  onNavigate: () => void
  onSelect: (event: React.MouseEvent) => void
  onRotateLeft: (pageNumber: number) => void
  onRotateRight: (pageNumber: number) => void
  onDelete: (pageNumber: number) => void
  onInsertBefore: (pageNumber: number) => void
  onInsertAfter: (pageNumber: number) => void
  onDragStart: (pageNumber: number) => void
  onDragOver: (event: React.DragEvent) => void
  onDrop: (pageNumber: number) => void
}

function Thumbnail({ 
  page, 
  pageNumber, 
  isCurrentPage,
  isSelected, 
  isDeleted,
  rotation,
  onNavigate,
  onSelect,
  onRotateLeft,
  onRotateRight,
  onDelete,
  onInsertBefore,
  onInsertAfter,
  onDragStart,
  onDragOver,
  onDrop,
}: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRendered, setIsRendered] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (containerWidth === 0) return
    
    setIsRendered(false)
    
    const renderThumbnail = async () => {
      if (!canvasRef.current) return

      try {
        const viewport = page.getViewport({ scale: 1 })
        const scale = (containerWidth - 16) / viewport.width
        
        await pdfService.renderPage(page, scale, canvasRef.current)
        setIsRendered(true)
      } catch (error) {
        console.error('Error rendering thumbnail:', error)
      }
    }

    renderThumbnail()
  }, [page, containerWidth])

  if (isDeleted) {
    return null
  }

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      onSelect(e)
    } else {
      onNavigate()
    }
  }

  return (
    <PageContextMenu
      pageNumber={pageNumber}
      isSelected={isSelected}
      onRotateLeft={onRotateLeft}
      onRotateRight={onRotateRight}
      onDelete={onDelete}
      onInsertBefore={onInsertBefore}
      onInsertAfter={onInsertAfter}
    >
      <button
        draggable
        onDragStart={() => onDragStart(pageNumber)}
        onDragOver={onDragOver}
        onDrop={() => onDrop(pageNumber)}
        onClick={handleClick}
        className={cn(
          'relative flex flex-col items-center gap-2.5 p-3 rounded-xl transition-all cursor-pointer group w-full',
          'hover:bg-muted/60 hover:shadow-md',
          isCurrentPage && 'bg-primary/5 ring-2 ring-primary shadow-lg',
          isSelected && 'ring-2 ring-accent shadow-md'
        )}
      >
        <div 
          ref={containerRef}
          className="relative bg-white shadow-md rounded-lg w-full flex items-center justify-center overflow-hidden ring-1 ring-border/20"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 200ms ease-out, shadow 200ms ease-out'
          }}
        >
          <canvas ref={canvasRef} className="w-full h-auto" />
          {!isRendered && (
            <div className="absolute inset-0 bg-muted/50 animate-pulse" />
          )}
        </div>
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          {pageNumber}
        </span>
      </button>
    </PageContextMenu>
  )
}

interface ThumbnailSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function ThumbnailSidebar({ isOpen, onClose }: ThumbnailSidebarProps) {
  const { document, currentPage, setCurrentPage } = usePDF()
  const { 
    selectedPages, 
    selectPage, 
    rotatePage, 
    deletePage, 
    deletePages,
    insertBlankPage,
    getRotation, 
    isDeleted,
    getVisiblePages,
    pageOrder,
    reorderPages,
    clearSelection
  } = usePageManagement()
  const [pages, setPages] = useState<PDFPageProxy[]>([])
  const selectedRef = useRef<HTMLDivElement>(null)
  const [draggedPage, setDraggedPage] = useState<number | null>(null)
  const [insertDialogOpen, setInsertDialogOpen] = useState(false)
  const [insertPosition, setInsertPosition] = useState<'before' | 'after'>('before')
  const [insertPageNumber, setInsertPageNumber] = useState<number>(1)

  useEffect(() => {
    const loadPages = async () => {
      if (!document) {
        setPages([])
        return
      }

      setPages([])
      
      const loadedPages: PDFPageProxy[] = []
      for (let i = 1; i <= document.numPages; i++) {
        const page = await pdfService.getPage(i)
        loadedPages.push(page)
      }
      setPages(loadedPages)
    }

    loadPages()
  }, [document])

  useEffect(() => {
    if (selectedRef.current && isOpen) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [currentPage, isOpen])

  const handleSelect = (pageNumber: number, event: React.MouseEvent) => {
    if (event.shiftKey) {
      selectPage(pageNumber, 'range')
    } else if (event.metaKey || event.ctrlKey) {
      selectPage(pageNumber, 'add')
    } else {
      selectPage(pageNumber, 'single')
    }
  }

  const handleRotateLeft = (pageNumber: number) => {
    rotatePage(pageNumber, 'left')
  }

  const handleRotateRight = (pageNumber: number) => {
    rotatePage(pageNumber, 'right')
  }

  const handleDelete = (pageNumber: number) => {
    if (selectedPages.has(pageNumber) && selectedPages.size > 1) {
      deletePages(Array.from(selectedPages))
    } else {
      deletePage(pageNumber)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedPages.size > 0) {
      deletePages(Array.from(selectedPages))
    }
  }

  const handleDragStart = (pageNumber: number) => {
    setDraggedPage(pageNumber)
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (targetPageNumber: number) => {
    if (draggedPage === null || draggedPage === targetPageNumber) {
      setDraggedPage(null)
      return
    }

    const fromIndex = pageOrder.indexOf(draggedPage)
    const toIndex = pageOrder.indexOf(targetPageNumber)

    if (fromIndex !== -1 && toIndex !== -1) {
      reorderPages(fromIndex, toIndex)
    }

    setDraggedPage(null)
  }

  const handleInsertBefore = (pageNumber: number) => {
    setInsertPageNumber(pageNumber)
    setInsertPosition('before')
    setInsertDialogOpen(true)
  }

  const handleInsertAfter = (pageNumber: number) => {
    setInsertPageNumber(pageNumber)
    setInsertPosition('after')
    setInsertDialogOpen(true)
  }

  const handleInsertBlankPage = (size: PageSize, orientation: PageOrientation) => {
    const position = insertPosition === 'before' ? insertPageNumber - 1 : insertPageNumber
    insertBlankPage(position, size, orientation)
    toast.success(`Blank page will be inserted ${insertPosition} page ${insertPageNumber}`)
  }

  const visiblePageCount = getVisiblePages().length

  if (!isOpen || !document) {
    return null
  }

  return (
    <div className="border-r border-border/60 bg-gradient-to-b from-muted/30 to-muted/10 flex flex-col h-full w-full backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/60 bg-white/50">
        <h2 className="text-sm font-bold text-foreground tracking-wide uppercase">
          Pages <span className="text-xs font-normal text-muted-foreground ml-1">({visiblePageCount})</span>
        </h2>
        <div className="flex items-center gap-1">
          {selectedPages.size > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteSelected}
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
              title={`Delete ${selectedPages.size} page${selectedPages.size > 1 ? 's' : ''}`}
            >
              <Trash size={16} weight="bold" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 hover:bg-muted transition-all"
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 h-0">
        <div className="p-4 space-y-3">
          {pageOrder.map((pageNum) => {
            const page = pages[pageNum - 1]
            if (!page || isDeleted(pageNum)) return null
            
            return (
              <div
                key={pageNum}
                ref={currentPage === pageNum ? selectedRef : null}
              >
                <Thumbnail
                  page={page}
                  pageNumber={pageNum}
                  isCurrentPage={currentPage === pageNum}
                  isSelected={selectedPages.has(pageNum)}
                  isDeleted={isDeleted(pageNum)}
                  rotation={getRotation(pageNum)}
                  onNavigate={() => {
                    setCurrentPage(pageNum)
                    clearSelection()
                  }}
                  onSelect={(e) => handleSelect(pageNum, e)}
                  onRotateLeft={handleRotateLeft}
                  onRotateRight={handleRotateRight}
                  onDelete={handleDelete}
                  onInsertBefore={handleInsertBefore}
                  onInsertAfter={handleInsertAfter}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <InsertBlankPageDialog
        isOpen={insertDialogOpen}
        onClose={() => setInsertDialogOpen(false)}
        onInsert={handleInsertBlankPage}
        position={insertPosition}
        pageNumber={insertPageNumber}
      />
    </div>
  )
}
