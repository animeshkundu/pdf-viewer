# Product Requirements Document: PDF Viewer & Editor

A client-side web application for viewing, annotating, and editing PDF documents with zero server dependency, inspired by the minimalist excellence of macOS Preview.

**Experience Qualities**:
1. **Effortless** - Opening and working with PDFs should feel instantaneous and require zero configuration or learning curve
2. **Private** - All processing happens in the browser; user documents never leave their device, building absolute trust
3. **Professional** - Clean, sophisticated interface that feels appropriate for both personal and business use

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)

This is a sophisticated document management tool requiring multiple interaction modes (viewing, annotating, editing), complex state management (undo/redo across different tools), performance optimization (virtualized rendering for large documents), and advanced features like signature creation, page manipulation, and PDF modification. The application needs to gracefully handle files ranging from single pages to 1000+ page documents while maintaining smooth 60fps interactions.

---

## Essential Features

### 1. Document Loading & Management
**Functionality**: Import PDF files from local filesystem with multiple input methods

**Purpose**: Eliminate friction in starting work - users should go from "I need to view this PDF" to viewing in under 2 seconds

**Trigger**: 
- User drags PDF file onto browser window
- User clicks "Open File" button and selects from filesystem
- User uses Cmd/Ctrl+O keyboard shortcut

**Progression**: 
Drag PDF onto window → Visual drop zone highlights → File begins parsing (show loading indicator with progress) → First page renders → Thumbnails sidebar populates → Full document ready (background load remaining pages)

**Success Criteria**: 
- Files up to 50MB load within 3 seconds on average hardware
- Drag-and-drop works consistently across all major browsers
- Loading progress is visible and accurate
- User can begin viewing/scrolling before entire document finishes loading

### 2. Page Navigation & Viewing
**Functionality**: Browse through document pages with multiple navigation methods and flexible zoom controls

**Purpose**: Users need to quickly locate specific content and view it at their preferred size - supports different workflows from casual reading to detailed review

**Trigger**:
- User scrolls in main content area
- User clicks thumbnail in sidebar
- User enters page number in toolbar
- User uses arrow keys or Page Up/Down
- User adjusts zoom level

**Progression**:
Scroll or click navigation → Smooth animated transition to target page → Page renders at current zoom → Thumbnail sidebar highlights current position → Status bar updates page counter

**Success Criteria**:
- Smooth 60fps scrolling even with 100+ page documents
- Keyboard shortcuts work for all navigation (j/k, arrow keys, Page Up/Down, Home/End)
- Zoom levels: Fit Width, Fit Page, 50%, 75%, 100%, 125%, 150%, 200%, 400%
- Pinch-to-zoom works on touch devices
- Current page indicator always visible

### 3. Text Selection & Search
**Functionality**: Select and copy text from PDF; search across entire document with result highlighting

**Purpose**: Users frequently need to extract information or locate specific content within long documents

**Trigger**:
- User clicks and drags to select text
- User presses Cmd/Ctrl+F to open search
- User types in search field

**Progression**:
User opens search (Cmd/Ctrl+F) → Floating search bar appears at top → User types query → Results highlight in real-time across all pages → Navigation arrows jump between matches → Counter shows "3 of 47 matches" → User can select and copy highlighted text

**Success Criteria**:
- Text selection works across multiple lines and columns
- Search returns results within 500ms for documents up to 500 pages
- Case-sensitive and whole-word search options available
- Selected text can be copied to clipboard
- Search highlights remain visible during scrolling

### 4. Annotation Toolbar
**Functionality**: Add highlights, drawings, shapes, text boxes, and sticky notes to document

**Purpose**: Users need to mark up documents for review, feedback, collaboration, or personal notes - this is the core value-add beyond basic viewing

**Trigger**:
- User clicks "Markup" button in toolbar
- User uses keyboard shortcut (Cmd/Ctrl+Shift+A)

