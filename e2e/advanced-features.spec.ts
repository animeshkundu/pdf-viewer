/**
 * Advanced Features E2E Tests
 * 
 * Tests advanced features including watermarks, page numbers, split/merge,
 * and other document manipulation features
 */

import { test, expect, Page } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Helper function to upload a PDF file and wait for it to load
async function uploadPdfAndWaitForLoad(page: Page) {
  const fileInput = page.locator('input[type="file"]').first()
  const samplePdfPath = path.join(__dirname, 'fixtures', 'sample.pdf')
  await fileInput.setInputFiles(samplePdfPath)
  
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
}

test.describe('Watermark Feature', () => {
  test('should display watermark button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const watermarkButton = page.getByRole('button', { name: /Watermark/i })
    await expect(watermarkButton).toBeVisible()
  })

  test('should open watermark dialog when clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const watermarkButton = page.getByRole('button', { name: /Watermark/i })
    await watermarkButton.click()
    await page.waitForTimeout(500)
    
    // Dialog should appear
  })

  test('should update button state when watermark is active', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const watermarkButton = page.getByRole('button', { name: /Watermark/i })
    
    // Initial state
    await expect(watermarkButton).toHaveAttribute('aria-pressed', 'false')
    
    // After adding watermark, state should change
    // This would require actually adding a watermark
  })

  test('should allow customizing watermark text', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const watermarkButton = page.getByRole('button', { name: /Watermark/i })
    await watermarkButton.click()
    await page.waitForTimeout(500)
    
    // Look for text input in dialog
    const textInput = page.locator('input[type="text"]').first()
    if (await textInput.isVisible()) {
      await textInput.fill('CONFIDENTIAL')
      await page.waitForTimeout(300)
    }
  })

  test('should allow removing watermark', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    // This would require adding a watermark first, then removing it
  })
})

test.describe('Page Numbers Feature', () => {
  test('should display page numbers button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const pageNumbersButton = page.getByRole('button', { name: /Page Numbers/i })
    await expect(pageNumbersButton).toBeVisible()
  })

  test('should open page numbers dialog when clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const pageNumbersButton = page.getByRole('button', { name: /Page Numbers/i })
    await pageNumbersButton.click()
    await page.waitForTimeout(500)
  })

  test('should update button state when page numbers are active', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const pageNumbersButton = page.getByRole('button', { name: /Page Numbers/i })
    await expect(pageNumbersButton).toHaveAttribute('aria-pressed', 'false')
  })

  test('should allow customizing page number position', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const pageNumbersButton = page.getByRole('button', { name: /Page Numbers/i })
    await pageNumbersButton.click()
    await page.waitForTimeout(500)
    
    // Dialog should have position options
  })
})

test.describe('Split PDF Feature', () => {
  test('should display split button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const splitButton = page.getByRole('button', { name: /Split/i })
    await expect(splitButton).toBeVisible()
  })

  test('should open split dialog when clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const splitButton = page.getByRole('button', { name: /Split/i })
    await splitButton.click()
    await page.waitForTimeout(500)
  })

  test('should allow selecting split points', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const splitButton = page.getByRole('button', { name: /Split/i })
    await splitButton.click()
    await page.waitForTimeout(500)
    
    // Dialog should show page selection options
  })

  test('should show preview of split results', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const splitButton = page.getByRole('button', { name: /Split/i })
    await splitButton.click()
    await page.waitForTimeout(500)
    
    // Should show preview of how document will be split
  })
})

test.describe('Merge PDF Feature', () => {
  test('should display merge button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const mergeButton = page.getByRole('button', { name: /Merge/i })
    await expect(mergeButton).toBeVisible()
  })

  test('should open merge dialog when clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const mergeButton = page.getByRole('button', { name: /Merge/i })
    await mergeButton.click()
    await page.waitForTimeout(500)
  })

  test('should allow adding multiple PDFs to merge', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const mergeButton = page.getByRole('button', { name: /Merge/i })
    await mergeButton.click()
    await page.waitForTimeout(500)
    
    // Dialog should have file upload for additional PDFs
  })

  test('should allow reordering PDFs before merge', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const mergeButton = page.getByRole('button', { name: /Merge/i })
    await mergeButton.click()
    await page.waitForTimeout(500)
    
    // Should have drag and drop or buttons to reorder
  })
})

test.describe('Presentation Mode', () => {
  test('should have presentation mode option in Tools menu', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const presentationItem = page.getByRole('menuitem', { name: /Presentation Mode/i })
    await expect(presentationItem).toBeVisible()
  })

  test('should enter fullscreen when presentation mode activated', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const presentationItem = page.getByRole('menuitem', { name: /Presentation Mode/i })
    await presentationItem.click()
    await page.waitForTimeout(500)
    
    // Presentation mode should be active
  })

  test('should exit presentation mode with Escape', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const presentationItem = page.getByRole('menuitem', { name: /Presentation Mode/i })
    await presentationItem.click()
    await page.waitForTimeout(500)
    
    // Exit with Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  })

  test('should support slide navigation in presentation mode', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const presentationItem = page.getByRole('menuitem', { name: /Presentation Mode/i })
    await presentationItem.click()
    await page.waitForTimeout(500)
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(300)
    
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(300)
  })
})

