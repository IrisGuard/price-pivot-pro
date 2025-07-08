import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with local fallback
if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
}

export const useSimplePDFLoader = (file: File | null) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPdfDoc(null);
      setError(null);
      return;
    }

    let isCancelled = false;

    const loadPDF = async () => {
      setLoading(true);
      setError(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          verbosity: pdfjsLib.VerbosityLevel.ERRORS
        });
        
        const doc = await loadingTask.promise;
        
        if (!isCancelled) {
          if (doc.numPages === 0) {
            setError('Το PDF δεν περιέχει σελίδες');
          } else {
            setPdfDoc(doc);
            setError(null);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError('Αδυναμία φόρτωσης PDF αρχείου');
          setPdfDoc(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  return { pdfDoc, loading, error };
};