import * as pdfjsLib from 'pdfjs-dist';

export const usePDFWorkerSetup = () => {
  const setupPDFWorker = () => {
    if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.js',
        import.meta.url
      ).toString();
    }
  };

  return { setupPDFWorker };
};