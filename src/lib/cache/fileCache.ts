// File Processing Cache System
// Improves performance by caching processed results

import { ENV_CONFIG } from '@/lib/config/environment';

interface CacheEntry {
  data: any;
  timestamp: number;
  size: number;
  type: string;
}

class FileCache {
  private cache = new Map<string, CacheEntry>();
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private maxAge = 30 * 60 * 1000; // 30 minutes
  
  constructor() {
    // Clear cache periodically
    if (ENV_CONFIG.IS_PRODUCTION) {
      setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
    }
  }
  
  private generateKey(file: File, operation: string): string {
    return `${operation}-${file.name}-${file.size}-${file.lastModified}`;
  }
  
  get<T>(file: File, operation: string): T | null {
    if (!ENV_CONFIG.IS_PRODUCTION) return null; // Disable cache in development
    
    const key = this.generateKey(file, operation);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  set<T>(file: File, operation: string, data: T): void {
    if (!ENV_CONFIG.IS_PRODUCTION) return; // Disable cache in development
    
    const key = this.generateKey(file, operation);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      size: this.estimateSize(data),
      type: operation
    };
    
    // Check cache size limits
    if (entry.size > this.maxCacheSize / 2) {
      console.warn('Cache entry too large, skipping cache');
      return;
    }
    
    this.cache.set(key, entry);
    this.ensureCacheLimit();
  }
  
  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate
    } catch {
      return 1024; // Default estimate
    }
  }
  
  private ensureCacheLimit(): void {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    
    if (totalSize > this.maxCacheSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      for (const [key, entry] of entries) {
        this.cache.delete(key);
        totalSize -= entry.size;
        
        if (totalSize <= this.maxCacheSize * 0.8) break;
      }
    }
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  getStats() {
    let totalSize = 0;
    const types = new Map<string, number>();
    
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
      types.set(entry.type, (types.get(entry.type) || 0) + 1);
    }
    
    return {
      entries: this.cache.size,
      totalSize,
      types: Object.fromEntries(types),
      maxSize: this.maxCacheSize
    };
  }
}

export const fileCache = new FileCache();