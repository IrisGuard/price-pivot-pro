import { PDFDocument } from 'pdf-lib';

export class PDFSecurityHandler {
  private readonly SECURITY_SIGNATURE = 'SEALED_QUOTATION_PDF_v1.0_AUTHENTIC';
  private readonly SECURITY_HASH = 'SHA256_UNIQUE_IDENTIFIER_2024';

  getSecuritySignature(): string {
    return this.SECURITY_SIGNATURE;
  }

  getSecurityHash(): string {
    return this.SECURITY_HASH;
  }

  async addSecuritySignature(pdfDoc: PDFDocument): Promise<void> {
    // Add multiple security identifiers
    pdfDoc.setTitle('Προσφορά Δική Μου - Σφραγισμένη');
    pdfDoc.setSubject(this.SECURITY_SIGNATURE);
    pdfDoc.setCreator('Σύστημα Διαχείρισης Προσφορών - Authenticated');
    pdfDoc.setProducer(`InteractivePDFProcessor v1.0 - ${this.SECURITY_HASH}`);
    pdfDoc.setKeywords(['SEALED', 'INTERACTIVE', 'PROTECTED', 'QUOTATION']);
    
    // Add creation timestamp for additional security
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
  }
}