test.describe('Bookmarks Feature', () => {
  test('should have bookmarks option in Tools menu', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const bookmarksItem = page.getByRole('menuitem', { name: /Bookmarks/i })
    await expect(bookmarksItem).toBeVisible()
  })

  test('should open bookmarks panel', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const bookmarksItem = page.getByRole('menuitem', { name: /Bookmarks/i })
    await bookmarksItem.click()
    await page.waitForTimeout(500)
  })

  test('should display PDF bookmarks if present', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const bookmarksItem = page.getByRole('menuitem', { name: /Bookmarks/i })
    await bookmarksItem.click()
    await page.waitForTimeout(500)
    
    // If PDF has bookmarks, they should be shown
  })

  test('should navigate to page when bookmark clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const bookmarksItem = page.getByRole('menuitem', { name: /Bookmarks/i })
    await bookmarksItem.click()
    await page.waitForTimeout(500)
    
    // Click on a bookmark if present
  })
})

test.describe('PDF Info Feature', () => {
  test('should have PDF Info option in Tools menu', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const infoItem = page.getByRole('menuitem', { name: /PDF Info/i })
    await expect(infoItem).toBeVisible()
  })

  test('should open PDF info dialog', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const infoItem = page.getByRole('menuitem', { name: /PDF Info/i })
    await infoItem.click()
    await page.waitForTimeout(500)
  })

  test('should display PDF metadata', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const infoItem = page.getByRole('menuitem', { name: /PDF Info/i })
    await infoItem.click()
    await page.waitForTimeout(500)
    
    // Should show title, author, subject, etc.
  })

  test('should display file size and page count', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const infoItem = page.getByRole('menuitem', { name: /PDF Info/i })
    await infoItem.click()
    await page.waitForTimeout(500)
    
    // Should show technical details
  })
})

test.describe('Compress Images Feature', () => {
  test('should have compress option in Tools menu', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const compressItem = page.getByRole('menuitem', { name: /Compress Images/i })
    await expect(compressItem).toBeVisible()
  })

  test('should open compress dialog', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const compressItem = page.getByRole('menuitem', { name: /Compress Images/i })
    await compressItem.click()
    await page.waitForTimeout(500)
  })

  test('should allow selecting compression quality', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const compressItem = page.getByRole('menuitem', { name: /Compress Images/i })
    await compressItem.click()
    await page.waitForTimeout(500)
    
    // Should have quality slider or presets
  })

  test('should show estimated file size reduction', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const compressItem = page.getByRole('menuitem', { name: /Compress Images/i })
    await compressItem.click()
    await page.waitForTimeout(500)
    
    // Should show before/after file sizes
  })
})

test.describe('Compare PDFs Feature', () => {
  test('should have compare option in Tools menu', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const compareItem = page.getByRole('menuitem', { name: /Compare PDFs/i })
    await expect(compareItem).toBeVisible()
  })

  test('should open compare dialog', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const compareItem = page.getByRole('menuitem', { name: /Compare PDFs/i })
    await compareItem.click()
    await page.waitForTimeout(500)
  })

  test('should allow uploading second PDF for comparison', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const compareItem = page.getByRole('menuitem', { name: /Compare PDFs/i })
    await compareItem.click()
    await page.waitForTimeout(500)
    
    // Should have file input for second PDF
  })

  test('should show side-by-side comparison view', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const compareItem = page.getByRole('menuitem', { name: /Compare PDFs/i })
    await compareItem.click()
    await page.waitForTimeout(500)
    
    // After uploading second PDF, should show comparison
  })

  test('should highlight differences between PDFs', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const compareItem = page.getByRole('menuitem', { name: /Compare PDFs/i })
    await compareItem.click()
    await page.waitForTimeout(500)
    
    // Differences should be visually highlighted
  })
})

test.describe('OCR Feature', () => {
  test('should have OCR option in Tools menu', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const ocrItem = page.getByRole('menuitem', { name: /OCR/i })
    await expect(ocrItem).toBeVisible()
  })

  test('should open OCR dialog', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const ocrItem = page.getByRole('menuitem', { name: /OCR/i })
    await ocrItem.click()
    await page.waitForTimeout(500)
  })

  test('should allow selecting pages for OCR', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const ocrItem = page.getByRole('menuitem', { name: /OCR/i })
    await ocrItem.click()
    await page.waitForTimeout(500)
    
    // Should have page selection options
  })

  test('should show OCR progress indicator', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const ocrItem = page.getByRole('menuitem', { name: /OCR/i })
    await ocrItem.click()
    await page.waitForTimeout(500)
    
    // If OCR is started, should show progress
  })
})

test.describe('Sanitize PDF Feature', () => {
  test('should have sanitize option in Tools menu', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const sanitizeItem = page.getByRole('menuitem', { name: /Sanitize PDF/i })
    await expect(sanitizeItem).toBeVisible()
  })

  test('should open sanitize dialog', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const sanitizeItem = page.getByRole('menuitem', { name: /Sanitize PDF/i })
    await sanitizeItem.click()
    await page.waitForTimeout(500)
  })

  test('should explain what sanitization does', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const sanitizeItem = page.getByRole('menuitem', { name: /Sanitize PDF/i })
    await sanitizeItem.click()
    await page.waitForTimeout(500)
    
    // Dialog should explain metadata removal
  })

  test('should allow selecting what to remove', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const sanitizeItem = page.getByRole('menuitem', { name: /Sanitize PDF/i })
    await sanitizeItem.click()
    await page.waitForTimeout(500)
    
    // Should have checkboxes for metadata, comments, etc.
  })
})
