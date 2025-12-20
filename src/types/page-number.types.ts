export interface PageNumberConfig {
  id: string
  enabled: boolean
  position: PageNumberPosition
  format: PageNumberFormat
  fontSize: number
  color: string
  startNumber: number
  prefix: string
  suffix: string
  pageRange: PageRange
}

export type PageNumberPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right'
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right'

export type PageNumberFormat = 'numeric' | 'text'

export interface PageRange {
  type: 'all' | 'range'
  start?: number
  end?: number
}

export const DEFAULT_PAGE_NUMBER_CONFIG: Omit<PageNumberConfig, 'id'> = {
  enabled: true,
  position: 'bottom-center',
  format: 'numeric',
  fontSize: 12,
  color: 'oklch(0.5 0 0)',
  startNumber: 1,
  prefix: '',
  suffix: '',
  pageRange: { type: 'all' }
}

export const PAGE_NUMBER_COLORS = [
  { name: 'Gray', value: 'oklch(0.5 0 0)' },
  { name: 'Light Gray', value: 'oklch(0.7 0 0)' },
  { name: 'Dark Gray', value: 'oklch(0.3 0 0)' },
  { name: 'Blue', value: 'oklch(0.45 0.15 260)' },
  { name: 'Red', value: 'oklch(0.5 0.22 27)' },
  { name: 'Black', value: 'oklch(0.2 0 0)' }
]
