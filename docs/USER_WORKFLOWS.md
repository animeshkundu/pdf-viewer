# User Workflows & Edge Cases

## Core User Workflows

### Workflow 1: Quick Document Review
**Scenario**: User receives a contract PDF and needs to read and highlight key terms

**Steps**:
1. Drag PDF file onto browser window
2. Document loads and displays
3. Scroll through to find important sections
4. Click "Markup" button in toolbar
5. Select highlight tool (default yellow)
6. Drag over important text to highlight
7. Continue reading and highlighting key terms
8. Click "Download" to save annotated version
9. Share highlighted PDF with colleagues

**Duration**: 2-5 minutes

---

### Workflow 2: Sign and Return Form
**Scenario**: User needs to sign a PDF form and send it back

**Steps**:
1. Open file picker (Cmd+O or click "Open File")
2. Select PDF form from filesystem
3. Click "Sign" button in markup toolbar
4. Draw signature in modal with mouse/trackpad
5. Click "Save Signature"
6. Click on document where signature should go
7. Resize signature if needed
8. Review completed form
9. Download signed PDF
10. Attach to email and send

**Duration**: 1-2 minutes

---

### Workflow 3: Document Reorganization
**Scenario**: User has a 50-page report that needs pages reordered and some pages removed

**Steps**:
1. Open large PDF document
2. Review document in thumbnail sidebar
3. Identify pages to remove (right-click → Delete)
4. Fix upside-down scan (right-click → Rotate)
5. Drag thumbnails to reorder sections
6. Review changes in main viewer
7. Download reorganized PDF

**Duration**: 5-10 minutes

---

### Workflow 4: Detailed Markup for Review
**Scenario**: Editor needs to provide feedback on a manuscript with multiple annotation types

**Steps**:
1. Open manuscript PDF
2. Enable markup toolbar
3. Use highlight (yellow) for important passages
4. Use highlight (pink) for sections needing revision
5. Use pen tool to circle problematic areas
6. Use text boxes to add detailed comments
7. Use sticky notes for page-level feedback
8. Navigate between pages reviewing all annotations
9. Download marked-up version for author

**Duration**: 15-30 minutes

---

## Edge Case Scenarios

### 1. Very Large Documents (500+ pages)

**Challenge**: Memory and performance constraints

**Handling**:
- Virtualized rendering: Only render visible pages + buffer
- Lazy-load thumbnails on scroll
- Show warning banner: "Large document detected. Some features may be slower."
- Aggressive cleanup of off-screen canvases
- Option to reduce render quality for smoother scrolling

**User Experience**:
- First page appears quickly (< 2 seconds)
- Scrolling remains smooth (60fps)
- Thumbnails load progressively as user scrolls sidebar
- Search may take longer (show progress: "Searching page 243 of 650...")

---

### 2. Corrupted or Invalid PDF

**Challenge**: File cannot be parsed by PDF.js

**Handling**:
- Catch loading error gracefully
- Show error modal with friendly message
- Provide troubleshooting suggestions

**Error Message**:
```
Unable to Open PDF

This file appears to be damaged or is not a valid PDF.

Try these solutions:
• Open in another PDF reader to verify file integrity
• Re-download the file if it came from email/web
• Ask the sender for a new copy

Technical details: [Show error log]
```

**User Experience**:
- No app crash
- Clear next steps
- Option to try another file without reloading page

---

### 3. Scanned PDFs (No Text Layer)

**Challenge**: Text selection and search unavailable

**Handling**:
- Detect absence of text layer on load
- Show info banner at top of viewer
- Explain limitation clearly

**Info Banner**:
```
ℹ️ This PDF appears to be a scanned document. Text selection and search 
are unavailable, but you can still add annotations and signatures.
```

**User Experience**:
- Annotations still work normally
- No broken interactions
- User understands why some features unavailable

---

### 4. Password-Protected PDFs

**Challenge**: Cannot open encrypted documents

**Handling**:
- Detect encryption on load attempt
- Show password prompt modal
- Attempt to decrypt with user-provided password

**Password Modal**:
```
This PDF is Password Protected

Enter password to view document:
[                                    ]

[Cancel]  [Open Document]
```

**If password incorrect**:
```
❌ Incorrect password. Please try again.
```

**User Experience**:
- Clear prompt for password
- Secure input (masked characters)
- Can retry multiple times
- Can cancel and open different file

---

### 5. Unsaved Changes on Tab Close

**Challenge**: User closes tab with unsaved annotations

**Handling**:
- Track modification state
- Use `beforeunload` event to prompt
- Show warning only if changes exist

**Browser Confirmation**:
```
Leave site?
You have unsaved changes. Download your edited PDF before leaving.

[Stay] [Leave]
```

