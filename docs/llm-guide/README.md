# LLM Development Guide

This directory contains documentation optimized for LLM-assisted development and testing.

## Quick Reference Files

| File | Purpose |
|------|---------|
| [SELECTORS.md](./SELECTORS.md) | Complete `data-testid` reference for E2E testing |

## Screenshots

Each CI build captures screenshots of key interfaces. Download the `ui-screenshots` artifact from any CI run to see:

- `01-empty-state.png` - App before loading a PDF
- `02-main-viewer.png` - Main viewer with PDF loaded
- `03-sidebar-open.png` - Thumbnail sidebar open
- `04-export-dialog.png` - Export PDF dialog
- `05-split-dialog.png` - Split PDF dialog
- `06-merge-dialog.png` - Merge PDF dialog
- `07-watermark-dialog.png` - Watermark dialog
- `08-tools-dropdown.png` - Tools dropdown menu
- `09-search-active.png` - Search bar active
- `10-form-mode.png` - Form filling mode (if available)

## Key Testing Patterns

### Loading a PDF
```typescript
const fileInput = page.locator('input[type="file"]').first()
await fileInput.setInputFiles(pdfPath)
await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
await page.waitForTimeout(2000)  // Render stabilization
```

### Opening a Dialog
```typescript
// Use data-testid for reliability
const button = page.locator('[data-testid="export-button"]')
await button.click()
await page.waitForSelector('[data-testid="export-dialog"]', { state: 'visible' })
```

### Closing Dialogs
```typescript
// Escape is most reliable for closing dialogs
await page.keyboard.press('Escape')
await page.waitForTimeout(500)
```

## Common Timeouts

| Operation | Recommended Timeout |
|-----------|---------------------|
| PDF Load | 30000ms |
| Canvas Render | 2000ms (wait after load) |
| Dialog Open | 5000ms |
| MuPDF Init | 8000ms |
| Export Operation | 15000ms |
