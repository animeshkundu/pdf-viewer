export interface PageTransformation {
  pageNumber: number
  rotation: number
  isDeleted: boolean
  originalIndex: number
}

export interface PageManagementState {
  transformations: Map<number, PageTransformation>
  pageOrder: number[]
  selectedPages: Set<number>
}

export type PageOperation = 
  | { type: 'rotate'; pageNumber: number; direction: 'left' | 'right' }
  | { type: 'delete'; pageNumbers: number[] }
  | { type: 'reorder'; fromIndex: number; toIndex: number }
  | { type: 'restore'; pageNumber: number }
  | { type: 'undo' }
  | { type: 'redo' }

export interface PageManagementHistory {
  operations: PageOperation[]
  currentIndex: number
}
