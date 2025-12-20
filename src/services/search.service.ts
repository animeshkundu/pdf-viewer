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
    
    let matchIndex = 0

    for (let itemIdx = 0; itemIdx < pageTextContent.items.length; itemIdx++) {
      const item = pageTextContent.items[itemIdx]
      const itemText = options.caseSensitive ? item.str : item.str.toLowerCase()
      const normalizedQuery = options.caseSensitive ? query : query.toLowerCase()

      for (let charIdx = 0; charIdx <= itemText.length - normalizedQuery.length; charIdx++) {
        const substring = itemText.substring(charIdx, charIdx + normalizedQuery.length)
        
        if (substring === normalizedQuery) {
          if (options.wholeWord) {
            const beforeChar = charIdx > 0 ? itemText[charIdx - 1] : ' '
            const afterChar = charIdx + normalizedQuery.length < itemText.length 
              ? itemText[charIdx + normalizedQuery.length] 
              : ' '
            
            if (!/[\s,;.!?]/.test(beforeChar) || !/[\s,;.!?]/.test(afterChar)) {
              continue
            }
          }

          const boundingBoxes = this.calculateCharacterBoundingBoxes(
            item,
            charIdx,
            normalizedQuery.length
          )

          matches.push({
            pageNumber: pageTextContent.pageNumber,
            matchIndex,
            text: item.str.substring(charIdx, charIdx + query.length),
            boundingBoxes,
            textItems: [{
              itemIndex: itemIdx,
              charStart: charIdx,
              charEnd: charIdx + normalizedQuery.length,
            }],
          })

          matchIndex++
        }
      }
    }

    return matches
  }

  private calculateCharacterBoundingBoxes(
    item: PageTextContent['items'][0],
    startChar: number,
    length: number
  ): Array<{ x: number; y: number; width: number; height: number }> {
    const [scaleX, , , scaleY, x, y] = item.transform
    const totalWidth = item.width * Math.abs(scaleX)
    const itemLength = item.str.length
    
    if (itemLength === 0) return []
    
    const charWidth = totalWidth / itemLength
    const xOffset = charWidth * startChar
    const boxWidth = charWidth * length
    
    return [{
      x: x + xOffset,
      y,
      width: boxWidth,
      height: item.height * Math.abs(scaleY),
    }]
  }

  clearCache(): void {
    this.pageTextCache.clear()
  }

  cleanup(): void {
    this.clearCache()
  }
}

export const searchService = SearchService.getInstance()
