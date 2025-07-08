import { useEffect, useRef, useCallback, useMemo } from 'react';
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
  const lastRenderedRef = useRef<{ pdfDoc: pdfjsLib.PDFDocumentProxy | null; scale: number; numPages: number } | null>(null);
  const canvasesRef = useRef<HTMLCanvasElement[]>([]);
  const renderingRef = useRef(false);

  // Stable callbacks with empty dependencies to prevent infinite re-renders
  const stableOnTextExtracted = useCallback((text: string) => {
    onTextExtracted?.(text);
  }, []);

  const stableOnPricesDetected = useCallback((prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => {
    onPricesDetected?.(prices);
  }, []);

  const stableOnRenderComplete = useCallback((success: boolean) => {
    onRenderComplete?.(success);
  }, []);

  // Check if we need to re-render (avoid unnecessary renders)
  const shouldRender = useMemo(() => {
    if (!pdfDoc) return false;
    
    const current = lastRenderedRef.current;
    return !current || 
           current.pdfDoc !== pdfDoc || 
           Math.abs(current.scale - scale) > 0.01 || 
           current.numPages !== pdfDoc.numPages;
  }, [pdfDoc, scale]);

  // Cleanup function
  const cleanup = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      // Clear canvases properly
      canvasesRef.current.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      });
      container.innerHTML = '';
      canvasesRef.current = [];
    }
  }, []);

  useEffect(() => {
    if (!pdfDoc || !containerRef.current || !shouldRender || renderingRef.current) {
      if (!pdfDoc) {
        stableOnRenderComplete(false);
      }
      return;
    }

    let isCancelled = false;
    renderingRef.current = true;

    const renderPages = async () => {
      const container = containerRef.current;
      if (!container || isCancelled) {
        renderingRef.current = false;
        return;
      }

      try {
        // Avoid innerHTML clearing - only clear if needed
        if (canvasesRef.current.length > 0) {
          canvasesRef.current.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            canvas.remove();
          });
          canvasesRef.current = [];
        }
        
        let allText = '';
        let allPrices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];
        const newCanvases: HTMLCanvasElement[] = [];

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (isCancelled) break;
          
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
          canvas.id = `pdf-page-${pageNum}`;

          // Render PDF page to canvas
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
          
          if (!isCancelled) {
            container.appendChild(canvas);
            newCanvases.push(canvas);

            // Extract text content for processing
            try {
              const textContent = await page.getTextContent();
              const textItems = textContent.items
                .filter((item): item is any => 'str' in item)
                .map((item: any) => item.str)
                .join(' ');

              allText += textItems + ' ';

              // Extract prices from this page
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
        }

        if (!isCancelled) {
          // Update tracking
          canvasesRef.current = newCanvases;
          lastRenderedRef.current = { pdfDoc, scale, numPages: pdfDoc.numPages };

          // Call callbacks with extracted data
          if (allText) {
            stableOnTextExtracted(allText);
          }
          if (allPrices.length > 0) {
            stableOnPricesDetected(allPrices);
          }

          stableOnRenderComplete(true);
        }
      } catch (renderError) {
        if (!isCancelled) {
          stableOnRenderComplete(false);
        }
      } finally {
        renderingRef.current = false;
      }
    };

    renderPages();

    // Cleanup function for useEffect
    return () => {
      isCancelled = true;
      renderingRef.current = false;
    };
  }, [pdfDoc, scale, shouldRender]);

  return { containerRef };
};