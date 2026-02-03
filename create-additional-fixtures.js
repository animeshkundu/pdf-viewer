// Create additional comprehensive test PDFs
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a PDF with text for search testing
async function createSearchTestPDF() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1
  const page1 = pdfDoc.addPage([612, 792]);
  const { width, height } = page1.getSize();
  
  page1.drawText('Search Test Document', {
    x: 50,
    y: height - 100,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  const searchableText = [
    'The quick brown fox jumps over the lazy dog.',
    'This document contains multiple UNIQUE keywords.',
    'Search functionality should find UNIQUE terms easily.',
    'Testing search with repeated words: test test test.',
    'Case sensitivity: UPPERCASE lowercase MixedCase.',
    'Numbers: 12345 67890 24680 13579.',
    'Special characters: @#$% &*() []{}.',
    'Email: test@example.com phone: 555-1234.',
  ];
  
  let yPos = height - 150;
  for (const text of searchableText) {
    page1.drawText(text, {
      x: 50,
      y: yPos,
      size: 12,
      font: font,
    });
    yPos -= 30;
  }

  // Page 2 with more content
  const page2 = pdfDoc.addPage([612, 792]);
  page2.drawText('Page 2: More UNIQUE Content', {
    x: 50,
    y: height - 100,
    size: 18,
    font: boldFont,
  });
  
  const moreText = [
    'Additional UNIQUE keywords appear on this page.',
    'Multi-page search should work across all pages.',
    'Finding text on different pages is important.',
    'UNIQUE occurrences: first, second, third.',
    'Navigation between search results matters.',
  ];
  
  yPos = height - 150;
  for (const text of moreText) {
    page2.drawText(text, {
      x: 50,
      y: yPos,
      size: 12,
      font: font,
    });
    yPos -= 30;
  }

  return pdfDoc;
}

// Create a PDF for annotation testing with clear areas
async function createAnnotationTestPDF() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  
  page.drawText('Annotation Test Document', {
    x: 50,
    y: height - 100,
    size: 24,
    font: boldFont,
  });

  // Draw areas for different annotation types
  page.drawText('Highlight this text for testing', {
    x: 50,
    y: height - 150,
    size: 14,
    font: font,
  });

  page.drawText('Add a text annotation here', {
    x: 50,
    y: height - 200,
    size: 14,
    font: font,
  });

  page.drawRectangle({
    x: 50,
    y: height - 300,
    width: 200,
    height: 50,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  
  page.drawText('Draw shapes in this area', {
    x: 60,
    y: height - 280,
    size: 12,
    font: font,
  });

  page.drawRectangle({
    x: 300,
    y: height - 300,
    width: 250,
    height: 100,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });
  
  page.drawText('Signature area', {
    x: 310,
    y: height - 260,
    size: 12,
    font: font,
  });

  return pdfDoc;
}

// Create a PDF for page management testing
async function createPageManagementPDF() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Create 10 pages for testing rotation, deletion, reordering
  for (let i = 1; i <= 10; i++) {
    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();
    
    page.drawText(`Page ${i} of 10`, {
      x: width / 2 - 40,
      y: height / 2,
      size: 24,
      font: boldFont,
    });

    page.drawText(`This is page number ${i}`, {
      x: width / 2 - 60,
      y: height / 2 - 40,
      size: 14,
      font: font,
    });

    // Draw page corner indicators
    page.drawText(`P${i}`, {
      x: 20,
      y: height - 30,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText(`Page ${i}`, {
      x: width / 2 - 20,
      y: 20,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  return pdfDoc;
}

// Create a PDF for watermark testing
async function createWatermarkTestPDF() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Create 3 pages
  for (let i = 1; i <= 3; i++) {
    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();
    
    page.drawText(`Watermark Test - Page ${i}`, {
      x: 50,
      y: height - 100,
      size: 20,
      font: boldFont,
    });

    page.drawText('This document is for watermark testing.', {
      x: 50,
      y: height - 150,
      size: 14,
      font: font,
    });

    page.drawText('Watermark should appear on all pages.', {
      x: 50,
      y: height - 180,
      size: 14,
      font: font,
    });

    // Add some content blocks
    page.drawRectangle({
      x: 50,
      y: 200,
      width: width - 100,
      height: 300,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
    });
  }

  return pdfDoc;
}

// Create a PDF for text editing
async function createTextEditPDF() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  
  page.drawText('Text Editing Test Document', {
    x: 50,
    y: height - 100,
    size: 24,
    font: boldFont,
  });

  page.drawText('This text can be edited and modified.', {
    x: 50,
    y: height - 150,
    size: 14,
    font: font,
  });

  page.drawText('Select text blocks to edit content.', {
    x: 50,
    y: height - 180,
    size: 14,
    font: font,
  });

  page.drawText('Original text content.', {
    x: 50,
    y: height - 230,
    size: 12,
    font: font,
  });

  page.drawText('Another editable paragraph here.', {
    x: 50,
    y: height - 260,
    size: 12,
    font: font,
  });

  page.drawText('Testing text editing features.', {
    x: 50,
    y: height - 290,
    size: 12,
    font: font,
  });

  return pdfDoc;
}

// Create a form-fillable PDF
async function createFormPDF() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  
  page.drawText('Form Testing Document', {
    x: 50,
    y: height - 100,
    size: 24,
    font: boldFont,
  });

  // Create form fields
  const form = pdfDoc.getForm();

  // Text field
  page.drawText('Name:', {
    x: 50,
    y: height - 150,
    size: 12,
    font: font,
  });
  
  page.drawRectangle({
    x: 120,
    y: height - 155,
    width: 200,
    height: 20,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  const nameField = form.createTextField('name');
  nameField.addToPage(page, {
    x: 120,
    y: height - 155,
    width: 200,
    height: 20,
  });

  // Email field
  page.drawText('Email:', {
    x: 50,
    y: height - 200,
    size: 12,
    font: font,
  });
  
  page.drawRectangle({
    x: 120,
    y: height - 205,
    width: 200,
    height: 20,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  const emailField = form.createTextField('email');
  emailField.addToPage(page, {
    x: 120,
    y: height - 205,
    width: 200,
    height: 20,
  });

  // Checkbox
  page.drawText('Accept terms:', {
    x: 50,
    y: height - 250,
    size: 12,
    font: font,
  });

  const checkbox = form.createCheckBox('terms');
  checkbox.addToPage(page, {
    x: 150,
    y: height - 255,
    width: 15,
    height: 15,
  });

  return pdfDoc;
}

async function main() {
  const fixturesDir = path.join(__dirname, 'e2e', 'fixtures');
  
  console.log('Creating comprehensive test PDFs...');

  // Create search test PDF
  const searchPdf = await createSearchTestPDF();
  await fs.writeFile(
    path.join(fixturesDir, 'search-test.pdf'),
    await searchPdf.save()
  );
  console.log('✓ Created search-test.pdf (2 pages with searchable content)');

  // Create annotation test PDF
  const annotationPdf = await createAnnotationTestPDF();
  await fs.writeFile(
    path.join(fixturesDir, 'annotation-test.pdf'),
    await annotationPdf.save()
  );
  console.log('✓ Created annotation-test.pdf (1 page for annotations)');

  // Create page management PDF
  const pageManagementPdf = await createPageManagementPDF();
  await fs.writeFile(
    path.join(fixturesDir, 'page-management-test.pdf'),
    await pageManagementPdf.save()
  );
  console.log('✓ Created page-management-test.pdf (10 pages)');

  // Create watermark test PDF
  const watermarkPdf = await createWatermarkTestPDF();
  await fs.writeFile(
    path.join(fixturesDir, 'watermark-test.pdf'),
    await watermarkPdf.save()
  );
  console.log('✓ Created watermark-test.pdf (3 pages)');

  // Create text edit PDF
  const textEditPdf = await createTextEditPDF();
  await fs.writeFile(
    path.join(fixturesDir, 'text-edit-test.pdf'),
    await textEditPdf.save()
  );
  console.log('✓ Created text-edit-test.pdf (1 page with editable text)');

  // Create form PDF
  const formPdf = await createFormPDF();
  await fs.writeFile(
    path.join(fixturesDir, 'form-test.pdf'),
    await formPdf.save()
  );
  console.log('✓ Created form-test.pdf (1 page with form fields)');

  console.log('\n✅ All test PDFs created successfully!');
}

main().catch(console.error);
