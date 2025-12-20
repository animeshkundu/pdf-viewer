export interface Watermark {
  id: string
  text: string
  fontSize: number
  color: string
  opacity: number
  rotation: number
  position: WatermarkPosition
  customX?: number
  customY?: number
  pageRange: PageRange
}

export type WatermarkPosition = 
  | 'center' 
  | 'diagonal'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom'

export type PageRange = 
  | { type: 'all' }
  | { type: 'range'; start: number; end: number }
  | { type: 'specific'; pages: number[] }

export const DEFAULT_WATERMARK: Partial<Watermark> = {
  fontSize: 48,
  color: 'oklch(0.5 0 0)',
  opacity: 0.3,
  rotation: 45,
  position: 'diagonal',
  pageRange: { type: 'all' }
}
