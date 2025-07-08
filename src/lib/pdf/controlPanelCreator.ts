import { PDFDocument, PDFForm, rgb, StandardFonts } from 'pdf-lib';
import type { DetectedPrice } from './priceDetector';

export class ControlPanelCreator {
  async addControlPage(pdfDoc: PDFDocument, prices: DetectedPrice[]): Promise<void> {
    const controlPage = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = controlPage.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Title
    controlPage.drawText('🔧 ΠΑΝΕΛ ΕΛΕΓΧΟΥ ΠΡΟΣΦΟΡΑΣ', {
      x: width / 2 - 120,
      y: height - 100,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.7)
    });
    
    // Banner Control Section
    this.createBannerControlSection(controlPage, pdfDoc, width, height, boldFont);
    
    // Price Control Section
    this.createPriceControlSection(controlPage, pdfDoc, width, height, font, boldFont, prices);
    
    // Instructions
    this.createInstructionsSection(controlPage, width, height, font, boldFont);
    
    // Warning
    controlPage.drawText('⚠️ ΠΡΟΣΟΧΗ: Αυτό το έγγραφο περιέχει προστατευμένο περιεχόμενο', {
      x: 50,
      y: height - 650,
      size: 9,
      font: boldFont,
      color: rgb(0.8, 0.2, 0.2)
    });
  }

  private createBannerControlSection(controlPage: any, pdfDoc: PDFDocument, width: number, height: number, boldFont: any): void {
    const form = pdfDoc.getForm();
    
    controlPage.drawRectangle({
      x: 50,
      y: height - 250,
      width: width - 100,
      height: 80,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1
    });
    
    controlPage.drawText('1. ΑΛΛΑΓΗ BANNER/ΛΟΓΟΤΥΠΟΥ', {
      x: 70,
      y: height - 190,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    
    // Create interactive form fields for banner control
    
    // Banner change button
    const bannerButton = form.createButton('changeBannerBtn');
    
    // Banner remove button  
    const removeBannerButton = form.createButton('removeBannerBtn');
    
    // Visual button backgrounds
    controlPage.drawRectangle({
      x: 70,
      y: height - 230,
      width: 120,
      height: 25,
      color: rgb(0.2, 0.6, 1),
      borderColor: rgb(0.1, 0.4, 0.8),
      borderWidth: 1
    });
    
    controlPage.drawText('ΑΛΛΑΓΗ BANNER', {
      x: 85,
      y: height - 220,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1)
    });
    
    controlPage.drawRectangle({
      x: 200,
      y: height - 230,
      width: 120,
      height: 25,
      color: rgb(0.8, 0.3, 0.3),
      borderColor: rgb(0.6, 0.2, 0.2),
      borderWidth: 1
    });
    
    controlPage.drawText('ΑΦΑΙΡΕΣΗ BANNER', {
      x: 210,
      y: height - 220,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1)
    });
  }

  private createPriceControlSection(controlPage: any, pdfDoc: PDFDocument, width: number, height: number, font: any, boldFont: any, prices: DetectedPrice[]): void {
    const form = pdfDoc.getForm();
    
    controlPage.drawRectangle({
      x: 50,
      y: height - 380,
      width: width - 100,
      height: 100,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1
    });
    
    controlPage.drawText('2. ΑΛΛΑΓΗ ΤΙΜΩΝ ΜΕ ΠΟΣΟΣΤΟ', {
      x: 70,
      y: height - 320,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    
    controlPage.drawText(`Βρέθηκαν ${prices.length} τιμές στο έγγραφο`, {
      x: 70,
      y: height - 340,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3)
    });
    
    // Create interactive percentage input field
    const percentageField = form.createTextField('percentageInput');
    percentageField.setText('0');
    percentageField.addToPage(controlPage, {
      x: 70,
      y: height - 370,
      width: 80,
      height: 20
    });
    
    // Apply percentage button
    const applyButton = form.createButton('applyPercentageBtn');
    
    // Visual styling for input and button
    controlPage.drawRectangle({
      x: 70,
      y: height - 370,
      width: 80,
      height: 20,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1
    });
    
    controlPage.drawText('Ποσοστό (%)', {
      x: 160,
      y: height - 365,
      size: 10,
      font,
      color: rgb(0, 0, 0)
    });
    
    controlPage.drawRectangle({
      x: 280,
      y: height - 370,
      width: 100,
      height: 20,
      color: rgb(0.2, 0.8, 0.2),
      borderColor: rgb(0.1, 0.6, 0.1),
      borderWidth: 1
    });
    
    controlPage.drawText('ΕΦΑΡΜΟΓΗ', {
      x: 315,
      y: height - 365,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1)
    });
  }

  private createInstructionsSection(controlPage: any, width: number, height: number, font: any, boldFont: any): void {
    controlPage.drawText('ΟΔΗΓΙΕΣ ΧΡΗΣΗΣ:', {
      x: 50,
      y: height - 450,
      size: 12,
      font: boldFont,
      color: rgb(0.7, 0.2, 0.2)
    });
    
    const instructions = [
      '• Για αλλαγή banner: Πατήστε "ΑΛΛΑΓΗ BANNER" και επιλέξτε εικόνα',
      '• Για αφαίρεση banner: Πατήστε "ΑΦΑΙΡΕΣΗ BANNER"',
      '• Για αλλαγή τιμών: Εισάγετε ποσοστό (π.χ. +10, -15) και πατήστε "ΕΦΑΡΜΟΓΗ"',
      '• Το ποσοστό εφαρμόζεται σε όλες τις τιμές του εγγράφου',
      '• Μετά τις αλλαγές, χρησιμοποιήστε Αρχείο → Αποθήκευση ή Εκτύπωση'
    ];
    
    instructions.forEach((instruction, index) => {
      controlPage.drawText(instruction, {
        x: 50,
        y: height - 480 - (index * 20),
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2)
      });
    });
  }
}

export const controlPanelCreator = new ControlPanelCreator();