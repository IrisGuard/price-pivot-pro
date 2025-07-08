import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
}

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

    let url: string | null = null;
    let isCancelled = false;

    const processFile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Create blob URL for fallback
        url = URL.createObjectURL(pdfFile);
        setPdfUrl(url);
        
        // File size validation
        if (pdfFile.size > 50 * 1024 * 1024) { // 50MB
          setError('Αρχείο πολύ μεγάλο (>50MB)');
          setLoading(false);
          return;
        }
        
        // Load PDF with PDF.js
        const arrayBuffer = await pdfFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.93/cmaps/',
          cMapPacked: true,
        });
        
        // Add timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PDF loading timeout')), 15000)
        );
        
        const pdfDocument = await Promise.race([
          loadingTask.promise,
          timeoutPromise
        ]) as pdfjsLib.PDFDocumentProxy;
        
        if (!isCancelled) {
          setPdfDoc(pdfDocument);
          setLoading(false);
          console.log('PDF loaded successfully:', pdfDocument.numPages, 'pages');
        }
        
      } catch (error) {
        console.warn('PDF.js loading failed, will use fallback:', error);
        if (!isCancelled) {
          setError('PDF.js loading failed, using fallback viewer');
          setLoading(false);
          // Keep pdfUrl for fallback browser native viewer
        }
      }
    };

    processFile();
    
    return () => {
      isCancelled = true;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [pdfFile]);

  return { pdfDoc, loading, error, pdfUrl };
};