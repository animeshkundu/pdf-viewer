/**
 * Types for advanced PDF tools: compression and comparison
 */

// ============================================================
// Image Compression Types
// ============================================================

export interface CompressionOptions {
  quality: number // 0-1 (0.1 = 10%, 1 = 100%)
  maxWidth?: number
  maxHeight?: number
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp'
  convertToJpeg?: boolean // Convert PNG to JPEG for better compression
}

export interface CompressionResult {
  originalSize: number
  compressedSize: number
  compressionRatio: number // e.g., 0.3 means 30% of original size
  blob: Blob
  width: number
  height: number
}

export interface CompressionProgress {
  stage: 'loading' | 'compressing' | 'complete'
  progress: number // 0-100
  message: string
  currentFile?: number
  totalFiles?: number
}

export interface BatchCompressionResult {
  results: CompressionResult[]
  totalOriginalSize: number
  totalCompressedSize: number
  overallRatio: number
}

// ============================================================
// PDF Comparison Types
// ============================================================

export interface ComparisonOptions {
  threshold?: number // 0-1, sensitivity for pixel differences (default: 0.1)
  includeAntiAliasing?: boolean // Whether to include anti-aliased pixels in diff
  diffColor?: [number, number, number] // RGB color for difference highlighting
  scale?: number // Render scale for comparison (default: 1.5)
}

export interface ComparisonResult {
  diffPixels: number
  totalPixels: number
  percentDifferent: number
  diffCanvas: HTMLCanvasElement
  pdf1Canvas: HTMLCanvasElement
  pdf2Canvas: HTMLCanvasElement
  width: number
  height: number
}

export interface ComparisonProgress {
  stage: 'loading' | 'rendering' | 'comparing' | 'complete'
  progress: number // 0-100
  message: string
}

export interface PDFComparisonFile {
  id: string
  file: File
  name: string
  pageCount: number
  bytes?: ArrayBuffer
}

// ============================================================
// Advanced Tools Progress Types
// ============================================================

export type AdvancedToolsProgress = CompressionProgress | ComparisonProgress

export interface AdvancedToolsState {
  isProcessing: boolean
  progress: AdvancedToolsProgress | null
}
