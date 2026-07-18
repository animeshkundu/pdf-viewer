import { useEffect, useRef } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { PDFProvider, usePDF } from '@/hooks/usePDF.tsx'
import { PDFViewer } from '@/components/PDFViewer/PDFViewer'

/**
 * Integration acceptance test for the complete "persist and restore each PDF's
 * last-viewed page across browser sessions" feature.
 *
 * This exercises the whole integration contract end-to-end through the real
 * collaborators of both feature atoms wired together:
 *   - document-position-store  -> the real @/services/position.service
 *     (SHA-256 document identity + bounded localStorage map + clamping).
 *   - pdf-position-lifecycle    -> the real @/hooks/usePDF PDFProvider
 *     (restore on load, save on every current-page change) and the real
 *     @/components/PDFViewer (programmatic restore-scroll via pendingScrollPage).
 *
 * Only the pdf.service data seam and a handful of PDFViewer collaborators that
 * are irrelevant to positioning are mocked; the store, provider and viewer under
 * test are the production modules. A "browser session boundary" (close/reload +
 * reopen) is modelled by fully unmounting the React tree and mounting a brand new
 * PDFProvider: React state is discarded exactly as on a real reload, while the
 * process-level localStorage (see src/setupTests.ts) survives, just like real
 * browser storage.
 *
 * This spec lives in the repository's existing collected unit/component test tier
 * (vitest `src/**` include glob in vitest.config.ts) and is therefore run by the
 * primary `npm run test` command. It asserts only observable behavior: the
 * selected page (currentPage) and which page element is scrolled into view.
 */

const STORAGE_KEY = 'pdf-editor-positions'

// Deterministic, controllable pdf.service seam. vi.hoisted keeps these available
// inside the hoisted vi.mock factories below. `currentBytes` drives the SHA-256
// document identity derived by the real position.service; `currentNumPages`
// drives page count (used for clamping and for how many page refs mount).
const { state, mockPdfService } = vi.hoisted(() => {
  const seam: { currentBytes: ArrayBuffer | null; currentNumPages: number } = {
    currentBytes: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer,
    currentNumPages: 10,
  }
  const makePage = () => ({
    // PDFViewer only reads width/height off the viewport for placeholder sizing.
    getViewport: () => ({ width: 100, height: 100 }),
  })
  return {
    state: seam,
    mockPdfService: {
      loadDocument: vi.fn(async () => ({ numPages: seam.currentNumPages })),
      getPage: vi.fn(async () => makePage()),
      getOriginalBytes: vi.fn(() => seam.currentBytes),
      getFilename: vi.fn(() => 'doc.pdf'),
      cleanup: vi.fn(() => {}),
    },
  }
})

vi.mock('@/services/pdf.service', () => ({
  pdfService: mockPdfService,
  PDFService: class {},
}))

