import { useEffect, useRef } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { useAnnotations } from '@/hooks/useAnnotations'
import type { HighlightAnnotation } from '@/types/annotation.types'

interface PDFTextLayerProps {
  page: PDFPageProxy
  scale: number
  pageNumber: number
  width: number
  height: number
}

export function PDFTextLayer({ page, scale, pageNumber, width, height }: PDFTextLayerProps) {
  const textLayerRef = useRef<HTMLDivElement>(null)
  const { activeTool, addAnnotation, toolSettings } = useAnnotations()

  useEffect(() => {
    const renderTextLayer = async () => {
      if (!textLayerRef.current) return

      textLayerRef.current.innerHTML = ''

      try {
        const textContent = await page.getTextContent()
        const viewport = page.getViewport({ scale })

        textContent.items.forEach((item) => {
          if (!('str' in item)) return
          const textItem = item as TextItem

          const tx = textItem.transform[4] * scale
          const ty = textItem.transform[5] * scale
          const fontHeight = Math.sqrt(textItem.transform[2] ** 2 + textItem.transform[3] ** 2) * scale

          const div = document.createElement('div')
          div.textContent = textItem.str
          div.style.position = 'absolute'
          div.style.left = `${tx}px`
          div.style.top = `${viewport.height - ty - fontHeight}px`
          div.style.fontSize = `${fontHeight}px`
          div.style.fontFamily = 'sans-serif'
          div.style.transformOrigin = '0 0'
          div.style.whiteSpace = 'pre'
          div.style.pointerEvents = 'auto'
          div.style.userSelect = 'text'
          div.style.cursor = activeTool === 'highlight' ? 'crosshair' : 'text'
          div.style.color = 'transparent'
          div.setAttribute('data-text-layer', 'true')

          textLayerRef.current?.appendChild(div)
        })
      } catch (error) {
        console.error('Error rendering text layer:', error)
      }
    }

    renderTextLayer()
  }, [page, scale, pageNumber, activeTool])

  useEffect(() => {
    if (!textLayerRef.current || activeTool !== 'highlight') return

    const handleMouseUp = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) return

      const range = selection.getRangeAt(0)
      const rects = Array.from(range.getClientRects())
      
      if (rects.length === 0) return

      const textLayerRect = textLayerRef.current!.getBoundingClientRect()
      
      const boxes = rects.map(rect => ({
        x: rect.left - textLayerRect.left,
        y: rect.top - textLayerRect.top,
        width: rect.width,
        height: rect.height,
      }))

      const annotation: HighlightAnnotation = {
        id: `highlight-${Date.now()}`,
        type: 'highlight',
        pageNum: pageNumber,
        timestamp: Date.now(),
        boxes,
        color: toolSettings.color,
        opacity: toolSettings.opacity,
      }

      addAnnotation(annotation)
      selection.removeAllRanges()
    }

    textLayerRef.current.addEventListener('mouseup', handleMouseUp)
    const currentRef = textLayerRef.current

    return () => {
      currentRef?.removeEventListener('mouseup', handleMouseUp)
    }
  }, [activeTool, pageNumber, scale, addAnnotation, toolSettings])

  return (
    <div
      ref={textLayerRef}
      className="absolute inset-0"
      style={{
        width,
        height,
        pointerEvents: 'auto',
        userSelect: 'text',
        zIndex: activeTool === 'highlight' ? 20 : 10,
      }}
    />
  )
}
