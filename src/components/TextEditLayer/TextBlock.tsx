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
  displayText: string
  onClick: () => void
  onDoubleClick: () => void
}

export function TextBlock({
  block,
  isSelected,
  isEditing,
  displayText,
  onClick,
  onDoubleClick,
}: TextBlockProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDoubleClick()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      onClick()
    }
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
    <button
      type="button"
      className="text-block-overlay absolute cursor-text transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
      data-text-block={block.id}
      tabIndex={isEditing ? -1 : 0}
      aria-label={`Edit text: ${displayText}`}
      style={{
        left: block.bounds.x,
        top: block.bounds.y,
        width: block.bounds.width,
        height: block.bounds.height,
        border: `2px solid ${borderColor}`,
        backgroundColor,
        borderRadius: '2px',
        pointerEvents: isEditing ? 'none' : 'auto',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Click to edit text"
    >
      <span className="sr-only">{displayText}</span>

      {isSelected && (
        <span className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-t whitespace-nowrap">
          Editing text
        </span>
      )}
    </button>
  )
}
