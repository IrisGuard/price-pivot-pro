import { useState, useEffect } from 'react';
import { BrowserNativePDFViewer } from './pdf/BrowserNativePDFViewer';
import { useRTFToPDFConverter } from '@/hooks/useRTFToPDFConverter';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, FileText } from 'lucide-react';

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

interface UniversalFileViewerProps {
  file: File | null;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: PriceData[]) => void;
}

export const UniversalFileViewer = ({ 
  file, 
  onTextExtracted, 
  onPricesDetected 
}: UniversalFileViewerProps) => {
  const [convertedPdfFile, setConvertedPdfFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const { convertRTFToPDF } = useRTFToPDFConverter();

  useEffect(() => {
    if (!file) {
      setConvertedPdfFile(null);
      return;
    }

    const processFile = async () => {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setConvertedPdfFile(file);
      } else if (file.name.toLowerCase().endsWith('.rtf')) {
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
        }
        setIsConverting(false);
      } else {
        // For CSV and Excel files, pass them directly to the viewer
        setConvertedPdfFile(file);
      }
    };

    processFile();
  }, [file, convertRTFToPDF]);

  if (!file) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Δεν έχει επιλεχθεί αρχείο</p>
          <p className="text-sm">Επιλέξτε ένα PDF, RTF, CSV ή Excel αρχείο για να ξεκινήσετε</p>
        </div>
      </Card>
    );
  }

  // Handle unsupported file types - Now support PDF, RTF, CSV, Excel
  const fileExtension = file.name.toLowerCase().split('.').pop();
  const isPDF = fileExtension === 'pdf' || file.type === 'application/pdf';
  const isRTF = fileExtension === 'rtf' || file.type === 'text/rtf';
  const isCSV = fileExtension === 'csv' || file.type === 'text/csv';
  const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls' || file.type.includes('spreadsheet');

  const isSupported = isPDF || isRTF || isCSV || isExcel;

  if (!isSupported) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Μη υποστηριζόμενος τύπος αρχείου</h3>
          <p className="text-muted-foreground">Το σύστημα υποστηρίζει αρχεία: PDF, RTF, CSV, Excel</p>
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
            <p className="text-lg font-medium">Μετατροπή RTF σε PDF...</p>
            <p className="text-sm text-muted-foreground">Παρακαλώ περιμένετε</p>
          </div>
        </div>
      </Card>
    );
  }

  // Show conversion notice for RTF files
  const showRTFNotice = isRTF && convertedPdfFile;

  // Use Hybrid PDF viewer for production stability
  return (
    <div className="w-full space-y-2">
      {showRTFNotice && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Το RTF αρχείο μετατράπηκε αυτόματα σε PDF για βέλτιστη προβολή
          </AlertDescription>
        </Alert>
      )}
      <BrowserNativePDFViewer
        file={convertedPdfFile}
        onPricesDetected={onPricesDetected}
        onTextExtracted={onTextExtracted}
      />
    </div>
  );
};