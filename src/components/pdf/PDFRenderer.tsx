import * as pdfjsLib from 'pdfjs-dist';

export interface PDFRenderOptions {
  scale: number;
  onPageRendered?: (canvas: HTMLCanvasElement, pageIndex: number) => void;
}

export class PDFRenderer {
  async renderAllPages(
    pdfDoc: pdfjsLib.PDFDocumentProxy, 
    options: PDFRenderOptions
  ): Promise<HTMLCanvasElement[]> {
    const { scale, onPageRendered } = options;
    const pages: HTMLCanvasElement[] = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.className = 'border shadow-sm bg-white mb-4 mx-auto block';

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      pages.push(canvas);

      if (onPageRendered) {
        onPageRendered(canvas, pageNum - 1);
      }
    }

    return pages;
  }

  async renderSinglePage(
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    pageNumber: number,
    scale: number
  ): Promise<HTMLCanvasElement | null> {
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.className = 'border shadow-sm bg-white mb-4 mx-auto block';

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      return canvas;
    } catch (error) {
      return null;
    }
  }
}

export const pdfRenderer = new PDFRenderer();