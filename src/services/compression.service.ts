import Compressor from 'compressorjs'
import type {
  CompressionOptions,
  CompressionResult,
  CompressionProgress,
  BatchCompressionResult,
} from '@/types/advanced-tools.types'

export class CompressionService {
  private static instance: CompressionService
  private progressCallback?: (progress: CompressionProgress) => void

  private constructor() {}

  static getInstance(): CompressionService {
    if (!CompressionService.instance) {
      CompressionService.instance = new CompressionService()
    }
    return CompressionService.instance
  }

  setProgressCallback(callback: (progress: CompressionProgress) => void): void {
    this.progressCallback = callback
  }

  private updateProgress(
    stage: CompressionProgress['stage'],
    progress: number,
    message: string,
    currentFile?: number,
    totalFiles?: number
  ): void {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message, currentFile, totalFiles })
    }
  }

  /**
   * Compress an image file using compressorjs
   * Wraps the callback-based API in a Promise
   */
  async compressImage(file: File, options: CompressionOptions): Promise<CompressionResult> {
    this.updateProgress('loading', 0, 'Loading image...')

    const originalSize = file.size

    return new Promise((resolve, reject) => {
      this.updateProgress('compressing', 30, 'Compressing image...')

      new Compressor(file, {
        quality: options.quality,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight,
        mimeType: options.convertToJpeg ? 'image/jpeg' : options.mimeType,
        convertTypes: options.convertToJpeg ? ['image/png', 'image/webp'] : undefined,
        convertSize: options.convertToJpeg ? 0 : undefined, // Convert all if enabled
        success: (compressedBlob: Blob) => {
          this.updateProgress('compressing', 70, 'Processing result...')

          // Get dimensions from the compressed image
          const img = new Image()
          const url = URL.createObjectURL(compressedBlob)

          img.onload = () => {
            URL.revokeObjectURL(url)

            const result: CompressionResult = {
              originalSize,
              compressedSize: compressedBlob.size,
              compressionRatio: compressedBlob.size / originalSize,
              blob: compressedBlob,
              width: img.naturalWidth,
              height: img.naturalHeight,
            }

            this.updateProgress('complete', 100, 'Compression complete!')
            resolve(result)
          }

          img.onerror = () => {
            URL.revokeObjectURL(url)
            // Even if we can't read dimensions, return the result
            const result: CompressionResult = {
              originalSize,
              compressedSize: compressedBlob.size,
              compressionRatio: compressedBlob.size / originalSize,
              blob: compressedBlob,
              width: 0,
              height: 0,
            }

            this.updateProgress('complete', 100, 'Compression complete!')
            resolve(result)
          }

          img.src = url
        },
        error: (err: Error) => {
          reject(new Error(`Compression failed: ${err.message}`))
        },
      })
    })
  }

  /**
   * Compress multiple images in batch
   */
  async compressImages(
    files: File[],
    options: CompressionOptions
  ): Promise<BatchCompressionResult> {
    if (files.length === 0) {
      throw new Error('No files to compress')
    }

    const results: CompressionResult[] = []
    let totalOriginalSize = 0
    let totalCompressedSize = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      this.updateProgress(
        'compressing',
        Math.round(((i + 1) / files.length) * 100),
        `Compressing ${file.name}...`,
        i + 1,
        files.length
      )

      const result = await this.compressImage(file, options)
      results.push(result)
      totalOriginalSize += result.originalSize
      totalCompressedSize += result.compressedSize
    }

    this.updateProgress('complete', 100, 'All images compressed!')

    return {
      results,
      totalOriginalSize,
      totalCompressedSize,
      overallRatio: totalCompressedSize / totalOriginalSize,
    }
  }

  /**
   * Preview compression result without fully processing
   * Useful for showing estimated savings before actual compression
   */
  async previewCompression(
    file: File,
    quality: number
  ): Promise<{ estimatedSize: number; estimatedRatio: number }> {
    // For preview, we use a quick low-resolution compression to estimate
    const result = await this.compressImage(file, {
      quality,
      maxWidth: 1920, // Limit size for quick preview
      maxHeight: 1920,
    })

    return {
      estimatedSize: result.compressedSize,
      estimatedRatio: result.compressionRatio,
    }
  }

  /**
   * Convert a Blob to a File object
   */
  blobToFile(blob: Blob, filename: string): File {
    return new File([blob], filename, { type: blob.type })
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`
  }

  /**
   * Calculate compression savings percentage
   */
  calculateSavings(original: number, compressed: number): number {
    if (original === 0) return 0
    return Math.round((1 - compressed / original) * 100)
  }

  /**
   * Check if a file is a compressible image type
   */
  isCompressibleImage(file: File): boolean {
    const compressibleTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/bmp',
    ]
    return compressibleTypes.includes(file.type)
  }

  /**
   * Get recommended quality based on file size
   * Larger files benefit from more compression
   */
  getRecommendedQuality(fileSize: number): number {
    if (fileSize > 5 * 1024 * 1024) return 0.6 // > 5MB
    if (fileSize > 2 * 1024 * 1024) return 0.7 // > 2MB
    if (fileSize > 1 * 1024 * 1024) return 0.8 // > 1MB
    return 0.85 // Smaller files
  }
}

export const compressionService = CompressionService.getInstance()
