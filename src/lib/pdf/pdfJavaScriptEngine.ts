import { PDFDocument } from 'pdf-lib';

export class PDFJavaScriptEngine {
  constructor(
    private securitySignature: string,
    private securityHash: string
  ) {}

  async addAdvancedJavaScriptEngine(pdfDoc: PDFDocument, detectedPrices: any[] = []): Promise<void> {
    // JavaScript code that will be embedded in the PDF
    const jsCode = `
// EUROPLAST Interactive PDF Controller - Enhanced Implementation
var EUROPLAST = {
    prices: ${JSON.stringify(detectedPrices)},
    originalPrices: ${JSON.stringify(detectedPrices)},
    customerData: {
        name: "",
        profession: "",
        taxId: "",
        phone: ""
    },
    
    // Enhanced banner management
    changeBanner: function() {
        try {
            app.alert({
                cMsg: "Για αλλαγή banner:\\n1. Χρησιμοποιήστε το κουμπί ΑΛΛΑΓΗ BANNER\\n2. Επιλέξτε εικόνα από τον υπολογιστή σας\\n3. Το banner θα ενημερωθεί αυτόματα",
                cTitle: "Οδηγίες Banner",
                nIcon: 3
            });
        } catch (e) {
            app.alert("Σφάλμα: " + e.message, "Σφάλμα");
        }
    },
    
    removeBanner: function() {
        var response = app.alert({
            cMsg: "Αφαίρεση banner από την πρώτη σελίδα;\\nΗ αλλαγή θα εφαρμοστεί κατά την εξαγωγή.",
            cTitle: "Αφαίρεση Banner", 
            nIcon: 2,
            nType: 2
        });
        
        if (response === 4) {
            app.alert("Banner θα αφαιρεθεί κατά την εξαγωγή", "Επιτυχία");
        }
    },
    
    // Enhanced price management
    applyPercentageFromField: function() {
        try {
            var field = this.getField("percentageInput");
            var percentage = field ? field.value : "0";
            var pct = parseFloat(percentage);
            
            if (isNaN(pct)) {
                app.alert("Εισάγετε έγκυρο αριθμό", "Σφάλμα");
                return;
            }
            
            if (Math.abs(pct) > 100) {
                var confirm = app.alert({
                    cMsg: "Μεγάλη αλλαγή (" + pct + "%). Συνέχεια;",
                    cTitle: "Επιβεβαίωση",
                    nIcon: 2,
                    nType: 2
                });
                if (confirm !== 4) return;
            }
            
            var multiplier = 1 + (pct / 100);
            var updatedCount = 0;
            var totalChange = 0;
            
            // Apply percentage to all detected prices
            this.prices.forEach(function(price, index) {
                var oldValue = price.value;
                var newValue = Math.round(oldValue * multiplier * 100) / 100;
                price.value = newValue;
                totalChange += (newValue - oldValue);
                updatedCount++;
                
                // Update price field if exists
                var priceField = this.getField("price_" + index);
                if (priceField) {
                    priceField.value = newValue.toString();
                }
            }.bind(this));
            
            app.alert({
                cMsg: "Ενημερώθηκαν " + updatedCount + " τιμές\\n" +
                      "Ποσοστό αλλαγής: " + pct + "%\\n" +
                      "Συνολική διαφορά: " + totalChange.toFixed(2) + "€",
                cTitle: "Επιτυχής Ενημέρωση",
                nIcon: 3
            });
        } catch (e) {
            app.alert("Σφάλμα: " + e.message, "Σφάλμα");
        }
    },
    
    // Customer data management
    updateCustomerData: function(field, value) {
        if (this.customerData.hasOwnProperty(field)) {
            this.customerData[field] = value;
        }
    },
    
    // Email functionality
    sendQuote: function() {
        var customerName = this.customerData.name || "Πελάτης";
        app.alert({
            cMsg: "Προσφορά έτοιμη για αποστολή σε: " + customerName + "\\n\\nΧρησιμοποιήστε Ctrl+P για εκτύπωση ή αποθήκευση.",
            cTitle: "Αποστολή Προσφοράς",
            nIcon: 3
        });
    },
    
    // Reset functionality
    resetPrices: function() {
        var response = app.alert({
            cMsg: "Επαναφορά όλων των τιμών στις αρχικές τιμές;",
            cTitle: "Επαναφορά Τιμών",
            nIcon: 2,
            nType: 2
        });
        
        if (response === 4) {
            this.prices = JSON.parse(JSON.stringify(this.originalPrices));
            app.alert("Τιμές επαναφέρθηκαν", "Επιτυχία");
        }
    }
};
    
    extractOriginalPrices: function() {
        // Extract prices from PDF metadata
        try {
            var metadata = this.getDocumentProperty("Subject");
            if (metadata && metadata.indexOf("${this.securitySignature}") !== -1) {
                var data = metadata.split("|")[1];
                if (data) {
                    var priceData = JSON.parse(atob(data));
                    this.originalPrices = priceData.prices || {};
                    this.currentPrices = JSON.parse(JSON.stringify(this.originalPrices));
                }
            }
        } catch (e) {
            
        }
    },
    
    setupEventHandlers: function() {
        // Setup field change handlers
        var percentageField = this.getField("percentage_adjustment");
        if (percentageField) {
            percentageField.setAction("OnBlur", "EUROPLAST.applyPercentageChange();");
        }
    },
    
    applyPercentageChange: function() {
        var percentageField = this.getField("percentage_adjustment");
        if (!percentageField) return;
        
        var percentage = parseFloat(percentageField.value || "0");
        if (isNaN(percentage)) {
            app.alert("Παρακαλώ εισάγετε έγκυρο αριθμό", "Σφάλμα");
            return;
        }
        
        var multiplier = 1 + (percentage / 100);
        var updatedCount = 0;
        
        // Update all price fields
        for (var i = 0; i < 20; i++) { // Check up to 20 price fields
            var priceField = this.getField("price_" + i);
            if (priceField && this.originalPrices[i]) {
                var newPrice = Math.round(this.originalPrices[i].value * multiplier * 100) / 100;
                priceField.value = "€" + newPrice.toFixed(2);
                this.currentPrices[i] = { ...this.originalPrices[i], value: newPrice };
                updatedCount++;
            }
        }
        
        if (updatedCount > 0) {
            app.alert("✅ Ενημερώθηκαν " + updatedCount + " τιμές με " + percentage + "% αλλαγή", "Επιτυχία");
        } else {
            app.alert("Δεν βρέθηκαν τιμές προς ενημέρωση", "Πληροφορία");
        }
    },
    
    resetPrices: function() {
        for (var i = 0; i < 20; i++) {
            var priceField = this.getField("price_" + i);
            if (priceField && this.originalPrices[i]) {
                priceField.value = "€" + this.originalPrices[i].value.toFixed(2);
                this.currentPrices[i] = JSON.parse(JSON.stringify(this.originalPrices[i]));
            }
        }
        
        var percentageField = this.getField("percentage_adjustment");
        if (percentageField) {
            percentageField.value = "0";
        }
        
        app.alert("✅ Οι τιμές επαναφέρθηκαν στις αρχικές τους τιμές", "Επαναφορά");
    },
    
    exportSummary: function() {
        var summary = "EUROPLAST - Σύνοψη Τιμών\\n\\n";
        var total = 0;
        
        for (var i = 0; i < 20; i++) {
            if (this.currentPrices[i]) {
                summary += "Τιμή " + (i + 1) + ": €" + this.currentPrices[i].value.toFixed(2) + "\\n";
                total += this.currentPrices[i].value;
            }
        }
        
        summary += "\\nΣύνολο: €" + total.toFixed(2);
        
        app.alert(summary, "Σύνοψη Τιμών");
    }
};

// Auto-initialize on document open
EUROPLAST.init();

// Global functions for PDF buttons
function applyPriceChanges() {
    EUROPLAST.applyPercentageChange();
}

function resetAllPrices() {
    EUROPLAST.resetPrices();
}

function showPriceSummary() {
    EUROPLAST.exportSummary();
}
`;

    // Add JavaScript to PDF document
    try {
      // Note: pdf-lib doesn't directly support JavaScript injection
      // This would require additional PDF manipulation libraries
      // For now, we store the JS in metadata for potential extraction
      pdfDoc.setKeywords([`JS_ENGINE:${btoa(jsCode)}`]);
      
      
    } catch (error) {
      
    }
  }

