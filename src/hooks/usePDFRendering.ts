import { useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePriceExtraction } from '@/hooks/usePriceExtraction';
import { getFileProcessingConfig } from '@/lib/config/environment';
import { withPerformanceTracking } from '@/lib/performance/monitor';
import { fileCache } from '@/lib/cache/fileCache';

interface PDFRenderingOptions {
  scale: number;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const usePDFRendering = () => {
  const { extractPricesFromText } = usePriceExtraction();

  const renderAllPages = useCallback(async (
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    options: PDFRenderingOptions
  ) => {
    const { scale, onTextExtracted, onPricesDetected } = options;
    const config = getFileProcessingConfig();
    
    // Check cache first
    const cacheKey = `render-${pdfDoc.fingerprints?.[0] || 'unknown'}-${scale}`;
    const cachedResult = fileCache.get<{
      pages: HTMLCanvasElement[];
      text: string;
      prices: Array<{ value: number; x: number; y: number; pageIndex: number }>;
    }>(pdfDoc as any, cacheKey);
    
    if (cachedResult) {
      if (onTextExtracted) onTextExtracted(cachedResult.text);
      if (onPricesDetected) onPricesDetected(cachedResult.prices);
      return cachedResult.pages;
    }
    
    return await withPerformanceTracking(
      'pdf-render-all-pages',
      0, // We don't have file size here
      async () => {
        const pages: HTMLCanvasElement[] = [];
        let allText = '';
        let allPrices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];

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

          // Extract text content for price detection
          const textContent = await page.getTextContent();
          const textItems = textContent.items
            .filter((item): item is any => 'str' in item)
            .map((item: any) => item.str)
            .join(' ');

          allText += textItems + ' ';

          // Extract prices from this page
          const pagePrices = extractPricesFromText(textItems, pageNum - 1);
          allPrices = [...allPrices, ...pagePrices];
        }

        // Cache the result
        const result = { pages, text: allText, prices: allPrices };
        fileCache.set(pdfDoc as any, cacheKey, result);

        if (onTextExtracted) {
          onTextExtracted(allText);
        }

        if (onPricesDetected && allPrices.length > 0) {
          onPricesDetected(allPrices);
        }

        return pages;
      }
    );
  }, [extractPricesFromText]);

  return { renderAllPages };
};