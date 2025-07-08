import { useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePDFLoader } from '@/hooks/usePDFLoader';
import { usePDFNavigation } from '@/hooks/usePDFNavigation';
import { PDFZoomControls } from '@/components/pdf/PDFZoomControls';
import { PDFCanvasRenderer } from '@/components/pdf/PDFCanvasRenderer';
import { PDFBrowserFallback } from '@/components/pdf/PDFBrowserFallback';
import { PDFSidebar } from '@/components/pdf/PDFSidebar';
import { ProfessionalControlPanel } from '@/components/pdf/ProfessionalControlPanel';

interface ProfessionalPDFViewerProps {
  pdfFile: File | null;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const ProfessionalPDFViewer = ({ pdfFile, onTextExtracted, onPricesDetected }: ProfessionalPDFViewerProps) => {
  const [scale, setScale] = useState(1.0);
  const [pagesRendered, setPagesRendered] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { pdfDoc, loading, error, pdfUrl } = usePDFLoader(pdfFile);
  const navigation = usePDFNavigation(pdfDoc?.numPages || 0);

  const zoomIn = useCallback(() => {
    setScale(prev => prev + 0.2);
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  }, []);

  const handleRenderComplete = useCallback((success: boolean) => {
    setPagesRendered(success);
  }, []);

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
    <div className="w-full min-h-screen bg-muted/20 flex flex-col">
      {/* 3-Column Layout: Sidebar + PDF + Content */}
      <div className="flex flex-1">
        {/* Left Sidebar with Thumbnails */}
        <PDFSidebar 
          pdfDoc={pdfDoc}
          currentPageIndex={navigation.currentPageIndex}
          onPageSelect={navigation.goToPage}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Zoom Controls */}
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

          {/* PDF Content Container - Full width centered */}
          <div className="flex-1 bg-white overflow-auto">
            <div className="flex justify-center py-8">
              {/* Canvas Renderer */}
              {pdfDoc && (
                <PDFCanvasRenderer
                  pdfDoc={pdfDoc}
                  scale={scale}
                  loading={loading}
                  onTextExtracted={onTextExtracted}
                  onPricesDetected={onPricesDetected}
                  onRenderComplete={handleRenderComplete}
                />
              )}
              
              {/* Browser Fallback */}
              {(!pdfDoc && pdfUrl && !loading) && (
                <PDFBrowserFallback pdfUrl={pdfUrl} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Control Panel - Fixed below all content */}
      {(pagesRendered || (!pdfDoc && pdfUrl)) && (
        <div className="w-full bg-gray-50 border-t mt-auto">
          <div className="container mx-auto max-w-4xl py-8">
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