import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ZoomIn, ZoomOut, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

// PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface EnhancedPDFViewerProps {
  file: File | null;
  title?: string;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const EnhancedPDFViewer = ({ 
  file, 
  title = "PDF Preview",
  onTextExtracted, 
  onPricesDetected 
}: EnhancedPDFViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<HTMLCanvasElement[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const extractPricesFromText = useCallback((text: string, pageIndex: number) => {
    const pricePatterns = [
      /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g,
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/g,
      /(?:^|\s)(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})(?:\s|$)/g,
      /€\s*(\d+)/g,
      /(\d+)\s*€/g,
      /(?:price|cost|total|amount|τιμή|κόστος|σύνολο)\s*:?\s*(\d+[.,]?\d*)/gi,
      /(?:^|\s)(\d{2,}[.,]\d{1,2})(?:\s|$)/g
    ];

    const prices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];
    const foundValues = new Set<number>();
    
    pricePatterns.forEach((pattern, patternIndex) => {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        const priceStr = match[1] || match[0];
        const cleanedPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
        const value = parseFloat(cleanedPrice);
        
        if (!isNaN(value) && value > 0 && value < 100000 && !foundValues.has(value)) {
          foundValues.add(value);
          prices.push({
            value,
            x: 450 + (patternIndex * 30),
            y: 650 - prices.length * 25,
            pageIndex
          });
        }
      }
    });

    return prices.sort((a, b) => a.value - b.value);
  }, []);

  const renderAllPages = useCallback(async () => {
    if (!pdfDoc || !containerRef.current) return;

    setLoading(true);
    try {
      const pages: HTMLCanvasElement[] = [];
      let allText = '';
      let allPrices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.className = 'border shadow-sm bg-white mb-4 mx-auto block';

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        pages.push(canvas);

        // Extract text content
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item): item is any => 'str' in item)
          .map((item: any) => item.str)
          .join(' ');
        
        allText += pageText + '\n';

        // Extract prices from this page
        const pagePrices = extractPricesFromText(pageText, pageNum - 1);
        allPrices = [...allPrices, ...pagePrices];
      }

      setRenderedPages(pages);

      if (onTextExtracted) {
        onTextExtracted(allText);
      }

      if (onPricesDetected && allPrices.length > 0) {
        onPricesDetected(allPrices);
      }
    } catch (error) {
      console.error('Error rendering pages:', error);
      setError('Σφάλμα κατά την προβολή του PDF');
    }
    setLoading(false);
  }, [pdfDoc, scale, onTextExtracted, onPricesDetected, extractPricesFromText]);

  useEffect(() => {
    if (!file) {
      setPdfUrl(null);
      setRenderedPages([]);
      setPdfDoc(null);
      return;
    }

    const loadPDF = async () => {
      setLoading(true);
      setError(null);
      
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: pdfjsLib.VerbosityLevel.WARNINGS,
        });
        
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setError(null);
      } catch (error) {
        console.error('PDF loading failed:', error);
        setError('Σφάλμα φόρτωσης PDF - χρήση εναλλακτικής προβολής');
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
  }, [file]);

  useEffect(() => {
    if (pdfDoc) {
      renderAllPages();
    }
  }, [pdfDoc, renderAllPages]);

  useEffect(() => {
    if (containerRef.current && renderedPages.length > 0) {
      // Clear and append all pages
      containerRef.current.innerHTML = '';
      renderedPages.forEach(canvas => {
        containerRef.current?.appendChild(canvas);
      });
    }
  }, [renderedPages]);

  const zoomIn = () => setScale(prev => Math.min(3.0, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));

  if (!file) {
    return (
      <Card className="w-full h-[600px]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Δεν έχει επιλεχθεί αρχείο</p>
            <p className="text-sm">Επιλέξτε PDF ή RTF αρχείο για προβολή</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {pdfDoc && (
          <p className="text-sm text-muted-foreground">
            {pdfDoc.numPages} σελίδες - {file.name}
          </p>
        )}
      </CardHeader>

      {error && (
        <Alert className="mx-4 mb-2 border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full w-full">
          <div className="p-4">
            {loading && (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Φόρτωση PDF...</p>
                </div>
              </div>
            )}
            
            {!pdfDoc && !loading && error && pdfUrl && (
              <div className="w-full">
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  className="w-full h-[500px] border rounded-lg"
                >
                  <div className="text-center p-8 bg-background border rounded-lg">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                    <p className="text-lg font-medium mb-2">Δεν είναι δυνατή η προβολή του PDF</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Το πρόγραμμα περιήγησής σας δεν υποστηρίζει την ενσωματωμένη προβολή PDF
                    </p>
                    <Button onClick={() => window.open(pdfUrl!, '_blank')}>
                      Άνοιγμα σε νέα καρτέλα
                    </Button>
                  </div>
                </object>
              </div>
            )}
            
            <div ref={containerRef} className="space-y-4" />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};