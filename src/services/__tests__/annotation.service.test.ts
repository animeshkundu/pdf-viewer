import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnnotationService } from '../annotation.service'
import type { Annotation } from '@/types/annotation.types'

describe('AnnotationService', () => {
  let service: AnnotationService

  beforeEach(() => {
    service = new AnnotationService()
  })

  describe('subscription', () => {
    it('should subscribe and notify listeners', () => {
      const listener = vi.fn()
      const unsubscribe = service.subscribe(listener)
      
      const annotation: Annotation = {
        id: '1',
        type: 'note',
        pageNum: 1,
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
        content: 'Test',
        color: '#FFCCCC',
      }
      
      service.addAnnotation(annotation)
      expect(listener).toHaveBeenCalled()
      
      unsubscribe()
      service.addAnnotation({ ...annotation, id: '2' })
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('addAnnotation', () => {
    it('should add annotation and return id', () => {
      const annotation: Annotation = {
        id: '1',
        type: 'note',
        pageNum: 1,
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
        content: 'Test',
        color: '#FFCCCC',
      }
      
      const id = service.addAnnotation(annotation)
      expect(id).toBe('1')
      expect(service.getAllAnnotations()).toHaveLength(1)
    })
  })

  describe('updateAnnotation', () => {
    it('should update existing annotation', () => {
      const annotation: Annotation = {
        id: '1',
        type: 'note',
        pageNum: 1,
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
        content: 'Test',
        color: '#FF0000',
      }
      
      service.addAnnotation(annotation)
      service.updateAnnotation('1', { color: '#00FF00' })
      
      const updated = service.getAnnotation('1')
      expect(updated).toBeDefined()
      if (updated && updated.type === 'note') {
        expect(updated.color).toBe('#00FF00')
      }
    })

    it('should not update non-existent annotation', () => {
      service.updateAnnotation('999', { color: '#00FF00' })
      expect(service.getAllAnnotations()).toHaveLength(0)
    })
  })

  describe('deleteAnnotation', () => {
    it('should delete annotation', () => {
      const annotation: Annotation = {
        id: '1',
        type: 'note',
        pageNum: 1,
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
        content: 'Test',
        color: '#FFCCCC',
      }
      
      service.addAnnotation(annotation)
      expect(service.getAllAnnotations()).toHaveLength(1)
      
      service.deleteAnnotation('1')
      expect(service.getAllAnnotations()).toHaveLength(0)
    })
  })

  describe('getAnnotations', () => {
    beforeEach(() => {
      service.addAnnotation({
        id: '1',
        type: 'note',
        pageNum: 1,
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
        content: 'Note 1',
        color: '#FFCCCC',
      })
      service.addAnnotation({
        id: '2',
        type: 'note',
        pageNum: 2,
        position: { x: 200, y: 200 },
        timestamp: Date.now(),
        content: 'Note 2',
        color: '#FFCCCC',
      })
    })

    it('should get all annotations', () => {
      const annotations = service.getAnnotations()
      expect(annotations).toHaveLength(2)
    })

    it('should filter by page number', () => {
      const page1 = service.getAnnotations(1)
      const page2 = service.getAnnotations(2)
      
      expect(page1).toHaveLength(1)
      expect(page2).toHaveLength(1)
      expect(page1[0].id).toBe('1')
      expect(page2[0].id).toBe('2')
    })
  })

  describe('getAnnotation', () => {
    it('should get annotation by id', () => {
      const annotation: Annotation = {
        id: '1',
        type: 'note',
        pageNum: 1,
        position: { x: 100, y: 100 },
        timestamp: Date.now(),
        content: 'Test',
        color: '#FFCCCC',
      }
      
      service.addAnnotation(annotation)
      const found = service.getAnnotation('1')
      expect(found).toBeDefined()
      expect(found?.id).toBe('1')
    })

    it('should return undefined for non-existent id', () => {
      const found = service.getAnnotation('999')
      expect(found).toBeUndefined()
    })
  })

  describe('clearAnnotations', () => {
    it('should clear all annotations', () => {
      service.addAnnotation({
        id: '1',
        type: 'highlight',
        pageNum: 1,
        boxes: [{ x: 100, y: 100, width: 50, height: 20 }],
        timestamp: Date.now(),
        color: '#FFFF00',
        opacity: 0.3,
      })
      
      expect(service.getAllAnnotations()).toHaveLength(1)
      service.clearAnnotations()
      expect(service.getAllAnnotations()).toHaveLength(0)
    })
  })

  describe('undo/redo', () => {
    it('should undo and redo operations', () => {
      // Add first annotation
      service.addAnnotation({
        id: '1',
        type: 'highlight',
        pageNum: 1,
        boxes: [{ x: 100, y: 100, width: 50, height: 20 }],
        timestamp: Date.now(),
        color: '#FFFF00',
        opacity: 0.3,
      })
      
      // Add second annotation
      service.addAnnotation({
        id: '2',
        type: 'note',
        pageNum: 1,
        position: { x: 200, y: 200 },
        timestamp: Date.now(),
        content: 'Test note',
        color: '#FFCCCC',
      })
      
      expect(service.getAllAnnotations()).toHaveLength(2)
      
      // Undo should remove last annotation
      const undoResult = service.undo()
      expect(undoResult).toBe(true)
      expect(service.getAllAnnotations()).toHaveLength(1)
      
      // Should be able to redo
      expect(service.canRedo()).toBe(true)
      service.redo()
      expect(service.getAllAnnotations()).toHaveLength(2)
    })

    it('should return false when cannot undo', () => {
      expect(service.canUndo()).toBe(false)
      expect(service.undo()).toBe(false)
    })

    it('should return false when cannot redo', () => {
      expect(service.canRedo()).toBe(false)
      expect(service.redo()).toBe(false)
    })
  })

  describe('export/import', () => {
    it('should export annotations', () => {
      service.addAnnotation({
        id: '1',
        type: 'highlight',
        pageNum: 1,
        boxes: [{ x: 100, y: 100, width: 50, height: 20 }],
        timestamp: Date.now(),
        color: '#FFFF00',
        opacity: 0.3,
      })
      
      const exported = service.exportAnnotations()
      expect(exported).toContain('"id":"1"')
    })

    it('should import valid annotations', () => {
      const data = JSON.stringify([{
        id: '1',
        type: 'highlight',
        pageNum: 1,
        boxes: [{ x: 100, y: 100, width: 50, height: 20 }],
        timestamp: Date.now(),
        color: '#FFFF00',
        opacity: 0.3,
      }])
      
      const result = service.importAnnotations(data)
      expect(result).toBe(true)
      expect(service.getAllAnnotations()).toHaveLength(1)
    })

    it('should reject invalid JSON', () => {
      const result = service.importAnnotations('invalid json')
      expect(result).toBe(false)
    })

    it('should reject non-array data', () => {
      const result = service.importAnnotations('{"not": "array"}')
      expect(result).toBe(false)
    })
  })
})
