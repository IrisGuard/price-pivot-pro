import { useState } from 'react';
import { AlertTriangle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSimplePDFLoader } from '@/hooks/useSimplePDFLoader';
import { useSimplePDFRenderer } from '@/hooks/useSimplePDFRenderer';
import { usePDFNavigation } from '@/hooks/usePDFNavigation';
import { PDFSidebar } from '@/components/pdf/PDFSidebar';

interface SimplePDFViewerProps {
  file: File;
}

export const SimplePDFViewer = ({ file }: SimplePDFViewerProps) => {
  const [scale, setScale] = useState(1.0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { pdfDoc, loading, error } = useSimplePDFLoader(file);
  const navigation = usePDFNavigation(pdfDoc?.numPages || 0);
  const { containerRef, rendering } = useSimplePDFRenderer({ pdfDoc, scale });

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setScale(1.0);

  const handlePageSelect = (pageIndex: number) => {
    navigation.goToPage(pageIndex);
    const pageElement = document.getElementById(`pdf-page-${pageIndex + 1}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (error) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">
          PDF Προβολή - {file.name}
        </h1>
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetZoom}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          {pdfDoc && (
            <span className="text-sm text-gray-500 ml-4">
              {pdfDoc.numPages} σελίδες
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {pdfDoc && (
          <PDFSidebar 
            pdfDoc={pdfDoc}
            currentPageIndex={navigation.currentPageIndex}
            onPageSelect={handlePageSelect}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* PDF Content */}
        <div className="flex-1 flex flex-col bg-white">
          {(loading || rendering) && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
              <div className="text-center space-y-2">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground">
                  {loading ? 'Φόρτωση PDF...' : 'Απόδοση σελίδων...'}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-auto p-6">
            <div 
              ref={containerRef}
              className="w-full max-w-4xl mx-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};