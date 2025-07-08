import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface UseSimplePDFRendererProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  scale: number;
}

export const useSimplePDFRenderer = ({ pdfDoc, scale }: UseSimplePDFRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(false);
  const [pageElements, setPageElements] = useState<HTMLCanvasElement[]>([]);

  useEffect(() => {
    if (!pdfDoc || !containerRef.current) {
      setPageElements([]);
      return;
    }

    let isCancelled = false;
    setRendering(true);

    const renderAllPages = async () => {
      const container = containerRef.current;
      if (!container || isCancelled) return;

      // Clear existing content
      container.innerHTML = '';
      const newPageElements: HTMLCanvasElement[] = [];

      try {
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (isCancelled) break;

          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.id = `pdf-page-${pageNum}`;
          
          // Styling for A4 pages
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 20px auto';
          canvas.style.maxWidth = '100%';
          canvas.style.height = 'auto';
          canvas.style.border = '1px solid #e5e7eb';
          canvas.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          canvas.style.backgroundColor = 'white';

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;

          if (!isCancelled) {
            container.appendChild(canvas);
            newPageElements.push(canvas);
          }
        }

        if (!isCancelled) {
          setPageElements(newPageElements);
        }
      } catch (error) {
        console.error('PDF rendering error:', error);
      } finally {
        if (!isCancelled) {
          setRendering(false);
        }
      }
    };

    renderAllPages();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, scale]);

  return { containerRef, rendering, pageElements };
};