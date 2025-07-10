import { useCallback } from 'react';
import { useRTFToPDFConverter } from '@/hooks/useRTFToPDFConverter';
import { CSVProcessor } from '@/lib/csv/csvProcessor';
import { useToast } from '@/hooks/use-toast';
import type { FileValidation } from './useFileValidation';
import type { ProcessingResult } from './useFileProcessingState';

interface ProcessingCallbacks {
  onContactsDetected?: (contacts: any[]) => void;
  onEmailsDetected?: (emails: string[]) => void;
  setProgress: (progress: number) => void;
  setStage: (stage: string) => void;
  setProcessingResult: (result: ProcessingResult) => void;
}

export const useFileProcessingCore = (callbacks: ProcessingCallbacks) => {
  const { convertRTFToPDF } = useRTFToPDFConverter();
  const { toast } = useToast();
  const { onContactsDetected, onEmailsDetected, setProgress, setStage, setProcessingResult } = callbacks;

  const processPDF = useCallback(async (file: File) => {
    console.log('📄 Processing PDF file');
    setStage('Φόρτωση PDF...');
    setProgress(25);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setProgress(75);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    setProgress(100);
    setProcessingResult({ type: 'pdf', content: file });
    
    console.log('✅ PDF processing completed successfully');
    toast({
      title: "✅ PDF φορτώθηκε",
      description: "Το PDF είναι έτοιμο για επεξεργασία",
    });
  }, [setStage, setProgress, setProcessingResult, toast]);

  const processRTF = useCallback(async (file: File) => {
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
    
      console.log('✅ RTF processing completed successfully');
      toast({
        title: "✅ RTF επεξεργασία",
        description: "Το RTF μετατράπηκε επιτυχώς σε PDF",
      });
    } catch (error) {
      console.error('❌ RTF conversion failed:', error);
      throw error;
    }
  }, [convertRTFToPDF, setStage, setProgress, setProcessingResult, toast]);

  const processCSVExcel = useCallback(async (file: File, validation: FileValidation) => {
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
      
      console.log(`✅ ${validation.isCSV ? 'CSV' : 'Excel'} processing completed successfully`);
      toast({
        title: `✅ ${validation.isCSV ? 'CSV' : 'Excel'} επεξεργασία`,
        description: `Βρέθηκαν ${result.contacts.length} επαφές και ${result.emails.length} emails`,
      });
    } catch (error) {
      console.error(`❌ ${validation.isCSV ? 'CSV' : 'Excel'} processing failed:`, error);
      throw error;
    }
  }, [setStage, setProgress, setProcessingResult, onContactsDetected, onEmailsDetected, toast]);

  const processFileOptimized = useCallback(async (file: File, signal?: AbortSignal): Promise<ProcessingResult> => {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isPDF = fileExtension === 'pdf' || file.type === 'application/pdf';
    const isRTF = fileExtension === 'rtf' || file.type === 'text/rtf';
    const isCSV = fileExtension === 'csv' || file.type === 'text/csv';
    const isExcel = fileExtension?.match(/^(xlsx|xls)$/) || file.type.includes('spreadsheet');

    if (signal?.aborted) throw new Error('Processing cancelled');

    if (isPDF) {
      return { type: 'pdf', content: file };
    } else if (isRTF) {
      const pdfBytes = await convertRTFToPDF(file, signal);
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const pdfFile = new File([pdfBlob], file.name.replace('.rtf', '.pdf'), {
        type: 'application/pdf'
      });
      return { type: 'rtf', content: pdfFile };
    } else if (isCSV || isExcel) {
      const csvProcessor = new CSVProcessor();
      const result = await csvProcessor.processCSVFile(file, signal);
      return { 
        type: isCSV ? 'csv' : 'excel', 
        contacts: result.contacts,
        emails: result.emails
      };
    }
    
    throw new Error('Μη υποστηριζόμενος τύπος αρχείου');
  }, [convertRTFToPDF]);

  return {
    processPDF,
    processRTF,
    processCSVExcel,
    processFileOptimized
  };
};