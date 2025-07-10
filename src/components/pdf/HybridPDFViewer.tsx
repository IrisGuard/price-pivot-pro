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
  detectedPrices?: Array<{ value: number; x: number; y: number; pageIndex: number }>;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const HybridPDFViewer = ({ 
  pdfFile, 
  detectedPrices,
  onTextExtracted, 
  onPricesDetected 
}: HybridPDFViewerProps) => {
  const [scale, setScale] = useState(1.0);
  const [forceNativeFallback, setForceNativeFallback] = useState(false);
  
  const { pdfDoc, loading, error, pdfUrl } = usePDFLoader(pdfFile);

  // Auto-fallback to browser native if PDF.js fails or takes too long
  useEffect(() => {
    if (pdfFile && !pdfDoc && !forceNativeFallback) {
      const timer = setTimeout(() => {
        console.log('🔄 PDF loading timeout - switching to native fallback');
        setForceNativeFallback(true);
      }, 25000); // 25 seconds for complex PDFs
      return () => clearTimeout(timer);
    }
  }, [pdfFile, pdfDoc, forceNativeFallback]);

  // Force re-render when detected prices change (real-time preview)
  useEffect(() => {
    if (detectedPrices && pdfDoc) {
      // This will cause PDFCanvasRenderer to re-render with updated prices
      console.log('🔄 PDF preview updating with new prices:', detectedPrices.length);
    }
  }, [detectedPrices, pdfDoc]);

  const zoomIn = useCallback(() => setScale(prev => prev + 0.2), []);
  const zoomOut = useCallback(() => setScale(prev => Math.max(0.5, prev - 0.2)), []);

  if (!pdfFile) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Δεν έχει επιλεχθεί αρχείο</p>
          <p className="text-sm">Επιλέξτε ένα PDF ή RTF για να ξεκινήσετε</p>
        </div>
      </Card>
    );
  }

  const useNativeFallback = forceNativeFallback || (!pdfDoc && pdfUrl && !loading);

  return (
    <div className="w-full bg-background py-8">
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
        {/* Enhanced Loading State with Recovery Options */}
        {loading && !forceNativeFallback && (
          <div className="bg-white shadow-2xl border border-border" style={{ width: '210mm', minHeight: '400px' }}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 p-8">
                <div className="animate-spin h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto"></div>
                <div className="space-y-4">
                  <p className="text-lg font-medium text-foreground">Φόρτωση PDF...</p>
                  <p className="text-sm text-muted-foreground">Μέγιστο 25 δευτερόλεπτα για μεγάλα αρχεία</p>
                  <button 
                    onClick={() => setForceNativeFallback(true)}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 text-sm"
                  >
                    🔄 Χρήση εναλλακτικής προβολής
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* PDF.js Renderer */}
        {pdfDoc && !loading && (
          <PDFCanvasRenderer
            pdfDoc={pdfDoc}
            scale={scale}
            loading={false}
            detectedPrices={detectedPrices}
            onTextExtracted={onTextExtracted}
            onPricesDetected={onPricesDetected}
            onRenderComplete={(success) => {
              // Keep retrying with PDF.js instead of falling back to native viewer
              console.log('PDF render complete:', success);
            }}
          />
        )}
        
        {/* Native PDF Fallback */}
        {(forceNativeFallback || (!pdfDoc && !loading && pdfUrl)) && (
          <PDFBrowserFallback pdfUrl={pdfUrl!} />
        )}
        
        {/* No PDF loaded state */}
        {!pdfDoc && !loading && !pdfUrl && !forceNativeFallback && (
          <div className="bg-white shadow-2xl border border-border" style={{ width: '210mm', minHeight: '297mm' }}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p className="text-lg">Αναμονή αρχείου...</p>
                <p className="text-sm">Επιλέξτε ένα PDF για προβολή</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};