import { useState, useEffect } from 'react';
import { HybridPDFViewer } from './pdf/HybridPDFViewer';
import { useRTFToPDFConverter } from '@/hooks/useRTFToPDFConverter';
import { CSVProcessor } from '@/lib/csv/csvProcessor';
import { EmailExtractor } from '@/lib/email/emailExtractor';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, FileText, Mail, Users, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OptimizedFileLoader } from '@/components/shared/OptimizedFileLoader';

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
  const [showOptimizedLoader, setShowOptimizedLoader] = useState(false);
  const { convertRTFToPDF } = useRTFToPDFConverter();
  const { toast } = useToast();

  useEffect(() => {
    if (!file) {
      setProcessingResult(null);
      return;
    }

    processFile();
  }, [file]);

  const processFile = async () => {
    if (!file) return;

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isPDF = fileExtension === 'pdf' || file.type === 'application/pdf';
    const isRTF = fileExtension === 'rtf' || file.type === 'text/rtf';
    const isCSV = fileExtension === 'csv' || file.type === 'text/csv';
    const isExcel = fileExtension?.match(/^(xlsx|xls)$/) || file.type.includes('spreadsheet');

    // Immediate rejection for unsupported files
    if (!isPDF && !isRTF && !isCSV && !isExcel) {
      toast({
        title: "❌ Μη υποστηριζόμενο αρχείο",
        description: "Υποστηρίζονται μόνο PDF, RTF, CSV και Excel αρχεία",
        variant: "destructive",
      });
      setProcessingResult({ type: 'pdf', error: 'Μη υποστηριζόμενος τύπος αρχείου' });
      return;
    }

    // For larger files or complex processing, show optimized loader
    if (file.size > 2 * 1024 * 1024 || isRTF) { // 2MB+ or RTF files
      setShowOptimizedLoader(true);
      return;
    }

    // Fast path for smaller files
    setIsProcessing(true);
    setProcessingResult(null);

    try {
      console.log('🔍 Processing file:', file.name, 'Type:', file.type);

      if (isPDF) {
        console.log('📄 Processing PDF file...');
        setProcessingResult({ type: 'pdf', content: file });
        
      } else if (isCSV || isExcel) {
        console.log('📊 Processing spreadsheet file...');
        const csvProcessor = new CSVProcessor();
        const result = await csvProcessor.processCSVFile(file);
        
        setProcessingResult({ 
          type: isCSV ? 'csv' : 'excel', 
          contacts: result.contacts,
          emails: result.emails
        });
        
        // Notify parent components
        if (onContactsDetected) onContactsDetected(result.contacts);
        if (onEmailsDetected) onEmailsDetected(result.emails);
        
        toast({
          title: `✅ ${isCSV ? 'CSV' : 'Excel'} επεξεργασία`,
          description: `Βρέθηκαν ${result.contacts.length} επαφές και ${result.emails.length} emails`,
        });
      }
      
    } catch (error) {
      console.error('❌ File processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Σφάλμα επεξεργασίας αρχείου';
      setProcessingResult({ type: 'pdf', error: errorMessage });
      
      toast({
        title: "❌ Σφάλμα επεξεργασίας",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptimizedFileComplete = async (result: any) => {
    setShowOptimizedLoader(false);
    
    const fileExtension = file!.name.toLowerCase().split('.').pop();
    const isRTF = fileExtension === 'rtf' || file!.type === 'text/rtf';
    
    if (isRTF) {
      setProcessingResult({ type: 'rtf', content: result });
      toast({
        title: "✅ RTF επεξεργασία",
        description: "Το RTF μετατράπηκε επιτυχώς σε PDF",
      });
    } else {
      setProcessingResult({ type: 'pdf', content: file! });
    }
  };

  const handleOptimizedFileCancel = () => {
    setShowOptimizedLoader(false);
    setProcessingResult(null);
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

  // Show optimized loader for large files
  if (showOptimizedLoader && file) {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isRTF = fileExtension === 'rtf' || file.type === 'text/rtf';
    
    return (
      <OptimizedFileLoader
        file={file}
        processor={isRTF ? convertRTFToPDF : async (file) => file}
        onComplete={handleOptimizedFileComplete}
        onCancel={handleOptimizedFileCancel}
        className="w-full max-w-md mx-auto"
      />
    );
  }

  if (isProcessing) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Επεξεργασία αρχείου...</p>
            <p className="text-sm text-muted-foreground">Παρακαλώ περιμένετε</p>
          </div>
        </div>
      </Card>
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
              <button 
                onClick={() => {
                  setProcessingResult(null);
                  processFile();
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                🔄 Δοκιμή ξανά
              </button>
              <button 
                onClick={() => {
                  setProcessingResult(null);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 ml-2"
              >
                📁 Διαφορετικό αρχείο
              </button>
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