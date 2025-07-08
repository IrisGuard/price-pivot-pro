import { useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface RenderPageOptions {
  page: pdfjsLib.PDFPageProxy;
  scale: number;
  pageNum: number;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

export const usePDFPageRenderer = () => {
  const renderPage = useCallback(async ({ page, scale, pageNum, onCanvasReady }: RenderPageOptions): Promise<{
    canvas: HTMLCanvasElement;
    textContent: string;
    prices: Array<{ value: number; x: number; y: number; pageIndex: number }>;
  }> => {
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
      setTimeout(() => reject(new Error('Render timeout')), 15000)
    );

    await Promise.race([renderPromise, timeoutPromise]);
    
    onCanvasReady(canvas);

    // Extract text content and prices
    let textContent = '';
    let prices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];

    try {
      const textData = await page.getTextContent();
      const textItems = textData.items
        .filter((item): item is any => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');

      textContent = textItems;

      // Extract prices from this page
      const priceMatches = textItems.match(/\d+[.,]\d{2}/g) || [];
      prices = priceMatches.map((match, index) => ({
        value: parseFloat(match.replace(',', '.')),
        x: 450 + (index * 30),
        y: 650 - index * 25,
        pageIndex: pageNum - 1
      }));
    } catch (textError) {
      console.warn(`Failed to extract text from page ${pageNum}:`, textError);
    }

    return { canvas, textContent, prices };
  }, []);

  const createPlaceholderPage = useCallback((pageNum: number): HTMLDivElement => {
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
    return placeholder;
  }, []);

  return {
    renderPage,
    createPlaceholderPage
  };
};