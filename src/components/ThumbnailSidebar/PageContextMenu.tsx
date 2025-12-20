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
  Trash 
} from '@phosphor-icons/react'

interface PageContextMenuProps {
  children: React.ReactNode
  pageNumber: number
  isSelected: boolean
  onRotateLeft: (pageNumber: number) => void
  onRotateRight: (pageNumber: number) => void
  onDelete: (pageNumber: number) => void
}

export function PageContextMenu({
  children,
  pageNumber,
  isSelected,
  onRotateLeft,
  onRotateRight,
  onDelete,
}: PageContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
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
