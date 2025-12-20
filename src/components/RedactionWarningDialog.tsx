import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useKV } from '@github/spark/hooks'
import { Warning, Eye, EyeSlash, FileText } from '@phosphor-icons/react'

interface RedactionWarningDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function RedactionWarningDialog({
  isOpen,
  onConfirm,
  onCancel,
}: RedactionWarningDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useKV<boolean>('redaction-warning-dismissed', false)

  const handleConfirm = () => {
    onConfirm()
  }

  const handleDontShowAgain = () => {
    setDontShowAgain(() => true)
    onConfirm()
  }

  if (dontShowAgain && !isOpen) {
    return null
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-destructive/10">
              <Warning size={28} weight="duotone" className="text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl">Important: About Redaction</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-4 mt-4">
            <p className="text-foreground font-medium">
              You are about to use the Redaction tool. Please understand how it works:
            </p>

            <div className="space-y-3 border-l-4 border-destructive/30 pl-4">
              <div className="flex gap-3">
                <div className="mt-1">
                  <EyeSlash size={20} weight="duotone" className="text-destructive" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">What Redaction Does:</p>
                  <p className="text-sm text-muted-foreground">
                    Draws solid black boxes over sensitive information. The redacted content will
                    appear permanently blacked out in the exported PDF.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1">
                  <Eye size={20} weight="duotone" className="text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Important Limitation:</p>
                  <p className="text-sm text-muted-foreground">
                    This tool <strong>covers</strong> content with black boxes but does{' '}
                    <strong>NOT completely remove</strong> the underlying text from the PDF file
                    structure. Advanced forensic tools might still extract the original content.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1">
                  <FileText size={20} weight="duotone" className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">For True Security:</p>
                  <p className="text-sm text-muted-foreground">
                    If you need to permanently remove sensitive data, use professional-grade
                    redaction tools like Adobe Acrobat Pro or specialized security software.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <p className="text-sm text-foreground">
                <strong>Best Practice:</strong> For maximum security when sharing documents with
                redacted content, consider converting the final PDF to images, then creating a new
                PDF from those images.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel} className="sm:flex-1">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="sm:flex-1 bg-primary hover:bg-primary/90"
          >
            I Understand, Continue
          </AlertDialogAction>
          <button
            onClick={handleDontShowAgain}
            className="sm:flex-1 inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Don't Show Again
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
