import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert"
import { Button } from "./components/ui/button"
import { AlertTriangleIcon, RefreshCwIcon, FileTextIcon } from "lucide-react"

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  if (import.meta.env.DEV) throw error

  const getUserFriendlyMessage = (error: Error): string => {
    const message = error.message.toLowerCase()
    
    if (message.includes('pdf') || message.includes('document')) {
      return 'There was a problem loading or displaying the PDF document. The file may be corrupted or in an unsupported format.'
    }
    
    if (message.includes('memory') || message.includes('allocation')) {
      return 'The application ran out of memory. Try closing other tabs or working with a smaller document.'
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'A network error occurred. Please check your internet connection and try again.'
    }
    
    return 'An unexpected error occurred. Please try reloading the application.'
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <FileTextIcon className="w-8 h-8 text-destructive" aria-hidden="true" />
          </div>
        </div>

        <Alert variant="destructive">
          <AlertTriangleIcon aria-hidden="true" />
          <AlertTitle>Application Error</AlertTitle>
          <AlertDescription>
            {getUserFriendlyMessage(error)}
          </AlertDescription>
        </Alert>
        
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Technical Details:</h3>
          <pre className="text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-32 font-mono">
            {error.message}
          </pre>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button 
            onClick={resetErrorBoundary} 
            className="w-full"
          >
            <RefreshCwIcon className="mr-2" aria-hidden="true" />
            Try Again
          </Button>
          
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full"
            variant="outline"
          >
            Reload Application
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          If this problem persists, try refreshing your browser or opening a different PDF file.
        </p>
      </div>
    </div>
  )
}
