const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createSamplePDF() {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Add a page
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

  // Get fonts
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();

  // Title
  page.drawText('Employment Agreement', {
    x: 50,
    y: height - 60,
    size: 24,
    font: helveticaBold,
    color: rgb(0.15, 0.3, 0.6),
  });

  // Subtitle
  page.drawText('Sample Document for Digital Signature', {
    x: 50,
    y: height - 85,
    size: 12,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Horizontal line
  page.drawLine({
    start: { x: 50, y: height - 95 },
    end: { x: width - 50, y: height - 95 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  // Main content
  const content = `This Employment Agreement ("Agreement") is entered into as of the date specified below,
between BoloForms Inc. ("Company") and the undersigned employee ("Employee").

1. POSITION AND DUTIES
The Employee agrees to serve the Company in the capacity of Software Engineer and to 
perform all duties and responsibilities assigned by the Company.

2. COMPENSATION
The Company agrees to pay the Employee a base salary as specified in the compensation 
package, payable in accordance with the Company's standard payroll practices.

3. TERM
This Agreement shall commence on the start date and shall continue until terminated by 
either party in accordance with the terms set forth herein.

4. CONFIDENTIALITY
The Employee acknowledges that during employment, they may have access to confidential
information and trade secrets of the Company. The Employee agrees to maintain the 
confidentiality of such information.

5. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the 
jurisdiction in which the Company is located.`;

  const lines = content.split('\n');
  let yPosition = height - 130;

  lines.forEach((line) => {
    if (yPosition < 150) return; // Stop if running out of space
    
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: 10,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
      maxWidth: width - 100,
    });
    yPosition -= 14;
  });

  // Signature section
  yPosition -= 30;
  
  page.drawText('EMPLOYEE SIGNATURE:', {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  // Signature line
  page.drawLine({
    start: { x: 50, y: yPosition - 35 },
    end: { x: 300, y: yPosition - 35 },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText('Signature', {
    x: 50,
    y: yPosition - 50,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Date line
  page.drawText('Date: _______________', {
    x: 320,
    y: yPosition - 35,
    size: 10,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });

  // Footer
  page.drawText('Page 1 of 1', {
    x: width / 2 - 30,
    y: 30,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  
  const outputPath = path.join(__dirname, '../public', 'sample.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  
  console.log('Sample PDF created successfully at:', outputPath);
}

createSamplePDF().catch(console.error);
