# Mobile & Responsive Design Guide

## Overview

The PDF Viewer & Editor is fully responsive and optimized for mobile devices, tablets, and desktops. This guide documents the responsive design patterns and mobile-specific optimizations.

---

## Responsive Breakpoints

### Tailwind Breakpoints
```css
sm: 640px   /* Small devices (landscape phones) */
md: 768px   /* Medium devices (tablets) */
lg: 1024px  /* Large devices (desktops) */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* Ultra-wide screens */
```

### Custom Mobile Detection
```typescript
// src/hooks/use-mobile.ts
const MOBILE_BREAKPOINT = 768
export function useIsMobile() {
  return window.innerWidth < MOBILE_BREAKPOINT
}
```

---

## Mobile-Optimized Components

### 1. Toolbar

#### Desktop Layout
- Full button labels visible
- All controls visible
- Horizontal spacing: 16px

#### Mobile Layout (<768px)
- Icon-only buttons (labels hidden with `sm:inline`)
- Reduced spacing: 8px
- Keyboard shortcuts button hidden on mobile
- Zoom in/out buttons hidden (dropdown only)

**Implementation**:
```tsx
<Button className="gap-2">
  <FolderOpen size={20} />
  <span className="hidden sm:inline">Open File</span>
</Button>
```

---

### 2. Sidebar

#### Desktop
- Width: 240px
- Always visible (unless toggled off)
- Smooth slide animation

#### Mobile (<768px)
- Overlay mode (covers content)
- Width: 80% of screen
- Swipe to close (future enhancement)
- Backdrop blur effect

**Future Enhancement**: Touch gestures
```typescript
// Planned: Swipe-to-close
const handleTouchStart = (e: TouchEvent) => {
  // Track touch start position
}
const handleTouchMove = (e: TouchEvent) => {
  // If swipe right detected, close sidebar
}
```

---

### 3. Markup Toolbar

#### Desktop
- Horizontal layout
- All tools visible
- Tooltip on hover

#### Mobile
- May need vertical layout or scrollable horizontal (future)
- Touch-friendly button sizes (44x44px minimum)
- Long-press for additional options (future)

---

### 4. PDF Canvas

#### Touch Interactions
- **Pinch to Zoom**: Planned future enhancement
- **Two-finger scroll**: Native browser behavior
- **Tap**: Select annotation or navigate
- **Long-press**: Context menu (future)

#### Viewport Scaling
Canvas automatically adjusts to screen size:
```typescript
const viewport = page.getViewport({ 
  scale: zoom === -1 ? fitToWidth : zoom * devicePixelRatio 
})
```

---

## Touch-Friendly Design

### Minimum Touch Targets
All interactive elements meet or exceed 44x44px (iOS HIG, Material Design)

**Buttons**:
```tsx
<Button size="icon">  {/* 40x40px + padding = 44x44px */}
  <Icon size={20} />
</Button>
```

### Touch Feedback
- Active state on touch: `button-press:active` class
- Visual feedback: scale(0.96) transform
- Haptic feedback: Planned for future

---

## Mobile Performance Optimizations

### 1. Reduced Initial Load
Mobile devices load with:
- Lower initial zoom (fit to width)
- Fewer pre-rendered pages (smaller buffer)
- Smaller thumbnail cache

### 2. Memory Management
Mobile devices have stricter memory limits:
- Canvas cache size: 25MB (vs 50MB desktop)
- Thumbnail quality: 0.25 scale (vs 0.3 desktop)
- Aggressive cleanup on memory pressure

**Planned**:
```typescript
// Detect memory pressure
if (navigator.deviceMemory && navigator.deviceMemory < 4) {
  MAX_CACHE_SIZE = 25 * 1024 * 1024  // 25MB for low-memory devices
}
```

### 3. Gesture Support
Native browser gestures are supported:
- Two-finger pinch: Zoom
- Two-finger scroll: Pan
- Double-tap: Zoom to 200%

**Custom gestures** (planned):
- Swipe left/right: Previous/next page
- Swipe down from top: Show toolbar
- Long-press: Context menu

---

## Responsive Typography

### Font Scaling
Text remains readable across all screen sizes:

```css
/* Mobile */
--font-size-sm: 11px;
--font-size-md: 13px;
--font-size-lg: 15px;

/* Desktop (md+) */
--font-size-sm: 12px;
--font-size-md: 14px;
--font-size-lg: 16px;
```

### Line Height
Mobile uses slightly increased line height for readability:
- Mobile: 1.6
- Desktop: 1.5

---

## Mobile Annotation Tools

### Current State
All annotation tools work on mobile with touch:
- ✅ Highlight: Touch and drag
- ✅ Pen: Touch drawing
- ✅ Text: Touch to place, on-screen keyboard
- ✅ Shapes: Touch and drag
- ✅ Signature: Touch drawing

### Touch Drawing Optimizations
```typescript
const handleTouchMove = (e: TouchEvent) => {
  e.preventDefault()  // Prevent scroll during drawing
  const touch = e.touches[0]
  // Draw stroke
}
```

### Future Enhancements
- Palm rejection for stylus drawing
- Pressure sensitivity (Apple Pencil, S Pen)
- Undo gesture (3-finger tap)

---

## Portrait vs Landscape

