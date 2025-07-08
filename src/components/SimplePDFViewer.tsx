import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimplePDFViewerProps {
  file: File | null;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const SimplePDFViewer = ({ file, onTextExtracted, onPricesDetected }: SimplePDFViewerProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!file) {
      setPdfUrl(null);
      setError(null);
      return;
    }

    // Create object URL for the PDF
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    setError(null);

    // Cleanup on unmount
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file]);

  const handleDownload = () => {
    if (!file || !pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!file) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Δεν έχει επιλεχθεί αρχείο</p>
          <p className="text-sm">Επιλέξτε ένα PDF για να ξεκινήσετε</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Σφάλμα φόρτωσης</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Κατέβασμα αρχείου
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full bg-background py-8">
      {/* Header with controls */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold">Προεπισκόπηση PDF</h2>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Κατέβασμα
          </Button>
        </div>
        
        <Alert className="max-w-2xl">
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Αρχείο: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </AlertDescription>
        </Alert>
      </div>

      {/* PDF Display */}
      <div className="flex justify-center">
        <div 
          className="bg-white shadow-2xl border border-border"
          style={{ 
            width: '210mm',
            minHeight: '297mm',
            maxHeight: '80vh'
          }}
        >
          {pdfUrl && (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              width="100%"
              height="100%"
              style={{ minHeight: '800px' }}
              className="border-0"
              title="PDF Preview"
              onLoad={async () => {
                setLoading(false);
                
                // Real price detection using PDF.js
                try {
                  if (pdfUrl && onPricesDetected) {
                    const { realPriceDetector } = await import('@/lib/pdf/realPriceDetector');
                    const pdfjsLib = await import('pdfjs-dist');
                    
                    // Set worker
                    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
                    
                    const arrayBuffer = await file.arrayBuffer();
                    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    
                    let allPrices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];
                    
                    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                      const page = await pdfDoc.getPage(pageNum);
                      const textContent = await page.getTextContent();
                      const textItems = textContent.items
                        .filter((item): item is any => 'str' in item)
                        .map((item: any) => item.str)
                        .join(' ');
                      
                      const pagePrices = realPriceDetector.extractPricesFromText(textItems, pageNum - 1);
                      allPrices = [...allPrices, ...pagePrices];
                    }
                    
                    onPricesDetected(allPrices);
                    if (onTextExtracted) {
                      onTextExtracted('PDF processed with price detection');
                    }
                  }
                } catch (error) {
                  console.warn('Price detection failed, continuing with basic PDF display:', error);
                  if (onPricesDetected) onPricesDetected([]);
                  if (onTextExtracted) onTextExtracted('PDF loaded successfully');
                }
              }}
              onError={() => setError('Σφάλμα φόρτωσης PDF')}
            />
          )}
        </div>
      </div>
    </div>
  );
};