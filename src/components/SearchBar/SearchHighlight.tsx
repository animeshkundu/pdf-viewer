import { useSearch } from '@/hooks/useSearch'
import { cn } from '@/lib/utils'

interface SearchHighlightProps {
  pageNumber: number
  scale: number
  pageWidth: number
  pageHeight: number
}

export function SearchHighlight({ pageNumber, scale, pageWidth, pageHeight }: SearchHighlightProps) {
  const { searchResult } = useSearch()

  if (!searchResult || searchResult.matches.length === 0) {
    return null
  }

  const pageMatches = searchResult.matches.filter((match) => match.pageNumber === pageNumber)

  if (pageMatches.length === 0) {
    return null
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        width: pageWidth,
        height: pageHeight,
      }}
    >
      {pageMatches.map((match, idx) => {
        const isCurrentMatch = searchResult.matches[searchResult.currentMatchIndex] === match

        return match.boundingBoxes.map((box, boxIdx) => (
          <div
            key={`${match.matchIndex}-${boxIdx}`}
            className={cn(
              'absolute transition-colors duration-200',
              isCurrentMatch
                ? 'bg-accent/40 ring-2 ring-accent'
                : 'bg-accent/20'
            )}
            style={{
              left: box.x * scale,
              top: pageHeight - (box.y + box.height) * scale,
              width: box.width * scale,
              height: box.height * scale,
            }}
          />
        ))
      })}
    </div>
  )
}
