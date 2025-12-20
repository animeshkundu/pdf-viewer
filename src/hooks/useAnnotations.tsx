import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { annotationService } from '@/services/annotation.service'
import { Annotation, ToolType, ToolSettings, HIGHLIGHT_COLORS, PEN_COLORS } from '@/types/annotation.types'

interface AnnotationContextType {
  annotations: Annotation[]
  selectedAnnotationId: string | null
  activeTool: ToolType
  toolSettings: ToolSettings
  setActiveTool: (tool: ToolType) => void
  setSelectedAnnotation: (id: string | null) => void
  updateToolSettings: (settings: Partial<ToolSettings>) => void
  addAnnotation: (annotation: Annotation) => string
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void
  deleteAnnotation: (id: string) => void
  deleteSelectedAnnotation: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  clearAnnotations: () => void
  getPageAnnotations: (pageNum: number) => Annotation[]
}

const AnnotationContext = createContext<AnnotationContextType | null>(null)

export function useAnnotations() {
  const context = useContext(AnnotationContext)
  if (!context) {
    throw new Error('useAnnotations must be used within AnnotationProvider')
  }
  return context
}

interface AnnotationProviderProps {
  children: ReactNode
}

export function AnnotationProvider({ children }: AnnotationProviderProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<ToolType>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [toolSettings, setToolSettings] = useState<ToolSettings>({
    color: HIGHLIGHT_COLORS.yellow,
    thickness: 2,
    fontSize: 14,
    opacity: 0.4,
  })

  useEffect(() => {
    const updateState = () => {
      setAnnotations(annotationService.getAllAnnotations())
      setCanUndo(annotationService.canUndo())
      setCanRedo(annotationService.canRedo())
    }

    updateState()
    return annotationService.subscribe(updateState)
  }, [])

  const addAnnotation = (annotation: Annotation) => {
    return annotationService.addAnnotation(annotation)
  }

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    annotationService.updateAnnotation(id, updates)
  }

  const deleteAnnotation = (id: string) => {
    annotationService.deleteAnnotation(id)
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null)
    }
  }

  const deleteSelectedAnnotation = () => {
    if (selectedAnnotationId) {
      deleteAnnotation(selectedAnnotationId)
    }
  }

  const undo = () => {
    annotationService.undo()
    setSelectedAnnotationId(null)
  }

  const redo = () => {
    annotationService.redo()
    setSelectedAnnotationId(null)
  }

  const clearAnnotations = () => {
    annotationService.clearAnnotations()
    setSelectedAnnotationId(null)
  }

  const getPageAnnotations = (pageNum: number) => {
    return annotationService.getAnnotations(pageNum)
  }

  const updateToolSettings = (settings: Partial<ToolSettings>) => {
    setToolSettings(prev => ({ ...prev, ...settings }))
  }

  const handleSetActiveTool = (tool: ToolType) => {
    setActiveTool(tool)
    setSelectedAnnotationId(null)
    
    if (tool === 'highlight') {
      updateToolSettings({ color: HIGHLIGHT_COLORS.yellow, opacity: 0.4 })
    } else if (tool === 'pen' || tool === 'rectangle' || tool === 'circle' || tool === 'arrow' || tool === 'line') {
      updateToolSettings({ color: PEN_COLORS.black, opacity: 1 })
    }
  }

  return (
    <AnnotationContext.Provider
      value={{
        annotations,
        selectedAnnotationId,
        activeTool,
        toolSettings,
        setActiveTool: handleSetActiveTool,
        setSelectedAnnotation: setSelectedAnnotationId,
        updateToolSettings,
        addAnnotation,
        updateAnnotation,
        deleteAnnotation,
        deleteSelectedAnnotation,
        undo,
        redo,
        canUndo,
        canRedo,
        clearAnnotations,
        getPageAnnotations,
      }}
    >
      {children}
    </AnnotationContext.Provider>
  )
}
