import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SearchService } from '../search.service'

describe('SearchService', () => {
  let service: SearchService

  beforeEach(() => {
    service = SearchService.getInstance()
    service.clearCache()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SearchService.getInstance()
      const instance2 = SearchService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('extractPageText', () => {
    it('should extract text from page', async () => {
      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: 'Hello', transform: [1, 0, 0, 1, 0, 0], width: 50, height: 12 },
            { str: 'World', transform: [1, 0, 0, 1, 60, 0], width: 50, height: 12 },
          ],
        }),
      }

      const result = await service.extractPageText(mockPage as any, 1)

      expect(result.pageNumber).toBe(1)
      expect(result.items).toHaveLength(2)
      expect(result.items[0].str).toBe('Hello')
    })

    it('should filter out non-text items', async () => {
      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: 'Text', transform: [1, 0, 0, 1, 0, 0], width: 50, height: 12 },
            { transform: [1, 0, 0, 1, 0, 0] }, // No str property
          ],
        }),
      }

      const result = await service.extractPageText(mockPage as any, 1)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].str).toBe('Text')
    })

    it('should use cached text content', async () => {
      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: 'Cached', transform: [1, 0, 0, 1, 0, 0], width: 50, height: 12 },
          ],
        }),
      }

      await service.extractPageText(mockPage as any, 1)
      await service.extractPageText(mockPage as any, 1)

      expect(mockPage.getTextContent).toHaveBeenCalledTimes(1)
    })
  })

  describe('searchInDocument', () => {
    it('should search across document', async () => {
      const mockDocument = {
        numPages: 2,
        getPage: vi.fn()
          .mockResolvedValueOnce({
            getTextContent: vi.fn().mockResolvedValue({
              items: [
                { str: 'test document', transform: [1, 0, 0, 1, 0, 0], width: 100, height: 12 },
              ],
            }),
          })
          .mockResolvedValueOnce({
            getTextContent: vi.fn().mockResolvedValue({
              items: [
                { str: 'another test', transform: [1, 0, 0, 1, 0, 0], width: 100, height: 12 },
              ],
            }),
          }),
      }

      const results = await service.searchInDocument(mockDocument as any, 'test')

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].text).toContain('test')
    })

    it('should handle empty query', async () => {
      const mockDocument = { numPages: 1 }
      const results = await service.searchInDocument(mockDocument as any, '')
      expect(results).toEqual([])
    })

    it('should handle case-sensitive search', async () => {
      const mockDocument = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [
              { str: 'Test test TEST', transform: [1, 0, 0, 1, 0, 0], width: 100, height: 12 },
            ],
          }),
        }),
      }

      const results = await service.searchInDocument(mockDocument as any, 'Test', {
        caseSensitive: true,
      })

      expect(results.length).toBe(1)
      expect(results[0].text).toBe('Test')
    })

    it('should handle case-insensitive search', async () => {
      const mockDocument = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [
              { str: 'Test test TEST', transform: [1, 0, 0, 1, 0, 0], width: 150, height: 12 },
            ],
          }),
        }),
      }

      const results = await service.searchInDocument(mockDocument as any, 'test', {
        caseSensitive: false,
      })

      expect(results.length).toBeGreaterThan(1)
    })

    it('should handle whole word search', async () => {
      const mockDocument = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [
              { str: 'test testing tested', transform: [1, 0, 0, 1, 0, 0], width: 150, height: 12 },
            ],
          }),
        }),
      }

      const results = await service.searchInDocument(mockDocument as any, 'test', {
        wholeWord: true,
      })

      // Should only match the standalone "test", not "testing" or "tested"
      expect(results.length).toBeLessThanOrEqual(1)
    })

    it('should call progress callback', async () => {
      const mockDocument = {
        numPages: 2,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [
              { str: 'text', transform: [1, 0, 0, 1, 0, 0], width: 50, height: 12 },
            ],
          }),
        }),
      }

      const onProgress = vi.fn()
      await service.searchInDocument(mockDocument as any, 'text', {}, onProgress)

      expect(onProgress).toHaveBeenCalled()
    })
  })

  describe('clearCache', () => {
    it('should clear page text cache', async () => {
      const mockPage = {
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: 'Cached', transform: [1, 0, 0, 1, 0, 0], width: 50, height: 12 },
          ],
        }),
      }

      await service.extractPageText(mockPage as any, 1)
      service.clearCache()
      await service.extractPageText(mockPage as any, 1)

      expect(mockPage.getTextContent).toHaveBeenCalledTimes(2)
    })
  })

  describe('cleanup', () => {
    it('should cleanup resources', () => {
      service.cleanup()
      // Verify it doesn't throw
      expect(true).toBe(true)
    })
  })
})
