import { WifiSlash, WifiHigh } from '@phosphor-icons/react'
import { useOffline } from '@/hooks/useOffline'

export function OfflineIndicator() {
  const { isOffline, wasOffline } = useOffline()

  if (!isOffline && !wasOffline) {
    return null
  }

  return (
    <div
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top-5 duration-300 ${
        isOffline
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-green-600 text-white'
      }`}
      role="status"
      aria-live="polite"
    >
      {isOffline ? (
        <>
          <WifiSlash size={18} weight="bold" />
          <span>You're offline</span>
        </>
      ) : (
        <>
          <WifiHigh size={18} weight="bold" />
          <span>Back online</span>
        </>
      )}
    </div>
  )
}
