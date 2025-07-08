import * as pdfjsLib from 'pdfjs-dist';

export const usePDFWorkerSetup = () => {
  const setupPDFWorker = () => {
    if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
      // Production-ready worker setup with CORS-friendly sources
      const isProduction = import.meta.env.PROD;
      
      if (isProduction) {
        // Use jsdelivr CDN which has better CORS support than unpkg
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.93/build/pdf.worker.min.js';
      } else {
        // Development: use local worker first, then fallback to jsdelivr
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
        } catch (error) {
          console.warn('Local PDF worker failed, using CDN fallback');
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.93/build/pdf.worker.min.js';
        }
      }
      
      console.log('PDF.js worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    }
  };

  return { setupPDFWorker };
};