import { useState, useEffect } from 'react';
import { HybridPDFViewer } from './pdf/HybridPDFViewer';
import { useRTFToPDFConverter } from '@/hooks/useRTFToPDFConverter';
import { CSVProcessor } from '@/lib/csv/csvProcessor';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, FileText, Mail, Users, FileSpreadsheet, Loader2 } from 'lucide-react';
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

    setIsProcessing(true);
    setProcessingResult(null);
    setProgress(0);

    try {
      console.log('🔍 Processing file:', file.name, 'Type:', file.type);

      if (isPDF) {
        setStage('Φόρτωση PDF...');
        setProgress(100);
        setProcessingResult({ type: 'pdf', content: file });
        
      } else if (isRTF) {
        setStage('Μετατροπή RTF σε PDF...');
        setProgress(25);
        
        // RTF processing with 10s timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('RTF timeout - χρήση fallback')), 10000);
        });
        
        const pdfBytes = await Promise.race([
          convertRTFToPDF(file),
          timeoutPromise
        ]);
        
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
        
      } else if (isCSV || isExcel) {
        setStage('Επεξεργασία δεδομένων...');
        setProgress(25);
        
        // CSV/Excel processing with 15s timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('CSV/Excel timeout')), 15000);
        });
        
        const csvProcessor = new CSVProcessor();
        const result = await Promise.race([
          csvProcessor.processCSVFile(file),
          timeoutPromise
        ]);
        
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
      setProgress(0);
    }
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