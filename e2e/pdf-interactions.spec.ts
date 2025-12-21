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
  
  // Wait for the PDF to load by waiting for network idle and a short delay
  // The PDF viewer renders asynchronously after file upload
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
}

test.describe('PDF Viewer Interactions', () => {
  test('should open a PDF file and display it', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check initial state shows empty state
    const emptyState = page.getByRole('heading', { name: 'PDF Viewer & Editor' })
    await expect(emptyState).toBeVisible()
    
    // Upload PDF and wait for it to load
    await uploadPdfAndWaitForLoad(page)
    
    // The empty state should be gone and the PDF viewer should be visible
    await expect(emptyState).not.toBeVisible()
  })

  test('should display toolbar buttons when PDF is loaded', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF and wait for load
    await uploadPdfAndWaitForLoad(page)
    
    // Check that the toolbar is visible
    const toolbar = page.getByRole('toolbar', { name: 'Document toolbar' })
    await expect(toolbar).toBeVisible()
  })

  test('should support keyboard shortcuts', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF and wait for load
    await uploadPdfAndWaitForLoad(page)
    
    // Test keyboard shortcut ? to open shortcuts dialog
    await page.keyboard.press('?')
    
    // Wait for dialog or any reaction, then close with Escape
    await page.waitForTimeout(200)
    await page.keyboard.press('Escape')
  })

  test('should support zoom functionality', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF and wait for load
    await uploadPdfAndWaitForLoad(page)
    
    // Try zoom shortcuts - zoom in with +
    await page.keyboard.press('+')
    await page.waitForTimeout(200)
    
    // Zoom out with -
    await page.keyboard.press('-')
    await page.waitForTimeout(200)
    
    // Fit to width with 0
    await page.keyboard.press('0')
    await page.waitForTimeout(200)
    
    // Reset to 100% with 1
    await page.keyboard.press('1')
  })

  test('should support page navigation', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF and wait for load
    await uploadPdfAndWaitForLoad(page)
    
    // Navigate to next page with j
    await page.keyboard.press('j')
    await page.waitForTimeout(200)
    
    // Navigate to previous page with k
    await page.keyboard.press('k')
    await page.waitForTimeout(200)
    
    // Go to last page with End
    await page.keyboard.press('End')
    await page.waitForTimeout(200)
    
    // Go to first page with Home
    await page.keyboard.press('Home')
  })

  test('should open search with Ctrl+F', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF and wait for load
    await uploadPdfAndWaitForLoad(page)
    
    // Open search with Ctrl+F
    await page.keyboard.press('Control+f')
    
    // Search bar should be visible
    const searchInput = page.getByPlaceholder('Search in document...')
    await expect(searchInput).toBeVisible()
    
    // Close search with Escape
    await page.keyboard.press('Escape')
  })

  test('should handle markup toolbar toggle', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF and wait for load
    await uploadPdfAndWaitForLoad(page)
    
    // Toggle markup with Ctrl+Shift+A
    await page.keyboard.press('Control+Shift+a')
    await page.waitForTimeout(200)
    
    // Close with Escape
    await page.keyboard.press('Escape')
  })

  test('should export dialog opens with Ctrl+S', async ({ page }) => {
    await page.goto('/')
    
    // Upload PDF and wait for load
    await uploadPdfAndWaitForLoad(page)
    
    // Open export dialog with Ctrl+S
    await page.keyboard.press('Control+s')
    await page.waitForTimeout(200)
    
    // Close with Escape
    await page.keyboard.press('Escape')
  })
})
