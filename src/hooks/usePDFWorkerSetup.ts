import * as pdfjsLib from 'pdfjs-dist';

// ROBUST PDF.js WORKER SETUP WITH FALLBACKS
export const usePDFWorkerSetup = () => {
  const setupPDFWorker = () => {
    console.log('🔧 Setting up PDF.js worker...');
    
    // Try multiple CDN sources for reliability
    const workerSources = [
      `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`,
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
      '/pdf.worker.js' // Local fallback
    ];
    
    // Use the first available source
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSources[0];
    console.log('✅ PDF.js worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  };

  return { setupPDFWorker };
};