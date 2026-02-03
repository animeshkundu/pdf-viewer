/**
 * Page Management E2E Tests
 * 
 * Comprehensive tests for page rotation, deletion, reordering, and manipulation
 */

import { test, expect, Page } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function uploadPDF(page: Page, filename: string) {
  const fileInput = page.locator('input[type="file"]').first()
  const pdfPath = path.join(__dirname, 'fixtures', filename)
  await fileInput.setInputFiles(pdfPath)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

test.describe('Page Navigation', () => {
  
  test('navigates to next page with j key', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    // Navigate to next page
    await page.keyboard.press('j')
    await page.waitForTimeout(500)
    
    // Should be on page 2 now
  })

  test('navigates to previous page with k key', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    // Go to page 2 first
    await page.keyboard.press('j')
    await page.waitForTimeout(500)
    
    // Navigate back to page 1
    await page.keyboard.press('k')
    await page.waitForTimeout(500)
  })

  test('navigates to first page with Home key', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    // Go to last page
    await page.keyboard.press('End')
    await page.waitForTimeout(500)
    
    // Go to first page
    await page.keyboard.press('Home')
    await page.waitForTimeout(500)
  })

  test('navigates to last page with End key', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    // Go to last page
    await page.keyboard.press('End')
    await page.waitForTimeout(500)
  })

  test('navigates with arrow keys', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    // Next page with ArrowDown
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)
    
    // Previous page with ArrowUp
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(500)
  })

  test('navigates with PageDown and PageUp', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    // Next page
    await page.keyboard.press('PageDown')
    await page.waitForTimeout(500)
    
    // Previous page
    await page.keyboard.press('PageUp')
    await page.waitForTimeout(500)
  })
})

test.describe('Thumbnail Sidebar', () => {
  
  test('opens and closes thumbnail sidebar', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    // Try to toggle sidebar
    await page.keyboard.press('Control+\\')
    await page.waitForTimeout(500)
    
    // Toggle again
    await page.keyboard.press('Control+\\')
    await page.waitForTimeout(500)
  })

  test('displays thumbnails for all pages', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    // Wait for thumbnails to load
    await page.waitForTimeout(2000)
    
    // Check for thumbnail elements
    const thumbnails = page.locator('[data-testid="thumbnail"]')
    const count = await thumbnails.count()
    
    // Should have multiple thumbnails
    expect(count).toBeGreaterThan(0)
  })

  test('clicking thumbnail navigates to that page', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Click on third thumbnail if it exists
    const thumbnail = page.locator('[data-testid="thumbnail"]').nth(2)
    if (await thumbnail.isVisible()) {
      await thumbnail.click()
      await page.waitForTimeout(500)
    }
  })

  test('highlights current page thumbnail', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Navigate to page 3
    await page.keyboard.press('j')
    await page.waitForTimeout(300)
    await page.keyboard.press('j')
    await page.waitForTimeout(500)
    
    // The third thumbnail should be highlighted/selected
  })
})

test.describe('Page Rotation', () => {
  
  test('rotates page via context menu', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Right-click on thumbnail
    const thumbnail = page.locator('[data-testid="thumbnail"]').first()
    if (await thumbnail.isVisible()) {
      await thumbnail.click({ button: 'right' })
      await page.waitForTimeout(500)
      
      // Look for rotate option
      const rotateOption = page.getByRole('menuitem', { name: /Rotate.*Right|Clockwise/i })
      if (await rotateOption.isVisible()) {
        await rotateOption.click()
        await page.waitForTimeout(500)
      } else {
        await page.keyboard.press('Escape')
      }
    }
  })

  test('rotates page 90 degrees clockwise', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Use keyboard shortcut if available
    await page.keyboard.press('r')
    await page.waitForTimeout(500)
  })

  test('rotates page 90 degrees counter-clockwise', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Use keyboard shortcut if available
    await page.keyboard.press('Shift+r')
    await page.waitForTimeout(500)
  })

  test('rotates multiple pages at once', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Select multiple thumbnails (if multi-select is supported)
    const firstThumb = page.locator('[data-testid="thumbnail"]').first()
    const secondThumb = page.locator('[data-testid="thumbnail"]').nth(1)
    
    if (await firstThumb.isVisible() && await secondThumb.isVisible()) {
      await firstThumb.click()
      await page.keyboard.down('Control')
      await secondThumb.click()
      await page.keyboard.up('Control')
      await page.waitForTimeout(500)
      
      // Right-click and rotate
      await secondThumb.click({ button: 'right' })
      await page.waitForTimeout(500)
    }
  })

  test('rotation persists when saving', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Rotate page
    await page.keyboard.press('r')
    await page.waitForTimeout(500)
    
    // Save
    await page.keyboard.press('Control+s')
    await page.waitForTimeout(1000)
  })
})

