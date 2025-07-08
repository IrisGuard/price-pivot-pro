import { useCallback } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const useRTFToPDFConverter = () => {
  const convertRTFToPDF = useCallback(async (file: File): Promise<Uint8Array> => {
    if (!file.name.endsWith('.rtf')) {
      // If not RTF, return as is
      return new Uint8Array(await file.arrayBuffer());
    }

    
    
    // Use enhanced RTF processor for better text extraction
    try {
      const { RTFProcessor } = await import('@/lib/rtf/rtfProcessor');
      const processor = new RTFProcessor();
      const result = await processor.processRTFFile(file);
      
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 size
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const plainText = result.text;
    
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

  return { convertRTFToPDF };
};