export interface RTFProcessingResult {
  text: string;
  prices: Array<{ value: number; x: number; y: number; pageIndex: number }>;
  metadata: {
    encoding: string;
    size: number;
    processingTime: number;
  };
}

export class RTFProcessor {
  async processRTFFile(file: File): Promise<RTFProcessingResult> {
    const startTime = Date.now();
    
    const arrayBuffer = await file.arrayBuffer();
    
    // Try multiple encodings
    let rtfData = '';
    let encoding = 'utf-8';
    
    try {
      rtfData = new TextDecoder('utf-8').decode(arrayBuffer);
      encoding = 'utf-8';
    } catch {
      try {
        rtfData = new TextDecoder('windows-1252').decode(arrayBuffer);
        encoding = 'windows-1252';
      } catch {
        rtfData = new TextDecoder('iso-8859-1').decode(arrayBuffer);
        encoding = 'iso-8859-1';
      }
    }
    
    const text = this.parseRTFToText(rtfData);
    const prices = this.extractPricesFromRTF(text);
    
    const processingTime = Date.now() - startTime;
    
    return {
      text,
      prices,
      metadata: {
        encoding,
        size: arrayBuffer.byteLength,
        processingTime
      }
    };
  }
  
  private parseRTFToText(rtfData: string): string {
    return rtfData
      // Remove RTF header and version
      .replace(/^{\s*\\rtf1[^\\]*/, '')
      // Remove font table
      .replace(/\\fonttbl\s*{[^}]*(?:{[^}]*}[^}]*)*}/g, '')
      // Remove color table
      .replace(/\\colortbl\s*[^}]*}/g, '')
      // Remove style definitions
      .replace(/\\stylesheet\s*{[^}]*(?:{[^}]*}[^}]*)*}/g, '')
      // Remove document info
      .replace(/\\info\s*{[^}]*(?:{[^}]*}[^}]*)*}/g, '')
      // Remove generator and other metadata
      .replace(/\\generator[^;]*;/g, '')
      .replace(/\\viewkind\d+/g, '')
      .replace(/\\uc\d+/g, '')
      .replace(/\\deff\d+/g, '')
      // Convert RTF formatting to plain text
      .replace(/\\par\s*/g, '\n')
      .replace(/\\line\s*/g, '\n')
      .replace(/\\tab\s*/g, '\t')
      .replace(/\\page\s*/g, '\n\n--- Page Break ---\n\n')
      // Remove font and size commands
      .replace(/\\f\d+/g, '')
      .replace(/\\fs\d+/g, '')
      // Remove formatting commands
      .replace(/\\[a-zA-Z]+\d*\s?/g, ' ')
      // Remove control characters
      .replace(/\\[^a-zA-Z\s]/g, '')
      // Clean up braces
      .replace(/[{}]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .replace(/\s+\n/g, '\n')
      // Unescape special characters
      .replace(/\\\\/g, '\\')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .trim();
  }
  
  private extractPricesFromRTF(text: string): Array<{ value: number; x: number; y: number; pageIndex: number }> {
    const pricePatterns = [
      // Euro patterns
      /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g,
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/g,
      // Dollar patterns
      /\$\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g,
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*\$/g,
      // Plain numbers with decimals
      /(?:^|\s)(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})(?:\s|$)/g,
      // Price keywords
      /(?:price|cost|total|amount|τιμή|κόστος|σύνολο|τελική|αξία)\s*:?\s*(\d+[.,]?\d*)/gi,
      // Large numbers (potential prices)
      /(?:^|\s)(\d{2,6}[.,]?\d{0,2})(?:\s|$)/g
    ];

    const prices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];
    const foundValues = new Set<number>();
    
    pricePatterns.forEach((pattern, patternIndex) => {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const priceStr = match[1] || match[0];
        const cleanedPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
        const value = parseFloat(cleanedPrice);
        
        // Validate price range and avoid duplicates
        if (!isNaN(value) && value > 0 && value < 1000000 && !foundValues.has(value)) {
          foundValues.add(value);
          prices.push({
            value,
            x: 400 + (patternIndex * 25), // Approximate x position
            y: 700 - (prices.length * 20), // Approximate y position
            pageIndex: 0 // RTF is single page
          });
        }
      }
    });

    return prices.sort((a, b) => a.value - b.value);
  }
}