**User Experience**:
- Only shows if actual changes made
- Standard browser dialog (can't customize much)
- Prevents accidental data loss

---

### 6. Browser Memory Limits

**Challenge**: Very large file or many annotations cause memory pressure

**Handling**:
- Monitor memory usage with Performance API
- Warn user when approaching limits
- Automatically reduce quality if needed

**Warning Toast**:
```
⚠️ Memory usage is high. Some features have been optimized for 
performance. Consider working with a smaller file.
```

**Automatic Optimizations**:
- Reduce canvas resolution
- Limit thumbnail resolution
- More aggressive cleanup of off-screen pages
- Disable smooth animations

**User Experience**:
- App doesn't crash
- Some quality reduction, but remains usable
- User informed of what's happening

---

### 7. Mobile/Touch Device Usage

**Challenge**: Desktop-optimized UI doesn't work well on mobile

**Handling**:
- Detect touch device and screen size
- Adapt UI layout for mobile
- Use touch-appropriate controls

**Mobile Adaptations**:
- **Toolbar**: Moves to bottom, condensed icons
- **Sidebar**: Becomes bottom sheet or fullscreen modal
- **Annotations**: Larger touch targets (44px minimum)
- **Zoom**: Pinch gestures instead of buttons
- **Signature**: Fullscreen drawing canvas
- **Context menus**: Bottom sheets instead of dropdowns

**User Experience**:
- Native-feeling touch interactions
- No tiny buttons that are hard to tap
- Gestures match mobile conventions

---

### 8. Incognito/Private Mode

**Challenge**: Local storage may not persist

**Handling**:
- Detect private mode on load
- Warn user about limitations
- Features still work, but don't persist

**One-Time Banner**:
```
ℹ️ Private browsing detected. Saved signatures and preferences won't 
be available after closing this tab.

[Got it]
```

**User Experience**:
- Can still use all features
- Understands data won't persist
- No broken experience

---

### 9. Slow Network/Offline Usage

**Challenge**: CDN resources may not load

**Handling**:
- Bundle critical resources with app
- Graceful degradation if external resources fail
- Consider PWA for offline support (future enhancement)

**Current Approach**:
- PDF.js worker bundled locally
- All fonts, icons bundled in build
- No external API calls required
- Works fully offline once loaded

**User Experience**:
- Reliable offline functionality
- No dependency on external services

---

### 10. Very Long Annotation Sessions

**Challenge**: User spends 2+ hours annotating, potential memory leaks

**Handling**:
- Implement proper cleanup in useEffect hooks
- Monitor memory over time
- Periodic garbage collection hints
- Undo history limit (20 actions)

**Monitoring**:
```typescript
// Log memory usage every minute
setInterval(() => {
  const used = performance.memory.usedJSHeapSize / 1048576
  console.log(`Memory: ${used.toFixed(0)} MB`)
  if (used > 700) {
    // Trigger aggressive cleanup
    cleanupOffscreenCanvases()
    limitUndoHistory(10)
  }
}, 60000)
```

**User Experience**:
- App remains stable during long sessions
- No gradual slowdown
- Can work on document for hours without issues

---

## Accessibility Scenarios

### Screen Reader User

**Workflow**: Navigate and annotate document using only keyboard and screen reader

**Requirements**:
- All controls have ARIA labels
- Page changes announced: "Page 5 of 23"
- Tool selection announced: "Highlight tool active"
- Focus management for modals
- Keyboard shortcuts for all actions

**Key Interactions**:
- Tab to navigate toolbar
- Enter to activate buttons
- Arrow keys to navigate pages
- Shortcut keys for tools (H for highlight, P for pen)
- Screen reader announces current page and selection

---

### Keyboard Power User

**Workflow**: Complete entire annotation workflow without touching mouse

**Key Shortcuts**:
- `Cmd/Ctrl+O`: Open file
- `Cmd/Ctrl+F`: Search
- `j/k` or Arrow keys: Navigate pages
- `+/-`: Zoom in/out
- `0`: Fit to width
- `h`: Activate highlight tool
- `p`: Activate pen tool
- `s`: Activate signature tool
- `Cmd/Ctrl+Z`: Undo
- `Cmd/Ctrl+Shift+Z`: Redo
- `Cmd/Ctrl+S`: Download/save
- `?`: Show keyboard shortcuts
- `Esc`: Cancel current action

**User Experience**:
- Never need to reach for mouse
- Faster workflow for power users
- Discoverable via shortcuts modal (?)

---

## Error Recovery Scenarios

### Browser Crash During Work

**Challenge**: Browser crashes before user saves

**Current Limitation**: 
- No auto-save in MVP
- Work is lost on crash

**Future Enhancement**:
- Auto-save to Spark KV every 2 minutes
- Offer to restore on reload
- "Recover unsaved work?" prompt

---

### Export Fails

**Challenge**: PDF generation throws error

**Handling**:
- Catch export error
- Show error toast with retry option
- Log technical details for debugging

**Error Toast**:
```
❌ Failed to Export PDF

Could not generate the modified PDF. This may be due to unsupported 
annotation types or corrupted source file.

[Retry] [Report Issue]
```

**Retry Logic**:
- Attempt export again
- If fails 3 times, suggest downloading original
- Offer to export annotations as separate data file

---

### Annotation Rendering Issues

**Challenge**: Annotation appears in wrong position after zoom

**Prevention**:
- Store annotations in page coordinates (0-1 range)
- Convert to screen coordinates on render
- Recalculate on zoom/resize

**Recovery**:
- If user reports misplaced annotation
- Add "Reset annotation positions" option
- Recalculate all positions from stored data
