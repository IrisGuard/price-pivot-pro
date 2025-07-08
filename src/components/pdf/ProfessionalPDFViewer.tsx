import { useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePDFWorkerSetup } from '@/hooks/usePDFWorkerSetup';
import { usePriceExtraction } from '@/hooks/usePriceExtraction';
import { usePDFRendering } from '@/hooks/usePDFRendering';
import { PDFZoomControls } from '@/components/pdf/PDFZoomControls';
import { ProfessionalControlPanel } from '@/components/pdf/ProfessionalControlPanel';

// Initialize PDF.js worker
const { setupPDFWorker } = usePDFWorkerSetup();
setupPDFWorker();

interface ProfessionalPDFViewerProps {
  pdfFile: File | null;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const ProfessionalPDFViewer = ({ pdfFile, onTextExtracted, onPricesDetected }: ProfessionalPDFViewerProps) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [renderedPages, setRenderedPages] = useState<HTMLCanvasElement[]>([]);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { renderAllPages } = usePDFRendering();

  useEffect(() => {
    if (!pdfFile) {
      setPdfUrl(null);
      setRenderedPages([]);
      setPdfDoc(null);
      return;
    }

    const loadPDF = async () => {
      setLoading(true);
      setError(null);
      
      // Create blob URL for fallback display
      const url = URL.createObjectURL(pdfFile);
      setPdfUrl(url);
      
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: pdfjsLib.VerbosityLevel.ERRORS
        });
        
        const doc = await loadingTask.promise;
        
        if (doc.numPages === 0) {
          throw new Error('PDF has no pages');
        }
        
        setPdfDoc(doc);
        setError(null);
      } catch (error) {
        setError('Σφάλμα φόρτωσης PDF. Χρήση εναλλακτικής προβολής.');
        setPdfDoc(null);
      }
      setLoading(false);
    };

    loadPDF();
    
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfFile]);

  useEffect(() => {
    if (pdfDoc) {
      renderAllPages(pdfDoc, {
        scale,
        onTextExtracted,
        onPricesDetected
      }).then(pages => {
        setRenderedPages(pages);
      }).catch(error => {
        // Silent error handling
      });
    }
  }, [pdfDoc, scale, renderAllPages, onTextExtracted, onPricesDetected]);

  const zoomIn = useCallback(() => {
    setScale(scale + 0.2);
  }, [scale]);

  const zoomOut = useCallback(() => {
    setScale(Math.max(0.5, scale - 0.2));
  }, [scale]);

  if (!pdfFile) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Δεν έχει επιλεχθεί PDF αρχείο</p>
          <p className="text-sm">Επιλέξτε ένα PDF για να ξεκινήσετε την επεξεργασία</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full min-h-screen bg-muted/20">
      {/* PDF Viewer Section */}
      <div className="bg-white">
        <PDFZoomControls
          scale={scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          pageCount={pdfDoc?.numPages}
        />

        {error && (
          <Alert className="mx-4 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* PDF Content Container */}
        <div className="flex justify-center py-8">
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                <div className="text-center space-y-2">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Φόρτωση PDF...</p>
                </div>
              </div>
            )}
            
            {/* Rendered PDF Pages */}
            {renderedPages.length > 0 && (
              <div className="space-y-4" ref={(container) => {
                if (container && renderedPages.length > 0) {
                  container.innerHTML = '';
                  renderedPages.forEach(canvas => {
                    // Apply A4 styling and centering
                    canvas.className = 'block mx-auto shadow-lg border border-gray-200';
                    canvas.style.maxWidth = '595px'; // A4 width
                    canvas.style.height = 'auto';
                    
                    const wrapper = document.createElement('div');
                    wrapper.className = 'flex justify-center mb-4';
                    wrapper.appendChild(canvas);
                    container.appendChild(wrapper);
                  });
                }
              }} />
            )}
            
            {/* Browser Fallback */}
            {(!pdfDoc && pdfUrl && !loading) && (
              <div className="flex justify-center">
                <iframe
                  src={pdfUrl}
                  className="border shadow-lg"
                  style={{ 
                    width: '595px',  // A4 width
                    height: '842px', // A4 height
                    maxWidth: '100%'
                  }}
                  title="PDF Preview"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Professional Control Panel - Always below PDF */}
      {(renderedPages.length > 0 || (!pdfDoc && pdfUrl)) && (
        <div className="bg-gray-50 border-t">
          <div className="flex justify-center py-8">
            <ProfessionalControlPanel 
              pageWidth={595} // A4 width
              isAdminMode={true}
              onPercentageChange={(percentage) => {
                // Phase 3 implementation
              }}
              onBannerChange={(file) => {
                // Phase 3 implementation
              }}
              onCustomerDataChange={(data) => {
                // Phase 3 implementation
              }}
              onExportCleanPDF={() => {
                window.print();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};