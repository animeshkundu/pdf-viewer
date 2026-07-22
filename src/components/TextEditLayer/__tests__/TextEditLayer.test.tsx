import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TextBlock } from '../TextBlock'
import { TextEditor } from '../TextEditor'
import type { TextBlock as TextBlockType } from '@/types/text-edit.types'

const block: TextBlockType = {
  id: 'text-run-1-0-0-0',
  pageNum: 1,
  bounds: { x: 50, y: 75, width: 200, height: 24 },
  pdfBounds: { x: 50, y: 75, width: 200, height: 24 },
  pdfOrigin: [50, 92],
  direction: [1, 0],
  text: 'Original text',
  lines: [],
  style: {
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#000000',
    textAlign: 'left',
  },
  pdfStyle: {
    fontFamily: 'Arial',
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#000000',
    textAlign: 'left',
  },
}

describe('in-place text editing', () => {
  it('opens a text run from pointer and keyboard input', () => {
    const onClick = vi.fn()
    const onDoubleClick = vi.fn()
    render(
      <TextBlock
        block={block}
        isSelected={false}
        isEditing={false}
        displayText={block.text}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      />
    )

    const run = screen.getByRole('button', { name: `Edit text: ${block.text}` })
    fireEvent.click(run)
    fireEvent.keyDown(run, { key: 'Enter' })

    expect(onClick).toHaveBeenCalledTimes(2)
    expect(run).toHaveAttribute('data-text-block', block.id)
  })

  it('applies edited characters from the positioned editor', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(
      <TextEditor
        block={block}
        rotation={0}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    )

    const editor = screen.getByRole('textbox', { name: 'Edit PDF text run' })
    fireEvent.change(editor, { target: { value: 'Replacement text' } })
    fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: true })

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        'Replacement text',
        expect.objectContaining({ fontFamily: 'Arial', fontSize: 12 })
      )
    })
  })

  it('keeps the PDF font size stable if zoom changes while editing', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(
      <TextEditor
        block={{ ...block, viewport: { scale: 2, rotation: 0, pageWidth: 400, pageHeight: 600 } }}
        rotation={0}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    )

    const editor = screen.getByRole('textbox', { name: 'Edit PDF text run' })
    fireEvent.change(editor, { target: { value: 'Zoom-safe replacement' } })
    rerender(
      <TextEditor
        block={{
          ...block,
          bounds: { ...block.bounds, x: 100, y: 150, width: 400, height: 48 },
          style: { ...block.style, fontSize: 48 },
          viewport: { scale: 4, rotation: 0, pageWidth: 400, pageHeight: 600 },
        }}
        rotation={0}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    )
    fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: true })

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        'Zoom-safe replacement',
        expect.objectContaining({ fontSize: 12 })
      )
    })
  })
})
