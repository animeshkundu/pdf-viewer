import { FileText } from '@phosphor-icons/react'
import { useRef } from 'react'
import { usePDF } from '@/hooks/usePDF.tsx'

export function EmptyState() {
  const { loadDocument } = usePDF()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      await loadDocument(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
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
      className="flex flex-col items-center justify-center h-full bg-background text-foreground"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
          <FileText size={48} weight="thin" className="text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            PDF Viewer & Editor
          </h1>
          <p className="text-muted-foreground text-base">
            View, annotate, and edit PDF documents entirely in your browser
          </p>
        </div>

        <div className="space-y-3 w-full">
          <button
            onClick={handleClick}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Open PDF File
          </button>
          
          <p className="text-sm text-muted-foreground">
            or drag and drop a PDF file anywhere
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}
