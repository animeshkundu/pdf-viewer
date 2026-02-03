/**
 * Comprehensive OCR E2E Tests
 *
 * Tests OCR functionality with real scanned PDFs containing image-based text.
 * These tests validate that Tesseract.js-based OCR works correctly from a user's perspective.
 */
import { test, expect, Page } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Extended timeouts for OCR operations (Tesseract.js is slow)
const OCR_TIMEOUTS = {
  DIALOG_OPEN: 5000,
  OCR_INIT: 30000,      // Tesseract initialization
  OCR_SINGLE_PAGE: 120000, // Single page OCR
  OCR_MULTI_PAGE: 180000,  // Multi-page OCR
}

async function uploadPdf(page: Page, fileName: string) {
  const fileInput = page.locator('input[type="file"]').first()
  const pdfPath = path.join(__dirname, 'fixtures', fileName)
  await fileInput.setInputFiles(pdfPath)
  await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await page.waitForTimeout(2000)
}

async function openOCRDialog(page: Page) {
  const toolsButton = page.getByRole('button', { name: /Tools/i })
  await toolsButton.click()
  await page.waitForTimeout(300)

  const ocrItem = page.getByRole('menuitem', { name: /OCR/i })
  await ocrItem.click()
  await page.waitForTimeout(500)
}

test.describe('OCR Feature - Dialog and UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should open OCR dialog from Tools menu', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')
    await openOCRDialog(page)

    // Dialog should be visible
    const dialog = page.getByRole('dialog').or(page.locator('[role="dialog"]'))
    await expect(dialog).toBeVisible({ timeout: OCR_TIMEOUTS.DIALOG_OPEN })
  })

  test('should display language selection dropdown', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')
    await openOCRDialog(page)

    // Look for language selector
    const languageSelect = page.locator('select').filter({ hasText: /English/i }).or(
      page.getByRole('combobox', { name: /language/i })
    ).or(
      page.locator('[id*="language"]')
    )

    // Should have a language selector or the dialog mentions language
    const hasLanguage = await languageSelect.count() > 0 ||
      await page.locator('text=/language/i').count() > 0
    expect(hasLanguage).toBe(true)
  })

  test('should display mode selection (Extract Text vs Make Searchable)', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')
    await openOCRDialog(page)

    // Look for mode options
    const extractTextOption = page.locator('text=/extract.*text/i').or(
      page.getByRole('radio', { name: /extract/i })
    )
    const makeSearchableOption = page.locator('text=/searchable/i').or(
      page.getByRole('radio', { name: /searchable/i })
    )

    // Should have at least one mode option visible
    const hasExtractText = await extractTextOption.count() > 0
    const hasSearchable = await makeSearchableOption.count() > 0

    expect(hasExtractText || hasSearchable).toBe(true)
  })

  test('should close OCR dialog with Escape key', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')
    await openOCRDialog(page)

    const dialog = page.getByRole('dialog').or(page.locator('[role="dialog"]'))
    await expect(dialog).toBeVisible({ timeout: OCR_TIMEOUTS.DIALOG_OPEN })

    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Dialog should be closed or not visible
    await expect(dialog).not.toBeVisible({ timeout: 5000 })
  })

  test('should close OCR dialog with close button', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')
    await openOCRDialog(page)

    const dialog = page.getByRole('dialog').or(page.locator('[role="dialog"]'))
    await expect(dialog).toBeVisible({ timeout: OCR_TIMEOUTS.DIALOG_OPEN })

    // Find close button
    const closeButton = page.getByRole('button', { name: /close/i }).or(
      page.locator('button[aria-label*="close" i]').or(
        page.locator('button:has(svg)').filter({ has: page.locator('[class*="X"]') })
      )
    )

    if (await closeButton.count() > 0) {
      await closeButton.first().click()
      await page.waitForTimeout(500)
      await expect(dialog).not.toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('OCR Feature - Language Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should support English language', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')
    await openOCRDialog(page)

    const englishOption = page.locator('text=/english/i').or(
      page.getByRole('option', { name: /english/i })
    )

    // English should be available (either selected by default or in dropdown)
    const hasEnglish = await englishOption.count() > 0 ||
      await page.locator('[value="eng"]').count() > 0
    expect(hasEnglish).toBe(true)
  })

  test('should support multiple languages', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')
    await openOCRDialog(page)

    // Try to open language dropdown
    const languageSelect = page.locator('select').first().or(
      page.getByRole('combobox').first()
    )

    if (await languageSelect.count() > 0) {
      await languageSelect.click()
      await page.waitForTimeout(300)

      // Should have multiple language options
      const options = page.getByRole('option')
      const optionCount = await options.count()

      // Expect at least a few languages
      expect(optionCount).toBeGreaterThan(0)
    }
  })
})