**Progression**:
Click Markup button → Markup toolbar slides down with tool options → User selects highlight tool → Cursor changes to highlight mode → User drags over text → Semi-transparent colored highlight appears → Annotation saves to document state → User can change color, delete, or add more annotations

**Success Criteria**:
- Markup toolbar contains: Highlight (5 colors), Underline, Strikethrough, Freehand Pen (3 thicknesses, 8 colors), Shapes (Rectangle, Circle, Arrow, Line), Text Box, Sticky Note, Signature
- All annotations render as overlay layer above PDF content
- Annotations can be selected, moved, resized, deleted
- Undo/redo works across all annotation actions (20 action history)
- Tool state persists until user switches tools or closes markup mode

### 5. Signature Creation & Insertion
**Functionality**: Create reusable signatures via drawing or image upload; quickly insert into documents

**Purpose**: Signing documents is a common workflow - should be faster than printing, signing, scanning

**Trigger**:
- User clicks "Sign" button in markup toolbar
- User uses keyboard shortcut (Cmd/Ctrl+Shift+S)

**Progression**:
Click Sign button → Modal opens with options: "Draw Signature" or "Upload Image" → User draws with mouse/trackpad → Preview updates in real-time → User clicks "Save" → Signature stores in browser localStorage → Modal closes, cursor becomes signature placement mode → User clicks on document → Signature image places at cursor position → User can resize, reposition, or delete

**Success Criteria**:
- Drawing canvas is smooth (60fps capture) with adjustable pen thickness
- Up to 5 signatures can be stored locally
- Placed signatures can be resized while maintaining aspect ratio
- Signatures have transparent backgrounds
- Signature images export properly with final PDF

### 6. Page Management
**Functionality**: Reorder, rotate, delete, and extract pages from document

**Purpose**: Users often need to restructure documents - remove unnecessary pages, fix orientation, reorganize content

**Trigger**:
- User right-clicks thumbnail in sidebar
- User selects page and uses keyboard shortcuts
- User drags thumbnail to new position

**Progression**:
User right-clicks page thumbnail → Context menu appears with options: Rotate Left, Rotate Right, Delete, Extract → User selects "Rotate Right" → Page rotates 90° clockwise with smooth animation → All instances of that page (thumbnails and main view) update → Document state updates

**Success Criteria**:
- Drag-and-drop reordering works smoothly in thumbnail sidebar
- Multi-select supported (Shift+click for range, Cmd/Ctrl+click for individual)
- Rotation is instant (<100ms) with smooth animation
- Deleted pages can be recovered via undo
- Changes are reflected immediately in both sidebar and main view

### 7. Document Export
**Functionality**: Save modified PDF with all annotations, rotations, and page changes applied

**Purpose**: All edits must result in a usable PDF file - this is the final output that matters

**Trigger**:
- User clicks "Download" button
- User uses keyboard shortcut (Cmd/Ctrl+S)
- User closes browser tab (prompt to save if unsaved changes)

**Progression**:
User clicks Download → Processing indicator shows "Applying annotations..." → pdf-lib generates new PDF with all modifications embedded → Browser download dialog appears with suggested filename (original name + "_edited.pdf") → File downloads → Success toast notification → Document marked as saved (no unsaved changes indicator)

**Success Criteria**:
- Export completes within 5 seconds for documents up to 100 pages
- All annotations, highlights, text boxes rendered as permanent PDF elements
- Page rotations and deletions applied
- Signatures embedded as images
- Output file opens correctly in Adobe Acrobat, Preview, Chrome, Firefox
- No watermarks or branding added to document

### 8. Keyboard Shortcuts & Accessibility
**Functionality**: Complete keyboard navigation and screen reader support

**Purpose**: Power users expect keyboard efficiency; accessibility is legally and ethically required

**Trigger**:
- User presses any keyboard shortcut
- User navigates via Tab key
- Screen reader announces UI elements

**Progression**:
User presses "?" → Keyboard shortcuts modal appears → Shows complete list organized by category → User presses Escape → Modal closes → User presses "j" → Scrolls down one page → Status bar announces "Page 3 of 15" to screen reader

