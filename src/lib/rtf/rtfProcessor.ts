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
    // 1) Remove non-content RTF groups (font tables, style metadata, etc.)
    let text = this.stripNonContentGroups(rtfData);

    // 2) Decode unicode escapes (supports negative values used in RTF)
    text = text.replace(/\\u(-?\d+)\??/g, (_, code) => {
      const parsed = Number.parseInt(code, 10);
      if (Number.isNaN(parsed)) return '';
      const normalized = parsed < 0 ? 65536 + parsed : parsed;
      if (normalized < 32 || normalized > 65535) return ' ';
      try {
        return String.fromCharCode(normalized);
      } catch {
        return ' ';
      }
    });

    // 3) Decode hex escaped characters
    text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => {
      const value = Number.parseInt(hex, 16);
      return Number.isNaN(value) ? ' ' : String.fromCharCode(value);
    });

    // 4) Convert structural controls before removing generic controls
    text = text
      .replace(/\\(par|line|row|page)\b/g, '\n')
      .replace(/\\(tab|cell)\b/g, '\t');

    // 5) Remove remaining control symbols / words
    text = text
      .replace(/\\\*/g, '')
      .replace(/\\[a-zA-Z]+-?\d*\s?/g, ' ')
      .replace(/\\[{}\\]/g, ' ')
      .replace(/[{}]/g, ' ')
      .replace(/\r/g, '\n');

    // 6) Line-by-line cleanup while preserving table tabs
    const lines = text
      .split('\n')
      .map((line) => this.normalizeLine(line))
      .filter((line) => line.length > 0 && !this.isNoiseLine(line));

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  private stripNonContentGroups(rtfData: string): string {
    const destinations = [
      'fonttbl',
      'colortbl',
      'stylesheet',
      'info',
      'xmlnstbl',
      'revtbl',
      'listtable',
      'listoverridetable'
    ];

    let result = '';
    let depth = 0;
    let skipDepth = -1;

    for (let i = 0; i < rtfData.length; i++) {
      const char = rtfData[i];
      const next = rtfData[i + 1];

      // Keep escaped braces/backslashes intact for later cleanup
      if (char === '\\' && (next === '{' || next === '}' || next === '\\')) {
        if (skipDepth === -1) result += char + next;
        i++;
        continue;
      }

      if (char === '{') {
        depth += 1;

        if (skipDepth === -1) {
          const lookahead = rtfData.slice(i + 1, i + 180);
          const isIgnorable = /^\s*\\\*/.test(lookahead);
          const isDestination = destinations.some((destination) =>
            new RegExp(`\\\\${destination}\\b`, 'i').test(lookahead)
          );

          if (isIgnorable || isDestination) {
            skipDepth = depth;
            continue;
          }

          result += char;
        }

        continue;
      }

      if (char === '}') {
        if (skipDepth === depth) {
          skipDepth = -1;
          depth -= 1;
          continue;
        }

        depth = Math.max(0, depth - 1);
        if (skipDepth === -1) result += char;
        continue;
      }

      if (skipDepth === -1) {
        result += char;
      }
    }

    return result;
  }

  private normalizeLine(line: string): string {
    return line
      .replace(/[ ]{2,}/g, ' ')
      .replace(/\t{2,}/g, '\t')
      .trim();
  }

  private isNoiseLine(line: string): boolean {
    const lower = line.toLowerCase();
    const semicolons = (line.match(/;/g) || []).length;

    // Typical font table leak pattern
    if (semicolons > 6 && /(times new roman|calibri|arial|tahoma|cambria)/i.test(line)) {
      return true;
    }

    // Common RTF metadata/control residue
    if (/^(ansi|ansicpg\d+|deff\d+|viewkind\d+|uc\d+|pard|plain|rtlch|ltrch)/.test(lower)) {
      return true;
    }

    return false;
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