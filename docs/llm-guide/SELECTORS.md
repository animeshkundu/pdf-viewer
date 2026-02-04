# UI Selector Reference

This document lists all `data-testid` attributes available for E2E testing.
These selectors are stable and should be used instead of text-based or role-based selectors
which can break with UI changes.

## Usage in Playwright Tests

```typescript
// Preferred: Use data-testid
const button = page.locator('[data-testid="export-button"]')

// Avoid: Text-based selectors (can break with i18n)
const button = page.getByRole('button', { name: /Export/i })
```

## Toolbar Elements

| Element | data-testid | Description |
|---------|-------------|-------------|
| Sidebar Toggle | `sidebar-toggle` | Opens/closes thumbnail sidebar |
| Forms Toggle | `forms-toggle` | Toggles form filling mode |
| Watermark Button | `watermark-button` | Opens watermark dialog |
| Page Numbers Button | `page-numbers-button` | Opens page numbers dialog |
| Split Button | `split-button` | Opens split PDF dialog |
| Merge Button | `merge-button` | Opens merge PDF dialog |
| Tools Button | `tools-button` | Opens tools dropdown menu |
| Export Button | `export-button` | Opens export dialog |

## Sidebar Elements

| Element | data-testid | Description |
|---------|-------------|-------------|
| Thumbnail Sidebar | `thumbnail-sidebar` | The sidebar container |
| Pages Heading | `pages-heading` | "Pages (n)" heading in sidebar |

## Dialog Elements

| Element | data-testid | Description |
|---------|-------------|-------------|
| Export Dialog | `export-dialog` | Export PDF dialog container |
| Export Submit | `export-dialog-submit` | Export button inside dialog |
| Split Dialog | `split-dialog` | Split PDF dialog container |
| Merge Dialog | `merge-dialog` | Merge PDF dialog container |
| Watermark Dialog | `watermark-dialog` | Watermark dialog container |

## Form Elements

| Element | ID | Description |
|---------|-----|-------------|
| Page Range Input | `#rangeInput` | Input for page ranges in split |
| Pages Per File | `#everyNInput` | Input for N pages per file |
| Merge File Input | `#merge-file-input` | Hidden file input for merge |

## Adding New Test IDs

When adding new interactive elements:

1. Use kebab-case: `my-new-button`
2. Prefix with component area: `toolbar-`, `sidebar-`, `dialog-`
3. Update this document
4. Add screenshot test if it's a key interface

Example:
```tsx
<Button data-testid="toolbar-my-new-button">
  My New Button
</Button>
```
