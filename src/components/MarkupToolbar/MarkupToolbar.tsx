import { useState } from 'react'
import { useAnnotations } from '@/hooks/useAnnotations'
import { usePDF } from '@/hooks/usePDF'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  Highlighter,
  PencilLine,
  Rectangle,
  Circle,
  ArrowRight,
  MinusCircle,
  TextAa,
  Note,
  Signature,
  X,
  ArrowCounterClockwise,
  ArrowClockwise,
  Trash,
  Cursor,
  TextT,
  Prohibit,
} from '@phosphor-icons/react'
import { ToolType, HIGHLIGHT_COLORS, PEN_COLORS, PEN_THICKNESSES } from '@/types/annotation.types'
import { SignatureManager } from '@/components/SignatureManager/SignatureManager'
import { RedactionWarningDialog } from '@/components/RedactionWarningDialog'
import { cn } from '@/lib/utils'
import { useKV } from '@github/spark/hooks'

interface MarkupToolbarProps {
  isOpen: boolean
  onClose: () => void
}

export function MarkupToolbar({ isOpen, onClose }: MarkupToolbarProps) {
  const [isSignatureManagerOpen, setIsSignatureManagerOpen] = useState(false)
  const [showRedactionWarning, setShowRedactionWarning] = useState(false)
  const [warningDismissed] = useKV<boolean>('redaction-warning-dismissed', false)
  const { currentPage } = usePDF()
  const {
    activeTool,
    setActiveTool,
    toolSettings,
    updateToolSettings,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelectedAnnotation,
    selectedAnnotationId,
    addAnnotation,
  } = useAnnotations()

  if (!isOpen) return null

  const handleRedactionClick = () => {
    if (warningDismissed) {
      setActiveTool('redaction')
    } else {
      setShowRedactionWarning(true)
    }
  }

  const handleRedactionWarningConfirm = () => {
    setShowRedactionWarning(false)
    setActiveTool('redaction')
  }

  const handleRedactionWarningCancel = () => {
    setShowRedactionWarning(false)
  }

  const handleSignatureSelected = (imageData: string, width: number, height: number) => {
    addAnnotation({
      id: crypto.randomUUID(),
      type: 'signature',
      pageNum: currentPage,
      timestamp: Date.now(),
      position: { x: 100, y: 100 },
      imageData,
      width,
      height,
    })
  }

  const ToolButton = ({
    tool,
    icon: Icon,
    label,
  }: {
    tool: ToolType
    icon: React.ComponentType<{ className?: string; weight?: string }>
    label: string
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={activeTool === tool ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTool(tool)}
          className={cn(
            'h-9 w-9 p-0',
            activeTool === tool && 'bg-primary text-primary-foreground'
          )}
        >
          <Icon className="h-5 w-5" weight={activeTool === tool ? 'fill' : 'regular'} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )

  return (
    <TooltipProvider>
      <div className="border-b bg-card border-border px-4 py-2 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === null || activeTool === 'select' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTool(null)}
                className={cn(
                  'h-9 w-9 p-0',
                  (activeTool === null || activeTool === 'select') && 'bg-primary text-primary-foreground'
                )}
              >
                <TextT className="h-5 w-5" weight={(activeTool === null || activeTool === 'select') ? 'fill' : 'regular'} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Select Text (V)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={activeTool === 'highlight' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-9 gap-2',
                  activeTool === 'highlight' && 'bg-primary text-primary-foreground'
                )}
              >
                <Highlighter className="h-5 w-5" weight={activeTool === 'highlight' ? 'fill' : 'regular'} />
                <span className="text-sm">Highlight</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex gap-1">
                {Object.entries(HIGHLIGHT_COLORS).map(([name, color]) => (
                  <button
                    key={name}
                    className={cn(
                      'w-8 h-8 rounded border-2 transition-all',
                      toolSettings.color === color
                        ? 'border-primary scale-110'
                        : 'border-border hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setActiveTool('highlight')
                      updateToolSettings({ color })
                    }}
                    title={name}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={activeTool === 'pen' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-9 gap-2',
                  activeTool === 'pen' && 'bg-primary text-primary-foreground'
                )}
              >
                <PencilLine className="h-5 w-5" weight={activeTool === 'pen' ? 'fill' : 'regular'} />
                <span className="text-sm">Draw</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Color</p>
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(PEN_COLORS).map(([name, color]) => (
                      <button
                        key={name}
                        className={cn(
                          'w-7 h-7 rounded border-2 transition-all',
                          toolSettings.color === color
                            ? 'border-primary scale-110'
                            : 'border-border hover:scale-105'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setActiveTool('pen')
                          updateToolSettings({ color })
                        }}
                        title={name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Thickness</p>
                  <div className="flex gap-2">
                    {PEN_THICKNESSES.map((thickness) => (
                      <button
                        key={thickness}
                        className={cn(
                          'w-10 h-10 rounded border-2 flex items-center justify-center transition-all',
                          toolSettings.thickness === thickness
                            ? 'border-primary bg-accent'
                            : 'border-border hover:bg-accent/50'
                        )}
                        onClick={() => {
                          setActiveTool('pen')
                          updateToolSettings({ thickness })
                        }}
                      >
                        <div
                          className="rounded-full bg-foreground"
                          style={{ width: thickness * 2, height: thickness * 2 }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolButton tool="rectangle" icon={Rectangle} label="Rectangle" />
          <ToolButton tool="circle" icon={Circle} label="Circle" />
          <ToolButton tool="arrow" icon={ArrowRight} label="Arrow" />
          <ToolButton tool="line" icon={MinusCircle} label="Line" />

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolButton tool="text" icon={TextAa} label="Text Box" />
          <ToolButton tool="note" icon={Note} label="Sticky Note" />
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === 'redaction' ? 'default' : 'ghost'}
                size="sm"
                onClick={handleRedactionClick}
                className={cn(
                  'h-9 gap-2',
                  activeTool === 'redaction' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                )}
              >
                <Prohibit className="h-5 w-5" weight={activeTool === 'redaction' ? 'fill' : 'regular'} />
                <span className="text-sm">Redact</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redact Sensitive Information</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSignatureManagerOpen(true)}
                className="h-9 w-9 p-0"
              >
                <Signature className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Manage Signatures</TooltipContent>
          </Tooltip>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                className="h-9 w-9 p-0"
              >
                <ArrowCounterClockwise className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Cmd+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                className="h-9 w-9 p-0"
              >
                <ArrowClockwise className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Cmd+Shift+Z)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-2" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteSelectedAnnotation}
                disabled={!selectedAnnotationId}
                className="h-9 w-9 p-0"
              >
                <Trash className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Selected</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-2" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0">
                <X className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close Markup (Esc)</TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      <SignatureManager
        isOpen={isSignatureManagerOpen}
        onClose={() => setIsSignatureManagerOpen(false)}
        onSignatureSelected={handleSignatureSelected}
      />

      <RedactionWarningDialog
        isOpen={showRedactionWarning}
        onConfirm={handleRedactionWarningConfirm}
        onCancel={handleRedactionWarningCancel}
      />
    </TooltipProvider>
  )
}