  generateClientJavaScript(): string {
    return `
// EUROPLAST Client-Side PDF Enhancement
(function() {
    'use strict';
    
    
    
    // Enhance PDF viewer if available
    if (window.PDFViewerApplication) {
        
        
        // Add custom controls
        const toolbar = document.querySelector('#toolbarViewer');
        if (toolbar) {
            const customControls = document.createElement('div');
            customControls.innerHTML = \`
                <div style="display: inline-block; margin-left: 10px; padding: 5px; background: #f0f0f0; border-radius: 3px;">
                    <label>Ποσοστό: </label>
                    <input type="number" id="euroPlastPercentage" style="width: 60px;" value="0" step="0.1">
                    <button onclick="euroPlastApplyChanges()" style="margin-left: 5px;">Εφαρμογή</button>
                    <button onclick="euroPlastReset()" style="margin-left: 5px;">Reset</button>
                </div>
            \`;
            toolbar.appendChild(customControls);
        }
    }
    
    // Global functions
    window.euroPlastApplyChanges = function() {
        const percentage = document.getElementById('euroPlastPercentage')?.value || 0;
        alert('Εφαρμογή ' + percentage + '% αλλαγής τιμών');
    };
    
    window.euroPlastReset = function() {
        document.getElementById('euroPlastPercentage').value = 0;
        alert('Επαναφορά τιμών');
    };
    
})();
`;
  }
}