import { useEffect, useState, useRef, useCallback } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { usePDF } from '@/hooks/usePDF.tsx'
import { PDFCanvas } from './PDFCanvas'
import { pdfService } from '@/services/pdf.service'

export function PDFViewer() {
  const { document, zoom, currentPage, setCurrentPage } = usePDF()
  const [pages, setPages] = useState<PDFPageProxy[]>([])
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isUserScrollingRef = useRef(true)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      className="flex-1 overflow-auto bg-slate-gray/20 scroll-smooth"
    >
      <div className="flex flex-col items-center py-8 gap-6">
        {pages.map((page, index) => {
          const pageNumber = index + 1
          const isVisible = visiblePages.has(pageNumber)

          return (
            <div
              key={pageNumber}
              ref={(el) => setPageRef(pageNumber, el)}
              data-page-number={pageNumber}
              className="relative"
            >
              {isVisible ? (
                <PDFCanvas
                  page={page}
                  scale={zoom}
                  pageNumber={pageNumber}
                />
              ) : (
                <div 
                  className="bg-white shadow-lg"
                  style={{
                    width: page.getViewport({ scale: zoom }).width,
                    height: page.getViewport({ scale: zoom }).height,
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
