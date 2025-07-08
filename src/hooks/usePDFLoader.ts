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
        
        const result = await withPerformanceTracking(
          operationId,
          pdfFile.size,
          async () => {
            const arrayBuffer = await pdfFile.arrayBuffer();
            
            // Enhanced loading with timeout and retry strategies
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
                
                // Add timeout support
                const timeoutPromise = new Promise<never>((_, reject) => {
                  setTimeout(() => reject(new Error('PDF loading timeout')), config.timeout);
                });
                
                const doc = await Promise.race([loadingTask.promise, timeoutPromise]);
                
                if (doc.numPages === 0) {
                  throw new Error('PDF has no pages');
                }
                
                return doc;
              } catch (error) {
                if (attempt < 3) {
                  // Wait and retry with different config
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                  return loadWithRetry(attempt + 1);
                }
                throw error;
              }
            };
            
            return await loadWithRetry();
          }
        );
        
        setPdfDoc(result);
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