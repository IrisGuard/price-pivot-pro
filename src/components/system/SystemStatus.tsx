// System Status Display Component
// Shows environment configuration and performance metrics

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, Settings, Database, Clock } from 'lucide-react';
import { ENV_CONFIG, validateEnvironment } from '@/lib/config/environment';
import { performanceMonitor } from '@/lib/performance/monitor';
import { fileCache } from '@/lib/cache/fileCache';

export const SystemStatus = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());
  const [cacheStats, setCacheStats] = useState(fileCache.getStats());
  
  const envValidation = validateEnvironment();
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
      setCacheStats(fileCache.getStats());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const avgProcessingTime = performanceMonitor.getAverageProcessingTime();
  
  if (!ENV_CONFIG.IS_PRODUCTION && !showDetails) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Activity className="h-4 w-4 mr-2" />
          System Status
        </Button>
      </div>
    );
  }
  
  if (!showDetails && ENV_CONFIG.IS_PRODUCTION) {
    return null; // Hide in production unless explicitly shown
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-background/95 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Status
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 text-xs">
          {/* Environment Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Settings className="h-3 w-3" />
              <span className="font-medium">Environment</span>
              <Badge variant={ENV_CONFIG.IS_PRODUCTION ? "default" : "secondary"}>
                {ENV_CONFIG.APP_ENV}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Max File: {Math.round(ENV_CONFIG.MAX_FILE_SIZE / 1024 / 1024)}MB</div>
              <div>Timeout: {ENV_CONFIG.PDF_WORKER_TIMEOUT / 1000}s</div>
              <div>Chunk: {Math.round(ENV_CONFIG.CHUNK_SIZE / 1024)}KB</div>
              <div>Gzip: {ENV_CONFIG.ENABLE_GZIP ? 'ON' : 'OFF'}</div>
            </div>
          </div>
          
          <Separator />
          
          {/* Performance Metrics */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span className="font-medium">Performance</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Operations: {metrics.length}</div>
              <div>Avg Time: {Math.round(avgProcessingTime)}ms</div>
            </div>
          </div>
          
          {/* Cache Status */}
          {ENV_CONFIG.IS_PRODUCTION && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-3 w-3" />
                  <span className="font-medium">Cache</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Entries: {cacheStats.entries}</div>
                  <div>Size: {Math.round(cacheStats.totalSize / 1024)}KB</div>
                </div>
              </div>
            </>
          )}
          
          {/* Warnings */}
          {envValidation.warnings.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1">
                <span className="font-medium text-yellow-600">Warnings:</span>
                {envValidation.warnings.map((warning, index) => (
                  <div key={index} className="text-xs text-yellow-600">
                    • {warning}
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* Actions */}
          <Separator />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                performanceMonitor.reset();
                fileCache.clear();
                setMetrics([]);
                setCacheStats(fileCache.getStats());
              }}
              className="text-xs h-6"
            >
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};