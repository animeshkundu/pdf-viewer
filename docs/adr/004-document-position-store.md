# ADR-004: Per-Document Position Store

## Status

Accepted

## Date

2026-07-18

## Context

Users expect a previously opened PDF to resume at its latest viewed page. The
position must remain private, work without a server, distinguish documents
reliably, tolerate browser storage failures, and use bounded storage.

## Decision

Add a singleton `PositionStore` service that:

- derives document identity from the lowercase hexadecimal SHA-256 digest of
  the full original file bytes;
- stores `{ page, updatedAt }` entries in one `localStorage` map under
  `pdf-editor-positions`;
- retains at most 50 documents and evicts the entry with the oldest
  `updatedAt` value;
- accepts only valid integer pages when saving and clamps restored pages to the
  current document page count;
- treats unavailable bytes, Web Crypto, corrupt data, and unavailable or full
  browser storage as non-fatal persistence failures.

`PDFProvider` restores the page after PDF loading and records subsequent
current-page changes. Document identity is cleared before load and cleanup
state resets so transient page 1 state cannot replace the last valid position.

The RESTORE-to-scroll connection is explicit. After document identity and the
stored page have resolved, `PDFProvider` publishes that page through
`pendingScrollPage`. `PDFViewer` waits until the matching page element ref is
ready, scrolls it into view once, suppresses observer-driven page updates during
the programmatic scroll, and calls `consumePendingScroll`. A document change
clears any prior suppression timer and re-enables observer updates so a
same-mount second document restores independently.

Only a page number is persisted. Zoom, intra-page offset, document content,
annotations, filenames, and file metadata are not stored or sent anywhere.

## Consequences

### Positive

- Resume behavior is private and entirely client-side.
- Full-content SHA-256 identity avoids filename and size collisions.
- Defensive validation handles shortened documents and externally corrupted
  storage safely.
- The fixed entry limit bounds storage growth.

### Negative

- Hashing adds work proportional to file size during document loading.
- Position persistence is unavailable when original bytes, Web Crypto, or
  browser storage are unavailable.
- Editing a document's bytes creates a new identity and therefore a new saved
  position.

## Alternatives Considered

### Filename and file size

Rejected because metadata is not collision-resistant and can associate the
wrong position with unrelated documents.

### PDF.js fingerprints

Rejected because fingerprints may be based on partial content or legacy hash
algorithms and do not provide the required full-byte identity.

### Server-side persistence

Rejected because it would violate the application's client-side privacy model
and require document identity data to leave the browser.

## References

- [ADR-001: Client-Side Only Architecture](001-client-side-only.md)
- [ADR-003: Service Singleton Pattern](003-service-singleton-pattern.md)
