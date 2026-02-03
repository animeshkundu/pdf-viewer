import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Lock,
  Eye,
  EyeSlash,
  Warning,
  Info,
} from '@phosphor-icons/react'
import { useSecurity } from '@/hooks/useSecurity'
import type { PDFPermissions } from '@/types/security.types'
import { DEFAULT_PERMISSIONS } from '@/types/security.types'

interface EncryptDialogProps {
  isOpen: boolean
  onClose: () => void
  pdfBytes: ArrayBuffer | null
  originalFilename?: string
}

export function EncryptDialog({
  isOpen,
  onClose,
  pdfBytes: _pdfBytes,
  originalFilename: _originalFilename,
}: EncryptDialogProps) {
  const { isEncryptionSupported, getEncryptionSupportMessage } = useSecurity()

  const [userPassword, setUserPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [showUserPassword, setShowUserPassword] = useState(false)
  const [showOwnerPassword, setShowOwnerPassword] = useState(false)
  const [useOwnerPassword, setUseOwnerPassword] = useState(false)
  const [permissions, setPermissions] = useState<PDFPermissions>(DEFAULT_PERMISSIONS)

  const encryptionSupported = isEncryptionSupported()
  const supportMessage = getEncryptionSupportMessage()

  const passwordsMatch = userPassword === confirmPassword
  const isValid = userPassword.length >= 4 && passwordsMatch

  const handlePermissionChange = (key: keyof PDFPermissions, value: boolean | string) => {
    setPermissions((prev) => ({ ...prev, [key]: value }))
  }

  const handleClose = () => {
    onClose()
    // Reset state
    setUserPassword('')
    setConfirmPassword('')
    setOwnerPassword('')
    setShowUserPassword(false)
    setShowOwnerPassword(false)
    setUseOwnerPassword(false)
    setPermissions(DEFAULT_PERMISSIONS)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Encrypt PDF
          </DialogTitle>
          <DialogDescription>
            Password protect your PDF document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!encryptionSupported ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <Warning className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" weight="fill" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Encryption Not Available
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {supportMessage}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" weight="fill" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Alternatives
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
                    <li>Use Adobe Acrobat or similar desktop software</li>
                    <li>Use operating system encryption (BitLocker, FileVault)</li>
                    <li>Use a secure file sharing service with encryption</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* User Password */}
              <div className="space-y-2">
                <Label htmlFor="userPassword">User Password (required to open)</Label>
                <div className="relative">
                  <Input
                    id="userPassword"
                    type={showUserPassword ? 'text' : 'password'}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showUserPassword ? (
                      <EyeSlash className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              {/* Owner Password */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useOwnerPassword"
                    checked={useOwnerPassword}
                    onCheckedChange={(checked) => setUseOwnerPassword(checked === true)}
                  />
                  <Label htmlFor="useOwnerPassword" className="text-sm font-normal cursor-pointer">
                    Set owner password (for advanced permissions)
                  </Label>
                </div>

                {useOwnerPassword && (
                  <div className="relative mt-2">
                    <Input
                      id="ownerPassword"
                      type={showOwnerPassword ? 'text' : 'password'}
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      placeholder="Owner password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showOwnerPassword ? (
                        <EyeSlash className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Permissions */}
              {useOwnerPassword && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Permissions</Label>
                  <div className="space-y-2 pl-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="printing"
                        checked={permissions.printing !== 'none'}
                        onCheckedChange={(checked) =>
                          handlePermissionChange('printing', checked ? 'highResolution' : 'none')
                        }
                      />
                      <Label htmlFor="printing" className="text-sm font-normal cursor-pointer">
                        Allow printing
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="copying"
                        checked={permissions.copying}
                        onCheckedChange={(checked) =>
                          handlePermissionChange('copying', checked === true)
                        }
                      />
                      <Label htmlFor="copying" className="text-sm font-normal cursor-pointer">
                        Allow copying text
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="modifying"
                        checked={permissions.modifying}
                        onCheckedChange={(checked) =>
                          handlePermissionChange('modifying', checked === true)
                        }
                      />
                      <Label htmlFor="modifying" className="text-sm font-normal cursor-pointer">
                        Allow modifying
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="annotating"
                        checked={permissions.annotating}
                        onCheckedChange={(checked) =>
                          handlePermissionChange('annotating', checked === true)
                        }
                      />
                      <Label htmlFor="annotating" className="text-sm font-normal cursor-pointer">
                        Allow annotating
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fillingForms"
                        checked={permissions.fillingForms}
                        onCheckedChange={(checked) =>
                          handlePermissionChange('fillingForms', checked === true)
                        }
                      />
                      <Label htmlFor="fillingForms" className="text-sm font-normal cursor-pointer">
                        Allow filling forms
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            {encryptionSupported ? 'Cancel' : 'Close'}
          </Button>
          {encryptionSupported && (
            <Button onClick={() => {}} disabled={!isValid}>
              <Lock className="w-4 h-4 mr-2" />
              Encrypt PDF
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
