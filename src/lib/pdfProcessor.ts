import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PriceAdjustmentOptions {
  percentage: number;
  roundToDecimals?: number;
}

export interface BannerOptions {
  removeExisting?: boolean;
  addNew?: {
    imageBytes: Uint8Array;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  };
}

export class PDFProcessor {
  private pdfDoc: PDFDocument | null = null;
  private originalPdfBytes: Uint8Array | null = null;

  async loadPDF(pdfBytes: Uint8Array): Promise<void> {
    this.originalPdfBytes = pdfBytes;
    this.pdfDoc = await PDFDocument.load(pdfBytes);
  }

  async extractText(): Promise<string[]> {
    if (!this.originalPdfBytes) {
      throw new Error('No PDF loaded');
    }

    const pdf = await pdfjsLib.getDocument({ data: this.originalPdfBytes }).promise;
    const textContent: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      textContent.push(pageText);
    }

    return textContent;
  }

  findPrices(text: string): number[] {
    // Enhanced regex to find prices in various formats
    const pricePatterns = [
      /€\s*(\d+(?:\.\d{2})?)/g,          // €123.45
      /(\d+(?:\.\d{2})?)\s*€/g,          // 123.45€
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*€/g, // 1,234.56€
      /€\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, // €1,234.56
    ];

    const prices: number[] = [];
    
    for (const pattern of pricePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const priceStr = match[1].replace(/,/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0) {
          prices.push(price);
        }
      }
    }

    return [...new Set(prices)]; // Remove duplicates
  }

  adjustPrices(options: PriceAdjustmentOptions): void {
    if (!this.pdfDoc) {
      throw new Error('No PDF loaded');
    }

    const { percentage, roundToDecimals = 2 } = options;
    const multiplier = 1 + (percentage / 100);

    // This is a simplified implementation
    // In a real-world scenario, you'd need more sophisticated text replacement
    console.log(`Adjusting prices by ${percentage}% (multiplier: ${multiplier})`);
    
    // TODO: Implement actual price replacement in PDF
    // This requires more complex PDF manipulation
  }

  async manageBanner(options: BannerOptions): Promise<void> {
    if (!this.pdfDoc) {
      throw new Error('No PDF loaded');
    }

    const pages = this.pdfDoc.getPages();
    const firstPage = pages[0];

    if (options.removeExisting) {
      // TODO: Implement banner removal logic
      console.log('Removing existing banner...');
    }

    if (options.addNew) {
      const { imageBytes, position = { x: 400, y: 750 }, size = { width: 150, height: 50 } } = options.addNew;
      
      // Embed the image
      const image = await this.pdfDoc.embedPng(imageBytes);
      
      // Draw the image on the first page
      firstPage.drawImage(image, {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      });
    }
  }

  async addCompanyInfo(info: {
    name: string;
    vat: string;
    phone: string;
    area: string;
  }): Promise<void> {
    if (!this.pdfDoc) {
      throw new Error('No PDF loaded');
    }

    const pages = this.pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Add company information
    const fontSize = 10;
    const textColor = rgb(0, 0, 0);
    let yPosition = height - 100;

    if (info.name) {
      firstPage.drawText(`Εταιρεία: ${info.name}`, {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: textColor,
      });
      yPosition -= 15;
    }

    if (info.vat) {
      firstPage.drawText(`ΑΦΜ: ${info.vat}`, {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: textColor,
      });
      yPosition -= 15;
    }

    if (info.phone) {
      firstPage.drawText(`Τηλ: ${info.phone}`, {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: textColor,
      });
      yPosition -= 15;
    }

    if (info.area) {
      firstPage.drawText(`Περιοχή: ${info.area}`, {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: textColor,
      });
    }
  }

  async exportPDF(): Promise<Uint8Array> {
    if (!this.pdfDoc) {
      throw new Error('No PDF loaded');
    }

    return await this.pdfDoc.save();
  }

  async createQuotationFromFactory(
    factoryPdfBytes: Uint8Array,
    bannerImageBytes: Uint8Array,
    percentage: number
  ): Promise<Uint8Array> {
    await this.loadPDF(factoryPdfBytes);
    
    // Adjust prices
    this.adjustPrices({ percentage });
    
    // Replace banner
    await this.manageBanner({
      removeExisting: true,
      addNew: {
        imageBytes: bannerImageBytes,
      }
    });

    return await this.exportPDF();
  }
}

export const pdfProcessor = new PDFProcessor();