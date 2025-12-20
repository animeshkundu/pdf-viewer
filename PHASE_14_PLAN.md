# Phase 14 Implementation Plan: Page Numbers

## Overview
Implement automatic page numbering functionality that allows users to add customizable page numbers to their PDF documents. This feature complements the watermark feature and provides professional document organization.

## Scope

### In Scope ✅
- Text-based page numbers (1, 2, 3... or Page 1, Page 2, etc.)
- Position presets (6 common positions)
- Font size customization (8-24px)
- Number format options (numeric, with prefix/suffix)
- Page range targeting (all, range)
- Start number customization (start from any number)
- Color customization (6 presets)
- Export integration

### Out of Scope ❌
- Roman numerals (future enhancement)
- Different numbering for different sections
- Chapter/section numbering
- Custom number templates beyond simple prefix/suffix

## Architecture

### Type System
**File**: `src/types/page-number.types.ts`

```typescript
export interface PageNumberConfig {
  id: string
  enabled: boolean
  position: PageNumberPosition
  format: PageNumberFormat
  fontSize: number
  color: string
  startNumber: number
  prefix: string
  suffix: string
  pageRange: PageRange
}

export type PageNumberPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right'
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right'

export type PageNumberFormat = 'numeric' | 'text'
// 'numeric': 1, 2, 3...
// 'text': Page 1, Page 2, Page 3...

export interface PageRange {
  type: 'all' | 'range'
  start?: number
  end?: number
}
```

### Service Layer
**File**: `src/services/page-number.service.ts`

**Key Methods**:
- `applyPageNumbersToPDF()` - Embeds page numbers in PDF
- `getTargetPages()` - Filters pages based on range
- `calculatePosition()` - Computes page number position
- `formatPageNumber()` - Formats number with prefix/suffix
- `convertColor()` - Color conversion (OKLCH/hex/rgb)

### State Management
**File**: `src/hooks/usePageNumber.tsx`

**Context Interface**:
```typescript
interface PageNumberContextValue {
  pageNumberConfig: PageNumberConfig | null
  setPageNumberConfig: (config: PageNumberConfig) => void
  removePageNumberConfig: () => void
  hasPageNumbers: boolean
}
```

### UI Components
**File**: `src/components/PageNumberDialog.tsx`

**Features**:
- Position selector (6 radio buttons)
- Format toggle (Numeric / Text)
- Font size slider (8-24px)
- Color picker (6 presets)
- Start number input
- Prefix/suffix inputs
- Page range selector (All / Range)
- Apply/Remove/Cancel actions

## Implementation Steps

### Step 1: Type Definitions
Create `src/types/page-number.types.ts` with complete type system.

### Step 2: Service Layer
Create `src/services/page-number.service.ts` with PDF embedding logic.

### Step 3: State Management
Create `src/hooks/usePageNumber.tsx` with React context.

### Step 4: UI Dialog
Create `src/components/PageNumberDialog.tsx` with configuration interface.

### Step 5: Toolbar Integration
Add page number button to toolbar with visual indicator.

### Step 6: Export Integration
Update export service to apply page numbers before annotations.

### Step 7: App Integration
Wire up providers, dialog state, and unsaved changes tracking.

### Step 8: Overlay Preview
Create page number overlay for live preview in viewer.

## Position Calculations

**Standard Positions** (with margins):
- Top-left: (50, pageHeight - 30)
- Top-center: (pageWidth / 2, pageHeight - 30)
- Top-right: (pageWidth - 50, pageHeight - 30)
- Bottom-left: (50, 30)
- Bottom-center: (pageWidth / 2, 30)
- Bottom-right: (pageWidth - 50, 30)

**Text Alignment**:
- Left positions: left-aligned text
- Center positions: center-aligned text
- Right positions: right-aligned text

## Format Examples

**Numeric**: 1, 2, 3, 4...
**Text**: Page 1, Page 2, Page 3...
**With Prefix**: Draft - 1, Draft - 2...
**With Suffix**: 1 of 100, 2 of 100...
**Custom**: Chapter 1 - Page 1, Chapter 1 - Page 2...

## Export Order

Updated export pipeline:
1. Load original PDF
2. Apply page transformations (rotate/delete/reorder)
3. Insert blank pages
4. **Apply page numbers** ← NEW (30% progress)
5. Apply watermark (35% progress)
6. Fill form fields (50% progress)
7. Embed annotations (70% progress)
8. Generate final PDF (90% progress)

## UI/UX Design

### Dialog Layout
```
┌─────────────────────────────────┐
│ Add Page Numbers                 │
├─────────────────────────────────┤
│ Position:                         │
│ ○ Top Left     ● Top Center      │
│ ○ Top Right                       │
│ ○ Bottom Left  ○ Bottom Center   │
│ ○ Bottom Right                    │
│                                   │
│ Format: [Numeric ▼]               │
│ Font Size: [12] ●─────────        │
│                                   │
│ Color: [◼ Gray] [◼ Light Gray]   │
│        [◼ Dark] [◼ Blue] ...      │
│                                   │
│ Start from: [1        ]           │
│ Prefix: [                    ]    │
│ Suffix: [                    ]    │
│                                   │
│ Apply to: [All Pages] [Range]    │
│                                   │
│ [Cancel] [Remove] [Apply]         │
└─────────────────────────────────┘
```

