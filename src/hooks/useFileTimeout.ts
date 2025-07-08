import { useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export const useFileTimeout = (timeoutMs: number = 10000) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const withTimeout = useCallback(async <T>(
    operation: () => Promise<T>,
    onTimeout?: () => void
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Start the timeout
      timeoutRef.current = setTimeout(() => {
        console.error('❌ Operation timeout after', timeoutMs, 'ms');
        toast({
          title: "⏰ Timeout",
          description: `Η λειτουργία διήρκησε περισσότερο από ${timeoutMs / 1000} δευτερόλεπτα`,
          variant: "destructive",
        });
        
        if (onTimeout) onTimeout();
        reject(new Error(`Operation timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      // Execute the operation
      operation()
        .then((result) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          resolve(result);
        })
        .catch((error) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          reject(error);
        });
    });
  }, [timeoutMs]);

  const clearCurrentTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { withTimeout, clearCurrentTimeout };
};