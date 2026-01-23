export interface OutlineItem {
  id: string
  title: string
  bold: boolean
  italic: boolean
  color: string
  dest: unknown
  url: string | null
  newWindow: boolean | undefined
  count: number | undefined
  items: OutlineItem[]
}

export interface AttachmentItem {
  id: string
  filename: string
  size: number
  content: Uint8Array
}

export interface LayerItem {
  id: string
  name: string
  visible: boolean
  type: 'group' | 'layer'
  children?: LayerItem[]
}

