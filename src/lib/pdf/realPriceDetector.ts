import * as pdfjsLib from 'pdfjs-dist';

export interface DetectedPrice {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
  text: string;
  originalText: string;
}

export class RealPriceDetector {
  async detectPricesInPDF(pdfDoc: pdfjsLib.PDFDocumentProxy): Promise<DetectedPrice[]> {
    const allPrices: DetectedPrice[] = [];
    
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract text items with position information
        const textItems = textContent.items
          .filter((item): item is any => 'str' in item && 'transform' in item)
          .map((item: any) => ({
            text: item.str,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width,
            height: item.height
          }));

        // Detect prices in this page
        const pagePrices = this.extractPricesFromTextItems(textItems, pageNum - 1);
        allPrices.push(...pagePrices);
        
      } catch (error) {
        console.warn(`Failed to process page ${pageNum}:`, error);
      }
    }
    
    return this.deduplicatePrices(allPrices);
  }

  public extractPricesFromTextItems(textItems: any[], pageIndex: number): DetectedPrice[] {
    const prices: DetectedPrice[] = [];
    const pricePatterns = [
      // European format with euro symbol
      /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g,
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/g,
      // Numbers that could be prices (with 2 decimal places)
      /\b(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\b/g,
      // Simple euro amounts
      /€\s*(\d+)/g,
      /(\d+)\s*€/g
    ];

    textItems.forEach((item, itemIndex) => {
      const text = item.text;
      
      pricePatterns.forEach((pattern, patternIndex) => {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          const priceStr = match[1] || match[0];
          const cleanedPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
          const value = parseFloat(cleanedPrice);
          
          // Validate price range and format
          if (!isNaN(value) && value > 0 && value < 1000000) {
            // Check if it looks like a real price (not ID, date, etc.)
            if (this.isLikelyPrice(value, text, textItems, itemIndex)) {
              prices.push({
                value,
                x: item.x,
                y: item.y,
                pageIndex,
                text: `€${value.toFixed(2)}`,
                originalText: text
              });
            }
          }
        }
      });
    });

    return prices;
  }

  private isLikelyPrice(value: number, text: string, allItems: any[], currentIndex: number): boolean {
    // Skip obvious non-prices
    if (value < 0.01 || value > 100000) return false;
    
    // Check surrounding context for price indicators
    const contextRange = 3;
    const startIndex = Math.max(0, currentIndex - contextRange);
    const endIndex = Math.min(allItems.length, currentIndex + contextRange + 1);
    
    const contextText = allItems
      .slice(startIndex, endIndex)
      .map(item => item.text)
      .join(' ')
      .toLowerCase();

    // Price indicators in context
    const priceIndicators = [
      'τιμή', 'price', 'cost', 'κόστος', 'ποσό', 'amount', 'total', 'σύνολο',
      'eur', '€', 'euro', 'euros', 'προσφορά', 'offer', 'quote'
    ];
    
    const hasIndicator = priceIndicators.some(indicator => 
      contextText.includes(indicator)
    );

    // Avoid dates, phone numbers, IDs
    const avoidPatterns = [
      /\d{2}\/\d{2}\/\d{4}/, // dates
      /\d{4}-\d{4}-\d{4}/, // IDs
      /\d{10,}/, // long numbers (phones, etc.)
    ];
    
    const shouldAvoid = avoidPatterns.some(pattern => pattern.test(text));
    
    return hasIndicator && !shouldAvoid;
  }

  private deduplicatePrices(prices: DetectedPrice[]): DetectedPrice[] {
    const uniquePrices = new Map<string, DetectedPrice>();
    
    prices.forEach(price => {
      const key = `${price.value}-${price.pageIndex}`;
      if (!uniquePrices.has(key)) {
        uniquePrices.set(key, price);
      }
    });
    
    return Array.from(uniquePrices.values()).sort((a, b) => a.value - b.value);
  }
}

export const realPriceDetector = new RealPriceDetector();