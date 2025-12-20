export type AnnotationType = 'highlight' | 'pen' | 'rectangle' | 'circle' | 'arrow' | 'line' | 'text' | 'note' | 'signature' | 'redaction'

export interface Point {
  x: number
  y: number
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface BaseAnnotation {
  id: string
  type: AnnotationType
  pageNum: number
  timestamp: number
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight'
  boxes: BoundingBox[]
  color: string
  opacity: number
}

export interface PenAnnotation extends BaseAnnotation {
  type: 'pen'
  points: Point[]
  color: string
  thickness: number
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: 'rectangle' | 'circle' | 'arrow' | 'line'
  start: Point
  end: Point
  color: string
  thickness: number
  fill?: boolean
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text'
  position: Point
  content: string
  fontSize: number
  color: string
  width: number
  height: number
}

export interface NoteAnnotation extends BaseAnnotation {
  type: 'note'
  position: Point
  content: string
  color: string
}

export interface SignatureAnnotation extends BaseAnnotation {
  type: 'signature'
  position: Point
  imageData: string
  width: number
  height: number
}

export interface RedactionAnnotation extends BaseAnnotation {
  type: 'redaction'
  boxes: BoundingBox[]
  removeText: boolean
}

export type Annotation =
  | HighlightAnnotation
  | PenAnnotation
  | ShapeAnnotation
  | TextAnnotation
  | NoteAnnotation
  | SignatureAnnotation
  | RedactionAnnotation

export interface AnnotationState {
  annotations: Annotation[]
  selectedAnnotationId: string | null
  history: Annotation[][]
  historyIndex: number
}

export type ToolType = AnnotationType | 'select' | null

export interface ToolSettings {
  color: string
  thickness: number
  fontSize: number
  opacity: number
}

export const HIGHLIGHT_COLORS = {
  yellow: 'oklch(0.88 0.15 90)',
  pink: 'oklch(0.75 0.15 25)',
  green: 'oklch(0.82 0.12 155)',
  purple: 'oklch(0.70 0.12 290)',
  blue: 'oklch(0.75 0.12 230)',
} as const

export const PEN_COLORS = {
  black: 'oklch(0.28 0.01 270)',
  red: 'oklch(0.55 0.22 25)',
  blue: 'oklch(0.55 0.18 240)',
  green: 'oklch(0.60 0.15 155)',
  orange: 'oklch(0.70 0.18 50)',
  purple: 'oklch(0.60 0.15 290)',
  gray: 'oklch(0.65 0.01 270)',
  white: 'oklch(1 0 0)',
} as const

export const PEN_THICKNESSES = [1, 2, 4, 6] as const

export const NOTE_COLORS = {
  yellow: 'oklch(0.95 0.15 90)',
  pink: 'oklch(0.92 0.15 25)',
  green: 'oklch(0.95 0.12 155)',
  purple: 'oklch(0.92 0.12 290)',
  blue: 'oklch(0.92 0.12 230)',
} as const
