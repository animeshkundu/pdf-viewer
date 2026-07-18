import type { DocumentPosition, PositionStoreMap } from '@/types/pdf.types'

const MAX_DOCUMENTS = 50

function isDocumentPosition(value: unknown): value is DocumentPosition {
  return (
    typeof value === 'object' &&
    value !== null &&
    'page' in value &&
    typeof value.page === 'number' &&
    'updatedAt' in value &&
    typeof value.updatedAt === 'number'
  )
}

export class PositionStore {
  private static instance: PositionStore
  private static readonly STORAGE_KEY = 'pdf-editor-positions'

  private constructor() {}

  static getInstance(): PositionStore {
    if (!PositionStore.instance) {
      PositionStore.instance = new PositionStore()
    }
    return PositionStore.instance
  }

  async deriveDocumentId(bytes: ArrayBuffer | null): Promise<string | null> {
    if (!bytes) {
      return null
    }

    try {
      if (!globalThis.crypto?.subtle) {
        console.warn('Unable to derive document position identity: Web Crypto is unavailable')
        return null
      }

      const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
    } catch (error) {
      console.warn('Unable to derive document position identity:', error)
      return null
    }
  }

  getPosition(docId: string, numPages: number): number {
    if (!Number.isInteger(numPages) || numPages < 1) {
      return 1
    }

    const storedPage = this.readPositions()[docId]?.page
    if (!Number.isInteger(storedPage)) {
      return 1
    }

    return Math.min(Math.max(storedPage, 1), numPages)
  }

  savePosition(docId: string, page: number, numPages: number): void {
    if (
      !Number.isInteger(page) ||
      !Number.isInteger(numPages) ||
      numPages < 1 ||
      page < 1 ||
      page > numPages
    ) {
      return
    }

    const positions = this.readPositions()
    positions[docId] = { page, updatedAt: Date.now() }

    if (Object.keys(positions).length > MAX_DOCUMENTS) {
      let oldestDocId: string | null = null

      for (const [id, position] of Object.entries(positions)) {
        if (
          oldestDocId === null ||
          position.updatedAt < positions[oldestDocId].updatedAt
        ) {
          oldestDocId = id
        }
      }

      if (oldestDocId !== null) {
        delete positions[oldestDocId]
      }
    }

    this.writePositions(positions)
  }

  clearAll(): void {
    try {
      globalThis.localStorage.removeItem(PositionStore.STORAGE_KEY)
    } catch (error) {
      console.warn('Unable to clear document positions:', error)
    }
  }

  reset(): void {
    this.clearAll()
  }

  private readPositions(): PositionStoreMap {
    try {
      const stored = globalThis.localStorage.getItem(PositionStore.STORAGE_KEY)
      if (!stored) {
        return {}
      }

      const parsed: unknown = JSON.parse(stored)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        console.warn('Unable to read document positions: stored data is invalid')
        return {}
      }

      const positions: PositionStoreMap = {}
      for (const [docId, value] of Object.entries(parsed)) {
        if (isDocumentPosition(value)) {
          positions[docId] = value
        }
      }
      return positions
    } catch (error) {
      console.warn('Unable to read document positions:', error)
      return {}
    }
  }

  private writePositions(positions: PositionStoreMap): void {
    try {
      const serialized = JSON.stringify(positions)
      globalThis.localStorage.setItem(PositionStore.STORAGE_KEY, serialized)
    } catch (error) {
      console.warn('Unable to save document position:', error)
    }
  }
}

export const positionStore = PositionStore.getInstance()
