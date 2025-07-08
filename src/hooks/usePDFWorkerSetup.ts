import * as pdfjsLib from 'pdfjs-dist';

export const usePDFWorkerSetup = () => {
  const setupPDFWorker = () => {
    if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
      // Multiple fallback strategies for robust worker loading
      try {
        // First try: Local worker file
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
      } catch (error) {
        try {
          // Second try: CDN fallback
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.3.93/build/pdf.worker.min.js';
        } catch (fallbackError) {
          // Third try: Built-in worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.js',
            import.meta.url,
          ).toString();
        }
      }
    }
  };

  return { setupPDFWorker };
};