import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Set up PDF.js worker with fallback mechanism
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
} catch (error) {
  console.warn('Using PDF.js fallback worker');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.js';
}

interface PDFViewerProps {
  pdfFile: File | null;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const PDFViewer = ({ pdfFile, onTextExtracted, onPricesDetected }: PDFViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(false);

  const extractPricesFromText = useCallback((text: string, pageIndex: number) => {
    const pricePatterns = [
      // European format with euro symbol
      /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g,
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/g,
      // European format without euro symbol (2 decimals)
      /(?:^|\s)(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})(?:\s|$)/g,
      // Simple euro amounts
      /€\s*(\d+)/g,
      /(\d+)\s*€/g,
      // Price-like patterns
      /(?:price|cost|total|amount|τιμή|κόστος|σύνολο)\s*:?\s*(\d+[.,]?\d*)/gi,
      // Numbers that look like prices (over 10, with potential decimal)
      /(?:^|\s)(\d{2,}[.,]\d{1,2})(?:\s|$)/g
    ];

    const prices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];
    const foundValues = new Set<number>(); // Avoid duplicates
    
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

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    setLoading(true);
    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Extract text content for price detection
      const textContent = await page.getTextContent();
      const textItems = textContent.items
        .filter((item): item is any => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');

      if (onTextExtracted) {
        onTextExtracted(textItems);
      }

      // Extract prices and their approximate positions
      const detectedPrices = extractPricesFromText(textItems, pageNum - 1);
      if (onPricesDetected && detectedPrices.length > 0) {
        onPricesDetected(detectedPrices);
      }
    } catch (error) {
      console.error('Error rendering page:', error);
    }
    setLoading(false);
  }, [pdfDoc, scale, onTextExtracted, onPricesDetected, extractPricesFromText]);

  useEffect(() => {
    if (!pdfFile) return;

    const loadPDF = async () => {
      setLoading(true);
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
      setLoading(false);
    };

    loadPDF();
  }, [pdfFile]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, renderPage]);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const zoomIn = () => {
    setScale(scale + 0.2);
  };

  const zoomOut = () => {
    setScale(Math.max(0.5, scale - 0.2));
  };

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
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {currentPage} / {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="flex justify-center p-4">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Φόρτωση PDF...</p>
              </div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="border shadow-lg bg-white"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </Card>
  );
};