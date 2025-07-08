import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePDFWorkerSetup } from '@/hooks/usePDFWorkerSetup';

// Initialize PDF.js worker
const { setupPDFWorker } = usePDFWorkerSetup();
setupPDFWorker();

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
        
        loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: pdfjsLib.VerbosityLevel.ERRORS
        });
        
        const doc = await loadingTask.promise;
        
        if (doc.numPages === 0) {
          throw new Error('PDF has no pages');
        }
        
        setPdfDoc(doc);
        setError(null);
      } catch (error) {
        setError('Σφάλμα φόρτωσης PDF. Χρήση εναλλακτικής προβολής.');
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