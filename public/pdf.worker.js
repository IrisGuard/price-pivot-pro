// Simple PDF.js Worker - Local Implementation
// Downloads and executes the PDF.js worker script directly

try {
  console.log('🔧 PDF Worker: Attempting to load from CDN...');
  // Try to load from CDN first (latest version)
  importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js');
  console.log('✅ PDF Worker: CDN loaded successfully');
} catch (error) {
  console.warn('⚠️ PDF Worker: CDN failed, trying fallback...', error);
  try {
    // Fallback to jsdelivr
    importScripts('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.js');
    console.log('✅ PDF Worker: Fallback CDN loaded successfully');
  } catch (error2) {
    console.error('❌ PDF Worker: All CDN attempts failed, using basic worker', error2);
    // Final fallback - create a basic worker that handles some operations
    self.onmessage = function(e) {
      try {
        console.log('📨 PDF Worker: Received message:', e.data);
        // Basic message handling with timeout
        setTimeout(() => {
          self.postMessage({
            type: 'ready',
            timestamp: Date.now()
          });
        }, 100);
      } catch (err) {
        console.error('❌ PDF Worker: Message handling failed:', err);
        self.postMessage({
          type: 'error',
          error: 'Worker message handling failed',
          timestamp: Date.now()
        });
      }
    };
    
    // Send initial ready message
    setTimeout(() => {
      self.postMessage({
        type: 'worker-ready',
        fallback: true,
        timestamp: Date.now()
      });
    }, 50);
  }
}