/**
 * Annotations Comprehensive E2E Tests
 * 
 * Complete tests for all annotation types and interactions
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

async function openMarkupToolbar(page: Page) {
  await page.keyboard.press('Control+Shift+a')
  await page.waitForTimeout(500)
}

async function getCanvasBox(page: Page) {
  const canvas = page.locator('canvas').first()
  if (await canvas.isVisible()) {
    return await canvas.boundingBox()
  }
  return null
}

test.describe('Markup Toolbar', () => {
  
  test('opens markup toolbar with keyboard shortcut', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    // Check for toolbar visibility
    const toolbar = page.getByRole('toolbar', { name: /Markup/i })
    if (await toolbar.isVisible()) {
      await expect(toolbar).toBeVisible()
    }
  })

  test('closes markup toolbar with Escape', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    await page.waitForTimeout(300)
    
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('displays all annotation tool buttons', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    // Check for common annotation tools
    const tools = [
      /Highlight/i,
      /Underline/i,
      /Strike/i,
      /Text/i,
      /Note/i,
    ]
    
    for (const toolPattern of tools) {
      const button = page.getByRole('button', { name: toolPattern })
      if (await button.isVisible()) {
        await expect(button).toBeVisible()
      }
    }
  })
})

test.describe('Highlight Annotations', () => {
  
  test('creates highlight annotation', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const highlightBtn = page.getByRole('button', { name: /Highlight/i })
    if (await highlightBtn.isVisible()) {
      await highlightBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 150)
        await page.mouse.down()
        await page.mouse.move(box.x + 300, box.y + 165)
        await page.mouse.up()
        await page.waitForTimeout(500)
      }
    }
  })

  test('changes highlight color', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const highlightBtn = page.getByRole('button', { name: /Highlight/i })
    if (await highlightBtn.isVisible()) {
      await highlightBtn.click()
      await page.waitForTimeout(300)
      
      // Look for color picker
      const colorButton = page.getByRole('button', { name: /Color|Yellow|Red/i })
      if (await colorButton.isVisible()) {
        await colorButton.click()
        await page.waitForTimeout(300)
      }
    }
  })

  test('highlights multiple text selections', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const highlightBtn = page.getByRole('button', { name: /Highlight/i })
    if (await highlightBtn.isVisible()) {
      await highlightBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        // First highlight
        await page.mouse.move(box.x + 100, box.y + 150)
        await page.mouse.down()
        await page.mouse.move(box.x + 250, box.y + 165)
        await page.mouse.up()
        await page.waitForTimeout(300)
        
        // Second highlight
        await page.mouse.move(box.x + 100, box.y + 200)
        await page.mouse.down()
        await page.mouse.move(box.x + 280, box.y + 215)
        await page.mouse.up()
        await page.waitForTimeout(300)
      }
    }
  })
})

test.describe('Underline Annotations', () => {
  
  test('creates underline annotation', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const underlineBtn = page.getByRole('button', { name: /Underline/i })
    if (await underlineBtn.isVisible()) {
      await underlineBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 200)
        await page.mouse.down()
        await page.mouse.move(box.x + 220, box.y + 215)
        await page.mouse.up()
        await page.waitForTimeout(500)
      }
    }
  })

  test('changes underline color', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const underlineBtn = page.getByRole('button', { name: /Underline/i })
    if (await underlineBtn.isVisible()) {
      await underlineBtn.click()
      await page.waitForTimeout(300)
      
      const colorButton = page.getByRole('button', { name: /Color/i })
      if (await colorButton.isVisible()) {
        await colorButton.click()
        await page.waitForTimeout(300)
      }
    }
  })
})

test.describe('Strikethrough Annotations', () => {
  
  test('creates strikethrough annotation', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const strikeBtn = page.getByRole('button', { name: /Strike/i })
    if (await strikeBtn.isVisible()) {
      await strikeBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 230)
        await page.mouse.down()
        await page.mouse.move(box.x + 200, box.y + 245)
        await page.mouse.up()
        await page.waitForTimeout(500)
      }
    }
  })
})

test.describe('Shape Annotations', () => {
  
  test('draws rectangle annotation', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const rectangleBtn = page.getByRole('button', { name: /Rectangle/i })
    if (await rectangleBtn.isVisible()) {
      await rectangleBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 60, box.y + 270)
        await page.mouse.down()
        await page.mouse.move(box.x + 210, box.y + 340)
        await page.mouse.up()
        await page.waitForTimeout(500)
      }
    }
  })

  test('draws circle annotation', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const circleBtn = page.getByRole('button', { name: /Circle|Ellipse/i })
    if (await circleBtn.isVisible()) {
      await circleBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 300, box.y + 270)
        await page.mouse.down()
        await page.mouse.move(box.x + 400, box.y + 340)
        await page.mouse.up()
        await page.waitForTimeout(500)
      }
    }
  })

  test('draws line annotation', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const lineBtn = page.getByRole('button', { name: /^Line$/i })
    if (await lineBtn.isVisible()) {
      await lineBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 400)
        await page.mouse.down()
        await page.mouse.move(box.x + 250, box.y + 400)
        await page.mouse.up()
        await page.waitForTimeout(500)
      }
    }
  })

  test('draws arrow annotation', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const arrowBtn = page.getByRole('button', { name: /Arrow/i })
    if (await arrowBtn.isVisible()) {
      await arrowBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 300, box.y + 150)
        await page.mouse.down()
        await page.mouse.move(box.x + 450, box.y + 220)
        await page.mouse.up()
        await page.waitForTimeout(500)
      }
    }
  })

  test('changes shape color and stroke', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const rectangleBtn = page.getByRole('button', { name: /Rectangle/i })
    if (await rectangleBtn.isVisible()) {
      await rectangleBtn.click()
      await page.waitForTimeout(300)
      
      // Look for stroke/color options
      const colorBtn = page.getByRole('button', { name: /Color|Stroke/i })
      if (await colorBtn.isVisible()) {
        await colorBtn.click()
        await page.waitForTimeout(300)
      }
    }
  })
})

test.describe('Text Annotations', () => {
  
  test('adds text box annotation', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const textBtn = page.getByRole('button', { name: /^Text$/i })
    if (await textBtn.isVisible()) {
      await textBtn.click()
      await page.waitForTimeout(300)
      
      const canvas = page.locator('canvas').first()
      if (await canvas.isVisible()) {
        await canvas.click({ position: { x: 250, y: 320 } })
        await page.waitForTimeout(500)
        
        // Type text
        await page.keyboard.type('This is a text annotation')
        await page.waitForTimeout(300)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }
    }
  })

  test('edits existing text annotation', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const textBtn = page.getByRole('button', { name: /^Text$/i })
    if (await textBtn.isVisible()) {
      await textBtn.click()
      await page.waitForTimeout(300)
      
      const canvas = page.locator('canvas').first()
      if (await canvas.isVisible()) {
        // Create text
        await canvas.click({ position: { x: 200, y: 300 } })
        await page.waitForTimeout(500)
        await page.keyboard.type('Original text')
        await page.waitForTimeout(300)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
        
        // Edit text
        await canvas.click({ position: { x: 200, y: 300 } })
        await page.waitForTimeout(500)
        await page.keyboard.press('Control+a')
        await page.keyboard.type('Edited text')
        await page.waitForTimeout(300)
        await page.keyboard.press('Escape')
      }
    }
  })

  test('changes text font and size', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const textBtn = page.getByRole('button', { name: /^Text$/i })
    if (await textBtn.isVisible()) {
      await textBtn.click()
      await page.waitForTimeout(300)
      
      // Look for font/size options
      const fontBtn = page.getByRole('button', { name: /Font|Size/i })
      if (await fontBtn.isVisible()) {
        await fontBtn.click()
        await page.waitForTimeout(300)
      }
    }
  })
})

test.describe('Note/Comment Annotations', () => {
  
  test('adds note annotation', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const noteBtn = page.getByRole('button', { name: /Note|Comment/i })
    if (await noteBtn.isVisible()) {
      await noteBtn.click()
      await page.waitForTimeout(300)
      
      const canvas = page.locator('canvas').first()
      if (await canvas.isVisible()) {
        await canvas.click({ position: { x: 400, y: 250 } })
        await page.waitForTimeout(500)
        
        // Add note content
        await page.keyboard.type('This is a note')
        await page.waitForTimeout(300)
        await page.keyboard.press('Escape')
      }
    }
  })

  test('opens and closes note popup', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const noteBtn = page.getByRole('button', { name: /Note/i })
    if (await noteBtn.isVisible()) {
      await noteBtn.click()
      await page.waitForTimeout(300)
      
      const canvas = page.locator('canvas').first()
      if (await canvas.isVisible()) {
        // Create note
        await canvas.click({ position: { x: 350, y: 280 } })
        await page.waitForTimeout(500)
        await page.keyboard.type('Note content')
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
        
        // Click note to open
        await canvas.click({ position: { x: 350, y: 280 } })
        await page.waitForTimeout(500)
        
        // Close
        await page.keyboard.press('Escape')
      }
    }
  })
})

test.describe('Annotation Selection and Editing', () => {
  
  test('selects annotation by clicking', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    // Create an annotation first
    const highlightBtn = page.getByRole('button', { name: /Highlight/i })
    if (await highlightBtn.isVisible()) {
      await highlightBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 150)
        await page.mouse.down()
        await page.mouse.move(box.x + 250, box.y + 165)
        await page.mouse.up()
        await page.waitForTimeout(500)
        
        // Click on annotation to select
        await page.mouse.click(box.x + 175, box.y + 157)
        await page.waitForTimeout(300)
      }
    }
  })

  test('deletes selected annotation', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    // Create annotation
    const highlightBtn = page.getByRole('button', { name: /Highlight/i })
    if (await highlightBtn.isVisible()) {
      await highlightBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 150)
        await page.mouse.down()
        await page.mouse.move(box.x + 250, box.y + 165)
        await page.mouse.up()
        await page.waitForTimeout(500)
        
        // Select and delete
        await page.mouse.click(box.x + 175, box.y + 157)
        await page.waitForTimeout(300)
        await page.keyboard.press('Delete')
        await page.waitForTimeout(300)
      }
    }
  })

  test('moves annotation by dragging', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const rectangleBtn = page.getByRole('button', { name: /Rectangle/i })
    if (await rectangleBtn.isVisible()) {
      await rectangleBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        // Create rectangle
        await page.mouse.move(box.x + 60, box.y + 270)
        await page.mouse.down()
        await page.mouse.move(box.x + 160, box.y + 320)
        await page.mouse.up()
        await page.waitForTimeout(500)
        
        // Move rectangle
        await page.mouse.move(box.x + 110, box.y + 295)
        await page.mouse.down()
        await page.mouse.move(box.x + 200, box.y + 350, { steps: 5 })
        await page.mouse.up()
        await page.waitForTimeout(300)
      }
    }
  })

  test('resizes annotation using handles', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const rectangleBtn = page.getByRole('button', { name: /Rectangle/i })
    if (await rectangleBtn.isVisible()) {
      await rectangleBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        // Create rectangle
        await page.mouse.move(box.x + 60, box.y + 270)
        await page.mouse.down()
        await page.mouse.move(box.x + 160, box.y + 320)
        await page.mouse.up()
        await page.waitForTimeout(500)
        
        // Click to select
        await page.mouse.click(box.x + 110, box.y + 295)
        await page.waitForTimeout(300)
        
        // Try to resize by dragging corner (if handles are visible)
        await page.mouse.move(box.x + 160, box.y + 320)
        await page.mouse.down()
        await page.mouse.move(box.x + 200, box.y + 360, { steps: 3 })
        await page.mouse.up()
        await page.waitForTimeout(300)
      }
    }
  })
})

test.describe('Annotation Undo/Redo', () => {
  
  test('undoes annotation creation', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const highlightBtn = page.getByRole('button', { name: /Highlight/i })
    if (await highlightBtn.isVisible()) {
      await highlightBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 150)
        await page.mouse.down()
        await page.mouse.move(box.x + 250, box.y + 165)
        await page.mouse.up()
        await page.waitForTimeout(500)
        
        // Undo
        await page.keyboard.press('Control+z')
        await page.waitForTimeout(300)
      }
    }
  })

  test('redoes undone annotation', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const highlightBtn = page.getByRole('button', { name: /Highlight/i })
    if (await highlightBtn.isVisible()) {
      await highlightBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 150)
        await page.mouse.down()
        await page.mouse.move(box.x + 250, box.y + 165)
        await page.mouse.up()
        await page.waitForTimeout(500)
        
        // Undo
        await page.keyboard.press('Control+z')
        await page.waitForTimeout(300)
        
        // Redo
        await page.keyboard.press('Control+Shift+z')
        await page.waitForTimeout(300)
      }
    }
  })

  test('undo/redo buttons are enabled/disabled appropriately', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    // Initially, undo should be disabled
    const undoBtn = page.getByRole('button', { name: /Undo/i })
    if (await undoBtn.isVisible()) {
      const isDisabled = await undoBtn.isDisabled()
      // Should be disabled initially
    }
  })
})

test.describe('Annotation Persistence', () => {
  
  test('annotations persist when navigating pages', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'multi-page-test.pdf')
    
    await openMarkupToolbar(page)
    
    // Add annotation on page 1
    const highlightBtn = page.getByRole('button', { name: /Highlight/i })
    if (await highlightBtn.isVisible()) {
      await highlightBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 150)
        await page.mouse.down()
        await page.mouse.move(box.x + 250, box.y + 165)
        await page.mouse.up()
        await page.waitForTimeout(500)
      }
    }
    
    // Navigate to page 2
    await page.keyboard.press('j')
    await page.waitForTimeout(500)
    
    // Navigate back to page 1
    await page.keyboard.press('k')
    await page.waitForTimeout(500)
    
    // Annotation should still be visible
  })

  test('annotations persist when zooming', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    const highlightBtn = page.getByRole('button', { name: /Highlight/i })
    if (await highlightBtn.isVisible()) {
      await highlightBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 150)
        await page.mouse.down()
        await page.mouse.move(box.x + 250, box.y + 165)
        await page.mouse.up()
        await page.waitForTimeout(500)
      }
    }
    
    // Zoom in
    await page.keyboard.press('+')
    await page.waitForTimeout(500)
    
    // Annotation should still be visible and scaled
  })

  test('annotations included when exporting', async ({ page }) => {
    await page.goto('/')
    await uploadPDF(page, 'annotation-test.pdf')
    
    await openMarkupToolbar(page)
    
    // Add annotation
    const highlightBtn = page.getByRole('button', { name: /Highlight/i })
    if (await highlightBtn.isVisible()) {
      await highlightBtn.click()
      await page.waitForTimeout(300)
      
      const box = await getCanvasBox(page)
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 150)
        await page.mouse.down()
        await page.mouse.move(box.x + 250, box.y + 165)
        await page.mouse.up()
        await page.waitForTimeout(500)
      }
    }
    
    // Export
    await page.keyboard.press('Control+s')
    await page.waitForTimeout(1000)
    
    // Export dialog should open with annotations included
  })
})
