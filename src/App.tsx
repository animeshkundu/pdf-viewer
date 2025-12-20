import { Toaster } from 'sonner'
import { PDFProvider, usePDF } from './hooks/usePDF.tsx'
import { SearchProvider } from './hooks/useSearch.tsx'
import { AnnotationProvider, useAnnotations } from './hooks/useAnnotations.tsx'
import { PageManagementProvider, usePageManagement } from './hooks/usePageManagement'
import { useUnsavedChanges } from './hooks/useUnsavedChanges'
import { Toolbar } from './components/Toolbar/Toolbar'
import { MarkupToolbar } from './components/MarkupToolbar/MarkupToolbar'
import { PDFViewer } from './components/PDFViewer/PDFViewer'
import { ThumbnailSidebar } from './components/ThumbnailSidebar/ThumbnailSidebar'
import { EmptyState } from './components/EmptyState'
import { SearchBar } from './components/SearchBar/SearchBar'
import { ExportDialog } from './components/ExportDialog'
import { KeyboardShortcutsDialog } from './components/KeyboardShortcutsDialog'
import { useState, useEffect, useRef } from 'react'

function AppContentInner() {
  const { document, isLoading, currentPage, setCurrentPage, getOriginalBytes, getFilename, zoom, setZoom, loadDocument } = usePDF()
  const { annotations, addAnnotation, undo, redo, canUndo, canRedo, setActiveTool, deleteSelectedAnnotation } = useAnnotations()
  const { transformations, pageOrder } = usePageManagement()
  const { hasUnsavedChanges, markAsModified, markAsSaved } = useUnsavedChanges()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMarkupOpen, setIsMarkupOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault()
        if (fileInputRef.current) {
          fileInputRef.current.click()
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (document) {
          setIsExportOpen(true)
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        if (document) {
          setIsSearchOpen(true)
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        if (document) {
          setIsMarkupOpen(!isMarkupOpen)
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault()
        if (canRedo) {
          redo()
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (canUndo) {
          undo()
        }
        return
      }

      if (e.key === '?') {
        e.preventDefault()
        setIsShortcutsOpen(true)
        return
      }

      if (e.key === 'Escape') {
        setIsSearchOpen(false)
        setIsMarkupOpen(false)
        setIsShortcutsOpen(false)
        return
      }

      if (!document) return

      if (e.key === 'j' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (currentPage < document.numPages) {
          e.preventDefault()
          setCurrentPage(currentPage + 1)
        }
        return
      }

      if (e.key === 'k' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (currentPage > 1) {
          e.preventDefault()
          setCurrentPage(currentPage - 1)
        }
        return
      }

      if (e.key === 'Home') {
        e.preventDefault()
        setCurrentPage(1)
        return
      }

      if (e.key === 'End') {
        e.preventDefault()
        setCurrentPage(document.numPages)
        return
      }

      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        const newZoom = Math.min(zoom * 1.2, 4.0)
        setZoom(newZoom)
        return
      }

      if (e.key === '-') {
        e.preventDefault()
        const newZoom = Math.max(zoom / 1.2, 0.5)
        setZoom(newZoom)
        return
      }

      if (e.key === '0') {
        e.preventDefault()
        setZoom(-1)
        return
      }

      if (e.key === '1') {
        e.preventDefault()
        setZoom(1.0)
        return
      }

      if (isMarkupOpen) {
        switch (e.key) {
          case 'h':
            e.preventDefault()
            setActiveTool('highlight')
            break
          case 'p':
            e.preventDefault()
            setActiveTool('pen')
            break
          case 's':
            e.preventDefault()
            setActiveTool('signature')
            break
          case 't':
            e.preventDefault()
            setActiveTool('text')
            break
          case 'r':
            e.preventDefault()
            setActiveTool('rectangle')
            break
          case 'Delete':
          case 'Backspace':
            e.preventDefault()
            deleteSelectedAnnotation()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [document, currentPage, setCurrentPage, isMarkupOpen, zoom, setZoom, canUndo, canRedo, undo, redo, setActiveTool, deleteSelectedAnnotation])

  useEffect(() => {
    if (annotations.length > 0 || transformations.size > 0 || pageOrder.length > 0) {
      markAsModified()
    }
  }, [annotations, transformations, pageOrder, markAsModified])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await loadDocument(file)
      markAsSaved()
      if (e.target) {
        e.target.value = ''
      }
    }
  }

  const handleExportComplete = () => {
    markAsSaved()
    setIsExportOpen(false)
  }

  return (
    <div className="flex flex-col h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload PDF file"
      />

      <Toolbar 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onSearchClick={() => setIsSearchOpen(true)}
        onMarkupClick={() => setIsMarkupOpen(!isMarkupOpen)}
        isMarkupOpen={isMarkupOpen}
        onExportClick={() => setIsExportOpen(true)}
        hasUnsavedChanges={hasUnsavedChanges}
        onKeyboardShortcutsClick={() => setIsShortcutsOpen(true)}
      />
      
      <MarkupToolbar 
        isOpen={isMarkupOpen}
        onClose={() => setIsMarkupOpen(false)}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        
        <ThumbnailSidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <main id="main-content" className="flex-1 flex flex-col" role="main" aria-label="PDF viewer">
          {isLoading && (
            <div className="flex-1 flex items-center justify-center" role="status" aria-live="polite">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" aria-hidden="true"></div>
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          )}
          
          {!isLoading && !document && <EmptyState />}
          
          {!isLoading && document && <PDFViewer />}
        </main>
      </div>

      <ExportDialog
        isOpen={isExportOpen}
        onClose={handleExportComplete}
        originalFilename={getFilename() || undefined}
        originalPdfBytes={getOriginalBytes()}
        annotations={annotations}
        transformations={transformations}
        pageOrder={pageOrder}
      />

      <KeyboardShortcutsDialog
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  )
}

function AppContent() {
  const { document } = usePDF()
  
  return (
    <PageManagementProvider numPages={document?.numPages ?? 0}>
      <AppContentInner />
    </PageManagementProvider>
  )
}

function App() {
  return (
    <PDFProvider>
      <SearchProvider>
        <AnnotationProvider>
          <AppContent />
          <Toaster position="top-right" />
        </AnnotationProvider>
      </SearchProvider>
    </PDFProvider>
  )
}

export default App
