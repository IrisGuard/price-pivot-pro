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
    // Critical fix: Extract actual document content, not font metadata
    let text = rtfData;
    
    // First, isolate the document content (after font table and before closing brace)
    const contentMatch = text.match(/\\fonttbl[^}]*}[^}]*}(.+)$/s);
    if (contentMatch) {
      text = contentMatch[1];
    } else {
      // Fallback: remove everything before first actual content
      const fallbackMatch = text.match(/}([^\\{]+.*)/s);
      if (fallbackMatch) {
        text = fallbackMatch[1];
      }
    }
    
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
    
    // Enhanced RTF content extraction
    return text
      // Remove RTF header and version info
      .replace(/^{\s*\\rtf1[^\\{}]*/, '')
      // CRITICAL: Completely remove font table (this was causing the font names issue)
      .replace(/\\fonttbl\s*{[^{}]*(?:{[^{}]*}[^{}]*)*}/g, '')
      // Remove color table
      .replace(/\\colortbl[^}]*;/g, '')
      // Remove style definitions
      .replace(/\\stylesheet\s*{[^{}]*(?:{[^{}]*}[^{}]*)*}/g, '')
      // Remove document info
      .replace(/\\info\s*{[^{}]*}/g, '')
      // Remove specific metadata
      .replace(/\\generator[^;{}]*[;}]/g, '')
      .replace(/\\viewkind\d+\s*/g, '')
      .replace(/\\uc\d+\s*/g, '')
      .replace(/\\deff\d+\s*/g, '')
      .replace(/\\deflang\d+\s*/g, '')
      .replace(/\\deflangfe\d+\s*/g, '')
      // Convert RTF paragraph and formatting to text
      .replace(/\\par\s*/g, '\n')
      .replace(/\\line\s*/g, '\n')
      .replace(/\\tab\s*/g, '\t')
      .replace(/\\page\s*/g, '\n\n--- Page Break ---\n\n')
      // Remove font references and size commands
      .replace(/\\f\d+\s*/g, '')
      .replace(/\\fs\d+\s*/g, '')
      .replace(/\\cf\d+\s*/g, '')
      .replace(/\\cb\d+\s*/g, '')
      // Remove formatting commands
      .replace(/\\b\d*\s*/g, '')  // bold
      .replace(/\\i\d*\s*/g, '')  // italic
      .replace(/\\ul\d*\s*/g, '') // underline
      // Remove ALL remaining RTF control words (this prevents font names from appearing)
      .replace(/\\[a-zA-Z]+\d*\s*/g, ' ')
      // Remove control characters
      .replace(/\\[^a-zA-Z\s]/g, '')
      // Clean up braces and structure
      .replace(/[{}]/g, ' ')
      // Normalize whitespace thoroughly
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .replace(/\s+\n/g, '\n')
      .replace(/^\s+|\s+$/gm, '') // trim each line
      // Remove any remaining artifacts
      .replace(/[^\w\s\n\t\u0370-\u03FF\u1F00-\u1FFF.,;:!?€$-]/g, ' ')
      // Final cleanup
      .replace(/\n{3,}/g, '\n\n') // max 2 consecutive newlines
      .replace(/\s{2,}/g, ' ') // max 1 space
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