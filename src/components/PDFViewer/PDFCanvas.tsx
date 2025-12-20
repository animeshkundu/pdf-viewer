import { useEffect, useRef, useState } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { pdfService } from '@/services/pdf.service'
import { PDFTextLayer } from '@/components/PDFViewer/PDFTextLayer'
import { AnnotationLayer } from '@/components/AnnotationLayer/AnnotationLayer'
import { AnnotationDrawing } from '@/components/AnnotationDrawing/AnnotationDrawing'
import { FormOverlayLayer } from '@/components/FormFieldOverlay/FormOverlayLayer'
import { WatermarkOverlay } from '@/components/WatermarkOverlay/WatermarkOverlay'
import { PageNumberOverlay } from '@/components/PageNumberOverlay/PageNumberOverlay'
import { usePageManagement } from '@/hooks/usePageManagement'
import { usePDF } from '@/hooks/usePDF.tsx'

interface PDFCanvasProps {
  page: PDFPageProxy
  scale: number
  pageNumber: number
}

export function PDFCanvas({ page, scale, pageNumber }: PDFCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const renderRequestRef = useRef<number | null>(null)
  const { getRotation } = usePageManagement()
  const { document } = usePDF()
  const rotation = getRotation(pageNumber)

  useEffect(() => {
    const renderPage = async () => {
      if (!canvasRef.current || isRendering) return

      if (renderRequestRef.current) {
        cancelAnimationFrame(renderRequestRef.current)
      }

      renderRequestRef.current = requestAnimationFrame(async () => {
        setIsRendering(true)
        try {
          const viewport = page.getViewport({ scale, rotation })
          setDimensions({ width: viewport.width, height: viewport.height })
          await pdfService.renderPage(page, scale, canvasRef.current!, rotation)
        } catch (error) {
          console.error('Error rendering page:', error)
        } finally {
          setIsRendering(false)
          renderRequestRef.current = null
        }
      })
    }

    renderPage()

    return () => {
      if (renderRequestRef.current) {
        cancelAnimationFrame(renderRequestRef.current)
      }
    }
  }, [page, scale, pageNumber, rotation, isRendering])

  const viewport = page.getViewport({ scale, rotation })
  
  return (
    <div className="relative flex items-center justify-center p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="shadow-lg bg-white"
        />
        <PDFTextLayer
          page={page}
          scale={scale}
          pageNumber={pageNumber}
          width={dimensions.width}
          height={dimensions.height}
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
        <WatermarkOverlay
          pageNumber={pageNumber}
          width={dimensions.width}
          height={dimensions.height}
          scale={scale}
          totalPages={document?.numPages || 0}
        />
        <PageNumberOverlay
          pageNumber={pageNumber}
          scale={scale}
          pageWidth={dimensions.width}
          pageHeight={dimensions.height}
        />
        <FormOverlayLayer
          pageNumber={pageNumber}
          scale={scale}
          pageWidth={viewport.width / scale}
          pageHeight={viewport.height / scale}
        />
      </div>
    </div>
  )
}
