import type { PageTransformation, PageOperation } from '@/types/page-management.types'

export class PageManagementService {
  private transformations: Map<number, PageTransformation> = new Map()
  private pageOrder: number[] = []
  private totalPages: number = 0
  private history: PageOperation[] = []
  private historyIndex: number = -1
  private readonly MAX_HISTORY = 20
  private observers: Set<() => void> = new Set()

  initialize(numPages: number): void {
    this.transformations.clear()
    this.pageOrder = Array.from({ length: numPages }, (_, i) => i + 1)
    this.totalPages = numPages
    this.history = []
    this.historyIndex = -1

    for (let i = 1; i <= numPages; i++) {
      this.transformations.set(i, {
        pageNumber: i,
        rotation: 0,
        isDeleted: false,
        originalIndex: i - 1,
      })
    }
    this.notifyObservers()
  }

  subscribe(callback: () => void): () => void {
    this.observers.add(callback)
    return () => this.observers.delete(callback)
  }

  private notifyObservers(): void {
    this.observers.forEach(callback => callback())
  }

  private addToHistory(operation: PageOperation): void {
    this.history = this.history.slice(0, this.historyIndex + 1)
    this.history.push(operation)
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift()
    } else {
      this.historyIndex++
    }
  }

  rotatePage(pageNumber: number, direction: 'left' | 'right'): void {
    const transform = this.transformations.get(pageNumber)
    if (!transform || transform.isDeleted) return

    const delta = direction === 'right' ? 90 : -90
    transform.rotation = (transform.rotation + delta + 360) % 360

    this.addToHistory({ type: 'rotate', pageNumber, direction })
    this.notifyObservers()
  }

  deletePage(pageNumber: number): void {
    const transform = this.transformations.get(pageNumber)
    if (!transform) return

    transform.isDeleted = true
    this.addToHistory({ type: 'delete', pageNumbers: [pageNumber] })
    this.notifyObservers()
  }

  deletePages(pageNumbers: number[]): void {
    pageNumbers.forEach(pageNumber => {
      const transform = this.transformations.get(pageNumber)
      if (transform) {
        transform.isDeleted = true
      }
    })

    this.addToHistory({ type: 'delete', pageNumbers })
    this.notifyObservers()
  }

  restorePage(pageNumber: number): void {
    const transform = this.transformations.get(pageNumber)
    if (!transform) return

    transform.isDeleted = false
    this.addToHistory({ type: 'restore', pageNumber })
    this.notifyObservers()
  }

  reorderPages(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return
    if (fromIndex < 0 || fromIndex >= this.pageOrder.length) return
    if (toIndex < 0 || toIndex >= this.pageOrder.length) return

    const newOrder = [...this.pageOrder]
    const [movedPage] = newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, movedPage)
    this.pageOrder = newOrder

    this.addToHistory({ type: 'reorder', fromIndex, toIndex })
    this.notifyObservers()
  }

  undo(): boolean {
    if (!this.canUndo()) return false

    const operation = this.history[this.historyIndex]
    this.historyIndex--

    this.applyUndoOperation(operation)
    this.notifyObservers()
    return true
  }

  redo(): boolean {
    if (!this.canRedo()) return false

    this.historyIndex++
    const operation = this.history[this.historyIndex]

    this.applyRedoOperation(operation)
    this.notifyObservers()
    return true
  }

  private applyUndoOperation(operation: PageOperation): void {
    switch (operation.type) {
      case 'rotate': {
        const transform = this.transformations.get(operation.pageNumber)
        if (transform) {
          const delta = operation.direction === 'right' ? -90 : 90
          transform.rotation = (transform.rotation + delta + 360) % 360
        }
        break
      }
      case 'delete': {
        operation.pageNumbers.forEach(pageNumber => {
          const transform = this.transformations.get(pageNumber)
          if (transform) {
            transform.isDeleted = false
          }
        })
        break
      }
      case 'restore': {
        const transform = this.transformations.get(operation.pageNumber)
        if (transform) {
          transform.isDeleted = true
        }
        break
      }
      case 'reorder': {
        const newOrder = [...this.pageOrder]
        const [movedPage] = newOrder.splice(operation.toIndex, 1)
        newOrder.splice(operation.fromIndex, 0, movedPage)
        this.pageOrder = newOrder
        break
      }
    }
  }

  private applyRedoOperation(operation: PageOperation): void {
    switch (operation.type) {
      case 'rotate': {
        const transform = this.transformations.get(operation.pageNumber)
        if (transform) {
          const delta = operation.direction === 'right' ? 90 : -90
          transform.rotation = (transform.rotation + delta + 360) % 360
        }
        break
      }
      case 'delete': {
        operation.pageNumbers.forEach(pageNumber => {
          const transform = this.transformations.get(pageNumber)
          if (transform) {
            transform.isDeleted = true
          }
        })
        break
      }
      case 'restore': {
        const transform = this.transformations.get(operation.pageNumber)
        if (transform) {
          transform.isDeleted = false
        }
        break
      }
      case 'reorder': {
        const newOrder = [...this.pageOrder]
        const [movedPage] = newOrder.splice(operation.fromIndex, 1)
        newOrder.splice(operation.toIndex, 0, movedPage)
        this.pageOrder = newOrder
        break
      }
    }
  }

  canUndo(): boolean {
    return this.historyIndex >= 0
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1
  }

  getPageTransformation(pageNumber: number): PageTransformation | undefined {
    return this.transformations.get(pageNumber)
  }

  getPageOrder(): number[] {
    return [...this.pageOrder]
  }

  getVisiblePages(): number[] {
    return this.pageOrder.filter(pageNumber => {
      const transform = this.transformations.get(pageNumber)
      return transform && !transform.isDeleted
    })
  }

  getDeletedPages(): number[] {
    return Array.from(this.transformations.values())
      .filter(t => t.isDeleted)
      .map(t => t.pageNumber)
  }

  getTotalPages(): number {
    return this.totalPages
  }

  getVisiblePageCount(): number {
    return this.getVisiblePages().length
  }

  getRotation(pageNumber: number): number {
    return this.transformations.get(pageNumber)?.rotation ?? 0
  }

  isDeleted(pageNumber: number): boolean {
    return this.transformations.get(pageNumber)?.isDeleted ?? false
  }

  reset(): void {
    this.initialize(this.totalPages)
  }

  exportState() {
    return {
      transformations: Array.from(this.transformations.entries()),
      pageOrder: this.pageOrder,
      totalPages: this.totalPages,
    }
  }

  importState(state: ReturnType<typeof this.exportState>): void {
    this.transformations = new Map(state.transformations)
    this.pageOrder = state.pageOrder
    this.totalPages = state.totalPages
    this.history = []
    this.historyIndex = -1
    this.notifyObservers()
  }
}

export const pageManagementService = new PageManagementService()
