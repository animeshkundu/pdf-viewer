import { useEffect, useRef } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { PDFProvider, usePDF } from '@/hooks/usePDF.tsx'
import { PDFViewer } from '@/components/PDFViewer/PDFViewer'
import { positionStore } from '@/services/position.service'

/**
 * Acceptance spec for connection point 3 (RESTORE -> scroll) of the per-document
 * position store: once a document loads and its stored page is restored into
 * currentPage (already wired), <PDFViewer/> must programmatically scroll the
 * viewport to that page as soon as its per-page refs are ready.
 *
 * This spec is component-tier (vitest + happy-dom) and is collected by the repo's
 * primary `npm run test` command (see vitest.config.ts include glob). It renders
 * the real PDFProvider/usePDF + PDFViewer tree and drives the capability through a
 * mocked pdf.service data seam plus the real position.service (SHA-256 doc id +
 * localStorage), asserting only observable DOM behavior (which page element
 * receives scrollIntoView).
 *
 * FAIL-BEFORE: on the untouched base PDFViewer has no restoration-driven scroll.
 * currentPage becomes the restored page BEFORE the page refs mount, and the
 * existing [currentPage] navigation effect does not re-run once refs later
 * populate; the IntersectionObserver stub never fires. So scrollIntoView is never
 * invoked for the restored page and the assertions below FAIL at the assertion
 * step (not at import/module resolution).
 *
 * PASS-AFTER: adding pendingScrollPage/consumePendingScroll (usePDF) and the
 * [pendingScrollPage, pages] restore-scroll effect (PDFViewer) makes the viewer
 * scroll to the restored page once refs are ready, and these assertions pass.
 */

const STORAGE_KEY = 'pdf-editor-positions'

// Deterministic, controllable pdf.service seam. vi.hoisted so the values are
// available inside the hoisted vi.mock factory below.
const { FIXED_BYTES, state, mockPdfService } = vi.hoisted(() => {
  const fixed = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer
  const seam: { currentBytes: ArrayBuffer | null; currentNumPages: number } = {
    currentBytes: fixed,
    currentNumPages: 10,
  }
  const makePage = () => ({
    // PDFViewer only reads width/height off the viewport for placeholder sizing.
    getViewport: () => ({ width: 100, height: 100 }),
  })
  return {
    FIXED_BYTES: fixed,
    state: seam,
    mockPdfService: {
      loadDocument: vi.fn(async () => ({ numPages: seam.currentNumPages })),
      getPage: vi.fn(async () => makePage()),
      getOriginalBytes: vi.fn(() => seam.currentBytes),
      getFilename: vi.fn(() => 'x.pdf'),
      cleanup: vi.fn(() => {}),
    },
  }
})

vi.mock('@/services/pdf.service', () => ({
  pdfService: mockPdfService,
  PDFService: class {},
}))

// PDFViewer's collaborators that are irrelevant to the restore-scroll behavior.
vi.mock('@/hooks/usePageManagement', () => ({
  usePageManagement: () => ({
    pageOrder: Array.from({ length: 10 }, (_, i) => i + 1),
    isDeleted: () => false,
    getRotation: () => 0,
  }),
}))

vi.mock('@/hooks/useTextEdit', () => ({
  useTextEdit: () => ({ state: { isEnabled: false } }),
}))

