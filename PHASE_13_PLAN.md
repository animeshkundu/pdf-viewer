# Phase 13: Watermarks Implementation Plan

**Phase**: 13 - Watermark Feature for Document Branding  
**Status**: 🚧 IN PROGRESS  
**Start Date**: 2025-01-27  
**Estimated Duration**: 2-3 hours

---

## Executive Summary

Phase 13 adds watermark functionality to allow users to brand, mark ownership, or indicate status (e.g., "DRAFT", "CONFIDENTIAL") on PDF documents. Watermarks are text-based overlays applied during export with full control over appearance, position, and page range.

---

## Goals

1. **Text Watermarks**: Support custom text watermarks
2. **Visual Control**: Font size, color, opacity, rotation
3. **Positioning**: Presets (center, diagonal) and custom positioning
4. **Page Targeting**: Apply to all pages or specific page ranges
5. **Export Integration**: Embed watermarks during PDF export
6. **Professional UI**: Clean dialog with live preview

---

## Features to Implement

### 1. Watermark Type System ✅

**File**: `src/types/watermark.types.ts`

**Interfaces**:
```typescript
export interface Watermark {
  id: string
  text: string
  fontSize: number
  color: string
  opacity: number
  rotation: number
  position: WatermarkPosition
  customX?: number
  customY?: number
  pageRange: PageRange
}

export type WatermarkPosition = 
  | 'center' 
  | 'diagonal'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom'

export type PageRange = 
  | { type: 'all' }
  | { type: 'range'; start: number; end: number }
  | { type: 'specific'; pages: number[] }
```

---

### 2. Watermark Service ✅

**File**: `src/services/watermark.service.ts`

**Capabilities**:
- `createWatermark()` - Create watermark configuration
- `updateWatermark()` - Modify watermark settings
- `deleteWatermark()` - Remove watermark
- `getWatermark()` - Retrieve current watermark
- `applyWatermarksToPDF()` - Embed watermarks in PDF during export
- Position calculation helpers
- Page filtering logic

**Key Methods**:
```typescript
async applyWatermarksToPDF(
  pdfDoc: PDFDocument,
  watermark: Watermark
): Promise<void> {
  const pages = pdfDoc.getPages()
  const targetPages = this.getTargetPages(pages, watermark.pageRange)
  
  for (const page of targetPages) {
    const { width, height } = page.getSize()
    const position = this.calculatePosition(watermark, width, height)
    
    page.drawText(watermark.text, {
      x: position.x,
      y: position.y,
      size: watermark.fontSize,
      color: this.convertColor(watermark.color),
      opacity: watermark.opacity,
      rotate: degrees(watermark.rotation)
    })
  }
}
```

---

### 3. Watermark Hook & Context ✅

**File**: `src/hooks/useWatermark.tsx`

**Capabilities**:
- React context for watermark state
- Methods to create, update, delete watermark
- Provider component
- Integration with app lifecycle

**Context Interface**:
```typescript
interface WatermarkContextValue {
  watermark: Watermark | null
  setWatermark: (watermark: Watermark) => void
  removeWatermark: () => void
  hasWatermark: boolean
}
```

---

### 4. Watermark Dialog Component ✅

**File**: `src/components/WatermarkDialog.tsx`

**UI Features**:
- Text input for watermark content
- Font size slider (12px - 72px)
- Color picker (using existing color utilities)
- Opacity slider (0.1 - 1.0)
- Rotation slider (-45° to 45°)
- Position selector (radio buttons for presets)
- Page range selector:
  - All pages (default)
  - Page range (start - end)
  - Specific pages (comma-separated)
- Live preview on first page
- Apply/Cancel buttons
- Clear watermark option