**Success Criteria**:
- All functionality accessible via keyboard (no mouse required)
- Focus indicators clearly visible on all interactive elements
- Screen reader announces: current page, tool selection, annotation creation, error messages
- Keyboard shortcuts: Navigation (j/k, arrows, Page Up/Down), Tools (h=highlight, p=pen, s=signature), Actions (z=undo, Cmd/Ctrl+Z=undo, Cmd/Ctrl+Shift+Z=redo), View (+=zoom in, -=zoom out, 0=fit width)
- ARIA labels on all buttons and inputs
- Color contrast meets WCAG AA standards (4.5:1 minimum)

---

## Edge Case Handling

**Large Documents (500+ pages)**: Virtualized rendering - only render visible pages plus 2-page buffer above/below; lazy load thumbnails on scroll; use Web Workers for PDF parsing to avoid UI thread blocking

**Corrupted PDFs**: Show user-friendly error message "Unable to open PDF - file may be damaged" with option to report issue; gracefully fail without crashing app

**No Text Layer (Scanned PDFs)**: Detect absence of text layer; show info banner "This PDF appears to be scanned. Text selection unavailable. Annotations still work."; OCR feature suggested as future enhancement

**Browser Memory Limits**: Monitor memory usage; if approaching limits, aggressively cleanup off-screen page canvases; show warning "Large document may cause performance issues" for files >200MB; suggest downloading browser extensions for very large files

**Unsaved Changes**: Detect modifications; show warning icon in toolbar; on tab close, trigger browser's beforeunload confirmation "You have unsaved changes. Download edited PDF before leaving?"

**Mobile/Touch Devices**: Swap cursor-based tools for touch-friendly alternatives; enlarge tap targets to 44×44px minimum; show touch-specific instructions for signature drawing; simplify toolbar to avoid overwhelming small screens

**Private/Incognito Mode**: Signatures and preferences won't persist between sessions; show one-time info banner explaining limitation

**Slow Performance (Old Hardware)**: Detect rendering time per page; if >500ms, automatically reduce quality settings and disable smooth animations; show notification "Performance mode enabled for smoother experience"

---

## Design Direction

The design should evoke **calm professionalism with understated elegance**. This is a tool for focused work - every pixel should support the user's task, never demand attention for itself. Think of a well-organized desk in natural light: everything has its place, surfaces are uncluttered, and quality materials (real wood, metal, glass) communicate craftsmanship without ostentation.

The interface should feel like it *disappears* when you're reading, but *intelligently assists* when you need to act. Interactions should be physically intuitive - dragging a thumbnail feels like sliding a physical page, highlighting text feels like gliding a marker across paper, zooming feels like leaning closer to a document on a desk.

Color should be used sparingly and purposefully: neutral tones for the interface chrome, vibrant accent colors only for user-created content (highlights, annotations), and clear semantic colors for actions (blue for primary, red for destructive).

---

## Color Selection

The palette draws from Scandinavian minimalism and Japanese simplicity - natural, muted backgrounds that don't compete with document content, with carefully chosen accent colors for annotation tools that are vibrant without being garish.

**Primary Color (Deep Charcoal)**: `oklch(0.28 0.01 270)` - Used for primary action buttons (Open File, Download) and active tool selection. Communicates solidity and authority without the harshness of pure black. This is the "I mean business" color.

**Secondary Colors**: 
- **Canvas Gray**: `oklch(0.96 0.005 270)` - Main background for UI chrome (toolbar, sidebar). Almost white but with subtle warmth to reduce eye strain.
- **Dove Gray**: `oklch(0.85 0.008 270)` - Thumbnail sidebar background. Slightly darker to provide gentle visual separation from main content area.
- **Slate Gray**: `oklch(0.65 0.01 270)` - Secondary buttons and inactive tool icons. Recedes appropriately while remaining legible.

