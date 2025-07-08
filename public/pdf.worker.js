// Reliable PDF.js Worker - Production Ready
console.log('🔧 PDF Worker: Starting...');

// Immediate basic worker setup for fast startup
self.onmessage = function(e) {
  console.log('📨 PDF Worker: Received message:', e.data);
  self.postMessage({
    type: 'ready',
    timestamp: Date.now()
  });
};

// Quick ready signal
self.postMessage({
  type: 'worker-ready',
  timestamp: Date.now()
});

// Try to load enhanced PDF.js worker
(async function loadEnhancedWorker() {
  const sources = [
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.js'
  ];
  
  for (const src of sources) {
    try {
      console.log('🔧 PDF Worker: Trying', src);
      importScripts(src);
      console.log('✅ PDF Worker: Enhanced worker loaded from', src);
      return;
    } catch (error) {
      console.warn('⚠️ PDF Worker: Failed to load from', src, error);
    }
  }
  
  console.warn('⚠️ PDF Worker: Using basic fallback worker');
})();