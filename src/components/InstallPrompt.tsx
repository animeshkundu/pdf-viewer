import { useState, useEffect } from 'react'
import { X, DownloadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useInstall } from '@/hooks/useInstall'
import { toast } from 'sonner'

export function InstallPrompt() {
  const { isInstallable, promptInstall, dismissPrompt } = useInstall()
  const [isDismissed, setIsDismissed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

    if (dismissed && daysSinceDismissed < 7) {
      setIsDismissed(true)
      return
    }

    if (isInstallable && !isDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isDismissed])

  const handleInstall = async () => {
    const result = await promptInstall()
    
    if (result.outcome === 'accepted') {
      toast.success('App installed successfully!')
      setShowPrompt(false)
    } else {
      toast.info('Installation cancelled')
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    dismissPrompt()
    setIsDismissed(true)
    setShowPrompt(false)
  }

  if (!showPrompt || isDismissed) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <DownloadSimple size={24} className="text-primary-foreground" weight="bold" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground mb-1">
              Install PDF Editor
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Install this app for quick access and offline use. Works like a native app on your device.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="button-press"
              >
                Install App
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="button-press"
              >
                Not Now
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground smooth-transition"
            aria-label="Close install prompt"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
