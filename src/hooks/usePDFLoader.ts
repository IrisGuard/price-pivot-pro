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
        
        const arrayBuffer = await pdfFile.arrayBuffer();
        
        // Enhanced loading with multiple retry strategies
        const loadWithRetry = async (attempt = 1): Promise<pdfjsLib.PDFDocumentProxy> => {
          try {
            loadingTask = pdfjsLib.getDocument({ 
              data: arrayBuffer,
              verbosity: pdfjsLib.VerbosityLevel.ERRORS,
              disableAutoFetch: false,
              disableStream: false,
              useSystemFonts: true,
              standardFontDataUrl: '/fonts/',
              useWorkerFetch: false
            });
            
            const doc = await loadingTask.promise;
            
            if (doc.numPages === 0) {
              throw new Error('PDF has no pages');
            }
            
            return doc;
          } catch (error) {
            if (attempt < 5) {
              // Wait and retry with different config
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              return loadWithRetry(attempt + 1);
            }
            throw error;
          }
        };
        
        const doc = await loadWithRetry();
        setPdfDoc(doc);
        setError(null);
      } catch (error) {
        console.warn('PDF loading failed:', error);
        setError(null); // Don't show error, just use fallback
        setPdfDoc(null);
      } finally {
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