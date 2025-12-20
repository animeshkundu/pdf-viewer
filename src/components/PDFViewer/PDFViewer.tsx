import { useEffect, useState } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { usePDF } from '@/hooks/usePDF.tsx'
import { PDFCanvas } from './PDFCanvas'
import { pdfService } from '@/services/pdf.service'

export function PDFViewer() {
  const { document, zoom } = usePDF()
  const [pages, setPages] = useState<PDFPageProxy[]>([])

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

  if (!document || pages.length === 0) {
    return null
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-gray/20">
      <div className="flex flex-col items-center py-8 gap-6">
        {pages.map((page, index) => (
          <PDFCanvas
            key={index}
            page={page}
            scale={zoom}
            pageNumber={index + 1}
          />
        ))}
      </div>
    </div>
  )
}
