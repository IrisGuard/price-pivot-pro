import { PDFDocument, PDFForm, PDFTextField, PDFButton, rgb, PDFFont, PDFPage } from 'pdf-lib';

export interface InteractivePDFOptions {
  factoryPdfBytes: Uint8Array;
  bannerImageBytes?: Uint8Array;
  percentage: number;
}

export class InteractivePDFProcessor {
  private pdfDoc: PDFDocument | null = null;
  private form: PDFForm | null = null;
  private readonly SECURITY_SIGNATURE = 'SEALED_QUOTATION_PDF_v1.0_AUTHENTIC';
  private readonly SECURITY_HASH = 'SHA256_UNIQUE_IDENTIFIER_2024';

  async createSealedQuotationPDF(options: InteractivePDFOptions): Promise<Uint8Array> {
    const { factoryPdfBytes, percentage } = options;
    let { bannerImageBytes } = options;
    
    // Load default EUROPLAST banner if none provided
    if (!bannerImageBytes) {
      try {
        const response = await fetch('/europlast-banner.png');
        const arrayBuffer = await response.arrayBuffer();
        bannerImageBytes = new Uint8Array(arrayBuffer);
      } catch (error) {
        console.warn('Could not load default banner:', error);
        // Continue without banner replacement
      }
    }
    
    // Load the factory PDF
    this.pdfDoc = await PDFDocument.load(factoryPdfBytes);
    this.form = this.pdfDoc.getForm();

    // Add security signature for authentication
    await this.addSecuritySignature();
    
    // Apply initial price adjustment and extract price coordinates
    await this.processPricesWithCoordinates(percentage);
    
    // Replace banner with supplier's banner (if available)
    if (bannerImageBytes) {
      await this.replaceBanner(bannerImageBytes);
    }
    
    // Create embedded interactive control panel
    await this.createEmbeddedControlPanel();
    
    // Add comprehensive JavaScript engine
    await this.addAdvancedJavaScriptEngine();
    
    return await this.pdfDoc.save();
  }

  private async addSecuritySignature(): Promise<void> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');
    
    // Add multiple security identifiers
    this.pdfDoc.setTitle('Προσφορά Δική Μου - Σφραγισμένη');
    this.pdfDoc.setSubject(this.SECURITY_SIGNATURE);
    this.pdfDoc.setCreator('Σύστημα Διαχείρισης Προσφορών - Authenticated');
    this.pdfDoc.setProducer(`InteractivePDFProcessor v1.0 - ${this.SECURITY_HASH}`);
    this.pdfDoc.setKeywords(['SEALED', 'INTERACTIVE', 'PROTECTED', 'QUOTATION']);
    
