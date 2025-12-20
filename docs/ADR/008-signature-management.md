# ADR-008: Signature Management with Persistent Storage

**Date**: 2025-01-27  
**Status**: Implemented  
**Phase**: Phase 4 - Signatures & Forms

## Context

Phase 4 requires implementing a comprehensive signature management system that allows users to create, save, and quickly insert signatures into PDF documents. The system must:
- Store up to 5 signatures persistently
- Support drawing signatures with mouse/trackpad
- Support uploading signature images
- Enable resizing and repositioning of placed signatures
- Provide transparent backgrounds for signatures
- Work entirely client-side for privacy

## Decision

### Storage Strategy
We implemented a dedicated `SignatureService` that uses **Spark KV** for persistent storage:
- Signatures stored under key `'pdf-editor-signatures'`
- Maximum 5 signatures enforced
- Each signature includes: id, name, imageData (base64), width, height, timestamp

**Rationale**: Spark KV provides:
- Simple async API for client-side storage
- No backend infrastructure required
- Data persists between sessions
- Privacy-preserving (all local)

### Signature Creation

**Two Methods**:
1. **Draw Signature**: Canvas-based drawing with adjustable pen thickness
2. **Upload Image**: File upload with automatic resizing and format conversion

**Image Processing**:
- Auto-crop to signature bounds with padding
- Convert to PNG with transparent background
- Maximum dimensions: 400x200px (maintains aspect ratio)
- Base64 encoding for easy storage and embedding

**Rationale**: 
- Canvas provides smooth drawing experience
- Auto-cropping removes unnecessary whitespace
- PNG format supports transparency
- Size limits prevent excessive storage usage

### Signature Management UI

**Tabbed Interface**:
- Tab 1: Saved signatures (grid view with delete option)
- Tab 2: Draw new signature (canvas + name input)
- Tab 3: Upload image (file picker + name input)

**Features**:
- Visual signature counter (e.g., "Saved (3/5)")
- Preview before saving
- Named signatures for organization
- Delete with confirmation
- Tabs disabled when limit reached

**Rationale**:
- Three-tab pattern keeps interface organized
- Visual feedback on capacity prevents user confusion
- Grid layout allows quick signature selection

### Signature Placement & Manipulation

**Enhanced `DraggableSignature` Component**:
- **Click to select**: Shows selection border and resize handles
- **Drag to move**: Mouse-based repositioning
- **Corner handles**: 4 resize handles (nw, ne, sw, se)
- **Aspect ratio lock**: Maintains original proportions during resize
- **Minimum size**: 50px to prevent invisible signatures

**Rationale**:
- Direct manipulation feels intuitive (matches Preview on Mac)
- Corner handles are familiar UI pattern
- Aspect ratio lock prevents distortion
- Separate component keeps concerns isolated

### Integration Points

1. **MarkupToolbar**: Signature button opens manager dialog
2. **SignatureManager**: Modal dialog for all signature operations
3. **AnnotationLayer**: Replaced static SignatureRenderer with DraggableSignature
4. **AnnotationService**: No changes needed (already supports signature annotations)

## Alternatives Considered

### Storage
- **LocalStorage**: Too limited (5-10MB), string-only
- **IndexedDB**: Overly complex API for this use case
- ✅ **Spark KV**: Perfect balance of simplicity and capability

### Image Format
- **SVG**: Would support infinite scaling but complex to generate from canvas
- ✅ **PNG**: Wide support, transparency, sufficient quality for signatures
- **JPEG**: No transparency support

### Manipulation Approach
- **Transform controls library**: External dependency, heavier bundle
- ✅ **Custom resize handles**: Lightweight, full control, matches design system

## Consequences

### Positive
- ✅ Signatures persist between sessions
- ✅ No server required (privacy)
- ✅ Fast signature insertion workflow
- ✅ Professional appearance with resize/move
- ✅ Intuitive UI matches user expectations
- ✅ Clean separation of concerns

### Negative
- ⚠️ 5 signature limit (mitigated by good UX showing count)
- ⚠️ No cross-device sync (acceptable for privacy-first tool)
- ⚠️ Large signatures consume more storage (mitigated by 400x200 limit)

### Neutral
- Canvas drawing requires mouse/trackpad (touch support possible future enhancement)
- Signatures stored as images (not vector), but quality sufficient for PDF use

## Implementation Details

### Key Files Created
- `src/services/signature.service.ts` - Core signature CRUD operations
- `src/components/SignatureManager/SignatureManager.tsx` - Management dialog
- `src/components/AnnotationLayer/DraggableSignature.tsx` - Interactive signature component

### Key Files Modified
- `src/components/MarkupToolbar/MarkupToolbar.tsx` - Added signature manager integration
- `src/components/AnnotationLayer/AnnotationLayer.tsx` - Replaced static with draggable signatures
- `src/vite-end.d.ts` - Added Spark global types

### Storage Schema
```typescript
interface SavedSignature {
  id: string           // UUID
  name: string         // User-provided or auto-generated
  imageData: string    // Base64 PNG data URL
  width: number        // Original width
  height: number       // Original height
  timestamp: number    // Creation time
}
```

## Testing Recommendations

1. **Storage**:
   - Create 5 signatures, verify 6th shows error
   - Reload page, verify signatures persist
   - Delete signature, verify removal

2. **Drawing**:
   - Test various pen thicknesses
   - Verify clear button works
   - Test signature bounds cropping

3. **Upload**:
   - Test PNG, JPG, GIF formats
   - Test oversized images (verify resize)
   - Test images with/without transparency

4. **Manipulation**:
   - Drag signature to new position
   - Resize from each corner
   - Verify aspect ratio maintained
   - Test minimum size limit

5. **Integration**:
   - Place signature on multiple pages
   - Verify signatures scale with zoom
   - Test undo/redo with signatures
   - Verify signatures export (Phase 6)

## Future Enhancements

1. **Touch Support**: Add touch gesture support for tablets
2. **Signature Templates**: Pre-designed signature styles
3. **Cloud Sync**: Optional account-based sync (with consent)
4. **Digital Signatures**: Cryptographic signing (Phase 6 extension)
5. **Batch Operations**: Apply signature to multiple pages at once
6. **Signature History**: Track when/where signatures used

## References

- PRD Section 5: Signature Creation & Insertion
- Phase 4 Implementation Plan
- Spark Runtime SDK: KV API
- HTML Canvas API
- File API for image upload
