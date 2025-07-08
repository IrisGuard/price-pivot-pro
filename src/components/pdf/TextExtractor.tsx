import * as pdfjsLib from 'pdfjs-dist';

export interface TextExtractionResult {
  text: string;
  pageTexts: string[];
}

export class TextExtractor {
  async extractTextFromAllPages(pdfDoc: pdfjsLib.PDFDocumentProxy): Promise<TextExtractionResult> {
    let allText = '';
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const pageText = await this.extractTextFromPage(pdfDoc, pageNum);
      pageTexts.push(pageText);
      allText += pageText + '\n';
    }

    return {
      text: allText,
      pageTexts
    };
  }

  async extractTextFromPage(pdfDoc: pdfjsLib.PDFDocumentProxy, pageNumber: number): Promise<string> {
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .filter((item): item is any => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');
      
      return pageText;
    } catch (error) {
      console.error(`Error extracting text from page ${pageNumber}:`, error);
      return '';
    }
  }

  async extractTextWithCoordinates(pdfDoc: pdfjsLib.PDFDocumentProxy, pageNumber: number) {
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const textContent = await page.getTextContent();
      
      return textContent.items
        .filter((item): item is any => 'str' in item)
        .map((item: any) => ({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height
        }));
    } catch (error) {
      console.error(`Error extracting text with coordinates from page ${pageNumber}:`, error);
      return [];
    }
  }
}

export const textExtractor = new TextExtractor();