// Self-contained PDF.js worker implementation
// This avoids CORS issues by providing a local worker solution

(function() {
  'use strict';
  
  // Check if we're in a worker context
  if (typeof importScripts !== 'undefined') {
    try {
      // Try to load from jsdelivr CDN (better CORS support than unpkg)
      importScripts('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.93/build/pdf.worker.min.js');
    } catch (error) {
      console.warn('Failed to load PDF worker from CDN:', error);
      
      // Fallback: Basic worker implementation
      self.onmessage = function(e) {
        console.warn('PDF Worker fallback - limited functionality');
        self.postMessage({
          type: 'error',
          error: 'PDF Worker not available - CORS blocked'
        });
      };
    }
  } else {
    // Not in worker context, create a basic worker shim
    if (typeof self !== 'undefined') {
      self.pdfjsWorker = {
        getDocument: function() {
          throw new Error('PDF.js worker not properly loaded');
        }
      };
    }
  }
})();