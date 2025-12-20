import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash, Check, X, UploadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface SavedSignature {
  id: string
  imageData: string
  timestamp: number
}

interface SignatureCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSelectSignature: (imageData: string) => void
}

export function SignatureCreator({ isOpen, onClose, onSelectSignature }: SignatureCreatorProps) {
  const [savedSignatures, setSavedSignatures] = useKV<SavedSignature[]>('pdf-signatures', [])
  const [activeTab, setActiveTab] = useState<'draw' | 'upload' | 'saved'>('draw')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [isOpen])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    setHasDrawn(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineWidth = 2
      ctx.strokeStyle = '#000000'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    setHasDrawn(false)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) return

    const imageData = canvas.toDataURL('image/png')
    const newSignature: SavedSignature = {
      id: `sig-${Date.now()}`,
      imageData,
      timestamp: Date.now(),
    }

    setSavedSignatures((current) => {
      const updated = [newSignature, ...(current || [])]
      return updated.slice(0, 5)
    })

    toast.success('Signature saved')
    onSelectSignature(imageData)
    onClose()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageData = event.target?.result as string
      onSelectSignature(imageData)
      onClose()
    }
    reader.readAsDataURL(file)
  }

  const deleteSignature = (id: string) => {
    setSavedSignatures((current) => (current || []).filter((sig) => sig.id !== id))
    toast.success('Signature deleted')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Signature</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="saved">Saved ({savedSignatures?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4 mt-4">
            <div className="border-2 border-border rounded-md bg-white">
              <canvas
                ref={canvasRef}
                width={450}
                height={200}
                className="cursor-crosshair w-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                Clear
              </Button>
              <Button size="sm" onClick={saveSignature} disabled={!hasDrawn}>
                <Check size={16} className="mr-2" />
                Save & Use
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <div className="border-2 border-dashed border-border rounded-md p-8 text-center">
              <UploadSimple size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload an image of your signature
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="signature-upload"
              />
              <Button asChild variant="outline">
                <label htmlFor="signature-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-4">
            {!savedSignatures || savedSignatures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No saved signatures yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {savedSignatures.map((signature) => (
                  <div
                    key={signature.id}
                    className="border border-border rounded-md p-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
                  >
                    <img
                      src={signature.imageData}
                      alt="Signature"
                      className="h-12 object-contain flex-1"
                    />
                    <div className="flex gap-1 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onSelectSignature(signature.imageData)
                          onClose()
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Check size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSignature(signature.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
