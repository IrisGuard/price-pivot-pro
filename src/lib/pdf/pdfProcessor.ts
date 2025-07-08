import { PDFDocument, PDFForm, PDFImage, rgb } from 'pdf-lib';
import type { InteractivePDFOptions } from './types';

export class InteractivePDFProcessor {
  private pdfDoc: PDFDocument | null = null;
  private form: PDFForm | null = null;

  private async replaceBanner(pdfDoc: PDFDocument, bannerImageBytes: Uint8Array): Promise<void> {
    try {
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      // Clear existing banner area
      const bannerClearHeight = 150;
      firstPage.drawRectangle({
        x: 0,
        y: height - bannerClearHeight,
        width: width,
        height: bannerClearHeight,
        color: rgb(1, 1, 1)
      });
      
      // Determine image format and embed new banner
      let bannerImage: PDFImage;
      const imageHeader = Array.from(bannerImageBytes.slice(0, 4));
      
      if (imageHeader[0] === 0xFF && imageHeader[1] === 0xD8) {
        bannerImage = await pdfDoc.embedJpg(bannerImageBytes);
      } else if (imageHeader[0] === 0x89 && imageHeader[1] === 0x50) {
        bannerImage = await pdfDoc.embedPng(bannerImageBytes);
      } else {
        console.warn('Unsupported image format for banner');
        return;
      }
      
      // Place new banner
      const bannerWidth = width;
      const bannerHeight = Math.min(120, height * 0.15);
      const imageAspectRatio = bannerImage.width / bannerImage.height;
      let drawWidth = bannerWidth;
      let drawHeight = bannerWidth / imageAspectRatio;
      
      if (drawHeight > bannerHeight) {
        drawHeight = bannerHeight;
        drawWidth = drawHeight * imageAspectRatio;
      }
      
      const x = (width - drawWidth) / 2;
      const y = height - drawHeight - 20;
      
      firstPage.drawImage(bannerImage, {
        x, y, width: drawWidth, height: drawHeight,
      });
    } catch (error) {
      console.warn('Banner replacement failed:', error);
    }
  }

  private async addInteractiveControls(pdfDoc: PDFDocument): Promise<void> {
    try {
      const pages = pdfDoc.getPages();
      const controlPage = pdfDoc.addPage([595, 842]); // A4 size
      
      // Add control panel background
      controlPage.drawRectangle({
        x: 20,
        y: 20,
        width: 555,
        height: 802,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 2
      });
      
      // Add title
      controlPage.drawText('🔧 ΠΑΝΕΛ ΕΛΕΓΧΟΥ ΠΡΟΣΦΟΡΑΣ', {
        x: 50,
        y: 780,
        size: 20,
        color: rgb(0, 0, 0)
      });
      
      // Add instructions
      const instructions = [
        '💰 1. ΑΛΛΑΓΗ ΠΟΣΟΣΤΟΥ ΤΙΜΩΝ',
        '🖼️ 2. ΑΛΛΑΓΗ BANNER/ΛΟΓΟΤΥΠΟΥ', 
        '👤 3. ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ',
        '📄 4. ΕΞΑΓΩΓΗ ΤΕΛΙΚΟΥ PDF'
      ];
      
      instructions.forEach((instruction, index) => {
        controlPage.drawText(instruction, {
          x: 50,
          y: 720 - (index * 40),
          size: 14,
          color: rgb(0.2, 0.2, 0.2)
        });
      });
      
    } catch (error) {
      console.warn('Control panel creation failed:', error);
    }
  }

  private async applyPriceChanges(pdfDoc: PDFDocument, detectedPrices: any[], percentage: number): Promise<void> {
    try {
      const pages = pdfDoc.getPages();
      const multiplier = 1 + (percentage / 100);
      
      detectedPrices.forEach(price => {
        if (price.pageIndex < pages.length) {
          const page = pages[price.pageIndex];
          
          // Clear existing price area
          page.drawRectangle({
            x: price.x - 10,
            y: price.y - 5,
            width: 80,
            height: 15,
            color: rgb(1, 1, 1)
          });
          
          // Draw new price
          const newPrice = Math.round(price.value * multiplier * 100) / 100;
          page.drawText(`€${newPrice.toFixed(2)}`, {
            x: price.x,
            y: price.y,
            size: 11,
            color: rgb(0, 0, 0)
          });
        }
      });
    } catch (error) {
      console.warn('Price changes failed:', error);
    }
  }

  private async addCustomerData(pdfDoc: PDFDocument, customerData: any): Promise<void> {
    try {
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { height } = lastPage.getSize();
      
      // Add customer data at bottom of last page
      const dataText = [
        `Πελάτης: ${customerData.name || 'N/A'}`,
        `Επάγγελμα: ${customerData.profession || 'N/A'}`,
        `Α.Φ.Μ.: ${customerData.taxId || 'N/A'}`,
        `Τηλέφωνο: ${customerData.phone || 'N/A'}`
      ];
      
      dataText.forEach((text, index) => {
        lastPage.drawText(text, {
          x: 50,
          y: 100 - (index * 20),
          size: 10,
          color: rgb(0.3, 0.3, 0.3)
        });
      });
    } catch (error) {
      console.warn('Customer data addition failed:', error);
    }
  }

  async createSealedQuotationPDF(options: InteractivePDFOptions): Promise<Uint8Array> {
    const { factoryPdfBytes, percentage = 0, customerData, detectedPrices } = options;
    let { bannerImageBytes } = options;
    
    try {
      // Load default EUROPLAST banner if none provided
      if (!bannerImageBytes) {
        try {
          const response = await fetch('/europlast-banner.png');
          const arrayBuffer = await response.arrayBuffer();
          bannerImageBytes = new Uint8Array(arrayBuffer);
        } catch (error) {
          console.warn('Could not load default banner:', error);
        }
      }
      
      // Load the factory PDF
      this.pdfDoc = await PDFDocument.load(factoryPdfBytes);
      this.form = this.pdfDoc.getForm();

      // Replace banner with supplier's banner (if available)
      if (bannerImageBytes) {
        await this.replaceBanner(this.pdfDoc, bannerImageBytes);
      }
      
      // Apply price changes if detected prices exist
      if (detectedPrices && detectedPrices.length > 0 && percentage !== 0) {
        await this.applyPriceChanges(this.pdfDoc, detectedPrices, percentage);
      }
      
      // Add customer data if provided
      if (customerData) {
        await this.addCustomerData(this.pdfDoc, customerData);
      }
      
      // Add interactive control panel
      await this.addInteractiveControls(this.pdfDoc);
      
      const pdfBytes = await this.pdfDoc.save();
      console.log('✅ Sealed PDF created successfully:', pdfBytes.length, 'bytes');
      return pdfBytes;
      
    } catch (error) {
      console.error('❌ PDF Processing Error:', error);
      
      // Fallback: Return original PDF with minimal modifications
      const fallbackDoc = await PDFDocument.load(factoryPdfBytes);
      const fallbackBytes = await fallbackDoc.save();
      console.log('⚠️ Returning fallback PDF:', fallbackBytes.length, 'bytes');
      return fallbackBytes;
    }
  }
}

export const interactivePDFProcessor = new InteractivePDFProcessor();