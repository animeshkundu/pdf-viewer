import { PDFDocument } from 'pdf-lib'
import { saveAs } from 'file-saver'
import type {
  SecurityProgress,
  SanitizeOptions,
  SanitizeResult,
  PDFMetadata,
  SensitiveDataType,
  ScanResult,
  ScanMatch,
  ScanSummary,
  SENSITIVE_PATTERNS,
} from '@/types/security.types'

// Import the patterns object
import { SENSITIVE_PATTERNS as patterns } from '@/types/security.types'

export class SecurityService {
  private static instance: SecurityService
  private progressCallback?: (progress: SecurityProgress) => void

  private constructor() {}

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService()
    }
    return SecurityService.instance
  }

  setProgressCallback(callback: (progress: SecurityProgress) => void): void {
    this.progressCallback = callback
  }

  private updateProgress(
    stage: SecurityProgress['stage'],
    progress: number,
    message: string
  ): void {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message })
    }
  }

  /**
   * Get metadata from a PDF document
   */
  async getMetadata(pdfBytes: ArrayBuffer): Promise<PDFMetadata> {
    const pdfDoc = await PDFDocument.load(pdfBytes)

    return {
      title: pdfDoc.getTitle() || undefined,
      author: pdfDoc.getAuthor() || undefined,
      subject: pdfDoc.getSubject() || undefined,
      keywords: pdfDoc.getKeywords()?.split(',').map(k => k.trim()).filter(Boolean) || undefined,
      producer: pdfDoc.getProducer() || undefined,
      creator: pdfDoc.getCreator() || undefined,
      creationDate: pdfDoc.getCreationDate() || undefined,
      modificationDate: pdfDoc.getModificationDate() || undefined,
    }
  }

  /**
   * Sanitize PDF by removing metadata
   */
  async sanitizePDF(
    pdfBytes: ArrayBuffer,
    options: SanitizeOptions
  ): Promise<SanitizeResult> {
    this.updateProgress('loading', 0, 'Loading PDF...')

    const pdfDoc = await PDFDocument.load(pdfBytes)
    const removedMetadata: Partial<PDFMetadata> = {}

    this.updateProgress('processing', 20, 'Reading current metadata...')

    // Store original metadata before removing
    if (options.removeTitle) {
      const title = pdfDoc.getTitle()
      if (title) {
        removedMetadata.title = title
      }
    }
    if (options.removeAuthor) {
      const author = pdfDoc.getAuthor()
      if (author) {
        removedMetadata.author = author
      }
    }
    if (options.removeSubject) {
      const subject = pdfDoc.getSubject()
      if (subject) {
        removedMetadata.subject = subject
      }
    }
    if (options.removeKeywords) {
      const keywords = pdfDoc.getKeywords()
      if (keywords) {
        removedMetadata.keywords = keywords.split(',').map(k => k.trim()).filter(Boolean)
      }
    }
    if (options.removeProducer) {
      const producer = pdfDoc.getProducer()
      if (producer) {
        removedMetadata.producer = producer
      }
    }
    if (options.removeCreator) {
      const creator = pdfDoc.getCreator()
      if (creator) {
        removedMetadata.creator = creator
      }
    }
    if (options.removeDates) {
      const creationDate = pdfDoc.getCreationDate()
      const modificationDate = pdfDoc.getModificationDate()
      if (creationDate) {
        removedMetadata.creationDate = creationDate
      }
      if (modificationDate) {
        removedMetadata.modificationDate = modificationDate
      }
    }

    this.updateProgress('processing', 50, 'Removing metadata...')

    // Remove metadata by setting empty values
    if (options.removeTitle) {
      pdfDoc.setTitle('')
    }
    if (options.removeAuthor) {
      pdfDoc.setAuthor('')
    }
    if (options.removeSubject) {
      pdfDoc.setSubject('')
    }
    if (options.removeKeywords) {
      pdfDoc.setKeywords([])
    }
    if (options.removeProducer) {
      pdfDoc.setProducer('')
    }
    if (options.removeCreator) {
      pdfDoc.setCreator('')
    }

    this.updateProgress('saving', 80, 'Saving sanitized PDF...')

    const savedBytes = await pdfDoc.save()
    const blob = new Blob([savedBytes], { type: 'application/pdf' })

    this.updateProgress('complete', 100, 'Sanitization complete!')

    return {
      blob,
      removedMetadata,
      success: true,
    }
  }

  /**
   * Scan text for sensitive data patterns
   */
  scanTextForSensitiveData(
    text: string,
    enabledPatterns: SensitiveDataType[],
    pageNumber?: number
  ): ScanResult[] {
    const results: ScanResult[] = []

    for (const patternType of enabledPatterns) {
      const patternDef = patterns[patternType]
      if (!patternDef) continue

      // Create a new regex to reset lastIndex
      const regex = new RegExp(patternDef.pattern.source, patternDef.pattern.flags)
      const matches: ScanMatch[] = []

      let match: RegExpExecArray | null
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          value: match[0],
          index: match.index,
          length: match[0].length,
          pageNumber,
        })
      }

      if (matches.length > 0) {
        results.push({
          type: patternType,
          matches,
        })
      }
    }

    return results
  }

  /**
   * Scan multiple pages and aggregate results
   */
  scanPagesForSensitiveData(
    pageTexts: { pageNumber: number; text: string }[],
    enabledPatterns: SensitiveDataType[]
  ): { results: ScanResult[]; summary: ScanSummary } {
    const allResults: ScanResult[] = []
    const matchesByType: Record<SensitiveDataType, number> = {
      ssn: 0,
      creditCard: 0,
      email: 0,
      phone: 0,
    }

    this.updateProgress('processing', 0, 'Scanning pages...')

    for (let i = 0; i < pageTexts.length; i++) {
      const { pageNumber, text } = pageTexts[i]

      this.updateProgress(
        'processing',
        Math.round(((i + 1) / pageTexts.length) * 90),
        `Scanning page ${pageNumber}...`
      )

      const pageResults = this.scanTextForSensitiveData(text, enabledPatterns, pageNumber)

      for (const result of pageResults) {
        // Merge with existing results for this type
        const existing = allResults.find(r => r.type === result.type)
        if (existing) {
          existing.matches.push(...result.matches)
        } else {
          allResults.push(result)
        }
        matchesByType[result.type] += result.matches.length
      }
    }

    const totalMatches = Object.values(matchesByType).reduce((sum, count) => sum + count, 0)

    this.updateProgress('complete', 100, `Scan complete! Found ${totalMatches} potential matches.`)

    return {
      results: allResults,
      summary: {
        totalMatches,
        matchesByType,
        scannedPages: pageTexts.length,
      },
    }
  }

  /**
   * Validate a custom regex pattern
   */
  validatePattern(pattern: string): { valid: boolean; error?: string } {
    try {
      new RegExp(pattern, 'g')
      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid regex pattern',
      }
    }
  }

  /**
   * Get all available sensitive data patterns
   */
  getAvailablePatterns(): typeof patterns {
    return patterns
  }

  /**
   * Check if encryption is supported
   * Note: pdf-lib doesn't support encryption natively
   */
  isEncryptionSupported(): boolean {
    return false
  }

  /**
   * Get encryption support message
   */
  getEncryptionSupportMessage(): string {
    return 'PDF encryption requires server-side processing and is not available in this client-side application. ' +
      'For security, consider using your operating system\'s built-in encryption or a dedicated PDF security tool.'
  }

  /**
   * Download a blob with a filename
   */
  downloadBlob(blob: Blob, filename: string): void {
    saveAs(blob, filename)
  }
}

export const securityService = SecurityService.getInstance()
