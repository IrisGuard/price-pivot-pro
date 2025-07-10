import { useState, useEffect, useCallback } from 'react';
import { HybridPDFViewer } from './pdf/HybridPDFViewer';
import { OptimizedFileLoader } from './shared/OptimizedFileLoader';
import { useRTFToPDFConverter } from '@/hooks/useRTFToPDFConverter';
import { CSVProcessor } from '@/lib/csv/csvProcessor';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText, Mail, Users, FileSpreadsheet, Loader2, RefreshCw } from 'lucide-react';
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
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [useOptimizedMode, setUseOptimizedMode] = useState(false);
  const [showOptimizedLoader, setShowOptimizedLoader] = useState(false);
  const { convertRTFToPDF } = useRTFToPDFConverter();
  const { toast } = useToast();

  // Simplified: Use optimized processing only for very large files or when explicitly requested
  const shouldUseOptimizedProcessing = useCallback((file: File) => {
    return useOptimizedMode || file.size > 10 * 1024 * 1024; // 10MB+ or explicit request
  }, [useOptimizedMode]);

  const processFile = useCallback(async () => {
    if (!file) {
      setProcessingResult(null);
      setIsProcessing(false);
      setProgress(0);
      setStage('');
      return;
    }

    console.log('🔄 Processing file:', file.name, 'Size:', Math.round(file.size/1024), 'KB');

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isPDF = fileExtension === 'pdf' || file.type === 'application/pdf';
    const isRTF = fileExtension === 'rtf' || file.type === 'text/rtf';
    const isCSV = fileExtension === 'csv' || file.type === 'text/csv';
    const isExcel = fileExtension?.match(/^(xlsx|xls)$/) || file.type.includes('spreadsheet');

    console.log('📁 File type detection:', { isPDF, isRTF, isCSV, isExcel, extension: fileExtension, mimeType: file.type });

    // Immediate rejection for unsupported files
    if (!isPDF && !isRTF && !isCSV && !isExcel) {
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

      if (isPDF) {
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
        
      } else if (isRTF) {
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
        
      } else if (isCSV || isExcel) {
        console.log(`📊 Processing ${isCSV ? 'CSV' : 'Excel'} file`);
        setStage('Επεξεργασία δεδομένων...');
        setProgress(25);
        
        try {
          const csvProcessor = new CSVProcessor();
          const result = await csvProcessor.processCSVFile(file);
          console.log('✅ CSV/Excel processed successfully, contacts:', result.contacts.length, 'emails:', result.emails.length);
        
          setProgress(75);
          
          setProcessingResult({ 
            type: isCSV ? 'csv' : 'excel', 
            contacts: result.contacts,
            emails: result.emails
          });
          
          setProgress(100);
          
          // Notify parent components
          if (onContactsDetected) onContactsDetected(result.contacts);
          if (onEmailsDetected) onEmailsDetected(result.emails);
          
          toast({
            title: `✅ ${isCSV ? 'CSV' : 'Excel'} επεξεργασία`,
            description: `Βρέθηκαν ${result.contacts.length} επαφές και ${result.emails.length} emails`,
          });
        } catch (error) {
          console.error(`❌ ${isCSV ? 'CSV' : 'Excel'} processing failed:`, error);
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
  }, [file, convertRTFToPDF, shouldUseOptimizedProcessing, onContactsDetected, onEmailsDetected, toast]);

  useEffect(() => {
    if (!file) {
      setProcessingResult(null);
      setIsProcessing(false);
      setProgress(0);
      setStage('');
      return;
    }

    console.log('🔍 File changed, starting processing:', file.name, file.type);
    processFile();
  }, [file, processFile]);

  // Optimized file processor for large/complex files
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

  const handleOptimizedFileComplete = (result: ProcessingResult) => {
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
  };

  const handleOptimizedFileCancel = () => {
    console.log('🔄 Falling back to standard processing');
    setShowOptimizedLoader(false);
    setUseOptimizedMode(false);
    
    toast({
      title: "⚡ Μετάβαση σε γρήγορη φόρτωση",
      description: "Δοκιμή με βασικό processing mode...",
    });
    
    // Fallback to fast processing
    setTimeout(() => processFile(), 100);
  };


  const extractTextFromPDF = async (file: File): Promise<string> => {
    // This would need to be implemented with PDF.js
    // For now, return empty string
    return '';
  };

  if (!file) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Δεν έχει επιλεχθεί αρχείο</p>
          <p className="text-sm">Επιλέξτε ένα PDF, RTF, CSV ή Excel για να ξεκινήσετε</p>
        </div>
      </Card>
    );
  }


  if (isProcessing) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-lg font-medium">Επεξεργασία αρχείου...</p>
              <p className="text-sm text-muted-foreground">{stage || 'Προετοιμασία...'}</p>
            </div>
            <div className="w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span>Πρόοδος</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>
      </Card>
    );
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
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Σφάλμα επεξεργασίας</h3>
            <p className="text-muted-foreground max-w-md">{processingResult.error}</p>
            <div className="space-y-2">
              <Button 
                onClick={() => {
                  setProcessingResult(null);
                  processFile();
                }}
                className="mr-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Δοκιμή ξανά
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setProcessingResult(null);
                  setUseOptimizedMode(true);
                  processFile();
                }}
                className="mr-2"
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Βελτιστοποιημένη φόρτωση
              </Button>
              <Button 
                variant="ghost"
                onClick={() => {
                  setProcessingResult(null);
                  window.location.reload();
                }}
              >
                📁 Διαφορετικό αρχείο
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // CSV/Excel results display
  if (processingResult?.type === 'csv' || processingResult?.type === 'excel') {
    return (
      <Card className="w-full p-6">
        <div className="space-y-6">
          <div className="text-center">
            <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold">
              {processingResult.type === 'csv' ? 'CSV' : 'Excel'} Αρχείο Επεξεργασμένο
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Επαφές</h3>
              </div>
              <p className="text-2xl font-bold text-primary">
                {processingResult.contacts?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">επαφές βρέθηκαν</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Emails</h3>
              </div>
              <p className="text-2xl font-bold text-primary">
                {processingResult.emails?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">μοναδικά emails</p>
            </Card>
          </div>
          
          {processingResult.contacts && processingResult.contacts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Πρώτες 5 επαφές:</h4>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                {processingResult.contacts.slice(0, 5).map((contact, index) => (
                  <div key={index} className="border-b last:border-b-0 pb-1 last:pb-0">
                    {contact.name && <span className="font-medium">{contact.name}</span>}
                    {contact.email && <span className="text-muted-foreground ml-2">{contact.email}</span>}
                    {contact.company && <span className="text-muted-foreground ml-2">({contact.company})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
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