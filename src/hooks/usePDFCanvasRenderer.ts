import { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFCanvasRendererOptions {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  scale: number;
  currentPageIndex?: number;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
  onRenderComplete?: (success: boolean) => void;
}

export const usePDFCanvasRenderer = (options: PDFCanvasRendererOptions) => {
  const { pdfDoc, scale, currentPageIndex = -1, onTextExtracted, onPricesDetected, onRenderComplete } = options;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pdfDoc || !containerRef.current) {
      if (onRenderComplete) onRenderComplete(false);
      return;
    }

    const renderPages = async () => {
      const container = containerRef.current;
      if (!container) return;

      // Clear previous content
      container.innerHTML = '';
      
      let allText = '';
      let allPrices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];

      try {
        // Determine which pages to render
        const pagesToRender = currentPageIndex >= 0 
          ? [currentPageIndex + 1] // Render only current page
          : Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1); // Render all pages

        for (const pageNum of pagesToRender) {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale });
          
          // Create canvas element
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          // Set canvas dimensions
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Apply A4 styling - exact 595px width centered
          canvas.style.maxWidth = '595px';
          canvas.style.width = '595px';
          canvas.style.height = 'auto';
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 16px auto';
          canvas.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          canvas.style.border = '1px solid #e5e7eb';
          canvas.style.backgroundColor = 'white';

          // Render PDF page to canvas
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
          
          // Add canvas to container
          container.appendChild(canvas);

          // Extract text content for processing
          try {
            const textContent = await page.getTextContent();
            const textItems = textContent.items
              .filter((item): item is any => 'str' in item)
              .map((item: any) => item.str)
              .join(' ');

            allText += textItems + ' ';

            // Extract prices from this page (simple pattern matching)
            const priceMatches = textItems.match(/\d+[.,]\d{2}/g) || [];
            const pagePrices = priceMatches.map((match, index) => ({
              value: parseFloat(match.replace(',', '.')),
              x: 450 + (index * 30),
              y: 650 - index * 25,
              pageIndex: pageNum - 1
            }));
            
            allPrices = [...allPrices, ...pagePrices];
          } catch (textError) {
            // Continue without text extraction if it fails
          }
        }

        // Call callbacks with extracted data
        if (onTextExtracted && allText) {
          onTextExtracted(allText);
        }
        if (onPricesDetected && allPrices.length > 0) {
          onPricesDetected(allPrices);
        }

        if (onRenderComplete) onRenderComplete(true);
      } catch (renderError) {
        if (onRenderComplete) onRenderComplete(false);
      }
    };

    renderPages();
  }, [pdfDoc, scale, currentPageIndex, onTextExtracted, onPricesDetected, onRenderComplete]);

  return { containerRef };
};