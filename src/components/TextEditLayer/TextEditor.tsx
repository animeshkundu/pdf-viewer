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
import { getRotatedContentStyle, getTextRotation } from './text-rotation'

interface TextEditorProps {
  block: TextBlock
  rotation: number
  onSave: (newText: string, newStyle: TextStyle) => Promise<void>
  onCancel: () => void
}

export function TextEditor({ block, rotation, onSave, onCancel }: TextEditorProps) {
  const [text, setText] = useState(block.text)
  const [style, setStyle] = useState<TextStyle>(block.pdfStyle)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [])

  const handleSave = async () => {
    if (isSaving) return
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    } else if (e.key === 'Tab' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
      e.preventDefault()
      void handleSave()
    }
  }

  const isDirty =
    text !== block.text ||
    style.fontFamily !== block.pdfStyle.fontFamily ||
    style.fontSize !== block.pdfStyle.fontSize ||
    style.fontWeight !== block.pdfStyle.fontWeight ||
    style.fontStyle !== block.pdfStyle.fontStyle ||
    style.color !== block.pdfStyle.color ||
    style.textAlign !== block.pdfStyle.textAlign
  const contentStyle = getRotatedContentStyle(
    block.bounds,
    getTextRotation(block.direction, rotation)
  )
  const scale = block.viewport?.scale ?? (
    block.pdfStyle.fontSize > 0 ? block.style.fontSize / block.pdfStyle.fontSize : 1
  )

  return (
    <div
      className="text-editor absolute z-50"
      style={{
        left: block.bounds.x,
        top: block.bounds.y,
        width: block.bounds.width,
        height: block.bounds.height,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="editable-text absolute resize-none overflow-hidden border-2 border-blue-500 bg-white p-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        style={{
          ...contentStyle,
          fontFamily: style.fontFamily,
          fontSize: `${style.fontSize * scale}px`,
          fontWeight: style.fontWeight,
          fontStyle: style.fontStyle,
          color: style.color,
          textAlign: style.textAlign,
          lineHeight: 1,
        }}
        aria-label="Edit PDF text run"
        spellCheck={false}
      />

      <div className="absolute left-0 top-full mt-1 min-w-max rounded-lg border border-gray-200 bg-white shadow-xl">
        <TextEditToolbar style={style} onChange={handleStyleChange} />

        <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 px-3 py-2">
          <span className="text-xs text-gray-500">
            <kbd className="rounded bg-gray-200 px-1 py-0.5 text-[10px]">Esc</kbd> cancel
            {' · '}
            <kbd className="rounded bg-gray-200 px-1 py-0.5 text-[10px]">Tab</kbd> apply
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={isSaving || !isDirty}
            >
              {isSaving ? 'Applying...' : 'Apply'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
