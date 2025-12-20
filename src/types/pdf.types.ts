export interface PDFDocumentState {
  file: File | null
  numPages: number
  currentPage: number
  zoom: number
  isLoading: boolean
  loadProgress: number
  error: string | null
}

export interface PageDimensions {
  width: number
  height: number
}

export interface ZoomLevel {
  label: string
  value: number | 'fit-width' | 'fit-page'
}

export const ZOOM_LEVELS: ZoomLevel[] = [
  { label: 'Fit Width', value: 'fit-width' },
  { label: 'Fit Page', value: 'fit-page' },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1.0 },
  { label: '125%', value: 1.25 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2.0 },
  { label: '400%', value: 4.0 },
]
