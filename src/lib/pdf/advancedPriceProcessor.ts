export interface EnhancedPrice {
  id: string;
  value: number;
  originalValue: number;
  x: number;
  y: number;
  pageIndex: number;
  context: string;
  confidence: number;
  isModified: boolean;
  currency: string;
  format: 'decimal' | 'integer' | 'currency';
  category: 'product' | 'total' | 'tax' | 'shipping' | 'other';
}

export class AdvancedPriceProcessor {
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly MAX_PRICE_VALUE = 999999;
  private readonly MIN_PRICE_VALUE = 0.01;

  /**
   * Έξυπνη ανίχνευση τιμών με AI-based patterns και context analysis
   */
  extractSmartPrices(text: string, pageIndex: number): EnhancedPrice[] {
    const smartPatterns = [
      // Υψηλή ακρίβεια - Currency symbols με formatting
      {
        pattern: /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g,
        confidence: 0.95,
        context: 'Euro currency symbol',
        category: 'product' as const,
        format: 'currency' as const
      },
      {
        pattern: /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/g,
        confidence: 0.95,
        context: 'Euro currency symbol (suffix)',
        category: 'product' as const,
        format: 'currency' as const
      },
      
      // Ελληνικά keywords - Υψηλή ακρίβεια
      {
        pattern: /(?:συνολικό\s*κόστος|γενικό\s*σύνολο|τελικό\s*ποσό)\s*[:=]?\s*(\d+[.,]?\d*)/gi,
        confidence: 0.92,
        context: 'Total amount (Greek)',
        category: 'total' as const,
        format: 'currency' as const
      },
      {
        pattern: /(?:τιμή\s*μονάδας|μοναδιαία\s*τιμή|τιμή\s*τεμαχίου)\s*[:=]?\s*(\d+[.,]?\d*)/gi,
        confidence: 0.90,
        context: 'Unit price (Greek)',
        category: 'product' as const,
        format: 'currency' as const
      },
      {
        pattern: /(?:φπα|f\.p\.a\.?|vat)\s*[:=]?\s*(\d+[.,]?\d*)/gi,
        confidence: 0.88,
        context: 'VAT/Tax (Greek)',
        category: 'tax' as const,
        format: 'currency' as const
      },
      
      // English keywords - Μέτρια ακρίβεια
      {
        pattern: /(?:total\s*cost|grand\s*total|final\s*amount)\s*[:=]?\s*(\d+[.,]?\d*)/gi,
        confidence: 0.85,
        context: 'Total amount (English)',
        category: 'total' as const,
        format: 'currency' as const
      },
      {
        pattern: /(?:unit\s*price|price\s*per\s*unit|item\s*price)\s*[:=]?\s*(\d+[.,]?\d*)/gi,
        confidence: 0.83,
        context: 'Unit price (English)',
        category: 'product' as const,
        format: 'currency' as const
      },
      
      // Contextual patterns - Μέτρια ακρίβεια
      {
        pattern: /(?:έκπτωση|discount)\s*[:=]?\s*(\d+[.,]?\d*)/gi,
        confidence: 0.80,
        context: 'Discount amount',
        category: 'other' as const,
        format: 'currency' as const
      },
      {
        pattern: /(?:μεταφορικά|shipping|delivery)\s*[:=]?\s*(\d+[.,]?\d*)/gi,
        confidence: 0.78,
        context: 'Shipping cost',
        category: 'shipping' as const,
        format: 'currency' as const
      },
      
      // Generic decimal numbers - Χαμηλή ακρίβεια
      {
        pattern: /(?:^|\s)(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})(?:\s|$)/g,
        confidence: 0.60,
        context: 'Decimal number',
        category: 'other' as const,
        format: 'decimal' as const
      }
    ];

    const prices: EnhancedPrice[] = [];
    const foundValues = new Set<string>();
    let priceCounter = 0;

