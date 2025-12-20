# Implementation Plan

## Development Phases

### Phase 1: Core Viewer (Week 1-2)
**Goal**: Basic PDF viewing with navigation

**Tasks**:
1. ✓ Set up project structure and PRD
2. ✓ Install dependencies (pdf.js, pdf-lib)
3. ✓ Implement PDFService for loading/rendering
4. ✓ Create PDFCanvas component with single page rendering
5. ✓ Build basic toolbar (Open, Zoom controls)
6. ✓ Implement page navigation (scroll, arrows)
7. ⏳ Add thumbnail sidebar with page previews
8. ⏳ Implement virtualized rendering for performance
9. ✓ Add loading states and progress indicators

**Acceptance Criteria**:
- [x] Can open PDF files via file picker or drag-drop
- [x] Smooth scrolling through multi-page documents
- [x] Zoom levels work (50%, 100%, 200%, Fit Width)
- [ ] Thumbnail sidebar shows all pages
- [ ] Documents with 100+ pages render smoothly

---

### Phase 2: Text & Search (Week 3)
**Goal**: Text selection and search functionality

**Tasks**:
1. Extract text layer from PDF.js
2. Implement text selection on canvas
3. Enable copy-to-clipboard
4. Build search UI (floating search bar)
5. Implement document-wide search
6. Add search result highlighting
7. Create navigation between search results
8. Add keyboard shortcuts (Cmd/Ctrl+F)

**Acceptance Criteria**:
- [ ] Text can be selected and copied
- [ ] Search finds all matches across document
- [ ] Search results highlighted in yellow
- [ ] Can navigate between matches with arrows
- [ ] Search works with case-sensitive option

---

### Phase 3: Annotations (Week 4-5)
**Goal**: Highlight, draw, and annotate PDFs

**Tasks**:
1. Create AnnotationService for state management
2. Build markup toolbar UI
3. Implement highlight tool
   - Select text to highlight
   - Choose from 5 colors
4. Implement pen/drawing tool
   - Smooth stroke rendering
   - Multiple colors and thicknesses
5. Implement shape tools (rectangle, circle, arrow)
6. Add text box annotation
7. Implement sticky notes
8. Create annotation selection/editing
9. Add delete annotation functionality
10. Build undo/redo system
11. Style annotation overlay layer

**Acceptance Criteria**:
- [ ] Markup toolbar toggles on/off
- [ ] Can highlight text in 5 different colors
- [ ] Pen tool draws smooth strokes
- [ ] Shapes can be drawn and resized
- [ ] Text boxes can be added and edited
- [ ] Annotations can be selected and deleted
- [ ] Undo/redo works for all annotations
- [ ] Annotations persist during zoom/scroll

---

### Phase 4: Signatures (Week 6)
**Goal**: Create and place digital signatures

**Tasks**:
1. Build signature creation modal
2. Implement drawing canvas with smooth capture
3. Add signature upload option
4. Store signatures in Spark KV
5. Create signature picker UI
6. Implement signature placement mode
7. Add resize/reposition for placed signatures
8. Enable signature deletion

**Acceptance Criteria**:
- [ ] Can draw signatures with mouse/trackpad
- [ ] Can upload signature images
- [ ] Up to 5 signatures stored locally
- [ ] Signatures can be placed on any page
- [ ] Placed signatures can be resized
- [ ] Signatures have transparent backgrounds

---

### Phase 5: Page Management (Week 7)
**Goal**: Modify page order and orientation

**Tasks**:
1. Add right-click context menu on thumbnails
2. Implement page rotation (90° increments)
3. Add page deletion
4. Implement drag-to-reorder in sidebar
5. Add multi-select for bulk operations
6. Update page numbering after changes
7. Ensure annotations follow page transformations

**Acceptance Criteria**:
- [ ] Pages can be rotated left/right
- [ ] Pages can be deleted
- [ ] Drag-and-drop reordering works
- [ ] Multi-select with Shift/Cmd+click
- [ ] Page numbers update after reordering
- [ ] Annotations remain on correct pages

---

### Phase 6: Export (Week 8)
**Goal**: Generate modified PDFs with all changes

**Tasks**:
1. Create ExportService with pdf-lib
2. Implement annotation embedding
   - Highlights as semi-transparent rectangles
   - Pen strokes as vector paths
   - Text boxes as PDF text
   - Signatures as embedded images
3. Apply page rotations to output
4. Apply page deletions to output
5. Apply page reordering to output
6. Add download functionality
7. Show export progress
8. Add filename suggestions

