import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

interface FileProcessingErrorProps {
  error: string;
  onRetry: () => void;
  onOptimizedRetry: () => void;
  onReset: () => void;
}

export const FileProcessingError = ({ 
  error, 
  onRetry, 
  onOptimizedRetry, 
  onReset 
}: FileProcessingErrorProps) => {
  return (
    <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Σφάλμα επεξεργασίας</h3>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <div className="space-y-2">
            <Button onClick={onRetry} className="mr-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Δοκιμή ξανά
            </Button>
            <Button variant="outline" onClick={onOptimizedRetry} className="mr-2">
              <Loader2 className="h-4 w-4 mr-2" />
              Βελτιστοποιημένη φόρτωση
            </Button>
            <Button variant="ghost" onClick={onReset}>
              📁 Διαφορετικό αρχείο
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};