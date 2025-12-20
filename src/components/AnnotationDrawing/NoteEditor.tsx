import { useState, useRef, useEffect } from 'react'
import { useAnnotations } from '@/hooks/useAnnotations'
import { Point, NoteAnnotation } from '@/types/annotation.types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check, X } from '@phosphor-icons/react'

interface NoteEditorProps {
  pageNum: number
  position: Point
  onComplete: () => void
  onCancel: () => void
}

export function NoteEditor({ pageNum, position, onComplete, onCancel }: NoteEditorProps) {
  const { addAnnotation, toolSettings } = useAnnotations()
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSave = () => {
    if (content.trim()) {
      const annotation: NoteAnnotation = {
        id: `note-${Date.now()}`,
        type: 'note',
        pageNum,
        timestamp: Date.now(),
        position,
        content: content.trim(),
        color: toolSettings.color || 'oklch(0.95 0.05 85)',
      }
      addAnnotation(annotation)
    }
    onComplete()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div
      className="absolute bg-white shadow-lg border-2 border-accent rounded-md p-2 z-50"
      style={{
        left: position.x,
        top: position.y,
        width: 220,
      }}
    >
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your note..."
        className="min-h-[80px] text-sm mb-2 resize-none"
      />
      <div className="flex gap-1 justify-end">
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 w-7 p-0">
          <X size={16} />
        </Button>
        <Button size="sm" onClick={handleSave} className="h-7 w-7 p-0">
          <Check size={16} />
        </Button>
      </div>
    </div>
  )
}
