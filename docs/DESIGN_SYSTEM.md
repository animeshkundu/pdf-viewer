# Design System

## Design Principles

1. **Content First**: UI disappears when reading, assists when acting
2. **Calm & Professional**: Understated elegance, no unnecessary flourishes
3. **Spatial Clarity**: Everything has a place, clear visual hierarchy
4. **Physics-Based Motion**: Natural, weighted animations

## Color Palette

### Foundation Colors

```css
/* Neutrals - UI Chrome */
--canvas-gray: oklch(0.96 0.005 270);     /* Main backgrounds */
--dove-gray: oklch(0.85 0.008 270);       /* Secondary backgrounds */
--slate-gray: oklch(0.65 0.01 270);       /* Inactive elements */
--deep-charcoal: oklch(0.28 0.01 270);    /* Primary actions */
```

### Accent Colors

```css
/* Interactive */
--ocean-blue: oklch(0.55 0.18 240);       /* Links, active states */
--alert-red: oklch(0.55 0.22 25);         /* Destructive actions */
```

### Annotation Colors

```css
/* User-created content */
--sunshine-yellow: oklch(0.88 0.15 90);   /* Default highlight */
--coral-pink: oklch(0.75 0.15 25);        /* Secondary highlight */
--mint-green: oklch(0.82 0.12 155);       /* Success highlight */
--lavender: oklch(0.70 0.12 290);         /* Review highlight */
--sky-blue: oklch(0.75 0.12 230);         /* Info highlight */
```

## Typography

### Font Stack

**Primary**: Inter Variable
- UI chrome, body text, buttons
- Weights: 400 (Regular), 500 (Medium), 600 (SemiBold)

**Monospace**: JetBrains Mono
- Technical data (page numbers, file sizes)
- Weight: 400 (Regular)

### Type Scale

| Element | Style | Use Case |
|---------|-------|----------|
| **H1** | Inter SemiBold / 32px / -0.02em | Empty state title |
| **H2** | Inter Medium / 20px / -0.01em | Modal headings |
| **Button** | Inter Medium / 14px / 0.01em | All buttons |
| **Body** | Inter Regular / 13px / 0em | General UI text |
| **Caption** | Inter Regular / 11px / 0em | Thumbnails, helpers |
| **Mono** | JetBrains Mono / 12px / 0em | Page counters |

## Spacing System

Based on 4px base unit:

```typescript
const spacing = {
  1: '4px',   // Tight elements
  2: '8px',   // Button groups
  3: '12px',  // Toolbar padding
  4: '16px',  // Standard padding
  6: '24px',  // Modal padding
  8: '32px',  // Content margins
}
```

## Component Specifications

### Buttons

**Primary**
- Background: `--deep-charcoal`
- Text: `oklch(1 0 0)` (white)
- Padding: `16px 24px`
- Border radius: `8px`
- Shadow: `0 2px 8px rgba(0,0,0,0.15)`

**Secondary**
- Background: transparent
- Text: `--deep-charcoal`
- Padding: `16px 24px`
- Border: `1px solid --slate-gray`
- Border radius: `8px`

**Ghost** (toolbar icons)
- Background: transparent
- Icon color: `--slate-gray`
- Padding: `8px`
- Hover: background `--dove-gray`

### Toolbar

**Main Toolbar**
- Height: `56px`
- Padding: `12px`
- Background: `--canvas-gray`
- Border bottom: `1px solid --dove-gray`
- Sections separated by 16px gap

**Markup Toolbar**
- Height: `48px`
- Slides down below main toolbar
- Background: `--dove-gray`
- Contains annotation tools

### Sidebar

**Thumbnail Sidebar**
- Width: `224px` (desktop)
- Background: `--dove-gray`
- Padding: `16px`
- Each thumbnail: `176px wide` with 12px gap
- Current page: `2px solid --ocean-blue` border

### Canvas Area

**PDF Display**
- Background: `--slate-gray` (letterbox)
- PDF pages: white with subtle shadow
- Shadow: `0 4px 12px rgba(0,0,0,0.1)`
- Margin: `32px` around pages

