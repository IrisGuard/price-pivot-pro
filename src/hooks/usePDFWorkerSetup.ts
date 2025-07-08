import * as pdfjsLib from 'pdfjs-dist';

// PRODUCTION PDF.js WORKER SETUP
export const usePDFWorkerSetup = () => {
  const setupPDFWorker = () => {
    // Use CDN worker for maximum compatibility
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.3.93/build/pdf.worker.min.js';
  };

  return { setupPDFWorker };
};