**Layout**:
```
┌─────────────────────────────────┐
│ Add Watermark                    │
├─────────────────────────────────┤
│ Text: [CONFIDENTIAL        ]     │
│                                   │
│ Font Size: [32] ●─────────       │
│ Opacity:   [0.3] ●────────       │
│ Rotation:  [45°] ●────────       │
│                                   │
│ Color: [Color Picker]             │
│                                   │
│ Position:                         │
│ ○ Center    ○ Diagonal            │
│ ○ Top Left  ○ Top Center          │
│ ○ Top Right ○ Bottom Left         │
│ ○ Bottom Center ○ Bottom Right    │
│                                   │
│ Apply to:                         │
│ ○ All pages                       │
│ ○ Page range: [1] to [10]        │
│                                   │
│ [Preview]                         │
│                                   │
│ [Cancel] [Remove] [Apply]         │
└─────────────────────────────────┘
```

---

### 5. Toolbar Integration ✅

**File**: `src/components/Toolbar/Toolbar.tsx`

**Changes**:
- Add "Watermark" button to toolbar
- Icon: `Stamp` or `Seal` from Phosphor
- Opens watermark dialog
- Visual indicator when watermark is active
- Position in Document section

---

### 6. Export Service Integration ✅

**File**: `src/services/export.service.ts`

**Changes**:
- Add watermark parameter to `exportPDF()`
- Call `applyWatermarksToPDF()` before annotations
- Progress tracking for watermark application

**Export Order** (Updated):
1. Load original PDF
2. Apply page transformations (rotate/delete/reorder)
3. Insert blank pages
4. **Apply watermark** ← NEW
5. Fill form fields (if any)
6. Embed annotations

---

### 7. Export Dialog Updates ✅

**File**: `src/components/ExportDialog.tsx`

**Changes**:
- Show watermark indicator in changes summary
- Display watermark text preview
- Pass watermark to export service

**Display**:
```typescript
{hasWatermark && (
  <div className="flex items-center gap-2">
    <Stamp className="w-4 h-4" />
    <span>Watermark: "{watermark.text}"</span>
  </div>
)}
```

---

## Technical Architecture

### Type System
```
types/
└── watermark.types.ts
    ├── Watermark interface
    ├── WatermarkPosition type
    └── PageRange type
```

### Service Layer
```
services/
└── watermark.service.ts
    ├── WatermarkService class
    ├── Position calculation
    ├── Page filtering
    └── PDF embedding logic
```

### State Management
```
hooks/
└── useWatermark.tsx
    ├── WatermarkProvider
    ├── useWatermark hook
    └── Context management
```

### Components
```
components/
├── WatermarkDialog.tsx
│   ├── Configuration form
│   ├── Position selector
│   └── Page range selector
└── Toolbar/
    └── Toolbar.tsx (watermark button)
```

---

## Implementation Checklist

### Core Types & Service
- [ ] Create `watermark.types.ts` with interfaces
- [ ] Create `WatermarkService` class
- [ ] Implement `applyWatermarksToPDF()` method
- [ ] Implement position calculation helpers
- [ ] Implement page filtering logic
- [ ] Add color conversion utilities
- [ ] Add coordinate calculation for positions

### State Management
- [ ] Create `useWatermark` hook
- [ ] Create `WatermarkProvider` component
- [ ] Integrate with App.tsx
- [ ] Handle watermark lifecycle

### UI Components
- [ ] Create `WatermarkDialog` component
- [ ] Text input field
- [ ] Font size slider
- [ ] Opacity slider
- [ ] Rotation slider
- [ ] Color picker integration
- [ ] Position selector (radio buttons)
- [ ] Page range selector
- [ ] Apply/Cancel/Remove buttons
- [ ] Add watermark button to Toolbar

### Integration
- [ ] Update `ExportService` to apply watermarks
- [ ] Update `ExportDialog` to show watermark indicator
- [ ] Add watermark to unsaved changes detection
- [ ] Update progress tracking for watermark step

### Testing
- [ ] Test text watermark rendering
- [ ] Test all position presets
- [ ] Test rotation angles
- [ ] Test opacity levels
- [ ] Test page range: all pages
- [ ] Test page range: specific range
- [ ] Test color variations
- [ ] Test font sizes
- [ ] Test export with watermark
- [ ] Test remove watermark
- [ ] Test with other transformations

