import { useEffect, useState, useCallback } from 'react'
import { usePDF } from '@/hooks/usePDF.tsx'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { BookmarkSimple, CaretRight, CaretDown, ListBullets } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface OutlineItem {
  title: string
  bold: boolean
  italic: boolean
  color: Uint8ClampedArray | null
  dest: string | unknown[] | null
  url: string | null
  unsafeUrl: string | undefined
  newWindow: boolean | undefined
  count: number | undefined
  items: OutlineItem[]
}

interface BookmarksPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface BookmarkItemProps {
  item: OutlineItem
  level: number
  onNavigate: (dest: string | unknown[] | null) => void
}

function BookmarkItem({ item, level, onNavigate }: BookmarkItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = item.items && item.items.length > 0

  const handleClick = () => {
    if (item.dest) {
      onNavigate(item.dest)
    }
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div
          className={cn(
            'flex items-center gap-1 py-1.5 px-2 rounded-md hover:bg-muted/60 cursor-pointer transition-colors group',
            level > 0 && 'ml-4'
          )}
          onClick={handleClick}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 hover:bg-transparent"
                onClick={handleToggle}
              >
                {isExpanded ? (
                  <CaretDown size={14} className="text-muted-foreground" />
                ) : (
                  <CaretRight size={14} className="text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-5" />
          )}

          <span
            className={cn(
              'text-sm truncate flex-1 text-foreground/80 group-hover:text-foreground transition-colors',
              item.bold && 'font-semibold',
              item.italic && 'italic'
            )}
            title={item.title}
          >
            {item.title}
          </span>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            {item.items.map((child, index) => (
              <BookmarkItem
                key={`${child.title}-${index}`}
                item={child}
                level={level + 1}
                onNavigate={onNavigate}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}

export function BookmarksPanel({ isOpen, onClose }: BookmarksPanelProps) {
  const { document, setCurrentPage } = usePDF()
  const [outline, setOutline] = useState<OutlineItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load outline when document changes
  useEffect(() => {
    if (!document) {
      setOutline(null)
      return
    }

    const loadOutline = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const outlineData = await document.getOutline()
        setOutline(outlineData as OutlineItem[] | null)
      } catch (err) {
        console.error('Failed to load outline:', err)
        setError('Failed to load bookmarks')
      } finally {
        setIsLoading(false)
      }
    }

    loadOutline()
  }, [document])

  const navigateToDestination = useCallback(
    async (dest: string | unknown[] | null) => {
      if (!document || !dest) return

      try {
        let ref: unknown

        if (typeof dest === 'string') {
          // Named destination - resolve it
          const destObj = await document.getDestination(dest)
          if (destObj) {
            ref = destObj[0]
          }
        } else if (Array.isArray(dest)) {
          ref = dest[0]
        }

        if (ref && typeof ref === 'object' && ref !== null && 'num' in ref) {
          const pageIndex = await document.getPageIndex(ref as { num: number; gen: number })
          setCurrentPage(pageIndex + 1) // Pages are 1-indexed
        }
      } catch (err) {
        console.error('Failed to navigate to destination:', err)
      }
    },
    [document, setCurrentPage]
  )

  const hasOutline = outline && outline.length > 0

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-80 p-0 flex flex-col">
        <SheetHeader className="px-4 py-4 border-b border-border/60">
          <SheetTitle className="flex items-center gap-2 text-base">
            <BookmarkSimple size={20} weight="bold" />
            Bookmarks
          </SheetTitle>
          <SheetDescription className="text-xs">
            Navigate through document outline
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-3">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {!isLoading && !error && !hasOutline && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ListBullets size={40} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">
                  No bookmarks available
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  This PDF doesn't contain an outline
                </p>
              </div>
            )}

            {!isLoading && !error && hasOutline && (
              <div className="space-y-0.5">
                {outline.map((item, index) => (
                  <BookmarkItem
                    key={`${item.title}-${index}`}
                    item={item}
                    level={0}
                    onNavigate={navigateToDestination}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
