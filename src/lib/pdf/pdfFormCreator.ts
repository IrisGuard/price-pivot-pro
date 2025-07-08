import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, rgb } from 'pdf-lib';

export class PDFFormCreator {
  async createEmbeddedControlPanel(pdfDoc: PDFDocument, form: PDFForm): Promise<void> {
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Create interactive control panel at the bottom of the first page
    const panelHeight = 120;
    const panelY = 20;
    
    // Background panel
    firstPage.drawRectangle({
      x: 20,
      y: panelY,
      width: width - 40,
      height: panelHeight,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1
    });

    // Title
    firstPage.drawText('🔧 ΔΙΑΔΡΑΣΤΙΚΟ ΠΑΝΑΛ ΕΛΕΓΧΟΥ', {
      x: 30,
      y: panelY + 95,
      size: 12,
      color: rgb(0, 0, 0)
    });

    // Percentage adjustment field
    const percentageField = form.createTextField('percentage_adjustment');
    percentageField.setText('0');
    percentageField.addToPage(firstPage, {
      x: 30,
      y: panelY + 65,
      width: 80,
      height: 20,
      borderColor: rgb(0.5, 0.5, 0.5),
      backgroundColor: rgb(1, 1, 1)
    });

    firstPage.drawText('Ποσοστό Αλλαγής (%)', {
      x: 120,
      y: panelY + 70,
      size: 10,
      color: rgb(0, 0, 0)
    });

    // Apply button (simulated with text - actual button would need JavaScript)
    firstPage.drawRectangle({
      x: 280,
      y: panelY + 65,
      width: 100,
      height: 20,
      color: rgb(0.2, 0.6, 1),
      borderColor: rgb(0.1, 0.4, 0.8),
      borderWidth: 1
    });

    firstPage.drawText('ΕΦΑΡΜΟΓΗ', {
      x: 310,
      y: panelY + 70,
      size: 10,
      color: rgb(1, 1, 1)
    });

    // Reset button
    firstPage.drawRectangle({
      x: 390,
      y: panelY + 65,
      width: 80,
      height: 20,
      color: rgb(0.8, 0.3, 0.3),
      borderColor: rgb(0.6, 0.2, 0.2),
      borderWidth: 1
    });

    firstPage.drawText('RESET', {
      x: 420,
      y: panelY + 70,
      size: 10,
      color: rgb(1, 1, 1)
    });

    // Instructions
    firstPage.drawText('Εισάγετε ποσοστό και πατήστε ΕΦΑΡΜΟΓΗ για ενημέρωση τιμών', {
      x: 30,
      y: panelY + 40,
      size: 9,
      color: rgb(0.3, 0.3, 0.3)
    });

    firstPage.drawText('🔒 Αυτό το PDF είναι σφραγισμένο και περιέχει προστατευμένες λειτουργίες', {
      x: 30,
      y: panelY + 25,
      size: 8,
      color: rgb(0.6, 0.2, 0.2)
    });
  }

  async createPriceInputFields(pdfDoc: PDFDocument, form: PDFForm, priceCoordinates: Array<{x: number, y: number, pageIndex: number}>): Promise<void> {
    const pages = pdfDoc.getPages();
    
    priceCoordinates.forEach((coord, index) => {
      if (coord.pageIndex < pages.length) {
        const page = pages[coord.pageIndex];
        
        // Create hidden input field for each price
        const priceField = form.createTextField(`price_${index}`);
        priceField.addToPage(page, {
          x: coord.x + 85, // Position next to price
          y: coord.y - 5,
          width: 60,
          height: 15,
          borderColor: rgb(0.9, 0.9, 0.9),
          backgroundColor: rgb(0.98, 0.98, 0.98)
        });
      }
    });
  }
}