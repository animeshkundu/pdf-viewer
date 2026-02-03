/**
 * Types for format conversion operations (Images to PDF, PDF to Images, HTML to PDF, Markdown to PDF)
 */

export type PageSize = 'letter' | 'a4' | 'fit'
export type StandardPageSize = 'letter' | 'a4'
export type ImageFormat = 'png' | 'jpg'

export interface ImagesToPDFOptions {
  pageSize: PageSize
  margin: number // points (72 points = 1 inch)
}

export interface PDFToImagesOptions {
  format: ImageFormat
  scale: number // 1.0 = 100%, 2.0 = 200%
  pages?: number[] // if undefined, all pages
}

export interface HTMLToPDFOptions {
  pageSize: StandardPageSize
  margin: number // points
}

export interface MarkdownToPDFOptions {
  pageSize?: StandardPageSize
  margin?: number
}

export interface ImageFile {
  id: string
  file: File
  name: string
  preview: string // data URL for preview
  width: number
  height: number
  order: number
}

export interface ConversionProgress {
  stage: 'loading' | 'processing' | 'rendering' | 'saving' | 'complete'
  progress: number // 0-100
  message: string
  currentItem?: number
  totalItems?: number
}

export interface PDFToImagesResult {
  blobs: Blob[]
  filenames: string[]
}

export type ConversionOperation =
  | { type: 'imagesToPDF'; files: File[]; options: ImagesToPDFOptions }
  | { type: 'pdfToImages'; pdfBytes: ArrayBuffer; options: PDFToImagesOptions }
  | { type: 'htmlToPDF'; html: string; options: HTMLToPDFOptions }
  | { type: 'markdownToPDF'; markdown: string; options?: MarkdownToPDFOptions }