### Portrait Mode (Default)
- Sidebar overlay
- Vertical toolbar
- Single-column layout
- Larger touch targets

### Landscape Mode
- Sidebar can be persistent (tablets)
- Horizontal toolbar
- More screen real estate for content

**Media query detection**:
```typescript
const isPortrait = window.innerHeight > window.innerWidth
```

---

## Tablet Optimization

### iPad/Android Tablets (768px - 1024px)
- Hybrid layout: Sidebar visible + content
- Full toolbar with labels
- Stylus support (Apple Pencil, S Pen)
- Split-screen multitasking support

---

## Testing Checklist

### Devices to Test
- [ ] iPhone (Safari)
- [ ] Android Phone (Chrome)
- [ ] iPad (Safari)
- [ ] Android Tablet (Chrome)
- [ ] Various screen sizes (320px - 1920px)

### Features to Test
- [ ] Open and load PDF
- [ ] Navigate pages with touch
- [ ] Zoom with pinch gesture
- [ ] Draw annotations with touch
- [ ] Sidebar overlay on mobile
- [ ] Toolbar responsiveness
- [ ] Keyboard (on-screen) for text input
- [ ] Rotation (portrait ↔ landscape)
- [ ] Performance (60fps on mid-range devices)

### Browser Testing
- [ ] Safari iOS (primary)
- [ ] Chrome Android (primary)
- [ ] Firefox Mobile
- [ ] Samsung Internet
- [ ] Edge Mobile

---

## Known Mobile Limitations

### Current Limitations
1. **No Native App Features**
   - No file system integration
   - No background processing
   - Limited offline support

2. **Browser Constraints**
   - PDF size limit: ~100MB on mobile
   - Memory limit: varies by device/browser
   - No clipboard API on some browsers

3. **Touch Precision**
   - Fine annotation placement harder than mouse
   - Small UI elements can be challenging
   - Accidental touches more common

### Workarounds
- Larger touch targets (44x44px minimum)
- Zoom in for precise annotation placement
- Undo always available
- Clear visual feedback

---

## Accessibility on Mobile

### Screen Reader Support
- VoiceOver (iOS)
- TalkBack (Android)
- All features accessible via screen reader
- Descriptive labels on all controls

### Motor Impairments
- Large touch targets
- No fine motor skills required
- Alternative input methods supported
- Keyboard navigation (external keyboards)

### Visual Impairments
- Text scales with system settings
- High contrast mode respected
- Zoom up to 400% supported

---

## PWA Features (Future)

### Planned Progressive Web App Features
- [ ] Install to home screen
- [ ] Offline support via Service Worker
- [ ] Background sync for exports
- [ ] Native share API integration
- [ ] File handling API (open PDF from file manager)

**Manifest** (planned):
```json
{
  "name": "PDF Viewer & Editor",
  "short_name": "PDF Editor",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

## Performance Targets (Mobile)

### Load Time
- Small PDF (<10 pages): <1s
- Medium PDF (50 pages): <3s
- Large PDF (100+ pages): <6s

### Scrolling
- Target: 60fps on iPhone 12+, Pixel 5+
- Acceptable: 30fps on older devices

### Memory
- Target: <200MB for typical use
- Maximum: <400MB before cleanup

### Battery
- Minimal battery drain during viewing
- Efficient during annotation (no polling)

---

## Responsive CSS Patterns

### Hidden on Mobile
```tsx
<div className="hidden md:block">
  Desktop only content
</div>
```

### Different Layouts
```tsx
<div className="flex-col md:flex-row">
  {/* Vertical on mobile, horizontal on desktop */}
</div>
```

### Responsive Spacing
```tsx
<div className="gap-2 md:gap-4 px-2 md:px-4">
  {/* Smaller spacing on mobile */}
</div>
```

### Responsive Text
```tsx
<h1 className="text-xl md:text-2xl lg:text-3xl">
  {/* Scales up on larger screens */}
</h1>
```

---

## Best Practices

### Do's ✅
- Test on real devices (not just simulators)
- Use native touch events
- Provide visual feedback for all interactions
- Respect system preferences (dark mode, text size)
- Handle orientation changes gracefully
- Optimize for battery life
- Support offline viewing (cached docs)

### Don'ts ❌
- Don't require hover for critical features
- Don't use tiny touch targets (<44px)
- Don't prevent native gestures unnecessarily
- Don't assume landscape orientation
- Don't ignore memory constraints
- Don't block on-screen keyboard
- Don't forget to test on slow networks

---

## Future Mobile Enhancements

### High Priority
- [ ] Touch gestures (swipe, pinch, rotate)
- [ ] Stylus/Apple Pencil optimization
- [ ] Offline mode (Service Worker)
- [ ] Native share integration

### Medium Priority
- [ ] Palm rejection
- [ ] Pressure-sensitive drawing
- [ ] Split-screen support optimization
- [ ] Haptic feedback

### Low Priority
- [ ] Augmented reality features
- [ ] Voice commands
- [ ] AI-powered suggestions
- [ ] Collaborative editing

---

## Resources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [Touch Events Specification](https://www.w3.org/TR/touch-events/)
- [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)

---

**Last Updated**: 2025-01-27  
**Maintained By**: Development Team
