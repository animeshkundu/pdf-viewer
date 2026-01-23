import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { OptionalContentConfig } from 'pdfjs-dist/types/src/display/optional_content_config'
import type { OutlineItem, AttachmentItem, LayerItem } from '@/types/metadata.types'

interface RawOutlineNode {
  title: string
  bold: boolean
  italic: boolean
  color: Uint8ClampedArray
  dest: unknown
  url: string | null
  newWindow: boolean | undefined
  count: number | undefined
  items: RawOutlineNode[]
}

interface OptionalContentGroup {
  name: string
}

type OptionalContentOrder = Array<string | OptionalContentOrder>

export class PDFMetadataService {
  async getOutline(document: PDFDocumentProxy): Promise<OutlineItem[]> {
    try {
      const outline = await document.getOutline()
      if (!outline) return []
      return outline.map((node, index) => this.mapOutlineNode(node as RawOutlineNode, `outline-${index}`))
    } catch (error) {
      console.warn('Failed to load outline:', error)
      return []
    }
  }

  async getAttachments(document: PDFDocumentProxy): Promise<AttachmentItem[]> {
    try {
      const attachments = await document.getAttachments()
      if (!attachments) return []
      return Object.entries(attachments).map(([filename, content], index) => ({
        id: `attachment-${index}-${Date.now()}`,
        filename,
        size: (content as Uint8Array).length,
        content: content as Uint8Array,
      }))
    } catch (error) {
      console.warn('Failed to load attachments:', error)
      return []
    }
  }

  async getOptionalContentConfig(document: PDFDocumentProxy): Promise<OptionalContentConfig | null> {
    try {
      return await document.getOptionalContentConfig({ intent: 'display' })
    } catch (error) {
      console.warn('Failed to load optional content config:', error)
      return null
    }
  }

  buildLayerTree(config: OptionalContentConfig | null): LayerItem[] {
    if (!config) return []

    const order = config.getOrder() as OptionalContentOrder | null
    if (!order || order.length === 0) {
      return Array.from(config).map(([id, group]) => this.mapLayer(id as string, group as OptionalContentGroup, config))
    }

    const root: LayerItem[] = []
    order.forEach((item, index) => {
      if (typeof item === 'string') {
        const group = config.getGroup(item) as OptionalContentGroup | null
        if (group) {
          root.push(this.mapLayer(item, group, config))
        }
        return
      }
      if (Array.isArray(item) && item.length > 0) {
        const [groupLabel, ...children] = item
        if (typeof groupLabel === 'string') {
          root.push({
            id: `group-${groupLabel}-${index}`,
            name: groupLabel,
            visible: true,
            type: 'group',
            children: this.mapLayerChildren(children, config),
          })
        } else {
          root.push(...this.mapLayerChildren(item, config))
        }
      }
    })

    return root
  }

  applyLayerVisibility(config: OptionalContentConfig | null, id: string, visible: boolean) {
    if (!config) return
    config.setVisibility(id, visible, true)
  }

  private mapOutlineNode(node: RawOutlineNode, id: string): OutlineItem {
    const color = `rgb(${node.color[0]}, ${node.color[1]}, ${node.color[2]})`
    return {
      id,
      title: node.title,
      bold: node.bold,
      italic: node.italic,
      color,
      dest: node.dest,
      url: node.url,
      newWindow: node.newWindow,
      count: node.count,
      items: (node.items || []).map((child, index) =>
        this.mapOutlineNode(child, `${id}-${index}`)
      ),
    }
  }

  private mapLayerChildren(items: OptionalContentOrder, config: OptionalContentConfig): LayerItem[] {
    return items.flatMap((item, index) => {
      if (typeof item === 'string') {
        const group = config.getGroup(item) as OptionalContentGroup | null
        return group ? [this.mapLayer(item, group, config)] : []
      }
      if (Array.isArray(item)) {
        const [label, ...children] = item
        if (typeof label === 'string') {
          return [{
            id: `group-${label}-${index}`,
            name: label,
            visible: true,
            type: 'group',
            children: this.mapLayerChildren(children, config),
          }]
        }
        return this.mapLayerChildren(item, config)
      }
      return []
    })
  }

  private mapLayer(id: string, group: OptionalContentGroup, config: OptionalContentConfig): LayerItem {
    return {
      id,
      name: group.name || 'Layer',
      visible: config.isVisible({ type: 'OCG', id }),
      type: 'layer',
    }
  }
}

export const pdfMetadataService = new PDFMetadataService()
