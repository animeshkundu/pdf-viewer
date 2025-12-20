import { useEffect, useRef } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { useAnnotations } from '@/hooks/useAnnotations'
import { useSearch } from '@/hooks/useSearch'
import type { HighlightAnnotation, RedactionAnnotation } from '@/types/annotation.types'

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
  const { searchResult } = useSearch()

  useEffect(() => {
    const renderTextLayer = async () => {
      if (!textLayerRef.current) return

      textLayerRef.current.innerHTML = ''

      try {
        const textContent = await page.getTextContent()
        const viewport = page.getViewport({ scale })

        textContent.items.forEach((item, itemIndex) => {
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
          div.style.color = 'transparent'
          div.setAttribute('data-text-layer', 'true')
          div.setAttribute('data-item-index', itemIndex.toString())
          
          if (activeTool === null || activeTool === 'select') {
            div.style.pointerEvents = 'auto'
            div.style.userSelect = 'text'
            div.style.cursor = 'text'
          } else if (activeTool === 'highlight' || activeTool === 'redaction') {
            div.style.pointerEvents = 'auto'
            div.style.userSelect = 'text'
            div.style.cursor = 'crosshair'
          } else {
            div.style.pointerEvents = 'none'
            div.style.userSelect = 'none'
            div.style.cursor = 'default'
          }

          textLayerRef.current?.appendChild(div)
        })
      } catch (error) {
        console.error('Error rendering text layer:', error)
      }
    }

    renderTextLayer()
  }, [page, scale, pageNumber, activeTool])

  useEffect(() => {
    if (!textLayerRef.current || !searchResult || searchResult.matches.length === 0) {
      const textDivs = textLayerRef.current?.querySelectorAll('[data-text-layer]')
      textDivs?.forEach(div => {
        div.removeAttribute('data-search-match')
        div.removeAttribute('data-current-match')
      })
      return
    }

    const pageMatches = searchResult.matches.filter(m => m.pageNumber === pageNumber)
    if (pageMatches.length === 0) return

    const textDivs = Array.from(textLayerRef.current.querySelectorAll('[data-text-layer]'))
    const currentMatchOnPage = searchResult.matches[searchResult.currentMatchIndex]?.pageNumber === pageNumber 
      ? searchResult.matches[searchResult.currentMatchIndex] 
      : null

    pageMatches.forEach(match => {
      const isCurrentMatch = currentMatchOnPage?.matchIndex === match.matchIndex

      match.textItems.forEach(({ itemIndex, charStart, charEnd }) => {
        const div = textDivs.find(d => d.getAttribute('data-item-index') === itemIndex.toString())
        if (!div) return

        const text = div.textContent || ''
        if (charStart >= text.length) return

        const before = text.substring(0, charStart)
        const matched = text.substring(charStart, Math.min(charEnd, text.length))
        const after = text.substring(Math.min(charEnd, text.length))

        div.innerHTML = ''
        
        if (before) {
          const beforeSpan = document.createElement('span')
          beforeSpan.textContent = before
          beforeSpan.style.background = 'transparent'
          div.appendChild(beforeSpan)
        }

        const matchSpan = document.createElement('span')
        matchSpan.textContent = matched
        matchSpan.style.background = isCurrentMatch 
          ? 'oklch(0.55 0.18 240 / 0.6)' 
          : 'oklch(0.55 0.18 240 / 0.3)'
        matchSpan.style.borderRadius = '2px'
        matchSpan.style.transition = 'background 0.2s'
        if (isCurrentMatch) {
          matchSpan.style.outline = '2px solid oklch(0.55 0.18 240 / 0.8)'
          matchSpan.style.outlineOffset = '-1px'
        }
        div.appendChild(matchSpan)

        if (after) {
          const afterSpan = document.createElement('span')
          afterSpan.textContent = after
          afterSpan.style.background = 'transparent'
          div.appendChild(afterSpan)
        }
      })
    })
  }, [searchResult, pageNumber])

  useEffect(() => {
    if (!textLayerRef.current || (activeTool !== 'highlight' && activeTool !== 'redaction')) return

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

      if (activeTool === 'highlight') {
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
      } else if (activeTool === 'redaction') {
        const annotation: RedactionAnnotation = {
          id: `redaction-${Date.now()}`,
          type: 'redaction',
          pageNum: pageNumber,
          timestamp: Date.now(),
          boxes,
          removeText: true,
        }
        addAnnotation(annotation)
      }
      
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
        pointerEvents: (activeTool === null || activeTool === 'select' || activeTool === 'highlight' || activeTool === 'redaction') ? 'auto' : 'none',
        userSelect: (activeTool === null || activeTool === 'select') ? 'text' : 'none',
        zIndex: (activeTool === 'highlight' || activeTool === 'redaction') ? 20 : 10,
      }}
    />
  )
}
