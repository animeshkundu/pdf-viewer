import { useEffect, useState, useCallback } from 'react'

export function useUnsavedChanges() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const markAsModified = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false)
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  return {
    hasUnsavedChanges,
    markAsModified,
    markAsSaved,
  }
}
