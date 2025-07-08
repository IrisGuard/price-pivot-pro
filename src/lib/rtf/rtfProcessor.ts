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
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Enhanced encoding detection
    let rtfData = '';
    let encoding = 'utf-8';
    
    // Check for BOM (Byte Order Mark)
    if (uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
      // UTF-8 BOM detected
      rtfData = new TextDecoder('utf-8').decode(arrayBuffer.slice(3));
      encoding = 'utf-8';
    } else {
      // Try multiple encodings with better error handling
      const encodings = ['utf-8', 'windows-1252', 'windows-1253', 'iso-8859-7', 'iso-8859-1'];
      let bestResult = { data: '', encoding: 'utf-8', score: 0 };
      
      for (const enc of encodings) {
        try {
          const decoded = new TextDecoder(enc, { fatal: false }).decode(arrayBuffer);
          
          // Score based on RTF structure and Greek character patterns
          let score = 0;
          if (decoded.includes('{\\rtf1')) score += 10;
          if (decoded.includes('\\fonttbl')) score += 5;
          
          // Greek character detection
          const greekPattern = /[Α-Ωα-ωάέήίόύώ]/g;
          const greekMatches = decoded.match(greekPattern);
          if (greekMatches) score += greekMatches.length * 0.1;
          
          // Penalty for replacement characters
          const replacementChars = (decoded.match(/�/g) || []).length;
          score -= replacementChars * 2;
          
          if (score > bestResult.score) {
            bestResult = { data: decoded, encoding: enc, score };
          }
        } catch (error) {
          continue;
        }
      }
      
      rtfData = bestResult.data;
      encoding = bestResult.encoding;
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
    // ΚΡΙΣΙΜΗ ΔΙΟΡΘΩΣΗ: Αφαίρεση όλων των RTF metadata πριν το parsing
    let text = rtfData;
    
    // ΒΗΜΑ 1: Αφαίρεση ολόκληρου του RTF header και font table
    text = text.replace(/^{\s*\\rtf1[^{]*/, ''); // RTF header
    text = text.replace(/\\fonttbl\s*{[^{}]*(?:{[^{}]*}[^{}]*)*}/g, ''); // Font table
    text = text.replace(/\\colortbl[^}]*;/g, ''); // Color table
    text = text.replace(/\\stylesheet[^}]*}/g, ''); // Stylesheet
    text = text.replace(/\\info\s*{[^{}]*(?:{[^{}]*}[^{}]*)*}/g, ''); // Info block
    
    // ΒΗΜΑ 2: Αφαίρεση όλων των control sequences που δημιουργούν "κορακίστικους" χαρακτήρες
    text = text.replace(/\\[a-zA-Z]+\d*\s*/g, ' '); // Όλα τα RTF control words
    text = text.replace(/\\[^a-zA-Z\s]/g, ''); // Special characters
    
    // Handle Unicode escape sequences first (for Greek characters)
    text = text.replace(/\\u(\d+)\?/g, (match, code) => {
      const charCode = parseInt(code, 10);
      if (charCode >= 32 && charCode < 55296) { // Valid Unicode range
        return String.fromCharCode(charCode);
      }
      return '';
    });
    
    // Handle hex escape sequences \'xx
    text = text.replace(/\\'([0-9a-fA-F]{2})/g, (match, hex) => {
      const charCode = parseInt(hex, 16);
      if (charCode >= 32) { // Printable characters only
        return String.fromCharCode(charCode);
      }
      return ' ';
    });
    
    // ΒΗΜΑ 3: Μετατροπή RTF formatting σε απλό κείμενο
    text = text.replace(/\\par\s*/g, '\n'); // Παράγραφοι
    text = text.replace(/\\line\s*/g, '\n'); // Νέες γραμμές
    text = text.replace(/\\tab\s*/g, '\t'); // Tabs
    
    // ΒΗΜΑ 4: Καθαρισμός από άγνωστους χαρακτήρες και normalize
    text = text.replace(/[{}]/g, ' '); // Αφαίρεση braces
    text = text.replace(/\s+/g, ' '); // Normalize whitespace
    text = text.replace(/^\s+|\s+$/gm, ''); // Trim κάθε γραμμή
    
    // ΒΗΜΑ 5: Αφαίρεση τελικών artifacts και "κορακίστικων" χαρακτήρων
    text = text.replace(/[^\w\s\n\t\u0370-\u03FF\u1F00-\u1FFF.,;:!?€$%()-]/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n'); // Μέγιστο 2 κενές γραμμές
    text = text.replace(/\s{2,}/g, ' '); // Μέγιστο 1 κενό
    
    return text.trim();
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