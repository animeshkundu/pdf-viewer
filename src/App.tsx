import { Toaster } from 'sonner'
import { PDFProvider, usePDF } from './hooks/usePDF.tsx'
import { Toolbar } from './components/Toolbar/Toolbar'
import { PDFViewer } from './components/PDFViewer/PDFViewer'
import { EmptyState } from './components/EmptyState'

function AppContent() {
  const { document, isLoading } = usePDF()

  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
      
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
