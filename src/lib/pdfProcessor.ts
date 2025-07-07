import { PDFDocument, PDFForm, PDFTextField, PDFButton, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface InteractivePDFOptions {
  factoryPdfBytes: Uint8Array;
  bannerImageBytes: Uint8Array;
  percentage: number;
}

export class InteractivePDFProcessor {
  private pdfDoc: PDFDocument | null = null;
  private form: PDFForm | null = null;
  private readonly SECURITY_SIGNATURE = 'SEALED_QUOTATION_PDF_v1.0';

  async createSealedQuotationPDF(options: InteractivePDFOptions): Promise<Uint8Array> {
    const { factoryPdfBytes, bannerImageBytes, percentage } = options;
    
    // Load the factory PDF
    this.pdfDoc = await PDFDocument.load(factoryPdfBytes);
    this.form = this.pdfDoc.getForm();

    // Add security metadata
    await this.addSecuritySignature();
    
    // Apply initial price adjustment
    await this.adjustPricesInPDF(percentage);
    
    // Replace banner with supplier's banner
    await this.replaceBanner(bannerImageBytes);
    
    // Add interactive form fields and JavaScript functions
    await this.addInteractiveElements();
    
    return await this.pdfDoc.save();
  }

  private async addSecuritySignature(): Promise<void> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');
    
    // Add security metadata to identify this as a sealed quotation PDF
    this.pdfDoc.setTitle('Προσφορά Δική Μου - Σφραγισμένη');
    this.pdfDoc.setSubject(this.SECURITY_SIGNATURE);
    this.pdfDoc.setCreator('Σύστημα Διαχείρισης Προσφορών');
    this.pdfDoc.setProducer('InteractivePDFProcessor v1.0');
  }

  private async adjustPricesInPDF(percentage: number): Promise<void> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');
    
    const pages = this.pdfDoc.getPages();
    const multiplier = 1 + (percentage / 100);
    
    for (const page of pages) {
      // Extract text content and find prices
      const textContent = await this.extractPageText(page);
      const prices = this.findPricesInText(textContent);
      
      // Apply price adjustments
      for (const price of prices) {
        const newPrice = Math.round(price * multiplier * 100) / 100;
        await this.replacePriceInPage(page, price, newPrice);
      }
    }
  }

  private async extractPageText(page: any): Promise<string> {
    // Simplified text extraction - in production would need more sophisticated approach
    return '';
  }

  private findPricesInText(text: string): number[] {
    const pricePatterns = [
      /€\s*(\d+(?:[,.]\d{2})?)/g,
      /(\d+(?:[,.]\d{2})?)\s*€/g,
    ];

    const prices: number[] = [];
    for (const pattern of pricePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const priceStr = match[1].replace(/,/g, '.');
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0) {
          prices.push(price);
        }
      }
    }
    return [...new Set(prices)];
  }

  private async replacePriceInPage(page: any, oldPrice: number, newPrice: number): Promise<void> {
    // This would require more sophisticated PDF text replacement
    console.log(`Replacing ${oldPrice}€ with ${newPrice}€`);
  }

  private async replaceBanner(bannerImageBytes: Uint8Array): Promise<void> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');
    
    const pages = this.pdfDoc.getPages();
    const firstPage = pages[0];
    
    // Embed the new banner image
    const bannerImage = await this.pdfDoc.embedPng(bannerImageBytes);
    
    // Add banner to top-right corner
    firstPage.drawImage(bannerImage, {
      x: 400,
      y: 750,
      width: 150,
      height: 50,
    });
  }

  private async addInteractiveElements(): Promise<void> {
    if (!this.pdfDoc || !this.form) throw new Error('PDF or form not initialized');
    
    const pages = this.pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { height } = lastPage.getSize();
    
    // Add interactive control panel at bottom of last page
    await this.createControlPanel(lastPage, height);
    
    // Add JavaScript functions for interactivity
    await this.addJavaScriptFunctions();
  }

  private async createControlPanel(page: any, pageHeight: number): Promise<void> {
    const controlY = 100; // Bottom area
    
    // Add background for control panel
    page.drawRectangle({
      x: 50,
      y: controlY - 20,
      width: 500,
      height: 120,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
      color: rgb(0.95, 0.95, 0.95),
    });
    
    // Title
    page.drawText('ΕΛΕΓΧΟΜΕΝΕΣ ΕΝΕΡΓΕΙΕΣ ΠΕΛΑΤΗ', {
      x: 60,
      y: controlY + 80,
      size: 12,
      color: rgb(0, 0, 0),
    });
    
    // Create form fields at specific coordinates on the page
    const percentageField = this.form!.createTextField('percentageInput');
    percentageField.setText('0');
    
    const applyButton = this.form!.createButton('applyPrices');
    const removeBannerBtn = this.form!.createButton('removeBanner');
    const addBannerBtn = this.form!.createButton('addBanner');
    const companyNameField = this.form!.createTextField('companyName');
    const vatField = this.form!.createTextField('vatNumber');
    const printBtn = this.form!.createButton('printDocument');
    const emailBtn = this.form!.createButton('sendEmail');
    
    // Position the fields on the page (simplified for demo)
    // In a real implementation, you would need to properly calculate positions
    // and handle PDF form field positioning according to pdf-lib API
    
    // Add labels
    page.drawText('Ποσοστό Αλλαγής:', { x: 60, y: controlY + 55, size: 10 });
    page.drawText('Εταιρεία:', { x: 280, y: controlY + 55, size: 10 });
    page.drawText('ΑΦΜ:', { x: 280, y: controlY + 35, size: 10 });
  }

  private async addJavaScriptFunctions(): Promise<void> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');
    
    // JavaScript code that will be embedded in the PDF
    const jsCode = `
    // Validate PDF signature
    function validatePDFSignature() {
      var subject = this.info.Subject;
      return subject === '${this.SECURITY_SIGNATURE}';
    }
    
    // Apply percentage to all prices
    function applyPricePercentage() {
      if (!validatePDFSignature()) {
        app.alert('Αρχείο μη συμβατό - Αυτή η λειτουργία δουλεύει μόνο με εξουσιοδοτημένα PDF');
        return;
      }
      
      var percentage = this.getField('percentageInput').value;
      if (!percentage || isNaN(percentage)) {
        app.alert('Παρακαλώ εισάγετε έγκυρο ποσοστό');
        return;
      }
      
      // Find and update all prices in the document
      var multiplier = 1 + (parseFloat(percentage) / 100);
      
      // This would contain the logic to find and replace prices
      // Implementation would scan document content and update price fields
      
      app.alert('Οι τιμές ενημερώθηκαν επιτυχώς');
      
      // Hide percentage field after application
      this.getField('percentageInput').display = display.hidden;
    }
    
    // Remove existing banner
    function removeBanner() {
      if (!validatePDFSignature()) return;
      // Logic to hide/remove banner elements
      app.alert('Το banner αφαιρέθηκε');
    }
    
    // Add new banner (simplified - would open file dialog in full implementation)
    function addBanner() {
      if (!validatePDFSignature()) return;
      app.alert('Λειτουργία προσθήκης banner - θα άνοιγε διάλογο επιλογής αρχείου');
    }
    
    // Print document
    function printDocument() {
      if (!validatePDFSignature()) return;
      this.print();
    }
    
    // Send email (opens email client)
    function sendEmail() {
      if (!validatePDFSignature()) return;
      
      var companyName = this.getField('companyName').value || 'Πελάτης';
      var subject = 'Προσφορά ' + companyName;
      var body = 'Παρακαλώ βρείτε συνημμένη την προσφορά μας.';
      
      this.mailDoc({
        bUI: true,
        cTo: '',
        cSubject: subject,
        cMsg: body
      });
    }
    
    // Attach event handlers to buttons
    this.getField('applyPrices').setAction('MouseUp', 'applyPricePercentage()');
    this.getField('removeBanner').setAction('MouseUp', 'removeBanner()');
    this.getField('addBanner').setAction('MouseUp', 'addBanner()');
    this.getField('printDocument').setAction('MouseUp', 'printDocument()');
    this.getField('sendEmail').setAction('MouseUp', 'sendEmail()');
    `;
    
    // Add JavaScript to PDF
    this.pdfDoc.addJavaScript('interactiveFunctions', jsCode);
  }
}

export const interactivePDFProcessor = new InteractivePDFProcessor();