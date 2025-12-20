import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import type { SearchMatch, PageTextContent } from '@/types/search.types'

export class SearchService {
  private static instance: SearchService
  private pageTextCache: Map<number, PageTextContent> = new Map()

  private constructor() {}

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService()
    }
    return SearchService.instance
  }

  async extractPageText(page: PDFPageProxy, pageNumber: number): Promise<PageTextContent> {
    const cached = this.pageTextCache.get(pageNumber)
    if (cached) {
      return cached
    }

    const textContent = await page.getTextContent()
    const pageTextContent: PageTextContent = {
      pageNumber,
      items: textContent.items
        .filter((item): item is TextItem => 'str' in item)
        .map((item) => ({
          str: item.str,
          transform: item.transform,
          width: item.width,
          height: item.height,
        })),
    }

    this.pageTextCache.set(pageNumber, pageTextContent)
    return pageTextContent
  }

  async searchInDocument(
    document: PDFDocumentProxy,
    query: string,
    options: { caseSensitive?: boolean; wholeWord?: boolean } = {},
    onProgress?: (progress: number) => void
  ): Promise<SearchMatch[]> {
    if (!query.trim()) {
      return []
    }

    const matches: SearchMatch[] = []
    const normalizedQuery = options.caseSensitive ? query : query.toLowerCase()

    for (let pageNum = 1; pageNum <= document.numPages; pageNum++) {
      const page = await document.getPage(pageNum)
      const pageTextContent = await this.extractPageText(page, pageNum)
      const pageMatches = this.searchInPage(pageTextContent, normalizedQuery, options)
      matches.push(...pageMatches)

      if (onProgress) {
        onProgress((pageNum / document.numPages) * 100)
      }
    }

    return matches
  }

  private searchInPage(
    pageTextContent: PageTextContent,
    query: string,
    options: { caseSensitive?: boolean; wholeWord?: boolean }
  ): SearchMatch[] {
    const matches: SearchMatch[] = []
    const pageText = pageTextContent.items.map((item) => item.str).join(' ')
    const normalizedPageText = options.caseSensitive ? pageText : pageText.toLowerCase()

    let startIndex = 0
    let matchIndex = 0

    while (true) {
      let foundIndex = normalizedPageText.indexOf(query, startIndex)
      
      if (foundIndex === -1) break

      if (options.wholeWord) {
        const beforeChar = foundIndex > 0 ? normalizedPageText[foundIndex - 1] : ' '
        const afterChar = foundIndex + query.length < normalizedPageText.length 
          ? normalizedPageText[foundIndex + query.length] 
          : ' '
        
        if (!/\s/.test(beforeChar) || !/\s/.test(afterChar)) {
          startIndex = foundIndex + 1
          continue
        }
      }

      const matchText = pageText.substr(foundIndex, query.length)
      const boundingBoxes = this.calculateBoundingBoxes(
        pageTextContent,
        foundIndex,
        query.length
      )

      matches.push({
        pageNumber: pageTextContent.pageNumber,
        matchIndex,
        text: matchText,
        boundingBoxes,
      })

      matchIndex++
      startIndex = foundIndex + query.length
    }

    return matches
  }

  private calculateBoundingBoxes(
    pageTextContent: PageTextContent,
    startIndex: number,
    length: number
  ): Array<{ x: number; y: number; width: number; height: number }> {
    const boxes: Array<{ x: number; y: number; width: number; height: number }> = []
    let currentIndex = 0

    for (const item of pageTextContent.items) {
      const itemLength = item.str.length
      const itemEnd = currentIndex + itemLength

      if (currentIndex + 1 <= startIndex + length && itemEnd >= startIndex) {
        const [scaleX, , , scaleY, x, y] = item.transform
        
        boxes.push({
          x,
          y,
          width: item.width * Math.abs(scaleX),
          height: item.height * Math.abs(scaleY),
        })
      }

      currentIndex = itemEnd + 1
      if (currentIndex > startIndex + length) break
    }

    return boxes
  }

  clearCache(): void {
    this.pageTextCache.clear()
  }

  cleanup(): void {
    this.clearCache()
  }
}

export const searchService = SearchService.getInstance()
