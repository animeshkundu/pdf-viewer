import { FolderOpen, MagnifyingGlassPlus, MagnifyingGlassMinus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePDF } from '@/hooks/usePDF.tsx'
import { ZOOM_LEVELS } from '@/types/pdf.types'
import { useRef } from 'react'

export function Toolbar() {
  const { zoom, setZoom, document, loadDocument } = usePDF()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      await loadDocument(file)
    }
  }

  const handleOpenClick = () => {
    fileInputRef.current?.click()
  }

  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(z => z.value === zoom)
    if (currentIndex < ZOOM_LEVELS.length - 1 && typeof ZOOM_LEVELS[currentIndex + 1].value === 'number') {
      setZoom(ZOOM_LEVELS[currentIndex + 1].value as number)
    }
  }

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(z => z.value === zoom)
    if (currentIndex > 0 && typeof ZOOM_LEVELS[currentIndex - 1].value === 'number') {
      setZoom(ZOOM_LEVELS[currentIndex - 1].value as number)
    }
  }

  const handleZoomChange = (value: string) => {
    const zoomLevel = ZOOM_LEVELS.find(z => z.label === value)
    if (zoomLevel && typeof zoomLevel.value === 'number') {
      setZoom(zoomLevel.value)
    }
  }

  const currentZoomLabel = ZOOM_LEVELS.find(z => z.value === zoom)?.label || '100%'

  return (
    <div className="flex items-center justify-between border-b border-border bg-canvas-gray px-3 py-3 gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="default"
          onClick={handleOpenClick}
          className="gap-2"
        >
          <FolderOpen size={20} />
          Open File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {document && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <MagnifyingGlassMinus size={20} />
          </Button>

          <Select value={currentZoomLabel} onValueChange={handleZoomChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ZOOM_LEVELS.map((level) => (
                <SelectItem key={level.label} value={level.label}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 4.0}
          >
            <MagnifyingGlassPlus size={20} />
          </Button>
        </div>
      )}
    </div>
  )
}
