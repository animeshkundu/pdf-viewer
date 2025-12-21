import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SignatureService, SavedSignature } from '../signature.service'

describe('SignatureService', () => {
  let service: SignatureService

  beforeEach(() => {
    service = new SignatureService()
    localStorage.clear()
  })

  describe('loadSignatures', () => {
    it('should return empty array when no signatures exist', async () => {
      const signatures = await service.loadSignatures()
      expect(signatures).toEqual([])
    })

    it('should return stored signatures', async () => {
      const mockSignatures: SavedSignature[] = [
        {
          id: '1',
          name: 'Signature 1',
          imageData: 'data:image/png;base64,test',
          width: 100,
          height: 50,
          timestamp: Date.now(),
        },
      ]
      localStorage.setItem('pdf-editor-signatures', JSON.stringify(mockSignatures))

      const signatures = await service.loadSignatures()
      expect(signatures).toEqual(mockSignatures)
    })

    it('should return empty array on JSON parse error', async () => {
      localStorage.setItem('pdf-editor-signatures', 'invalid json')
      
      const signatures = await service.loadSignatures()
      expect(signatures).toEqual([])
    })
  })

  describe('saveSignature', () => {
    it('should save a new signature', async () => {
      const newSignature = {
        name: 'Test Signature',
        imageData: 'data:image/png;base64,test',
        width: 100,
        height: 50,
      }

      const saved = await service.saveSignature(newSignature)

      expect(saved).toMatchObject(newSignature)
      expect(saved.id).toBeDefined()
      expect(saved.timestamp).toBeDefined()

      const signatures = await service.loadSignatures()
      expect(signatures).toHaveLength(1)
      expect(signatures[0]).toEqual(saved)
    })

    it('should throw error when max signatures exceeded', async () => {
      // Add 5 signatures (max limit)
      for (let i = 0; i < 5; i++) {
        await service.saveSignature({
          name: `Signature ${i}`,
          imageData: 'data:image/png;base64,test',
          width: 100,
          height: 50,
        })
      }

      // Try to add one more
      await expect(
        service.saveSignature({
          name: 'Extra Signature',
          imageData: 'data:image/png;base64,test',
          width: 100,
          height: 50,
        })
      ).rejects.toThrow('Maximum 5 signatures allowed')
    })
  })

  describe('deleteSignature', () => {
    it('should delete a signature by id', async () => {
      const signature = await service.saveSignature({
        name: 'Test',
        imageData: 'data:image/png;base64,test',
        width: 100,
        height: 50,
      })

      await service.deleteSignature(signature.id)

      const signatures = await service.loadSignatures()
      expect(signatures).toHaveLength(0)
    })
  })

  describe('updateSignature', () => {
    it('should update signature name', async () => {
      const signature = await service.saveSignature({
        name: 'Original',
        imageData: 'data:image/png;base64,test',
        width: 100,
        height: 50,
      })

      await service.updateSignature(signature.id, { name: 'Updated' })

      const signatures = await service.loadSignatures()
      expect(signatures[0].name).toBe('Updated')
    })

    it('should do nothing when id does not exist', async () => {
      await service.saveSignature({
        name: 'Original',
        imageData: 'data:image/png;base64,test',
        width: 100,
        height: 50,
      })

      await service.updateSignature('nonexistent-id', { name: 'Updated' })

      const signatures = await service.loadSignatures()
      expect(signatures[0].name).toBe('Original')
    })
  })

  describe('clearAllSignatures', () => {
    it('should clear all signatures', async () => {
      await service.saveSignature({
        name: 'Test',
        imageData: 'data:image/png;base64,test',
        width: 100,
        height: 50,
      })

      await service.clearAllSignatures()

      const signatures = await service.loadSignatures()
      expect(signatures).toHaveLength(0)
    })
  })

  describe('canAddMore', () => {
    it('should return true when under max', () => {
      expect(service.canAddMore(0)).toBe(true)
      expect(service.canAddMore(4)).toBe(true)
    })

    it('should return false when at max', () => {
      expect(service.canAddMore(5)).toBe(false)
      expect(service.canAddMore(6)).toBe(false)
    })
  })

  describe('getMaxSignatures', () => {
    it('should return max signatures limit', () => {
      expect(service.getMaxSignatures()).toBe(5)
    })
  })

  describe('createSignatureImage', () => {
    it('should throw error when canvas context is unavailable', () => {
      const canvas = document.createElement('canvas')
      vi.spyOn(canvas, 'getContext').mockReturnValue(null)

      expect(() => service.createSignatureImage(canvas)).toThrow(
        'Failed to create canvas context'
      )
    })

    it('should throw error when image data cannot be retrieved', () => {
      const canvas = document.createElement('canvas')
      const mockGetContext = vi.fn().mockReturnValue({
        getImageData: vi.fn().mockReturnValue(null),
      })
      vi.spyOn(canvas, 'getContext').mockImplementation(mockGetContext as any)

      expect(() => service.createSignatureImage(canvas)).toThrow(
        'Failed to get image data'
      )
    })

    it('should throw error when no signature content found', () => {
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100
      
      const emptyImageData = {
        data: new Uint8ClampedArray(100 * 100 * 4), // All zeros = transparent
        width: 100,
        height: 100,
      }
      
      const mockGetContext = vi.fn().mockReturnValue({
        getImageData: vi.fn().mockReturnValue(emptyImageData),
      })
      vi.spyOn(canvas, 'getContext').mockImplementation(mockGetContext as any)

      expect(() => service.createSignatureImage(canvas)).toThrow(
        'No signature content found'
      )
    })

    it('should create signature image with bounds', () => {
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100
      
      // Create image data with some content
      const imageData = {
        data: new Uint8ClampedArray(100 * 100 * 4),
        width: 100,
        height: 100,
      }
      // Add some alpha values to simulate content
      for (let i = 0; i < 10; i++) {
        imageData.data[i * 4 + 3] = 255 // Set alpha to 255 for first 10 pixels
      }
      
      const mockCtx = {
        getImageData: vi.fn().mockReturnValue(imageData),
      }
      
      const mockTempCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
        }),
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,result'),
      }
      
      const originalCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          return mockTempCanvas as any
        }
        return originalCreateElement(tagName)
      })
      
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx as any)

      const result = service.createSignatureImage(canvas)

      expect(result.imageData).toBe('data:image/png;base64,result')
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
      
      vi.restoreAllMocks()
    })
  })
})
