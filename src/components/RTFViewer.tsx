import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface RTFViewerProps {
  rtfFile: File | null;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const RTFViewer = ({ rtfFile, onTextExtracted, onPricesDetected }: RTFViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rtfContent, setRtfContent] = useState<string>('');
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);

  const extractPricesFromText = useCallback((text: string) => {
    const pricePatterns = [
      /€\s*(\d+[.,]\d{2})/g,
      /(\d+[.,]\d{2})\s*€/g,
      /€\s*(\d+)/g,
      /(\d+)\s*€/g
    ];

    const prices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];
    
    pricePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const priceStr = match[1];
        const value = parseFloat(priceStr.replace(',', '.'));
        if (!isNaN(value)) {
          prices.push({
            value,
            x: 450 + Math.random() * 50,
            y: 650 - prices.length * 20,
            pageIndex: 0
          });
        }
      }
    });

    return prices;
  }, []);

  const parseRTF = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const rtfData = new TextDecoder('utf-8').decode(arrayBuffer);
      
      // Simple RTF to text conversion (basic implementation)
      const textContent = rtfData
        .replace(/\\[a-zA-Z]+\d*\s?/g, '') // Remove RTF control words
        .replace(/[{}]/g, '') // Remove braces
        .replace(/\\\\/g, '\\') // Unescape backslashes
        .replace(/\\'/g, "'") // Unescape quotes
        .trim();

      setRtfContent(textContent);

      if (onTextExtracted) {
        onTextExtracted(textContent);
      }

      const detectedPrices = extractPricesFromText(textContent);
      if (onPricesDetected && detectedPrices.length > 0) {
        onPricesDetected(detectedPrices);
      }
    } catch (error) {
      console.error('Error parsing RTF:', error);
    }
    setLoading(false);
  }, [onTextExtracted, onPricesDetected, extractPricesFromText]);

  useEffect(() => {
    if (rtfFile) {
      parseRTF(rtfFile);
    }
  }, [rtfFile, parseRTF]);

  const zoomIn = () => {
    setScale(scale + 0.2);
  };

  const zoomOut = () => {
    setScale(Math.max(0.5, scale - 0.2));
  };

  if (!rtfFile) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Δεν έχει επιλεχθεί RTF αρχείο</p>
          <p className="text-sm">Επιλέξτε ένα RTF για να ξεκινήσετε την επεξεργασία</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col">
      {/* RTF Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">RTF Document</span>
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

      {/* RTF Content */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="p-4">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Φόρτωση RTF...</p>
              </div>
            </div>
          )}
          <div 
            ref={containerRef}
            className="bg-white border shadow-lg p-6 mx-auto max-w-4xl rounded-lg"
            style={{ 
              transform: `scale(${scale})`, 
              transformOrigin: 'top center',
              fontSize: '14px',
              lineHeight: '1.6'
            }}
          >
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {rtfContent}
            </pre>
          </div>
        </div>
      </div>
    </Card>
  );
};