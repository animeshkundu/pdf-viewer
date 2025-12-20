import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Slider } from './ui/slider'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { usePageNumber } from '@/hooks/usePageNumber'
import { usePDF } from '@/hooks/usePDF.tsx'
import type { PageNumberConfig, PageNumberPosition, PageNumberFormat } from '@/types/page-number.types'
import { DEFAULT_PAGE_NUMBER_CONFIG, PAGE_NUMBER_COLORS } from '@/types/page-number.types'
import { toast } from 'sonner'

interface PageNumberDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function PageNumberDialog({ isOpen, onClose }: PageNumberDialogProps) {
  const { pageNumberConfig, setPageNumberConfig, removePageNumberConfig, hasPageNumbers } = usePageNumber()
  const { document } = usePDF()
  
  const [position, setPosition] = useState<PageNumberPosition>(
    pageNumberConfig?.position || DEFAULT_PAGE_NUMBER_CONFIG.position
  )
  const [format, setFormat] = useState<PageNumberFormat>(
    pageNumberConfig?.format || DEFAULT_PAGE_NUMBER_CONFIG.format
  )
  const [fontSize, setFontSize] = useState(
    pageNumberConfig?.fontSize || DEFAULT_PAGE_NUMBER_CONFIG.fontSize
  )
  const [color, setColor] = useState(
    pageNumberConfig?.color || DEFAULT_PAGE_NUMBER_CONFIG.color
  )
  const [startNumber, setStartNumber] = useState(
    pageNumberConfig?.startNumber || DEFAULT_PAGE_NUMBER_CONFIG.startNumber
  )
  const [prefix, setPrefix] = useState(
    pageNumberConfig?.prefix || DEFAULT_PAGE_NUMBER_CONFIG.prefix
  )
  const [suffix, setSuffix] = useState(
    pageNumberConfig?.suffix || DEFAULT_PAGE_NUMBER_CONFIG.suffix
  )
  const [pageRangeType, setPageRangeType] = useState<'all' | 'range'>(
    pageNumberConfig?.pageRange.type || DEFAULT_PAGE_NUMBER_CONFIG.pageRange.type
  )
  const [rangeStart, setRangeStart] = useState(
    pageNumberConfig?.pageRange.start?.toString() || '1'
  )
  const [rangeEnd, setRangeEnd] = useState(
    pageNumberConfig?.pageRange.end?.toString() || (document?.numPages.toString() || '1')
  )
  
  useEffect(() => {
    if (isOpen && pageNumberConfig) {
      setPosition(pageNumberConfig.position)
      setFormat(pageNumberConfig.format)
      setFontSize(pageNumberConfig.fontSize)
      setColor(pageNumberConfig.color)
      setStartNumber(pageNumberConfig.startNumber)
      setPrefix(pageNumberConfig.prefix)
      setSuffix(pageNumberConfig.suffix)
      setPageRangeType(pageNumberConfig.pageRange.type)
      setRangeStart(pageNumberConfig.pageRange.start?.toString() || '1')
      setRangeEnd(pageNumberConfig.pageRange.end?.toString() || (document?.numPages.toString() || '1'))
    } else if (isOpen) {
      setPosition(DEFAULT_PAGE_NUMBER_CONFIG.position)
      setFormat(DEFAULT_PAGE_NUMBER_CONFIG.format)
      setFontSize(DEFAULT_PAGE_NUMBER_CONFIG.fontSize)
      setColor(DEFAULT_PAGE_NUMBER_CONFIG.color)
      setStartNumber(DEFAULT_PAGE_NUMBER_CONFIG.startNumber)
      setPrefix(DEFAULT_PAGE_NUMBER_CONFIG.prefix)
      setSuffix(DEFAULT_PAGE_NUMBER_CONFIG.suffix)
      setPageRangeType(DEFAULT_PAGE_NUMBER_CONFIG.pageRange.type)
      setRangeStart('1')
      setRangeEnd(document?.numPages.toString() || '1')
    }
  }, [isOpen, pageNumberConfig, document])
  
