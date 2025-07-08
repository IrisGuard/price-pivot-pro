import { useCallback } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const useRTFToPDFConverter = () => {
  const convertRTFToPDF = useCallback(async (file: File): Promise<Uint8Array> => {
    if (!file.name.endsWith('.rtf')) {
      // If not RTF, return as is
      return new Uint8Array(await file.arrayBuffer());
    }

    
    
    // Simple RTF Processing with immediate fallback
    try {
      // Quick RTF text extraction without complex imports
      const rtfContent = await file.text();
      
      // Create A4 document with proper margins
      const pdfDoc = await PDFDocument.create();
      const { width, height } = pdfDoc.addPage([595, 842]).getSize();
      pdfDoc.removePage(0); // Remove the auto-created page
      
      // Professional document setup
      const margins = { top: 72, bottom: 72, left: 72, right: 72 }; // 1 inch margins
      const contentWidth = width - margins.left - margins.right;
      const contentHeight = height - margins.top - margins.bottom;
      
      // Enhanced font handling
      const fonts = {
        regular: await pdfDoc.embedFont(StandardFonts.TimesRoman),
        bold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
        italic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
      };
      
      // Extract plain text from RTF
      const plainText = rtfContent
        .replace(/^{\s*\\rtf1.*?(?=\\)/g, '')
        .replace(/\\[a-zA-Z]+\d*\s?/g, ' ')
        .replace(/[{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const lines = processTextWithFormating(plainText, contentWidth, fonts.regular, 12);
      
      // Create pages as needed
      let currentPage = pdfDoc.addPage([595, 842]);
      let currentY = height - margins.top;
      const lineHeight = 16; // Better line spacing
      
      for (const line of lines) {
        // Check if we need a new page
        if (currentY < margins.bottom + lineHeight) {
          currentPage = pdfDoc.addPage([595, 842]);
          currentY = height - margins.top;
        }
        
        // Handle empty lines (paragraph breaks)
        if (line.trim() === '') {
          currentY -= lineHeight * 0.5;
          continue;
        }
        
        currentPage.drawText(line, {
          x: margins.left,
          y: currentY,
          size: 12,
          font: fonts.regular,
          color: rgb(0, 0, 0),
          maxWidth: contentWidth,
          lineHeight: lineHeight
        });
        
        currentY -= lineHeight;
      }
      
      return await pdfDoc.save();
    } catch (error) {
      // Fallback to basic RTF processing
      const rtfContent = await file.text();
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Basic RTF text extraction
      const plainText = rtfContent
        .replace(/^{\s*\\rtf1.*?(?=\\)/g, '')
        .replace(/\\[a-zA-Z]+\d*\s?/g, ' ')
        .replace(/[{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const words = plainText.split(' ');
      const lines = [];
      const maxWordsPerLine = 12;
      
      for (let i = 0; i < words.length; i += maxWordsPerLine) {
        lines.push(words.slice(i, i + maxWordsPerLine).join(' '));
      }
      
      let currentY = height - 50;
      const lineHeight = 15;
      
      for (const line of lines.slice(0, 50)) {
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
    }
  }, []);

  // Helper method for better text processing
  const processTextWithFormating = (text: string, maxWidth: number, font: any, fontSize: number) => {
    const lines: string[] = [];
    const paragraphs = text.split('\n\n');
    
    paragraphs.forEach((paragraph, index) => {
      if (paragraph.trim() === '') {
        lines.push('');
        return;
      }
      
      const words = paragraph.trim().split(/\s+/);
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        // Approximate text width calculation
        const textWidth = testLine.length * (fontSize * 0.6);
        
        if (textWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      
      if (currentLine) lines.push(currentLine);
      
      // Add spacing between paragraphs (except last)
      if (index < paragraphs.length - 1) {
        lines.push('');
      }
    });
    
    return lines;
  };

  return { convertRTFToPDF, processTextWithFormating };
};