### Modals

**Dialog**
- Width: `480px` (max)
- Background: white
- Padding: `24px`
- Border radius: `12px`
- Backdrop: `backdrop-blur-sm` with dark overlay

### Toast Notifications

**Position**: Top right, 16px from edges
**Width**: `320px`
**Padding**: `16px`
**Types**:
- Success: Green left border
- Error: Red left border
- Info: Blue left border

## Iconography

**Source**: Phosphor Icons
**Size**: 20px (desktop), 24px (mobile)
**Weight**: Regular (default), Bold (selected state)

### Key Icons

| Function | Icon | Usage |
|----------|------|-------|
| Open | `FolderOpen` | File picker |
| Save | `Download` | Export PDF |
| Search | `MagnifyingGlass` | Text search |
| Highlight | `Highlighter` | Highlight tool |
| Draw | `PencilLine` | Pen tool |
| Text | `TextAa` | Text box tool |
| Sign | `Signature` | Signature tool |
| Undo | `ArrowCounterClockwise` | Undo action |
| Redo | `ArrowClockwise` | Redo action |
| Zoom In | `MagnifyingGlassPlus` | Increase zoom |
| Zoom Out | `MagnifyingGlassMinus` | Decrease zoom |

## Interaction States

### Button States

```typescript
const buttonStates = {
  default: {
    background: 'var(--deep-charcoal)',
    scale: 1,
    opacity: 1,
  },
  hover: {
    background: 'oklch(0.32 0.01 270)', // Lighter
    transition: '50ms ease-out',
  },
  active: {
    scale: 0.98,
    transition: '100ms ease-out',
  },
  disabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
}
```

### Tool Selection

**Inactive**: Gray icon, no background
**Hover**: Icon saturates, background lightens
**Active**: Full color icon, background `--ocean-blue` at 10% opacity

## Animation Specifications

### Timing Functions

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in: cubic-bezier(0.7, 0, 0.84, 0);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
--spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Animation Durations

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Button hover | 50ms | ease-out |
| Button press | 100ms | ease-out |
| Tool switch | 150ms | ease-out |
| Toolbar reveal | 200ms | ease-out |
| Page transition | 300ms | ease-in-out |
| Modal open | 250ms | spring |

### Key Animations

**Markup Toolbar Reveal**
```typescript
{
  initial: { height: 0, opacity: 0 },
  animate: { height: 48, opacity: 1 },
  transition: { duration: 0.2, ease: 'easeOut' }
}
```

**Signature Drop**
```typescript
{
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', stiffness: 400, damping: 17 }
}
```

## Responsive Breakpoints

```typescript
const breakpoints = {
  mobile: '0px',      // 0-767px
  tablet: '768px',    // 768-1023px
  desktop: '1024px',  // 1024px+
}
```

### Mobile Adaptations

**Layout Changes**:
- Sidebar becomes bottom sheet
- Toolbar moves to bottom
- Tools collapse to "More" menu
- Zoom controls become floating button

**Touch Targets**:
- Minimum 44x44px
- Increased spacing (12px → 16px)
- Larger icons (20px → 24px)

## Accessibility

### Focus States

**Keyboard Focus**:
- Outline: `2px solid --ocean-blue`
- Offset: `2px`
- Border radius: matches element

**Skip Links**:
- "Skip to content" appears on Tab
- Positioned absolutely top-left

### ARIA Labels

All interactive elements have:
- `aria-label` for icons
- `role` attributes where appropriate
- `aria-pressed` for toggle buttons
- `aria-expanded` for collapsible sections

### Color Contrast

All text meets WCAG AA (4.5:1 for normal, 3:1 for large):
- Deep Charcoal on Canvas Gray: 11.2:1 ✓
- White on Deep Charcoal: 9.8:1 ✓
- White on Ocean Blue: 4.8:1 ✓

## Dark Mode

**Note**: Not implemented in MVP. Future consideration would involve:
- Inverted neutrals (dark canvas, light text)
- Reduced annotation saturation
- Dimmed PDF rendering for eye comfort
