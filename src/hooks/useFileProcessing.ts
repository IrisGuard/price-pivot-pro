import { useState, useCallback } from 'react';
import { useRTFToPDFConverter } from '@/hooks/useRTFToPDFConverter';
import { CSVProcessor } from '@/lib/csv/csvProcessor';
import { useToast } from '@/hooks/use-toast';

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

interface ProcessingResult {
  type: 'pdf' | 'rtf' | 'csv' | 'excel';
  content?: File;
  contacts?: any[];
  emails?: string[];
  text?: string;
  error?: string;
}

interface FileProcessingCallbacks {
  onContactsDetected?: (contacts: any[]) => void;
  onEmailsDetected?: (emails: string[]) => void;
}

export const useFileProcessing = (callbacks: FileProcessingCallbacks = {}) => {
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [useOptimizedMode, setUseOptimizedMode] = useState(false);
  const [showOptimizedLoader, setShowOptimizedLoader] = useState(false);
  
  const { convertRTFToPDF } = useRTFToPDFConverter();
  const { toast } = useToast();
  const { onContactsDetected, onEmailsDetected } = callbacks;

  // Simplified: Use optimized processing only for very large files or when explicitly requested
  const shouldUseOptimizedProcessing = useCallback((file: File) => {
    return useOptimizedMode || file.size > 10 * 1024 * 1024; // 10MB+ or explicit request
  }, [useOptimizedMode]);

  const validateFile = useCallback((file: File) => {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isPDF = fileExtension === 'pdf' || file.type === 'application/pdf';
    const isRTF = fileExtension === 'rtf' || file.type === 'text/rtf';
    const isCSV = fileExtension === 'csv' || file.type === 'text/csv';
    const isExcel = fileExtension?.match(/^(xlsx|xls)$/) || file.type.includes('spreadsheet');

    return { isPDF, isRTF, isCSV, isExcel, isValid: isPDF || isRTF || isCSV || isExcel };
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!file) {
      setProcessingResult(null);
      setIsProcessing(false);
      setProgress(0);
      setStage('');
      return;
    }

    console.log('🔄 Processing file:', file.name, 'Size:', Math.round(file.size/1024), 'KB');

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
    if (shouldUseOptimizedProcessing(file)) {
      console.log('🚀 Using optimized processing for large file');
      setShowOptimizedLoader(true);
      return;
    }

    console.log('⚡ Using standard processing');
    setIsProcessing(true);
    setProcessingResult(null);
    setProgress(0);

    try {
      console.log('🔍 Processing file:', file.name, 'Type:', file.type);

      if (validation.isPDF) {
        console.log('📄 Processing PDF file');
        setStage('Φόρτωση PDF...');
        setProgress(50);
        
        // Add small delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setProgress(100);
        setProcessingResult({ type: 'pdf', content: file });
        
        toast({
          title: "✅ PDF φορτώθηκε",
          description: "Το PDF είναι έτοιμο για επεξεργασία",
        });
        
      } else if (validation.isRTF) {
        console.log('📝 Processing RTF file');
        setStage('Μετατροπή RTF σε PDF...');
        setProgress(25);
        
        try {
          const pdfBytes = await convertRTFToPDF(file);
          console.log('✅ RTF converted successfully, PDF size:', pdfBytes.length, 'bytes');
        
          setProgress(75);
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          const pdfFile = new File([pdfBlob], file.name.replace('.rtf', '.pdf'), {
            type: 'application/pdf'
          });
          
          setProgress(100);
          setProcessingResult({ type: 'rtf', content: pdfFile });
        
          toast({
            title: "✅ RTF επεξεργασία",
            description: "Το RTF μετατράπηκε επιτυχώς σε PDF",
          });
        } catch (error) {
          console.error('❌ RTF conversion failed:', error);
          throw error;
        }
        
      } else if (validation.isCSV || validation.isExcel) {
        console.log(`📊 Processing ${validation.isCSV ? 'CSV' : 'Excel'} file`);
        setStage('Επεξεργασία δεδομένων...');
        setProgress(25);
        
        try {
          const csvProcessor = new CSVProcessor();
          const result = await csvProcessor.processCSVFile(file);
          console.log('✅ CSV/Excel processed successfully, contacts:', result.contacts.length, 'emails:', result.emails.length);
        
          setProgress(75);
          
          setProcessingResult({ 
            type: validation.isCSV ? 'csv' : 'excel', 
            contacts: result.contacts,
            emails: result.emails
          });
          
          setProgress(100);
          
          // Notify parent components
          if (onContactsDetected) onContactsDetected(result.contacts);
          if (onEmailsDetected) onEmailsDetected(result.emails);
          
          toast({
            title: `✅ ${validation.isCSV ? 'CSV' : 'Excel'} επεξεργασία`,
            description: `Βρέθηκαν ${result.contacts.length} επαφές και ${result.emails.length} emails`,
          });
        } catch (error) {
          console.error(`❌ ${validation.isCSV ? 'CSV' : 'Excel'} processing failed:`, error);
          throw error;
        }
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
  }, [convertRTFToPDF, shouldUseOptimizedProcessing, onContactsDetected, onEmailsDetected, toast, validateFile]);

  const processFileOptimized = useCallback(async (file: File, signal?: AbortSignal): Promise<ProcessingResult> => {
    const validation = validateFile(file);

    if (signal?.aborted) throw new Error('Processing cancelled');

    if (validation.isPDF) {
      return { type: 'pdf', content: file };
    } else if (validation.isRTF) {
      const pdfBytes = await convertRTFToPDF(file, signal);
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const pdfFile = new File([pdfBlob], file.name.replace('.rtf', '.pdf'), {
        type: 'application/pdf'
      });
      return { type: 'rtf', content: pdfFile };
    } else if (validation.isCSV || validation.isExcel) {
      const csvProcessor = new CSVProcessor();
      const result = await csvProcessor.processCSVFile(file, signal);
      return { 
        type: validation.isCSV ? 'csv' : 'excel', 
        contacts: result.contacts,
        emails: result.emails
      };
    }
    
    throw new Error('Μη υποστηριζόμενος τύπος αρχείου');
  }, [convertRTFToPDF, validateFile]);

  const handleOptimizedFileComplete = useCallback((result: ProcessingResult) => {
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
  }, [onContactsDetected, onEmailsDetected, toast]);

  const handleOptimizedFileCancel = useCallback(() => {
    console.log('🔄 Falling back to standard processing');
    setShowOptimizedLoader(false);
    setUseOptimizedMode(false);
    
    toast({
      title: "⚡ Μετάβαση σε γρήγορη φόρτωση",
      description: "Δοκιμή με βασικό processing mode...",
    });
  }, [toast]);

  const resetProcessing = useCallback(() => {
    setProcessingResult(null);
    setIsProcessing(false);
    setProgress(0);
    setStage('');
    setShowOptimizedLoader(false);
  }, []);

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