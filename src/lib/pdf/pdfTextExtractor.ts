import * as pdfjsLib from 'pdfjs-dist';

export interface ExtractedPrice {
  value: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
}

export interface PDFExtractionResult {
  prices: ExtractedPrice[];
  totalDetected: number | null;
  fullText: string;
}

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

/**
 * Extracts all prices from a PDF file with their exact positions
 */
export async function extractPricesFromPDF(file: File): Promise<PDFExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const allPrices: ExtractedPrice[] = [];
  let fullText = '';
  let totalDetected: number | null = null;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    let pageText = '';
    
    // Build text items with positions
    const items = textContent.items as any[];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.str) continue;
      
      pageText += item.str + ' ';
      
      // Look for price patterns in this text item and surrounding context
      const priceMatch = findPriceInText(item.str);
      if (priceMatch !== null) {
        const transform = item.transform;
        allPrices.push({
          value: priceMatch,
          text: item.str.trim(),
          x: transform[4],
          y: viewport.height - transform[5], // Convert to PDF coordinate system (bottom-up)
          width: item.width || 60,
          height: item.height || 12,
          pageIndex: pageNum - 1,
        });
      }
    }
    
    fullText += pageText + '\n';
    
    // Try to find the final total on the last pages
    // Look for patterns like "SYNOLO=1904 EUR" or "Τελικό Σύνολο ... 2 421,10 €"
    const totalPatterns = [
      /SYNOLO\s*=\s*([\d.,]+)\s*EUR/i,
      /Τελικ[οό]\s*Σ[υύ]νολο[^\d]*([\d\s.,]+)\s*€/i,
      /TOTAL[^\d]*([\d\s.,]+)\s*€/i,
      /Σ[υύ]νολο[^\d]*([\d\s.,]+)\s*€/i,
    ];
    
    for (const pattern of totalPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        const cleanValue = match[1].replace(/\s/g, '').replace(',', '.');
        const parsed = parseFloat(cleanValue);
        if (!isNaN(parsed) && parsed > 0) {
          totalDetected = parsed;
        }
      }
    }
  }

  return {
    prices: allPrices,
    totalDetected,
    fullText,
  };
}

/**
 * Find a price value in a text string
 */
function findPriceInText(text: string): number | null {
  const trimmed = text.trim();
  
  // Skip non-price content
  if (!trimmed || trimmed.length > 30) return null;
  
  // Patterns for European price formats
  const patterns = [
    // "285,34" or "2 421,10" or "1.904,00"
    /^([\d\s.]+,\d{2})\s*€?$/,
    // "285.34 €"
    /^([\d\s,]+\.\d{2})\s*€?$/,
    // "€285,34"
    /^€?\s*([\d\s.]+,\d{2})$/,
    // Just a decimal number that looks like a price
    /^([\d\s.]+,\d{2})$/,
    // Number with dot as decimal
    /^([\d\s,]+\.\d{2})$/,
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      let cleanValue = match[1]
        .replace(/\s/g, '') // remove spaces
        .replace(/\.(?=\d{3})/g, '') // remove thousand separators (dots before 3 digits)
        .replace(',', '.'); // convert decimal comma to dot
      
      const value = parseFloat(cleanValue);
      if (!isNaN(value) && value > 0 && value < 1000000) {
        return value;
      }
    }
  }
  
  return null;
}
