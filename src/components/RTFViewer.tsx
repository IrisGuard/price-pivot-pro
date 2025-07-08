import { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
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
      
      // Try different encodings
      let rtfData = '';
      try {
        rtfData = new TextDecoder('utf-8').decode(arrayBuffer);
      } catch {
        try {
          rtfData = new TextDecoder('windows-1252').decode(arrayBuffer);
        } catch {
          rtfData = new TextDecoder('iso-8859-1').decode(arrayBuffer);
        }
      }
      
      
      
      try {
        // Use the new RTF processor for better parsing
        const processor = await import('@/lib/rtf/rtfProcessor').then(m => new m.RTFProcessor());
        const result = await processor.processRTFFile(file);
        
        setRtfContent(result.text);

        if (onTextExtracted) {
          onTextExtracted(result.text);
        }

        // Use processed prices from RTF processor
        if (onPricesDetected && result.prices.length > 0) {
          onPricesDetected(result.prices);
        }
        
        
        
      } catch (processorError) {
        
        
        // FALLBACK: Enhanced RTF parsing
        let textContent = rtfData
          // Remove RTF header
          .replace(/^{\s*\\rtf1[^\\]*/, '')
          // Remove font table
          .replace(/\\fonttbl\s*{[^}]*(?:{[^}]*}[^}]*)*}/g, '')
          // Remove color table  
          .replace(/\\colortbl\s*;[^}]*}/g, '')
          // Remove style sheet
          .replace(/\\stylesheet\s*{[^}]*(?:{[^}]*}[^}]*)*}/g, '')
          // Remove info group
          .replace(/\\info\s*{[^}]*(?:{[^}]*}[^}]*)*}/g, '')
          // Remove generator info
          .replace(/\\generator[^;]*;/g, '')
          // Remove view settings
          .replace(/\\viewkind\d+/g, '')
          .replace(/\\uc\d+/g, '')
          // Replace paragraph breaks
          .replace(/\\par\s*/g, '\n')
          // Replace line breaks
          .replace(/\\line\s*/g, '\n')
          // Replace tabs
          .replace(/\\tab\s*/g, '\t')
          // Remove formatting commands but keep content
          .replace(/\\[a-zA-Z]+\d*\s?/g, ' ')
          // Remove control symbols
          .replace(/\\[^a-zA-Z\s]/g, '')
          // Remove remaining braces
          .replace(/[{}]/g, '')
          // Clean up whitespace
          .replace(/\s+/g, ' ')
          .replace(/\n\s+/g, '\n')
          // Unescape characters
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