**Acceptance Criteria**:
- [ ] Download button generates PDF
- [ ] All annotations appear in exported PDF
- [ ] Page rotations applied
- [ ] Deleted pages removed
- [ ] Reordered pages in correct sequence
- [ ] Output opens correctly in other PDF readers
- [ ] No watermarks or branding

---

### Phase 7: Keyboard & Accessibility (Week 9)
**Goal**: Full keyboard support and screen reader compatibility

**Tasks**:
1. Implement keyboard shortcut system
2. Add focus management
3. Create keyboard shortcuts modal (?)
4. Add ARIA labels to all interactive elements
5. Implement skip links
6. Add keyboard navigation for all features
7. Test with screen readers
8. Add focus indicators
9. Ensure color contrast compliance

**Acceptance Criteria**:
- [ ] All features accessible via keyboard
- [ ] Tab order is logical
- [ ] Focus indicators visible on all elements
- [ ] Screen reader announces page changes
- [ ] Keyboard shortcuts modal accessible
- [ ] Color contrast meets WCAG AA
- [ ] No keyboard traps

---

### Phase 8: Polish & Performance (Week 10)
**Goal**: Optimize and refine UX

**Tasks**:
1. Implement canvas caching
2. Add Web Worker for PDF parsing
3. Optimize memory usage for large documents
4. Add performance monitoring
5. Implement error boundaries
6. Add unsaved changes warning
7. Create empty state UI
8. Add loading skeletons
9. Implement toast notifications
10. Mobile responsive adjustments
11. Add animations and transitions
12. Browser testing (Chrome, Firefox, Safari)

**Acceptance Criteria**:
- [ ] 60fps scrolling on average hardware
- [ ] Documents load without blocking UI
- [ ] Memory usage stays under 500MB
- [ ] Error messages are user-friendly
- [ ] Unsaved changes prompt before exit
- [ ] Empty state guides user to open file
- [ ] Animations feel smooth and natural
- [ ] Works on Chrome, Firefox, Safari

---

## Technical Dependencies

### Required Libraries

```json
{
  "dependencies": {
    "pdfjs-dist": "^4.0.0",
    "pdf-lib": "^1.17.1",
    "@phosphor-icons/react": "^2.1.10",
    "framer-motion": "^12.0.0"
  }
}
```

### Install Commands

```bash
npm install pdfjs-dist pdf-lib
```

Note: Other dependencies already included in template.

---

## Testing Strategy

### Unit Tests
- PDFService functions (loading, rendering)
- AnnotationService functions (add, update, delete)
- ExportService functions (PDF generation)
- Utility functions (coordinate conversion, color parsing)

### Integration Tests
- Complete annotation workflow
- Export with various annotation types
- Page management operations
- Undo/redo system

### Manual Testing
- Load various PDF types (text, scanned, form PDFs)
- Test with small (1 page) and large (500+ pages) documents
- Test all annotation tools
- Test export in multiple PDF readers
- Cross-browser testing
- Mobile device testing

### Performance Testing
- Measure load time for various file sizes
- Monitor FPS during scrolling
- Track memory usage over time
- Test with low-end hardware

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| PDF.js compatibility issues | High | Test with diverse PDF samples early |
| Memory leaks with large docs | High | Implement aggressive cleanup, monitoring |
| Canvas performance on mobile | Medium | Reduce quality/resolution on mobile |
| pdf-lib export quality | Medium | Test export extensively, have fallback |
| Browser differences | Low | Test in all major browsers regularly |

### UX Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Confusing annotation UI | High | User testing, iterate on feedback |
| Slow performance feels | High | Add loading states, optimize early |
| Lost work (no auto-save) | Medium | Add prominent unsaved indicator |
| Mobile usability issues | Medium | Progressive enhancement approach |

---

## Success Metrics

### Performance Targets
- **Load time**: < 3 seconds for 50MB PDF
- **Render time**: < 100ms per page at 100% zoom
- **Scroll FPS**: 60fps minimum
- **Memory**: < 500MB for 200-page document
- **Export time**: < 5 seconds for 100-page PDF with annotations

### Feature Completeness
- ✓ All essential features from PRD implemented
- ✓ No critical bugs
- ✓ Keyboard shortcuts work
- ✓ Accessible to screen readers
- ✓ Works in Chrome, Firefox, Safari

### Code Quality
- TypeScript strict mode enabled
- No console errors or warnings
- ESLint passes with no violations
- All public APIs documented
- Unit test coverage > 70%
