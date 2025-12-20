import React, { createContext, useContext, useState, ReactNode } from 'react'
import type { PageNumberConfig } from '@/types/page-number.types'

interface PageNumberContextValue {
  pageNumberConfig: PageNumberConfig | null
  setPageNumberConfig: (config: PageNumberConfig) => void
  removePageNumberConfig: () => void
  hasPageNumbers: boolean
}

const PageNumberContext = createContext<PageNumberContextValue | undefined>(undefined)

export function PageNumberProvider({ children }: { children: ReactNode }) {
  const [pageNumberConfig, setPageNumberConfigState] = useState<PageNumberConfig | null>(null)
  
  const setPageNumberConfig = (config: PageNumberConfig) => {
    setPageNumberConfigState(config)
  }
  
  const removePageNumberConfig = () => {
    setPageNumberConfigState(null)
  }
  
  const hasPageNumbers = pageNumberConfig !== null && pageNumberConfig.enabled
  
  return (
    <PageNumberContext.Provider
      value={{
        pageNumberConfig,
        setPageNumberConfig,
        removePageNumberConfig,
        hasPageNumbers
      }}
    >
      {children}
    </PageNumberContext.Provider>
  )
}

export function usePageNumber() {
  const context = useContext(PageNumberContext)
  if (context === undefined) {
    throw new Error('usePageNumber must be used within a PageNumberProvider')
  }
  return context
}