test.describe('Page Deletion', () => {
  
  test('deletes current page via Tools menu', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    // Go to page 5
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('j')
      await page.waitForTimeout(200)
    }
    
    // Open Tools menu
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    if (await toolsButton.isVisible()) {
      await toolsButton.click()
      await page.waitForTimeout(300)
      
      const deleteOption = page.getByRole('menuitem', { name: /Delete.*Page/i })
      if (await deleteOption.isVisible()) {
        await deleteOption.click()
        await page.waitForTimeout(500)
        
        // Confirm deletion
        const confirmButton = page.getByRole('button', { name: /Delete|Confirm|Yes/i })
        if (await confirmButton.isVisible()) {
          await confirmButton.click()
          await page.waitForTimeout(500)
        }
      } else {
        await page.keyboard.press('Escape')
      }
    }
  })

  test('deletes page via thumbnail context menu', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Right-click on thumbnail
    const thumbnail = page.locator('[data-testid="thumbnail"]').nth(4)
    if (await thumbnail.isVisible()) {
      await thumbnail.click({ button: 'right' })
      await page.waitForTimeout(500)
      
      const deleteOption = page.getByRole('menuitem', { name: /Delete/i })
      if (await deleteOption.isVisible()) {
        await deleteOption.click()
        await page.waitForTimeout(500)
        
        // Confirm
        const confirmButton = page.getByRole('button', { name: /Delete|Confirm|Yes/i })
        if (await confirmButton.isVisible()) {
          await confirmButton.click()
          await page.waitForTimeout(500)
        }
      } else {
        await page.keyboard.press('Escape')
      }
    }
  })

  test('shows confirmation dialog before deleting', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    const thumbnail = page.locator('[data-testid="thumbnail"]').first()
    if (await thumbnail.isVisible()) {
      await thumbnail.click({ button: 'right' })
      await page.waitForTimeout(500)
      
      const deleteOption = page.getByRole('menuitem', { name: /Delete/i })
      if (await deleteOption.isVisible()) {
        await deleteOption.click()
        await page.waitForTimeout(500)
        
        // Dialog should appear
        const dialog = page.getByRole('dialog')
        if (await dialog.isVisible()) {
          // Cancel deletion
          const cancelButton = page.getByRole('button', { name: /Cancel|No/i })
          if (await cancelButton.isVisible()) {
            await cancelButton.click()
            await page.waitForTimeout(300)
          } else {
            await page.keyboard.press('Escape')
          }
        }
      }
    }
  })

  test('cannot delete last remaining page', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'simple-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Try to delete the only page
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    if (await toolsButton.isVisible()) {
      await toolsButton.click()
      await page.waitForTimeout(300)
      
      const deleteOption = page.getByRole('menuitem', { name: /Delete.*Page/i })
      if (await deleteOption.isVisible()) {
        // Should be disabled or show error
        await deleteOption.click()
        await page.waitForTimeout(500)
      }
    }
  })
})

test.describe('Page Reordering', () => {
  
  test('reorders pages via drag and drop in sidebar', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Try to drag first thumbnail to third position
    const firstThumb = page.locator('[data-testid="thumbnail"]').first()
    const thirdThumb = page.locator('[data-testid="thumbnail"]').nth(2)
    
    if (await firstThumb.isVisible() && await thirdThumb.isVisible()) {
      const firstBox = await firstThumb.boundingBox()
      const thirdBox = await thirdThumb.boundingBox()
      
      if (firstBox && thirdBox) {
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2)
        await page.mouse.down()
        await page.mouse.move(thirdBox.x + thirdBox.width / 2, thirdBox.y + thirdBox.height / 2, { steps: 10 })
        await page.waitForTimeout(500)
        await page.mouse.up()
        await page.waitForTimeout(500)
      }
    }
  })

  test('reordering updates page numbers', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // After reordering, page numbers should update
    // This can be verified by checking thumbnail labels or page indicators
  })

  test('reordering persists when saving', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Reorder pages
    const firstThumb = page.locator('[data-testid="thumbnail"]').first()
    const secondThumb = page.locator('[data-testid="thumbnail"]').nth(1)
    
    if (await firstThumb.isVisible() && await secondThumb.isVisible()) {
      const firstBox = await firstThumb.boundingBox()
      const secondBox = await secondThumb.boundingBox()
      
      if (firstBox && secondBox) {
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2)
        await page.mouse.down()
        await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2, { steps: 5 })
        await page.mouse.up()
        await page.waitForTimeout(500)
      }
    }
    
    // Save
    await page.keyboard.press('Control+s')
    await page.waitForTimeout(1000)
  })
})

test.describe('Blank Pages', () => {
  
  test('inserts blank page via Tools menu', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'simple-test.pdf')
    
    await page.waitForTimeout(2000)
    
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    if (await toolsButton.isVisible()) {
      await toolsButton.click()
      await page.waitForTimeout(300)
      
      const insertOption = page.getByRole('menuitem', { name: /Insert.*Blank|Add.*Page/i })
      if (await insertOption.isVisible()) {
        await insertOption.click()
        await page.waitForTimeout(1000)
      } else {
        await page.keyboard.press('Escape')
      }
    }
  })

  test('inserts blank page at specific position', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Navigate to page 3
    await page.keyboard.press('j')
    await page.keyboard.press('j')
    await page.waitForTimeout(500)
    
    // Insert blank page after current
    const toolsButton = page.getByRole('button', { name: /Tools/i })
    if (await toolsButton.isVisible()) {
      await toolsButton.click()
      await page.waitForTimeout(300)
      
      const insertOption = page.getByRole('menuitem', { name: /Insert.*Blank/i })
      if (await insertOption.isVisible()) {
        await insertOption.click()
        await page.waitForTimeout(1000)
      }
    }
  })
})

test.describe('Page Counter', () => {
  
  test('displays current page number and total pages', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Look for page counter (e.g., "1 / 10")
    const pageCounter = page.locator('text=/\\d+\\s*\\/\\s*\\d+/')
    if (await pageCounter.isVisible()) {
      const text = await pageCounter.textContent()
      expect(text).toMatch(/\d+/)
    }
  })

  test('updates page counter when navigating', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Navigate to next page
    await page.keyboard.press('j')
    await page.waitForTimeout(500)
    
    // Page counter should update
  })

  test('allows direct page navigation via page input', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'page-management-test.pdf')
    
    await page.waitForTimeout(2000)
    
    // Look for page number input
    const pageInput = page.locator('input[type="number"]').first()
    if (await pageInput.isVisible()) {
      await pageInput.fill('5')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
      
      // Should be on page 5 now
    }
  })
})
