import { useState } from 'react'
import { useAnnotations } from '@/hooks/useAnnotations'
import {
  Annotation,
  HighlightAnnotation,
  PenAnnotation,
  ShapeAnnotation,
  TextAnnotation,
  NoteAnnotation,
  SignatureAnnotation,
} from '@/types/annotation.types'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DraggableSignature } from './DraggableSignature'

interface AnnotationLayerProps {
  pageNum: number
  width: number
  height: number
  scale: number
}

export function AnnotationLayer({ pageNum, width, height, scale }: AnnotationLayerProps) {
  const { getPageAnnotations, selectedAnnotationId, setSelectedAnnotation } = useAnnotations()
  const annotations = getPageAnnotations(pageNum)

  const renderAnnotation = (annotation: Annotation) => {
    const isSelected = annotation.id === selectedAnnotationId

    switch (annotation.type) {
      case 'highlight':
        return <HighlightRenderer key={annotation.id} annotation={annotation as HighlightAnnotation} isSelected={isSelected} onClick={() => setSelectedAnnotation(annotation.id)} />
      case 'pen':
        return <PenRenderer key={annotation.id} annotation={annotation as PenAnnotation} isSelected={isSelected} onClick={() => setSelectedAnnotation(annotation.id)} />
      case 'rectangle':
      case 'circle':
      case 'arrow':
      case 'line':
        return <ShapeRenderer key={annotation.id} annotation={annotation as ShapeAnnotation} isSelected={isSelected} onClick={() => setSelectedAnnotation(annotation.id)} />
      case 'text':
        return <TextRenderer key={annotation.id} annotation={annotation as TextAnnotation} isSelected={isSelected} onClick={() => setSelectedAnnotation(annotation.id)} />
      case 'note':
        return <NoteRenderer key={annotation.id} annotation={annotation as NoteAnnotation} isSelected={isSelected} onClick={() => setSelectedAnnotation(annotation.id)} />
      case 'signature':
        return <DraggableSignature key={annotation.id} annotation={annotation as SignatureAnnotation} isSelected={isSelected} onClick={() => setSelectedAnnotation(annotation.id)} scale={scale} />
      default:
        return null
    }
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <g className="pointer-events-auto">
        {annotations.map(renderAnnotation)}
      </g>
    </svg>
  )
}

interface RendererProps<T> {
  annotation: T
  isSelected: boolean
  onClick: () => void
}

function HighlightRenderer({ annotation, isSelected, onClick }: RendererProps<HighlightAnnotation>) {
  return (
    <g onClick={onClick} className="cursor-pointer">
      {annotation.boxes.map((box, index) => (
        <rect
          key={index}
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          fill={annotation.color}
          opacity={annotation.opacity}
          stroke={isSelected ? 'oklch(0.55 0.18 240)' : 'none'}
          strokeWidth={isSelected ? 2 : 0}
        />
      ))}
    </g>
  )
}

