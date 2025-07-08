import { useEffect, useState, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePDFWorkerSetup } from '@/hooks/usePDFWorkerSetup';
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
  const [pagesRendered, setPagesRendered] = useState<boolean>(false);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when file changes
  useEffect(() => {
    if (!pdfFile) {
      setPdfUrl(null);
      setPagesRendered(false);
      setPdfDoc(null);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      return;
    }

    const loadPDF = async () => {
      setLoading(true);
      setError(null);
      setPagesRendered(false);
      
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

  // Render PDF pages when doc or scale changes
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;

    const renderPages = async () => {
      const container = containerRef.current;
      if (!container) return;

      // Clear previous content
      container.innerHTML = '';
      
      let allText = '';
      let allPrices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];

      try {
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale });
          
          // Create canvas element
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          // Set canvas dimensions
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Apply A4 styling - exact 595px width centered
          canvas.style.maxWidth = '595px';
          canvas.style.width = '595px';
          canvas.style.height = 'auto';
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 16px auto';
          canvas.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          canvas.style.border = '1px solid #e5e7eb';
          canvas.style.backgroundColor = 'white';

          // Render PDF page to canvas
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
          
          // Add canvas to container
          container.appendChild(canvas);

          // Extract text content for processing
          try {
            const textContent = await page.getTextContent();
            const textItems = textContent.items
              .filter((item): item is any => 'str' in item)
              .map((item: any) => item.str)
              .join(' ');

            allText += textItems + ' ';

            // Extract prices from this page (simple pattern matching)
            const priceMatches = textItems.match(/\d+[.,]\d{2}/g) || [];
            const pagePrices = priceMatches.map((match, index) => ({
              value: parseFloat(match.replace(',', '.')),
              x: 450 + (index * 30),
              y: 650 - index * 25,
              pageIndex: pageNum - 1
            }));
            
            allPrices = [...allPrices, ...pagePrices];
          } catch (textError) {
            // Continue without text extraction if it fails
          }
        }

        // Call callbacks with extracted data
        if (onTextExtracted && allText) {
          onTextExtracted(allText);
        }
        if (onPricesDetected && allPrices.length > 0) {
          onPricesDetected(allPrices);
        }

        setPagesRendered(true);
      } catch (renderError) {
        setError('Σφάλμα εμφάνισης PDF');
        setPagesRendered(false);
      }
    };

    renderPages();
  }, [pdfDoc, scale, onTextExtracted, onPricesDetected]);

  const zoomIn = useCallback(() => {
    setScale(prev => prev + 0.2);
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.2));
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
      {(pagesRendered || (!pdfDoc && pdfUrl)) && (
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