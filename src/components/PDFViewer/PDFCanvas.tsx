import { useEffect, useRef, useState } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { pdfService } from '@/services/pdf.service'
import { SearchHighlight } from '@/components/SearchBar/SearchHighlight'
import { AnnotationLayer } from '@/components/AnnotationLayer/AnnotationLayer'
import { AnnotationDrawing } from '@/components/AnnotationDrawing/AnnotationDrawing'

interface PDFCanvasProps {
  page: PDFPageProxy
  scale: number
  pageNumber: number
}

export function PDFCanvas({ page, scale, pageNumber }: PDFCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const renderPage = async () => {
      if (!canvasRef.current || isRendering) return

      setIsRendering(true)
      try {
        const viewport = page.getViewport({ scale })
        setDimensions({ width: viewport.width, height: viewport.height })
        await pdfService.renderPage(page, scale, canvasRef.current)
      } catch (error) {
        console.error('Error rendering page:', error)
      } finally {
        setIsRendering(false)
      }
    }

    renderPage()
  }, [page, scale, pageNumber, isRendering])

  return (
    <div className="relative flex items-center justify-center p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="shadow-lg bg-white"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <SearchHighlight
          pageNumber={pageNumber}
          scale={scale}
          pageWidth={dimensions.width}
          pageHeight={dimensions.height}
        />
        <AnnotationLayer
          pageNum={pageNumber}
          width={dimensions.width}
          height={dimensions.height}
          scale={scale}
        />
        <AnnotationDrawing
          pageNum={pageNumber}
          width={dimensions.width}
          height={dimensions.height}
          scale={scale}
        />
      </div>
    </div>
  )
}
