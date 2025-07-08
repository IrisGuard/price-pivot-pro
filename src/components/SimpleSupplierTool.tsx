import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { simplePDFProcessor } from "@/lib/pdf/simplePDFProcessor";
import { useRTFToPDFConverter } from "@/hooks/useRTFToPDFConverter";

export const SimpleSupplierTool = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { convertRTFToPDF } = useRTFToPDFConverter();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileType = file.name.toLowerCase();
      if (fileType.endsWith('.pdf') || fileType.endsWith('.rtf')) {
        setSelectedFile(file);
        toast({
          title: "Αρχείο επιλέχθηκε",
          description: `${file.name} είναι έτοιμο για επεξεργασία`,
        });
      } else {
        toast({
          title: "Μη υποστηριζόμενος τύπος αρχείου",
          description: "Παρακαλώ επιλέξτε PDF ή RTF αρχείο",
          variant: "destructive"
        });
      }
    }
  };

  const handleCreateInteractivePDF = async () => {
    if (!selectedFile) {
      toast({
        title: "Δεν έχει επιλεχθεί αρχείο",
        description: "Παρακαλώ επιλέξτε ένα PDF ή RTF αρχείο",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      toast({
        title: "🔧 ΔΗΜΙΟΥΡΓΙΑ ΔΙΑΔΡΑΣΤΙΚΟΥ PDF",
        description: "Προσθήκη πάνελ ελέγχου και διαδραστικών λειτουργιών...",
      });

      let pdfBytes: Uint8Array;
      
      // Convert RTF to PDF if needed
      if (selectedFile.name.endsWith('.rtf')) {
        pdfBytes = await convertRTFToPDF(selectedFile);
      } else {
        pdfBytes = new Uint8Array(await selectedFile.arrayBuffer());
      }

      // Process with simple PDF processor
      const interactivePdfBytes = await simplePDFProcessor.processFactoryPDF(pdfBytes);

      // Download the result
      const blob = new Blob([interactivePdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Διαδραστικό_${selectedFile.name.replace(/\.(rtf|pdf)$/i, '')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ ΔΙΑΔΡΑΣΤΙΚΟ PDF ΕΤΟΙΜΟ",
        description: "Το PDF περιέχει πάνελ ελέγχου στην τελευταία σελίδα για τον πελάτη",
      });

    } catch (error) {
      console.error('Error creating interactive PDF:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη δημιουργία του διαδραστικού PDF",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            🔧 EUROPLAST PDF PROCESSOR
          </h1>
          <p className="text-muted-foreground">
            Προσθέστε διαδραστικό πάνελ ελέγχου στις προσφορές σας
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Δημιουργία Διαδραστικού PDF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* File Upload */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Επιλέξτε το PDF ή RTF της προσφοράς σας
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Υποστηρίζονται μόνο PDF και RTF αρχεία
                </p>
                <input
                  type="file"
                  accept=".pdf,.rtf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer">
                    Επιλογή Αρχείου
                  </Button>
                </label>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}
            </div>

            {/* Process Button */}
            <Button
              onClick={handleCreateInteractivePDF}
              disabled={!selectedFile || isProcessing}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {isProcessing ? (
                "🔄 Δημιουργία διαδραστικού PDF..."
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  ΔΗΜΙΟΥΡΓΙΑ ΔΙΑΔΡΑΣΤΙΚΟΥ PDF
                </>
              )}
            </Button>

            {/* Info */}
            <div className="bg-primary/10 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Τι προστίθεται στο PDF:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Νέα σελίδα με πάνελ ελέγχου στο τέλος</li>
                <li>• Κουμπί "Αλλαγή Banner" για το λογότυπο</li>
                <li>• Κουμπί "Αλλαγή Ποσοστού" για τις τιμές</li>
                <li>• Προστασία περιεχομένου (μόνο τα κουμπιά λειτουργούν)</li>
                <li>• Οδηγίες χρήσης για τον πελάτη</li>
              </ul>
            </div>

            {/* Workflow */}
            <div className="bg-accent/10 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Πώς λειτουργεί:</h4>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. Επιλέγετε το PDF/RTF της προσφοράς σας</li>
                <li>2. Πατάτε "Δημιουργία Διαδραστικού PDF"</li>
                <li>3. Κατεβάζετε το νέο διαδραστικό PDF</li>
                <li>4. Στέλνετε το νέο PDF στον πελάτη</li>
                <li>5. Ο πελάτης χρησιμοποιεί το πάνελ ελέγχου στην τελευταία σελίδα</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};