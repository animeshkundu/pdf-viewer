import { useRef, useState, useEffect } from 'react'
import { useAnnotations } from '@/hooks/useAnnotations'
import {
  Point,
  HighlightAnnotation,
  PenAnnotation,
  ShapeAnnotation,
  SignatureAnnotation,
  BoundingBox,
} from '@/types/annotation.types'
import { TextBoxEditor } from './TextBoxEditor'
import { NoteEditor } from './NoteEditor'
import { SignatureCreator } from './SignatureCreator'

interface AnnotationDrawingProps {
  pageNum: number
  width: number
  height: number
  scale: number
}

export function AnnotationDrawing({ pageNum, width, height, scale }: AnnotationDrawingProps) {
  const { activeTool, toolSettings, addAnnotation } = useAnnotations()
  const svgRef = useRef<SVGSVGElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null)
  const [penPoints, setPenPoints] = useState<Point[]>([])
  const [showTextEditor, setShowTextEditor] = useState(false)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [showSignatureCreator, setShowSignatureCreator] = useState(false)
  const [editorPosition, setEditorPosition] = useState<Point>({ x: 0, y: 0 })

  const getMousePosition = (e: React.MouseEvent<SVGSVGElement>): Point => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }

    const rect = svg.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!activeTool || activeTool === 'select') return
    if (activeTool === 'highlight') return

    const point = getMousePosition(e)

    if (activeTool === 'text') {
      setEditorPosition(point)
      setShowTextEditor(true)
      return
    }

    if (activeTool === 'note') {
      setEditorPosition(point)
      setShowNoteEditor(true)
      return
    }

    if (activeTool === 'signature') {
      setEditorPosition(point)
      setShowSignatureCreator(true)
      return
    }

    setIsDrawing(true)
    setStartPoint(point)
    setCurrentPoint(point)

    if (activeTool === 'pen') {
      setPenPoints([point])
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !startPoint) return

    const point = getMousePosition(e)
    setCurrentPoint(point)

    if (activeTool === 'pen') {
      setPenPoints(prev => [...prev, point])
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing || !startPoint || !currentPoint) {
      setIsDrawing(false)
      return
    }

    const timestamp = Date.now()

    switch (activeTool) {
      case 'pen':
        if (penPoints.length > 1) {
          const annotation: PenAnnotation = {
            id: `pen-${timestamp}`,
            type: 'pen',
            pageNum,
            timestamp,
            points: penPoints,
            color: toolSettings.color,
            thickness: toolSettings.thickness,
          }
          addAnnotation(annotation)
        }
        setPenPoints([])
        break

      case 'rectangle':
      case 'circle':
      case 'arrow':
      case 'line':
        const annotation: ShapeAnnotation = {
          id: `${activeTool}-${timestamp}`,
          type: activeTool,
          pageNum,
          timestamp,
          start: startPoint,
          end: currentPoint,
          color: toolSettings.color,
          thickness: toolSettings.thickness,
        }
        addAnnotation(annotation)
        break

      case 'redaction':
        const redactionBox = {
          x: Math.min(startPoint.x, currentPoint.x),
          y: Math.min(startPoint.y, currentPoint.y),
          width: Math.abs(currentPoint.x - startPoint.x),
          height: Math.abs(currentPoint.y - startPoint.y),
        }
        
        if (redactionBox.width > 5 && redactionBox.height > 5) {
          const redactionAnnotation = {
            id: `redaction-${timestamp}`,
            type: 'redaction' as const,
            pageNum,
            timestamp,
            boxes: [redactionBox],
            removeText: true,
          }
          addAnnotation(redactionAnnotation)
        }
        break
    }

    setIsDrawing(false)
    setStartPoint(null)
    setCurrentPoint(null)
  }

  const renderPreview = () => {
    if (!isDrawing || !startPoint || !currentPoint) return null

    switch (activeTool) {
      case 'pen':
        if (penPoints.length < 2) return null
        const pathData = penPoints
          .map((point, index) => {
            if (index === 0) return `M ${point.x} ${point.y}`
            return `L ${point.x} ${point.y}`
          })
          .join(' ')
        return (
          <path
            d={pathData}
            fill="none"
            stroke={toolSettings.color}
            strokeWidth={toolSettings.thickness}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
          />
        )

      case 'rectangle':
        return (
          <rect
            x={Math.min(startPoint.x, currentPoint.x)}
            y={Math.min(startPoint.y, currentPoint.y)}
            width={Math.abs(currentPoint.x - startPoint.x)}
            height={Math.abs(currentPoint.y - startPoint.y)}
            fill="none"
            stroke={toolSettings.color}
            strokeWidth={toolSettings.thickness}
            opacity={0.7}
          />
        )

      case 'redaction':
        return (
          <rect
            x={Math.min(startPoint.x, currentPoint.x)}
            y={Math.min(startPoint.y, currentPoint.y)}
            width={Math.abs(currentPoint.x - startPoint.x)}
            height={Math.abs(currentPoint.y - startPoint.y)}
            fill="oklch(0 0 0)"
            stroke="oklch(0.55 0.22 25)"
            strokeWidth={3}
            strokeDasharray="4 2"
            opacity={0.8}
          />
        )

      case 'circle':
        const cx = (startPoint.x + currentPoint.x) / 2
        const cy = (startPoint.y + currentPoint.y) / 2
        const rx = Math.abs(currentPoint.x - startPoint.x) / 2
        const ry = Math.abs(currentPoint.y - startPoint.y) / 2
        return (
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill="none"
            stroke={toolSettings.color}
            strokeWidth={toolSettings.thickness}
            opacity={0.7}
          />
        )

      case 'line':
        return (
          <line
            x1={startPoint.x}
            y1={startPoint.y}
            x2={currentPoint.x}
            y2={currentPoint.y}
            stroke={toolSettings.color}
            strokeWidth={toolSettings.thickness}
            strokeLinecap="round"
            opacity={0.7}
          />
        )

      case 'arrow':
        const angle = Math.atan2(currentPoint.y - startPoint.y, currentPoint.x - startPoint.x)
        const arrowLength = 15
        const arrowAngle = Math.PI / 6
        const arrowPoint1X = currentPoint.x - arrowLength * Math.cos(angle - arrowAngle)
        const arrowPoint1Y = currentPoint.y - arrowLength * Math.sin(angle - arrowAngle)
        const arrowPoint2X = currentPoint.x - arrowLength * Math.cos(angle + arrowAngle)
        const arrowPoint2Y = currentPoint.y - arrowLength * Math.sin(angle + arrowAngle)

        return (
          <g opacity={0.7}>
            <line
              x1={startPoint.x}
              y1={startPoint.y}
              x2={currentPoint.x}
              y2={currentPoint.y}
              stroke={toolSettings.color}
              strokeWidth={toolSettings.thickness}
              strokeLinecap="round"
            />
            <path
              d={`M ${arrowPoint1X} ${arrowPoint1Y} L ${currentPoint.x} ${currentPoint.y} L ${arrowPoint2X} ${arrowPoint2Y}`}
              stroke={toolSettings.color}
              strokeWidth={toolSettings.thickness}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        )

      default:
        return null
    }
  }

  const getCursor = () => {
    if (!activeTool) return 'default'
    if (activeTool === 'select') return 'pointer'
    if (activeTool === 'pen') return 'crosshair'
    if (activeTool === 'text' || activeTool === 'note' || activeTool === 'signature') return 'pointer'
    if (activeTool === 'redaction') return 'crosshair'
    return 'crosshair'
  }

  const handleSignatureSelect = (imageData: string) => {
    const annotation: SignatureAnnotation = {
      id: `signature-${Date.now()}`,
      type: 'signature',
      pageNum,
      timestamp: Date.now(),
      position: editorPosition,
      imageData,
      width: 150,
      height: 75,
    }
    addAnnotation(annotation)
  }

  if (!activeTool || activeTool === 'select' || activeTool === 'redaction') {
    return (
      <>
        {showTextEditor && (
          <TextBoxEditor
            pageNum={pageNum}
            position={editorPosition}
            onComplete={() => setShowTextEditor(false)}
            onCancel={() => setShowTextEditor(false)}
          />
        )}
        {showNoteEditor && (
          <NoteEditor
            pageNum={pageNum}
            position={editorPosition}
            onComplete={() => setShowNoteEditor(false)}
            onCancel={() => setShowNoteEditor(false)}
          />
        )}
        {showSignatureCreator && (
          <SignatureCreator
            isOpen={showSignatureCreator}
            onClose={() => setShowSignatureCreator(false)}
            onSelectSignature={handleSignatureSelect}
          />
        )}
      </>
    )
  }

  return (
    <>
      <svg
        ref={svgRef}
        className="absolute inset-0"
        style={{ 
          width, 
          height, 
          cursor: getCursor(),
          pointerEvents: activeTool === 'highlight' ? 'none' : 'auto',
          zIndex: activeTool && activeTool !== 'highlight' ? 30 : 5
        }}
        viewBox={`0 0 ${width} ${height}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDrawing) {
            handleMouseUp()
          }
        }}
      >
        {renderPreview()}
      </svg>
      
      {showTextEditor && (
        <TextBoxEditor
          pageNum={pageNum}
          position={editorPosition}
          onComplete={() => setShowTextEditor(false)}
          onCancel={() => setShowTextEditor(false)}
        />
      )}
      {showNoteEditor && (
        <NoteEditor
          pageNum={pageNum}
          position={editorPosition}
          onComplete={() => setShowNoteEditor(false)}
          onCancel={() => setShowNoteEditor(false)}
        />
      )}
      {showSignatureCreator && (
        <SignatureCreator
          isOpen={showSignatureCreator}
          onClose={() => setShowSignatureCreator(false)}
          onSelectSignature={handleSignatureSelect}
        />
      )}
    </>
  )
}
