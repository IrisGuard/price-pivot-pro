import { useCallback } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const useRTFToPDFConverter = () => {
  const convertRTFToPDF = useCallback(async (file: File): Promise<Uint8Array> => {
    if (!file.name.endsWith('.rtf')) {
      return new Uint8Array(await file.arrayBuffer());
    }

    // Immediate 3-second timeout for RTF processing
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('RTF processing timeout')), 3000);
    });

    try {
      const result = await Promise.race([
        (async () => {
          const rtfContent = await file.text();
          const pdfDoc = await PDFDocument.create();
          const page = pdfDoc.addPage([595, 842]);
          const { width, height } = page.getSize();
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          
          // Fast RTF text extraction
          const plainText = rtfContent
            .replace(/\\[a-zA-Z]+\d*\s?/g, ' ')
            .replace(/[{}]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000); // Limit to first 5000 chars for speed
          
          const words = plainText.split(' ');
          const lines = [];
          const maxWordsPerLine = 10;
          
          for (let i = 0; i < words.length; i += maxWordsPerLine) {
            lines.push(words.slice(i, i + maxWordsPerLine).join(' '));
          }
          
          let currentY = height - 50;
          
          for (const line of lines.slice(0, 40)) {
            if (currentY < 50) break;
            
            page.drawText(line, {
              x: 50,
              y: currentY,
              size: 11,
              font,
              color: rgb(0, 0, 0),
              maxWidth: width - 100
            });
            
            currentY -= 15;
          }
          
          return await pdfDoc.save();
        })(),
        timeoutPromise
      ]);

      return result;
    } catch (error) {
      // Emergency fallback - create minimal PDF
      console.warn('RTF conversion failed, using minimal fallback:', error);
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      page.drawText('RTF Document Converted', {
        x: 50,
        y: 750,
        size: 16,
        font,
        color: rgb(0, 0, 0)
      });
      
      page.drawText('Original file could not be fully processed.', {
        x: 50,
        y: 720,
        size: 12,
        font,
        color: rgb(0.5, 0.5, 0.5)
      });
      
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