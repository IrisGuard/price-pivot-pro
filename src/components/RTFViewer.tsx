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
      // European format with euro symbol
      /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g,
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/g,
      // European format without euro symbol (2 decimals)
      /(?:^|\s)(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})(?:\s|$)/g,
      // Simple euro amounts
      /€\s*(\d+)/g,
      /(\d+)\s*€/g,
      // Price-like patterns in RTF
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
            pageIndex: 0
          });
        }
      }
    });

    return prices.sort((a, b) => a.value - b.value);
  }, []);

  const parseRTF = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const rtfData = new TextDecoder('utf-8').decode(arrayBuffer);
      
      // Enhanced RTF to text conversion
      let textContent = rtfData
        // Remove RTF header and version info
        .replace(/^{\s*\\rtf1.*?(?=\\)/g, '')
        // Remove font table
        .replace(/\\fonttbl[^}]*}/g, '')
        // Remove color table
        .replace(/\\colortbl[^}]*}/g, '')
        // Remove style sheet
        .replace(/\\stylesheet[^}]*}/g, '')
        // Remove info group
        .replace(/\\info[^}]*}/g, '')
        // Remove RTF control words and numbers
        .replace(/\\[a-zA-Z]+\d*\s?/g, ' ')
        // Remove remaining control sequences
        .replace(/\\[^a-zA-Z\s]/g, '')
        // Remove braces
        .replace(/[{}]/g, '')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        // Unescape special characters
        .replace(/\\\\/g, '\\')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
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
            {rtfContent ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                {rtfContent.split('\n').map((line, index) => (
                  <div key={index} className="mb-2">
                    {line.trim() === '' ? <br /> : line}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 p-8">
                <p>Παρακαλώ περιμένετε κατά την επεξεργασία του RTF αρχείου...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};