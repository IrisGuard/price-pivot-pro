import { useEffect } from 'react';
import { LazyPDFViewer } from './lazy/LazyPDFViewer';
import { OptimizedFileLoader } from './shared/OptimizedFileLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText } from 'lucide-react';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import { FileProcessingStatus } from './file/FileProcessingStatus';
import { FileProcessingError } from './file/FileProcessingError';
import { FileResultsDisplay } from './file/FileResultsDisplay';
import { FileEmptyState } from './file/FileEmptyState';
import { ErrorBoundary } from './ErrorBoundary';
import { useMemoryOptimization } from '@/hooks/useMemoryOptimization';
import { useEnhancedToast } from '@/hooks/useEnhancedToast';

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

interface UniversalFileProcessorProps {
  file: File | null;
  detectedPrices?: PriceData[];
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: PriceData[]) => void;
  onContactsDetected?: (contacts: any[]) => void;
  onEmailsDetected?: (emails: string[]) => void;
}

export const UniversalFileProcessor = ({ 
  file, 
  detectedPrices,
  onTextExtracted, 
  onPricesDetected,
  onContactsDetected,
  onEmailsDetected
}: UniversalFileProcessorProps) => {
  const {
    processingResult,
    isProcessing,
    progress,
    stage,
    showOptimizedLoader,
    useOptimizedMode,
    processFile,
    processFileOptimized,
    handleOptimizedFileComplete,
    handleOptimizedFileCancel,
    resetProcessing,
    setUseOptimizedMode
  } = useFileProcessing({ onContactsDetected, onEmailsDetected });

  const { showWarning } = useEnhancedToast();
  const { registerCleanup } = useMemoryOptimization({
    maxMemoryUsage: 400,
    onMemoryWarning: (usage) => {
      showWarning(`Υψηλή χρήση μνήμης: ${usage.toFixed(1)}MB`, 'Κάντε restart αν η εφαρμογή γίνει αργή');
    }
  });

  useEffect(() => {
    if (file) {
      console.log('🔍 File changed, starting processing:', file.name, file.type);
      processFile(file);
    } else {
      resetProcessing();
    }
  }, [file]); // Simplified dependency array to prevent infinite loops

  if (!file) {
    return <FileEmptyState />;
  }

  if (isProcessing) {
    return <FileProcessingStatus stage={stage} progress={progress} fileType={file?.type} />;
  }

  if (showOptimizedLoader) {
    return (
      <OptimizedFileLoader
        file={file}
        processor={processFileOptimized}
        onComplete={handleOptimizedFileComplete}
        onCancel={handleOptimizedFileCancel}
        className="w-full min-h-[600px]"
      />
    );
  }

  if (processingResult?.error) {
    return (
      <FileProcessingError
        error={processingResult.error}
        onRetry={() => {
          resetProcessing();
          processFile(file);
        }}
        onOptimizedRetry={() => {
          resetProcessing();
          setUseOptimizedMode(true);
          processFile(file);
        }}
        onReset={() => {
          resetProcessing();
          window.location.reload();
        }}
      />
    );
  }

  // CSV/Excel results display
  if (processingResult?.type === 'csv' || processingResult?.type === 'excel') {
    return <FileResultsDisplay result={processingResult} />;
  }

  // PDF/RTF display with notice and error boundary
  return (
    <ErrorBoundary>
      <div className="w-full space-y-2">
        {processingResult?.type === 'rtf' && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Το RTF αρχείο μετατράπηκε αυτόματα σε PDF για βέλτιστη προβολή
            </AlertDescription>
          </Alert>
        )}
        <LazyPDFViewer
          pdfFile={processingResult?.content}
          detectedPrices={detectedPrices}
          onPricesDetected={onPricesDetected}
          onTextExtracted={onTextExtracted}
          mode="hybrid"
        />
      </div>
    </ErrorBoundary>
  );
};