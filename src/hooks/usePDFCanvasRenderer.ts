import { useEffect, useRef, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useProgressiveLoading } from './useProgressiveLoading';
import { useMemoryOptimization } from './useMemoryOptimization';

interface PDFCanvasRendererOptions {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  scale: number;
  detectedPrices?: Array<{ value: number; x: number; y: number; pageIndex: number }>;
  currentPageIndex?: number;
  onTextExtracted?: (text: string, pageIndex?: number) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
  onRenderComplete?: (success: boolean) => void;
}

export const usePDFCanvasRenderer = (options: PDFCanvasRendererOptions) => {
  const { pdfDoc, scale, detectedPrices, currentPageIndex = -1, onTextExtracted, onPricesDetected, onRenderComplete } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const lastRenderedRef = useRef<{ pdfDoc: pdfjsLib.PDFDocumentProxy | null; scale: number; numPages: number } | null>(null);
  const canvasesRef = useRef<HTMLCanvasElement[]>([]);
  const renderingRef = useRef(false);

  const { registerCleanup } = useMemoryOptimization();
  const { processInChunks } = useProgressiveLoading({
    chunkSize: 2, // Process 2 pages at a time for better performance
    initialDelay: 50
  });

  // Stable callbacks with empty dependencies to prevent infinite re-renders
  const stableOnTextExtracted = useCallback((text: string, pageIndex?: number) => {
    onTextExtracted?.(text, pageIndex);
  }, []);

  const stableOnPricesDetected = useCallback((prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => {
    onPricesDetected?.(prices);
  }, []);

  const stableOnRenderComplete = useCallback((success: boolean) => {
    onRenderComplete?.(success);
  }, []);

  // Stable re-render check with better comparison including detectedPrices
  const shouldRender = useMemo(() => {
    if (!pdfDoc || renderingRef.current) return false;
    
    const current = lastRenderedRef.current;
    return !current || 
           current.pdfDoc !== pdfDoc || 
           Math.abs(current.scale - scale) > 0.05 || // Increased threshold to prevent micro-updates
           current.numPages !== pdfDoc.numPages ||
           (detectedPrices && detectedPrices.length > 0); // Force re-render when prices change
  }, [pdfDoc, scale, detectedPrices]);

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

      let renderAttempts = 0;
      const maxRetries = 2;

      const attemptRender = async (): Promise<boolean> => {
        try {
          // Clear previous content
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

          // Register memory cleanup
          const cleanup = registerCleanup(() => {
            canvasesRef.current.forEach(canvas => {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
            });
          });

          const pageNumbers = Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);
          
          // Use progressive loading for better performance
          await processInChunks(pageNumbers, async (pageNum) => {
            if (isCancelled) return;
            
            try {
              const page = await pdfDoc.getPage(pageNum);
              const viewport = page.getViewport({ scale });
              
              // Create canvas element
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d', { willReadFrequently: false });
              if (!ctx) {
                throw new Error(`Failed to get 2D context for page ${pageNum}`);
              }

              // Set canvas dimensions
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              
              // Apply professional A4 document styling
              canvas.style.maxWidth = '210mm';
              canvas.style.width = '210mm';
              canvas.style.height = 'auto';
              canvas.style.display = 'block';
              canvas.style.margin = '0 auto 32px auto';
              canvas.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)';
              canvas.style.border = '1px solid hsl(var(--border))';
              canvas.style.backgroundColor = 'white';
              canvas.style.borderRadius = '8px';
              canvas.style.padding = '20mm';
              canvas.id = `pdf-page-${pageNum}`;

              // Render with timeout protection
              const renderContext = {
                canvasContext: ctx,
                viewport: viewport,
              };

              const renderPromise = page.render(renderContext).promise;
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Render timeout')), 20000) // Increased to 20s for complex pages
              );

              await Promise.race([renderPromise, timeoutPromise]);
              
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

                  // Enhanced price extraction using improved algorithm
                  const { usePriceExtraction } = await import('@/hooks/usePriceExtraction');
                  const extractor = usePriceExtraction();
                  const pagePrices = extractor.extractPricesFromText(textItems, pageNum - 1);
                  
                  allPrices = [...allPrices, ...pagePrices];
                } catch (textError) {
                  console.warn(`Failed to extract text from page ${pageNum}:`, textError);
                }
              }
            } catch (pageError) {
              console.warn(`Failed to render page ${pageNum}:`, pageError);
              
              // Create fallback placeholder for failed page
              if (!isCancelled) {
                const placeholder = document.createElement('div');
                placeholder.className = 'border border-dashed bg-white mb-8 mx-auto block rounded-lg flex items-center justify-center';
                placeholder.style.width = '210mm';
                placeholder.style.height = '297mm'; // A4 dimensions
                placeholder.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                placeholder.style.border = '1px solid hsl(var(--border))';
                placeholder.innerHTML = `
                  <div class="text-center text-muted-foreground">
                    <p>Σελίδα ${pageNum}</p>
                    <p class="text-sm">Σφάλμα φόρτωσης</p>
                  </div>
                `;
                container.appendChild(placeholder);
              }
            }
          });

          // Cleanup after processing
          cleanup();

          if (!isCancelled) {
            // Update tracking
            canvasesRef.current = newCanvases;
            lastRenderedRef.current = { pdfDoc, scale, numPages: pdfDoc.numPages };

            // Call callbacks with extracted data
            if (allText) {
              stableOnTextExtracted(allText, 0); // Pass page index for multi-page processing
            }
            if (allPrices.length > 0) {
              stableOnPricesDetected(allPrices);
            }
          }

          return true;
        } catch (error) {
          console.error(`PDF rendering attempt ${renderAttempts + 1} failed:`, error);
          return false;
        }
      };

      // Retry logic
      while (renderAttempts < maxRetries && !isCancelled) {
        const success = await attemptRender();
        if (success) {
          stableOnRenderComplete(true);
          renderingRef.current = false;
          return;
        }
        renderAttempts++;
        
        if (renderAttempts < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // All attempts failed
      if (!isCancelled) {
        stableOnRenderComplete(false);
      }
      renderingRef.current = false;
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