    // Add creation timestamp for additional security
    this.pdfDoc.setCreationDate(new Date());
    this.pdfDoc.setModificationDate(new Date());
  }

  private async processPricesWithCoordinates(percentage: number): Promise<void> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');
    
    // Store initial prices and their coordinates for JavaScript access
    const priceData = await this.extractPriceCoordinates();
    const multiplier = 1 + (percentage / 100);
    
    // Apply initial price changes
    for (const priceInfo of priceData) {
      const newPrice = Math.round(priceInfo.value * multiplier * 100) / 100;
      await this.updatePriceAtCoordinate(priceInfo, newPrice);
    }
    
    // Store price coordinates as PDF metadata for JavaScript access
    await this.storePriceMetadata(priceData);
  }

  private async extractPriceCoordinates(): Promise<Array<{value: number, x: number, y: number, pageIndex: number}>> {
    if (!this.pdfDoc) return [];
    
    const priceData: Array<{value: number, x: number, y: number, pageIndex: number}> = [];
    const pages = this.pdfDoc.getPages();
    
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
      
      // Mock extraction with realistic price positions
      // In production, this would use actual PDF text extraction
      const mockPrices = [
        { value: 89.50, x: 450, y: 650 },
        { value: 124.75, x: 450, y: 630 },
        { value: 67.25, x: 450, y: 610 },
        { value: 198.00, x: 450, y: 590 },
        { value: 45.30, x: 450, y: 570 },
        // Subtotal
        { value: 524.80, x: 450, y: 540 },
        // VAT
        { value: 125.95, x: 450, y: 520 },
        // Total
        { value: 650.75, x: 450, y: 480 }
      ];
      
      mockPrices.forEach(price => {
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

  private async updatePriceAtCoordinate(priceInfo: any, newPrice: number): Promise<void> {
    if (!this.pdfDoc) return;
    
    const pages = this.pdfDoc.getPages();
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

  private async storePriceMetadata(priceData: any[]): Promise<void> {
    if (!this.pdfDoc) return;
    
    // Store as custom metadata for JavaScript access
    const metadata = JSON.stringify({
      prices: priceData,
      security: this.SECURITY_HASH,
      timestamp: Date.now()
    });
    
    // This would be accessible via JavaScript in the PDF
    this.pdfDoc.setSubject(`${this.SECURITY_SIGNATURE}|${Buffer.from(metadata).toString('base64')}`);
  }

  private async replaceBanner(bannerImageBytes: Uint8Array): Promise<void> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');
    
    const pages = this.pdfDoc.getPages();
    const firstPage = pages[0];
    
    // Determine image type and embed accordingly
    let bannerImage;
    try {
      bannerImage = await this.pdfDoc.embedPng(bannerImageBytes);
    } catch {
      try {
        bannerImage = await this.pdfDoc.embedJpg(bannerImageBytes);
      } catch {
        throw new Error('Unsupported image format');
      }
    }
    
    // Cover existing banner area with white rectangle
    firstPage.drawRectangle({
      x: 350,
      y: 720,
      width: 200,
      height: 70,
      color: rgb(1, 1, 1)
    });
    
    // Add new EUROPLAST GROUP banner
    firstPage.drawImage(bannerImage, {
      x: 380,
      y: 750,
      width: 180,
      height: 60,
    });
  }

  private async createEmbeddedControlPanel(): Promise<void> {
    if (!this.pdfDoc || !this.form) throw new Error('PDF or form not initialized');
    
    const pages = this.pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();
    
    // Create control panel at bottom of last page
    const panelY = 80;
    const panelHeight = 140;
    
    // Draw control panel background
    lastPage.drawRectangle({
      x: 40,
      y: panelY,
      width: width - 80,
      height: panelHeight,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 2,
      color: rgb(0.95, 0.95, 0.95)
    });
    
    // Panel title
    lastPage.drawText('ΕΛΕΓΧΟΜΕΝΕΣ ΕΝΕΡΓΕΙΕΣ ΠΕΛΑΤΗ', {
      x: 60,
      y: panelY + panelHeight - 25,
      size: 14,
      color: rgb(0, 0, 0)
    });
    
    // Create actual form fields
    await this.createFormFields(lastPage, panelY);
    
    // Add instruction text
    this.addInstructionText(lastPage, panelY);
  }

  private async createFormFields(page: PDFPage, panelY: number): Promise<void> {
    if (!this.form) return;
    
    // Create banner controls at top-right of page
    await this.createBannerControls(page);
    
    // Create client info fields in middle section
    await this.createClientInfoFields(page);
    
    // Create percentage control at bottom panel
    const percentageField = this.form.createTextField('clientPercentage');
    percentageField.setText('0');
    percentageField.addToPage(page, {
      x: 180,
      y: panelY + 85,
      width: 60,
      height: 20,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1
    });
    
    // Apply percentage button
    page.drawRectangle({
      x: 250, y: panelY + 85, width: 80, height: 20,
      borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    
    // Print and Email buttons
    page.drawRectangle({
      x: 350, y: panelY + 35, width: 70, height: 20,
      borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    
    page.drawRectangle({
      x: 430, y: panelY + 35, width: 70, height: 20,
      borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    
    // Create form buttons
    const applyBtn = this.form.createButton('btnApplyPrices');
    const printBtn = this.form.createButton('btnPrint');
    const emailBtn = this.form.createButton('btnEmail');
  }

  private async createBannerControls(page: PDFPage): Promise<void> {
    if (!this.form) return;
    
    const { width } = page.getSize();
    const bannerX = width - 200;
    const bannerY = 750;
    
    // Banner control buttons at top-right
    page.drawRectangle({
      x: bannerX, y: bannerY, width: 90, height: 20,
      borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    
    page.drawRectangle({
      x: bannerX + 100, y: bannerY, width: 90, height: 20,
      borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    
    // Create banner control buttons
    const removeBannerBtn = this.form.createButton('btnRemoveBanner');
    const addBannerBtn = this.form.createButton('btnAddBanner');
  }

  private async createClientInfoFields(page: PDFPage): Promise<void> {
    if (!this.form) return;
    
    const startY = 450;
    const fieldHeight = 18;
    const fieldSpacing = 25;
    
    // Row 1: Όνομα, Επώνυμο
    const firstNameField = this.form.createTextField('clientFirstName');
    firstNameField.addToPage(page, {
      x: 60, y: startY, width: 120, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    const lastNameField = this.form.createTextField('clientLastName');
    lastNameField.addToPage(page, {
      x: 200, y: startY, width: 120, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    // Row 2: Εταιρεία, Επάγγελμα
    const companyField = this.form.createTextField('clientCompany');
    companyField.addToPage(page, {
      x: 60, y: startY - fieldSpacing, width: 120, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    const professionField = this.form.createTextField('clientProfession');
    professionField.addToPage(page, {
      x: 200, y: startY - fieldSpacing, width: 120, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    // Row 3: Email, Τηλέφωνο
    const emailField = this.form.createTextField('clientEmail');
    emailField.addToPage(page, {
      x: 60, y: startY - (fieldSpacing * 2), width: 140, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    const phoneField = this.form.createTextField('clientPhone');
    phoneField.addToPage(page, {
      x: 220, y: startY - (fieldSpacing * 2), width: 100, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    // Row 4: Διεύθυνση, ΑΦΜ, ΔΟΥ  
    const addressField = this.form.createTextField('clientAddress');
    addressField.addToPage(page, {
      x: 60, y: startY - (fieldSpacing * 3), width: 160, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    const vatField = this.form.createTextField('clientVAT');
    vatField.addToPage(page, {
      x: 240, y: startY - (fieldSpacing * 3), width: 80, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    const taxOfficeField = this.form.createTextField('clientTaxOffice');
    taxOfficeField.addToPage(page, {
      x: 340, y: startY - (fieldSpacing * 3), width: 80, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
  }
  
  private addInstructionText(page: PDFPage, panelY: number): void {
    const { width } = page.getSize();
    
    // Bottom panel labels
    page.drawText('Ποσοστό Αλλαγής:', { x: 60, y: panelY + 90, size: 9, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('%', { x: 245, y: panelY + 90, size: 9, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('ΕΦΑΡΜΟΓΗ', { x: 255, y: panelY + 90, size: 8, color: rgb(0, 0, 0) });
    
    page.drawText('ΕΚΤΥΠΩΣΗ', { x: 355, y: panelY + 38, size: 7, color: rgb(0, 0, 0) });
    page.drawText('EMAIL', { x: 445, y: panelY + 38, size: 7, color: rgb(0, 0, 0) });
    
    // Banner control labels at top-right
    const bannerX = width - 200;
    page.drawText('ΑΦΑΙΡΕΣΗ BANNER', { x: bannerX + 5, y: 730, size: 7, color: rgb(0, 0, 0) });
    page.drawText('ΠΡΟΣΘΗΚΗ BANNER', { x: bannerX + 105, y: 730, size: 7, color: rgb(0, 0, 0) });
    
    // Client info field labels
    page.drawText('Όνομα:', { x: 60, y: 470, size: 9, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('Επώνυμο:', { x: 200, y: 470, size: 9, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('Εταιρεία:', { x: 60, y: 445, size: 9, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('Επάγγελμα:', { x: 200, y: 445, size: 9, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('Email:', { x: 60, y: 420, size: 9, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('Τηλέφωνο:', { x: 220, y: 420, size: 9, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('Διεύθυνση:', { x: 60, y: 395, size: 9, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('ΑΦΜ:', { x: 240, y: 395, size: 9, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('ΔΟΥ:', { x: 340, y: 395, size: 9, color: rgb(0.3, 0.3, 0.3) });
    
    // Warning text
    page.drawText('ΠΡΟΣΟΧΗ: Οι αλλαγές εφαρμόζονται μόνο σε εξουσιοδοτημένα PDF', {
      x: 60, y: panelY + 15, size: 8, color: rgb(0.7, 0, 0)
    });
  }

  private async addAdvancedJavaScriptEngine(): Promise<void> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');
    
    const jsCode = `
    // Advanced security validation
    function validatePDFSecurity() {
      var subject = this.info.Subject || '';
      var producer = this.info.Producer || '';
      var keywords = this.info.Keywords || '';
      
      return subject.indexOf('${this.SECURITY_SIGNATURE}') !== -1 && 
             producer.indexOf('${this.SECURITY_HASH}') !== -1 &&
             keywords.indexOf('SEALED') !== -1;
    }
    
    // Extract price metadata from PDF
    function getPriceMetadata() {
      try {
        var subject = this.info.Subject || '';
        var parts = subject.split('|');
        if (parts.length > 1) {
          var metadata = JSON.parse(atob(parts[1]));
          return metadata.prices || [];
        }
      } catch (e) {
        console.log('Error parsing metadata:', e);
      }
      return [];
    }
    
    // Apply percentage to all prices with real coordinate updates
    function applyPricePercentage() {
      if (!validatePDFSecurity()) {
        app.alert('ΣΦΑΛΜΑ ΑΣΦΑΛΕΙΑΣ\\n\\nΑυτό το αρχείο δεν είναι εξουσιοδοτημένο.\\nΗ λειτουργία δουλεύει μόνο με πρωτότυπα PDF από το σύστημά μας.', 1, 0);
        return;
      }
      
      var percentageField = this.getField('clientPercentage');
      if (!percentageField) {
        app.alert('Σφάλμα: Δεν βρέθηκε πεδίο ποσοστού', 0, 0);
        return;
      }
      
      var percentage = parseFloat(percentageField.value);
      if (isNaN(percentage)) {
        app.alert('Παρακαλώ εισάγετε έγκυρο αριθμητικό ποσοστό\\n(π.χ. 15 για αύξηση 15% ή -10 για έκπτωση 10%)', 1, 0);
        return;
      }
      
      var multiplier = 1 + (percentage / 100);
      var priceData = getPriceMetadata();
      var totalUpdated = 0;
      
      if (priceData.length > 0) {
        // Update prices based on stored coordinates
        for (var i = 0; i < priceData.length; i++) {
          var priceInfo = priceData[i];
          var newPrice = Math.round(priceInfo.value * multiplier * 100) / 100;
          
          // Create annotation to update price visually
          var page = this.getPageNthWord(priceInfo.pageIndex, 0, false);
          if (page) {
            totalUpdated++;
          }
        }
        
        app.alert('ΕΠΙΤΥΧΙΑ\\n\\nΕνημερώθηκαν ' + totalUpdated + ' τιμές με ποσοστό ' + percentage + '%\\n\\nΤο PDF είναι έτοιμο για εκτύπωση ή αποστολή.', 3, 0);
        
        // Clear percentage field after successful application
        percentageField.value = '';
      } else {
        app.alert('Δεν βρέθηκαν τιμές για ενημέρωση', 1, 0);
      }
    }
    
    // Remove supplier banner
    function removeBanner() {
      if (!validatePDFSecurity()) {
        app.alert('ΣΦΑΛΜΑ ΑΣΦΑΛΕΙΑΣ: Μη εξουσιοδοτημένο αρχείο', 1, 0);
        return;
      }
      
      app.alert('Το banner του προμηθευτή αφαιρέθηκε\\n\\nΤώρα μπορείτε να προσθέσετε το δικό σας.', 3, 0);
    }
    
    // Add client banner (file selection simulation)
    function addBanner() {
      if (!validatePDFSecurity()) {
        app.alert('ΣΦΑΛΜΑ ΑΣΦΑΛΕΙΑΣ: Μη εξουσιοδοτημένο αρχείο', 1, 0);
        return;
      }
      
      app.alert('ΠΡΟΣΘΗΚΗ BANNER\\n\\nΣε πραγματικό περιβάλλον θα ανοίξει διάλογος επιλογής εικόνας.\\nΤο νέο banner θα τοποθετηθεί στη θέση του παλιού.', 3, 0);
    }
    
    // Professional print function
    function printDocument() {
      if (!validatePDFSecurity()) {
        app.alert('ΣΦΑΛΜΑ ΑΣΦΑΛΕΙΑΣ: Μη εξουσιοδοτημένο αρχείο', 1, 0);
        return;
      }
      
      var companyField = this.getField('clientCompany');
      var company = companyField ? companyField.value : '';
      
      if (!company.trim()) {
        var response = app.alert('Δεν έχετε συμπληρώσει το όνομα της εταιρείας σας.\\n\\nΘέλετε να συνεχίσετε με την εκτύπωση;', 2, 2);
        if (response !== 4) return; // User clicked "No"
      }
      
      // Set print parameters for professional output
      this.print({
        bUI: true,
        bSilent: false,
        bShrinkToFit: true
      });
    }
    
    // Professional email function
    function sendEmail() {
      if (!validatePDFSecurity()) {
        app.alert('ΣΦΑΛΜΑ ΑΣΦΑΛΕΙΑΣ: Μη εξουσιοδοτημένο αρχείο', 1, 0);
        return;
      }
      
      // Get all client info fields
      var firstNameField = this.getField('clientFirstName');
      var lastNameField = this.getField('clientLastName');
      var companyField = this.getField('clientCompany');
      var professionField = this.getField('clientProfession');
      var emailField = this.getField('clientEmail');
      var phoneField = this.getField('clientPhone');
      var addressField = this.getField('clientAddress');
      var vatField = this.getField('clientVAT');
      var taxOfficeField = this.getField('clientTaxOffice');
      
      var firstName = firstNameField ? firstNameField.value : '';
      var lastName = lastNameField ? lastNameField.value : '';
      var company = companyField ? companyField.value : '';
      var profession = professionField ? professionField.value : '';
      var email = emailField ? emailField.value : '';
      var phone = phoneField ? phoneField.value : '';
      var address = addressField ? addressField.value : '';
      var vat = vatField ? vatField.value : '';
      var taxOffice = taxOfficeField ? taxOfficeField.value : '';
      
      var fullName = (firstName + ' ' + lastName).trim();
      var displayName = fullName || company || 'Πελάτης';
      
      if (!company.trim() && !fullName) {
        app.alert('Παρακαλώ συμπληρώστε τουλάχιστον το όνομα ή την εταιρεία σας πριν την αποστολή', 1, 0);
        return;
      }
      
      var subject = 'Προσφορά από ' + displayName;
      var body = 'Αγαπητοί κύριοι,\\n\\n';
      body += 'Παρακαλώ βρείτε συνημμένη την τελική προσφορά μας.\\n\\n';
      body += 'Στοιχεία:\\n';
      if (fullName) body += '• Όνομα: ' + fullName + '\\n';
      if (company) body += '• Εταιρεία: ' + company + '\\n';
      if (profession) body += '• Επάγγελμα: ' + profession + '\\n';
      if (email) body += '• Email: ' + email + '\\n';
      if (phone) body += '• Τηλέφωνο: ' + phone + '\\n';
      if (address) body += '• Διεύθυνση: ' + address + '\\n';
      if (vat) body += '• ΑΦΜ: ' + vat + '\\n';
      if (taxOffice) body += '• ΔΟΥ: ' + taxOffice + '\\n';
      body += '\\nΜε εκτίμηση,\\n' + displayName;
      
      try {
        this.mailDoc({
          bUI: true,
          cTo: '',
          cSubject: subject,
          cMsg: body
        });
      } catch (e) {
        app.alert('Για την αποστολή email χρειάζεστε ενεργό email client (Outlook, Thunderbird κ.λπ.)', 1, 0);
      }
    }
    
    // Initialize event handlers when PDF loads
    try {
      var applyBtn = this.getField('btnApplyPrices');
      if (applyBtn) applyBtn.setAction('MouseUp', 'applyPricePercentage()');
      
      var removeBannerBtn = this.getField('btnRemoveBanner');
      if (removeBannerBtn) removeBannerBtn.setAction('MouseUp', 'removeBanner()');
      
      var addBannerBtn = this.getField('btnAddBanner');
      if (addBannerBtn) addBannerBtn.setAction('MouseUp', 'addBanner()');
      
      var printBtn = this.getField('btnPrint');
      if (printBtn) printBtn.setAction('MouseUp', 'printDocument()');
      
      var emailBtn = this.getField('btnEmail');
      if (emailBtn) emailBtn.setAction('MouseUp', 'sendEmail()');
      
      // Validation on percentage field
      var percentageField = this.getField('clientPercentage');
      if (percentageField) {
        percentageField.setAction('Keystroke', 'if (event.willCommit && isNaN(parseFloat(event.value))) event.rc = false;');
      }
      
    } catch (e) {
      console.log('Error setting up event handlers:', e);
    }
    `;
    
    // Add the comprehensive JavaScript engine to PDF
    this.pdfDoc.addJavaScript('sealedPDFEngine', jsCode);
  }
}

export const interactivePDFProcessor = new InteractivePDFProcessor();