  const handleApply = () => {
    const config: PageNumberConfig = {
      id: pageNumberConfig?.id || `page-numbers-${Date.now()}`,
      enabled: true,
      position,
      format,
      fontSize,
      color,
      startNumber,
      prefix,
      suffix,
      pageRange: {
        type: pageRangeType,
        ...(pageRangeType === 'range' && {
          start: parseInt(rangeStart) || 1,
          end: parseInt(rangeEnd) || document?.numPages || 1
        })
      }
    }
    
    setPageNumberConfig(config)
    toast.success('Page numbers added')
    onClose()
  }
  
  const handleRemove = () => {
    removePageNumberConfig()
    toast.success('Page numbers removed')
    onClose()
  }
  
  const positionLabels: Record<PageNumberPosition, string> = {
    'top-left': 'Top Left',
    'top-center': 'Top Center',
    'top-right': 'Top Right',
    'bottom-left': 'Bottom Left',
    'bottom-center': 'Bottom Center',
    'bottom-right': 'Bottom Right'
  }
  
  const positionOptions: PageNumberPosition[] = [
    'top-left', 'top-center', 'top-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ]
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Page Numbers</DialogTitle>
          <DialogDescription>
            Customize the appearance and position of page numbers in your document
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Position</Label>
            <RadioGroup value={position} onValueChange={(value) => setPosition(value as PageNumberPosition)}>
              <div className="grid grid-cols-3 gap-3">
                {positionOptions.map((pos) => (
                  <label
                    key={pos}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      position === pos
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={pos} id={pos} className="sr-only" />
                    <span className="text-sm font-medium">{positionLabels[pos]}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as PageNumberFormat)}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numeric">Numeric (1, 2, 3...)</SelectItem>
                <SelectItem value="text">Text (Page 1, Page 2...)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="fontSize">Font Size</Label>
              <span className="text-sm text-muted-foreground">{fontSize}px</span>
            </div>
            <Slider
              id="fontSize"
              min={8}
              max={24}
              step={1}
              value={[fontSize]}
              onValueChange={([value]) => setFontSize(value)}
            />
          </div>
          
          <div className="space-y-3">
            <Label>Color</Label>
            <div className="grid grid-cols-3 gap-2">
              {PAGE_NUMBER_COLORS.map((colorOption) => (
                <button
                  key={colorOption.name}
                  onClick={() => setColor(colorOption.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm transition-colors ${
                    color === colorOption.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: colorOption.value.replace('oklch', 'oklch(').includes('(') ? '' : colorOption.value }}
                  />
                  <span>{colorOption.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startNumber">Start From</Label>
              <Input
                id="startNumber"
                type="number"
                min={1}
                value={startNumber}
                onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                type="text"
                placeholder="e.g., Draft -"
                maxLength={20}
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suffix">Suffix</Label>
              <Input
                id="suffix"
                type="text"
                placeholder="e.g., of 100"
                maxLength={20}
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label>Apply To</Label>
            <Tabs value={pageRangeType} onValueChange={(value) => setPageRangeType(value as 'all' | 'range')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">All Pages</TabsTrigger>
                <TabsTrigger value="range">Page Range</TabsTrigger>
              </TabsList>
              <TabsContent value="range" className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="rangeStart">From Page</Label>
                    <Input
                      id="rangeStart"
                      type="number"
                      min={1}
                      max={document?.numPages || 1}
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rangeEnd">To Page</Label>
                    <Input
                      id="rangeEnd"
                      type="number"
                      min={1}
                      max={document?.numPages || 1}
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {hasPageNumbers && (
            <Button variant="destructive" onClick={handleRemove}>
              Remove
            </Button>
          )}
          <Button onClick={handleApply}>
            Apply Page Numbers
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
