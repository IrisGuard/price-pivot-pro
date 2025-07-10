import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export interface SecurityOptions {
  password?: string;
  watermarkText?: string;
  watermarkOpacity?: number;
  preventPrinting?: boolean;
  preventCopying?: boolean;
}

export class PDFSecurityHandler {
  private securitySignature: string;
  private securityHash: string;

  constructor() {
    this.securitySignature = this.generateSecuritySignature();
    this.securityHash = this.generateSecurityHash();
  }

  private generateSecuritySignature(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `EUROPLAST_${timestamp}_${random}`.toUpperCase();
  }

  private generateSecurityHash(): string {
    return btoa(this.securitySignature + '_HASH').replace(/[^A-Za-z0-9]/g, '').substring(0, 16);
  }

  getSecuritySignature(): string {
    return this.securitySignature;
  }

  getSecurityHash(): string {
    return this.securityHash;
  }

  async addSecuritySignature(pdfDoc: PDFDocument, options: SecurityOptions = {}): Promise<void> {
    // Add security metadata to PDF
    pdfDoc.setProducer(`EUROPLAST PDF Generator - ${this.securitySignature}`);
    pdfDoc.setCreator('EUROPLAST Advanced PDF System');
    pdfDoc.setAuthor('EUROPLAST GROUP');
    
    // Store security signature in custom metadata
    pdfDoc.setTitle(`${this.securitySignature}_SEALED_QUOTATION`);

    // Apply password protection if provided
    if (options.password) {
      await this.addPasswordProtection(pdfDoc, options.password, options);
    }

    // Apply watermark if provided
    if (options.watermarkText) {
      await this.addWatermark(pdfDoc, options.watermarkText, options.watermarkOpacity || 0.1);
    }
  }

  private async addPasswordProtection(pdfDoc: PDFDocument, password: string, options: SecurityOptions): Promise<void> {
    // Note: pdf-lib doesn't support password protection directly
    // This would typically require a different library or server-side processing
    // For now, we'll add metadata indicating the document should be protected
    pdfDoc.setKeywords([`PROTECTED:${btoa(password)}`]);
    
    // Add protection metadata
    const protectionLevel = {
      printing: options.preventPrinting ? 'denied' : 'allowed',
      copying: options.preventCopying ? 'denied' : 'allowed',
      timestamp: Date.now()
    };
    
    pdfDoc.setSubject(`PROTECTION:${btoa(JSON.stringify(protectionLevel))}`);
  }

  private async addWatermark(pdfDoc: PDFDocument, text: string, opacity: number): Promise<void> {
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    pages.forEach(page => {
      const { width, height } = page.getSize();
      
      // Diagonal watermark across the page
      page.drawText(text, {
        x: width / 4,
        y: height / 2,
        size: 48,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity,
        rotate: degrees(30)
      });
      
      // Corner watermark
      page.drawText(`EUROPLAST - ${this.securitySignature.split('_')[1]}`, {
        x: 10,
        y: 10,
        size: 8,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: opacity * 2
      });
    });
  }

  validateSecurity(pdfSignature: string): boolean {
    return pdfSignature.startsWith('EUROPLAST_') && pdfSignature.includes('_');
  }
}