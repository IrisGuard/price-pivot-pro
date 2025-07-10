import { useEffect } from 'react';
import { HybridPDFViewer } from './pdf/HybridPDFViewer';
import { OptimizedFileLoader } from './shared/OptimizedFileLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText } from 'lucide-react';
import { useFileProcessing } from '@/hooks/useFileProcessing';
import { FileProcessingStatus } from './file/FileProcessingStatus';
import { FileProcessingError } from './file/FileProcessingError';
import { FileResultsDisplay } from './file/FileResultsDisplay';
import { FileEmptyState } from './file/FileEmptyState';

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

  useEffect(() => {
    if (file) {
      console.log('🔍 File changed, starting processing:', file.name, file.type);
      processFile(file);
    } else {
      resetProcessing();
    }
  }, [file, processFile, resetProcessing]);

  if (!file) {
    return <FileEmptyState />;
  }

  if (isProcessing) {
    return <FileProcessingStatus stage={stage} progress={progress} />;
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

  // PDF/RTF display with notice
  return (
    <div className="w-full space-y-2">
      {processingResult?.type === 'rtf' && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Το RTF αρχείο μετατράπηκε αυτόματα σε PDF για βέλτιστη προβολή
          </AlertDescription>
        </Alert>
      )}
      <HybridPDFViewer
        pdfFile={processingResult?.content}
        detectedPrices={detectedPrices}
        onPricesDetected={onPricesDetected}
        onTextExtracted={onTextExtracted}
      />
    </div>
  );
};