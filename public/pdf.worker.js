// Production PDF Worker - Multiple Fallback Sources
console.log('🔧 PDF Worker: Starting production worker...');

// Immediate worker ready signal
self.postMessage({
  type: 'worker-ready',
  timestamp: Date.now()
});

// Fast PDF.js worker loading with immediate fallback
(function loadPDFWorker() {
  const sources = [
    'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js'
  ];
  
  let loaded = false;
  let attempts = 0;
  
  function tryLoad() {
    if (loaded || attempts >= sources.length) {
      if (!loaded) {
        console.warn('❌ PDF Worker: Using minimal fallback');
        self.onmessage = function(e) {
          self.postMessage({ type: 'error', message: 'Worker failed' });
        };
      }
      return;
    }
    
    const src = sources[attempts++];
    
    // 3-second timeout per source
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ PDF Worker: Timeout loading', src);
      tryLoad();
    }, 3000);
    
    try {
      importScripts(src);
      clearTimeout(timeoutId);
      console.log('✅ PDF Worker: Loaded from', src);
      loaded = true;
      
      self.onmessage = function(e) {
        if (e.data && e.data.type) {
          console.log('📨 PDF Worker: Processing', e.data.type);
        }
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('⚠️ PDF Worker: Failed', src, error.message);
      tryLoad();
    }
  }
  
  tryLoad();
})();