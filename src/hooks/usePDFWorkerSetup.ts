import * as pdfjsLib from 'pdfjs-dist';

export const usePDFWorkerSetup = () => {
  const setupPDFWorker = () => {
    // Worker is now configured in main.tsx - no setup needed here
    console.log('PDF Worker already configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  };

  return { setupPDFWorker };
};