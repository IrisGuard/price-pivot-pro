import { PDFDocument, rgb } from 'pdf-lib';
import { PDFSecurityHandler, SecurityOptions } from './pdfSecurity';

interface ExportOptions {
  removeControlPanels?: boolean;
  applyCustomerData?: boolean;
  customerData?: {
    name: string;
    profession: string;
    taxId: string;
    phone: string;
  };
  security?: SecurityOptions;
  onProgress?: (progress: number, status: string) => void;
}

export class CleanPDFExporter {
  private securityHandler: PDFSecurityHandler;

  constructor() {
    this.securityHandler = new PDFSecurityHandler();
  }

  async createCleanPDF(originalPdfBytes: Uint8Array, options: ExportOptions = {}): Promise<Uint8Array> {
    const { 
      removeControlPanels = true, 
      applyCustomerData = false, 
      customerData, 
      security,
      onProgress 
    } = options;
    
    try {
      onProgress?.(10, 'Φόρτωση PDF...');
      
      // Load the original PDF
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      const pages = pdfDoc.getPages();
      
      onProgress?.(30, 'Επεξεργασία σελίδων...');
      
      if (removeControlPanels) {
        // Remove control panel (typically last page)
        if (pages.length > 1) {
          const lastPage = pages[pages.length - 1];
          // Check if last page contains control elements
          const lastPageText = await this.extractPageText(lastPage);
          if (lastPageText.includes('ΠΑΝΕΛ ΕΛΕΓΧΟΥ') || lastPageText.includes('CONTROL')) {
            pdfDoc.removePage(pages.length - 1);
          }
        }
      }
      
      onProgress?.(50, 'Εφαρμογή στοιχείων πελάτη...');
      
      if (applyCustomerData && customerData) {
        await this.applyCustomerDataToPDF(pdfDoc, customerData);
      }
      
      onProgress?.(70, 'Εφαρμογή ασφάλειας...');
      
      // Apply security features
      await this.securityHandler.addSecuritySignature(pdfDoc, security);
      
      onProgress?.(90, 'Δημιουργία τελικού αρχείου...');
      
      // Save and return clean PDF
      const finalBytes = await pdfDoc.save();
      
      onProgress?.(100, 'Ολοκληρώθηκε!');
      
      return finalBytes;
    } catch (error) {
      console.error('Error creating clean PDF:', error);
      throw new Error(`Σφάλμα κατά τη δημιουργία PDF: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`);
    }
  }

  private async extractPageText(page: any): Promise<string> {
    // Basic text extraction for control panel detection
    try {
      return page.doc?.context?.obj?.toString() || '';
    } catch {
      return '';
    }
  }

  private async applyCustomerDataToPDF(pdfDoc: PDFDocument, customerData: any): Promise<void> {
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Add customer data overlay (example implementation)
    const fontSize = 10;
    const startY = height - 50;
    
    if (customerData.name) {
      firstPage.drawText(`Πελάτης: ${customerData.name}`, {
        x: 50,
        y: startY,
        size: fontSize,
        color: rgb(0, 0, 0)
      });
    }
    
    if (customerData.taxId) {
      firstPage.drawText(`ΑΦΜ: ${customerData.taxId}`, {
        x: 50,
        y: startY - 15,
        size: fontSize,
        color: rgb(0, 0, 0)
      });
    }
    
    if (customerData.phone) {
      firstPage.drawText(`Τηλ: ${customerData.phone}`, {
        x: 50,
        y: startY - 30,
        size: fontSize,
        color: rgb(0, 0, 0)
      });
    }
  }

  async downloadCleanPDF(
    pdfBytes: Uint8Array, 
    filename: string = 'Προσφορά_Καθαρή.pdf',
    onProgress?: (progress: number, status: string) => void
  ): Promise<void> {
    try {
      onProgress?.(0, 'Προετοιμασία download...');
      
      // Validate PDF size
      const sizeKB = pdfBytes.length / 1024;
      if (sizeKB > 10240) { // 10MB limit
        throw new Error(`Το αρχείο είναι πολύ μεγάλο (${sizeKB.toFixed(1)}KB). Μέγιστο: 10MB`);
      }
      
      onProgress?.(50, 'Δημιουργία download link...');
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Generate filename with timestamp if not provided
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '');
      const finalFilename = filename.includes('Προσφορά') ? filename : `Προσφορά_${timestamp}.pdf`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      document.body.appendChild(link);
      
      onProgress?.(90, 'Έναρξη download...');
      
      link.click();
      document.body.removeChild(link);
      
      // Cleanup after delay to ensure download starts
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      onProgress?.(100, 'Download ολοκληρώθηκε!');
    } catch (error) {
      console.error('Download error:', error);
      throw new Error(`Σφάλμα download: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`);
    }
  }
}

export const cleanPDFExporter = new CleanPDFExporter();