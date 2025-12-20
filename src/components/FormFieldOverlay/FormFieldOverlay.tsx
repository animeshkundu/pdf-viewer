import { useEffect, useRef, useState } from 'react'
import type { FormField } from '@/types/form.types'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldOverlayProps {
  field: FormField
  scale: number
  pageHeight: number
  onUpdate: (fieldId: string, value: string | boolean | string[]) => void
  value: string | boolean | string[] | undefined
}

export function FormFieldOverlay({ field, scale, pageHeight, onUpdate, value }: FormFieldOverlayProps) {
  const [localValue, setLocalValue] = useState(value ?? field.defaultValue ?? '')
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setLocalValue(value ?? field.defaultValue ?? '')
  }, [value, field.defaultValue])

  const [x, y, width, height] = field.rect
  const pdfY = pageHeight - y - height

  const style = {
    position: 'absolute' as const,
    left: `${x * scale}px`,
    top: `${pdfY * scale}px`,
    width: `${width * scale}px`,
    height: `${height * scale}px`,
    zIndex: 10,
  }

  const handleChange = (newValue: string | boolean | string[]) => {
    setLocalValue(newValue)
    onUpdate(field.id, newValue)
  }

  const handleBlur = () => {
    onUpdate(field.id, localValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.stopPropagation()
    }
  }

  if (field.type === 'text') {
    return (
      <div style={style} className="form-field-overlay">
        <Input
          ref={inputRef as any}
          id={field.id}
          value={typeof localValue === 'string' ? localValue : ''}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={field.tooltip || field.name}
          disabled={field.readOnly}
          maxLength={field.maxLength}
          className={cn(
            'h-full w-full text-sm border-2 border-ocean-blue/50 bg-white/95',
            'focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/20',
            field.readOnly && 'bg-muted cursor-not-allowed'
          )}
          title={field.tooltip}
          aria-label={field.name}
          aria-required={field.required}
        />
      </div>
    )
  }

  if (field.type === 'multiline') {
    return (
      <div style={style} className="form-field-overlay">
        <Textarea
          ref={inputRef as any}
          id={field.id}
          value={typeof localValue === 'string' ? localValue : ''}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={field.tooltip || field.name}
          disabled={field.readOnly}
          maxLength={field.maxLength}
          className={cn(
            'h-full w-full text-sm resize-none border-2 border-ocean-blue/50 bg-white/95',
            'focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/20',
            field.readOnly && 'bg-muted cursor-not-allowed'
          )}
          title={field.tooltip}
          aria-label={field.name}
          aria-required={field.required}
        />
      </div>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <div style={style} className="form-field-overlay flex items-center justify-center">
        <Checkbox
          id={field.id}
          checked={typeof localValue === 'boolean' ? localValue : false}
          onCheckedChange={(checked) => handleChange(!!checked)}
          disabled={field.readOnly}
          className={cn(
            'w-5 h-5 border-2 border-ocean-blue/50',
            'data-[state=checked]:bg-ocean-blue data-[state=checked]:border-ocean-blue'
          )}
          title={field.tooltip}
          aria-label={field.name}
          aria-required={field.required}
        />
        {field.name && (
          <Label
            htmlFor={field.id}
            className="sr-only"
          >
            {field.name}
          </Label>
        )}
      </div>
    )
  }

  if (field.type === 'dropdown' && field.options) {
    return (
      <div style={style} className="form-field-overlay">
        <Select
          value={typeof localValue === 'string' ? localValue : undefined}
          onValueChange={(val) => handleChange(val)}
          disabled={field.readOnly}
        >
          <SelectTrigger
            id={field.id}
            className={cn(
              'h-full w-full text-sm border-2 border-ocean-blue/50 bg-white/95',
              'focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/20',
              field.readOnly && 'bg-muted cursor-not-allowed'
            )}
            title={field.tooltip}
            aria-label={field.name}
            aria-required={field.required}
          >
            <SelectValue placeholder={field.tooltip || field.name} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (field.type === 'radio' && field.options) {
    return (
      <div style={style} className="form-field-overlay flex items-center gap-2 px-2">
        {field.options.map((option) => (
          <label key={option} className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name={field.id}
              value={option}
              checked={localValue === option}
              onChange={(e) => handleChange(e.target.value)}
              disabled={field.readOnly}
              className="w-4 h-4 text-ocean-blue border-ocean-blue/50 focus:ring-ocean-blue"
              title={field.tooltip}
              aria-label={`${field.name} - ${option}`}
            />
            <span className="text-xs">{option}</span>
          </label>
        ))}
      </div>
    )
  }

  return null
}
