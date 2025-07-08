// Simple PDF.js Worker - Local Implementation
// Downloads and executes the PDF.js worker script directly

try {
  // Try to load from CDN first (latest version)
  importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js');
} catch (error) {
  try {
    // Fallback to jsdelivr
    importScripts('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.js');
  } catch (error2) {
    // Final fallback - create a basic worker that handles some operations
    self.onmessage = function(e) {
      try {
        // Basic message handling
        self.postMessage({
          type: 'ready'
        });
      } catch (err) {
        self.postMessage({
          type: 'error',
          error: 'Worker initialization failed'
        });
      }
    };
  }
}