function PenRenderer({ annotation, isSelected, onClick }: RendererProps<PenAnnotation>) {
  if (annotation.points.length < 2) return null

  const pathData = annotation.points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`
      return `L ${point.x} ${point.y}`
    })
    .join(' ')

  return (
    <g onClick={onClick} className="cursor-pointer">
      <path
        d={pathData}
        fill="none"
        stroke={annotation.color}
        strokeWidth={annotation.thickness}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {isSelected && (
        <path
          d={pathData}
          fill="none"
          stroke="oklch(0.55 0.18 240)"
          strokeWidth={annotation.thickness + 4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3}
        />
      )}
    </g>
  )
}

function ShapeRenderer({ annotation, isSelected, onClick }: RendererProps<ShapeAnnotation>) {
  const { start, end, color, thickness } = annotation
  const strokeColor = color
  const selectionStroke = isSelected ? 'oklch(0.55 0.18 240)' : 'none'

  switch (annotation.type) {
    case 'rectangle':
      return (
        <g onClick={onClick} className="cursor-pointer">
          <rect
            x={Math.min(start.x, end.x)}
            y={Math.min(start.y, end.y)}
            width={Math.abs(end.x - start.x)}
            height={Math.abs(end.y - start.y)}
            fill={annotation.fill ? strokeColor : 'none'}
            fillOpacity={annotation.fill ? 0.2 : 0}
            stroke={strokeColor}
            strokeWidth={thickness}
          />
          {isSelected && (
            <rect
              x={Math.min(start.x, end.x)}
              y={Math.min(start.y, end.y)}
              width={Math.abs(end.x - start.x)}
              height={Math.abs(end.y - start.y)}
              fill="none"
              stroke={selectionStroke}
              strokeWidth={2}
              strokeDasharray="4 2"
            />
          )}
        </g>
      )

    case 'circle':
      const cx = (start.x + end.x) / 2
      const cy = (start.y + end.y) / 2
      const rx = Math.abs(end.x - start.x) / 2
      const ry = Math.abs(end.y - start.y) / 2
      return (
        <g onClick={onClick} className="cursor-pointer">
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill={annotation.fill ? strokeColor : 'none'}
            fillOpacity={annotation.fill ? 0.2 : 0}
            stroke={strokeColor}
            strokeWidth={thickness}
          />
          {isSelected && (
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill="none"
              stroke={selectionStroke}
              strokeWidth={2}
              strokeDasharray="4 2"
            />
          )}
        </g>
      )

    case 'line':
      return (
        <g onClick={onClick} className="cursor-pointer">
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={strokeColor}
            strokeWidth={thickness}
            strokeLinecap="round"
          />
          {isSelected && (
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={selectionStroke}
              strokeWidth={thickness + 4}
              opacity={0.3}
            />
          )}
        </g>
      )

    case 'arrow':
      const angle = Math.atan2(end.y - start.y, end.x - start.x)
      const arrowLength = 15
      const arrowAngle = Math.PI / 6

      const arrowPoint1X = end.x - arrowLength * Math.cos(angle - arrowAngle)
      const arrowPoint1Y = end.y - arrowLength * Math.sin(angle - arrowAngle)
      const arrowPoint2X = end.x - arrowLength * Math.cos(angle + arrowAngle)
      const arrowPoint2Y = end.y - arrowLength * Math.sin(angle + arrowAngle)

      return (
        <g onClick={onClick} className="cursor-pointer">
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={strokeColor}
            strokeWidth={thickness}
            strokeLinecap="round"
          />
          <path
            d={`M ${arrowPoint1X} ${arrowPoint1Y} L ${end.x} ${end.y} L ${arrowPoint2X} ${arrowPoint2Y}`}
            stroke={strokeColor}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {isSelected && (
            <>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={selectionStroke}
                strokeWidth={thickness + 4}
                opacity={0.3}
              />
              <path
                d={`M ${arrowPoint1X} ${arrowPoint1Y} L ${end.x} ${end.y} L ${arrowPoint2X} ${arrowPoint2Y}`}
                stroke={selectionStroke}
                strokeWidth={thickness + 4}
                opacity={0.3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </>
          )}
        </g>
      )

    default:
      return null
  }
}

function TextRenderer({ annotation, isSelected, onClick }: RendererProps<TextAnnotation>) {
  return (
    <g onClick={onClick} className="cursor-pointer">
      {isSelected && (
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
      )}
      <foreignObject
        x={annotation.position.x}
        y={annotation.position.y}
        width={annotation.width}
        height={annotation.height}
      >
        <div
          className="p-2 bg-white"
          style={{
            fontSize: annotation.fontSize,
            color: annotation.color,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {annotation.content}
        </div>
      </foreignObject>
    </g>
  )
}

function NoteRenderer({ annotation, isSelected, onClick }: RendererProps<NoteAnnotation>) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <g 
          onClick={(e) => {
            e.stopPropagation()
            onClick()
            setIsOpen(true)
          }} 
          className="cursor-pointer"
        >
          <rect
            x={annotation.position.x}
            y={annotation.position.y}
            width={24}
            height={24}
            fill={annotation.color}
            stroke={isSelected ? 'oklch(0.55 0.18 240)' : 'oklch(0.85 0.008 270)'}
            strokeWidth={isSelected ? 2 : 1}
            rx={2}
          />
          <text
            x={annotation.position.x + 12}
            y={annotation.position.y + 16}
            textAnchor="middle"
            fill="oklch(0.28 0.01 270)"
            fontSize={14}
            fontWeight="bold"
          >
            ?
          </text>
        </g>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-3"
        style={{
          position: 'absolute',
          left: `${annotation.position.x + 30}px`,
          top: `${annotation.position.y}px`,
        }}
      >
        <p className="text-sm whitespace-pre-wrap">{annotation.content}</p>
      </PopoverContent>
    </Popover>
  )
}
