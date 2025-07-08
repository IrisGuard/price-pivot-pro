// Simplified Performance Monitor - No Dependencies
// Basic performance tracking without complex configurations

export const performanceMonitor = {
  startOperation: (operationId: string) => {
    // Minimal implementation - just log for debugging
    console.log(`Starting operation: ${operationId}`);
  },
  
  endOperation: (operationId: string, fileSize: number, errors: string[] = []) => {
    // Minimal implementation - just log for debugging
    if (errors.length > 0) {
      console.warn(`Operation ${operationId} completed with errors:`, errors);
    } else {
      console.log(`Operation ${operationId} completed successfully`);
    }
  },
  
  // Add missing methods for compatibility
  getMetrics: () => [],
  getAverageProcessingTime: () => 0,
  reset: () => {
    console.log('Performance monitor reset');
  }
};

// Simplified performance tracking without async complications
export const withPerformanceTracking = async <T>(
  operationId: string,
  fileSize: number,
  operation: () => Promise<T>
): Promise<T> => {
  // Just execute the operation without complex tracking
  try {
    return await operation();
  } catch (error) {
    console.warn(`Operation ${operationId} failed:`, error);
    throw error;
  }
};