### Documentation
- [ ] Create `PHASE_13_COMPLETION.md`
- [ ] Update `IMPLEMENTATION_STATUS.md`
- [ ] Update PRD if needed
- [ ] Add watermark to feature list

---

## Acceptance Criteria

### Watermark Creation ✅
- [ ] Can create text watermark
- [ ] Font size adjustable (12-72px)
- [ ] Opacity adjustable (0.1-1.0)
- [ ] Rotation adjustable (-45° to 45°)
- [ ] Color selectable
- [ ] Position presets work correctly
- [ ] Page range options work

### Watermark Export ✅
- [ ] Watermark embeds in exported PDF
- [ ] Appears on correct pages
- [ ] Position accurate across zoom levels
- [ ] Opacity renders correctly
- [ ] Rotation renders correctly
- [ ] Works with other transformations
- [ ] No corruption of original content

### User Experience ✅
- [ ] Dialog is intuitive and clear
- [ ] Visual feedback for all actions
- [ ] Can remove watermark
- [ ] Unsaved changes tracked
- [ ] Export dialog shows watermark status
- [ ] Toast notifications for actions

---

## Design Decisions

### Watermark Presets

**Common Use Cases**:
- "DRAFT" - diagonal across page
- "CONFIDENTIAL" - center, semi-transparent
- "COPY" - bottom right corner
- "© 2024 Company Name" - bottom center

**Position Presets**:
- **Center**: Centered both horizontally and vertically
- **Diagonal**: 45° angle from bottom-left to top-right
- **Corners**: 9 standard positions (top/middle/bottom × left/center/right)

### Default Values
```typescript
const DEFAULT_WATERMARK: Partial<Watermark> = {
  fontSize: 48,
  color: 'oklch(0.5 0 0)',  // Medium gray
  opacity: 0.3,
  rotation: 45,
  position: 'diagonal',
  pageRange: { type: 'all' }
}
```

### Font Choice
- Use Helvetica (standard PDF font)
- No custom font embedding (keeps file size low)
- Bold weight for better visibility

---

## Performance Considerations

### PDF Generation
- Watermarks add minimal overhead
- Text rendering is fast in pdf-lib
- No images to encode

### Memory
- Single watermark config (~1KB)
- No preview caching needed
- Minimal state footprint

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Position calculation errors | Medium | Low | Extensive testing, visual preview |
| Color conversion issues | Low | Low | Use proven OKLCH to RGB converter |
| Page range parsing errors | Medium | Medium | Clear validation, helpful error messages |
| Watermark obscures content | High | Medium | Default opacity 0.3, clear preview |

---

## Success Metrics

### Quantitative
- Watermark renders correctly on 100% of pages
- Export time increase <500ms for 100 pages
- Zero corruption of original content
- Position accuracy within 1px

### Qualitative
- Intuitive dialog design
- Clear visual feedback
- Professional-looking watermarks
- Flexible configuration options

---

## Timeline

### Hour 1: Core Implementation
- Types and service layer
- Position calculation logic
- Export integration

### Hour 2: UI Components
- WatermarkDialog component
- Form controls (sliders, inputs)
- Position selector
- Page range selector

### Hour 3: Integration & Testing
- Hook and context
- Toolbar integration
- Export dialog updates
- Testing and refinement

---

## Next Phase Ideas

**Phase 14: Page Numbers** (complementary feature)
- Automatic page numbering
- Format options (1, i, a, etc.)
- Position options
- Start page configuration

**Alternative: Performance Optimization**
- Render caching improvements
- Large file handling
- Memory management

**Alternative: User Preferences**
- Save annotation presets
- Default zoom level
- Default tools
- UI customization

---

**Status**: Ready to begin implementation  
**Created**: 2025-01-27  
**Priority**: MEDIUM (Professional feature, enhances document branding)
