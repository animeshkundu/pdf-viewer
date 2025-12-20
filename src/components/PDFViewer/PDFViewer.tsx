import { useEffect, useState, useRef, useCallback } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { usePDF } from '@/hooks/usePDF.tsx'
import { usePageManagement } from '@/hooks/usePageManagement'
import { useGestures } from '@/hooks/useGestures'
import { PDFCanvas } from './PDFCanvas'
import { pdfService } from '@/services/pdf.service'

export function PDFViewer() {
  const { document, zoom, currentPage, setCurrentPage, setZoom } = usePDF()
  const { pageOrder, isDeleted, getRotation } = usePageManagement()
  const [pages, setPages] = useState<PDFPageProxy[]>([])
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isUserScrollingRef = useRef(true)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialPinchZoomRef = useRef(zoom)
  const hasCalculatedInitialZoom = useRef(false)

  const calculateEffectiveZoom = useCallback((page: PDFPageProxy | null): number => {
    if (!page || !containerRef.current) return 1.0
    
    if (zoom === 'fit-width') {
      const container = containerRef.current
      const containerWidth = container.clientWidth
      const padding = 64
      const availableWidth = containerWidth - padding
      
      const viewport = page.getViewport({ scale: 1.0 })
      const pageWidth = viewport.width
      return Math.min(availableWidth / pageWidth, 4.0)
    }
    
    if (zoom === 'fit-page') {
      const container = containerRef.current
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      const padding = 64
      const availableWidth = containerWidth - padding
      const availableHeight = containerHeight - padding
      
      const viewport = page.getViewport({ scale: 1.0 })
      const pageWidth = viewport.width
      const pageHeight = viewport.height
      
      const widthScale = availableWidth / pageWidth
      const heightScale = availableHeight / pageHeight
      return Math.min(widthScale, heightScale, 4.0)
    }
    
    return zoom
  }, [zoom])

  useEffect(() => {
    if (document && pages.length > 0 && zoom === 'fit-width' && !hasCalculatedInitialZoom.current) {
      hasCalculatedInitialZoom.current = true
    }
  }, [document, pages, zoom])

  useGestures(containerRef, {
    onPinchStart: () => {
      initialPinchZoomRef.current = typeof zoom === 'number' ? zoom : 1.0
    },
    onPinch: (scale) => {
      const currentZoom = typeof initialPinchZoomRef.current === 'number' ? initialPinchZoomRef.current : 1.0
      const newZoom = Math.max(0.5, Math.min(4.0, currentZoom * scale))
      setZoom(newZoom)
    },
    onSwipe: (direction) => {
      if (direction === 'left' && currentPage < pages.length) {
        setCurrentPage(currentPage + 1)
      } else if (direction === 'right' && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    }
  }, !!document)

  useEffect(() => {
    const loadPages = async () => {
      if (!document) {
        setPages([])
        hasCalculatedInitialZoom.current = false
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

  const updateCurrentPage = useCallback((entries: IntersectionObserverEntry[]) => {
    if (!isUserScrollingRef.current) return

    let mostVisiblePage = currentPage
    let maxRatio = 0

    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
        maxRatio = entry.intersectionRatio
        const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1')
        mostVisiblePage = pageNum
      }
    })

    if (maxRatio > 0.5 && mostVisiblePage !== currentPage) {
      setCurrentPage(mostVisiblePage)
    }
  }, [currentPage, setCurrentPage])

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = new Set(visiblePages)
        
        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '0')
          if (entry.isIntersecting) {
            visible.add(pageNum)
          } else {
            visible.delete(pageNum)
          }
        })

        setVisiblePages(visible)
        updateCurrentPage(entries)
      },
      {
        root: containerRef.current,
        rootMargin: '500px 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    )

    pageRefs.current.forEach((ref) => {
      observerRef.current?.observe(ref)
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [pages, visiblePages, updateCurrentPage])

  useEffect(() => {
    const pageElement = pageRefs.current.get(currentPage)
    if (pageElement && containerRef.current) {
      isUserScrollingRef.current = false
      
      pageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = true
      }, 1000)
    }
  }, [currentPage])

  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = true
      }, 150)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => {
        container.removeEventListener('scroll', handleScroll)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }
  }, [])

  const setPageRef = useCallback((pageNumber: number, element: HTMLDivElement | null) => {
    if (element) {
      pageRefs.current.set(pageNumber, element)
      observerRef.current?.observe(element)
    } else {
      const oldRef = pageRefs.current.get(pageNumber)
      if (oldRef) {
        observerRef.current?.unobserve(oldRef)
        pageRefs.current.delete(pageNumber)
      }
    }
  }, [])

  if (!document || pages.length === 0) {
    return null
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-auto bg-gradient-to-br from-muted/20 via-background to-muted/30 scroll-smooth relative"
    >
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />
      <div className="flex flex-col items-center py-8 gap-8 relative">
        {pageOrder.map((pageNum) => {
          if (isDeleted(pageNum)) return null
          
          const page = pages[pageNum - 1]
          if (!page) return null
          
          const isVisible = visiblePages.has(pageNum)
          const rotation = getRotation(pageNum)
          const effectiveZoom = calculateEffectiveZoom(page)

          return (
            <div
              key={pageNum}
              ref={(el) => setPageRef(pageNum, el)}
              data-page-number={pageNum}
              className="relative shadow-2xl rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-3xl"
            >
              {isVisible ? (
                <PDFCanvas
                  page={page}
                  scale={effectiveZoom}
                  pageNumber={pageNum}
                />
              ) : (
                <div 
                  className="bg-white shadow-xl"
                  style={{
                    width: page.getViewport({ scale: effectiveZoom, rotation }).width,
                    height: page.getViewport({ scale: effectiveZoom, rotation }).height,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
