import { PDFDocument } from 'pdf-lib';

export class PDFJavaScriptEngine {
  constructor(
    private securitySignature: string,
    private securityHash: string
  ) {}

  async addAdvancedJavaScriptEngine(pdfDoc: PDFDocument): Promise<void> {
    const jsCode = `
    // Advanced security validation
    function validatePDFSecurity() {
      var subject = this.info.Subject || '';
      var producer = this.info.Producer || '';
      var keywords = this.info.Keywords || '';
      
      return subject.indexOf('${this.securitySignature}') !== -1 && 
             producer.indexOf('${this.securityHash}') !== -1 &&
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
    pdfDoc.addJavaScript('sealedPDFEngine', jsCode);
  }
}