import * as pdfjsLib from 'pdfjs-dist';

export const usePDFWorkerSetup = () => {
  const setupPDFWorker = () => {
    if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
      // Production-ready worker setup with environment detection
      const isProduction = import.meta.env.PROD;
      
      if (isProduction) {
        // Use CDN for production hosting stability
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.3.93/build/pdf.worker.min.js';
      } else {
        // Development: try local first, fallback to CDN
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
        } catch (error) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.3.93/build/pdf.worker.min.js';
        }
      }
    }
  };

  return { setupPDFWorker };
};