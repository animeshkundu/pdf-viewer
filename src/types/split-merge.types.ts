/**
 * Types for PDF split, merge, and extract operations
 */

export interface PageRange {
  start: number // 1-indexed
  end: number   // 1-indexed, inclusive
}

export type SplitMode =
  | { type: 'ranges'; ranges: PageRange[] }
  | { type: 'everyN'; n: number }
  | { type: 'extractPages'; pages: number[] }

export interface SplitOptions {
  mode: SplitMode
  outputFormat: 'separate' | 'zip'
  filenamePattern?: string // e.g., "{original}_{index}" or "{original}_pages_{start}-{end}"
}

export interface SplitResult {
  blobs: Blob[]
  filenames: string[]
}

export interface MergeOptions {
  preserveBookmarks?: boolean
  addPageBreaks?: boolean
}

export interface MergeFile {
  id: string
  file: File
  name: string
  pageCount: number
  selectedPages?: number[] // If undefined, all pages are selected
  order: number
}

export type ScaleTarget =
  | { type: 'standard'; size: 'letter' | 'a4' | 'a3' | 'legal' }
  | { type: 'custom'; width: number; height: number }

export type NupLayout = 2 | 4 | 6 | 9

export interface NupOptions {
  pagesPerSheet: NupLayout
  orientation: 'portrait' | 'landscape'
  pageOrder: 'horizontal' | 'vertical' // horizontal: Z-pattern, vertical: N-pattern
  margin: number // points
}

export interface BlankPageDetectionOptions {
  threshold: number // 0-1, percentage of white pixels to consider blank
  ignoreMargins: boolean
  marginSize: number // points to ignore from edges
}

export interface SplitMergeProgress {
  stage: 'loading' | 'processing' | 'saving' | 'complete'
  progress: number // 0-100
  message: string
  currentFile?: number
  totalFiles?: number
}

export type SplitMergeOperation =
  | { type: 'split'; options: SplitOptions }
  | { type: 'merge'; files: MergeFile[] }
  | { type: 'extract'; pages: number[] }
  | { type: 'scale'; target: ScaleTarget }
  | { type: 'nup'; options: NupOptions }
  | { type: 'removeBlank'; options: BlankPageDetectionOptions }
