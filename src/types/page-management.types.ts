export interface PageTransformation {
  pageNumber: number
  rotation: number
  isDeleted: boolean
  originalIndex: number
}

export type PageSize = 'letter' | 'a4' | 'legal'
export type PageOrientation = 'portrait' | 'landscape'

export interface BlankPage {
  id: string
  position: number
  size: PageSize
  orientation: PageOrientation
  width: number
  height: number
}

export interface PageManagementState {
  transformations: Map<number, PageTransformation>
  pageOrder: number[]
  selectedPages: Set<number>
  blankPages: Map<string, BlankPage>
}

export type PageOperation = 
  | { type: 'rotate'; pageNumber: number; direction: 'left' | 'right' }
  | { type: 'delete'; pageNumbers: number[] }
  | { type: 'reorder'; fromIndex: number; toIndex: number }
  | { type: 'restore'; pageNumber: number }
  | { type: 'insertBlank'; blankPage: BlankPage }
  | { type: 'removeBlank'; blankPageId: string }
  | { type: 'undo' }
  | { type: 'redo' }

export interface PageManagementHistory {
  operations: PageOperation[]
  currentIndex: number
}
