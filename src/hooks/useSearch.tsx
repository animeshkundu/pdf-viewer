import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import type { SearchMatch, SearchResult } from '@/types/search.types'
import { searchService } from '@/services/search.service'
import { usePDF } from './usePDF'

interface SearchContextValue {
  searchResult: SearchResult | null
  isSearching: boolean
  searchProgress: number
  
  performSearch: (query: string, caseSensitive?: boolean, wholeWord?: boolean) => Promise<void>
  nextMatch: () => void
  previousMatch: () => void
  clearSearch: () => void
  goToMatch: (index: number) => void
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined)

export function SearchProvider({ children }: { children: ReactNode }) {
  const { document, setCurrentPage } = usePDF()
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState(0)

  const performSearch = useCallback(
    async (query: string, caseSensitive = false, wholeWord = false) => {
      if (!document || !query.trim()) {
        setSearchResult(null)
        return
      }

      setIsSearching(true)
      setSearchProgress(0)

      try {
        const matches = await searchService.searchInDocument(
          document,
          query,
          { caseSensitive, wholeWord },
          (progress) => setSearchProgress(progress)
        )

        setSearchResult({
          query,
          matches,
          currentMatchIndex: matches.length > 0 ? 0 : -1,
          caseSensitive,
          wholeWord,
        })

        if (matches.length > 0) {
          setCurrentPage(matches[0].pageNumber)
        }
      } catch (error) {
        console.error('Search failed:', error)
        setSearchResult(null)
      } finally {
        setIsSearching(false)
        setSearchProgress(0)
      }
    },
    [document, setCurrentPage]
  )

  const nextMatch = useCallback(() => {
    if (!searchResult || searchResult.matches.length === 0) return

    const nextIndex = (searchResult.currentMatchIndex + 1) % searchResult.matches.length
    const match = searchResult.matches[nextIndex]
    
    setSearchResult({
      ...searchResult,
      currentMatchIndex: nextIndex,
    })
    setCurrentPage(match.pageNumber)
  }, [searchResult, setCurrentPage])

  const previousMatch = useCallback(() => {
    if (!searchResult || searchResult.matches.length === 0) return

    const prevIndex = searchResult.currentMatchIndex === 0
      ? searchResult.matches.length - 1
      : searchResult.currentMatchIndex - 1
    const match = searchResult.matches[prevIndex]
    
    setSearchResult({
      ...searchResult,
      currentMatchIndex: prevIndex,
    })
    setCurrentPage(match.pageNumber)
  }, [searchResult, setCurrentPage])

  const goToMatch = useCallback(
    (index: number) => {
      if (!searchResult || index < 0 || index >= searchResult.matches.length) return

      const match = searchResult.matches[index]
      setSearchResult({
        ...searchResult,
        currentMatchIndex: index,
      })
      setCurrentPage(match.pageNumber)
    },
    [searchResult, setCurrentPage]
  )

  const clearSearch = useCallback(() => {
    setSearchResult(null)
    setSearchProgress(0)
  }, [])

  useEffect(() => {
    if (!document) {
      clearSearch()
    }
  }, [document, clearSearch])

  const contextValue = {
    searchResult,
    isSearching,
    searchProgress,
    performSearch,
    nextMatch,
    previousMatch,
    clearSearch,
    goToMatch,
  }

  return <SearchContext.Provider value={contextValue}>{children}</SearchContext.Provider>
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider')
  }
  return context
}
