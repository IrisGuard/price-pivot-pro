import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFileValidation } from './useFileValidation';
import { useFileProcessingState } from './useFileProcessingState';
import { useFileProcessingCore } from './useFileProcessingCore';

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

interface FileProcessingCallbacks {
  onContactsDetected?: (contacts: any[]) => void;
  onEmailsDetected?: (emails: string[]) => void;
}

export const useFileProcessing = (callbacks: FileProcessingCallbacks = {}) => {
  const { toast } = useToast();
  const { onContactsDetected, onEmailsDetected } = callbacks;
  
  const { validateFile, shouldUseOptimizedProcessing } = useFileValidation();
  const {
    processingResult,
    isProcessing,
    progress,
    stage,
    useOptimizedMode,
    showOptimizedLoader,
    setProcessingResult,
    setIsProcessing,
    setProgress,
    setStage,
    setUseOptimizedMode,
    setShowOptimizedLoader,
    resetProcessing,
    initializeProcessing
  } = useFileProcessingState();

  const { processPDF, processRTF, processCSVExcel, processFileOptimized } = useFileProcessingCore({
    onContactsDetected,
    onEmailsDetected,
    setProgress,
    setStage,
    setProcessingResult
  });

  const processFile = useCallback(async (file: File) => {
    if (!file) {
      setProcessingResult(null);
      setIsProcessing(false);
      setProgress(0);
      setStage('');
      return;
    }

    console.log('🔄 Processing file:', file.name, 'Size:', Math.round(file.size/1024), 'KB');
    
    // Reset states at start
    initializeProcessing();

    const validation = validateFile(file);
    console.log('📁 File type detection:', validation);

    // Immediate rejection for unsupported files
    if (!validation.isValid) {
      console.error('❌ Unsupported file type');
      toast({
        title: "❌ Μη υποστηριζόμενο αρχείο",
        description: "Υποστηρίζονται μόνο PDF, RTF, CSV και Excel αρχεία",
        variant: "destructive",
      });
      setProcessingResult({ type: 'pdf', error: 'Μη υποστηριζόμενος τύπος αρχείου' });
      return;
    }

    // Check if should use optimized processing
    if (shouldUseOptimizedProcessing(file, useOptimizedMode)) {
      console.log('🚀 Using optimized processing for large file');
      setShowOptimizedLoader(true);
      return;
    }

    console.log('⚡ Using standard processing');
    setIsProcessing(true);
    setProgress(0);

    try {
      console.log('🔍 Processing file:', file.name, 'Type:', file.type);

      if (validation.isPDF) {
        await processPDF(file);
      } else if (validation.isRTF) {
        await processRTF(file);
      } else if (validation.isCSV || validation.isExcel) {
        await processCSVExcel(file, validation);
      }
      
    } catch (error) {
      console.error('❌ File processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Σφάλμα επεξεργασίας αρχείου';
      setProcessingResult({ type: 'pdf', error: errorMessage });
      
      toast({
        title: "❌ Σφάλμα επεξεργασίας",
        description: `${errorMessage} - Δοκιμάστε διαφορετικό αρχείο ή επικοινωνήστε με υποστήριξη`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setStage('');
    }
  }, [onContactsDetected, onEmailsDetected, toast, shouldUseOptimizedProcessing, validateFile, processPDF, processRTF, processCSVExcel, setIsProcessing, setProgress, setStage, setProcessingResult, initializeProcessing]);


  const handleOptimizedFileComplete = useCallback((result: any) => {
    setProcessingResult(result);
    setShowOptimizedLoader(false);
    
    if (result.contacts && onContactsDetected) onContactsDetected(result.contacts);
    if (result.emails && onEmailsDetected) onEmailsDetected(result.emails);
    
    const resultType = result.type === 'csv' ? 'CSV' : result.type === 'excel' ? 'Excel' : 'RTF';
    if (result.type !== 'pdf') {
      toast({
        title: `✅ ${resultType} επεξεργασία`,
        description: result.contacts ? 
          `Βρέθηκαν ${result.contacts.length} επαφές και ${result.emails?.length || 0} emails` :
          `Το ${resultType} μετατράπηκε επιτυχώς σε PDF`,
      });
    }
  }, [onContactsDetected, onEmailsDetected, toast, setProcessingResult, setShowOptimizedLoader]);

  const handleOptimizedFileCancel = useCallback(() => {
    console.log('🔄 Falling back to standard processing');
    setShowOptimizedLoader(false);
    setUseOptimizedMode(false);
    
    toast({
      title: "⚡ Μετάβαση σε γρήγορη φόρτωση",
      description: "Δοκιμή με βασικό processing mode...",
    });
  }, [toast, setShowOptimizedLoader, setUseOptimizedMode]);


  return {
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
  };
};