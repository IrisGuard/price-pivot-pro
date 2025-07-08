import * as pdfjsLib from 'pdfjs-dist';

export const usePDFWorkerSetup = () => {
  const setupPDFWorker = () => {
    if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Use public folder worker - most reliable approach
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
    }
  };

  return { setupPDFWorker };
};