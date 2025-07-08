import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { getFileProcessingConfig } from '@/lib/config/environment';
import { performanceMonitor, withPerformanceTracking } from '@/lib/performance/monitor';

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
      
      const config = getFileProcessingConfig();
      const operationId = `pdf-load-${Date.now()}`;
      
      try {
        // Create blob URL for fallback display
        url = URL.createObjectURL(pdfFile);
        setPdfUrl(url);
        
        // Validate file size
        if (pdfFile.size > config.maxFileSize) {
          throw new Error(`File too large: ${Math.round(pdfFile.size / 1024 / 1024)}MB > ${Math.round(config.maxFileSize / 1024 / 1024)}MB`);
        }
        
        // Global 5-second timeout for PDF loading
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('PDF φόρτωση timeout μετά από 5 δευτερόλεπτα')), 5000);
        });

        const result = await Promise.race([
          withPerformanceTracking(
            operationId,
            pdfFile.size,
            async () => {
              const arrayBuffer = await pdfFile.arrayBuffer();
              
              loadingTask = pdfjsLib.getDocument({ 
                data: arrayBuffer,
                verbosity: pdfjsLib.VerbosityLevel.ERRORS,
                disableAutoFetch: false,
                disableStream: false,
                useSystemFonts: true,
                useWorkerFetch: false
              });
              
              const doc = await loadingTask.promise;
              
              if (doc.numPages === 0) {
                throw new Error('PDF has no pages');
              }
              
              return doc;
            }
          ),
          timeoutPromise
        ]);
        
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