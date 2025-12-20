import { Annotation } from '@/types/annotation.types'

const MAX_HISTORY = 20

export class AnnotationService {
  private annotations: Annotation[] = []
  private history: Annotation[][] = []
  private historyIndex = -1
  private listeners: Set<() => void> = new Set()

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener())
  }

  private saveState() {
    this.history = this.history.slice(0, this.historyIndex + 1)
    this.history.push(JSON.parse(JSON.stringify(this.annotations)))
    
    if (this.history.length > MAX_HISTORY) {
      this.history.shift()
    } else {
      this.historyIndex++
    }
  }

  addAnnotation(annotation: Annotation) {
    this.annotations.push(annotation)
    this.saveState()
    this.notify()
    return annotation.id
  }

  updateAnnotation(id: string, updates: Partial<Annotation>) {
    const index = this.annotations.findIndex(a => a.id === id)
    if (index !== -1) {
      this.annotations[index] = { ...this.annotations[index], ...updates } as Annotation
      this.saveState()
      this.notify()
    }
  }

  deleteAnnotation(id: string) {
    this.annotations = this.annotations.filter(a => a.id !== id)
    this.saveState()
    this.notify()
  }

  getAnnotations(pageNum?: number): Annotation[] {
    if (pageNum !== undefined) {
      return this.annotations.filter(a => a.pageNum === pageNum)
    }
    return this.annotations
  }

  getAnnotation(id: string): Annotation | undefined {
    return this.annotations.find(a => a.id === id)
  }

  getAllAnnotations(): Annotation[] {
    return this.annotations
  }

  clearAnnotations() {
    this.annotations = []
    this.saveState()
    this.notify()
  }

  undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--
      this.annotations = JSON.parse(JSON.stringify(this.history[this.historyIndex]))
      this.notify()
      return true
    }
    return false
  }

  redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++
      this.annotations = JSON.parse(JSON.stringify(this.history[this.historyIndex]))
      this.notify()
      return true
    }
    return false
  }

  canUndo(): boolean {
    return this.historyIndex > 0
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1
  }

  exportAnnotations(): string {
    return JSON.stringify(this.annotations)
  }

  importAnnotations(data: string) {
    try {
      const imported = JSON.parse(data)
      if (Array.isArray(imported)) {
        this.annotations = imported
        this.saveState()
        this.notify()
        return true
      }
    } catch {
      return false
    }
    return false
  }
}

export const annotationService = new AnnotationService()
