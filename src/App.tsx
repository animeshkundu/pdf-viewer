import { Toaster } from 'sonner'
import { PDFProvider, usePDF } from './hooks/usePDF.tsx'
import { SearchProvider } from './hooks/useSearch.tsx'
import { AnnotationProvider } from './hooks/useAnnotations.tsx'
import { PageManagementProvider } from './hooks/usePageManagement'
import { Toolbar } from './components/Toolbar/Toolbar'
import { MarkupToolbar } from './components/MarkupToolbar/MarkupToolbar'
import { PDFViewer } from './components/PDFViewer/PDFViewer'
import { ThumbnailSidebar } from './components/ThumbnailSidebar/ThumbnailSidebar'
import { EmptyState } from './components/EmptyState'
import { SearchBar } from './components/SearchBar/SearchBar'
import { useState, useEffect } from 'react'

function AppContent() {
  const { document, isLoading, currentPage, setCurrentPage } = usePDF()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMarkupOpen, setIsMarkupOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        if (document) {
          setIsSearchOpen(true)
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
        e.preventDefault()
        if (document) {
          setIsMarkupOpen(!isMarkupOpen)
        }
        return
      }

      if (e.key === 'Escape') {
        setIsSearchOpen(false)
        setIsMarkupOpen(false)
        return
      }

      if (!document) return

      switch (e.key) {
        case 'ArrowUp':
          if (currentPage > 1) {
            e.preventDefault()
            setCurrentPage(currentPage - 1)
          }
          break
        case 'ArrowDown':
          if (currentPage < document.numPages) {
            e.preventDefault()
            setCurrentPage(currentPage + 1)
          }
          break
        case 'PageUp':
          if (currentPage > 1) {
            e.preventDefault()
            setCurrentPage(currentPage - 1)
          }
          break
        case 'PageDown':
          if (currentPage < document.numPages) {
            e.preventDefault()
            setCurrentPage(currentPage + 1)
          }
          break
        case 'Home':
          e.preventDefault()
          setCurrentPage(1)
          break
        case 'End':
          e.preventDefault()
          setCurrentPage(document.numPages)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [document, currentPage, setCurrentPage, isMarkupOpen])

  return (
    <PageManagementProvider numPages={document?.numPages ?? 0}>
      <div className="flex flex-col h-screen">
        <Toolbar 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onSearchClick={() => setIsSearchOpen(true)}
          onMarkupClick={() => setIsMarkupOpen(!isMarkupOpen)}
          isMarkupOpen={isMarkupOpen}
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
          
          <div className="flex-1 flex flex-col">
            {isLoading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground">Loading PDF...</p>
                </div>
              </div>
            )}
            
            {!isLoading && !document && <EmptyState />}
            
            {!isLoading && document && <PDFViewer />}
          </div>
        </div>
      </div>
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
