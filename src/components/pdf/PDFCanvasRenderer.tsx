import { usePDFCanvasRenderer } from '@/hooks/usePDFCanvasRenderer';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFCanvasRendererProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  scale: number;
  loading: boolean;
  detectedPrices?: Array<{ value: number; x: number; y: number; pageIndex: number }>;
  currentPageIndex?: number;
  onTextExtracted?: (text: string, pageIndex?: number) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
  onRenderComplete?: (success: boolean) => void;
}

export const PDFCanvasRenderer = ({ 
  pdfDoc, 
  scale, 
  loading, 
  detectedPrices,
  onTextExtracted, 
  onPricesDetected,
  onRenderComplete
}: PDFCanvasRendererProps) => {
  const { containerRef } = usePDFCanvasRenderer({
    pdfDoc,
    scale,
    detectedPrices,
    onTextExtracted,
    onPricesDetected,
    onRenderComplete
  });

  return (
    <div className="w-full flex justify-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-muted-foreground">Φόρτωση PDF...</p>
          </div>
        </div>
      )}
      
      {/* Rendered PDF Pages Container - Professional A4 Format */}
      {pdfDoc && (
        <div 
          ref={containerRef}
          className="space-y-8"
          style={{ 
            width: '210mm',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        />
      )}
    </div>
  );
};