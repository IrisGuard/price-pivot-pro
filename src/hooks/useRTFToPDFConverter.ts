import { useCallback } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const useRTFToPDFConverter = () => {
  const convertRTFToPDF = useCallback(async (file: File): Promise<Uint8Array> => {
    if (!file.name.endsWith('.rtf')) {
      // If not RTF, return as is
      return new Uint8Array(await file.arrayBuffer());
    }

    
    
    // Enhanced RTF to PDF conversion
    const rtfContent = await file.text();
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Enhanced text extraction from RTF
    let plainText = rtfContent
      .replace(/^{\s*\\rtf1.*?(?=\\)/g, '')
      .replace(/\\fonttbl[^}]*}/g, '')
      .replace(/\\colortbl[^}]*}/g, '')
      .replace(/\\stylesheet[^}]*}/g, '')
      .replace(/\\info[^}]*}/g, '')
      .replace(/\\[a-zA-Z]+\d*\s?/g, ' ')
      .replace(/\\[^a-zA-Z\s]/g, '')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\\\\/g, '\\')
      .replace(/\\'/g, "'")
      .trim();
    
    // Split text into lines and pages
    const words = plainText.split(' ');
    const lines = [];
    const maxWordsPerLine = 12;
    
    for (let i = 0; i < words.length; i += maxWordsPerLine) {
      lines.push(words.slice(i, i + maxWordsPerLine).join(' '));
    }
    
    let currentY = height - 50;
    const lineHeight = 15;
    
    for (const line of lines.slice(0, 50)) { // Limit to 50 lines for demo
      if (currentY < 50) break;
      
      page.drawText(line, {
        x: 50,
        y: currentY,
        size: 11,
        font,
        color: rgb(0, 0, 0),
        maxWidth: width - 100
      });
      
      currentY -= lineHeight;
    }
    
    
    return await pdfDoc.save();
  }, []);

  return { convertRTFToPDF };
};