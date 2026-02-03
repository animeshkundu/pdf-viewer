// Script to create comprehensive test PDFs for E2E testing
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createMultiPagePDF() {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1 - Title page with various text
  const page1 = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page1.getSize();
  
  page1.drawText('PDF Viewer & Editor Test Document', {
    x: 50,
    y: height - 100,
    size: 24,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page1.drawText('This is a comprehensive test document for E2E testing.', {
    x: 50,
    y: height - 150,
    size: 14,
    font: helveticaFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  page1.drawText('Features to test:', {
    x: 50,
    y: height - 200,
    size: 16,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  const features = [
    '• Text editing and manipulation',
    '• Annotation tools (highlight, text, shapes)',
    '• Page management (rotate, delete, reorder)',
    '• Search functionality',
    '• Signatures and watermarks',
    '• Document splitting and merging'
  ];
  
  let yPos = height - 230;
  for (const feature of features) {
    page1.drawText(feature, {
      x: 70,
      y: yPos,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    yPos -= 25;
  }
  
  // Draw a rectangle
  page1.drawRectangle({
    x: 50,
    y: 100,
    width: 200,
    height: 100,
    borderColor: rgb(0, 0.5, 1),
    borderWidth: 2,
  });
  
  page1.drawText('Sample Rectangle', {
    x: 80,
    y: 140,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0.5, 1),
  });

  // Page 2 - Lorem ipsum with searchable text
  const page2 = pdfDoc.addPage([612, 792]);
  page2.drawText('Page 2: Sample Content for Search', {
    x: 50,
    y: height - 100,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  const loremText = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
    'This is a SEARCHABLE keyword for testing.',
    'Duis aute irure dolor in reprehenderit in voluptate velit.',
    'Esse cillum dolore eu fugiat nulla pariatur.',
    'Another SEARCHABLE term appears here.',
    'Excepteur sint occaecat cupidatat non proident.'
  ];
  
  yPos = height - 150;
  for (const line of loremText) {
    page2.drawText(line, {
      x: 50,
      y: yPos,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    yPos -= 30;
  }

  // Page 3 - Content for annotation testing
  const page3 = pdfDoc.addPage([612, 792]);
  page3.drawText('Page 3: Annotation Testing Area', {
    x: 50,
    y: height - 100,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page3.drawText('This text can be highlighted.', {
    x: 50,
    y: height - 150,
    size: 14,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  // Draw some shapes for annotation testing
  page3.drawCircle({
    x: 150,
    y: height - 250,
    size: 50,
    borderColor: rgb(1, 0, 0),
    borderWidth: 2,
  });
  
  page3.drawText('Circle for testing', {
    x: 110,
    y: height - 260,
    size: 10,
    font: helveticaFont,
  });

  // Page 4 - Table-like structure
  const page4 = pdfDoc.addPage([612, 792]);
  page4.drawText('Page 4: Structured Content', {
    x: 50,
    y: height - 100,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  const tableHeaders = ['Feature', 'Status', 'Priority'];
  const tableRows = [
    ['Text Editing', 'Complete', 'High'],
    ['Annotations', 'Complete', 'High'],
    ['Search', 'Complete', 'Medium'],
    ['Export', 'Complete', 'Low']
  ];
  
  let tableY = height - 150;
  let tableX = 50;
  
  // Draw headers
  for (let i = 0; i < tableHeaders.length; i++) {
    page4.drawText(tableHeaders[i], {
      x: tableX + (i * 150),
      y: tableY,
      size: 12,
      font: helveticaBold,
    });
  }
  
  tableY -= 30;
  
  // Draw rows
  for (const row of tableRows) {
    for (let i = 0; i < row.length; i++) {
      page4.drawText(row[i], {
        x: tableX + (i * 150),
        y: tableY,
        size: 11,
        font: helveticaFont,
      });
    }
    tableY -= 25;
  }

  // Page 5 - Final page with footer
  const page5 = pdfDoc.addPage([612, 792]);
  page5.drawText('Page 5: Final Page', {
    x: 50,
    y: height - 100,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page5.drawText('This is the last page of the test document.', {
    x: 50,
    y: height - 150,
    size: 14,
    font: helveticaFont,
  });
  
  page5.drawText('End of Document - Page 5 of 5', {
    x: width / 2 - 80,
    y: 50,
    size: 10,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  return pdfDoc;
}

async function createSimplePDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  
  page.drawText('Simple Test PDF', {
    x: width / 2 - 60,
    y: height / 2,
    size: 20,
    font: helveticaFont,
  });
  
  return pdfDoc;
}

async function main() {
  const fixturesDir = path.join(__dirname, 'e2e', 'fixtures');
  
  // Create multi-page PDF
  const multiPagePdf = await createMultiPagePDF();
  const multiPageBytes = await multiPagePdf.save();
  await fs.writeFile(path.join(fixturesDir, 'multi-page-test.pdf'), multiPageBytes);
  console.log('Created multi-page-test.pdf (5 pages)');
  
  // Create simple PDF
  const simplePdf = await createSimplePDF();
  const simpleBytes = await simplePdf.save();
  await fs.writeFile(path.join(fixturesDir, 'simple-test.pdf'), simpleBytes);
  console.log('Created simple-test.pdf (1 page)');
  
  console.log('Test PDFs created successfully!');
}

main().catch(console.error);
