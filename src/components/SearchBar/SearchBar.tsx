import { useState, useEffect, useRef } from 'react'
import { X, MagnifyingGlass, CaretUp, CaretDown } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useSearch } from '@/hooks/useSearch'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const { searchResult, isSearching, performSearch, nextMatch, previousMatch, clearSearch } = useSearch()
  const [query, setQuery] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isOpen])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.trim()) {
      debounceRef.current = setTimeout(() => {
        performSearch(query, caseSensitive, wholeWord)
      }, 300)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, caseSensitive, wholeWord, performSearch])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        previousMatch()
      } else {
        nextMatch()
      }
      e.preventDefault()
    } else if (e.key === 'Escape') {
      onClose()
      e.preventDefault()
    }
  }

  const handleClose = () => {
    setQuery('')
    clearSearch()
    onClose()
  }

  const matchCount = searchResult?.matches.length || 0
  const currentMatch = searchResult && searchResult.currentMatchIndex >= 0
    ? searchResult.currentMatchIndex + 1
    : 0

  return (
    <div
      className={cn(
        'absolute top-0 left-0 right-0 z-50 transition-all duration-200',
        isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      )}
    >
      <div className="bg-card border-b border-border shadow-lg">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 flex-1">
            <MagnifyingGlass size={20} className="text-muted-foreground" />
            
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search in document..."
              className="flex-1"
            />

            {isSearching && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}

            {!isSearching && matchCount > 0 && (
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {currentMatch} of {matchCount}
              </span>
            )}

            {!isSearching && query && matchCount === 0 && (
              <span className="text-sm text-muted-foreground">No results</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={previousMatch}
              disabled={!searchResult || matchCount === 0}
              title="Previous match (Shift+Enter)"
            >
              <CaretUp size={20} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={nextMatch}
              disabled={!searchResult || matchCount === 0}
              title="Next match (Enter)"
            >
              <CaretDown size={20} />
            </Button>

            <div className="h-5 w-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="case-sensitive"
                  checked={caseSensitive}
                  onCheckedChange={(checked) => setCaseSensitive(checked === true)}
                />
                <Label
                  htmlFor="case-sensitive"
                  className="text-sm font-normal cursor-pointer"
                >
                  Aa
                </Label>
              </div>

              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="whole-word"
                  checked={wholeWord}
                  onCheckedChange={(checked) => setWholeWord(checked === true)}
                />
                <Label
                  htmlFor="whole-word"
                  className="text-sm font-normal cursor-pointer"
                >
                  Word
                </Label>
              </div>
            </div>

            <div className="h-5 w-px bg-border" />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              title="Close search (Esc)"
            >
              <X size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
