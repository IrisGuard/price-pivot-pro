import { useState, useCallback } from 'react';

interface ProgressiveLoadingOptions {
  initialDelay?: number;
  chunkSize?: number;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export const useProgressiveLoading = (options: ProgressiveLoadingOptions = {}) => {
  const { initialDelay = 100, chunkSize = 1, onProgress, onComplete } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const processInChunks = useCallback(async <T>(
    items: T[],
    processor: (item: T, index: number) => Promise<void> | void
  ) => {
    if (items.length === 0) {
      onComplete?.();
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        
        // Process chunk
        await Promise.all(
          chunk.map((item, chunkIndex) => processor(item, i + chunkIndex))
        );

        // Update progress
        const currentProgress = Math.min(100, Math.round(((i + chunk.length) / items.length) * 100));
        setProgress(currentProgress);
        onProgress?.(currentProgress);

        // Allow UI to update between chunks
        if (i + chunkSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, initialDelay));
        }
      }

      onComplete?.();
    } catch (error) {
      console.error('Progressive loading error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [chunkSize, initialDelay, onProgress, onComplete]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setProgress(0);
  }, []);

  return {
    isLoading,
    progress,
    processInChunks,
    reset
  };
};