// PDFViewer collaborators that are irrelevant to page positioning. pageOrder is
// derived from the live seam so the number of mounted page refs always matches
// the active document's page count.
vi.mock('@/hooks/usePageManagement', () => ({
  usePageManagement: () => ({
    pageOrder: Array.from({ length: state.currentNumPages }, (_, i) => i + 1),
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

// Independent document byte identities used across the suite.
const BYTES_A = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]).buffer
const BYTES_B = new Uint8Array([11, 22, 33, 44, 55, 66]).buffer
const BYTES_C = new Uint8Array([99, 98, 97, 96, 95]).buffer

async function computeDocId(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fileOf(bytes: ArrayBuffer): File {
  return new File([new Uint8Array(bytes)], 'doc.pdf', { type: 'application/pdf' })
}

function readStore(): Record<string, { page: number; updatedAt: number }> {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : {}
}

function seedPosition(docId: string, page: number): void {
  const current = readStore()
  current[docId] = { page, updatedAt: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
}

type PdfApi = ReturnType<typeof usePDF>

// Renders the real PDFViewer under a fresh PDFProvider. Optionally auto-loads
// `file` exactly once on mount (guarded by a started ref) and exposes the live
// usePDF api so the test can drive supported navigation.
function Harness({
  file,
  onApi,
}: {
  file?: File
  onApi: (api: PdfApi) => void
}) {
  const pdf = usePDF()
  const startedRef = useRef(false)

  useEffect(() => {
    onApi(pdf)
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

// A no-op IntersectionObserver that never fires. PDFViewer constructs one with
// `new IntersectionObserver(...)`; the repo's setupTests stub is an arrow
// vi.fn() that Vitest 4 rejects as a constructor, so a real class is installed
// here. Because it never fires, observer-driven currentPage updates stay inert
// and only the restoration / explicit-navigation paths move the page, keeping
// the assertions deterministic.
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

// Records the data-page-number of every element that receives scrollIntoView.
let scrolledPages: string[] = []
let originalScrollIntoView: typeof HTMLElement.prototype.scrollIntoView | undefined
let originalIntersectionObserver: typeof globalThis.IntersectionObserver

interface Session {
  container: HTMLElement
  getByTestId: (id: string) => HTMLElement
  getApi: () => PdfApi
  unmount: () => void
}

// Opens a document inside a brand-new PDFProvider (a fresh "browser session"),
// waits until the document is ready and its restored page is both selected and
// present in the DOM, then returns handles for further interaction.
async function openSession(
  bytes: ArrayBuffer | null,
  numPages: number,
  file: File | null,
  expectedPage: number
): Promise<Session> {
  state.currentBytes = bytes
  state.currentNumPages = numPages

  let api: PdfApi | null = null
  const { container, getByTestId, unmount } = render(
    <PDFProvider>
      <Harness
        file={file ?? undefined}
        onApi={(a) => {
          api = a
        }}
      />
    </PDFProvider>
  )

  await waitFor(() => {
    expect(getByTestId('doc-ready').textContent).toBe('ready')
    expect(getByTestId('current-page').textContent).toBe(String(expectedPage))
    expect(
      container.querySelector(`[data-page-number='${expectedPage}']`)
    ).not.toBeNull()
  })

  return {
    container,
    getByTestId,
    getApi: () => {
      if (!api) throw new Error('usePDF api was not captured')
      return api
    },
    unmount,
  }
}

// Drives a supported in-app navigation path: every navigation control
// (toolbar, keyboard, thumbnails, gestures) ultimately funnels through
// usePDF().setCurrentPage, which is what persists the position.
async function navigateTo(session: Session, page: number): Promise<void> {
  await act(async () => {
    session.getApi().setCurrentPage(page)
    await Promise.resolve()
  })
  await waitFor(() => {
    expect(session.getByTestId('current-page').textContent).toBe(String(page))
  })
}

describe('per-document last-viewed page persistence (end-to-end lifecycle)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    state.currentBytes = BYTES_A
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

  it('restores the last-viewed page (selected + scrolled) after a session reload', async () => {
    // Unseen document opens at page 1.
    const first = await openSession(BYTES_A, 10, fileOf(BYTES_A), 1)

    // Navigate to page 7 through a supported navigation path; this must persist.
    await navigateTo(first, 7)
    expect(readStore()[await computeDocId(BYTES_A)]?.page).toBe(7)

    // Close/reload: discard all React state, keep browser storage.
    first.unmount()
    scrolledPages = []

    // Reopen the same document: page 7 is selected AND scrolled into view, and
    // the transient page-1 default is never scrolled to.
    const reopened = await openSession(BYTES_A, 10, fileOf(BYTES_A), 7)
    await waitFor(() => {
      expect(scrolledPages).toContain('7')
    })
    expect(scrolledPages).not.toContain('1')
    reopened.unmount()
  })

  it('keeps a distinct saved position per document', async () => {
    // Session 1: view document A at page 4.
    const a1 = await openSession(BYTES_A, 10, fileOf(BYTES_A), 1)
    await navigateTo(a1, 4)
    a1.unmount()

    // Session 2: view a different document B at page 6.
    const b1 = await openSession(BYTES_B, 8, fileOf(BYTES_B), 1)
    await navigateTo(b1, 6)
    b1.unmount()

    // Reopen A -> its own page 4 (not B's 6).
    scrolledPages = []
    const a2 = await openSession(BYTES_A, 10, fileOf(BYTES_A), 4)
    await waitFor(() => {
      expect(scrolledPages).toContain('4')
    })
    expect(scrolledPages).not.toContain('6')
    a2.unmount()

    // Reopen B -> its own page 6 (not A's 4).
    scrolledPages = []
    const b2 = await openSession(BYTES_B, 8, fileOf(BYTES_B), 6)
    await waitFor(() => {
      expect(scrolledPages).toContain('6')
    })
    expect(scrolledPages).not.toContain('4')
    b2.unmount()
  })

  it('starts an unseen document at page 1 even when other documents are stored', async () => {
    // A has a saved position, but C has never been opened.
    seedPosition(await computeDocId(BYTES_A), 5)

    const c = await openSession(BYTES_C, 9, fileOf(BYTES_C), 1)
    expect(c.getByTestId('current-page').textContent).toBe('1')
    // The unrelated stored position is untouched.
    expect(readStore()[await computeDocId(BYTES_A)]?.page).toBe(5)
    c.unmount()
  })

  it('clamps an out-of-range saved page to the current document length', async () => {
    // A stored page far beyond the (now shorter) document must be clamped down
    // to the last page rather than selecting a non-existent page.
    seedPosition(await computeDocId(BYTES_A), 999)

    const clamped = await openSession(BYTES_A, 5, fileOf(BYTES_A), 5)
    await waitFor(() => {
      expect(scrolledPages).toContain('5')
    })
    expect(clamped.getByTestId('current-page').textContent).toBe('5')
    clamped.unmount()
  })

  it('lets an explicit navigation target win over the previously restored page', async () => {
    // Seed a saved position so the reopened document restores to page 2.
    seedPosition(await computeDocId(BYTES_A), 2)
    const restored = await openSession(BYTES_A, 10, fileOf(BYTES_A), 2)

    // The transient page-1 default during load must NOT clobber the stored page.
    expect(readStore()[await computeDocId(BYTES_A)]?.page).toBe(2)

    // Explicitly navigate elsewhere: this explicit target wins and is persisted.
    await navigateTo(restored, 9)
    expect(readStore()[await computeDocId(BYTES_A)]?.page).toBe(9)
    restored.unmount()
    scrolledPages = []

    // Reopen: the explicit target (9) wins over the earlier restored page (2).
    const reopened = await openSession(BYTES_A, 10, fileOf(BYTES_A), 9)
    await waitFor(() => {
      expect(scrolledPages).toContain('9')
    })
    expect(scrolledPages).not.toContain('2')
    reopened.unmount()
  })
})
