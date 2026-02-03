/**
 * TextEditToolbar Component
 *
 * Formatting toolbar for the text editor.
 * Provides controls for font, size, style, color, and alignment.
 */

import {
  TextB,
  TextItalic,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TextStyle } from '@/types/text-edit.types'

interface TextEditToolbarProps {
  style: TextStyle
  onChange: (updates: Partial<TextStyle>) => void
}

// Available fonts
const FONTS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Helvetica', label: 'Helvetica' },
]

// Available font sizes
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]

export function TextEditToolbar({ style, onChange }: TextEditToolbarProps) {
  const handleFontChange = (value: string) => {
    onChange({ fontFamily: value })
  }

  const handleSizeChange = (value: string) => {
    onChange({ fontSize: parseInt(value, 10) })
  }

  const toggleBold = () => {
    onChange({ fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' })
  }

  const toggleItalic = () => {
    onChange({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' })
  }

  const handleAlignChange = (align: 'left' | 'center' | 'right') => {
    onChange({ textAlign: align })
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ color: e.target.value })
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 flex-wrap">
      {/* Font family */}
      <Select value={style.fontFamily} onValueChange={handleFontChange}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          {FONTS.map((font) => (
            <SelectItem key={font.value} value={font.value} className="text-xs">
              <span style={{ fontFamily: font.value }}>{font.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Font size */}
      <Select value={String(Math.round(style.fontSize))} onValueChange={handleSizeChange}>
        <SelectTrigger className="w-[70px] h-8 text-xs">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((size) => (
            <SelectItem key={size} value={String(size)} className="text-xs">
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Bold */}
      <Button
        variant={style.fontWeight === 'bold' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={toggleBold}
        title="Bold (Ctrl+B)"
      >
        <TextB size={16} weight={style.fontWeight === 'bold' ? 'bold' : 'regular'} />
      </Button>

      {/* Italic */}
      <Button
        variant={style.fontStyle === 'italic' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={toggleItalic}
        title="Italic (Ctrl+I)"
      >
        <TextItalic size={16} weight={style.fontStyle === 'italic' ? 'bold' : 'regular'} />
      </Button>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Color picker */}
      <div className="relative">
        <input
          type="color"
          value={style.color}
          onChange={handleColorChange}
          className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
          title="Text color"
        />
        <div
          className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400"
          style={{ backgroundColor: style.color }}
        >
          <span className="text-xs font-bold" style={{ color: getContrastColor(style.color) }}>
            A
          </span>
        </div>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Alignment */}
      <Button
        variant={style.textAlign === 'left' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => handleAlignChange('left')}
        title="Align left"
      >
        <TextAlignLeft size={16} />
      </Button>
      <Button
        variant={style.textAlign === 'center' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => handleAlignChange('center')}
        title="Align center"
      >
        <TextAlignCenter size={16} />
      </Button>
      <Button
        variant={style.textAlign === 'right' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => handleAlignChange('right')}
        title="Align right"
      >
        <TextAlignRight size={16} />
      </Button>
    </div>
  )
}

/**
 * Get contrasting color (black or white) for text on background
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#ffffff'
}
