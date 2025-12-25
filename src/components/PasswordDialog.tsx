import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, Warning } from '@phosphor-icons/react'

interface PasswordDialogProps {
  isOpen: boolean
  isIncorrectPassword: boolean
  onSubmit: (password: string) => void
  onCancel: () => void
}

export function PasswordDialog({
  isOpen,
  isIncorrectPassword,
  onSubmit,
  onCancel,
}: PasswordDialogProps) {
  const [password, setPassword] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setPassword('')
      // Focus the input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim()) {
      onSubmit(password)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent 
        className="max-w-md"
        aria-describedby="password-dialog-description"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={24} weight="duotone" className="text-primary" />
            Password Protected PDF
          </DialogTitle>
          <DialogDescription id="password-dialog-description">
            This PDF is password protected. Enter the password to open it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isIncorrectPassword && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <Warning size={20} weight="bold" />
              <span>Incorrect password. Please try again.</span>
            </div>
          )}

          <div className="space-y-2">
            <Input
              ref={inputRef}
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              aria-label="PDF password"
              aria-invalid={isIncorrectPassword}
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!password.trim()}
            >
              Unlock PDF
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
