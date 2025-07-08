import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { FileUploadSection } from "@/components/supplier/FileUploadSection";
import { QuickModeSection } from "@/components/supplier/QuickModeSection";
import { EditorMode } from "@/components/supplier/EditorMode";
import { usePDFProcessor } from "@/hooks/usePDFProcessor";

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
          <FileUploadSection
            factoryFile={factoryFile}
            onFileChange={handleFactoryFileChange}
            onOpenEditor={handleOpenEditor}
          />

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
          <QuickModeSection
            percentage={percentage}
            onPercentageChange={setPercentage}
            onCreateQuotation={handleCreateQuotation}
            disabled={!factoryFile}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierTool;