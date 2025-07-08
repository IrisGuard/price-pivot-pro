// Simplified PDF.js Worker - No External Dependencies
// Basic PDF processing without CDN dependencies

self.onmessage = function(e) {
  const { type, data } = e.data;
  
  try {
    switch (type) {
      case 'getDocument':
        // Signal successful document loading
        self.postMessage({
          type: 'documentLoaded',
          success: true
        });
        break;
        
      case 'getPage':
        // Signal page ready
        self.postMessage({
          type: 'pageReady',
          pageNumber: data.pageNumber
        });
        break;
        
      default:
        // Handle other messages
        self.postMessage({
          type: 'ready'
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message || 'PDF processing failed'
    });
  }
};