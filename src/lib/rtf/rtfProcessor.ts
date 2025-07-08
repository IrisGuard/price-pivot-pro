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
    // ΠΡΟΗΓΜΕΝΗ RTF PARSING - ΠΛΗΡΗΣ ΑΝΑΔΙΑΡΘΡΩΣΗ
    let text = rtfData;
    
    // ΦΑΣΗ 1: Αφαίρεση RTF Structure και Headers
    // Αφαίρεση RTF version και header block
    text = text.replace(/^{\s*\\rtf1\\[^{}]*/, '');
    
    // ΦΑΣΗ 2: Στοχευμένη αφαίρεση Font Tables και Metadata
    // Βελτιωμένη αφαίρεση font table με nested handling
    text = text.replace(/\\fonttbl\s*{(?:[^{}]*{[^{}]*})*[^{}]*}/g, '');
    // Αφαίρεση color table
    text = text.replace(/\\colortbl[^}]*}/g, '');
    // Αφαίρεση stylesheet
    text = text.replace(/\\stylesheet[^}]*}/g, '');
    // Αφαίρεση info block
    text = text.replace(/\\info\s*{[^{}]*}/g, '');
    // Αφαίρεση generator info
    text = text.replace(/\\generator[^;]*;/g, '');
    
    // ΦΑΣΗ 3: Πρώτη περιοχή - Unicode characters (Ελληνικά)
    // Enhanced Unicode handling για Ελληνικούς χαρακτήρες
    text = text.replace(/\\u(\d+)\\?'?[0-9a-fA-F]*\?/g, (match, code) => {
      const charCode = parseInt(code, 10);
      // Extended range για Ελληνικούς χαρακτήρες
      if (charCode >= 32 && charCode <= 65535) {
        try {
          return String.fromCharCode(charCode);
        } catch {
          return ' ';
        }
      }
      return '';
    });
    
    // ΦΑΣΗ 4: Hex character sequences
    text = text.replace(/\\'([0-9a-fA-F]{2})/g, (match, hex) => {
      try {
        const charCode = parseInt(hex, 16);
        if (charCode >= 32 && charCode <= 255) {
          return String.fromCharCode(charCode);
        }
      } catch {
        return ' ';
      }
      return '';
    });
    
    // ΦΑΣΗ 5: RTF Control Words - Εκτεταμένη λίστα
    // Formatting controls
    text = text.replace(/\\(b|i|ul|strike|sub|super|scaps|caps)\d*\s*/g, '');
    // Font και size controls  
    text = text.replace(/\\(f|fs|cf|cb|highlight)\d+\s*/g, '');
    // Paragraph formatting
    text = text.replace(/\\(ql|qr|qc|qj|li|ri|fi|sb|sa)\d*\s*/g, '');
    // Page formatting
    text = text.replace(/\\(paperw|paperh|margl|margr|margt|margb)\d+\s*/g, '');
    // Generic control words
    text = text.replace(/\\[a-zA-Z]+\d*\s*/g, ' ');
    
    // ΦΑΣΗ 6: Formatting conversion
    text = text.replace(/\\par\b/g, '\n');
    text = text.replace(/\\line\b/g, '\n');
    text = text.replace(/\\tab\b/g, '\t');
    text = text.replace(/\\cell\b/g, '\t');
    text = text.replace(/\\row\b/g, '\n');
    
    // ΦΑΣΗ 7: Cleanup και normalization
    // Αφαίρεση brackets
    text = text.replace(/[{}]/g, ' ');
    // Αφαίρεση ειδικών RTF sequences
    text = text.replace(/\\[^a-zA-Z\s]/g, '');
    // Normalization whitespace
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/^\s+|\s+$/gm, '');
    
    // ΦΑΣΗ 8: Τελικός καθαρισμός non-printable characters
    // Διατήρηση μόνο έγκυρων χαρακτήρων (Latin, Greek, punctuation, numbers)
    text = text.replace(/[^\u0020-\u007E\u0370-\u03FF\u1F00-\u1FFF\s\n\t]/g, ' ');
    
    // Final cleanup
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]{2,}/g, ' ');
    text = text.trim();
    
    return text;
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