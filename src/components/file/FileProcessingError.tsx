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
        <AlertTriangle className="h-16 w-16 mx-auto text-destructive animate-pulse" />
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-destructive">Σφάλμα επεξεργασίας αρχείου</h3>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Δοκιμάστε τις παρακάτω λύσεις ή επικοινωνήστε με υποστήριξη
            </p>
          </div>
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