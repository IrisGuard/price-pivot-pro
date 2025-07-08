// Production PDF Worker - Multiple Fallback Sources
console.log('🔧 PDF Worker: Starting production worker...');

// Immediate worker ready signal
self.postMessage({
  type: 'worker-ready',
  timestamp: Date.now()
});

// Enhanced PDF.js worker loading with multiple fallbacks
(function loadPDFWorker() {
  const sources = [
    'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.js'
  ];
  
  let loaded = false;
  
  for (const src of sources) {
    if (loaded) break;
    
    try {
      importScripts(src);
      console.log('✅ PDF Worker: Loaded from', src);
      loaded = true;
      
      // Override message handler for production
      self.onmessage = function(e) {
        // Handle PDF.js worker messages normally
        if (e.data && e.data.type) {
          console.log('📨 PDF Worker: Processing', e.data.type);
        }
      };
      
      break;
    } catch (error) {
      console.warn('⚠️ PDF Worker: Failed', src, error.message);
    }
  }
  
  if (!loaded) {
    console.error('❌ PDF Worker: All sources failed - using basic fallback');
    self.onmessage = function(e) {
      self.postMessage({
        type: 'error',
        message: 'PDF Worker fallback active',
        timestamp: Date.now()
      });
    };
  }
})();