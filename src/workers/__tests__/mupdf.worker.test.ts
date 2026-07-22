import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { degrees, PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import * as mupdf from 'mupdf'
import type {
  MuPDFEditOperation,
  MuPDFStructuredText,
  MuPDFWorkerRequest,
  MuPDFWorkerResponse,
} from '@/types/mupdf.types'

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

interface WorkerScope {
  onmessage: ((event: MessageEvent<MuPDFWorkerRequest>) => Promise<void>) | null
  postMessage: (response: MuPDFWorkerResponse) => void
}

const workerScope = self as unknown as WorkerScope
const pendingRequests = new Map<number, PendingRequest>()
let nextRequestId = 1

function requestWorker<T>(
  type: MuPDFWorkerRequest['type'],
  payload?: unknown
): Promise<T> {
  const id = nextRequestId
  nextRequestId += 1

  return new Promise<T>((resolve, reject) => {
    const handler = workerScope.onmessage
    if (!handler) {
      reject(new Error('MuPDF worker handler is not initialized'))
      return
    }

    pendingRequests.set(id, {
      resolve: (value) => resolve(value as T),
      reject,
    })
    void handler({ data: { id, type, payload } } as MessageEvent<MuPDFWorkerRequest>)
  })
}

function copyArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

async function createAnnotatedPdf(rotation = 0): Promise<ArrayBuffer> {
  const pdfDocument = await PDFDocument.create()
  const page = pdfDocument.addPage([420, 300])
  page.setRotation(degrees(rotation))
  const font = await pdfDocument.embedFont(StandardFonts.Helvetica)
  page.drawText('ORIGINAL_TEXT', {
    x: 40,
    y: 220,
    size: 20,
    font,
    color: rgb(0, 0, 0),
  })
  page.drawText('PENDING_REDACTION_TEXT', {
    x: 40,
    y: 160,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  })

  const initialBytes = await pdfDocument.save()
  const sourceDocument = mupdf.Document.openDocument(
    initialBytes,
    'application/pdf'
  ).asPDF()
  if (!sourceDocument) throw new Error('Generated fixture is not a PDF')

  const sourcePage = sourceDocument.loadPage(0) as mupdf.PDFPage
  const annotations = ['FIRST_NATIVE_ANNOTATION', 'SECOND_NATIVE_ANNOTATION'].map(
    (contents, index) => {
      const annotation = sourcePage.createAnnotation('Text')
      annotation.setRect([360, 20 + index * 30, 380, 40 + index * 30])
      annotation.setContents(contents)
      annotation.setAuthor('Acceptance test')
      annotation.update()
      return annotation
    }
  )
  const pendingText = sourcePage.toStructuredText()
  const pendingQuads = pendingText.search('PENDING_REDACTION_TEXT').flat()
  const pendingX = pendingQuads.flatMap((quad) => [quad[0], quad[2], quad[4], quad[6]])
  const pendingY = pendingQuads.flatMap((quad) => [quad[1], quad[3], quad[5], quad[7]])
  const pendingRedaction = sourcePage.createAnnotation('Redact')
  pendingRedaction.setRect([
    Math.min(...pendingX),
    Math.min(...pendingY),
    Math.max(...pendingX),
    Math.max(...pendingY),
  ])
  pendingRedaction.setContents('PENDING_NATIVE_REDACTION')
  pendingRedaction.update()
  const sourceBuffer = sourceDocument.saveToBuffer('garbage=4')
  const sourceBytes = copyArrayBuffer(sourceBuffer.asUint8Array())

  sourceBuffer.destroy()
  pendingText.destroy()
  pendingRedaction.destroy()
  annotations.forEach((annotation) => annotation.destroy())
  sourcePage.destroy()
  sourceDocument.destroy()
  return sourceBytes
}

describe('MuPDF text-edit worker persistence', () => {
  beforeAll(async () => {
    workerScope.postMessage = (response) => {
      if (response.id < 0) return

      const pending = pendingRequests.get(response.id)
      if (!pending) return
      pendingRequests.delete(response.id)

      if (response.error) {
        pending.reject(new Error(response.error))
      } else {
        pending.resolve(response.result)
      }
    }

    await import('../mupdf.worker')
  })

  afterAll(async () => {
    await requestWorker('cleanup')
  })

  it('removes original text, bakes replacement content, and preserves native annotations', async () => {
    const sourceBytes = await createAnnotatedPdf()
    await requestWorker('loadDocument', { bytes: sourceBytes })

    const structuredText = await requestWorker<MuPDFStructuredText>('extractText', {
      pageNum: 0,
    })
    const originalRun = structuredText.blocks
      .flatMap((block) => block.type === 'text' ? block.lines : [])
      .flatMap((line) => line.spans.map((span) => ({ line, span })))
      .find(({ span }) => span.text.includes('ORIGINAL_TEXT'))
    expect(originalRun).toBeDefined()
    if (!originalRun) throw new Error('Original text span was not extracted')

    const { line, span: originalSpan } = originalRun
    const [x0, y0, x1, y1] = originalSpan.bbox
    const replacementText = 'REPLACED_CONTENT'
    const edit: MuPDFEditOperation = {
      pageNum: 0,
      origin: originalSpan.origin,
      direction: line.dir,
      originalBounds: {
        x: x0,
        y: y0,
        width: x1 - x0,
        height: y1 - y0,
      },
      newBounds: {
        x: x0,
        y: y0,
        width: Math.max(x1 - x0, 210),
        height: y1 - y0,
      },
      newText: replacementText,
      style: {
        fontFamily: originalSpan.font,
        fontSize: originalSpan.size,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textAlign: 'left',
      },
    }

    await requestWorker('applyEdit', edit)
    const savedBytes = await requestWorker<Uint8Array>('saveDocument')
    const savedDocument = mupdf.Document.openDocument(
      savedBytes,
      'application/pdf'
    ).asPDF()
    if (!savedDocument) throw new Error('Saved output is not a PDF')

    const savedPage = savedDocument.loadPage(0) as mupdf.PDFPage
    const savedText = savedPage.toStructuredText()
    const annotations = savedPage.getAnnotations()

    expect(savedText.asText()).toContain(replacementText)
    expect(savedText.asText()).not.toContain('ORIGINAL_TEXT')
    expect(savedText.asText()).toContain('PENDING_REDACTION_TEXT')
    expect(annotations.map((annotation) => annotation.getContents())).toEqual([
      'FIRST_NATIVE_ANNOTATION',
      'SECOND_NATIVE_ANNOTATION',
      'PENDING_NATIVE_REDACTION',
    ])
    expect(annotations.some((annotation) => annotation.getType() === 'Redact')).toBe(true)
    expect(annotations.some((annotation) => annotation.getType() === 'FreeText')).toBe(false)

    annotations.forEach((annotation) => annotation.destroy())
    savedText.destroy()
    savedPage.destroy()
    savedDocument.destroy()
  })

  it('preserves baseline and writing direction on natively rotated pages', async () => {
    const sourceBytes = await createAnnotatedPdf(90)
    await requestWorker('loadDocument', { bytes: sourceBytes })
    const structuredText = await requestWorker<MuPDFStructuredText>('extractText', {
      pageNum: 0,
    })
    const originalRun = structuredText.blocks
      .flatMap((block) => block.type === 'text' ? block.lines : [])
      .flatMap((line) => line.spans.map((span) => ({ line, span })))
      .find(({ span }) => span.text.includes('ORIGINAL_TEXT'))
    if (!originalRun) throw new Error('Rotated source text was not extracted')

    const { line, span } = originalRun
    const [x0, y0, x1, y1] = span.bbox
    const replacementText = 'ROTATED_REPLACEMENT'
    const vertical = Math.abs(line.dir[1]) > Math.abs(line.dir[0])
    await requestWorker('applyEdit', {
      pageNum: 0,
      origin: span.origin,
      direction: line.dir,
      originalBounds: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 },
      newBounds: {
        x: x0,
        y: y0,
        width: vertical ? x1 - x0 : 320,
        height: vertical ? 320 : y1 - y0,
      },
      newText: replacementText,
      style: {
        fontFamily: span.font,
        fontSize: span.size,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textAlign: 'left',
      },
    } satisfies MuPDFEditOperation)

    const savedBytes = await requestWorker<Uint8Array>('saveDocument')
    await requestWorker('loadDocument', { bytes: copyArrayBuffer(savedBytes) })
    const savedText = await requestWorker<MuPDFStructuredText>('extractText', { pageNum: 0 })
    const savedRuns = savedText.blocks
      .flatMap((block) => block.type === 'text' ? block.lines : [])
      .flatMap((savedLine) => savedLine.spans.map((savedSpan) => ({
        line: savedLine,
        span: savedSpan,
      })))
    expect(savedRuns.map(({ span: savedSpan }) => savedSpan.text).join('|')).toContain(
      replacementText
    )
    const replacementRun = savedRuns
      .find(({ span: savedSpan }) => savedSpan.text.includes(replacementText))

    expect(replacementRun?.line.dir[0]).toBeCloseTo(line.dir[0], 3)
    expect(replacementRun?.line.dir[1]).toBeCloseTo(line.dir[1], 3)
    expect(replacementRun?.span.origin[0]).toBeCloseTo(span.origin[0], 1)
    expect(replacementRun?.span.origin[1]).toBeCloseTo(span.origin[1], 1)
  })
})
