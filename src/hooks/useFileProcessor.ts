// Enhanced file processing with environment variable integration
import { useState, useCallback } from 'react';
import { getFileProcessingConfig, ENV_CONFIG } from '@/lib/config/environment';
import { performanceMonitor, withPerformanceTracking } from '@/lib/performance/monitor';
import { toast } from '@/hooks/use-toast';

interface FileProcessingOptions {
  enableCompression?: boolean;
  maxRetries?: number;
  chunkSize?: number;
}

export const useFileProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const config = getFileProcessingConfig();
  
  const processFile = useCallback(async (
    file: File,
    processor: (file: File, options: FileProcessingOptions) => Promise<any>,
    options: FileProcessingOptions = {}
  ) => {
    setIsProcessing(true);
    setProgress(0);
    
    const operationId = `file-process-${Date.now()}`;
    
    try {
      // Validate file size
      if (file.size > config.maxFileSize) {
        throw new Error(`File too large: ${Math.round(file.size / 1024 / 1024)}MB > ${Math.round(config.maxFileSize / 1024 / 1024)}MB`);
      }
      
      // Show processing toast for large files
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "Επεξεργασία αρχείου",
          description: `Επεξεργασία ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)...`,
        });
      }
      
      const processingOptions: FileProcessingOptions = {
        enableCompression: config.enableGzip,
        maxRetries: 3,
        chunkSize: config.chunkSize,
        ...options
      };
      
      const result = await withPerformanceTracking(
        operationId,
        file.size,
        async () => {
          // Simulate progress updates for large files
          if (file.size > 5 * 1024 * 1024) {
            const progressInterval = setInterval(() => {
              setProgress(prev => Math.min(prev + 10, 90));
            }, 200);
            
            try {
              const result = await processor(file, processingOptions);
              clearInterval(progressInterval);
              setProgress(100);
              return result;
            } catch (error) {
              clearInterval(progressInterval);
              throw error;
            }
          } else {
            return await processor(file, processingOptions);
          }
        }
      );
      
      // Success notification for production
      if (ENV_CONFIG.IS_PRODUCTION && file.size > 1024 * 1024) {
        const avgTime = performanceMonitor.getAverageProcessingTime();
        toast({
          title: "✅ Επεξεργασία ολοκληρώθηκε",
          description: `${file.name} επεξεργάστηκε σε ${Math.round(avgTime)}ms`,
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      
      toast({
        title: "Σφάλμα επεξεργασίας",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [config]);
  
  const validateFile = useCallback((file: File, allowedTypes: string[] = []): boolean => {
    // Size validation
    if (file.size > config.maxFileSize) {
      toast({
        title: "Μέγεθος αρχείου",
        description: `Το αρχείο είναι πολύ μεγάλο (${Math.round(file.size / 1024 / 1024)}MB). Μέγιστο: ${Math.round(config.maxFileSize / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return false;
    }
    
    // Type validation
    if (allowedTypes.length > 0 && !allowedTypes.some(type => file.type.includes(type) || file.name.toLowerCase().endsWith(type))) {
      toast({
        title: "Τύπος αρχείου",
        description: `Μη υποστηριζόμενος τύπος αρχείου. Αποδεκτοί: ${allowedTypes.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  }, [config]);
  
  return {
    processFile,
    validateFile,
    isProcessing,
    progress,
    config
  };
};