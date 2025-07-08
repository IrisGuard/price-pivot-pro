import * as pdfjsLib from 'pdfjs-dist';

export const usePDFWorkerSetup = () => {
  const setupPDFWorker = () => {
    if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
      try {
        // Primary: CDN worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.3.93/build/pdf.worker.min.js';
      } catch (error) {
        try {
          // Fallback: Local worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.js',
            import.meta.url
          ).toString();
        } catch (fallbackError) {
          // Final fallback: Public folder
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
        }
      }
    }
  };

  return { setupPDFWorker };
};