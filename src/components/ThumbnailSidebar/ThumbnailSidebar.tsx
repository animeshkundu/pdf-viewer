import { useEffect, useRef, useState } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { usePDF } from '@/hooks/usePDF.tsx'
import { pdfService } from '@/services/pdf.service'
import { cn } from '@/lib/utils'
import { X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ThumbnailProps {
  page: PDFPageProxy
  pageNumber: number
  isSelected: boolean
  onClick: () => void
}

function Thumbnail({ page, pageNumber, isSelected, onClick }: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRendered, setIsRendered] = useState(false)

  useEffect(() => {
    const renderThumbnail = async () => {
      if (!canvasRef.current || isRendered) return

      try {
        await pdfService.renderPage(page, 0.3, canvasRef.current)
        setIsRendered(true)
      } catch (error) {
        console.error('Error rendering thumbnail:', error)
      }
    }

    renderThumbnail()
  }, [page, isRendered])

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-2 p-2 rounded-md transition-all cursor-pointer group',
        'hover:bg-muted',
        isSelected && 'bg-accent/20 ring-2 ring-accent'
      )}
    >
      <div className="relative bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto"
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {pageNumber}
      </span>
    </button>
  )
}

interface ThumbnailSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function ThumbnailSidebar({ isOpen, onClose }: ThumbnailSidebarProps) {
  const { document, currentPage, setCurrentPage } = usePDF()
  const [pages, setPages] = useState<PDFPageProxy[]>([])
  const selectedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadPages = async () => {
      if (!document) {
        setPages([])
        return
      }

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

  if (!isOpen || !document) {
    return null
  }

  return (
    <div className="w-52 border-r border-border bg-canvas-gray flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Pages</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6"
        >
          <X size={16} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {pages.map((page, index) => (
            <div
              key={index}
              ref={currentPage === index + 1 ? selectedRef : null}
            >
              <Thumbnail
                page={page}
                pageNumber={index + 1}
                isSelected={currentPage === index + 1}
                onClick={() => setCurrentPage(index + 1)}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
