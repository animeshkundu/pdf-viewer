import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SecurityService } from '../security.service'
import { PDFDocument } from 'pdf-lib'
import type { SanitizeOptions, SensitiveDataType } from '@/types/security.types'
import { DEFAULT_SANITIZE_OPTIONS } from '@/types/security.types'

// Mock file-saver to avoid browser-specific API issues in tests
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}))

describe('SecurityService', () => {
  let service: SecurityService

  // Helper to create a test PDF with metadata
  async function createTestPDFWithMetadata(): Promise<ArrayBuffer> {
    const pdfDoc = await PDFDocument.create()
    pdfDoc.setTitle('Test Document')
    pdfDoc.setAuthor('John Doe')
    pdfDoc.setSubject('Testing')
    pdfDoc.setKeywords(['test', 'pdf', 'security'])
    pdfDoc.setProducer('Test Producer')
    pdfDoc.setCreator('Test Creator')
    pdfDoc.setCreationDate(new Date('2024-01-01'))
    pdfDoc.setModificationDate(new Date('2024-01-15'))

    const page = pdfDoc.addPage([612, 792])
    page.drawText('Test content', { x: 50, y: 700, size: 24 })

    const bytes = await pdfDoc.save()
    return bytes.buffer as ArrayBuffer
  }

  // Helper to create a PDF without metadata
  async function createTestPDFWithoutMetadata(): Promise<ArrayBuffer> {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792])
    page.drawText('Test content', { x: 50, y: 700, size: 24 })

    const bytes = await pdfDoc.save()
    return bytes.buffer as ArrayBuffer
  }

  beforeEach(() => {
    service = SecurityService.getInstance()
  })

  describe('getMetadata', () => {
    it('should return metadata from a PDF with metadata', async () => {
      const pdfBuffer = await createTestPDFWithMetadata()
      const metadata = await service.getMetadata(pdfBuffer)

      expect(metadata.title).toBe('Test Document')
      expect(metadata.author).toBe('John Doe')
      expect(metadata.subject).toBe('Testing')
      // pdf-lib stores keywords as space-separated string
      expect(metadata.keywords).toBeDefined()
      expect(metadata.keywords?.length).toBeGreaterThan(0)
      // Note: pdf-lib overwrites producer when saving the document
      expect(metadata.producer).toBeDefined()
      expect(metadata.creator).toBe('Test Creator')
      expect(metadata.creationDate).toBeInstanceOf(Date)
      expect(metadata.modificationDate).toBeInstanceOf(Date)
    })

    it('should return undefined for empty metadata fields', async () => {
      const pdfBuffer = await createTestPDFWithoutMetadata()
      const metadata = await service.getMetadata(pdfBuffer)

      expect(metadata.title).toBeUndefined()
      expect(metadata.author).toBeUndefined()
      expect(metadata.subject).toBeUndefined()
    })
  })

  describe('sanitizePDF', () => {
    it('should remove all metadata when using default options', async () => {
      const pdfBuffer = await createTestPDFWithMetadata()

      const result = await service.sanitizePDF(pdfBuffer, DEFAULT_SANITIZE_OPTIONS)

      expect(result.success).toBe(true)
      expect(result.blob).toBeInstanceOf(Blob)

      // Verify metadata was removed
      const sanitizedBytes = await result.blob.arrayBuffer()
      const metadata = await service.getMetadata(sanitizedBytes)

      // Empty strings should be treated as undefined by getMetadata
      expect(metadata.title).toBeFalsy()
      expect(metadata.author).toBeFalsy()
      expect(metadata.subject).toBeFalsy()
      // Note: pdf-lib always sets its own producer when saving, so we check it was modified
      // producer and creator fields get reset by pdf-lib on save
    })

    it('should track removed metadata', async () => {
      const pdfBuffer = await createTestPDFWithMetadata()

      const result = await service.sanitizePDF(pdfBuffer, DEFAULT_SANITIZE_OPTIONS)

      expect(result.removedMetadata.title).toBe('Test Document')
      expect(result.removedMetadata.author).toBe('John Doe')
      expect(result.removedMetadata.subject).toBe('Testing')
      // pdf-lib stores keywords as space-separated string
      expect(result.removedMetadata.keywords).toBeDefined()
      expect(result.removedMetadata.keywords?.length).toBeGreaterThan(0)
    })

    it('should only remove selected metadata fields', async () => {
      const pdfBuffer = await createTestPDFWithMetadata()
      const options: SanitizeOptions = {
        removeTitle: true,
        removeAuthor: true,
        removeSubject: false,
        removeKeywords: false,
        removeProducer: false,
        removeCreator: false,
        removeDates: false,
        removeCustomMetadata: false,
      }

      const result = await service.sanitizePDF(pdfBuffer, options)

      expect(result.success).toBe(true)
      expect(result.removedMetadata.title).toBe('Test Document')
      expect(result.removedMetadata.author).toBe('John Doe')
      expect(result.removedMetadata.subject).toBeUndefined()
      expect(result.removedMetadata.keywords).toBeUndefined()
    })

    it('should handle PDF without metadata gracefully', async () => {
      const pdfBuffer = await createTestPDFWithoutMetadata()

      const result = await service.sanitizePDF(pdfBuffer, DEFAULT_SANITIZE_OPTIONS)

      expect(result.success).toBe(true)
      expect(result.blob).toBeInstanceOf(Blob)
      // pdf-lib may set default producer/creator, so we just check title/author/subject were not present
      expect(result.removedMetadata.title).toBeUndefined()
      expect(result.removedMetadata.author).toBeUndefined()
      expect(result.removedMetadata.subject).toBeUndefined()
    })
  })

  describe('scanTextForSensitiveData', () => {
    describe('SSN detection', () => {
      it('should detect SSN in XXX-XX-XXXX format', () => {
        const text = 'My SSN is 123-45-6789'
        const results = service.scanTextForSensitiveData(text, ['ssn'])

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('ssn')
        expect(results[0].matches.length).toBe(1)
        expect(results[0].matches[0].value).toBe('123-45-6789')
      })

      it('should detect SSN with spaces', () => {
        const text = 'SSN: 123 45 6789'
        const results = service.scanTextForSensitiveData(text, ['ssn'])

        expect(results.length).toBe(1)
        expect(results[0].matches[0].value).toBe('123 45 6789')
      })

      it('should detect SSN without separators', () => {
        const text = 'SSN: 123456789'
        const results = service.scanTextForSensitiveData(text, ['ssn'])

        expect(results.length).toBe(1)
        expect(results[0].matches[0].value).toBe('123456789')
      })

      it('should detect multiple SSNs', () => {
        const text = 'SSN1: 123-45-6789, SSN2: 987-65-4321'
        const results = service.scanTextForSensitiveData(text, ['ssn'])

        expect(results.length).toBe(1)
        expect(results[0].matches.length).toBe(2)
      })
    })

    describe('Credit Card detection', () => {
      it('should detect Visa card numbers (16 digits)', () => {
        const text = 'Card: 4111111111111111'
        const results = service.scanTextForSensitiveData(text, ['creditCard'])

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('creditCard')
        expect(results[0].matches[0].value).toBe('4111111111111111')
      })

      it('should detect Visa card numbers (13 digits)', () => {
        const text = 'Card: 4111111111111'
        const results = service.scanTextForSensitiveData(text, ['creditCard'])

        expect(results.length).toBe(1)
        expect(results[0].matches[0].value).toBe('4111111111111')
      })

      it('should detect Mastercard numbers', () => {
        const text = 'Card: 5500000000000004'
        const results = service.scanTextForSensitiveData(text, ['creditCard'])

        expect(results.length).toBe(1)
        expect(results[0].matches[0].value).toBe('5500000000000004')
      })
    })

    describe('Email detection', () => {
      it('should detect standard email addresses', () => {
        const text = 'Contact us at test@example.com'
        const results = service.scanTextForSensitiveData(text, ['email'])

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('email')
        expect(results[0].matches[0].value).toBe('test@example.com')
      })

      it('should detect email with subdomain', () => {
        const text = 'Email: user@mail.example.com'
        const results = service.scanTextForSensitiveData(text, ['email'])

        expect(results.length).toBe(1)
        expect(results[0].matches[0].value).toBe('user@mail.example.com')
      })

      it('should detect email with special characters', () => {
        const text = 'Email: john.doe+test@company.org'
        const results = service.scanTextForSensitiveData(text, ['email'])

        expect(results.length).toBe(1)
        expect(results[0].matches[0].value).toBe('john.doe+test@company.org')
      })

      it('should detect multiple emails', () => {
        const text = 'Contact: alice@example.com or bob@example.org'
        const results = service.scanTextForSensitiveData(text, ['email'])

        expect(results.length).toBe(1)
        expect(results[0].matches.length).toBe(2)
      })
    })

    describe('Phone number detection', () => {
      it('should detect phone numbers with dashes', () => {
        const text = 'Call 555-123-4567'
        const results = service.scanTextForSensitiveData(text, ['phone'])

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('phone')
        expect(results[0].matches[0].value).toBe('555-123-4567')
      })

      it('should detect phone numbers with parentheses', () => {
        const text = 'Call (555) 123-4567'
        const results = service.scanTextForSensitiveData(text, ['phone'])

        expect(results.length).toBe(1)
        // Pattern captures the number portion including closing paren
        expect(results[0].matches[0].value).toContain('555')
        expect(results[0].matches[0].value).toContain('123')
        expect(results[0].matches[0].value).toContain('4567')
      })

      it('should detect phone numbers with country code', () => {
        const text = 'Call +1-555-123-4567'
        const results = service.scanTextForSensitiveData(text, ['phone'])

        expect(results.length).toBe(1)
        // Pattern may not capture the leading + but should capture the number
        expect(results[0].matches[0].value).toContain('555')
        expect(results[0].matches[0].value).toContain('123')
        expect(results[0].matches[0].value).toContain('4567')
      })

      it('should detect phone numbers with dots', () => {
        const text = 'Phone: 555.123.4567'
        const results = service.scanTextForSensitiveData(text, ['phone'])

        expect(results.length).toBe(1)
        expect(results[0].matches[0].value).toBe('555.123.4567')
      })
    })

    describe('Multiple pattern types', () => {
      it('should detect multiple pattern types simultaneously', () => {
        const text =
          'SSN: 123-45-6789, Email: test@example.com, Phone: 555-123-4567'
        const results = service.scanTextForSensitiveData(text, [
          'ssn',
          'email',
          'phone',
        ])

        expect(results.length).toBe(3)

        const ssnResult = results.find((r) => r.type === 'ssn')
        const emailResult = results.find((r) => r.type === 'email')
        const phoneResult = results.find((r) => r.type === 'phone')

        expect(ssnResult?.matches[0].value).toBe('123-45-6789')
        expect(emailResult?.matches[0].value).toBe('test@example.com')
        expect(phoneResult?.matches[0].value).toBe('555-123-4567')
      })

      it('should return empty results for no matches', () => {
        const text = 'This text has no sensitive data'
        const results = service.scanTextForSensitiveData(text, [
          'ssn',
          'email',
          'phone',
          'creditCard',
        ])

        expect(results.length).toBe(0)
      })
    })

    it('should include page number when provided', () => {
      const text = 'SSN: 123-45-6789'
      const results = service.scanTextForSensitiveData(text, ['ssn'], 5)

      expect(results[0].matches[0].pageNumber).toBe(5)
    })
  })

  describe('scanPagesForSensitiveData', () => {
    it('should scan multiple pages and aggregate results', () => {
      const pageTexts = [
        { pageNumber: 1, text: 'Page 1: SSN 123-45-6789' },
        { pageNumber: 2, text: 'Page 2: Email test@example.com' },
        { pageNumber: 3, text: 'Page 3: Phone 555-123-4567' },
      ]

      const { results, summary } = service.scanPagesForSensitiveData(pageTexts, [
        'ssn',
        'email',
        'phone',
      ])

      expect(results.length).toBe(3)
      expect(summary.totalMatches).toBe(3)
      expect(summary.scannedPages).toBe(3)
      expect(summary.matchesByType.ssn).toBe(1)
      expect(summary.matchesByType.email).toBe(1)
      expect(summary.matchesByType.phone).toBe(1)
    })

    it('should aggregate matches of same type from different pages', () => {
      const pageTexts = [
        { pageNumber: 1, text: 'SSN: 123-45-6789' },
        { pageNumber: 2, text: 'Another SSN: 987-65-4321' },
      ]

      const { results, summary } = service.scanPagesForSensitiveData(pageTexts, [
        'ssn',
      ])

      expect(results.length).toBe(1)
      expect(results[0].matches.length).toBe(2)
      expect(summary.totalMatches).toBe(2)
      expect(summary.matchesByType.ssn).toBe(2)
    })
  })

  describe('validatePattern', () => {
    it('should validate correct regex patterns', () => {
      const result = service.validatePattern('\\d{3}-\\d{2}-\\d{4}')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid regex patterns', () => {
      const result = service.validatePattern('[invalid')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should accept empty pattern', () => {
      const result = service.validatePattern('')
      expect(result.valid).toBe(true)
    })
  })

  describe('getAvailablePatterns', () => {
    it('should return all available patterns', () => {
      const patterns = service.getAvailablePatterns()

      expect(patterns.ssn).toBeDefined()
      expect(patterns.creditCard).toBeDefined()
      expect(patterns.email).toBeDefined()
      expect(patterns.phone).toBeDefined()
    })

    it('should have valid regex patterns', () => {
      const patterns = service.getAvailablePatterns()

      Object.values(patterns).forEach((pattern) => {
        expect(pattern.pattern).toBeInstanceOf(RegExp)
        expect(pattern.label).toBeDefined()
        expect(pattern.description).toBeDefined()
      })
    })
  })

  describe('isEncryptionSupported', () => {
    it('should return false (not supported in client-side)', () => {
      expect(service.isEncryptionSupported()).toBe(false)
    })
  })

  describe('getEncryptionSupportMessage', () => {
    it('should return a helpful message', () => {
      const message = service.getEncryptionSupportMessage()
      expect(message).toContain('server-side')
      expect(message.length).toBeGreaterThan(0)
    })
  })

  describe('progress callbacks', () => {
    it('should call progress callback during sanitization', async () => {
      const progressCallback = vi.fn()
      service.setProgressCallback(progressCallback)

      const pdfBuffer = await createTestPDFWithMetadata()
      await service.sanitizePDF(pdfBuffer, DEFAULT_SANITIZE_OPTIONS)

      expect(progressCallback).toHaveBeenCalled()
      const calls = progressCallback.mock.calls
      const stages = calls.map((call) => call[0].stage)
      expect(stages).toContain('loading')
      expect(stages).toContain('processing')
      expect(stages).toContain('saving')
      expect(stages).toContain('complete')
    })
  })

  describe('downloadBlob', () => {
    it('should call saveAs with correct blob and filename', async () => {
      const { saveAs } = await import('file-saver')

      const blob = new Blob(['test'], { type: 'application/pdf' })
      service.downloadBlob(blob, 'test.pdf')

      expect(saveAs).toHaveBeenCalledWith(blob, 'test.pdf')
    })
  })
})