**Accent Color (Ocean Blue)**: `oklch(0.55 0.18 240)` - Highlights search results, indicates loading progress, shows current page in thumbnail sidebar. This is the "information" color - friendly, trustworthy, universally understood as interactive.

**Annotation Palette** (for user-generated highlights and drawings):
- **Sunshine Yellow**: `oklch(0.88 0.15 90)` - Default highlight color (most popular)
- **Coral Pink**: `oklch(0.75 0.15 25)` - Secondary highlight
- **Mint Green**: `oklch(0.82 0.12 155)` - Success/approved highlight
- **Lavender**: `oklch(0.70 0.12 290)` - Question/review highlight
- **Sky Blue**: `oklch(0.75 0.12 230)` - Information highlight

**Foreground/Background Pairings**:
- Primary action buttons (Deep Charcoal `oklch(0.28 0.01 270)`): White text `oklch(1 0 0)` - Ratio 9.8:1 ✓
- Secondary buttons (Slate Gray `oklch(0.65 0.01 270)`): White text `oklch(1 0 0)` - Ratio 4.6:1 ✓
- Canvas background (Canvas Gray `oklch(0.96 0.005 270)`): Deep Charcoal text `oklch(0.28 0.01 270)` - Ratio 11.2:1 ✓
- Accent indicators (Ocean Blue `oklch(0.55 0.18 240)`): White text `oklch(1 0 0)` - Ratio 4.8:1 ✓
- Destructive actions (Alert Red `oklch(0.55 0.22 25)`): White text `oklch(1 0 0)` - Ratio 4.9:1 ✓

---

## Font Selection

Typography should communicate **technical precision with human warmth**. The typeface needs to work at tiny sizes (8px thumbnails labels) and large sizes (onboarding messages), remain legible during smooth scrolling animation, and feel at home on both Mac and Windows.

**Primary Font**: **Inter Variable** - A humanist sans-serif specifically designed for screens, with excellent legibility at small sizes and professionally neutral character. Its slightly open apertures and optimized spacing make it perfect for UI chrome and long-form reading. Variable font technology allows fine-tuning weight for different contexts (Medium for buttons, Regular for body text).

**Monospace Font** (for technical details like page numbers, file sizes): **JetBrains Mono** - A crisp, contemporary monospaced typeface that doesn't feel "coder-y" or intimidating. Used sparingly for precise data like "Page 47 of 203" or "12.4 MB".

**Typographic Hierarchy**:
- **H1 (Welcome Screen Title)**: Inter SemiBold / 32px / -0.02em tracking / 1.2 line-height - Only appears on empty state
- **H2 (Modal Headings)**: Inter Medium / 20px / -0.01em tracking / 1.3 line-height - Used in signature creation, keyboard shortcuts modal
- **Toolbar Labels**: Inter Medium / 14px / 0 tracking / 1.5 line-height - Tool names when hovering
- **Body Text (Status Bar, Messages)**: Inter Regular / 13px / 0 tracking / 1.4 line-height - Default for most UI text
- **Page Numbers**: JetBrains Mono Regular / 12px / 0 tracking / 1.4 line-height - Monospace for alignment
- **Captions (Thumbnail Labels)**: Inter Regular / 11px / 0 tracking / 1.3 line-height - Small but still readable
- **Button Text**: Inter Medium / 14px / 0.01em tracking / 1 line-height - Slightly more tracking for impact

---

## Animations

Animations should serve as **spatial memory aids and physics-based feedback**, never decoration. Every motion reinforces the spatial model: toolbars come *from* somewhere and return there, pages exist in a vertical stack you're scrolling through, deleted items don't vanish but shrink away.

**Guiding Principle**: Animations should feel like natural physics - objects have weight, friction exists, nothing teleports. Use easing curves that match real-world motion: ease-out for objects entering (decelerating as they arrive), ease-in for objects leaving (accelerating away), and spring physics for playful feedback moments like dropping a signature onto a page.

