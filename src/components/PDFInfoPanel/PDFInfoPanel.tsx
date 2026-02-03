import { useEffect, useState } from 'react'
import { usePDF } from '@/hooks/usePDF.tsx'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Info, FileText, User, Calendar, Tag, Wrench, Clock } from '@phosphor-icons/react'

interface PDFInfo {
  Title?: string
  Author?: string
  Subject?: string
  Keywords?: string
  Creator?: string
  Producer?: string
  CreationDate?: string
  ModDate?: string
  PDFFormatVersion?: string
  IsLinearized?: boolean
  IsAcroFormPresent?: boolean
  IsXFAPresent?: boolean
  IsCollectionPresent?: boolean
  IsSignaturesPresent?: boolean
  [key: string]: unknown
}

interface PDFInfoPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface InfoRowProps {
  icon?: React.ReactNode
  label: string
  value: string | null | undefined
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  if (!value) return null

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-b-0">
      {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm text-foreground break-words">{value}</p>
      </div>
    </div>
  )
}

function formatDate(dateString: string | undefined): string | null {
  if (!dateString) return null

  // PDF date format: D:YYYYMMDDHHmmSSOHH'mm'
  const pdfDateRegex = /D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/
  const match = dateString.match(pdfDateRegex)

  if (match) {
    const [, year, month, day, hour = '00', minute = '00', second = '00'] = match
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    )
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Try parsing as ISO date
  try {
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  } catch {
    // Ignore parsing errors
  }

  return dateString
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return 'Unknown'

  const units = ['B', 'KB', 'MB', 'GB']
  let unitIndex = 0
  let size = bytes

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(unitIndex > 0 ? 2 : 0)} ${units[unitIndex]}`
}

export function PDFInfoPanel({ isOpen, onClose }: PDFInfoPanelProps) {
  const { document, file } = usePDF()
  const [info, setInfo] = useState<PDFInfo>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load metadata when document changes
  useEffect(() => {
    if (!document) {
      setInfo({})
      return
    }

    const loadMetadata = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const metadataObj = await document.getMetadata()
        // The info object contains the PDF metadata we need
        const infoObj = metadataObj.info as PDFInfo
        setInfo(infoObj || {})
      } catch (err) {
        console.error('Failed to load metadata:', err)
        setError('Failed to load document information')
      } finally {
        setIsLoading(false)
      }
    }

    loadMetadata()
  }, [document])

  const totalPages = document?.numPages ?? 0
  const fileSize = file?.size ?? null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        <SheetHeader className="px-4 py-4 border-b border-border/60">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Info size={20} weight="bold" />
            Document Info
          </SheetTitle>
          <SheetDescription className="text-xs">
            View PDF metadata and properties
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {!isLoading && !error && document && (
              <div className="space-y-1">
                {/* Document section */}
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Document
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <InfoRow
                      icon={<FileText size={16} />}
                      label="Title"
                      value={info.Title || file?.name || 'Untitled'}
                    />
                    <InfoRow
                      icon={<FileText size={16} />}
                      label="Subject"
                      value={info.Subject}
                    />
                    <InfoRow
                      icon={<Tag size={16} />}
                      label="Keywords"
                      value={info.Keywords}
                    />
                  </div>
                </div>

                {/* Author section */}
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Author
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <InfoRow
                      icon={<User size={16} />}
                      label="Author"
                      value={info.Author}
                    />
                    <InfoRow
                      icon={<Wrench size={16} />}
                      label="Creator"
                      value={info.Creator}
                    />
                    <InfoRow
                      icon={<Wrench size={16} />}
                      label="Producer"
                      value={info.Producer}
                    />
                  </div>
                </div>

                {/* Dates section */}
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Dates
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <InfoRow
                      icon={<Calendar size={16} />}
                      label="Created"
                      value={formatDate(info.CreationDate)}
                    />
                    <InfoRow
                      icon={<Clock size={16} />}
                      label="Modified"
                      value={formatDate(info.ModDate)}
                    />
                  </div>
                </div>

                {/* File section */}
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    File Properties
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <InfoRow
                      icon={<FileText size={16} />}
                      label="Pages"
                      value={totalPages.toString()}
                    />
                    <InfoRow
                      icon={<FileText size={16} />}
                      label="File Size"
                      value={formatFileSize(fileSize)}
                    />
                    <InfoRow
                      icon={<FileText size={16} />}
                      label="PDF Version"
                      value={info.PDFFormatVersion}
                    />
                  </div>
                </div>

                {/* Features section */}
                {(info.IsAcroFormPresent || info.IsXFAPresent || info.IsSignaturesPresent) && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Features
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-3">
                      {info.IsAcroFormPresent && (
                        <div className="flex items-center gap-2 py-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-sm text-foreground">Contains Forms</span>
                        </div>
                      )}
                      {info.IsXFAPresent && (
                        <div className="flex items-center gap-2 py-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-sm text-foreground">Contains XFA Forms</span>
                        </div>
                      )}
                      {info.IsSignaturesPresent && (
                        <div className="flex items-center gap-2 py-1">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="text-sm text-foreground">Contains Signatures</span>
                        </div>
                      )}
                      {info.IsLinearized && (
                        <div className="flex items-center gap-2 py-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="text-sm text-foreground">Fast Web View Enabled</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isLoading && !error && !document && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText size={40} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">
                  No document loaded
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Open a PDF to view its information
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
