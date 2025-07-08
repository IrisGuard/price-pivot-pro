import { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { toast } from '@/hooks/use-toast';

export interface BannerState {
  currentBanner: File | null;
  isProcessing: boolean;
  bannerPreview: string | null;
}

export const useBannerReplacement = () => {
  const [bannerState, setBannerState] = useState<BannerState>({
    currentBanner: null,
    isProcessing: false,
    bannerPreview: null
  });

  const loadBannerFile = useCallback((file: File) => {
    setBannerState(prev => ({ ...prev, currentBanner: file, isProcessing: true }));
    
    // Δημιουργία preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setBannerState(prev => ({
        ...prev,
        bannerPreview: e.target?.result as string,
        isProcessing: false
      }));
    };
    reader.readAsDataURL(file);

    toast({
      title: "Banner φορτώθηκε",
      description: `Προετοιμασία για αντικατάσταση: ${file.name}`,
    });
  }, []);

  const removeBanner = useCallback(() => {
    setBannerState({
      currentBanner: null,
      isProcessing: false,
      bannerPreview: null
    });

    toast({
      title: "Banner αφαιρέθηκε",
      description: "Θα χρησιμοποιηθεί το προεπιλεγμένο banner",
    });
  }, []);

  const applyBannerToPDF = useCallback(async (
    originalPdfBytes: Uint8Array, 
    bannerFile?: File
  ): Promise<Uint8Array> => {
    setBannerState(prev => ({ ...prev, isProcessing: true }));

    try {
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      
      // Αν υπάρχει banner για αντικατάσταση
      if (bannerFile || bannerState.currentBanner) {
        const fileToUse = bannerFile || bannerState.currentBanner!;
        const bannerBytes = new Uint8Array(await fileToUse.arrayBuffer());
        
        // Χρήση του υπάρχοντος PDFBannerProcessor
        const { PDFBannerProcessor } = await import('@/lib/pdf/pdfBannerProcessor');
        const bannerProcessor = new PDFBannerProcessor();
        await bannerProcessor.replaceBanner(pdfDoc, bannerBytes);
        
        toast({
          title: "Banner ενημερώθηκε",
          description: "Το νέο banner εφαρμόστηκε στο PDF",
        });
      } else {
        // Φόρτωση default EUROPLAST banner
        try {
          const response = await fetch('/europlast-banner.png');
          const defaultBannerBytes = new Uint8Array(await response.arrayBuffer());
          
          const { PDFBannerProcessor } = await import('@/lib/pdf/pdfBannerProcessor');
          const bannerProcessor = new PDFBannerProcessor();
          await bannerProcessor.replaceBanner(pdfDoc, defaultBannerBytes);
        } catch (error) {
          console.warn('Δεν βρέθηκε το προεπιλεγμένο banner:', error);
        }
      }

      return await pdfDoc.save();
    } catch (error) {
      console.error('Σφάλμα κατά την αντικατάσταση banner:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την αντικατάσταση του banner",
        variant: "destructive",
      });
      throw error;
    } finally {
      setBannerState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [bannerState.currentBanner]);

  return {
    bannerState,
    loadBannerFile,
    removeBanner,
    applyBannerToPDF
  };
};