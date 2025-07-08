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
}

export const usePDFProcessor = () => {
  const createInteractivePDF = useCallback(async (options: PDFProcessorOptions): Promise<void> => {
    const { factoryFile, percentage, detectedPrices = [], currentPrices = [] } = options;
    
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

      // Create sealed interactive PDF with embedded JavaScript and default EUROPLAST banner
      const sealedPdfBytes = await interactivePDFProcessor.createSealedQuotationPDF({
        factoryPdfBytes,
        percentage: finalPercentage,
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

  return { createInteractivePDF };
};