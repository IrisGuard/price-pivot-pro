import { PDFDocument, PDFForm, PDFPage, rgb } from 'pdf-lib';

export class PDFFormCreator {
  async createEmbeddedControlPanel(pdfDoc: PDFDocument, form: PDFForm): Promise<void> {
    const pages = pdfDoc.getPages();
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
    await this.createFormFields(lastPage, panelY, form);
    
    // Add instruction text
    this.addInstructionText(lastPage, panelY);
  }

  private async createFormFields(page: PDFPage, panelY: number, form: PDFForm): Promise<void> {
    // Create banner controls at top-right of page
    await this.createBannerControls(page, form);
    
    // Create client info fields in middle section
    await this.createClientInfoFields(page, form);
    
    // Create percentage control at bottom panel
    const percentageField = form.createTextField('clientPercentage');
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
    const applyBtn = form.createButton('btnApplyPrices');
    const printBtn = form.createButton('btnPrint');
    const emailBtn = form.createButton('btnEmail');
  }

  private async createBannerControls(page: PDFPage, form: PDFForm): Promise<void> {
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
    const removeBannerBtn = form.createButton('btnRemoveBanner');
    const addBannerBtn = form.createButton('btnAddBanner');
  }

  private async createClientInfoFields(page: PDFPage, form: PDFForm): Promise<void> {
    const startY = 450;
    const fieldHeight = 18;
    const fieldSpacing = 25;
    
    // Row 1: Όνομα, Επώνυμο
    const firstNameField = form.createTextField('clientFirstName');
    firstNameField.addToPage(page, {
      x: 60, y: startY, width: 120, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    const lastNameField = form.createTextField('clientLastName');
    lastNameField.addToPage(page, {
      x: 200, y: startY, width: 120, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    // Row 2: Εταιρεία, Επάγγελμα
    const companyField = form.createTextField('clientCompany');
    companyField.addToPage(page, {
      x: 60, y: startY - fieldSpacing, width: 120, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    const professionField = form.createTextField('clientProfession');
    professionField.addToPage(page, {
      x: 200, y: startY - fieldSpacing, width: 120, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    // Row 3: Email, Τηλέφωνο
    const emailField = form.createTextField('clientEmail');
    emailField.addToPage(page, {
      x: 60, y: startY - (fieldSpacing * 2), width: 140, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    const phoneField = form.createTextField('clientPhone');
    phoneField.addToPage(page, {
      x: 220, y: startY - (fieldSpacing * 2), width: 100, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    // Row 4: Διεύθυνση, ΑΦΜ, ΔΟΥ  
    const addressField = form.createTextField('clientAddress');
    addressField.addToPage(page, {
      x: 60, y: startY - (fieldSpacing * 3), width: 160, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    const vatField = form.createTextField('clientVAT');
    vatField.addToPage(page, {
      x: 240, y: startY - (fieldSpacing * 3), width: 80, height: fieldHeight,
      borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1
    });
    
    const taxOfficeField = form.createTextField('clientTaxOffice');
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
}