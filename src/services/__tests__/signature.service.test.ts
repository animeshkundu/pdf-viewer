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
  })
})
