import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { 
  ArrowCounterClockwise, 
  ArrowClockwise, 
  Trash,
  FilePlus
} from '@phosphor-icons/react'

interface PageContextMenuProps {
  children: React.ReactNode
  pageNumber: number
  isSelected: boolean
  onRotateLeft: (pageNumber: number) => void
  onRotateRight: (pageNumber: number) => void
  onDelete: (pageNumber: number) => void
  onInsertBefore: (pageNumber: number) => void
  onInsertAfter: (pageNumber: number) => void
}

export function PageContextMenu({
  children,
  pageNumber,
  isSelected,
  onRotateLeft,
  onRotateRight,
  onDelete,
  onInsertBefore,
  onInsertAfter,
}: PageContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem
          onClick={() => onInsertBefore(pageNumber)}
          className="gap-2"
        >
          <FilePlus size={16} />
          <span>Insert Blank Page Before</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onInsertAfter(pageNumber)}
          className="gap-2"
        >
          <FilePlus size={16} />
          <span>Insert Blank Page After</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onRotateLeft(pageNumber)}
          className="gap-2"
        >
          <ArrowCounterClockwise size={16} />
          <span>Rotate Left</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onRotateRight(pageNumber)}
          className="gap-2"
        >
          <ArrowClockwise size={16} />
          <span>Rotate Right</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(pageNumber)}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <Trash size={16} />
          <span>Delete Page{isSelected && 's'}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
