/**
 * TextBlock Component
 *
 * Renders a clickable text block region on the PDF page.
 * Shows hover state and selection state.
 */

import { useState } from 'react'
import type { TextBlock as TextBlockType } from '@/types/text-edit.types'

interface TextBlockProps {
  block: TextBlockType
  isSelected: boolean
  isEditing: boolean
  onClick: () => void
  onDoubleClick: () => void
}

export function TextBlock({
  block,
  isSelected,
  isEditing,
  onClick,
  onDoubleClick,
}: TextBlockProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Don't show block if it's being edited
  if (isEditing) {
    return null
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDoubleClick()
  }

  // Determine border and background styles
  let borderColor = 'transparent'
  let backgroundColor = 'transparent'

  if (isSelected) {
    borderColor = 'rgb(59 130 246)' // blue-500
    backgroundColor = 'rgba(59, 130, 246, 0.1)'
  } else if (isHovered) {
    borderColor = 'rgba(59, 130, 246, 0.5)'
    backgroundColor = 'rgba(59, 130, 246, 0.05)'
  }

  return (
    <div
      className="absolute cursor-pointer transition-colors duration-150"
      style={{
        left: block.bounds.x,
        top: block.bounds.y,
        width: block.bounds.width,
        height: block.bounds.height,
        border: `2px solid ${borderColor}`,
        backgroundColor,
        borderRadius: '2px',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Double-click to edit"
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-t whitespace-nowrap">
          Double-click to edit
        </div>
      )}

      {/* Resize handles (for selected blocks) */}
      {isSelected && (
        <>
          {/* Corner handles */}
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-blue-500 rounded-full cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-blue-500 rounded-full cursor-sw-resize" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full cursor-se-resize" />
        </>
      )}
    </div>
  )
}
