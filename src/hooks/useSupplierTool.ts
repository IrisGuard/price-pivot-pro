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
    console.log('🔄 FILE UPLOAD DEBUG: File selected:', file?.name, 'Size:', file?.size);
    if (!file) {
      console.log('❌ No file selected');
      return;
    }
    console.log('✅ Setting factory file state...');
    setFactoryFile(file);
    setShowEditor(false);
    setDetectedPrices([]);
    setCurrentPrices([]);
    console.log('✅ File state updated, should render preview now');
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