**Specific Animation Behaviors**:
- **Markup Toolbar Reveal**: Slides down from toolbar area over 200ms with ease-out curve; feels like unfolding a hidden panel
- **Tool Selection**: Selected tool icon scales up 1.1x and shifts background color over 150ms; gives satisfying tactile feedback
- **Page Transitions**: Smooth scroll with momentum physics; when clicking thumbnail, animate scroll position over 300ms ease-in-out
- **Zoom Changes**: Crossfade between zoom levels over 200ms while animating scale; prevents jarring jumps
- **Signature Placement**: Signature image follows cursor with slight lag (50ms) creating physics-based "weight"; on drop, subtle bounce using spring animation
- **Undo/Redo**: Modified element flashes briefly (opacity 0.5 → 1 over 150ms) to show what changed
- **Loading States**: Progress bar fills smoothly at true parsing speed; skeleton screens fade in for thumbnails during initial load
- **Micro-interactions**: Buttons darken slightly on hover (50ms), scale down 0.98x on click (100ms); checkboxes checkmark draws in over 180ms

**No Animation Zones**: 
- Cursor tracking for annotation tools (zero latency required)
- Text selection (immediate feedback required)
- Search result highlighting (instant updates expected)

---

## Component Selection

**Components** (Shadcn selections + modifications):

- **Button**: Primary actions (Open File, Download, Save) use filled variant with Deep Charcoal background; secondary actions (Cancel, Close) use ghost variant; all buttons have subtle shadow on hover for depth
- **Tooltip**: Show on all toolbar icons with 500ms delay; dark background with white text; short, action-oriented labels ("Highlight Text", not "Highlight Tool")
- **Dialog**: Used for signature creation modal, keyboard shortcuts reference, settings; backdrop blur effect `backdrop-blur-sm` for depth; modal slides up from bottom 20% of screen over 250ms
- **Dropdown Menu**: Right-click context menus on thumbnails; tool options (pen thickness, color pickers); appears instantly on right-click, slides from click position
- **Slider**: Zoom level adjustment, pen thickness selection; thumb has slight shadow for grabbable affordance
- **Tabs**: Organize signature storage (if multiple signatures), settings categories; underline-style indicator with smooth slide animation
- **Toast**: Success notifications ("Document saved"), error messages ("Failed to load PDF"), info tips ("Tip: Press ? for keyboard shortcuts"); appears top-right, auto-dismiss after 4s, swipe-to-dismiss on mobile
- **Alert**: Warning banner at top of viewport for scanned PDFs without text layer, unsaved changes indicator
- **Popover**: Color picker for highlights and pen tool; appears anchored to toolbar button
- **Separator**: Divides toolbar sections (navigation | tools | actions); subtle 1px line
- **Progress**: Linear progress bar for file loading; indeterminate spinner for processing operations
- **ScrollArea**: Thumbnail sidebar has custom styled scrollbar (8px wide, auto-hide on desktop, always visible on mobile)
- **Select**: Zoom level dropdown ("Fit Width", "50%", "100%", etc.)

**Customizations** (beyond default Shadcn):

- **PDF Canvas Component**: Custom component wrapping pdf.js rendering; handles virtualization, manages canvas lifecycle, overlays annotation layer
- **Annotation Layer**: SVG-based overlay positioned absolutely over PDF canvas; handles hit detection, drag interactions, selection state
- **Signature Drawing Canvas**: HTML canvas with smooth line rendering using quadratic curves; real-time stroke smoothing algorithm
- **Thumbnail Grid**: Custom virtualized list component; renders only visible thumbnails +10 buffer; lazy-loads page previews
- **Floating Toolbar**: Custom positioned toolbar that can dock to top (default) or float near cursor for annotation mode
- **Page Number Input**: Enhanced input that accepts page numbers, validates range, highlights on focus

**States** (interactive element behaviors):

