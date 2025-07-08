import { useState, useEffect } from 'react';

// Simplified PDF Loader - Browser Native Approach
export const usePDFLoader = (pdfFile: File | null) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
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

    let url: string | null = null;

    // Simplified approach - immediate URL creation for browser native display
    const processFile = () => {
      setLoading(true);
      setError(null);
      
      try {
        // Create blob URL for immediate display
        url = URL.createObjectURL(pdfFile);
        setPdfUrl(url);
        
        // Simple file size validation
        if (pdfFile.size > 50 * 1024 * 1024) { // 50MB
          setError('Αρχείο πολύ μεγάλο (>50MB)');
          return;
        }
        
        // For display purposes, we don't need PDF.js parsing
        // Just mark as "loaded" after a brief delay for UX
        setTimeout(() => {
          setPdfDoc({ loaded: true, url });
          setLoading(false);
        }, 500);
        
      } catch (error) {
        console.warn('File processing failed:', error);
        setError('Σφάλμα επεξεργασίας αρχείου');
        setLoading(false);
      }
    };

    processFile();
    
    return () => {
      // Cleanup blob URL
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [pdfFile]);

  return { pdfDoc, loading, error, pdfUrl };
};