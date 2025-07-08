import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { usePDFProcessor } from "@/hooks/usePDFProcessor";

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

export const useSupplierTool = () => {
  const [factoryFile, setFactoryFile] = useState<File | null>(null);
  const [percentage, setPercentage] = useState<string>("");
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [detectedPrices, setDetectedPrices] = useState<PriceData[]>([]);
  const [currentPrices, setCurrentPrices] = useState<PriceData[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const { createInteractivePDF } = usePDFProcessor();

  const handleFactoryFileChange = (file: File | null) => {
    if (!file) {
      setFactoryFile(null);
      return;
    }
    
    // Clear previous state
    setShowEditor(false);
    setDetectedPrices([]);
    setCurrentPrices([]);
    
    // Set the new file
    setFactoryFile(file);
    
    // Add toast notification for successful file load
    toast({
      title: "✅ Αρχείο φορτώθηκε επιτυχώς",
      description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
    });
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

  return {
    // State
    factoryFile,
    percentage,
    showEditor,
    detectedPrices,
    currentPrices,
    isProcessing,
    
    // State setters
    setPercentage,
    setShowEditor,
    
    // Handlers
    handleFactoryFileChange,
    handlePricesDetected,
    handlePriceUpdate,
    handleOpenEditor,
    handleCreateQuotationFromEditor,
    handleCreateQuotation,
  };
};