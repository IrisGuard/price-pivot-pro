import { PDFDocument, rgb } from 'pdf-lib';
import type { PriceInfo, PriceMetadata } from './types';

export class PDFPriceProcessor {
  constructor(private securityHash: string) {}

  async extractPriceCoordinates(pdfDoc: PDFDocument): Promise<PriceInfo[]> {
    const priceData: PriceInfo[] = [];
    const pages = pdfDoc.getPages();
    
    // Search for price patterns in PDF text content
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      const { width, height } = page.getSize();
      
      // Common price patterns: €XX.XX, €XX,XX, XX.XX€, XX,XX€
      const pricePatterns = [
        /€\s*(\d+[.,]\d{2})/g,
        /(\d+[.,]\d{2})\s*€/g,
        /€\s*(\d+)/g,
        /(\d+)\s*€/g
      ];
      
      // Real price extraction - will be populated from actual PDF analysis
      const realPrices: Array<{ value: number; x: number; y: number }> = [];
      
      realPrices.forEach(price => {
        priceData.push({
          value: price.value,
          x: price.x,
          y: price.y,
          pageIndex
        });
      });
    }
    
    return priceData;
  }

  async updatePriceAtCoordinate(pdfDoc: PDFDocument, priceInfo: PriceInfo, newPrice: number): Promise<void> {
    const pages = pdfDoc.getPages();
    const page = pages[priceInfo.pageIndex];
    
    // Draw white rectangle to cover old price
    page.drawRectangle({
      x: priceInfo.x - 10,
      y: priceInfo.y - 5,
      width: 80,
      height: 15,
      color: rgb(1, 1, 1)
    });
    
    // Draw new price
    page.drawText(`€${newPrice.toFixed(2)}`, {
      x: priceInfo.x,
      y: priceInfo.y,
      size: 11,
      color: rgb(0, 0, 0)
    });
  }

  async storePriceMetadata(pdfDoc: PDFDocument, priceData: PriceInfo[], securitySignature: string): Promise<void> {
    // Store as custom metadata for JavaScript access
    const metadata: PriceMetadata = {
      prices: priceData,
      security: this.securityHash,
      timestamp: Date.now()
    };
    
    // This would be accessible via JavaScript in the PDF
    pdfDoc.setSubject(`${securitySignature}|${Buffer.from(JSON.stringify(metadata)).toString('base64')}`);
  }

  async processPricesWithCoordinates(pdfDoc: PDFDocument, percentage: number, securitySignature: string): Promise<void> {
    // Store initial prices and their coordinates for JavaScript access
    const priceData = await this.extractPriceCoordinates(pdfDoc);
    const multiplier = 1 + (percentage / 100);
    
    // Apply initial price changes
    for (const priceInfo of priceData) {
      const newPrice = Math.round(priceInfo.value * multiplier * 100) / 100;
      await this.updatePriceAtCoordinate(pdfDoc, priceInfo, newPrice);
    }
    
    // Store price coordinates as PDF metadata for JavaScript access
    await this.storePriceMetadata(pdfDoc, priceData, securitySignature);
  }
}