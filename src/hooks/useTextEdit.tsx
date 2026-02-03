/**
 * useTextEdit Hook
 *
 * React hook and context for PDF text editing functionality.
 * Provides state management and operations for the text editing feature.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { textEditService } from '@/services/text-edit.service'
import type {
  TextBlock,
  TextStyle,
  TextEditState,
  TextEditContextType,
  TextEditProgress,
} from '@/types/text-edit.types'

// Context
const TextEditContext = createContext<TextEditContextType | null>(null)

// Provider Props
interface TextEditProviderProps {
  children: ReactNode
  pdfBytes?: ArrayBuffer | null
}

/**
 * TextEditProvider
 *
 * Provides text editing context to child components.
 */
export function TextEditProvider({ children, pdfBytes }: TextEditProviderProps) {
  const [state, setState] = useState<TextEditState>(textEditService.getState())
  const [progress, setProgress] = useState<TextEditProgress | null>(null)

  // Subscribe to service state changes
  useEffect(() => {
    const unsubscribe = textEditService.subscribe(() => {
      setState(textEditService.getState())
    })
    return unsubscribe
  }, [])

  // Set up progress callback
  useEffect(() => {
    textEditService.setProgressCallback(setProgress)
    return () => textEditService.setProgressCallback(() => {})
  }, [])

  /**
   * Enable text editing mode
   */
  const enableTextEdit = useCallback(async () => {
    if (!pdfBytes) {
      throw new Error('No PDF document loaded')
    }
    await textEditService.enable(pdfBytes)
  }, [pdfBytes])

  /**
   * Disable text editing mode
   */
  const disableTextEdit = useCallback(async () => {
    await textEditService.disable()
  }, [])

  /**
   * Extract text blocks from a page
   */
  const extractTextBlocks = useCallback(async (pageNum: number, scale = 1): Promise<TextBlock[]> => {
    return textEditService.extractTextBlocks(pageNum, scale)
  }, [])

  /**
   * Select a text block
   */
  const selectBlock = useCallback((blockId: string | null) => {
    textEditService.selectBlock(blockId)
  }, [])

  /**
   * Start editing a text block
   */
  const startEditing = useCallback((blockId: string) => {
    textEditService.startEditing(blockId)
  }, [])

  /**
   * Cancel editing
   */
  const cancelEditing = useCallback(() => {
    textEditService.cancelEditing()
  }, [])

  /**
   * Apply a text edit
   */
  const applyEdit = useCallback(async (newText: string, newStyle: TextStyle) => {
    const editingBlockId = textEditService.getState().editingBlockId
    if (!editingBlockId) {
      throw new Error('No block is being edited')
    }

    const block = textEditService.getBlockById(editingBlockId)
    if (!block) {
      throw new Error('Block not found')
    }

    await textEditService.applyEdit(block, newText, newStyle)
  }, [])

  /**
   * Undo last edit
   */
  const undo = useCallback(() => {
    textEditService.undo()
  }, [])

  /**
   * Redo last undone edit
   */
  const redo = useCallback(() => {
    textEditService.redo()
  }, [])

  // Computed values
  const canUndo = useMemo(() => textEditService.canUndo(), [state.historyIndex])
  const canRedo = useMemo(() => textEditService.canRedo(), [state.historyIndex, state.history.length])

  const contextValue: TextEditContextType = {
    state,
    enableTextEdit,
    disableTextEdit,
    extractTextBlocks,
    selectBlock,
    startEditing,
    cancelEditing,
    applyEdit,
    undo,
    redo,
    canUndo,
    canRedo,
  }

  return (
    <TextEditContext.Provider value={contextValue}>
      {children}
    </TextEditContext.Provider>
  )
}

/**
 * useTextEdit Hook
 *
 * Hook to access text editing context.
 */
export function useTextEdit(): TextEditContextType {
  const context = useContext(TextEditContext)
  if (!context) {
    throw new Error('useTextEdit must be used within a TextEditProvider')
  }
  return context
}

/**
 * useTextBlocks Hook
 *
 * Hook to get text blocks for a specific page.
 */
export function useTextBlocks(pageNum: number, scale: number = 1): {
  blocks: TextBlock[]
  isLoading: boolean
  error: string | undefined
  refresh: () => Promise<void>
} {
  const { state, extractTextBlocks } = useTextEdit()
  const [blocks, setBlocks] = useState<TextBlock[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  // Get cached state
  const pageState = state.pageStates.get(pageNum)

  useEffect(() => {
    if (!state.isEnabled) {
      setBlocks([])
      return
    }

    if (pageState) {
      setBlocks(pageState.blocks)
      setIsLoading(pageState.isLoading)
      setError(pageState.error)
    }
  }, [state.isEnabled, pageState])

  const refresh = useCallback(async () => {
    if (!state.isEnabled) return

    setIsLoading(true)
    setError(undefined)

    try {
      const newBlocks = await extractTextBlocks(pageNum, scale)
      setBlocks(newBlocks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract text')
    } finally {
      setIsLoading(false)
    }
  }, [state.isEnabled, pageNum, scale, extractTextBlocks])

  // Auto-extract on mount if enabled
  useEffect(() => {
    if (state.isEnabled && blocks.length === 0 && !isLoading && !error) {
      refresh()
    }
  }, [state.isEnabled, blocks.length, isLoading, error, refresh])

  return { blocks, isLoading, error, refresh }
}

/**
 * useSelectedBlock Hook
 *
 * Hook to get the currently selected text block.
 */
export function useSelectedBlock(): TextBlock | null {
  const { state } = useTextEdit()

  if (!state.selectedBlockId) return null

  return textEditService.getBlockById(state.selectedBlockId) || null
}

/**
 * useEditingBlock Hook
 *
 * Hook to get the currently editing text block.
 */
export function useEditingBlock(): TextBlock | null {
  const { state } = useTextEdit()

  if (!state.editingBlockId) return null

  return textEditService.getBlockById(state.editingBlockId) || null
}
