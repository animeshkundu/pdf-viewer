import { usePageNumber } from '@/hooks/usePageNumber'
import { usePDF } from '@/hooks/usePDF.tsx'
import type { PageNumberConfig } from '@/types/page-number.types'

interface PageNumberOverlayProps {
  pageNumber: number
  scale: number
  pageWidth: number
  pageHeight: number
}

export function PageNumberOverlay({ pageNumber, scale, pageWidth, pageHeight }: PageNumberOverlayProps) {
  const { pageNumberConfig } = usePageNumber()
  const { document } = usePDF()
  
  if (!pageNumberConfig || !pageNumberConfig.enabled || !document) {
    return null
  }
  
  const config = pageNumberConfig
  const totalPages = document.numPages
  
  const targetPages = getTargetPages(totalPages, config.pageRange)
  if (!targetPages.includes(pageNumber)) {
    return null
  }
  
  const displayNumber = pageNumber - (config.startNumber - 1) + (config.startNumber - 1)
  const text = formatPageNumber(displayNumber, config)
  const position = calculatePosition(pageWidth, pageHeight, config.position)
  const alignment = getAlignment(config.position)
  
  const style: React.CSSProperties = {
    position: 'absolute',
    left: alignment === 'left' ? `${position.x}px` : alignment === 'center' ? `${position.x}px` : undefined,
    right: alignment === 'right' ? `${pageWidth - position.x}px` : undefined,
    top: position.isTop ? `${position.y}px` : undefined,
    bottom: position.isTop ? undefined : `${position.y}px`,
    fontSize: `${config.fontSize * scale}px`,
    color: config.color,
    fontFamily: 'Helvetica, Arial, sans-serif',
    pointerEvents: 'none',
    userSelect: 'none',
    transform: alignment === 'center' ? 'translateX(-50%)' : undefined,
    whiteSpace: 'nowrap'
  }
  
  return (
    <div style={style}>
      {text}
    </div>
  )
}

function getTargetPages(totalPages: number, pageRange: PageNumberConfig['pageRange']): number[] {
  if (pageRange.type === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  
  if (pageRange.type === 'range' && pageRange.start && pageRange.end) {
    const start = Math.max(1, pageRange.start)
    const end = Math.min(totalPages, pageRange.end)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }
  
  return []
}

function formatPageNumber(pageNumber: number, config: PageNumberConfig): string {
  let formatted = ''
  
  if (config.format === 'numeric') {
    formatted = `${pageNumber}`
  } else if (config.format === 'text') {
    formatted = `Page ${pageNumber}`
  }
  
  if (config.prefix) {
    formatted = `${config.prefix}${formatted}`
  }
  
  if (config.suffix) {
    formatted = `${formatted}${config.suffix}`
  }
  
  return formatted
}

function calculatePosition(
  pageWidth: number,
  pageHeight: number,
  position: PageNumberConfig['position']
): { x: number; y: number; isTop: boolean } {
  const margin = 50
  const verticalMargin = 30
  
  const positions: Record<PageNumberConfig['position'], { x: number; y: number; isTop: boolean }> = {
    'top-left': { x: margin, y: verticalMargin, isTop: true },
    'top-center': { x: pageWidth / 2, y: verticalMargin, isTop: true },
    'top-right': { x: pageWidth - margin, y: verticalMargin, isTop: true },
    'bottom-left': { x: margin, y: verticalMargin, isTop: false },
    'bottom-center': { x: pageWidth / 2, y: verticalMargin, isTop: false },
    'bottom-right': { x: pageWidth - margin, y: verticalMargin, isTop: false }
  }
  
  return positions[position]
}

function getAlignment(position: PageNumberConfig['position']): 'left' | 'center' | 'right' {
  if (position.endsWith('-left')) {
    return 'left'
  } else if (position.endsWith('-center')) {
    return 'center'
  } else if (position.endsWith('-right')) {
    return 'right'
  }
  return 'center'
}
