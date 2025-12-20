import { useWatermark } from '@/hooks/useWatermark'
import type { Watermark, WatermarkPosition } from '@/types/watermark.types'

interface WatermarkOverlayProps {
  pageNumber: number
  width: number
  height: number
  scale: number
  totalPages: number
}

export function WatermarkOverlay({ pageNumber, width, height, scale, totalPages }: WatermarkOverlayProps) {
  const { watermark } = useWatermark()

  if (!watermark) return null

  const shouldShowOnPage = checkPageRange(watermark, pageNumber, totalPages)
  if (!shouldShowOnPage) return null

  const position = calculatePosition(watermark.position, width, height, watermark.fontSize * scale)
  const adjustedRotation = watermark.position === 'diagonal' ? 45 : watermark.rotation

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          fontSize: `${watermark.fontSize * scale}px`,
          color: watermark.color,
          opacity: watermark.opacity,
          transform: `translate(-50%, -50%) rotate(${adjustedRotation}deg)`,
          transformOrigin: 'center center',
          fontWeight: 'bold',
          fontFamily: 'Helvetica, Arial, sans-serif',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        {watermark.text}
      </div>
    </div>
  )
}

function checkPageRange(watermark: Watermark, pageNumber: number, totalPages: number): boolean {
  const { pageRange } = watermark

  if (pageRange.type === 'all') {
    return true
  }

  if (pageRange.type === 'range') {
    return pageNumber >= pageRange.start && pageNumber <= Math.min(pageRange.end, totalPages)
  }

  if (pageRange.type === 'specific') {
    return pageRange.pages.includes(pageNumber)
  }

  return true
}

function calculatePosition(
  position: WatermarkPosition,
  width: number,
  height: number,
  fontSize: number
): { x: number; y: number } {
  const margin = 50

  const positions: Record<WatermarkPosition, { x: number; y: number }> = {
    'center': {
      x: width / 2,
      y: height / 2
    },
    'diagonal': {
      x: width / 2,
      y: height / 2
    },
    'top-left': {
      x: margin,
      y: margin
    },
    'top-center': {
      x: width / 2,
      y: margin
    },
    'top-right': {
      x: width - margin,
      y: margin
    },
    'bottom-left': {
      x: margin,
      y: height - margin
    },
    'bottom-center': {
      x: width / 2,
      y: height - margin
    },
    'bottom-right': {
      x: width - margin,
      y: height - margin
    },
    'custom': {
      x: width / 2,
      y: height / 2
    }
  }

  return positions[position]
}
