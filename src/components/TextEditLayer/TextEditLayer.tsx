/**
 * TextEditLayer Component
 *
 * Renders an overlay for text editing on a PDF page.
 * Shows clickable text blocks and the text editor when editing.
 */

import { useTextBlocks, useTextEdit, useEditingBlock } from '@/hooks/useTextEdit'
import { TextBlock } from './TextBlock'
import { TextEditor } from './TextEditor'

interface TextEditLayerProps {
  pageNum: number
  scale: number
  containerWidth: number
  containerHeight: number
}

export function TextEditLayer({
  pageNum,
  scale,
  containerWidth,
  containerHeight,
}: TextEditLayerProps) {
  const { state, selectBlock, startEditing, cancelEditing, applyEdit } = useTextEdit()
  const { blocks, isLoading } = useTextBlocks(pageNum, scale)
  const editingBlock = useEditingBlock()

  // Don't render if text editing is not enabled
  if (!state.isEnabled) {
    return null
  }

  // Show loading indicator
  if (isLoading && blocks.length === 0) {
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
  }

  const handleBlockDoubleClick = (blockId: string) => {
    startEditing(blockId)
  }

  const handleEditorSave = async (newText: string, newStyle: any) => {
    try {
      await applyEdit(newText, newStyle)
    } catch (error) {
      console.error('Failed to apply edit:', error)
      // TODO: Show error toast
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
        pointerEvents: 'auto',
      }}
      onClick={handleOverlayClick}
    >
      {/* Text blocks */}
      {blocks.map((block) => (
        <TextBlock
          key={block.id}
          block={block}
          isSelected={state.selectedBlockId === block.id}
          isEditing={state.editingBlockId === block.id}
          onClick={() => handleBlockClick(block.id)}
          onDoubleClick={() => handleBlockDoubleClick(block.id)}
        />
      ))}

      {/* Text editor */}
      {editingBlock && (
        <TextEditor
          block={editingBlock}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </div>
  )
}
