import { PDFDocument, rgb } from 'pdf-lib';

interface ExportOptions {
  removeControlPanels?: boolean;
  applyCustomerData?: boolean;
  customerData?: {
    name: string;
    profession: string;
    taxId: string;
    phone: string;
  };
}

export class CleanPDFExporter {
  async createCleanPDF(originalPdfBytes: Uint8Array, options: ExportOptions = {}): Promise<Uint8Array> {
    const { removeControlPanels = true, applyCustomerData = false, customerData } = options;
    
    try {
      // Load the original PDF
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      const pages = pdfDoc.getPages();
      
      if (removeControlPanels) {
        // Remove any control panel elements from pages
        pages.forEach((page, index) => {
          // For now, we'll assume control panels are the last page or specific marked sections
          // In a full implementation, this would identify and remove control panel content
        });
      }
      
      if (applyCustomerData && customerData) {
        // Apply customer data to PDF
        await this.applyCustomerDataToPDF(pdfDoc, customerData);
      }
      
      // Save and return clean PDF
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error creating clean PDF:', error);
      throw new Error('Failed to create clean PDF export');
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

  async downloadCleanPDF(pdfBytes: Uint8Array, filename: string = 'Προσφορά_Καθαρή.pdf'): Promise<void> {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const cleanPDFExporter = new CleanPDFExporter();