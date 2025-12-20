export interface SearchMatch {
  pageNumber: number
  matchIndex: number
  text: string
  boundingBoxes: Array<{
    x: number
    y: number
    width: number
    height: number
  }>
}

export interface SearchResult {
  query: string
  matches: SearchMatch[]
  currentMatchIndex: number
  caseSensitive: boolean
  wholeWord: boolean
}

export interface PageTextContent {
  pageNumber: number
  items: Array<{
    str: string
    transform: number[]
    width: number
    height: number
  }>
}
