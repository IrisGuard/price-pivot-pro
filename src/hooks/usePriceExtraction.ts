import { useCallback } from 'react';

export interface DetectedPrice {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
  context?: string;
  confidence: number;
}

export const usePriceExtraction = () => {
  const extractPricesFromText = useCallback((text: string, pageIndex: number) => {
    // Enhanced Greek context patterns - more comprehensive
    const contextPatterns = [
      // Direct currency symbols - highest confidence
      { pattern: /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g, confidence: 0.95, context: 'Euro symbol' },
      { pattern: /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/g, confidence: 0.95, context: 'Euro symbol' },
      
      // Greek price keywords - high confidence
      { pattern: /(?:τιμή|κόστος|σύνολο|αξία|ποσό|εκτίμηση)\s*[:=]?\s*(\d+(?:[.,]\d{1,2})?)/gi, confidence: 0.90, context: 'Greek price keyword' },
      { pattern: /(?:price|cost|total|amount|value|estimate)\s*[:=]?\s*(\d+(?:[.,]\d{1,2})?)/gi, confidence: 0.85, context: 'English price keyword' },
      
      // Currency codes - medium-high confidence
      { pattern: /(\d+(?:[.,]\d{1,2})?)\s*(?:EUR|eur|€)/g, confidence: 0.80, context: 'EUR currency' },
      
      // Decimal numbers in price-like contexts - medium confidence
      { pattern: /(?:^|\s)(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})(?:\s|$)/g, confidence: 0.60, context: 'Decimal format' },
      
      // Simple euro amounts without decimals - lower confidence
      { pattern: /€\s*(\d+)/g, confidence: 0.50, context: 'Simple euro' },
      { pattern: /(\d+)\s*€/g, confidence: 0.50, context: 'Simple euro' },
      
      // Numbers that look like prices (reasonable range) - lowest confidence
      { pattern: /(?:^|\s)(\d{2,5}[.,]\d{1,2})(?:\s|$)/g, confidence: 0.40, context: 'Price-like number' }
    ];

    const prices: DetectedPrice[] = [];
    const foundValues = new Set<string>(); // Track by string to avoid floating point issues
    
    contextPatterns.forEach((patternObj, patternIndex) => {
      const { pattern, confidence, context } = patternObj;
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const priceStr = match[1] || match[0];
        const cleanedPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
        const value = parseFloat(cleanedPrice);
        
        // Enhanced validation: reasonable price range and valid format
        if (!isNaN(value) && value >= 0.01 && value <= 999999 && !foundValues.has(cleanedPrice)) {
          foundValues.add(cleanedPrice);
          
          // Better positioning based on pattern confidence
          const baseX = 450 + (patternIndex * 25);
          const baseY = 650 - prices.length * 30;
          
          prices.push({
            value,
            x: baseX,
            y: baseY,
            pageIndex,
            context,
            confidence
          });
        }
      }
    });

    // Sort by confidence first, then by value
    return prices.sort((a, b) => {
      if (Math.abs(a.confidence - b.confidence) > 0.05) {
        return b.confidence - a.confidence; // Higher confidence first
      }
      return a.value - b.value; // Then by value
    });
  }, []);

  const extractPricesWithCoordinates = useCallback((
    textItems: Array<{text: string, x: number, y: number, width: number, height: number}>,
    pageIndex: number
  ): DetectedPrice[] => {
    const prices: DetectedPrice[] = [];
    const foundValues = new Set<string>();

    const highConfidencePatterns = [
      { pattern: /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/, confidence: 0.95 },
      { pattern: /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/, confidence: 0.95 },
      { pattern: /(?:τιμή|κόστος|σύνολο)\s*[:=]?\s*(\d+(?:[.,]\d{1,2})?)/, confidence: 0.90 }
    ];

    textItems.forEach(item => {
      highConfidencePatterns.forEach(({ pattern, confidence }) => {
        const match = item.text.match(pattern);
        if (match) {
          const priceStr = match[1] || match[0];
          const cleanedPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
          const value = parseFloat(cleanedPrice);
          
          if (!isNaN(value) && value >= 0.01 && value <= 999999 && !foundValues.has(cleanedPrice)) {
            foundValues.add(cleanedPrice);
            prices.push({
              value,
              x: item.x,
              y: item.y,
              pageIndex,
              context: 'Positioned text',
              confidence
            });
          }
        }
      });
    });

    return prices.sort((a, b) => b.confidence - a.confidence);
  }, []);

  return { 
    extractPricesFromText,
    extractPricesWithCoordinates
  };
};