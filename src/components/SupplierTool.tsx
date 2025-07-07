import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { FileUp, Eye } from "lucide-react";
import { PDFViewer } from "@/components/PDFViewer";
import { PDFEditingPanel } from "@/components/PDFEditingPanel";

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

const SupplierTool = () => {
  const [factoryPdf, setFactoryPdf] = useState<File | null>(null);
  const [percentage, setPercentage] = useState<string>("");
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [detectedPrices, setDetectedPrices] = useState<PriceData[]>([]);
  const [currentPrices, setCurrentPrices] = useState<PriceData[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFactoryPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setFactoryPdf(file);
      setShowEditor(false); // Reset editor when new file is selected
      setDetectedPrices([]);
      setCurrentPrices([]);
      toast({
        title: "PDF Εργοστασίου",
        description: `Επιλέχθηκε: ${file.name}`,
      });
    } else {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε έγκυρο PDF αρχείο",
        variant: "destructive",
      });
    }
  };

  const handlePricesDetected = (prices: PriceData[]) => {
    setDetectedPrices(prices);
    setCurrentPrices(prices);
  };

  const handlePriceUpdate = (updatedPrices: PriceData[]) => {
    setCurrentPrices(updatedPrices);
  };

  const handleOpenEditor = () => {
    if (!factoryPdf) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε PDF εργοστασίου πρώτα",
        variant: "destructive",
      });
      return;
    }
    setShowEditor(true);
  };


  const handleCreateQuotationFromEditor = async () => {
    if (!factoryPdf) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε PDF εργοστασίου",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      toast({
        title: "🔄 ΔΗΜΙΟΥΡΓΙΑ ΣΦΡΑΓΙΣΜΕΝΟΥ PDF",
        description: "Ενσωμάτωση JavaScript engine και δημιουργία εξουσιοδοτημένου PDF...",
      });

      // Import the advanced processor
      const { interactivePDFProcessor } = await import("@/lib/pdf/pdfProcessor");

      // Convert factory PDF to Uint8Array
      const factoryPdfBytes = new Uint8Array(await factoryPdf.arrayBuffer());

      // Calculate percentage from detected vs current prices
      const totalOriginal = detectedPrices.reduce((sum, price) => sum + price.value, 0);
      const totalCurrent = currentPrices.reduce((sum, price) => sum + price.value, 0);
      const calculatedPercentage = totalOriginal > 0 ? ((totalCurrent - totalOriginal) / totalOriginal) * 100 : 0;

      // Create sealed interactive PDF with embedded JavaScript and default EUROPLAST banner
      const sealedPdfBytes = await interactivePDFProcessor.createSealedQuotationPDF({
        factoryPdfBytes,
        percentage: calculatedPercentage,
      });

      // Create download link with specific filename
      const blob = new Blob([sealedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Προσφορά_Δική_Μου.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ ΣΦΡΑΓΙΣΜΕΝΟ PDF ΕΤΟΙΜΟ",
        description: "Το PDF περιέχει ενσωματωμένες λειτουργίες για τον πελάτη. Μόνο αυτό το αρχείο θα δουλεύει με τις διαδραστικές λειτουργίες.",
      });
    } catch (error) {
      console.error('Error creating interactive PDF:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη δημιουργία του PDF",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateQuotation = async () => {
    if (!factoryPdf) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε PDF εργοστασίου",
        variant: "destructive",
      });
      return;
    }

    if (!percentage || isNaN(Number(percentage))) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ εισάγετε έγκυρο ποσοστό",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "🔄 ΔΗΜΙΟΥΡΓΙΑ ΣΦΡΑΓΙΣΜΕΝΟΥ PDF",
        description: "Ενσωμάτωση JavaScript engine και δημιουργία εξουσιοδοτημένου PDF...",
      });

      // Import the advanced processor
      const { interactivePDFProcessor } = await import("@/lib/pdf/pdfProcessor");

      // Convert factory PDF to Uint8Array
      const factoryPdfBytes = new Uint8Array(await factoryPdf.arrayBuffer());

      // Create sealed interactive PDF with embedded JavaScript and default EUROPLAST banner
      const sealedPdfBytes = await interactivePDFProcessor.createSealedQuotationPDF({
        factoryPdfBytes,
        percentage: Number(percentage),
      });

      // Create download link with specific filename
      const blob = new Blob([sealedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Προσφορά_Δική_Μου.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ ΣΦΡΑΓΙΣΜΕΝΟ PDF ΕΤΟΙΜΟ",
        description: "Το PDF περιέχει ενσωματωμένες λειτουργίες για τον πελάτη. Μόνο αυτό το αρχείο θα δουλεύει με τις διαδραστικές λειτουργίες.",
      });
    } catch (error) {
      console.error('Error creating interactive PDF:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη δημιουργία του PDF",
        variant: "destructive",
      });
    }
  };

  if (showEditor) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">📝 PDF Editor - {factoryPdf?.name}</h1>
              <p className="text-sm text-muted-foreground">
                Επεξεργαστείτε το PDF σας σε πραγματικό χρόνο
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Επιστροφή
            </Button>
          </div>
        </div>

        {/* Editor Layout */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* PDF Viewer - Left Side */}
          <div className="flex-1 min-w-0">
            <PDFViewer 
              pdfFile={factoryPdf} 
              onPricesDetected={handlePricesDetected}
            />
          </div>

          {/* Editing Panel - Right Side */}
          <div className="w-80 flex-shrink-0">
            <PDFEditingPanel
              detectedPrices={detectedPrices}
              onPriceUpdate={handlePriceUpdate}
              onExportPDF={handleCreateQuotationFromEditor}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            🔒 Δημιουργία Σφραγισμένου PDF Προσφοράς
          </CardTitle>
          <CardDescription className="text-center text-sm">
            Δημιουργία προστατευμένου PDF προσφοράς με ενσωματωμένες λειτουργίες τιμολόγησης και παραμετροποίησης.<br/>
            <span className="text-destructive font-medium">⚠️ Το PDF δουλεύει αποκλειστικά με τις δικές σας προσφορές</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PDF Selection */}
          <div className="space-y-2">
            <Label htmlFor="factory-pdf" className="text-sm font-medium">
              Επιλογή αρχείου προσφοράς:
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="factory-pdf"
                type="file"
                accept=".pdf"
                onChange={handleFactoryPdfChange}
                className="flex-1"
              />
              <FileUp className="h-5 w-5 text-muted-foreground" />
            </div>
            {factoryPdf && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Επιλεγμένο: {factoryPdf.name}
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleOpenEditor}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Άνοιγμα PDF Editor
                </Button>
              </div>
            )}
          </div>

          {/* Default Banner Info */}
          <div className="space-y-2">
            <div className="bg-muted p-3 rounded-lg border">
              <p className="text-sm font-medium text-muted-foreground">
                📋 Banner Προεπιλογής: <span className="font-semibold text-foreground">EUROPLAST GROUP</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Το banner σας θα εφαρμοστεί αυτόματα σε κάθε PDF προσφοράς
              </p>
            </div>
          </div>

          {/* Quick Mode */}
          <div className="space-y-4 p-4 border rounded-lg">
            <Label className="text-sm font-medium">Γρήγορη Δημιουργία (χωρίς preview)</Label>
            
            <div className="space-y-2">
              <Label htmlFor="percentage" className="text-sm">
                Εισαγωγή ποσοστού αλλαγής τιμής:
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="percentage"
                  type="number"
                  placeholder="-15"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-24"
                  step="0.01"
                />
                <span className="text-sm font-medium">%</span>
                <span className="text-xs text-muted-foreground ml-2">
                  (Αρνητικό για έκπτωση, θετικό για αύξηση)
                </span>
              </div>
            </div>

            <Button
              onClick={handleCreateQuotation}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              🔒 ΔΗΜΙΟΥΡΓΙΑ ΣΦΡΑΓΙΣΜΕΝΟΥ PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierTool;