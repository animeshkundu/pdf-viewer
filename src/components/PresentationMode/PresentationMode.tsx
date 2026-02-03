import { useEffect, useState, useCallback, useRef } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { usePDF } from '@/hooks/usePDF.tsx'
import { pdfService } from '@/services/pdf.service'
import { Button } from '@/components/ui/button'
import { X, CaretLeft, CaretRight, Play, Pause, Timer } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface PresentationModeProps {
  isOpen: boolean
  onClose: () => void
}

export function PresentationMode({ isOpen, onClose }: PresentationModeProps) {
  const { document: pdfDocument, currentPage, setCurrentPage } = usePDF()
  const [page, setPage] = useState<PDFPageProxy | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [autoAdvanceInterval, setAutoAdvanceInterval] = useState(5000)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalPages = pdfDocument?.numPages ?? 0

  const goToPage = useCallback((pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
    }
  }, [totalPages, setCurrentPage])

  const goToPrevious = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const goToNext = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const enterFullscreen = useCallback(async () => {
    try {
      if (window.document.documentElement.requestFullscreen) {
        await window.document.documentElement.requestFullscreen()
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (window.document.fullscreenElement && window.document.exitFullscreen) {
        await window.document.exitFullscreen()
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error)
    }
  }, [])

  // Enter fullscreen when opening
  useEffect(() => {
    if (isOpen) {
      enterFullscreen()
    }
    return () => {
      exitFullscreen()
    }
  }, [isOpen, enterFullscreen, exitFullscreen])

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!window.document.fullscreenElement && isOpen) {
        onClose()
      }
    }

    window.document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      window.document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [isOpen, onClose])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault()
          goToNext()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault()
          goToPrevious()
          break
        case 'Home':
          e.preventDefault()
          goToPage(1)
          break
        case 'End':
          e.preventDefault()
          goToPage(totalPages)
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, goToNext, goToPrevious, goToPage, totalPages, onClose])

  // Auto-advance timer
  useEffect(() => {
    if (autoAdvance && isOpen) {
      autoAdvanceTimerRef.current = setInterval(() => {
        if (currentPage < totalPages) {
          goToNext()
        } else {
          setAutoAdvance(false)
        }
      }, autoAdvanceInterval)
    }

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearInterval(autoAdvanceTimerRef.current)
        autoAdvanceTimerRef.current = null
      }
    }
  }, [autoAdvance, isOpen, currentPage, totalPages, autoAdvanceInterval, goToNext])

  // Load current page
  useEffect(() => {
    if (!pdfDocument || !isOpen) return

    const loadPage = async () => {
      try {
        const loadedPage = await pdfService.getPage(currentPage)
        setPage(loadedPage)
      } catch (error) {
        console.error('Error loading page:', error)
      }
    }

    loadPage()
  }, [pdfDocument, currentPage, isOpen])

  // Render page to canvas
  useEffect(() => {
    if (!page || !canvasRef.current || !containerRef.current || !isOpen) return

    const renderPage = async () => {
      setIsRendering(true)

      try {
        const container = containerRef.current!
        const canvas = canvasRef.current!
        const viewport = page.getViewport({ scale: 1 })

        // Calculate scale to fit within container with padding
        const containerWidth = container.clientWidth - 80
        const containerHeight = container.clientHeight - 160
        const scaleWidth = containerWidth / viewport.width
        const scaleHeight = containerHeight / viewport.height
        const scale = Math.min(scaleWidth, scaleHeight)

        await pdfService.renderPage(page, scale, canvas)
      } catch (error) {
        console.error('Error rendering page:', error)
      } finally {
        setIsRendering(false)
      }
    }

    renderPage()
  }, [page, isOpen])

  if (!isOpen || !pdfDocument) {
    return null
  }

  const toggleAutoAdvance = () => {
    setAutoAdvance(!autoAdvance)
  }

  const cycleAutoAdvanceInterval = () => {
    const intervals = [3000, 5000, 10000, 15000, 30000]
    const currentIndex = intervals.indexOf(autoAdvanceInterval)
    const nextIndex = (currentIndex + 1) % intervals.length
    setAutoAdvanceInterval(intervals[nextIndex])
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 z-10"
      >
        <X size={24} />
      </Button>

      {/* Page canvas */}
      <div className="flex-1 flex items-center justify-center w-full relative">
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={cn(
            'max-w-full max-h-full shadow-2xl transition-opacity duration-200',
            isRendering && 'opacity-50'
          )}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
          {/* Previous button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            disabled={currentPage <= 1}
            className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <CaretLeft size={24} />
          </Button>

          {/* Page indicator */}
          <span className="text-white font-medium px-3 min-w-[100px] text-center">
            {currentPage} / {totalPages}
          </span>

          {/* Next button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            disabled={currentPage >= totalPages}
            className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <CaretRight size={24} />
          </Button>

          <div className="w-px h-6 bg-white/20 mx-2" />

          {/* Auto-advance toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAutoAdvance}
            className={cn(
              'text-white/70 hover:text-white hover:bg-white/10',
              autoAdvance && 'text-primary bg-white/10'
            )}
            title={autoAdvance ? 'Stop auto-advance' : 'Start auto-advance'}
          >
            {autoAdvance ? <Pause size={20} /> : <Play size={20} />}
          </Button>

          {/* Auto-advance interval */}
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleAutoAdvanceInterval}
            className="text-white/70 hover:text-white hover:bg-white/10 text-xs gap-1"
            title="Change auto-advance interval"
          >
            <Timer size={16} />
            {autoAdvanceInterval / 1000}s
          </Button>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 right-4 text-white/40 text-xs">
        Use arrow keys or spacebar to navigate
      </div>
    </div>
  )
}
