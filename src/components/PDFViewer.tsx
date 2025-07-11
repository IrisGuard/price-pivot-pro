import { useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePriceExtraction } from '@/hooks/usePriceExtraction';
import { usePDFRendering } from '@/hooks/usePDFRendering';
import { PDFZoomControls } from '@/components/pdf/PDFZoomControls';
import { PDFCanvasContainer } from '@/components/pdf/PDFCanvasContainer';
import { CleanPDFViewer } from '@/components/pdf/CleanPDFViewer';

// Worker is configured in main.tsx - no setup needed here

interface PDFViewerProps {
  pdfFile: File | null;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const PDFViewer = ({ pdfFile, onTextExtracted, onPricesDetected }: PDFViewerProps) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [renderedPages, setRenderedPages] = useState<HTMLCanvasElement[]>([]);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { extractPricesFromText } = usePriceExtraction();
  const { renderAllPages } = usePDFRendering();

  useEffect(() => {
    if (!pdfFile) {
      setPdfUrl(null);
      return;
    }

    const loadPDF = async () => {
      setLoading(true);
      setError(null);
      
      // Create blob URL for immediate fallback display
      const url = URL.createObjectURL(pdfFile);
      setPdfUrl(url);
      
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        
        // Simplified, reliable PDF.js configuration
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
    
    // Cleanup blob URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfFile, onTextExtracted, onPricesDetected, extractPricesFromText]);

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
    <Card className="w-full h-full flex flex-col">
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

      <PDFCanvasContainer
        renderedPages={renderedPages}
        loading={loading}
        pdfUrl={pdfUrl}
        pdfDoc={pdfDoc}
      />
      
      {/* Clean Control Page at the end */}
      {renderedPages.length > 0 && (
        <CleanPDFViewer 
          pageWidth={renderedPages[0]?.width || 595}
          onPercentageChange={(percentage) => {
            // Price modification will be implemented in Phase 3
          }}
          onBannerChange={(file) => {
            // Banner replacement will be implemented in Phase 3
          }}
          onCustomerDataChange={(data) => {
            // Customer data storage will be implemented in Phase 3
          }}
          onExportCleanPDF={() => {
            window.print();
          }}
        />
      )}
    </Card>
  );
};