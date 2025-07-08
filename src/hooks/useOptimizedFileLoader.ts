import { useState, useCallback, useRef } from 'react';
import { fileCache } from '@/lib/cache/fileCache';
import { getPerformanceConfig } from '@/lib/config/environment';

interface LoadingProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'reading' | 'processing' | 'rendering' | 'complete';
}

interface OptimizedFileLoaderOptions {
  onProgress?: (progress: LoadingProgress) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  enableCache?: boolean;
}

export const useOptimizedFileLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<LoadingProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const config = getPerformanceConfig();

  const updateProgress = useCallback((loaded: number, total: number, stage: LoadingProgress['stage']) => {
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
    const progressData: LoadingProgress = { loaded, total, percentage, stage };
    setProgress(progressData);
  }, []);

  const loadFileOptimized = useCallback(async (
    file: File,
    processor: (file: File, signal?: AbortSignal) => Promise<any>,
    options: OptimizedFileLoaderOptions = {}
  ) => {
    const { onProgress, onComplete, onError, enableCache = true } = options;

    // Cancel any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setProgress(null);

    try {
      // Check cache first
      const cacheKey = `optimized-${file.name}-${file.size}-${file.lastModified}`;
      if (enableCache && config.cacheEnabled) {
        const cached = fileCache.get(file, cacheKey);
        if (cached) {
          updateProgress(100, 100, 'complete');
          onProgress?.({ loaded: 100, total: 100, percentage: 100, stage: 'complete' });
          onComplete?.(cached);
          setIsLoading(false);
          return cached;
        }
      }

      // Stage 1: Reading file
      updateProgress(0, 100, 'reading');
      onProgress?.({ loaded: 0, total: 100, percentage: 0, stage: 'reading' });

      // Simulate reading progress for large files
      if (file.size > 5 * 1024 * 1024) { // 5MB+
        const readingSteps = 20;
        for (let i = 0; i <= readingSteps; i++) {
          if (signal.aborted) throw new Error('Operation cancelled');
          updateProgress(i * 2, 100, 'reading');
          onProgress?.({ loaded: i * 2, total: 100, percentage: i * 2, stage: 'reading' });
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } else {
        updateProgress(40, 100, 'reading');
        onProgress?.({ loaded: 40, total: 100, percentage: 40, stage: 'reading' });
      }

      // Stage 2: Processing
      updateProgress(40, 100, 'processing');
      onProgress?.({ loaded: 40, total: 100, percentage: 40, stage: 'processing' });

      const result = await processor(file, signal);

      if (signal.aborted) throw new Error('Operation cancelled');

      // Stage 3: Rendering
      updateProgress(80, 100, 'rendering');
      onProgress?.({ loaded: 80, total: 100, percentage: 80, stage: 'rendering' });

      // Simulate final rendering step
      await new Promise(resolve => setTimeout(resolve, 200));

      // Stage 4: Complete
      updateProgress(100, 100, 'complete');
      onProgress?.({ loaded: 100, total: 100, percentage: 100, stage: 'complete' });

      // Cache result
      if (enableCache && config.cacheEnabled) {
        fileCache.set(file, cacheKey, result);
      }

      onComplete?.(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File loading failed';
      console.error('Optimized file loading error:', errorMessage);
      onError?.(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [updateProgress, config]);

  const cancelLoading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setProgress(null);
    }
  }, []);

  return {
    loadFileOptimized,
    cancelLoading,
    isLoading,
    progress
  };
};