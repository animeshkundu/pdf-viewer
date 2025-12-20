import { useState, useRef, useEffect } from 'react'
import { SignatureAnnotation } from '@/types/annotation.types'
import { useAnnotations } from '@/hooks/useAnnotations'

interface DraggableSignatureProps {
  annotation: SignatureAnnotation
  isSelected: boolean
  onClick: () => void
  scale: number
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | null

export function DraggableSignature({ annotation, isSelected, onClick, scale }: DraggableSignatureProps) {
  const { updateAnnotation } = useAnnotations()
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [originalBounds, setOriginalBounds] = useState({
    x: annotation.position.x,
    y: annotation.position.y,
    width: annotation.width,
    height: annotation.height,
  })
  const containerRef = useRef<SVGGElement>(null)

  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        
        updateAnnotation(annotation.id, {
          position: {
            x: originalBounds.x + deltaX / scale,
            y: originalBounds.y + deltaY / scale,
          },
        })
      } else if (isResizing && resizeHandle) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y

        let newX = originalBounds.x
        let newY = originalBounds.y
        let newWidth = originalBounds.width
        let newHeight = originalBounds.height

        const aspectRatio = originalBounds.width / originalBounds.height

        switch (resizeHandle) {
          case 'se':
            newWidth = Math.max(50, originalBounds.width + deltaX / scale)
            newHeight = newWidth / aspectRatio
            break
          case 'sw':
            newWidth = Math.max(50, originalBounds.width - deltaX / scale)
            newHeight = newWidth / aspectRatio
            newX = originalBounds.x + (originalBounds.width - newWidth)
            break
          case 'ne':
            newWidth = Math.max(50, originalBounds.width + deltaX / scale)
            newHeight = newWidth / aspectRatio
            newY = originalBounds.y + (originalBounds.height - newHeight)
            break
          case 'nw':
            newWidth = Math.max(50, originalBounds.width - deltaX / scale)
            newHeight = newWidth / aspectRatio
            newX = originalBounds.x + (originalBounds.width - newWidth)
            newY = originalBounds.y + (originalBounds.height - newHeight)
            break
        }

        updateAnnotation(annotation.id, {
          position: { x: newX, y: newY },
          width: newWidth,
          height: newHeight,
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeHandle(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, originalBounds, annotation.id, updateAnnotation, scale])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
    
    if (!isSelected) return

    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setOriginalBounds({
      x: annotation.position.x,
      y: annotation.position.y,
      width: annotation.width,
      height: annotation.height,
    })
  }

  const handleResizeMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeHandle(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
    setOriginalBounds({
      x: annotation.position.x,
      y: annotation.position.y,
      width: annotation.width,
      height: annotation.height,
    })
  }

  const handleSize = 8

  return (
    <g ref={containerRef}>
      {isSelected && (
        <>
          <rect
            x={annotation.position.x - 2}
            y={annotation.position.y - 2}
            width={annotation.width + 4}
            height={annotation.height + 4}
            fill="none"
            stroke="oklch(0.55 0.18 240)"
            strokeWidth={2}
            strokeDasharray="4 2"
          />
          
          <rect
            x={annotation.position.x - handleSize / 2}
            y={annotation.position.y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="white"
            stroke="oklch(0.55 0.18 240)"
            strokeWidth={2}
            className="cursor-nw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          
          <rect
            x={annotation.position.x + annotation.width - handleSize / 2}
            y={annotation.position.y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="white"
            stroke="oklch(0.55 0.18 240)"
            strokeWidth={2}
            className="cursor-ne-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          
          <rect
            x={annotation.position.x - handleSize / 2}
            y={annotation.position.y + annotation.height - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="white"
            stroke="oklch(0.55 0.18 240)"
            strokeWidth={2}
            className="cursor-sw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          
          <rect
            x={annotation.position.x + annotation.width - handleSize / 2}
            y={annotation.position.y + annotation.height - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="white"
            stroke="oklch(0.55 0.18 240)"
            strokeWidth={2}
            className="cursor-se-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
        </>
      )}
      
      <image
        x={annotation.position.x}
        y={annotation.position.y}
        width={annotation.width}
        height={annotation.height}
        href={annotation.imageData}
        className={isSelected ? 'cursor-move' : 'cursor-pointer'}
        onMouseDown={handleMouseDown}
        style={{ pointerEvents: 'all' }}
      />
    </g>
  )
}
