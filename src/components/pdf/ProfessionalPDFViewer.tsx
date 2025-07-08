import { useState, useCallback, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePDFLoader } from '@/hooks/usePDFLoader';
import { useSmartPriceDetection } from '@/hooks/useSmartPriceDetection';
import { useBannerReplacement } from '@/hooks/useBannerReplacement';
import { useCustomerDataIntegration } from '@/hooks/useCustomerDataIntegration';
import { PDFZoomControls } from '@/components/pdf/PDFZoomControls';
import { PDFCanvasRenderer } from '@/components/pdf/PDFCanvasRenderer';
import { PDFBrowserFallback } from '@/components/pdf/PDFBrowserFallback';

import { ProfessionalControlPanel } from '@/components/pdf/ProfessionalControlPanel';
import { PriceDetectionOverlay } from '@/components/pdf/PriceDetectionOverlay';

interface ProfessionalPDFViewerProps {
  pdfFile: File | null;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const ProfessionalPDFViewer = ({ pdfFile, onTextExtracted, onPricesDetected }: ProfessionalPDFViewerProps) => {
  const [scale, setScale] = useState(1.0);
  const [pagesRendered, setPagesRendered] = useState(false);
  
  
  const { pdfDoc, loading, error, pdfUrl } = usePDFLoader(pdfFile);
  
  // ΦΑΣΗ 2: Smart Features
  const priceDetection = useSmartPriceDetection();
  const bannerReplacement = useBannerReplacement();
  const customerDataIntegration = useCustomerDataIntegration();

  const zoomIn = useCallback(() => {
    setScale(prev => prev + 0.2);
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  }, []);

  const handleRenderComplete = useCallback((success: boolean) => {
    setPagesRendered(success);
  }, []);


  // Stable callbacks to prevent infinite re-renders
  const stableOnTextExtracted = useCallback((text: string) => {
    onTextExtracted?.(text);
  }, []);

  const stableOnPricesDetected = useCallback((prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => {
    onPricesDetected?.(prices);
  }, []);

  // Αυτόματη ανίχνευση τιμών όταν φορτώνεται το PDF
  useEffect(() => {
    if (pdfDoc && !priceDetection.isDetecting) {
      priceDetection.detectPricesInPDF(pdfDoc);
    }
  }, [pdfDoc]);

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
    <div className="w-full min-h-screen bg-background flex flex-col">
      {/* Simplified Header */}
      <div className="bg-card border-b px-4 py-3 flex items-center justify-between pdf-header print-hide">
        <h1 className="text-lg font-semibold text-foreground">PDF Επεξεργαστής</h1>
        {pdfDoc && (
          <PDFZoomControls
            scale={scale}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            pageCount={pdfDoc.numPages}
          />
        )}
      </div>

      {error && (
        <Alert className="mx-auto mt-4 max-w-4xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content - Continuous Vertical Scroll */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="flex flex-col items-center py-6 space-y-6">
          {/* PDF Content */}
          <div className="w-full max-w-4xl">
            {pdfDoc && (
              <PDFCanvasRenderer
                pdfDoc={pdfDoc}
                scale={scale}
                loading={loading}
                onTextExtracted={stableOnTextExtracted}
                onPricesDetected={stableOnPricesDetected}
                onRenderComplete={handleRenderComplete}
              />
            )}
            
            {(!pdfDoc && pdfUrl && !loading) && (
              <PDFBrowserFallback pdfUrl={pdfUrl} />
            )}
          </div>

          {/* Control Panel - Aligned with PDF */}
          {(pdfDoc || pdfUrl) && (
            <div className="w-full max-w-4xl">
              <ProfessionalControlPanel
                pageWidth={595} // A4 width
                pdfFile={pdfFile}
                onPercentageChange={(percentage) => {
                  priceDetection.applyPercentageToAllPrices(percentage);
                }}
                onBannerChange={(file) => {
                  bannerReplacement.loadBannerFile(file);
                }}
                onCustomerDataChange={(data) => {
                  Object.entries(data).forEach(([key, value]) => {
                    customerDataIntegration.updateCustomerData(key as any, value);
                  });
                }}
                onExportCleanPDF={async () => {
                  if (!pdfFile) return;
                  
                  try {
                    // Δημιουργία καθαρού PDF με όλες τις αλλαγές
                    let pdfBytes = new Uint8Array(await pdfFile.arrayBuffer());
                    
                    // Εφαρμογή banner
                    pdfBytes = await bannerReplacement.applyBannerToPDF(pdfBytes);
                    
                    // Εφαρμογή στοιχείων πελάτη
                    pdfBytes = await customerDataIntegration.applyCustomerDataToPDF(pdfBytes);
                    
                    // Download
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'Προσφορά_Καθαρή.pdf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Σφάλμα κατά την εξαγωγή:', error);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ΦΑΣΗ 2: Price Detection Overlay */}
      {pdfDoc && priceDetection.detectedPrices.length > 0 && (
        <PriceDetectionOverlay
          detectedPrices={priceDetection.detectedPrices}
          onPriceUpdate={priceDetection.updateSinglePrice}
          onPercentageApply={priceDetection.applyPercentageToAllPrices}
          onReset={priceDetection.resetPrices}
          isDetecting={priceDetection.isDetecting}
        />
      )}
    </div>
  );
};