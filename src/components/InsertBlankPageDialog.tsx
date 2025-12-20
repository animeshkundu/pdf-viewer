import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { PageSize, PageOrientation } from '@/types/page-management.types'
import { FilePlus } from '@phosphor-icons/react'

interface InsertBlankPageDialogProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (size: PageSize, orientation: PageOrientation) => void
  position: 'before' | 'after'
  pageNumber: number
}

export function InsertBlankPageDialog({
  isOpen,
  onClose,
  onInsert,
  position,
  pageNumber,
}: InsertBlankPageDialogProps) {
  const [size, setSize] = useState<PageSize>('letter')
  const [orientation, setOrientation] = useState<PageOrientation>('portrait')

  const handleInsert = () => {
    onInsert(size, orientation)
    onClose()
    setSize('letter')
    setOrientation('portrait')
  }

  const handleCancel = () => {
    onClose()
    setSize('letter')
    setOrientation('portrait')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-primary" weight="duotone" />
            Insert Blank Page
          </DialogTitle>
          <DialogDescription>
            Insert a blank page {position} page {pageNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Page Size</Label>
            <RadioGroup value={size} onValueChange={(value) => setSize(value as PageSize)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="letter" id="letter" />
                <Label htmlFor="letter" className="font-normal cursor-pointer">
                  Letter <span className="text-muted-foreground text-xs">(8.5" × 11")</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="a4" id="a4" />
                <Label htmlFor="a4" className="font-normal cursor-pointer">
                  A4 <span className="text-muted-foreground text-xs">(210mm × 297mm)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="legal" id="legal" />
                <Label htmlFor="legal" className="font-normal cursor-pointer">
                  Legal <span className="text-muted-foreground text-xs">(8.5" × 14")</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Orientation</Label>
            <RadioGroup
              value={orientation}
              onValueChange={(value) => setOrientation(value as PageOrientation)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="portrait" id="portrait" />
                <Label htmlFor="portrait" className="font-normal cursor-pointer">
                  Portrait <span className="text-muted-foreground text-xs">(Vertical)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="landscape" id="landscape" />
                <Label htmlFor="landscape" className="font-normal cursor-pointer">
                  Landscape <span className="text-muted-foreground text-xs">(Horizontal)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>
            Insert Blank Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
