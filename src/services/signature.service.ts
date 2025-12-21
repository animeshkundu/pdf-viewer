export interface SavedSignature {
  id: string
  name: string
  imageData: string
  width: number
  height: number
  timestamp: number
}

const MAX_SIGNATURES = 5

export class SignatureService {
  private static readonly STORAGE_KEY = 'pdf-editor-signatures'

  async loadSignatures(): Promise<SavedSignature[]> {
    try {
      const item = window.localStorage.getItem(SignatureService.STORAGE_KEY)
      const signatures = item ? JSON.parse(item) : []
      return signatures || []
    } catch (error) {
      console.error('Error loading signatures:', error)
      return []
    }
  }

  async saveSignature(signature: Omit<SavedSignature, 'id' | 'timestamp'>): Promise<SavedSignature> {
    const signatures = await this.loadSignatures()
    
    if (signatures.length >= MAX_SIGNATURES) {
      throw new Error(`Maximum ${MAX_SIGNATURES} signatures allowed`)
    }

    const newSignature: SavedSignature = {
      ...signature,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }

    signatures.push(newSignature)
    window.localStorage.setItem(SignatureService.STORAGE_KEY, JSON.stringify(signatures))
    
    return newSignature
  }

  async deleteSignature(id: string): Promise<void> {
    const signatures = await this.loadSignatures()
    const filtered = signatures.filter(sig => sig.id !== id)
    window.localStorage.setItem(SignatureService.STORAGE_KEY, JSON.stringify(filtered))
  }

  async updateSignature(id: string, updates: Partial<Pick<SavedSignature, 'name'>>): Promise<void> {
    const signatures = await this.loadSignatures()
    const index = signatures.findIndex(sig => sig.id === id)
    
    if (index !== -1) {
      signatures[index] = { ...signatures[index], ...updates }
      window.localStorage.setItem(SignatureService.STORAGE_KEY, JSON.stringify(signatures))
    }
  }

  async clearAllSignatures(): Promise<void> {
    window.localStorage.removeItem(SignatureService.STORAGE_KEY)
  }

  canAddMore(currentCount: number): boolean {
    return currentCount < MAX_SIGNATURES
  }

  getMaxSignatures(): number {
    return MAX_SIGNATURES
  }

  createSignatureImage(canvas: HTMLCanvasElement): { imageData: string; width: number; height: number } {
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    
    if (!tempCtx) {
      throw new Error('Failed to create canvas context')
    }

    const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height)
    if (!imageData) {
      throw new Error('Failed to get image data')
    }

    const bounds = this.getSignatureBounds(imageData)
    
    if (!bounds) {
      throw new Error('No signature content found')
    }

    const padding = 10
    tempCanvas.width = bounds.width + padding * 2
    tempCanvas.height = bounds.height + padding * 2

    tempCtx.drawImage(
      canvas,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      padding,
      padding,
      bounds.width,
      bounds.height
    )

    return {
      imageData: tempCanvas.toDataURL('image/png'),
      width: tempCanvas.width,
      height: tempCanvas.height,
    }
  }

  private getSignatureBounds(imageData: ImageData): { x: number; y: number; width: number; height: number } | null {
    const { data, width, height } = imageData
    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    let hasContent = false

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3]
        if (alpha > 0) {
          hasContent = true
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
    }

    if (!hasContent) {
      return null
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    }
  }

  async handleImageUpload(file: File): Promise<{ imageData: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        
        img.onload = () => {
          const maxWidth = 400
          const maxHeight = 200
          let { width, height } = img

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to create canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          
          resolve({
            imageData: canvas.toDataURL('image/png'),
            width,
            height,
          })
        }
        
        img.onerror = () => {
          reject(new Error('Failed to load image'))
        }
        
        img.src = e.target?.result as string
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsDataURL(file)
    })
  }
}

export const signatureService = new SignatureService()
