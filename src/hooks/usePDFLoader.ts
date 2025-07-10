import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Worker is configured in main.tsx - no setup needed here

export const usePDFLoader = (pdfFile: File | null) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfFile) {
      setPdfUrl(null);
      setPdfDoc(null);
      setError(null);
      return;
    }

    let loadingTask: any = null;
    let url: string | null = null;

    const loadPDF = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Create blob URL for fallback display
        url = URL.createObjectURL(pdfFile);
        setPdfUrl(url);
        
        // Validate file size (max 30MB)
        if (pdfFile.size > 30 * 1024 * 1024) {
          throw new Error(`Αρχείο πολύ μεγάλο: ${Math.round(pdfFile.size / 1024 / 1024)}MB > 30MB`);
        }
        
        // Enhanced timeout - 25 seconds for complex PDFs
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('PDF φόρτωση timeout - χρήση εναλλακτικής προβολής')), 25000);
        });

        const pdfPromise = async () => {
          const arrayBuffer = await pdfFile.arrayBuffer();
          
          loadingTask = pdfjsLib.getDocument({ 
            data: arrayBuffer,
            verbosity: pdfjsLib.VerbosityLevel.ERRORS,
            disableAutoFetch: true,
            disableStream: true,
            useSystemFonts: true,
            useWorkerFetch: false,
            stopAtErrors: false,
            // Enhanced memory management for large files
            maxImageSize: 8388608, // 8MB max image size for better performance
            cMapPacked: true,
            standardFontDataUrl: undefined, // Reduce memory usage
            enableXfa: false, // Disable XFA forms for performance
            isOffscreenCanvasSupported: false // Reduce memory overhead
          });
          
          const doc = await loadingTask.promise;
          
          if (doc.numPages === 0) {
            throw new Error('PDF δεν έχει σελίδες');
          }
          
          return doc;
        };

        const result = await Promise.race([pdfPromise(), timeoutPromise]);
        
        setPdfDoc(result);
        setError(null);
      } catch (error) {
        console.error('❌ PDF loading failed:', error);
        const errorMsg = error instanceof Error ? error.message : 'PDF loading error';
        setError(errorMsg);
        setPdfDoc(null);
      } finally {
        console.log('🔄 PDF loading state reset');
        setLoading(false);
      }
    };

    loadPDF();
    
    return () => {
      // Cleanup
      if (loadingTask) {
        loadingTask.destroy();
      }
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [pdfFile]);

  return { pdfDoc, loading, error, pdfUrl };
};