    smartPatterns.forEach((patternConfig, patternIndex) => {
      const { pattern, confidence, context, category, format } = patternConfig;
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(text)) !== null) {
        const priceStr = match[1] || match[0];
        const cleanedPrice = this.cleanPriceString(priceStr);
        const value = parseFloat(cleanedPrice);

        if (this.validatePrice(value) && !foundValues.has(cleanedPrice)) {
          foundValues.add(cleanedPrice);
          
          prices.push({
            id: `smart-price-${pageIndex}-${priceCounter++}`,
            value,
            originalValue: value,
            x: 450 + (patternIndex * 20),
            y: 650 - prices.length * 25,
            pageIndex,
            context,
            confidence,
            isModified: false,
            currency: '€',
            format,
            category
          });
        }
      }
    });

    return this.sortPricesByRelevance(prices);
  }

  /**
   * Position-aware price extraction με real coordinates
   */
  extractPositionedPrices(
    textItems: Array<{text: string, x: number, y: number, width: number, height: number}>,
    pageIndex: number
  ): EnhancedPrice[] {
    const prices: EnhancedPrice[] = [];
    const foundValues = new Set<string>();
    let priceCounter = 0;

    const positionPatterns = [
      {
        pattern: /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/,
        confidence: 0.95,
        context: 'Positioned Euro symbol',
        category: 'product' as const
      },
      {
        pattern: /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/,
        confidence: 0.95,
        context: 'Positioned Euro suffix',
        category: 'product' as const
      },
      {
        pattern: /(?:τιμή|κόστος|σύνολο)\s*[:=]?\s*(\d+(?:[.,]\d{1,2})?)/,
        confidence: 0.90,
        context: 'Positioned Greek keyword',
        category: 'product' as const
      }
    ];

    textItems.forEach(item => {
      positionPatterns.forEach(({ pattern, confidence, context, category }) => {
        const match = item.text.match(pattern);
        if (match) {
          const priceStr = match[1] || match[0];
          const cleanedPrice = this.cleanPriceString(priceStr);
          const value = parseFloat(cleanedPrice);

          if (this.validatePrice(value) && !foundValues.has(cleanedPrice)) {
            foundValues.add(cleanedPrice);
            
            prices.push({
              id: `pos-price-${pageIndex}-${priceCounter++}`,
              value,
              originalValue: value,
              x: item.x,
              y: item.y,
              pageIndex,
              context,
              confidence,
              isModified: false,
              currency: '€',
              format: 'currency',
              category
            });
          }
        }
      });
    });

    return prices.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Εφαρμογή ποσοστού σε όλες τις τιμές
   */
  applyPercentageToAllPrices(prices: EnhancedPrice[], percentage: number): EnhancedPrice[] {
    const multiplier = 1 + (percentage / 100);
    
    return prices.map(price => ({
      ...price,
      value: Math.round(price.originalValue * multiplier * 100) / 100,
      isModified: percentage !== 0
    }));
  }

  /**
   * Update μεμονωμένης τιμής
   */
  updateSinglePrice(prices: EnhancedPrice[], priceId: string, newValue: number): EnhancedPrice[] {
    return prices.map(price => 
      price.id === priceId 
        ? { 
            ...price, 
            value: newValue, 
            isModified: newValue !== price.originalValue 
          }
        : price
    );
  }

  /**
   * Format τιμής βάσει category και format
   */
  formatPrice(price: EnhancedPrice): string {
    const { value, currency, format, category } = price;
    
    switch (format) {
      case 'currency':
        return `${currency}${value.toFixed(2)}`;
      case 'decimal':
        return value.toFixed(2);
      case 'integer':
        return Math.round(value).toString();
      default:
        return `${currency}${value.toFixed(2)}`;
    }
  }

  /**
   * Καθαρισμός string τιμής
   */
  private cleanPriceString(priceStr: string): string {
    return priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
  }

  /**
   * Validation τιμής
   */
  private validatePrice(value: number): boolean {
    return !isNaN(value) && 
           value >= this.MIN_PRICE_VALUE && 
           value <= this.MAX_PRICE_VALUE;
  }

  /**
   * Ταξινόμηση τιμών βάσει relevance
   */
  private sortPricesByRelevance(prices: EnhancedPrice[]): EnhancedPrice[] {
    return prices.sort((a, b) => {
      // Πρώτα confidence
      if (Math.abs(a.confidence - b.confidence) > 0.05) {
        return b.confidence - a.confidence;
      }
      
      // Μετά category priority
      const categoryOrder = { total: 0, product: 1, tax: 2, shipping: 3, other: 4 };
      const aPriority = categoryOrder[a.category] ?? 5;
      const bPriority = categoryOrder[b.category] ?? 5;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Τέλος value
      return a.value - b.value;
    });
  }

  /**
   * Filter τιμών βάσει confidence threshold
   */
  filterHighConfidencePrices(prices: EnhancedPrice[]): EnhancedPrice[] {
    return prices.filter(price => price.confidence >= this.CONFIDENCE_THRESHOLD);
  }

  /**
   * Group τιμών βάσει category
   */
  groupPricesByCategory(prices: EnhancedPrice[]): Record<string, EnhancedPrice[]> {
    return prices.reduce((groups, price) => {
      const category = price.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(price);
      return groups;
    }, {} as Record<string, EnhancedPrice[]>);
  }
}

export const advancedPriceProcessor = new AdvancedPriceProcessor();