- **Toolbar Buttons**: Default (neutral gray) → Hover (background lightens, tooltip appears) → Active/Pressed (scales down 0.98x, background darkens) → Selected (persistent darker background, accent border)
- **Annotation Tools**: Inactive (gray icon) → Hover (icon color transitions to full saturation) → Active (full color icon, background highlight, cursor changes to tool-specific shape)
- **Thumbnails**: Default (neutral border) → Hover (border color transitions to accent blue, slight scale 1.02x) → Selected (solid accent border, subtle shadow) → Dragging (opacity 0.7, follows cursor, other thumbnails animate to make space)
- **Text Selection**: Drag to select shows real-time highlight preview → Release to finalize → Selected text shows browser-native highlight → Copy action briefly flashes "Copied!" tooltip
- **Search Input**: Empty (placeholder visible) → Focus (border color to accent, search icon animates) → Typing (results appear with staggered fade-in) → Results found (counter appears, navigation arrows enable)
- **Zoom Control**: Shows current percentage → Hover (shows +/- buttons) → Click (smooth zoom transition, percentage updates) → Pinch gesture on touch (real-time zoom with preview)

**Icon Selection** (from Phosphor Icons):

- **Navigation**: `CaretLeft`, `CaretRight` (page nav), `MagnifyingGlass` (search), `Sidebar` (toggle thumbnails), `ZoomIn`, `ZoomOut`
- **Tools**: `Highlighter` (highlight), `PencilLine` (pen), `Rectangle`, `Circle`, `ArrowRight`, `TextAa` (text box), `StickerNote`, `Signature`
- **Actions**: `FolderOpen` (open file), `Download` (save), `Trash` (delete page), `ArrowCounterClockwise` (undo), `ArrowClockwise` (redo), `RotateCounterClockwise`, `RotateClockwise`
- **Status**: `CheckCircle` (success), `WarningCircle` (warning), `XCircle` (error), `Question` (help/shortcuts)
- **UI Controls**: `X` (close), `List` (show menu), `DotsThreeVertical` (more options), `Eye`, `EyeSlash` (show/hide)

**Spacing** (Tailwind scale applied):

- **Toolbar**: `p-3` (12px padding) with `gap-2` (8px) between button groups; `gap-4` (16px) between major sections
- **Thumbnail Sidebar**: `w-56` (224px width), `p-4` (16px padding), `gap-3` (12px) between thumbnails
- **Main Content Area**: `p-8` (32px) padding around PDF canvas on desktop; `p-4` (16px) on mobile
- **Modals**: `p-6` (24px) content padding, `gap-4` (16px) between form elements
- **Buttons**: `px-4 py-2` (16px horizontal, 8px vertical) for normal buttons; `px-6 py-3` (24px horizontal, 12px vertical) for primary CTAs
- **Toast Notifications**: `p-4` (16px) internal padding, `gap-3` (12px) between icon and text

**Mobile** (responsive adaptations):

- **Layout Transformation**: 
  - Desktop: Sidebar (left) + Toolbar (top) + Content (center) + Status bar (bottom)
  - Mobile: Toolbar (bottom fixed) + Content (fullscreen) + Floating page indicator + Slide-out sidebar (overlay)
- **Toolbar**: Collapses to essential actions only (Open, Markup, Share/Download) with "More" menu containing secondary actions
- **Thumbnail Sidebar**: Becomes horizontal filmstrip at bottom, swipe to scroll, or full-screen page picker modal
- **Touch Gestures**: Pinch-to-zoom (native), two-finger scroll (pan), long-press on text (select), tap-and-hold on page (context menu)
- **Tool Selection**: Bottom sheet modal replaces dropdown; larger tap targets (48px minimum); color picker becomes grid instead of wheel
- **Signature Drawing**: Full-screen modal with landscape orientation prompt; larger canvas; "Done" button prominent
- **Search**: Overlay fullscreen search interface; results appear as page thumbnails with matched text highlighted
- **Typography**: Body text increases to 14px minimum; button text to 16px; toolbar icons to 24px (from 20px desktop)

---

