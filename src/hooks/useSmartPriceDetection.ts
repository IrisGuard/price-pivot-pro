import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

export interface DetectedPrice {
  id: string;
  value: number;
  originalText: string;
  x: number;
  y: number;
  pageIndex: number;
  isModified: boolean;
  newValue?: number;
}

export const useSmartPriceDetection = () => {
  const [detectedPrices, setDetectedPrices] = useState<DetectedPrice[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectPricesInPDF = useCallback(async (pdfDoc: pdfjsLib.PDFDocumentProxy) => {
    setIsDetecting(true);
    const allPrices: DetectedPrice[] = [];

    try {
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        // Εξαγωγή text items με θέσεις
        const textItems = textContent.items.filter((item: any) => 'str' in item);

        textItems.forEach((item: any, index: number) => {
          const text = item.str;
          
          // Patterns για ανίχνευση τιμών στα ελληνικά
          const pricePatterns = [
            /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g,
            /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/g,
            /€\s*(\d+(?:[.,]\d{2})?)/g,
            /(\d+(?:[.,]\d{2})?)\s*€/g,
            // Ελληνικά keywords + αριθμοί
            /(?:τιμή|κόστος|σύνολο|αξία|ποσό)\s*[:=]?\s*(\d+[.,]?\d*)/gi,
            // Standalone numbers που μοιάζουν με τιμές
            /(?:^|\s)(\d{2,}[.,]\d{2})(?:\s|$)/g
          ];

          pricePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
              const priceStr = match[1] || match[0];
              const cleanedPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
              const value = parseFloat(cleanedPrice);
              
              if (!isNaN(value) && value >= 1 && value <= 50000) {
                // Μετατροπή συντεταγμένων PDF σε display coordinates
                const transform = item.transform;
                const x = transform[4];
                const y = viewport.height - transform[5];

                allPrices.push({
                  id: `price-${pageNum}-${index}-${allPrices.length}`,
                  value,
                  originalText: text,
                  x,
                  y,
                  pageIndex: pageNum - 1,
                  isModified: false
                });
              }
            }
          });
        });
      }

      // Αφαίρεση διπλότυπων με βάση την τιμή και τη θέση
      const uniquePrices = allPrices.filter((price, index, self) => {
        return index === self.findIndex(p => 
          Math.abs(p.value - price.value) < 0.01 && 
          Math.abs(p.x - price.x) < 10 && 
          Math.abs(p.y - price.y) < 10 &&
          p.pageIndex === price.pageIndex
        );
      });

      setDetectedPrices(uniquePrices.sort((a, b) => a.value - b.value));
    } catch (error) {
      console.error('Σφάλμα κατά την ανίχνευση τιμών:', error);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const applyPercentageToAllPrices = useCallback((percentage: number) => {
    setDetectedPrices(prev => prev.map(price => ({
      ...price,
      isModified: true,
      newValue: Math.round(price.value * (1 + percentage / 100) * 100) / 100
    })));
  }, []);

  const updateSinglePrice = useCallback((priceId: string, newValue: number) => {
    setDetectedPrices(prev => prev.map(price => 
      price.id === priceId 
        ? { ...price, isModified: true, newValue }
        : price
    ));
  }, []);

  const resetPrices = useCallback(() => {
    setDetectedPrices(prev => prev.map(price => ({
      ...price,
      isModified: false,
      newValue: undefined
    })));
  }, []);

  return {
    detectedPrices,
    isDetecting,
    detectPricesInPDF,
    applyPercentageToAllPrices,
    updateSinglePrice,
    resetPrices
  };
};