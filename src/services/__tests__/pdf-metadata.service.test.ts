import { describe, it, expect, vi } from 'vitest'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { OptionalContentConfig } from 'pdfjs-dist/types/src/display/optional_content_config'
import { pdfMetadataService } from '../pdf-metadata.service'

const createOptionalContentConfig = () => {
  const groups = new Map<string, { name: string; visible: boolean }>([
    ['layer-1', { name: 'Layer One', visible: true }],
    ['layer-2', { name: 'Layer Two', visible: false }],
  ])

  const config = {
    getOrder: () => ['layer-1', ['Group A', 'layer-2']],
    getGroup: (id: string) => groups.get(id) || null,
    isVisible: ({ id }: { id: string }) => groups.get(id)?.visible ?? true,
    setVisibility: (id: string, visible: boolean) => {
      const group = groups.get(id)
      if (group) {
        group.visible = visible
      }
    },
    [Symbol.iterator]: function* () {
      for (const entry of groups.entries()) {
        yield entry
      }
    }
  }

  return config as unknown as OptionalContentConfig
}

describe('PDFMetadataService', () => {
  it('maps outline items from PDF.js', async () => {
    const outline = [{
      title: 'Chapter 1',
      bold: false,
      italic: true,
      color: new Uint8ClampedArray([12, 34, 56]),
      dest: null,
      url: null,
      newWindow: undefined,
      count: undefined,
      items: [],
    }]

    const document = {
      getOutline: vi.fn().mockResolvedValue(outline),
      getAttachments: vi.fn(),
      getOptionalContentConfig: vi.fn(),
    } as unknown as PDFDocumentProxy

    const result = await pdfMetadataService.getOutline(document)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Chapter 1')
    expect(result[0].italic).toBe(true)
    expect(result[0].color).toBe('rgb(12, 34, 56)')
  })

  it('maps attachments with filename and size', async () => {
    const attachments = {
      'notes.txt': new Uint8Array([1, 2, 3, 4]),
    }

    const document = {
      getOutline: vi.fn(),
      getAttachments: vi.fn().mockResolvedValue(attachments),
      getOptionalContentConfig: vi.fn(),
    } as unknown as PDFDocumentProxy

    const result = await pdfMetadataService.getAttachments(document)
    expect(result).toHaveLength(1)
    expect(result[0].filename).toBe('notes.txt')
    expect(result[0].size).toBe(4)
  })

  it('builds layer tree using optional content config order', () => {
    const config = createOptionalContentConfig()
    const layers = pdfMetadataService.buildLayerTree(config)

    expect(layers).toHaveLength(2)
    expect(layers[0].type).toBe('layer')
    expect(layers[0].name).toBe('Layer One')
    expect(layers[1].type).toBe('group')
    expect(layers[1].children?.[0].name).toBe('Layer Two')
  })

  it('applies layer visibility updates', () => {
    const config = createOptionalContentConfig()
    pdfMetadataService.applyLayerVisibility(config, 'layer-2', true)

    const layers = pdfMetadataService.buildLayerTree(config)
    const secondLayer = layers[1].children?.[0]
    expect(secondLayer?.visible).toBe(true)
  })
})
