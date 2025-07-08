export interface DetectedPrice {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

export class PriceDetector {
  extractPricesFromText(text: string, pageIndex: number): DetectedPrice[] {
    const pricePatterns = [
      /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g,
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/g,
      /(?:^|\s)(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})(?:\s|$)/g,
      /€\s*(\d+)/g,
      /(\d+)\s*€/g,
      /(?:price|cost|total|amount|τιμή|κόστος|σύνολο)\s*:?\s*(\d+[.,]?\d*)/gi,
      /(?:^|\s)(\d{2,}[.,]\d{1,2})(?:\s|$)/g
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
  }

  extractPricesFromTextWithCoordinates(
    textItems: Array<{text: string, x: number, y: number, width: number, height: number}>,
    pageIndex: number
  ): DetectedPrice[] {
    const pricePatterns = [
      /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/,
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/,
      /€\s*(\d+)/,
      /(\d+)\s*€/
    ];

    const prices: DetectedPrice[] = [];
    const foundValues = new Set<number>();

    textItems.forEach(item => {
      pricePatterns.forEach(pattern => {
        const match = item.text.match(pattern);
        if (match) {
          const priceStr = match[1] || match[0];
          const cleanedPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
          const value = parseFloat(cleanedPrice);
          
          if (!isNaN(value) && value > 0 && value < 100000 && !foundValues.has(value)) {
            foundValues.add(value);
            prices.push({
              value,
              x: item.x,
              y: item.y,
              pageIndex
            });
          }
        }
      });
    });

    return prices.sort((a, b) => a.value - b.value);
  }

  validatePriceValue(value: number): boolean {
    return !isNaN(value) && value > 0 && value < 100000;
  }

  formatPrice(value: number, currency: string = '€'): string {
    return `${currency}${value.toFixed(2)}`;
  }
}

export const priceDetector = new PriceDetector();