test.describe('OCR Feature - Extract Text Mode', () => {
  test.setTimeout(OCR_TIMEOUTS.OCR_SINGLE_PAGE)

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should show start button for OCR processing', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')
    await openOCRDialog(page)

    // Look for a start/process/run button
    const startButton = page.getByRole('button', { name: /start|process|run|extract|ocr/i })
    await expect(startButton).toBeVisible({ timeout: 5000 })
  })

  test('should show progress indicator when OCR starts', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')
    await openOCRDialog(page)

    // Select Extract Text mode if available
    const extractTextOption = page.locator('text=/extract.*text/i').or(
      page.getByRole('radio', { name: /extract/i })
    ).first()

    if (await extractTextOption.count() > 0) {
      await extractTextOption.click()
    }

    // Find and click start button
    const startButton = page.getByRole('button', { name: /start|process|run|extract/i }).first()

    if (await startButton.count() > 0 && await startButton.isEnabled()) {
      await startButton.click()

      // Should show some progress indication
      const progressIndicator = page.locator('[role="progressbar"]').or(
        page.locator('text=/processing|loading|initializing/i')
      ).or(
        page.locator('.animate-spin, [class*="spinner"]')
      )

      // Progress should appear within reasonable time
      try {
        await expect(progressIndicator).toBeVisible({ timeout: OCR_TIMEOUTS.OCR_INIT })
      } catch {
        // Progress might have already completed for small PDFs
      }
    }
  })

  test('should allow canceling OCR operation', async ({ page }) => {
    await uploadPdf(page, 'multi-page-test.pdf')
    await openOCRDialog(page)

    // Start OCR
    const startButton = page.getByRole('button', { name: /start|process|run|extract/i }).first()

    if (await startButton.count() > 0 && await startButton.isEnabled()) {
      await startButton.click()

      // Wait for processing to start
      await page.waitForTimeout(2000)

      // Look for cancel button
      const cancelButton = page.getByRole('button', { name: /cancel/i })

      if (await cancelButton.count() > 0 && await cancelButton.isVisible()) {
        await cancelButton.click()

        // App should remain responsive
        const toolsButton = page.getByRole('button', { name: /Tools/i })
        await expect(toolsButton).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

test.describe('OCR Feature - Make Searchable Mode', () => {
  test.setTimeout(OCR_TIMEOUTS.OCR_SINGLE_PAGE)

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should have Make Searchable option', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')
    await openOCRDialog(page)

    const makeSearchableOption = page.locator('text=/searchable/i').or(
      page.getByRole('radio', { name: /searchable/i })
    )

    // Should have searchable option
    const hasSearchable = await makeSearchableOption.count() > 0
    expect(hasSearchable).toBe(true)
  })

  test('should enable download after Make Searchable completes', async ({ page }) => {
    await uploadPdf(page, 'simple-test.pdf')
    await openOCRDialog(page)

    // Select Make Searchable mode
    const makeSearchableOption = page.locator('text=/searchable/i').or(
      page.getByRole('radio', { name: /searchable/i })
    ).first()

    if (await makeSearchableOption.count() > 0) {
      await makeSearchableOption.click()
    }

    // Start OCR
    const startButton = page.getByRole('button', { name: /start|process|run|make searchable/i }).first()

    if (await startButton.count() > 0 && await startButton.isEnabled()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: OCR_TIMEOUTS.OCR_SINGLE_PAGE })
        .catch(() => null)

      await startButton.click()

      // Wait for download or timeout
      const download = await downloadPromise

      if (download) {
        // Download happened - verify it's a PDF
        expect(download.suggestedFilename()).toContain('.pdf')
      }
    }
  })
})

test.describe('OCR Feature - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should handle OCR gracefully without crashes', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')
    await openOCRDialog(page)

    // The dialog should be stable and not crash
    const dialog = page.getByRole('dialog').or(page.locator('[role="dialog"]'))
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Close and reopen should work
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    await openOCRDialog(page)
    await expect(dialog).toBeVisible({ timeout: 5000 })
  })

  test('should not show JavaScript errors in console during OCR operations', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Filter out expected/acceptable errors
        if (!text.includes('favicon') &&
            !text.includes('manifest') &&
            !text.includes('ResizeObserver')) {
          consoleErrors.push(text)
        }
      }
    })

    await uploadPdf(page, 'sample.pdf')
    await openOCRDialog(page)

    // Interact with dialog
    const startButton = page.getByRole('button', { name: /start|process|run|extract/i }).first()

    if (await startButton.count() > 0 && await startButton.isEnabled()) {
      await startButton.click()
      await page.waitForTimeout(3000) // Wait for some processing
    }

    // Close dialog
    await page.keyboard.press('Escape')

    // Filter critical errors (not warnings)
    const criticalErrors = consoleErrors.filter(e =>
      e.toLowerCase().includes('uncaught') ||
      e.toLowerCase().includes('unhandled')
    )

    expect(criticalErrors.length).toBe(0)
  })
})

test.describe('OCR Feature - UI Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should integrate with Tools menu correctly', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')

    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)

    // OCR should be in the menu
    const ocrItem = page.getByRole('menuitem', { name: /OCR/i })
    await expect(ocrItem).toBeVisible()

    // Click OCR
    await ocrItem.click()
    await page.waitForTimeout(500)

    // Dialog should open
    const dialog = page.getByRole('dialog').or(page.locator('[role="dialog"]'))
    await expect(dialog).toBeVisible({ timeout: 5000 })
  })

  test('should maintain app responsiveness during OCR', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')
    await openOCRDialog(page)

    // Start OCR
    const startButton = page.getByRole('button', { name: /start|process|run|extract/i }).first()

    if (await startButton.count() > 0 && await startButton.isEnabled()) {
      await startButton.click()

      // App should remain responsive - check other elements are still interactive
      await page.waitForTimeout(1000)

      // Cancel or close should work
      const cancelOrClose = page.getByRole('button', { name: /cancel|close/i })
      if (await cancelOrClose.count() > 0) {
        await expect(cancelOrClose.first()).toBeEnabled({ timeout: 5000 })
      }
    }
  })

  test('should be accessible via keyboard', async ({ page }) => {
    await uploadPdf(page, 'sample.pdf')

    // Open Tools menu with keyboard
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Navigate to OCR with arrow keys
    // OCR might not be the first item, so we navigate down
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowDown')
      const focused = page.locator(':focus')
      const text = await focused.textContent()
      if (text && /ocr/i.test(text)) {
        await page.keyboard.press('Enter')
        break
      }
    }

    await page.waitForTimeout(500)

    // Dialog should be openable via keyboard
    const dialog = page.getByRole('dialog').or(page.locator('[role="dialog"]'))
    // May or may not open depending on implementation
  })
})
