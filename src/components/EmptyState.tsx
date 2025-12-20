import { FileText, Upload } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { usePDF } from '@/hooks/usePDF.tsx'
import { cn } from '@/lib/utils'

export function EmptyState() {
  const { loadDocument } = usePDF()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      await loadDocument(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      await loadDocument(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-background via-background to-muted/30 text-foreground relative overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className={cn(
        "flex flex-col items-center gap-8 max-w-lg text-center px-8 relative z-10 transition-all duration-300",
        isDragging && "scale-105"
      )}>
        <div className={cn(
          "relative w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center transition-all duration-300 shadow-lg",
          isDragging && "shadow-2xl shadow-primary/20 scale-110"
        )}>
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-accent/5 blur-xl" />
          <FileText 
            size={56} 
            weight="duotone" 
            className={cn(
              "text-primary transition-all duration-300 relative z-10",
              isDragging && "text-accent scale-110"
            )} 
          />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            PDF Viewer & Editor
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            View, annotate, and edit PDF documents<br />entirely in your browser
          </p>
        </div>

        <div className="space-y-4 w-full max-w-sm">
          <button
            onClick={handleClick}
            className={cn(
              "group w-full px-8 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3",
              isDragging && "ring-4 ring-accent/50"
            )}
          >
            <Upload size={20} weight="bold" className="group-hover:animate-bounce" />
            <span>Open PDF File</span>
          </button>
          
          <div className="text-sm text-muted-foreground text-center">
            or drag and drop
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground/70 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>100% Private</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>No Upload Required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>Works Offline</span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {isDragging && (
        <div className="absolute inset-0 border-4 border-dashed border-accent rounded-2xl m-8 pointer-events-none z-20 animate-pulse" />
      )}
    </div>
  )
}
