import { useState, useRef, useEffect } from 'react'
import { useAnnotations } from '@/hooks/useAnnotations'
import { Point, TextAnnotation } from '@/types/annotation.types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check, X } from '@phosphor-icons/react'

interface TextBoxEditorProps {
  pageNum: number
  position: Point
  onComplete: () => void
  onCancel: () => void
}

export function TextBoxEditor({ pageNum, position, onComplete, onCancel }: TextBoxEditorProps) {
  const { addAnnotation, toolSettings } = useAnnotations()
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSave = () => {
    if (content.trim()) {
      const annotation: TextAnnotation = {
        id: `text-${Date.now()}`,
        type: 'text',
        pageNum,
        timestamp: Date.now(),
        position,
        content: content.trim(),
        color: toolSettings.color,
        fontSize: 14,
        width: 200,
        height: 100,
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
        placeholder="Type your text..."
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
