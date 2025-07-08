import { usePDFCanvasRenderer } from '@/hooks/usePDFCanvasRenderer';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFCanvasRendererProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  scale: number;
  loading: boolean;
  currentPageIndex?: number;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
  onRenderComplete?: (success: boolean) => void;
}

export const PDFCanvasRenderer = ({ 
  pdfDoc, 
  scale, 
  loading, 
  currentPageIndex,
  onTextExtracted, 
  onPricesDetected,
  onRenderComplete
}: PDFCanvasRendererProps) => {
  const { containerRef } = usePDFCanvasRenderer({
    pdfDoc,
    scale,
    currentPageIndex,
    onTextExtracted,
    onPricesDetected,
    onRenderComplete
  });

  return (
    <div className="relative w-full max-w-4xl">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-muted-foreground">Φόρτωση PDF...</p>
          </div>
        </div>
      )}
      
      {/* Rendered PDF Pages Container */}
      {pdfDoc && (
        <div 
          ref={containerRef}
          className="w-full"
          style={{ minHeight: '842px' }} // A4 height minimum
        />
      )}
    </div>
  );
};