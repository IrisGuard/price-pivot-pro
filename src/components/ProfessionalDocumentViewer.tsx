import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, FileText } from 'lucide-react';
import { SimplePDFViewer } from './SimplePDFViewer';

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
  const [documentType, setDocumentType] = useState<'pdf' | 'unsupported' | null>(null);

  useEffect(() => {
    if (!file) {
      setDocumentType(null);
      return;
    }

    processFile();
  }, [file]);

  const processFile = async () => {
    if (!file) return;

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isPDF = fileExtension === 'pdf' || file.type === 'application/pdf';

    if (isPDF) {
      setDocumentType('pdf');
    } else {
      setDocumentType('unsupported');
    }
  };

  if (!file) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Δεν έχει επιλεχθεί αρχείο</p>
          <p className="text-sm">Επιλέξτε ένα PDF για να ξεκινήσετε</p>
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
            Το σύστημα υποστηρίζει μόνο PDF αρχεία
          </p>
        </div>
      </Card>
    );
  }


  // Render appropriate viewer based on document type
  return (
    <div className="w-full space-y-2">
      <SimplePDFViewer
        file={file}
        onPricesDetected={onPricesDetected}
        onTextExtracted={onTextExtracted}
      />
    </div>
  );
};