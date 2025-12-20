import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Slider } from './ui/slider'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import type { Watermark, WatermarkPosition, PageRange } from '../types/watermark.types'
import { DEFAULT_WATERMARK } from '../types/watermark.types'
import { toast } from 'sonner'
import { useWatermark } from '../hooks/useWatermark'

interface WatermarkDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function WatermarkDialog({ isOpen, onClose }: WatermarkDialogProps) {
  const { watermark: existingWatermark, setWatermark, removeWatermark } = useWatermark()
  
  const [text, setText] = useState('DRAFT')
  const [fontSize, setFontSize] = useState(DEFAULT_WATERMARK.fontSize!)
  const [opacity, setOpacity] = useState(DEFAULT_WATERMARK.opacity!)
  const [rotation, setRotation] = useState(DEFAULT_WATERMARK.rotation!)
  const [color, setColor] = useState(DEFAULT_WATERMARK.color!)
  const [position, setPosition] = useState<WatermarkPosition>(DEFAULT_WATERMARK.position!)
  const [pageRangeType, setPageRangeType] = useState<'all' | 'range'>('all')
  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(10)

  useEffect(() => {
    if (existingWatermark) {
      setText(existingWatermark.text)
      setFontSize(existingWatermark.fontSize)
      setOpacity(existingWatermark.opacity)
      setRotation(existingWatermark.rotation)
      setColor(existingWatermark.color)
      setPosition(existingWatermark.position)
      
      if (existingWatermark.pageRange.type === 'range') {
        setPageRangeType('range')
        setRangeStart(existingWatermark.pageRange.start)
        setRangeEnd(existingWatermark.pageRange.end)
      } else {
        setPageRangeType('all')
      }
    }
  }, [existingWatermark, isOpen])

  const handleApply = () => {
    if (!text.trim()) {
      toast.error('Watermark text cannot be empty')
      return
    }

    const pageRange: PageRange = pageRangeType === 'all' 
      ? { type: 'all' }
      : { type: 'range', start: rangeStart, end: rangeEnd }

    const watermark: Watermark = {
      id: `watermark-${Date.now()}`,
      text: text.trim(),
      fontSize,
      color,
      opacity,
      rotation,
      position,
      pageRange
    }

    setWatermark(watermark)
    toast.success('Watermark applied')
    onClose()
  }

  const handleRemove = () => {
    removeWatermark()
    toast.success('Watermark removed')
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  const colorPresets = [
    { name: 'Gray', value: 'oklch(0.5 0 0)' },
    { name: 'Light Gray', value: 'oklch(0.7 0 0)' },
    { name: 'Dark Gray', value: 'oklch(0.3 0 0)' },
    { name: 'Red', value: 'oklch(0.55 0.22 27)' },
    { name: 'Blue', value: 'oklch(0.55 0.18 240)' },
    { name: 'Green', value: 'oklch(0.6 0.15 145)' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Watermark</DialogTitle>
          <DialogDescription>
            Apply a text watermark to your PDF document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="watermark-text">Watermark Text</Label>
            <Input
              id="watermark-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., DRAFT, CONFIDENTIAL"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label>Font Size: {fontSize}px</Label>
            <Slider
              value={[fontSize]}
              onValueChange={(values) => setFontSize(values[0])}
              min={12}
              max={120}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Opacity: {(opacity * 100).toFixed(0)}%</Label>
            <Slider
              value={[opacity * 100]}
              onValueChange={(values) => setOpacity(values[0] / 100)}
              min={10}
              max={100}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <Label>Rotation: {rotation}°</Label>
            <Slider
              value={[rotation]}
              onValueChange={(values) => setRotation(values[0])}
              min={-45}
              max={45}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-3 gap-2">
              {colorPresets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={color === preset.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setColor(preset.value)}
                  className="justify-start"
                >
                  <div
                    className="w-4 h-4 rounded mr-2 border"
                    style={{
                      backgroundColor: preset.value.startsWith('oklch')
                        ? `oklch(${preset.value.match(/oklch\((.*?)\)/)?.[1]})`
                        : preset.value
                    }}
                  />
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Position</Label>
            <RadioGroup
              value={position}
              onValueChange={(value) => setPosition(value as WatermarkPosition)}
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="top-left" id="pos-tl" />
                  <Label htmlFor="pos-tl" className="cursor-pointer">Top Left</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="top-center" id="pos-tc" />
                  <Label htmlFor="pos-tc" className="cursor-pointer">Top Center</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="top-right" id="pos-tr" />
                  <Label htmlFor="pos-tr" className="cursor-pointer">Top Right</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="center" id="pos-c" />
                  <Label htmlFor="pos-c" className="cursor-pointer">Center</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="diagonal" id="pos-d" />
                  <Label htmlFor="pos-d" className="cursor-pointer">Diagonal</Label>
                </div>
                <div></div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bottom-left" id="pos-bl" />
                  <Label htmlFor="pos-bl" className="cursor-pointer">Bottom Left</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bottom-center" id="pos-bc" />
                  <Label htmlFor="pos-bc" className="cursor-pointer">Bottom Center</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bottom-right" id="pos-br" />
                  <Label htmlFor="pos-br" className="cursor-pointer">Bottom Right</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Apply to Pages</Label>
            <Tabs value={pageRangeType} onValueChange={(v) => setPageRangeType(v as 'all' | 'range')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">All Pages</TabsTrigger>
                <TabsTrigger value="range">Page Range</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-2">
                <p className="text-sm text-muted-foreground">
                  Watermark will be applied to all pages in the document
                </p>
              </TabsContent>
              <TabsContent value="range" className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="range-start" className="text-xs">From Page</Label>
                    <Input
                      id="range-start"
                      type="number"
                      min={1}
                      value={rangeStart}
                      onChange={(e) => setRangeStart(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="range-end" className="text-xs">To Page</Label>
                    <Input
                      id="range-end"
                      type="number"
                      min={rangeStart}
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(parseInt(e.target.value) || rangeStart)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="flex justify-between gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {existingWatermark && (
              <Button variant="destructive" onClick={handleRemove}>
                Remove Watermark
              </Button>
            )}
            <Button onClick={handleApply}>
              Apply Watermark
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
