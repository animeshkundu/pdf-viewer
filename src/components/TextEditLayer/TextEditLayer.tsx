/**
 * TextEditLayer Component
 *
 * Renders an overlay for text editing on a PDF page.
 * Shows clickable text blocks and the text editor when editing.
 */

import { useTextBlocks, useTextEdit, useEditingBlock } from '@/hooks/useTextEdit'
import { TextBlock } from './TextBlock'
import { TextEditor } from './TextEditor'
import { getRotatedContentStyle, getTextRotation } from './text-rotation'
import { textBoundsToDisplay } from '@/services/text-edit.service'
import { toast } from 'sonner'
import { Fragment } from 'react'
import type { TextStyle, TextPageViewport } from '@/types/text-edit.types'

interface TextEditLayerProps {
  pageNum: number
  scale: number
  containerWidth: number
  containerHeight: number
  rotation: number
  pageWidth: number
  pageHeight: number
}

export function TextEditLayer({
  pageNum,
  scale,
  containerWidth,
  containerHeight,
  rotation,
  pageWidth,
  pageHeight,
}: TextEditLayerProps) {
  const { state, selectBlock, startEditing, cancelEditing, applyEdit } = useTextEdit()
  const { blocks, isLoading } = useTextBlocks(
    pageNum,
    scale,
    rotation,
    pageWidth,
    pageHeight
  )
  const editingBlock = useEditingBlock()
  const viewport: TextPageViewport = { scale, rotation, pageWidth, pageHeight }
  const edits = state.pendingEdits.filter((edit) => edit.pageNum === pageNum)
  const editsByBlock = new Map(edits.map((edit) => [edit.blockId, edit]))
  const editingEdit = editingBlock ? editsByBlock.get(editingBlock.id) : undefined
  const editorBlock = editingBlock && editingBlock.pageNum === pageNum
    ? editingEdit
      ? {
          ...editingBlock,
          text: editingEdit.newText,
          bounds: textBoundsToDisplay(editingEdit.operation.newBounds, viewport),
          style: {
            ...editingEdit.style,
            fontSize: editingEdit.operation.style.fontSize * scale,
          },
          pdfStyle: {
            ...editingEdit.style,
            fontSize: editingEdit.operation.style.fontSize,
          },
        }
      : editingBlock
    : null

  if (!state.isEnabled && edits.length === 0) {
    return null
  }

  // Show loading indicator
  if (state.isEnabled && isLoading && blocks.length === 0) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-black/5"
        style={{ width: containerWidth, height: containerHeight }}
      >
        <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm text-gray-600">Detecting text...</span>
        </div>
      </div>
    )
  }

  const handleBlockClick = (blockId: string) => {
    selectBlock(blockId)
    startEditing(blockId)
  }

  const handleBlockDoubleClick = (blockId: string) => {
    startEditing(blockId)
  }

  const handleEditorSave = async (newText: string, newStyle: TextStyle) => {
    try {
      await applyEdit(newText, newStyle)
    } catch (error) {
      console.error('Failed to apply edit:', error)
      toast.error('Failed to apply text edit')
    }
  }

  const handleEditorCancel = () => {
    cancelEditing()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Deselect when clicking on empty area
    if (e.target === e.currentTarget) {
      selectBlock(null)
    }
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        width: containerWidth,
        height: containerHeight,
        pointerEvents: state.isEnabled ? 'auto' : 'none',
        zIndex: 40,
      }}
      onClick={handleOverlayClick}
    >
      {edits.map((edit) => {
        const originalBounds = textBoundsToDisplay(edit.operation.originalBounds, viewport)
        const replacementBounds = textBoundsToDisplay(edit.operation.newBounds, viewport)
        const contentStyle = getRotatedContentStyle(
          replacementBounds,
          getTextRotation(edit.operation.direction, rotation)
        )

        return (
          <Fragment key={edit.id}>
            <div
              className="absolute bg-white pointer-events-none"
              style={{
                left: originalBounds.x,
                top: originalBounds.y,
                width: originalBounds.width,
                height: originalBounds.height,
              }}
              aria-hidden="true"
            />
            {edit.newText && (
              <div
                className="absolute overflow-visible pointer-events-none"
                style={{
                  left: replacementBounds.x,
                  top: replacementBounds.y,
                  width: replacementBounds.width,
                  height: replacementBounds.height,
                }}
              >
                <span
                  className="absolute block whitespace-pre overflow-hidden"
                  style={{
                    ...contentStyle,
                    fontFamily: edit.style.fontFamily,
                    fontSize: edit.operation.style.fontSize * scale,
                    fontWeight: edit.style.fontWeight,
                    fontStyle: edit.style.fontStyle,
                    color: edit.style.color,
                    textAlign: edit.style.textAlign,
                    lineHeight: 1.2,
                  }}
                >
                  {edit.newText}
                </span>
              </div>
            )}
          </Fragment>
        )
      })}

      {state.isEnabled && blocks.map((block) => (
        <TextBlock
          key={block.id}
          block={block}
          isSelected={state.selectedBlockId === block.id}
          isEditing={state.editingBlockId === block.id}
          displayText={editsByBlock.get(block.id)?.newText ?? block.text}
          onClick={() => handleBlockClick(block.id)}
          onDoubleClick={() => handleBlockDoubleClick(block.id)}
        />
      ))}

      {/* Text editor */}
      {editorBlock && (
        <TextEditor
          key={editorBlock.id}
          block={editorBlock}
          rotation={rotation}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </div>
  )
}
