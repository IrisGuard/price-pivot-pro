import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { UniversalFileViewer } from "@/components/UniversalFileViewer";
import { EditorMode } from "@/components/supplier/EditorMode";
import { usePDFProcessor } from "@/hooks/usePDFProcessor";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

const SupplierTool = () => {
  const [factoryFile, setFactoryFile] = useState<File | null>(null);
  const [percentage, setPercentage] = useState<string>("");
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [detectedPrices, setDetectedPrices] = useState<PriceData[]>([]);
  const [currentPrices, setCurrentPrices] = useState<PriceData[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const { createInteractivePDF } = usePDFProcessor();

  const handleFactoryFileChange = (file: File | null) => {
    setFactoryFile(file);
    setShowEditor(false);
    setDetectedPrices([]);
    setCurrentPrices([]);
  };

  const handlePricesDetected = (prices: PriceData[]) => {
    setDetectedPrices(prices);
    setCurrentPrices(prices);
  };

  const handlePriceUpdate = (updatedPrices: PriceData[]) => {
    setCurrentPrices(updatedPrices);
  };

  const handleOpenEditor = () => {
    if (!factoryFile) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε αρχείο εργοστασίου πρώτα",
        variant: "destructive",
      });
      return;
    }
    setShowEditor(true);
  };

  const handleCreateQuotationFromEditor = async () => {
    if (!factoryFile) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε αρχείο εργοστασίου",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await createInteractivePDF({
        factoryFile,
        detectedPrices,
        currentPrices
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateQuotation = async () => {
    if (!factoryFile) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε αρχείο εργοστασίου",
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
      await createInteractivePDF({
        factoryFile,
        percentage: Number(percentage)
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (showEditor) {
    return (
      <EditorMode
        factoryFile={factoryFile}
        detectedPrices={detectedPrices}
        onPricesDetected={handlePricesDetected}
        onPriceUpdate={handlePriceUpdate}
        onExportPDF={handleCreateQuotationFromEditor}
        onBack={() => setShowEditor(false)}
        isProcessing={isProcessing}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!factoryFile ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
                <h1 className="text-2xl font-bold">PDF Processor</h1>
                <p className="text-muted-foreground">Επιλέξτε PDF ή RTF αρχείο</p>
                
                <input
                  type="file"
                  accept=".pdf,.rtf"
                  onChange={(e) => handleFactoryFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button className="w-full cursor-pointer" size="lg">
                    Επιλογή Αρχείου
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Full-Screen PDF Preview */}
          <div className="w-full">
            <div className="w-full min-h-screen">
              <UniversalFileViewer 
                file={factoryFile}
                onPricesDetected={handlePricesDetected}
              />
            </div>
          </div>

          {/* Control Panel - Fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
            <div className="max-w-6xl mx-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                
                {/* Banner Control */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Banner</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Αλλαγή
                    </Button>
                    <Button variant="outline" size="sm">
                      Αφαίρεση
                    </Button>
                  </div>
                </div>

                {/* Price Control */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ποσοστό Τιμών</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="+10 ή -15"
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                      className="w-20"
                    />
                    <Button variant="outline" size="sm">
                      Εφαρμογή
                    </Button>
                  </div>
                </div>

                {/* Export */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Τελικό PDF</Label>
                  <Button
                    onClick={handleCreateQuotation}
                    disabled={isProcessing}
                    className="w-full"
                    size="sm"
                  >
                    {isProcessing ? "Δημιουργία..." : "Κατέβασμα"}
                  </Button>
                </div>

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SupplierTool;