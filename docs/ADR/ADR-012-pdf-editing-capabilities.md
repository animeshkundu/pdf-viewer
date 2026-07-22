# ADR-012: Permanent Text-Run Editing

## Status

Accepted

## Context

PDF text is a sequence of positioned drawing commands rather than reflowable
document text. Editing an existing run therefore requires more than placing a
visual annotation over it: the original text must be removed, replacement text
must be written into the page, and the exported file must not retain a removable
replacement annotation.

The application must perform this work entirely in the browser and preserve the
existing pdf-lib export features.

## Decision

Use MuPDF in a module Web Worker for destructive text-run replacement and keep
pdf-lib as the export compositor.

### Editing workflow

1. MuPDF's structured-text walker extracts runs with their native bounds, font,
   size, color, and writing direction.
2. A canvas-positioned HTML editor opens when the user clicks a run.
3. Applying an edit creates a text-only redaction over that run. Images and line
   art intersecting the run are explicitly preserved. Existing pending Redact
   annotations are detached for this operation and then restored, so editing one
   run cannot apply unrelated redactions.
4. The replacement is given a MuPDF FreeText appearance using a compatible
   Base-14 font. Its first-glyph origin and writing direction preserve the
   source baseline and orientation.
5. Saving clones the working document, bakes annotation appearances into page
   content, and performs a non-incremental, garbage-collected save.

The FreeText annotation is only an implementation intermediate. Exported text
edits are page content, and the replacement annotation is absent from the saved
file.

### Document lifecycle

The text-edit service owns pristine source bytes, an in-memory MuPDF working
document, and edit snapshots. Disabling text-edit mode hides the editing UI but
does not discard the working document. Loading a different source document
disposes it.

Undo and redo rebuild the MuPDF document from pristine bytes and replay the
selected snapshot. Re-editing a run replaces its prior operation rather than
stacking redactions.

### Coordinates

MuPDF bounds remain in unscaled page coordinates after the PDF's native page
rotation. Display bounds are derived for the active PDF.js scale and the
page-management rotation delta (0, 90, 180, or 270 degrees); PDF.js renders with
the sum of native and page-management rotation. The edit layer is rendered
inside the same positioned wrapper as the canvas to avoid padding offsets.

### Export composition

When text edits exist, export first requests baked bytes from the text-edit
service. The existing pdf-lib pipeline then applies, in order:

1. Page reorder, deletion, rotation, and blank-page insertion
2. Page numbers and watermarks
3. Form values and optional flattening
4. Application annotations

Without text edits, export continues to use the original bytes directly.

## Consequences

### Positive

- Original text is removed rather than visually covered.
- Replacement text survives export and re-import as extractable page content.
- Text edits compose with existing export features.
- PDF processing remains private and client-side.
- MuPDF parsing and mutation stay off the main thread.

### Limitations

- Editing does not reflow neighboring runs or paragraphs.
- Base-14 font substitution can differ from embedded or subset fonts.
- Replacement bounds expand conservatively but remain a single positioned run.
- Characters outside the selected Base-14 font repertoire are rejected before
  redaction; complex-script support requires future font embedding.
- Rotation support is limited to the 90-degree increments used by page
  management.

## Validation

Unit tests cover span extraction, scaling and native/managed rotation
transforms, baseline and writing-direction preservation, pending-redaction
isolation, zoom-stable font sizing, bounded replay history, working-byte
persistence, and replay-based undo/redo. The round-trip browser test edits a
real run, exports and re-imports the PDF, verifies that the replacement is
extractable, verifies that the original run is absent, and verifies that no
replacement annotation remains.

## Related Decisions

- ADR-001: PDF.js for Rendering
- ADR-002: pdf-lib for PDF Manipulation
- ADR-003: Virtualized Page Rendering
- ADR-009: Text Layer Implementation
- ADR-010: PDF Export Architecture
- ADR-011: Redaction Implementation
