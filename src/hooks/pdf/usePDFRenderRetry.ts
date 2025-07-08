import { useCallback } from 'react';

export const usePDFRenderRetry = () => {
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    retryDelay: number = 1000
  ): Promise<T> => {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        console.error(`Operation attempt ${attempts + 1} failed:`, error);
        attempts++;
        
        if (attempts < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('All retry attempts failed');
  }, []);

  return { withRetry };
};