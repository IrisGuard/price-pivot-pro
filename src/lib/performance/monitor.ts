// Performance Monitoring System
// Tracks file processing metrics and system performance

import { ENV_CONFIG } from '@/lib/config/environment';

interface PerformanceMetrics {
  fileSize: number;
  processingTime: number;
  memoryUsage?: number;
  workerCount?: number;
  errors?: string[];
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private startTimes = new Map<string, number>();
  
  startOperation(operationId: string): void {
    if (!ENV_CONFIG.IS_PRODUCTION) return;
    
    this.startTimes.set(operationId, performance.now());
  }
  
  endOperation(operationId: string, fileSize: number, errors: string[] = []): void {
    if (!ENV_CONFIG.IS_PRODUCTION) return;
    
    const startTime = this.startTimes.get(operationId);
    if (!startTime) return;
    
    const processingTime = performance.now() - startTime;
    const memoryUsage = this.getMemoryUsage();
    
    const metric: PerformanceMetrics = {
      fileSize,
      processingTime,
      memoryUsage,
      errors,
      timestamp: Date.now()
    };
    
    this.metrics.push(metric);
    this.startTimes.delete(operationId);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    // Log performance warnings
    this.checkPerformanceWarnings(metric);
  }
  
  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize;
    }
    return undefined;
  }
  
  private checkPerformanceWarnings(metric: PerformanceMetrics): void {
    const { fileSize, processingTime, memoryUsage } = metric;
    
    // Processing time warnings
    if (processingTime > 10000) {
      console.warn(`Slow processing detected: ${processingTime}ms for ${fileSize} bytes`);
    }
    
    // Memory usage warnings
    if (memoryUsage && memoryUsage > 100 * 1024 * 1024) { // 100MB
      console.warn(`High memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
    }
    
    // File size warnings
    if (fileSize > ENV_CONFIG.MAX_FILE_SIZE * 0.8) {
      console.warn(`Large file processed: ${Math.round(fileSize / 1024 / 1024)}MB`);
    }
  }
  
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
  
  getAverageProcessingTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const total = this.metrics.reduce((sum, metric) => sum + metric.processingTime, 0);
    return total / this.metrics.length;
  }
  
  reset(): void {
    this.metrics = [];
    this.startTimes.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// File Processing Performance Utilities
export const withPerformanceTracking = async <T>(
  operationId: string,
  fileSize: number,
  operation: () => Promise<T>
): Promise<T> => {
  performanceMonitor.startOperation(operationId);
  
  try {
    const result = await operation();
    performanceMonitor.endOperation(operationId, fileSize);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    performanceMonitor.endOperation(operationId, fileSize, [errorMessage]);
    throw error;
  }
};
