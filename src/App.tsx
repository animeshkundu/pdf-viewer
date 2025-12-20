import { Toaster } from 'sonner'
import { PDFProvider, usePDF } from './hooks/usePDF.tsx'
import { Toolbar } from './components/Toolbar/Toolbar'
import { PDFViewer } from './components/PDFViewer/PDFViewer'
import { ThumbnailSidebar } from './components/ThumbnailSidebar/ThumbnailSidebar'
import { EmptyState } from './components/EmptyState'
import { useState, useEffect } from 'react'

function AppContent() {
  const { document, isLoading, currentPage, setCurrentPage } = usePDF()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [document, currentPage, setCurrentPage])

  return (
    <div className="flex flex-col h-screen">
      <Toolbar 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      
      <div className="flex flex-1 overflow-hidden">
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
  )
}

function App() {
  return (
    <PDFProvider>
      <AppContent />
      <Toaster position="top-right" />
    </PDFProvider>
  )
}

export default App
