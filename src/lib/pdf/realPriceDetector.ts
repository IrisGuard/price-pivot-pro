export interface DetectedPrice {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
  text: string;
}

export class RealPriceDetector {
  extractPricesFromText(text: string, pageIndex: number): DetectedPrice[] {
    const pricePatterns = [
      // European format with euro symbol - most specific first
      /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g,
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/g,
      // Simple euro amounts
      /€\s*(\d+[.,]?\d*)/g,
      /(\d+[.,]?\d*)\s*€/g,
      // Standalone numbers that look like prices
      /(?:^|\s)(\d{2,}[.,]\d{1,2})(?:\s|$)/g,
      // Price context patterns
      /(?:price|cost|total|amount|τιμή|κόστος|σύνολο)\s*:?\s*(\d+[.,]?\d*)/gi,
    ];

    const prices: DetectedPrice[] = [];
    const foundValues = new Set<number>();
    
    pricePatterns.forEach((pattern, patternIndex) => {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        const priceStr = match[1] || match[0];
        const cleanedPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
        const value = parseFloat(cleanedPrice);
        
        // Validate price range and avoid duplicates
        if (!isNaN(value) && value > 0 && value < 100000 && !foundValues.has(value)) {
          foundValues.add(value);
          prices.push({
            value,
            x: 450 + (patternIndex * 30), // Spread horizontally
            y: 650 - prices.length * 25,   // Stack vertically
            pageIndex,
            text: `€${value.toFixed(2)}`
          });
        }
      }
    });

    return prices.sort((a, b) => a.value - b.value);
  }

  formatPrice(value: number, currency: string = '€'): string {
    return `${currency}${value.toFixed(2)}`;
  }

  validatePriceValue(value: number): boolean {
    return !isNaN(value) && value > 0 && value < 100000;
  }
}

export const realPriceDetector = new RealPriceDetector();