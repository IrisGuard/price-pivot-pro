import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X, FileText, Loader2 } from 'lucide-react';
import { useOptimizedFileLoader } from '@/hooks/useOptimizedFileLoader';

interface OptimizedFileLoaderProps {
  file: File;
  processor: (file: File, signal?: AbortSignal) => Promise<any>;
  onComplete: (result: any) => void;
  onCancel: () => void;
  className?: string;
}

export const OptimizedFileLoader = ({ 
  file, 
  processor, 
  onComplete, 
  onCancel,
  className 
}: OptimizedFileLoaderProps) => {
  const { loadFileOptimized, cancelLoading, isLoading, progress } = useOptimizedFileLoader();

  React.useEffect(() => {
    loadFileOptimized(file, processor, {
      onComplete,
      onError: (error) => {
        console.error('File loading error:', error);
        onCancel();
      }
    });
  }, [file, processor, loadFileOptimized, onComplete, onCancel]);

  const getStageText = (stage?: string) => {
    switch (stage) {
      case 'reading': return 'Διάβασμα αρχείου...';
      case 'processing': return 'Επεξεργασία δεδομένων...';
      case 'rendering': return 'Προετοιμασία προβολής...';
      case 'complete': return 'Ολοκληρώθηκε!';
      default: return 'Φόρτωση...';
    }
  };

  const handleCancel = () => {
    cancelLoading();
    onCancel();
  };

  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <FileText className="h-8 w-8 text-primary" />
              {isLoading && (
                <Loader2 className="h-4 w-4 absolute -top-1 -right-1 animate-spin text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-medium">{file.name}</h3>
              <p className="text-sm text-muted-foreground">
                {Math.round(file.size / 1024)} KB
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{getStageText(progress.stage)}</span>
              <span>{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}

        {!progress && isLoading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Προετοιμασία...</span>
              <span>0%</span>
            </div>
            <Progress value={0} className="h-2" />
          </div>
        )}
      </div>
    </Card>
  );
};