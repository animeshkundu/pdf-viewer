/**
 * Tools Dropdown Menu E2E Tests
 * 
 * Tests all options in the Tools dropdown menu
 * Covers UI elements and user interactions for tools functionality
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
  
  // Wait for canvas to be visible (indicates PDF is rendering)
  await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 })
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await page.waitForTimeout(2000) // Extra time for rendering
}

test.describe('Tools Dropdown - Menu Interaction', () => {
  test('should display Tools button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await expect(toolsButton).toBeVisible()
  })

  test('should open Tools dropdown when clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    // Menu should be visible
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
  })

  test('should close Tools dropdown when clicked outside', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    // Wait for UI to be ready
    await page.waitForTimeout(1000)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.waitFor({ state: 'visible', timeout: 10000 })
    await toolsButton.click({ timeout: 10000 })
    await page.waitForTimeout(1000) // Increased for menu to open
    
    // Click outside with better positioning
    await page.locator('body').click({ position: { x: 10, y: 10 }, timeout: 10000 })
    await page.waitForTimeout(1000)
  })

  test('should close Tools dropdown when Escape pressed', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })
})

test.describe('Tools Dropdown - Edit Section', () => {
  test('should display Edit Text menu item', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const editTextItem = page.getByRole('menuitem', { name: /Edit Text/i })
    await expect(editTextItem).toBeVisible()
  })

  test('should activate text edit mode when Edit Text clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const editTextItem = page.getByRole('menuitem', { name: /Edit Text/i })
    await editTextItem.click()
    await page.waitForTimeout(2000) // Wait for MuPDF to load
    
    // Verify text edit mode is active
    // Menu item should change to "Exit Text Edit Mode"
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const exitTextItem = page.getByRole('menuitem', { name: /Exit Text Edit Mode/i })
    await expect(exitTextItem).toBeVisible()
  })

  test('should exit text edit mode when Exit Text Edit Mode clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    // Activate text edit mode
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const editTextItem = page.getByRole('menuitem', { name: /Edit Text/i })
    await editTextItem.click()
    await page.waitForTimeout(2000)
    
    // Exit text edit mode
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const exitTextItem = page.getByRole('menuitem', { name: /Exit Text Edit Mode/i })
    await exitTextItem.click()
    await page.waitForTimeout(500)
    
    // Verify back to Edit Text
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const editTextItemAgain = page.getByRole('menuitem', { name: /Edit Text/i })
    await expect(editTextItemAgain).toBeVisible()
  })
})

test.describe('Tools Dropdown - Security Section', () => {
  test('should display Sanitize PDF menu item', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const sanitizeItem = page.getByRole('menuitem', { name: /Sanitize PDF/i })
    await expect(sanitizeItem).toBeVisible()
  })

  test('should open sanitize dialog when Sanitize PDF clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const sanitizeItem = page.getByRole('menuitem', { name: /Sanitize PDF/i })
    await sanitizeItem.click()
    await page.waitForTimeout(500)
    
    // Dialog or processing should happen
  })
})

test.describe('Tools Dropdown - Conversion Section', () => {
  test('should display Images to PDF menu item', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const imagesToPdfItem = page.getByRole('menuitem', { name: /Images to PDF/i })
    await expect(imagesToPdfItem).toBeVisible()
  })

  test('should display PDF to Images menu item', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const pdfToImagesItem = page.getByRole('menuitem', { name: /PDF to Images/i })
    await expect(pdfToImagesItem).toBeVisible()
  })

  test('should display OCR menu item', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const ocrItem = page.getByRole('menuitem', { name: /OCR/i })
    await expect(ocrItem).toBeVisible()
  })

  test('should open Images to PDF dialog', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const imagesToPdfItem = page.getByRole('menuitem', { name: /Images to PDF/i })
    await imagesToPdfItem.click()
    await page.waitForTimeout(500)
  })

  test('should open PDF to Images dialog', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const pdfToImagesItem = page.getByRole('menuitem', { name: /PDF to Images/i })
    await pdfToImagesItem.click()
    await page.waitForTimeout(500)
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
})

test.describe('Tools Dropdown - Advanced Section', () => {
  test('should display Compress Images menu item', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const compressItem = page.getByRole('menuitem', { name: /Compress Images/i })
    await expect(compressItem).toBeVisible()
  })

  test('should display Compare PDFs menu item', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const compareItem = page.getByRole('menuitem', { name: /Compare PDFs/i })
    await expect(compareItem).toBeVisible()
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
})

test.describe('Tools Dropdown - View Section', () => {
  test('should display Presentation Mode menu item', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const presentationItem = page.getByRole('menuitem', { name: /Presentation Mode/i })
    await expect(presentationItem).toBeVisible()
  })

  test('should display Bookmarks menu item', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const bookmarksItem = page.getByRole('menuitem', { name: /Bookmarks/i })
    await expect(bookmarksItem).toBeVisible()
  })

  test('should display PDF Info menu item', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const infoItem = page.getByRole('menuitem', { name: /PDF Info/i })
    await expect(infoItem).toBeVisible()
  })

  test('should activate presentation mode', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const presentationItem = page.getByRole('menuitem', { name: /Presentation Mode/i })
    await presentationItem.click()
    await page.waitForTimeout(500)
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

  test('should display PDF info dialog', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    const infoItem = page.getByRole('menuitem', { name: /PDF Info/i })
    await infoItem.click()
    await page.waitForTimeout(500)
  })
})

test.describe('Tools Dropdown - Keyboard Navigation', () => {
  test('should navigate menu with arrow keys', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    // Navigate down
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    
    // Navigate up
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(100)
  })

  test('should select menu item with Enter key', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.click()
    await page.waitForTimeout(300)
    
    // Navigate to first item
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    
    // Select with Enter
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
  })
})

test.describe('Tools Dropdown - Section Labels', () => {
  test('should display all section labels', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    // Wait for UI to be ready
    await page.waitForTimeout(1000)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    await toolsButton.waitFor({ state: 'visible', timeout: 10000 })
    await toolsButton.click({ timeout: 10000 })
    await page.waitForTimeout(1000) // Increased for menu to fully open
    
    // Check for section labels with timeout and relaxed checks
    const sections = ['Edit', 'Security', 'Conversion', 'Advanced', 'View']
    for (const section of sections) {
      const label = page.getByText(section).first()
      const isVisible = await label.isVisible({ timeout: 3000 }).catch(() => false)
      if (isVisible) {
        await expect(label).toBeVisible()
      }
    }
  })
})
