import { useState, useEffect } from 'react';
import { SimplePDFViewer } from './pdf/SimplePDFViewer';
import { useRTFToPDFConverter } from '@/hooks/useRTFToPDFConverter';

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
        setConvertedPdfFile(null);
      }
    };

    processFile();
  }, [file, convertRTFToPDF]);

  if (!file) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Δεν έχει επιλεχθεί αρχείο</p>
      </div>
    );
  }

  if (isConverting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Μετατροπή RTF σε PDF...</p>
          <p className="text-xs text-muted-foreground">Παρακαλώ περιμένετε...</p>
        </div>
      </div>
    );
  }

  // Use Simple PDF viewer for Phase 1 stability
  return convertedPdfFile ? (
    <SimplePDFViewer file={convertedPdfFile} />
  ) : (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-muted-foreground">Μη υποστηριζόμενος τύπος αρχείου</p>
    </div>
  );
};