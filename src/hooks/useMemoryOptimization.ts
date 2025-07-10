import { useEffect, useCallback, useRef } from 'react';

interface MemoryOptimizationOptions {
  maxMemoryUsage?: number; // MB
  gcInterval?: number; // ms
  onMemoryWarning?: (usage: number) => void;
}

export const useMemoryOptimization = (options: MemoryOptimizationOptions = {}) => {
  const { 
    maxMemoryUsage = 500, // 500MB default
    gcInterval = 30000, // 30 seconds
    onMemoryWarning 
  } = options;
  
  const cleanupTasks = useRef<(() => void)[]>([]);
  const memoryCheckInterval = useRef<NodeJS.Timeout>();

  // Register cleanup task
  const registerCleanup = useCallback((task: () => void) => {
    cleanupTasks.current.push(task);
    return () => {
      const index = cleanupTasks.current.indexOf(task);
      if (index > -1) {
        cleanupTasks.current.splice(index, 1);
      }
    };
  }, []);

  // Force garbage collection (if available)
  const forceGC = useCallback(() => {
    // Run cleanup tasks
    cleanupTasks.current.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    });

    // Clear image caches
    const images = document.getElementsByTagName('img');
    Array.from(images).forEach(img => {
      if (!img.src.startsWith('data:') && !document.body.contains(img)) {
        img.src = '';
      }
    });

    // Clear canvas contexts
    const canvases = document.getElementsByTagName('canvas');
    Array.from(canvases).forEach(canvas => {
      if (!document.body.contains(canvas)) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    });

    // Force browser GC if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
      } catch (e) {
        // GC not available in production
      }
    }
  }, []);

  // Check memory usage
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      
      if (usedMB > maxMemoryUsage) {
        console.warn(`🚨 High memory usage: ${usedMB.toFixed(2)}MB`);
        onMemoryWarning?.(usedMB);
        forceGC();
      }
    }
  }, [maxMemoryUsage, onMemoryWarning, forceGC]);

  // Set up memory monitoring
  useEffect(() => {
    memoryCheckInterval.current = setInterval(checkMemoryUsage, gcInterval);
    
    return () => {
      if (memoryCheckInterval.current) {
        clearInterval(memoryCheckInterval.current);
      }
      forceGC();
    };
  }, [checkMemoryUsage, gcInterval, forceGC]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      forceGC();
    };
  }, [forceGC]);

  return {
    registerCleanup,
    forceGC,
    checkMemoryUsage
  };
};