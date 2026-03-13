import { useCallback } from 'react';
import { toast } from "@/hooks/use-toast";

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

interface PDFProcessorOptions {
  factoryFile: File;
  percentage?: number;
  detectedPrices?: PriceData[];
  currentPrices?: PriceData[];
  bannerFile?: File | null;
  customerData?: {
    name: string;
    profession: string;
    taxId: string;
    phone: string;
  };
}

export const usePDFProcessor = () => {
  const createInteractivePDF = useCallback(async (options: PDFProcessorOptions): Promise<void> => {
    const { factoryFile, percentage, detectedPrices = [], currentPrices = [], bannerFile, customerData } = options;
    
    try {
      toast({
        title: "🔄 ΔΗΜΙΟΥΡΓΙΑ ΣΦΡΑΓΙΣΜΕΝΟΥ PDF",
        description: "Ενσωμάτωση JavaScript engine και δημιουργία εξουσιοδοτημένου PDF...",
      });

      // Import the advanced processor
      const { interactivePDFProcessor } = await import("@/lib/pdf/pdfProcessor");

      // Convert factory file to Uint8Array
      let factoryPdfBytes: Uint8Array;
      
      if (factoryFile.name.endsWith('.rtf')) {
        // Use RTF converter hook
        const { useRTFToPDFConverter } = await import('./useRTFToPDFConverter');
        const { convertRTFToPDF } = useRTFToPDFConverter();
        factoryPdfBytes = await convertRTFToPDF(factoryFile);
      } else {
        factoryPdfBytes = new Uint8Array(await factoryFile.arrayBuffer());
      }

      // Calculate percentage from detected vs current prices if not provided
      let finalPercentage = percentage ?? 0;
      
      if (!percentage && detectedPrices.length > 0 && currentPrices.length > 0) {
        const totalOriginal = detectedPrices.reduce((sum, price) => sum + price.value, 0);
        const totalCurrent = currentPrices.reduce((sum, price) => sum + price.value, 0);
        finalPercentage = totalOriginal > 0 ? ((totalCurrent - totalOriginal) / totalOriginal) * 100 : 0;
      }

      // Process banner if provided
      let bannerImageBytes: Uint8Array | undefined;
      if (bannerFile) {
        bannerImageBytes = new Uint8Array(await bannerFile.arrayBuffer());
      }

      // Create sealed interactive PDF with all parameters
      const sealedPdfBytes = await interactivePDFProcessor.createSealedQuotationPDF({
        factoryPdfBytes,
        percentage: finalPercentage,
        bannerImageBytes,
        customerData,
        detectedPrices
      });

      // Create download link with specific filename
      const blob = new Blob([sealedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
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
        description: `Το PDF (${(sealedPdfBytes.length / 1024).toFixed(1)} KB) περιέχει όλες τις λειτουργίες για τον πελάτη.`,
      });
    } catch (error) {
      console.error('Error creating interactive PDF:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη δημιουργία του PDF",
        variant: "destructive",
      });
      throw error;
    }
  }, []);

  const createCleanPDF = useCallback(async (options: PDFProcessorOptions): Promise<void> => {
    const { factoryFile, percentage, detectedPrices = [], currentPrices = [], bannerFile, customerData } = options;
    
    try {
      toast({
        title: "🔄 ΔΗΜΙΟΥΡΓΙΑ ΚΑΘΑΡΟΥ PDF",
        description: "Δημιουργία επαγγελματικής προσφοράς χωρίς control elements...",
      });

      // Import the advanced processor
      const { interactivePDFProcessor } = await import("@/lib/pdf/pdfProcessor");

      // Convert factory file to Uint8Array
      let factoryPdfBytes: Uint8Array;
      
      if (factoryFile.name.endsWith('.rtf')) {
        // Use RTF converter hook
        const { useRTFToPDFConverter } = await import('./useRTFToPDFConverter');
        const { convertRTFToPDF } = useRTFToPDFConverter();
        factoryPdfBytes = await convertRTFToPDF(factoryFile);
      } else {
        factoryPdfBytes = new Uint8Array(await factoryFile.arrayBuffer());
      }

      // Calculate percentage from detected vs current prices if not provided
      let finalPercentage = percentage ?? 0;
      
      if (!percentage && detectedPrices.length > 0 && currentPrices.length > 0) {
        const totalOriginal = detectedPrices.reduce((sum, price) => sum + price.value, 0);
        const totalCurrent = currentPrices.reduce((sum, price) => sum + price.value, 0);
        finalPercentage = totalOriginal > 0 ? ((totalCurrent - totalOriginal) / totalOriginal) * 100 : 0;
      }

      // Process banner if provided
      let bannerImageBytes: Uint8Array | undefined;
      if (bannerFile) {
        bannerImageBytes = new Uint8Array(await bannerFile.arrayBuffer());
      }

      // Create clean PDF without control panel
      const cleanPdfBytes = await interactivePDFProcessor.createCleanQuotationPDF({
        factoryPdfBytes,
        percentage: finalPercentage,
        bannerImageBytes,
        customerData,
        detectedPrices
      });

      // Create download link with specific filename
      const blob = new Blob([cleanPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Προσφορά_Καθαρή.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ ΚΑΘΑΡΟ PDF ΕΤΟΙΜΟ",
        description: `Το επαγγελματικό PDF (${(cleanPdfBytes.length / 1024).toFixed(1)} KB) είναι έτοιμο για αποστολή.`,
      });
    } catch (error) {
      console.error('Error creating clean PDF:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη δημιουργία του καθαρού PDF",
        variant: "destructive",
      });
      throw error;
    }
  }, []);

  return { createInteractivePDF, createCleanPDF };
};