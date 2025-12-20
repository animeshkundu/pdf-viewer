import { Toaster } from 'sonner'
import { PDFProvider, usePDF } from './hooks/usePDF.tsx'
import { SearchProvider } from './hooks/useSearch.tsx'
import { AnnotationProvider, useAnnotations } from './hooks/useAnnotations.tsx'
import { PageManagementProvider, usePageManagement } from './hooks/usePageManagement'
import { FormProvider, useForm } from './hooks/useForm'
import { useUnsavedChanges } from './hooks/useUnsavedChanges'
import { Toolbar } from './components/Toolbar/Toolbar'
import { MarkupToolbar } from './components/MarkupToolbar/MarkupToolbar'
import { FormToolbar } from './components/FormToolbar/FormToolbar'
import { PDFViewer } from './components/PDFViewer/PDFViewer'
import { ThumbnailSidebar } from './components/ThumbnailSidebar/ThumbnailSidebar'
import { EmptyState } from './components/EmptyState'
import { SearchBar } from './components/SearchBar/SearchBar'
import { ExportDialog } from './components/ExportDialog'
import { KeyboardShortcutsDialog } from './components/KeyboardShortcutsDialog'
import { InstallPrompt } from './components/InstallPrompt'
import { OfflineIndicator } from './components/OfflineIndicator'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable'
import { useState, useEffect, useRef } from 'react'

function AppContentInner() {
  const { document, isLoading, currentPage, setCurrentPage, getOriginalBytes, getFilename, zoom, setZoom, loadDocument } = usePDF()
  const { annotations, addAnnotation, undo, redo, canUndo, canRedo, setActiveTool, deleteSelectedAnnotation } = useAnnotations()
  const { transformations, pageOrder, blankPages } = usePageManagement()
  const { hasUnsavedChanges, markAsModified, markAsSaved } = useUnsavedChanges()
  const { hasForm, isFormMode, setIsFormMode } = useForm()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMarkupOpen, setIsMarkupOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
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

      if (e.key === 'f' && !e.metaKey && !e.ctrlKey && document && hasForm) {
        e.preventDefault()
        setIsFormOpen(!isFormOpen)
        setIsFormMode(!isFormMode)
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
        if (isMarkupOpen) {
          setActiveTool(null)
        }
        setIsSearchOpen(false)
        setIsMarkupOpen(false)
        setIsFormOpen(false)
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
        const currentZoom = typeof zoom === 'number' ? zoom : 1.0
        const newZoom = Math.min(currentZoom * 1.2, 4.0)
        setZoom(newZoom)
        return
      }

      if (e.key === '-') {
        e.preventDefault()
        const currentZoom = typeof zoom === 'number' ? zoom : 1.0
        const newZoom = Math.max(currentZoom / 1.2, 0.5)
        setZoom(newZoom)
        return
      }

      if (e.key === '0') {
        e.preventDefault()
        setZoom('fit-width')
        return
      }

      if (e.key === '1') {
        e.preventDefault()
        setZoom(1.0)
        return
      }

      if (isMarkupOpen) {
        switch (e.key) {
          case 'v':
            e.preventDefault()
            setActiveTool(null)
            break
          case 'm':
            e.preventDefault()
            setActiveTool('select')
            break
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
          case 'x':
            e.preventDefault()
            setActiveTool('redaction')
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
  }, [document, currentPage, setCurrentPage, isMarkupOpen, isFormOpen, hasForm, isFormMode, zoom, setZoom, canUndo, canRedo, undo, redo, setActiveTool, deleteSelectedAnnotation, setIsFormMode])

  useEffect(() => {
    if (annotations.length > 0 || transformations.size > 0 || pageOrder.length > 0 || blankPages.length > 0) {
      markAsModified()
    }
  }, [annotations, transformations, pageOrder, blankPages, markAsModified])

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
    <div className="flex flex-col h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-xl"
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
        onFormClick={() => {
          setIsFormOpen(!isFormOpen)
          setIsFormMode(!isFormMode)
        }}
        isFormOpen={isFormOpen}
        hasForm={hasForm}
        onExportClick={() => setIsExportOpen(true)}
        hasUnsavedChanges={hasUnsavedChanges}
        onKeyboardShortcutsClick={() => setIsShortcutsOpen(true)}
      />
      
      <MarkupToolbar 
        isOpen={isMarkupOpen}
        onClose={() => setIsMarkupOpen(false)}
      />

      <FormToolbar
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setIsFormMode(false)
        }}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {isSidebarOpen && document && (
            <>
              <ResizablePanel defaultSize={20} minSize={12} maxSize={40}>
                <ThumbnailSidebar 
                  isOpen={isSidebarOpen}
                  onClose={() => setIsSidebarOpen(false)}
                />
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-border/40 hover:bg-border transition-colors" />
            </>
          )}
          
          <ResizablePanel defaultSize={80}>
            <main id="main-content" className="flex-1 flex flex-col h-full" role="main" aria-label="PDF viewer">
              {isLoading && (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/20" role="status" aria-live="polite">
                  <div className="text-center space-y-6">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-muted-foreground font-medium">Loading PDF...</p>
                  </div>
                </div>
              )}
              
              {!isLoading && !document && <EmptyState />}
              
              {!isLoading && document && <PDFViewer />}
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <ExportDialog
        isOpen={isExportOpen}
        onClose={handleExportComplete}
        originalFilename={getFilename() || undefined}
        originalPdfBytes={getOriginalBytes()}
        annotations={annotations}
        transformations={transformations}
        pageOrder={pageOrder}
        blankPages={blankPages}
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
      <FormProvider>
        <AppContentInner />
      </FormProvider>
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
          <InstallPrompt />
          <OfflineIndicator />
        </AnnotationProvider>
      </SearchProvider>
    </PDFProvider>
  )
}

export default App
