import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { Trash, Plus, X } from '@phosphor-icons/react'
import { signatureService, SavedSignature } from '@/services/signature.service'
import { cn } from '@/lib/utils'

interface SignatureManagerProps {
  isOpen: boolean
  onClose: () => void
  onSignatureSelected: (imageData: string, width: number, height: number) => void
}

export function SignatureManager({ isOpen, onClose, onSignatureSelected }: SignatureManagerProps) {
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([])
  const [activeTab, setActiveTab] = useState<'saved' | 'draw' | 'upload'>('saved')
  const [signatureName, setSignatureName] = useState('')
  const [penThickness, setPenThickness] = useState(2)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadSignatures()
      if (activeTab === 'saved' && savedSignatures.length === 0) {
        setActiveTab('draw')
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (canvasRef.current && activeTab === 'draw') {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = penThickness
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
  }, [activeTab, penThickness])

  const loadSignatures = async () => {
    setIsLoading(true)
    try {
      const signatures = await signatureService.loadSignatures()
      setSavedSignatures(signatures)
    } catch (error) {
      console.error('Failed to load signatures:', error)
      toast.error('Failed to load signatures')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleSaveDrawnSignature = async () => {
    if (!canvasRef.current) return

    try {
      const { imageData, width, height } = signatureService.createSignatureImage(canvasRef.current)
      
      const name = signatureName.trim() || `Signature ${savedSignatures.length + 1}`
      
      await signatureService.saveSignature({
        name,
        imageData,
        width,
        height,
      })

      toast.success('Signature saved successfully')
      setSignatureName('')
      clearCanvas()
      await loadSignatures()
      setActiveTab('saved')
    } catch (error) {
      console.error('Failed to save signature:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save signature')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    try {
      const { imageData, width, height } = await signatureService.handleImageUpload(file)
      
      const name = signatureName.trim() || file.name.replace(/\.[^/.]+$/, '')
      
      await signatureService.saveSignature({
        name,
        imageData,
        width,
        height,
      })

      toast.success('Signature uploaded successfully')
      setSignatureName('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      await loadSignatures()
      setActiveTab('saved')
    } catch (error) {
      console.error('Failed to upload signature:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload signature')
    }
  }

  const handleDeleteSignature = async (id: string) => {
    try {
      await signatureService.deleteSignature(id)
      toast.success('Signature deleted')
      await loadSignatures()
    } catch (error) {
      console.error('Failed to delete signature:', error)
      toast.error('Failed to delete signature')
    }
  }

  const handleSelectSignature = (signature: SavedSignature) => {
    onSignatureSelected(signature.imageData, signature.width, signature.height)
    onClose()
  }

  const canAddMore = signatureService.canAddMore(savedSignatures.length)
  const maxSignatures = signatureService.getMaxSignatures()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Signature Manager</DialogTitle>
          <DialogDescription>
            Create, save, and manage up to {maxSignatures} signatures for quick insertion
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="saved">
              Saved ({savedSignatures.length}/{maxSignatures})
            </TabsTrigger>
            <TabsTrigger value="draw" disabled={!canAddMore && activeTab !== 'draw'}>
              Draw New
            </TabsTrigger>
            <TabsTrigger value="upload" disabled={!canAddMore && activeTab !== 'upload'}>
              Upload Image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading signatures...</div>
              </div>
            ) : savedSignatures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">No saved signatures</p>
                <Button
                  onClick={() => setActiveTab('draw')}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Signature
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-2 gap-4 pr-4">
                  {savedSignatures.map((signature) => (
                    <div
                      key={signature.id}
                      className={cn(
                        'group relative border-2 rounded-lg p-4 cursor-pointer transition-all',
                        'hover:border-primary hover:shadow-md'
                      )}
                      onClick={() => handleSelectSignature(signature)}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-center h-24 bg-muted rounded">
                          <img
                            src={signature.imageData}
                            alt={signature.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {signature.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSignature(signature.id)
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="draw" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature-name">Signature Name (Optional)</Label>
                <Input
                  id="signature-name"
                  placeholder="e.g., John Doe"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Pen Thickness</Label>
                  <span className="text-sm text-muted-foreground">{penThickness}px</span>
                </div>
                <Slider
                  value={[penThickness]}
                  onValueChange={([value]) => setPenThickness(value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Draw Your Signature</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCanvas}
                    className="h-8 gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full border-2 border-dashed rounded-lg bg-white cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
                <p className="text-xs text-muted-foreground">
                  Draw your signature with your mouse or trackpad
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSaveDrawnSignature}>
                Save Signature
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upload-signature-name">Signature Name (Optional)</Label>
                <Input
                  id="upload-signature-name"
                  placeholder="e.g., Official Signature"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload Image</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="signature-file-upload"
                  />
                  <label
                    htmlFor="signature-file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Plus className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload image</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, or GIF up to 5MB
                    </p>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a photo or scanned image of your signature
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
