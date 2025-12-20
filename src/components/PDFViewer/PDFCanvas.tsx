import { useEffect, useRef, useState } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { pdfService } from '@/services/pdf.service'
import { SearchHighlight } from '@/components/SearchBar/SearchHighlight'
import { AnnotationLayer } from '@/components/AnnotationLayer/AnnotationLayer'
import { AnnotationDrawing } from '@/components/AnnotationDrawing/AnnotationDrawing'
import { usePageManagement } from '@/hooks/usePageManagement'

interface PDFCanvasProps {
  page: PDFPageProxy
  scale: number
  pageNumber: number
}

export function PDFCanvas({ page, scale, pageNumber }: PDFCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const { getRotation } = usePageManagement()
  const rotation = getRotation(pageNumber)

  useEffect(() => {
    const renderPage = async () => {
      if (!canvasRef.current || isRendering) return

      setIsRendering(true)
      try {
        const viewport = page.getViewport({ scale, rotation })
        setDimensions({ width: viewport.width, height: viewport.height })
        await pdfService.renderPage(page, scale, canvasRef.current, rotation)
      } catch (error) {
        console.error('Error rendering page:', error)
      } finally {
        setIsRendering(false)
      }
    }

    renderPage()
  }, [page, scale, pageNumber, rotation, isRendering])

  return (
    <div className="relative flex items-center justify-center p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="shadow-lg bg-white"
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