vi.mock('@/hooks/useGestures', () => ({
  useGestures: () => {},
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

async function computeDocId(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function fileOf(bytes: ArrayBuffer): File {
  return new File([new Uint8Array(bytes)], 'x.pdf', { type: 'application/pdf' })
}

type PdfApi = ReturnType<typeof usePDF>

// Renders the real PDFViewer under test. Optionally auto-loads `file` exactly
// once on mount (guarded by a started ref) and/or exposes the live usePDF api.
function Harness({
  file,
  onApi,
}: {
  file?: File
  onApi?: (api: PdfApi) => void
}) {
  const pdf = usePDF()
  const startedRef = useRef(false)

  useEffect(() => {
    onApi?.(pdf)
  })

  useEffect(() => {
    if (!file || startedRef.current) return
    startedRef.current = true
    void pdf.loadDocument(file)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <PDFViewer />
      <span data-testid="current-page">{pdf.currentPage}</span>
      <span data-testid="doc-ready">{pdf.document ? 'ready' : ''}</span>
    </div>
  )
}

// A no-op IntersectionObserver that never fires its callback. PDFViewer creates
// one with `new IntersectionObserver(...)`; the repo's setupTests stub uses an
// arrow-function vi.fn() that Vitest 4 rejects as a constructor, so we install a
// real class here. Because it never fires, the observer-driven currentPage/save
// path stays inert and only the restoration path can drive a programmatic scroll.
class NoopIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

// Records the data-page-number of every element that receives scrollIntoView,
// in call order. `this` is the element the method is called on.
let scrolledPages: string[] = []
let originalScrollIntoView: typeof HTMLElement.prototype.scrollIntoView | undefined
let originalIntersectionObserver: typeof globalThis.IntersectionObserver

describe('PDFViewer restore-scroll (connection point 3: RESTORE -> scroll)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    state.currentBytes = FIXED_BYTES
    state.currentNumPages = 10

    originalIntersectionObserver = globalThis.IntersectionObserver
    globalThis.IntersectionObserver =
      NoopIntersectionObserver as unknown as typeof globalThis.IntersectionObserver

    scrolledPages = []
    originalScrollIntoView = HTMLElement.prototype.scrollIntoView
    HTMLElement.prototype.scrollIntoView = vi.fn(function (this: HTMLElement) {
      scrolledPages.push(this.getAttribute('data-page-number') ?? '')
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    globalThis.IntersectionObserver = originalIntersectionObserver
    if (originalScrollIntoView) {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView
    } else {
      // happy-dom does not implement scrollIntoView; remove our stub.
      delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView
    }
  })

  it('T1: scrolls to the restored page once its page refs are ready', async () => {
    const docId = await computeDocId(FIXED_BYTES)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ [docId]: { page: 5, updatedAt: Date.now() } })
    )

    const { container, getByTestId } = render(
      <PDFProvider>
        <Harness file={fileOf(FIXED_BYTES)} />
      </PDFProvider>
    )

    // Restore has completed (currentPage === 5) and the page-5 element exists.
    await waitFor(() => {
      expect(getByTestId('current-page').textContent).toBe('5')
      expect(container.querySelector("[data-page-number='5']")).not.toBeNull()
    })

    // The viewer must have programmatically scrolled to page 5 (and never to
    // page 1, which was only ever the transient default).
    await waitFor(() => {
      expect(scrolledPages).toContain('5')
    })
    expect(scrolledPages).not.toContain('1')
  })

  it('T2: gates the restore scroll on restoration completion, not ref readiness', async () => {
    const docId = await computeDocId(FIXED_BYTES)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ [docId]: { page: 5, updatedAt: Date.now() } })
    )

    // Delay restoration (doc-id derivation) under explicit test control so we can
    // observe the window in which refs could mount but restoration has not yet
    // completed.
    const gate = deferred<string>()
    const deriveSpy = vi
      .spyOn(positionStore, 'deriveDocumentId')
      .mockReturnValue(gate.promise)

    const { container, getByTestId } = render(
      <PDFProvider>
        <Harness file={fileOf(FIXED_BYTES)} />
      </PDFProvider>
    )

    // While restoration is pending, loadDocument has not set the document, so no
    // page refs exist and nothing has been scrolled (in particular not page 1).
    await act(async () => {
      await Promise.resolve()
    })
    expect(deriveSpy).toHaveBeenCalled()
    expect(scrolledPages).not.toContain('1')
    expect(scrolledPages).not.toContain('5')

    // Complete restoration.
    await act(async () => {
      gate.resolve(docId)
      await gate.promise
    })

    await waitFor(() => {
      expect(getByTestId('current-page').textContent).toBe('5')
      expect(container.querySelector("[data-page-number='5']")).not.toBeNull()
    })

    // Only after restoration completes does the viewer scroll, and it targets the
    // restored page 5 (never page 1).
    await waitFor(() => {
      expect(scrolledPages).toContain('5')
    })
    expect(scrolledPages).not.toContain('1')
  })

  it('T3: re-scrolls per document identity across a same-mount second load', async () => {
    const bytesA = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer
    const bytesB = new Uint8Array([11, 22, 33, 44, 55, 66]).buffer
    const docIdA = await computeDocId(bytesA)
    const docIdB = await computeDocId(bytesB)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        [docIdA]: { page: 3, updatedAt: Date.now() },
        [docIdB]: { page: 6, updatedAt: Date.now() },
      })
    )

    let api: PdfApi | null = null
    render(
      <PDFProvider>
        <Harness
          onApi={(a) => {
            api = a
          }}
        />
      </PDFProvider>
    )

    await waitFor(() => {
      expect(api).not.toBeNull()
    })

    // Load document A (10 pages, stored page 3) on the still-mounted viewer.
    state.currentBytes = bytesA
    state.currentNumPages = 10
    await act(async () => {
      await api!.loadDocument(fileOf(bytesA))
    })
    await waitFor(() => {
      expect(scrolledPages).toContain('3')
    })

    // Load document B (distinct identity, 8 pages, stored page 6) WITHOUT
    // unmounting: the viewer must re-arm and scroll to B's restored page.
    state.currentBytes = bytesB
    state.currentNumPages = 8
    await act(async () => {
      await api!.loadDocument(fileOf(bytesB))
    })
    await waitFor(() => {
      expect(scrolledPages).toContain('6')
    })

    // Page 3 (doc A) was scrolled to before page 6 (doc B): per-document scoping.
    expect(scrolledPages.indexOf('3')).toBeGreaterThanOrEqual(0)
    expect(scrolledPages.indexOf('3')).toBeLessThan(scrolledPages.lastIndexOf('6'))
  })
})
