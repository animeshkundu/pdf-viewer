import { useState, useEffect } from 'react'
import { useAnnotations } from '@/hooks/useAnnotations'
import { Annotation, Point, BoundingBox } from '@/types/annotation.types'

interface DraggableAnnotationProps {
  annotation: Annotation
  isSelected: boolean
  onClick: () => void
  scale: number
  children: React.ReactNode
  canDrag?: boolean
}

export function DraggableAnnotation({
  annotation,
  isSelected,
  onClick,
  scale,
  children,
  canDrag = true,
}: DraggableAnnotationProps) {
  const { updateAnnotation, activeTool } = useAnnotations()
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [originalPosition, setOriginalPosition] = useState<Point | null>(null)

  const isSelectMode = activeTool === 'select'

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!originalPosition) return

      const deltaX = (e.clientX - dragStart.x) / scale
      const deltaY = (e.clientY - dragStart.y) / scale

      switch (annotation.type) {
        case 'signature':
        case 'text':
        case 'note':
          updateAnnotation(annotation.id, {
            position: {
              x: originalPosition.x + deltaX,
              y: originalPosition.y + deltaY,
            },
          })
          break

        case 'pen':
          if ('points' in annotation) {
            const offsetPoints = annotation.points.map(pt => ({
              x: pt.x + deltaX,
              y: pt.y + deltaY,
            }))
            updateAnnotation(annotation.id, { points: offsetPoints })
          }
          break

        case 'rectangle':
        case 'circle':
        case 'arrow':
        case 'line':
          if ('start' in annotation && 'end' in annotation) {
            updateAnnotation(annotation.id, {
              start: {
                x: annotation.start.x + deltaX,
                y: annotation.start.y + deltaY,
              },
              end: {
                x: annotation.end.x + deltaX,
                y: annotation.end.y + deltaY,
              },
            })
          }
          break

        case 'highlight':
        case 'redaction':
          if ('boxes' in annotation) {
            const offsetBoxes = annotation.boxes.map(box => ({
              ...box,
              x: box.x + deltaX,
              y: box.y + deltaY,
            }))
            updateAnnotation(annotation.id, { boxes: offsetBoxes })
          }
          break
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setOriginalPosition(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, originalPosition, annotation, updateAnnotation, scale])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()

    if (!isSelectMode || !canDrag || !isSelected) return

    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })

    switch (annotation.type) {
      case 'signature':
      case 'text':
      case 'note':
        if ('position' in annotation) {
          setOriginalPosition(annotation.position)
        }
        break

      case 'pen':
        if ('points' in annotation && annotation.points.length > 0) {
          setOriginalPosition(annotation.points[0])
        }
        break

      case 'rectangle':
      case 'circle':
      case 'arrow':
      case 'line':
        if ('start' in annotation) {
          setOriginalPosition(annotation.start)
        }
        break

      case 'highlight':
      case 'redaction':
        if ('boxes' in annotation && annotation.boxes.length > 0) {
          setOriginalPosition({ x: annotation.boxes[0].x, y: annotation.boxes[0].y })
        }
        break
    }
  }

  return (
    <g
      onMouseDown={handleMouseDown}
      className={isSelectMode && isSelected ? 'cursor-move' : 'cursor-pointer'}
      style={{ pointerEvents: 'all' }}
    >
      {children}
    </g>
  )
}
