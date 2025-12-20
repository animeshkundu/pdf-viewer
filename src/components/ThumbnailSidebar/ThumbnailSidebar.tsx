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
  onDragStart,
  onDragOver,
  onDrop,
}: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRendered, setIsRendered] = useState(false)

  useEffect(() => {
    setIsRendered(false)
    
    const renderThumbnail = async () => {
      if (!canvasRef.current) return

      try {
        await pdfService.renderPage(page, 0.3, canvasRef.current)
        setIsRendered(true)
      } catch (error) {
        console.error('Error rendering thumbnail:', error)
      }
    }

    renderThumbnail()
  }, [page])

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
    >
      <button
        draggable
        onDragStart={() => onDragStart(pageNumber)}
        onDragOver={onDragOver}
        onDrop={() => onDrop(pageNumber)}
        onClick={handleClick}
        className={cn(
          'relative flex flex-col items-center gap-2 p-2 rounded-md transition-all cursor-pointer group w-full',
          'hover:bg-muted',
          isCurrentPage && 'bg-accent/20 ring-2 ring-accent',
          isSelected && 'ring-2 ring-primary'
        )}
      >
        <div 
          className="relative bg-white shadow-sm w-full flex items-center justify-center"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 200ms ease-out'
          }}
        >
          <canvas ref={canvasRef} className="max-w-full h-auto" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
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

  const visiblePageCount = getVisiblePages().length

  if (!isOpen || !document) {
    return null
  }

  return (
    <div className="border-r border-border bg-canvas-gray flex flex-col h-full min-w-[180px]">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">
          Pages ({visiblePageCount})
        </h2>
        <div className="flex items-center gap-1">
          {selectedPages.size > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteSelected}
              className="h-6 w-6 text-destructive hover:text-destructive"
              title={`Delete ${selectedPages.size} page${selectedPages.size > 1 ? 's' : ''}`}
            >
              <Trash size={16} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 h-0">
        <div className="p-3 space-y-3">
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
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
