import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, FileText, FileSpreadsheet } from 'lucide-react';
import { HybridPDFViewer } from './pdf/HybridPDFViewer';
import { SpreadsheetViewer } from './SpreadsheetViewer';
import { useRTFToPDFConverter } from '@/hooks/useRTFToPDFConverter';

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

interface ProfessionalDocumentViewerProps {
  file: File | null;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: PriceData[]) => void;
  onContactsDetected?: (contacts: any[]) => void;
  onEmailsDetected?: (emails: string[]) => void;
}

export const ProfessionalDocumentViewer = ({ 
  file, 
  onTextExtracted, 
  onPricesDetected,
  onContactsDetected,
  onEmailsDetected
}: ProfessionalDocumentViewerProps) => {
  const [convertedPdfFile, setConvertedPdfFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [documentType, setDocumentType] = useState<'pdf' | 'rtf' | 'spreadsheet' | 'unsupported' | null>(null);
  const { convertRTFToPDF } = useRTFToPDFConverter();

  useEffect(() => {
    if (!file) {
      setConvertedPdfFile(null);
      setDocumentType(null);
      return;
    }

    processFile();
  }, [file]);

  const processFile = async () => {
    if (!file) return;

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isPDF = fileExtension === 'pdf' || file.type === 'application/pdf';
    const isRTF = fileExtension === 'rtf' || file.type === 'text/rtf';
    const isSpreadsheet = fileExtension?.match(/^(csv|xlsx|xls)$/) || 
                         file.type.includes('spreadsheet') || 
                         file.type === 'text/csv';

    if (isPDF) {
      setDocumentType('pdf');
      setConvertedPdfFile(file);
    } else if (isRTF) {
      setDocumentType('rtf');
      setIsConverting(true);
      try {
        const pdfBytes = await convertRTFToPDF(file);
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const pdfFile = new File([pdfBlob], file.name.replace('.rtf', '.pdf'), {
          type: 'application/pdf'
        });
        setConvertedPdfFile(pdfFile);
      } catch (error) {
        setConvertedPdfFile(null);
        console.error('RTF conversion error:', error);
      }
      setIsConverting(false);
    } else if (isSpreadsheet) {
      setDocumentType('spreadsheet');
      setConvertedPdfFile(null);
    } else {
      setDocumentType('unsupported');
      setConvertedPdfFile(null);
    }
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

  if (documentType === 'unsupported') {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Μη υποστηριζόμενος τύπος αρχείου</h3>
          <p className="text-muted-foreground">
            Το σύστημα υποστηρίζει PDF, RTF, CSV και Excel αρχεία
          </p>
        </div>
      </Card>
    );
  }

  if (isConverting) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Μετατροπή εγγράφου για προβολή...</p>
            <p className="text-sm text-muted-foreground">Παρακαλώ περιμένετε</p>
          </div>
        </div>
      </Card>
    );
  }

  // Render appropriate viewer based on document type
  return (
    <div className="w-full space-y-2">
      {/* Show conversion notice for RTF files */}
      {documentType === 'rtf' && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Το RTF αρχείο μετατράπηκε σε PDF διατηρώντας την αρχική μορφοποίηση
          </AlertDescription>
        </Alert>
      )}
      
      {/* Show spreadsheet notice */}
      {documentType === 'spreadsheet' && (
        <Alert>
          <FileSpreadsheet className="h-4 w-4" />
          <AlertDescription>
            Προβολή spreadsheet σε επαγγελματική μορφή A4 - έτοιμο για εκτύπωση
          </AlertDescription>
        </Alert>
      )}

      {/* Render the appropriate viewer */}
      {documentType === 'spreadsheet' ? (
        <SpreadsheetViewer
          file={file}
          onProcessed={(result) => {
            if (onContactsDetected && result.contacts) onContactsDetected(result.contacts);
            if (onEmailsDetected && result.emails) onEmailsDetected(result.emails);
          }}
        />
      ) : (
        <HybridPDFViewer
          pdfFile={convertedPdfFile}
          onPricesDetected={onPricesDetected}
          onTextExtracted={onTextExtracted}
        />
      )}
    </div>
  );
};