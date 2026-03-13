import * as pdfjsLib from 'pdfjs-dist';
import { RTFProcessor } from '@/lib/rtf/rtfProcessor';

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

// Worker is set globally in main.tsx

/**
 * Extracts all prices from a PDF or RTF file
 */
export async function extractPricesFromFile(file: File): Promise<PDFExtractionResult> {
  const ext = file.name.toLowerCase().split('.').pop();
  
  if (ext === 'rtf') {
    return extractPricesFromRTF(file);
  }
  return extractPricesFromPDF(file);
}

/**
 * Extract prices from RTF using existing RTF processor
 */
async function extractPricesFromRTF(file: File): Promise<PDFExtractionResult> {
  const processor = new RTFProcessor();
  const result = await processor.processRTFFile(file);
  
  const prices: ExtractedPrice[] = result.prices.map(p => ({
    value: p.value,
    text: `${p.value.toFixed(2)} €`,
    x: p.x,
    y: p.y,
    width: 60,
    height: 12,
    pageIndex: p.pageIndex,
  }));

  // Find total from text
  const totalDetected = findTotalInText(result.text);

  return { prices, totalDetected, fullText: result.text };
}

/**
 * Extracts all prices from a PDF file with their exact positions
 */
async function extractPricesFromPDF(file: File): Promise<PDFExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer), disableWorker: true } as any).promise;
  
  const allPrices: ExtractedPrice[] = [];
  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    let pageText = '';
    const items = textContent.items as any[];
    
    for (const item of items) {
      if (!item.str) continue;
      pageText += item.str + ' ';
      
      const priceMatch = findPriceInText(item.str);
      if (priceMatch !== null) {
        const transform = item.transform;
        allPrices.push({
          value: priceMatch,
          text: item.str.trim(),
          x: transform[4],
          y: viewport.height - transform[5],
          width: item.width || 60,
          height: item.height || 12,
          pageIndex: pageNum - 1,
        });
      }
    }
    
    fullText += pageText + '\n';
  }

  const totalDetected = findTotalInText(fullText);

  return { prices: allPrices, totalDetected, fullText };
}

/**
 * Find the final total in extracted text
 */
function findTotalInText(text: string): number | null {
  let total: number | null = null;
  
  const totalPatterns = [
    /SYNOLO\s*=\s*([\d\s.,]+)\s*EUR/i,
    /Τελικ[οό]\s*Σ[υύ]νολο[^\d]*([\d\s.,]+)\s*€/i,
    /TOTAL[^\d]*([\d\s.,]+)\s*€/i,
    /Σ[υύ]νολο[^\d]*([\d\s.,]+)\s*€/i,
  ];
  
  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      const cleanValue = match[1].replace(/\s/g, '').replace(',', '.');
      const parsed = parseFloat(cleanValue);
      if (!isNaN(parsed) && parsed > 0) {
        total = parsed;
      }
    }
  }
  
  return total;
}

/**
 * Find a price value in a text string
 */
function findPriceInText(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 30) return null;
  
  const patterns = [
    /^([\d\s.]+,\d{2})\s*€?$/,
    /^([\d\s,]+\.\d{2})\s*€?$/,
    /^€?\s*([\d\s.]+,\d{2})$/,
    /^([\d\s.]+,\d{2})$/,
    /^([\d\s,]+\.\d{2})$/,
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      let cleanValue = match[1]
        .replace(/\s/g, '')
        .replace(/\.(?=\d{3})/g, '')
        .replace(',', '.');
      
      const value = parseFloat(cleanValue);
      if (!isNaN(value) && value > 0 && value < 1000000) {
        return value;
      }
    }
  }
  
  return null;
}