### Toolbar Button
- Icon: `NumberSquareOne` (Phosphor Icons)
- Position: Between Watermark and Export buttons
- Visual indicator: Filled icon when page numbers active
- Tooltip: "Add Page Numbers"

## Acceptance Criteria

### Configuration ✅
- [ ] Can set position (6 presets)
- [ ] Can choose format (numeric/text)
- [ ] Can adjust font size (8-24px)
- [ ] Can select color (6 presets)
- [ ] Can set start number
- [ ] Can add prefix/suffix
- [ ] Can target all pages or range

### Export ✅
- [ ] Page numbers embed correctly in PDF
- [ ] Position accurate at all page sizes
- [ ] Numbers sequential and correct
- [ ] Format applied correctly
- [ ] Works with page transformations
- [ ] Works with other features (watermarks, annotations)

### User Experience ✅
- [ ] Dialog is intuitive and clear
- [ ] Visual feedback for actions
- [ ] Can remove page numbers
- [ ] Unsaved changes tracked
- [ ] Export dialog shows page number status
- [ ] Toast notifications
- [ ] Toolbar button shows active state
- [ ] Live preview in viewer

## Technical Considerations

### Page Number Positioning
- Page numbers must respect page dimensions
- Different sized pages need adjusted positioning
- Text alignment varies by position (left/center/right)

### Page Number Calculation
- Account for page reordering (use display index, not original)
- Account for page deletions (skip deleted pages)
- Account for blank pages (include in numbering)
- Start number offset applied correctly

### Coordinate System
- PDF uses bottom-left origin
- Convert from top-left to bottom-left
- Account for text height in positioning

### Color Conversion
- Reuse OKLCH to RGB conversion from watermark service
- Support hex and rgb() formats as fallback

## Testing Strategy

### Unit Tests
- Format generation with various options
- Position calculations
- Page filtering logic
- Number calculation with transformations

### Integration Tests
- Export with page numbers
- Page numbers + watermarks
- Page numbers + annotations
- Page numbers with page reordering
- Page numbers with page deletion

### Manual Tests
- All 6 positions
- Both formats
- Various font sizes
- All color options
- Start number variations
- Prefix/suffix combinations
- Page range targeting
- Export and verify in PDF reader

## Performance

### Targets
- Dialog opens: <100ms
- Page number calculation: <10ms per page
- Export with page numbers: <100ms added for 100 pages
- No impact on viewer performance
- No memory leaks

### Optimizations
- Reuse watermark color conversion logic
- Cache font metrics
- Batch page number operations
- Efficient page range filtering

## Known Limitations

1. **Single Configuration**: Only one page numbering scheme per document
2. **No Roman Numerals**: Only Arabic numerals supported initially
3. **No Section Breaks**: Cannot have different numbering for sections
4. **Text Only**: No decorative elements or backgrounds
5. **Font Fixed**: Uses Helvetica font (same as watermarks)

## Future Enhancements

1. Roman numeral format (I, II, III, IV...)
2. Letter format (A, B, C, D...)
3. Multiple numbering schemes per document
4. Section/chapter support
5. Custom templates
6. Background boxes for page numbers
7. Header/footer integration
8. Total page count in format (e.g., "1 of 100")

## Timeline

**Estimated Duration**: 3-4 hours

- Step 1-2: Type & Service (45 min)
- Step 3-4: State & UI (90 min)
- Step 5-7: Integration (45 min)
- Step 8: Preview Overlay (30 min)
- Testing & Polish (30 min)

## Success Metrics

### Quantitative
- 6 position options functional
- 2 format options working
- Font size range 8-24px
- 6 color presets available
- Page range targeting works
- Zero runtime errors

### Qualitative
- Intuitive dialog design
- Professional appearance in PDFs
- Clear visual feedback
- Flexible configuration options
- Smooth workflow (4 clicks: open, configure, apply, export)
- Matches PRD design excellence standards

## Dependencies

- pdf-lib (already installed)
- Existing watermark service (color conversion reuse)
- Existing page management (page tracking)
- Existing export service (integration point)

## Risks & Mitigations

**Risk**: Page numbers conflict with watermarks
**Mitigation**: Apply page numbers before watermarks in export order

**Risk**: Page numbers overlap with content
**Mitigation**: Provide reasonable margins (30px from edges)

**Risk**: Small font sizes unreadable
**Mitigation**: Set minimum font size to 8px

**Risk**: Page number calculation wrong after reordering
**Mitigation**: Use display index, not original page number

## Rollout Plan

1. Implement core functionality
2. Test with various page transformations
3. Test with other features (watermarks, annotations)
4. Manual testing in multiple PDF readers
5. Update PRD completion document
6. Create Phase 14 completion report
7. Provide next step suggestions

---

**Status**: Ready to implement
**Priority**: MEDIUM
**Effort**: 3-4 hours
