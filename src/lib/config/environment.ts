// Environment Configuration Management
// Integrates VITE environment variables for production optimization

export const ENV_CONFIG = {
  // Application Environment
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  IS_PRODUCTION: import.meta.env.VITE_APP_ENV === 'production',
  
  // PDF Processing Configuration
  PDF_WORKER_TIMEOUT: Number(import.meta.env.VITE_PDF_WORKER_TIMEOUT) || 30000,
  MAX_FILE_SIZE: Number(import.meta.env.VITE_MAX_FILE_SIZE) || 52428800, // 50MB
  CHUNK_SIZE: Number(import.meta.env.VITE_CHUNK_SIZE) || 1048576, // 1MB
  ENABLE_GZIP: import.meta.env.VITE_ENABLE_GZIP === 'true',
  
  // Performance Settings
  MAX_CONCURRENT_WORKERS: 2,
  CACHE_ENABLED: true,
  PERFORMANCE_MONITORING: true
} as const;

export const getFileProcessingConfig = () => ({
  maxFileSize: ENV_CONFIG.MAX_FILE_SIZE,
  chunkSize: ENV_CONFIG.CHUNK_SIZE,
  timeout: ENV_CONFIG.PDF_WORKER_TIMEOUT,
  enableGzip: ENV_CONFIG.ENABLE_GZIP,
  isProduction: ENV_CONFIG.IS_PRODUCTION
});

export const getPerformanceConfig = () => ({
  enableMonitoring: ENV_CONFIG.PERFORMANCE_MONITORING && ENV_CONFIG.IS_PRODUCTION,
  maxConcurrentWorkers: ENV_CONFIG.MAX_CONCURRENT_WORKERS,
  cacheEnabled: ENV_CONFIG.CACHE_ENABLED
});

// Validation Helper
export const validateEnvironment = () => {
  const warnings: string[] = [];
  
  if (ENV_CONFIG.MAX_FILE_SIZE > 100 * 1024 * 1024) {
    warnings.push('MAX_FILE_SIZE is very large (>100MB), consider reducing for better performance');
  }
  
  if (ENV_CONFIG.PDF_WORKER_TIMEOUT < 10000) {
    warnings.push('PDF_WORKER_TIMEOUT is low (<10s), may cause timeouts with large files');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    config: ENV_CONFIG
  };
};