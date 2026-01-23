import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { OptionalContentConfig } from 'pdfjs-dist/types/src/display/optional_content_config'
import { usePDF } from './usePDF.tsx'
import { pdfMetadataService } from '@/services/pdf-metadata.service'
import type { OutlineItem, AttachmentItem, LayerItem } from '@/types/metadata.types'

interface PDFMetadataContextValue {
  outline: OutlineItem[]
  attachments: AttachmentItem[]
  layers: LayerItem[]
  optionalContentConfig: OptionalContentConfig | null
  reloadMetadata: () => Promise<void>
  setLayerVisibility: (layerId: string, visible: boolean) => void
}

const PDFMetadataContext = createContext<PDFMetadataContextValue | null>(null)

export function PDFMetadataProvider({ children }: { children: ReactNode }) {
  const { document } = usePDF()
  const [outline, setOutline] = useState<OutlineItem[]>([])
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [layers, setLayers] = useState<LayerItem[]>([])
  const [optionalContentConfig, setOptionalContentConfig] = useState<OptionalContentConfig | null>(null)

  const loadMetadata = async () => {
    if (!document) {
      setOutline([])
      setAttachments([])
      setLayers([])
      setOptionalContentConfig(null)
      return
    }

    const [outlineItems, attachmentItems, config] = await Promise.all([
      pdfMetadataService.getOutline(document),
      pdfMetadataService.getAttachments(document),
      pdfMetadataService.getOptionalContentConfig(document),
    ])

    setOutline(outlineItems)
    setAttachments(attachmentItems)
    setOptionalContentConfig(config)
    setLayers(pdfMetadataService.buildLayerTree(config))
  }

  useEffect(() => {
    void loadMetadata()
  }, [document])

  const setLayerVisibility = (layerId: string, visible: boolean) => {
    pdfMetadataService.applyLayerVisibility(optionalContentConfig, layerId, visible)
    setLayers(pdfMetadataService.buildLayerTree(optionalContentConfig))
  }

  return (
    <PDFMetadataContext.Provider
      value={{
        outline,
        attachments,
        layers,
        optionalContentConfig,
        reloadMetadata: loadMetadata,
        setLayerVisibility,
      }}
    >
      {children}
    </PDFMetadataContext.Provider>
  )
}

export function usePDFMetadata() {
  const context = useContext(PDFMetadataContext)
  if (!context) {
    throw new Error('usePDFMetadata must be used within PDFMetadataProvider')
  }
  return context
}
