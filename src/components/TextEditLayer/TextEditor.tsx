/**
 * TextEditor Component
 *
 * In-place text editor that appears when a text block is being edited.
 * Includes formatting controls and save/cancel buttons.
 */

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TextEditToolbar } from '../TextEditToolbar/TextEditToolbar'
import type { TextBlock, TextStyle } from '@/types/text-edit.types'

interface TextEditorProps {
  block: TextBlock
  onSave: (newText: string, newStyle: TextStyle) => void
  onCancel: () => void
}

export function TextEditor({ block, onSave, onCancel }: TextEditorProps) {
  const [text, setText] = useState(block.text)
  const [style, setStyle] = useState<TextStyle>(block.style)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
      // Ctrl/Cmd + Enter to save
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [text, style, onCancel])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(text, style)
    } finally {
      setIsSaving(false)
    }
  }

  const handleStyleChange = (updates: Partial<TextStyle>) => {
    setStyle((prev) => ({ ...prev, ...updates }))
  }

  // Calculate editor dimensions (minimum size, can grow)
  const minWidth = Math.max(block.bounds.width, 200)
  const minHeight = Math.max(block.bounds.height, 100)

  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200"
      style={{
        left: block.bounds.x - 1,
        top: block.bounds.y - 40, // Account for toolbar
        minWidth,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Toolbar */}
      <TextEditToolbar style={style} onChange={handleStyleChange} />

      {/* Textarea */}
      <div className="p-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-2 resize-both overflow-auto border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{
            fontFamily: style.fontFamily,
            fontSize: `${style.fontSize}px`,
            fontWeight: style.fontWeight,
            fontStyle: style.fontStyle,
            color: style.color,
            textAlign: style.textAlign,
            minWidth: minWidth - 16,
            minHeight: minHeight,
            lineHeight: 1.4,
          }}
          placeholder="Enter text..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center px-3 py-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
        <span className="text-xs text-gray-500">
          Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">Esc</kbd> to cancel,{' '}
          <kbd className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">Ctrl+Enter</kbd> to save
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || text === block.text}
          >
            {isSaving ? 'Saving...' : 'Apply'}
          </Button>
        </div>
      </div>
    </div>
  )
}
