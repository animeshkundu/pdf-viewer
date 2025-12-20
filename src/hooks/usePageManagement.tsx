import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { pageManagementService } from '@/services/page-management.service'
import type { PageTransformation, BlankPage, PageSize, PageOrientation } from '@/types/page-management.types'

interface PageManagementContextValue {
  transformations: Map<number, PageTransformation>
  pageOrder: number[]
  selectedPages: Set<number>
  blankPages: BlankPage[]
  rotatePage: (pageNumber: number, direction: 'left' | 'right') => void
  deletePage: (pageNumber: number) => void
  deletePages: (pageNumbers: number[]) => void
  restorePage: (pageNumber: number) => void
  reorderPages: (fromIndex: number, toIndex: number) => void
  insertBlankPage: (position: number, size?: PageSize, orientation?: PageOrientation) => BlankPage
  removeBlankPage: (blankPageId: string) => void
  selectPage: (pageNumber: number, mode: 'single' | 'add' | 'range') => void
  clearSelection: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  getRotation: (pageNumber: number) => number
  isDeleted: (pageNumber: number) => boolean
  getVisiblePages: () => number[]
  getVisiblePageCount: () => number
}

const PageManagementContext = createContext<PageManagementContextValue | null>(null)

export function usePageManagement() {
  const context = useContext(PageManagementContext)
  if (!context) {
    throw new Error('usePageManagement must be used within PageManagementProvider')
  }
  return context
}

interface PageManagementProviderProps {
  children: ReactNode
  numPages?: number
}

export function PageManagementProvider({ children, numPages = 0 }: PageManagementProviderProps) {
  const [transformations, setTransformations] = useState<Map<number, PageTransformation>>(new Map())
  const [pageOrder, setPageOrder] = useState<number[]>([])
  const [blankPages, setBlankPages] = useState<BlankPage[]>([])
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [lastSelectedPage, setLastSelectedPage] = useState<number | null>(null)

  useEffect(() => {
    if (numPages > 0) {
      pageManagementService.initialize(numPages)
    }
  }, [numPages])

  useEffect(() => {
    const updateState = () => {
      setTransformations(new Map(pageManagementService['transformations']))
      setPageOrder([...pageManagementService.getPageOrder()])
      setBlankPages(pageManagementService.getBlankPages())
      setCanUndo(pageManagementService.canUndo())
      setCanRedo(pageManagementService.canRedo())
    }

    updateState()
    const unsubscribe = pageManagementService.subscribe(updateState)
    return unsubscribe
  }, [])

  const rotatePage = (pageNumber: number, direction: 'left' | 'right') => {
    pageManagementService.rotatePage(pageNumber, direction)
  }

  const deletePage = (pageNumber: number) => {
    pageManagementService.deletePage(pageNumber)
    setSelectedPages(prev => {
      const newSet = new Set(prev)
      newSet.delete(pageNumber)
      return newSet
    })
  }

  const deletePages = (pageNumbers: number[]) => {
    pageManagementService.deletePages(pageNumbers)
    setSelectedPages(prev => {
      const newSet = new Set(prev)
      pageNumbers.forEach(pn => newSet.delete(pn))
      return newSet
    })
  }

  const restorePage = (pageNumber: number) => {
    pageManagementService.restorePage(pageNumber)
  }

  const reorderPages = (fromIndex: number, toIndex: number) => {
    pageManagementService.reorderPages(fromIndex, toIndex)
  }

  const insertBlankPage = (position: number, size?: PageSize, orientation?: PageOrientation) => {
    return pageManagementService.insertBlankPage(position, size, orientation)
  }

  const removeBlankPage = (blankPageId: string) => {
    pageManagementService.removeBlankPage(blankPageId)
  }

  const selectPage = (pageNumber: number, mode: 'single' | 'add' | 'range' = 'single') => {
    if (mode === 'single') {
      setSelectedPages(new Set([pageNumber]))
      setLastSelectedPage(pageNumber)
    } else if (mode === 'add') {
      setSelectedPages(prev => {
        const newSet = new Set(prev)
        if (newSet.has(pageNumber)) {
          newSet.delete(pageNumber)
        } else {
          newSet.add(pageNumber)
        }
        return newSet
      })
      setLastSelectedPage(pageNumber)
    } else if (mode === 'range' && lastSelectedPage !== null) {
      const visiblePages = pageManagementService.getVisiblePages()
      const lastIndex = visiblePages.indexOf(lastSelectedPage)
      const currentIndex = visiblePages.indexOf(pageNumber)
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex)
        const end = Math.max(lastIndex, currentIndex)
        const rangePages = visiblePages.slice(start, end + 1)
        
        setSelectedPages(new Set(rangePages))
      }
    }
  }

  const clearSelection = () => {
    setSelectedPages(new Set())
    setLastSelectedPage(null)
  }

  const undo = () => {
    pageManagementService.undo()
  }

  const redo = () => {
    pageManagementService.redo()
  }

  const getRotation = (pageNumber: number) => {
    return pageManagementService.getRotation(pageNumber)
  }

  const isDeleted = (pageNumber: number) => {
    return pageManagementService.isDeleted(pageNumber)
  }

  const getVisiblePages = () => {
    return pageManagementService.getVisiblePages()
  }

  const getVisiblePageCount = () => {
    return pageManagementService.getVisiblePageCount()
  }

  const value: PageManagementContextValue = {
    transformations,
    pageOrder,
    selectedPages,
    blankPages,
    rotatePage,
    deletePage,
    deletePages,
    restorePage,
    reorderPages,
    insertBlankPage,
    removeBlankPage,
    selectPage,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
    getRotation,
    isDeleted,
    getVisiblePages,
    getVisiblePageCount,
  }

  return (
    <PageManagementContext.Provider value={value}>
      {children}
    </PageManagementContext.Provider>
  )
}
