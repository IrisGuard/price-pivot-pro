import * as pdfjsLib from 'pdfjs-dist';

// ROBUST PDF.js WORKER SETUP WITH FALLBACKS
export const usePDFWorkerSetup = () => {
  const setupPDFWorker = () => {
    console.log('🔧 Setting up PDF.js worker...');
    
    // Use local worker file for reliability
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
    console.log('✅ PDF.js worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  };

  return { setupPDFWorker };
};