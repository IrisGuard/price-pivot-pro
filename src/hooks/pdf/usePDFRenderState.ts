import { useRef, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface RenderState {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  scale: number;
  numPages: number;
}

export const usePDFRenderState = (pdfDoc: pdfjsLib.PDFDocumentProxy | null, scale: number) => {
  const lastRenderedRef = useRef<RenderState | null>(null);
  const renderingRef = useRef(false);

  // Stable re-render check with better comparison
  const shouldRender = useMemo(() => {
    if (!pdfDoc || renderingRef.current) return false;
    
    const current = lastRenderedRef.current;
    return !current || 
           current.pdfDoc !== pdfDoc || 
           Math.abs(current.scale - scale) > 0.05 || // Increased threshold to prevent micro-updates
           current.numPages !== pdfDoc.numPages;
  }, [pdfDoc, scale]);

  const setRendering = (isRendering: boolean) => {
    renderingRef.current = isRendering;
  };

  const updateLastRendered = (pdfDoc: pdfjsLib.PDFDocumentProxy, scale: number) => {
    lastRenderedRef.current = { pdfDoc, scale, numPages: pdfDoc.numPages };
  };

  return {
    shouldRender,
    setRendering,
    updateLastRendered,
    isRendering: renderingRef.current
  };
};