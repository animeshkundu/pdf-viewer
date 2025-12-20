import { createContext, useContext, useState, ReactNode } from 'react'
import type { Watermark } from '../types/watermark.types'

interface WatermarkContextValue {
  watermark: Watermark | null
  setWatermark: (watermark: Watermark) => void
  removeWatermark: () => void
  hasWatermark: boolean
}

const WatermarkContext = createContext<WatermarkContextValue | null>(null)

interface WatermarkProviderProps {
  children: ReactNode
}

export function WatermarkProvider({ children }: WatermarkProviderProps) {
  const [watermark, setWatermarkState] = useState<Watermark | null>(null)

  const setWatermark = (newWatermark: Watermark) => {
    setWatermarkState(newWatermark)
  }

  const removeWatermark = () => {
    setWatermarkState(null)
  }

  const hasWatermark = watermark !== null

  return (
    <WatermarkContext.Provider
      value={{
        watermark,
        setWatermark,
        removeWatermark,
        hasWatermark
      }}
    >
      {children}
    </WatermarkContext.Provider>
  )
}

export function useWatermark() {
  const context = useContext(WatermarkContext)
  if (!context) {
    throw new Error('useWatermark must be used within WatermarkProvider')
  }
  return context
}
