import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { usePDFLoader } from '@/hooks/usePDFLoader';
import { PDFBrowserFallback } from '@/components/pdf/PDFBrowserFallback';
import { PDFCanvasRenderer } from '@/components/pdf/PDFCanvasRenderer';
import { PDFZoomControls } from '@/components/pdf/PDFZoomControls';
import { PDFSidebar } from '@/components/pdf/PDFSidebar';
import { usePDFNavigation } from '@/hooks/usePDFNavigation';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [forceNativeFallback, setForceNativeFallback] = useState(false);
  
  const { pdfDoc, loading, error, pdfUrl } = usePDFLoader(pdfFile);
  const navigation = usePDFNavigation(pdfDoc?.numPages || 0);

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

  const handlePageSelect = useCallback((pageIndex: number) => {
    navigation.goToPage(pageIndex);
    const pageElement = document.getElementById(`pdf-page-${pageIndex + 1}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [navigation]);

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
    <div className="w-full min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">
          {useNativeFallback ? 'PDF Προβολή (Browser)' : 'PDF Επεξεργαστής'}
        </h1>
        {(pdfDoc || pdfUrl) && (
          <PDFZoomControls
            scale={scale}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            pageCount={pdfDoc?.numPages}
          />
        )}
      </div>

      {error && !useNativeFallback && (
        <Alert className="mx-4 mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Σφάλμα φόρτωσης PDF. Χρήση εναλλακτικής προβολής...
          </AlertDescription>
        </Alert>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - only for PDF.js mode */}
        {!useNativeFallback && pdfDoc && (
          <PDFSidebar 
            pdfDoc={pdfDoc}
            currentPageIndex={navigation.currentPageIndex}
            onPageSelect={handlePageSelect}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="flex justify-center py-6">
              <div className="w-full max-w-4xl">
                {/* PDF.js Renderer */}
                {!useNativeFallback && pdfDoc && (
                  <PDFCanvasRenderer
                    pdfDoc={pdfDoc}
                    scale={scale}
                    loading={loading}
                    onTextExtracted={onTextExtracted}
                    onPricesDetected={onPricesDetected}
                    onRenderComplete={(success) => {
                      if (!success && pdfUrl) {
                        setForceNativeFallback(true);
                      }
                    }}
                  />
                )}
                
                {/* Browser Native Fallback */}
                {useNativeFallback && pdfUrl && (
                  <PDFBrowserFallback pdfUrl={pdfUrl} />
                )}

                {/* Loading State */}
                {loading && !pdfUrl && (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center space-y-4">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-muted-foreground">Φόρτωση PDF...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};