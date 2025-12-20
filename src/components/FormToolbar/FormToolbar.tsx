import { Button } from '@/components/ui/button'
import { useForm } from '@/hooks/useForm'
import { 
  TextT, 
  ArrowClockwise, 
  CheckCircle,
  WarningCircle 
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface FormToolbarProps {
  isOpen: boolean
  onClose: () => void
}

export function FormToolbar({ isOpen, onClose }: FormToolbarProps) {
  const { hasForm, isFormMode, setIsFormMode, resetAllFields, hasUnsavedChanges, fields } = useForm()

  if (!hasForm) {
    return null
  }

  const handleToggleFormMode = () => {
    setIsFormMode(!isFormMode)
    if (!isFormMode) {
      onClose()
    }
  }

  const handleResetAll = () => {
    if (confirm('Reset all form fields to their default values?')) {
      resetAllFields()
    }
  }

  return (
    <div
      className={cn(
        'absolute top-16 left-0 right-0 z-30',
        'bg-card border-b border-border shadow-lg',
        'transition-all duration-200 ease-in-out',
        isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isFormMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggleFormMode}
                  className="gap-2"
                >
                  <TextT weight={isFormMode ? 'fill' : 'regular'} />
                  <span>Fill Form</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle form filling mode (F)</p>
              </TooltipContent>
            </Tooltip>

            {isFormMode && (
              <>
                <div className="h-6 w-px bg-border" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetAll}
                      disabled={!hasUnsavedChanges}
                      className="gap-2"
                    >
                      <ArrowClockwise />
                      <span>Reset All</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset all fields to default values</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="text-ocean-blue" />
              <span>{fields.length} field{fields.length !== 1 ? 's' : ''} detected</span>
            </div>

            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <WarningCircle weight="fill" />
                <span>Unsaved changes</span>
              </div>
            )}
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}
