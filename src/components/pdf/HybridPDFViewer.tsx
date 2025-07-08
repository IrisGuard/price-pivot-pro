import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { usePDFLoader } from '@/hooks/usePDFLoader';
import { PDFBrowserFallback } from '@/components/pdf/PDFBrowserFallback';
import { PDFCanvasRenderer } from '@/components/pdf/PDFCanvasRenderer';
import { PDFZoomControls } from '@/components/pdf/PDFZoomControls';

interface HybridPDFViewerProps {
  pdfFile: File | null;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const HybridPDFViewer = ({ 
  pdfFile, 
  onTextExtracted, 
  onPricesDetected 
}: HybridPDFViewerProps) => {
  const [scale, setScale] = useState(1.0);
  const [forceNativeFallback, setForceNativeFallback] = useState(false);
  
  const { pdfDoc, loading, error, pdfUrl } = usePDFLoader(pdfFile);

  // Auto-fallback to browser native if PDF.js fails repeatedly
  useEffect(() => {
    if (error && pdfUrl && !forceNativeFallback) {
      const timer = setTimeout(() => {
        setForceNativeFallback(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, pdfUrl, forceNativeFallback]);

  const zoomIn = useCallback(() => setScale(prev => prev + 0.2), []);
  const zoomOut = useCallback(() => setScale(prev => Math.max(0.5, prev - 0.2)), []);

  if (!pdfFile) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[600px] bg-white shadow-2xl border border-border" style={{ width: '210mm', minHeight: '297mm' }}>
        <div className="text-center text-muted-foreground p-8">
          <p className="text-lg">📄 Δεν έχει επιλεχθεί αρχείο</p>
          <p className="text-sm">Επιλέξτε ένα PDF ή RTF για να ξεκινήσετε</p>
        </div>
      </div>
    );
  }

  const useNativeFallback = forceNativeFallback || (!pdfDoc && pdfUrl && !loading && error);

  return (
    <div className="w-full bg-background py-8">
      {/* Zoom Controls */}
      {pdfDoc && (
        <div className="flex justify-center mb-4">
          <PDFZoomControls
            scale={scale}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            pageCount={pdfDoc.numPages}
          />
        </div>
      )}

      {error && !useNativeFallback && (
        <Alert className="mx-auto mb-6 max-w-4xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Σφάλμα φόρτωσης PDF. Χρήση εναλλακτικής προβολής...
          </AlertDescription>
        </Alert>
      )}

      {/* Professional A4 Document Layout */}
      <div className="flex flex-col items-center">
        {/* Enhanced Loading State */}
        {loading && (
          <div className="bg-white shadow-2xl border border-border rounded-lg" style={{ width: '210mm', minHeight: '297mm' }}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 p-8">
                <div className="animate-spin h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto"></div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-foreground">🔄 Φόρτωση PDF...</p>
                  <p className="text-sm text-muted-foreground">Ανάλυση περιεχομένου και ανίχνευση τιμών</p>
                  <div className="w-64 h-2 bg-muted rounded-full mx-auto">
                    <div className="h-2 bg-primary rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* PDF.js Renderer - Primary Method */}
        {pdfDoc && !loading && (
          <PDFCanvasRenderer
            pdfDoc={pdfDoc}
            scale={scale}
            loading={false}
            onTextExtracted={onTextExtracted}
            onPricesDetected={onPricesDetected}
            onRenderComplete={(success) => {
              if (!success) {
                console.warn('PDF.js rendering failed, enabling fallback');
                setForceNativeFallback(true);
              }
            }}
          />
        )}
        
        {/* Native Browser Fallback */}
        {useNativeFallback && pdfUrl && (
          <PDFBrowserFallback 
            pdfUrl={pdfUrl} 
            onTextExtracted={onTextExtracted}
            onPricesDetected={onPricesDetected}
          />
        )}
        
        {/* No PDF loaded state */}
        {!pdfDoc && !pdfUrl && !loading && (
          <div className="bg-white shadow-2xl border border-border" style={{ width: '210mm', minHeight: '297mm' }}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p className="text-lg">Φόρτωση PDF...</p>
                <p className="text-sm">Παρακαλώ περιμένετε</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};