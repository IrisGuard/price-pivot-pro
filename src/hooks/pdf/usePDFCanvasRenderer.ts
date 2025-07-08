import { useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePDFCanvasManager } from './usePDFCanvasManager';
import { usePDFPageRenderer } from './usePDFPageRenderer';
import { usePDFRenderState } from './usePDFRenderState';
import { usePDFRenderRetry } from './usePDFRenderRetry';

interface PDFCanvasRendererOptions {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  scale: number;
  currentPageIndex?: number;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
  onRenderComplete?: (success: boolean) => void;
}

export const usePDFCanvasRenderer = (options: PDFCanvasRendererOptions) => {
  const { pdfDoc, scale, onTextExtracted, onPricesDetected, onRenderComplete } = options;
  
  const { containerRef, addCanvas, clearPreviousCanvases } = usePDFCanvasManager();
  const { renderPage, createPlaceholderPage } = usePDFPageRenderer();
  const { shouldRender, setRendering, updateLastRendered } = usePDFRenderState(pdfDoc, scale);
  const { withRetry } = usePDFRenderRetry();

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

  useEffect(() => {
    if (!pdfDoc || !containerRef.current || !shouldRender) {
      if (!pdfDoc) {
        stableOnRenderComplete(false);
      }
      return;
    }

    let isCancelled = false;
    setRendering(true);

    const renderAllPages = async () => {
      const container = containerRef.current;
      if (!container || isCancelled) {
        setRendering(false);
        return;
      }

      const renderOperation = async (): Promise<boolean> => {
        // Clear previous content
        clearPreviousCanvases();
        
        let allText = '';
        let allPrices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (isCancelled) break;
          
          try {
            const page = await pdfDoc.getPage(pageNum);
            const { canvas, textContent, prices } = await renderPage({
              page,
              scale,
              pageNum,
              onCanvasReady: addCanvas
            });

            if (!isCancelled) {
              allText += textContent + ' ';
              allPrices = [...allPrices, ...prices];
            }
          } catch (pageError) {
            console.warn(`Failed to render page ${pageNum}:`, pageError);
            
            // Create fallback placeholder for failed page
            if (!isCancelled) {
              const placeholder = createPlaceholderPage(pageNum);
              container.appendChild(placeholder);
            }
          }
        }

        if (!isCancelled) {
          // Update tracking
          updateLastRendered(pdfDoc, scale);

          // Call callbacks with extracted data
          if (allText) {
            stableOnTextExtracted(allText);
          }
          if (allPrices.length > 0) {
            stableOnPricesDetected(allPrices);
          }
        }

        return true;
      };

      try {
        await withRetry(renderOperation, 2, 1000);
        if (!isCancelled) {
          stableOnRenderComplete(true);
        }
      } catch (error) {
        console.error('All PDF rendering attempts failed:', error);
        if (!isCancelled) {
          stableOnRenderComplete(false);
        }
      } finally {
        setRendering(false);
      }
    };

    renderAllPages();

    // Cleanup function for useEffect
    return () => {
      isCancelled = true;
      setRendering(false);
    };
  }, [pdfDoc, scale, shouldRender]);

  return { containerRef };
};