/**
 * Types for PDF security features: encryption, sanitization, and redaction
 */

/**
 * Progress reporting for security operations
 */
export interface SecurityProgress {
  stage: 'loading' | 'processing' | 'saving' | 'complete'
  progress: number // 0-100
  message: string
}

/**
 * Encryption options for password-protecting PDFs
 * Note: pdf-lib doesn't support encryption natively, so this is a placeholder
 */
export interface EncryptionOptions {
  userPassword: string
  ownerPassword?: string
  permissions?: PDFPermissions
}

/**
 * PDF permissions that can be restricted with encryption
 */
export interface PDFPermissions {
  printing: 'none' | 'lowResolution' | 'highResolution'
  modifying: boolean
  copying: boolean
  annotating: boolean
  fillingForms: boolean
  contentAccessibility: boolean
  documentAssembly: boolean
}

/**
 * Default permissions (most restrictive)
 */
export const DEFAULT_PERMISSIONS: PDFPermissions = {
  printing: 'none',
  modifying: false,
  copying: false,
  annotating: false,
  fillingForms: false,
  contentAccessibility: true,
  documentAssembly: false,
}

/**
 * Metadata fields that can be sanitized from a PDF
 */
export interface PDFMetadata {
  title?: string
  author?: string
  subject?: string
  keywords?: string[]
  producer?: string
  creator?: string
  creationDate?: Date
  modificationDate?: Date
}

/**
 * Options for sanitizing PDF metadata
 */
export interface SanitizeOptions {
  removeTitle: boolean
  removeAuthor: boolean
  removeSubject: boolean
  removeKeywords: boolean
  removeProducer: boolean
  removeCreator: boolean
  removeDates: boolean
  removeCustomMetadata: boolean
}

/**
 * Default sanitize options (remove all metadata)
 */
export const DEFAULT_SANITIZE_OPTIONS: SanitizeOptions = {
  removeTitle: true,
  removeAuthor: true,
  removeSubject: true,
  removeKeywords: true,
  removeProducer: true,
  removeCreator: true,
  removeDates: true,
  removeCustomMetadata: true,
}

/**
 * Types of sensitive data patterns that can be detected
 */
export type SensitiveDataType = 'ssn' | 'creditCard' | 'email' | 'phone'

/**
 * Pattern definition for sensitive data detection
 */
export interface SensitivePattern {
  type: SensitiveDataType
  label: string
  description: string
  pattern: RegExp
  enabled: boolean
}

/**
 * Built-in patterns for sensitive data detection
 */
export const SENSITIVE_PATTERNS: Record<SensitiveDataType, Omit<SensitivePattern, 'enabled'>> = {
  ssn: {
    type: 'ssn',
    label: 'Social Security Number',
    description: 'US Social Security Numbers (XXX-XX-XXXX format)',
    pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  },
  creditCard: {
    type: 'creditCard',
    label: 'Credit Card Number',
    description: 'Visa and Mastercard numbers',
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b/g,
  },
  email: {
    type: 'email',
    label: 'Email Address',
    description: 'Email addresses',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },
  phone: {
    type: 'phone',
    label: 'Phone Number',
    description: 'US phone numbers',
    pattern: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
  },
}

/**
 * Result of scanning text for sensitive data
 */
export interface ScanResult {
  type: SensitiveDataType
  matches: ScanMatch[]
}

/**
 * A single match found during sensitive data scanning
 */
export interface ScanMatch {
  value: string
  index: number
  length: number
  pageNumber?: number
}

/**
 * Options for auto-redaction
 */
export interface RedactOptions {
  patterns: SensitiveDataType[]
  customPatterns?: RegExp[]
  redactionStyle: 'blackBox' | 'whiteBox' | 'strikethrough'
  includeAnnotation?: boolean // Add annotation with redaction reason
}

/**
 * Result of a sanitization operation
 */
export interface SanitizeResult {
  blob: Blob
  removedMetadata: Partial<PDFMetadata>
  success: boolean
}

/**
 * Result of a scan operation
 */
export interface ScanSummary {
  totalMatches: number
  matchesByType: Record<SensitiveDataType, number>
  scannedPages: number
}

/**
 * Security operation types
 */
export type SecurityOperation =
  | { type: 'encrypt'; options: EncryptionOptions }
  | { type: 'sanitize'; options: SanitizeOptions }
  | { type: 'scan'; patterns: SensitiveDataType[] }
  | { type: 'redact'; options: RedactOptions }
