import { useEffect, useRef, useState } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { pdfService } from '@/services/pdf.service'

interface PDFCanvasProps {
  page: PDFPageProxy
  scale: number
  pageNumber: number
}

export function PDFCanvas({ page, scale, pageNumber }: PDFCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRendering, setIsRendering] = useState(false)

  useEffect(() => {
    const renderPage = async () => {
      if (!canvasRef.current || isRendering) return

      setIsRendering(true)
      try {
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
      <canvas
        ref={canvasRef}
        className="shadow-lg bg-white"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  )
}
