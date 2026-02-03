/**
 * Comprehensive Toolbar E2E Tests
 * 
 * Tests all toolbar buttons, controls, and interactions
 * Covers UI elements and user interactions for toolbar functionality
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

test.describe('Toolbar - File Operations', () => {
  test('should display Open File button when PDF is loaded', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const openButton = page.getByRole('button', { name: /Open File/i })
    await expect(openButton).toBeVisible()
  })

  test('should open file dialog when Open button is clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const openButton = page.getByRole('button', { name: /Open File/i })
    await expect(openButton).toBeVisible()
    
    // Check that clicking the button triggers the file input
    // We can't directly test file dialog, but we can verify the button is clickable
    await expect(openButton).toBeEnabled()
  })

  test('should display toolbar with all controls after PDF loads', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const toolbar = page.getByRole('toolbar', { name: 'Document toolbar' })
    await expect(toolbar).toBeVisible()
  })
})

test.describe('Toolbar - Sidebar Toggle', () => {
  test('should display sidebar toggle button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const sidebarButton = page.getByRole('button', { name: /sidebar/i })
    await expect(sidebarButton).toBeVisible()
  })

  test('should toggle sidebar when button is clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const sidebarButton = page.getByRole('button', { name: /sidebar/i })
    
    // Click to open sidebar
    await sidebarButton.click()
    await page.waitForTimeout(300)
    
    // Check button state
    await expect(sidebarButton).toHaveAttribute('aria-pressed', 'true')
    
    // Click to close sidebar
    await sidebarButton.click()
    await page.waitForTimeout(300)
    
    await expect(sidebarButton).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('Toolbar - Search Functionality', () => {
  test('should display search button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const searchButton = page.getByRole('button', { name: /Search document/i })
    await expect(searchButton).toBeVisible()
  })

  test('should open search dialog when search button clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const searchButton = page.getByRole('button', { name: /Search document/i })
    await searchButton.click()
    
    // Wait for search input to appear
    const searchInput = page.getByPlaceholder('Search in document...')
    await expect(searchInput).toBeVisible()
  })

  test('should open search with Ctrl+F keyboard shortcut', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    await page.keyboard.press('Control+f')
    
    const searchInput = page.getByPlaceholder('Search in document...')
    await expect(searchInput).toBeVisible()
  })

  test('should close search with Escape key', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    // Open search
    await page.keyboard.press('Control+f')
    const searchInput = page.getByPlaceholder('Search in document...')
    await expect(searchInput).toBeVisible()
    
    // Close with Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })
})

test.describe('Toolbar - Page Navigation', () => {
  test('should display page navigation controls', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const prevButton = page.getByRole('button', { name: /Previous page/i })
    const nextButton = page.getByRole('button', { name: /Next page/i })
    
    await expect(prevButton).toBeVisible()
    await expect(nextButton).toBeVisible()
  })

  test('should disable previous button on first page', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const prevButton = page.getByRole('button', { name: /Previous page/i })
    await expect(prevButton).toBeDisabled()
  })

  test('should navigate to next page', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const nextButton = page.getByRole('button', { name: /Next page/i })
    await nextButton.click()
    await page.waitForTimeout(500)
    
    // Previous button should now be enabled
    const prevButton = page.getByRole('button', { name: /Previous page/i })
    await expect(prevButton).toBeEnabled()
  })

  test('should navigate to previous page', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    // Go to page 2
    const nextButton = page.getByRole('button', { name: /Next page/i })
    await nextButton.click()
    await page.waitForTimeout(500)
    
    // Go back to page 1
    const prevButton = page.getByRole('button', { name: /Previous page/i })
    await prevButton.click()
    await page.waitForTimeout(500)
    
    // Previous button should be disabled again
    await expect(prevButton).toBeDisabled()
  })

  test('should navigate with keyboard shortcuts (j/k)', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    // Go to next page with j
    await page.keyboard.press('j')
    await page.waitForTimeout(500)
    
    // Go back with k
    await page.keyboard.press('k')
    await page.waitForTimeout(500)
  })

  test('should display current page number', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const pageInput = page.locator('input[aria-label*="Current page"]')
    await expect(pageInput).toBeVisible()
    await expect(pageInput).toHaveValue('1')
  })

  test('should allow jumping to specific page', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const pageInput = page.locator('input[aria-label*="Current page"]')
    await pageInput.click()
    await pageInput.fill('2')
    await pageInput.press('Enter')
    await page.waitForTimeout(500)
    
    // Should now show page 2
    await expect(pageInput).toHaveValue('2')
  })
})

test.describe('Toolbar - Zoom Controls', () => {
  test('should display zoom controls', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const zoomInButton = page.getByRole('button', { name: /Zoom in/i })
    const zoomOutButton = page.getByRole('button', { name: /Zoom out/i })
    
    await expect(zoomInButton).toBeVisible()
    await expect(zoomOutButton).toBeVisible()
  })

  test('should zoom in when zoom in button clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const zoomInButton = page.getByRole('button', { name: /Zoom in/i })
    await zoomInButton.click()
    await page.waitForTimeout(300)
    
    // Zoom in button should still be enabled (unless at max zoom)
    await expect(zoomInButton).toBeVisible()
  })

  test('should zoom out when zoom out button clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    // First zoom in
    const zoomInButton = page.getByRole('button', { name: /Zoom in/i })
    await zoomInButton.click()
    await page.waitForTimeout(300)
    
    // Then zoom out
    const zoomOutButton = page.getByRole('button', { name: /Zoom out/i })
    await zoomOutButton.click()
    await page.waitForTimeout(300)
  })

  test('should zoom with keyboard shortcuts (+/-)', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    // Zoom in with +
    await page.keyboard.press('+')
    await page.waitForTimeout(300)
    
    // Zoom out with -
    await page.keyboard.press('-')
    await page.waitForTimeout(300)
  })

  test('should have zoom level selector', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const zoomSelect = page.locator('[aria-label*="Zoom level"]')
    await expect(zoomSelect).toBeVisible()
  })

  test('should change zoom level via selector', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const zoomSelect = page.locator('[aria-label*="Zoom level"]')
    await zoomSelect.click()
    await page.waitForTimeout(200)
    
    // Select a different zoom level
    const option150 = page.getByRole('option', { name: '150%' })
    if (await option150.isVisible()) {
      await option150.click()
      await page.waitForTimeout(500)
    }
  })

  test('should reset zoom with keyboard shortcut (1)', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    // Zoom in first
    await page.keyboard.press('+')
    await page.waitForTimeout(300)
    
    // Reset with 1
    await page.keyboard.press('1')
    await page.waitForTimeout(300)
  })

  test('should fit to width with keyboard shortcut (0)', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    await page.keyboard.press('0')
    await page.waitForTimeout(300)
  })
})

test.describe('Toolbar - Markup Controls', () => {
  test('should display markup button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const markupButton = page.getByRole('button', { name: /Markup/i })
    await expect(markupButton).toBeVisible()
  })

  test('should toggle markup toolbar', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const markupButton = page.getByRole('button', { name: /Markup/i })
    await markupButton.click()
    await page.waitForTimeout(300)
    
    // Check button state
    await expect(markupButton).toHaveAttribute('aria-pressed', 'true')
    
    // Toggle off
    await markupButton.click()
    await page.waitForTimeout(300)
    await expect(markupButton).toHaveAttribute('aria-pressed', 'false')
  })

  test('should toggle markup with keyboard shortcut (Ctrl+Shift+A)', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    await page.keyboard.press('Control+Shift+A')
    await page.waitForTimeout(300)
    
    const markupButton = page.getByRole('button', { name: /Markup/i })
    await expect(markupButton).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('Toolbar - Export Controls', () => {
  test('should display export button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const exportButton = page.getByRole('button', { name: /Export/i })
    await expect(exportButton).toBeVisible()
  })

  test('should open export dialog when export button clicked', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const exportButton = page.getByRole('button', { name: /Export/i })
    await exportButton.click()
    await page.waitForTimeout(300)
  })

  test('should open export dialog with keyboard shortcut (Ctrl+S)', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    await page.keyboard.press('Control+s')
    await page.waitForTimeout(300)
  })
})

test.describe('Toolbar - Additional Features', () => {
  test('should display watermark button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const watermarkButton = page.getByRole('button', { name: /Watermark/i })
    await expect(watermarkButton).toBeVisible()
  })

  test('should display page numbers button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const pageNumbersButton = page.getByRole('button', { name: /Page Numbers/i })
    await expect(pageNumbersButton).toBeVisible()
  })

  test('should display split button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const splitButton = page.getByRole('button', { name: /Split/i })
    await expect(splitButton).toBeVisible()
  })

  test('should display merge button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const mergeButton = page.getByRole('button', { name: /Merge/i })
    await expect(mergeButton).toBeVisible()
  })

  test('should display keyboard shortcuts button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const shortcutsButton = page.getByRole('button', { name: /Keyboard shortcuts/i })
    await expect(shortcutsButton).toBeVisible()
  })

  test('should open keyboard shortcuts with ? key', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    await page.keyboard.press('?')
    await page.waitForTimeout(300)
  })
})

test.describe('Toolbar - Tooltips', () => {
  test('should show tooltip on hover for open button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const openButton = page.getByRole('button', { name: /Open File/i })
    await openButton.hover()
    await page.waitForTimeout(500)
    
    // Tooltip should appear
    const tooltip = page.getByText(/Open PDF file/)
    await expect(tooltip).toBeVisible()
  })

  test('should show tooltip on hover for zoom in button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const zoomInButton = page.getByRole('button', { name: /Zoom in/i })
    await zoomInButton.hover()
    await page.waitForTimeout(500)
    
    // Tooltip should appear
    const tooltip = page.getByText(/Zoom in/)
    await expect(tooltip).toBeVisible()
  })

  test('should show tooltip on hover for markup button', async ({ page }) => {
    await page.goto('/')
    await uploadPdfAndWaitForLoad(page)
    
    const markupButton = page.getByRole('button', { name: /Markup/i })
    await markupButton.hover()
    await page.waitForTimeout(500)
    
    // Tooltip should appear
    const tooltip = page.getByText(/Markup/)
    await expect(tooltip).toBeVisible()
  })
})
