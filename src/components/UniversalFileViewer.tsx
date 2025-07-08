import { useState, useEffect } from 'react';
import { PDFViewer } from './PDFViewer';
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
      console.log('🔍 UNIVERSAL VIEWER: No file provided');
      setConvertedPdfFile(null);
      return;
    }

    console.log('🔍 UNIVERSAL VIEWER: Processing file:', file.name, 'Type:', file.type);

    const processFile = async () => {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        console.log('✅ PDF file detected, using directly');
        setConvertedPdfFile(file);
      } else if (file.name.toLowerCase().endsWith('.rtf')) {
        console.log('🔄 RTF file detected, converting to PDF...');
        setIsConverting(true);
        try {
          const pdfBytes = await convertRTFToPDF(file);
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          const pdfFile = new File([pdfBlob], file.name.replace('.rtf', '.pdf'), {
            type: 'application/pdf'
          });
          console.log('✅ RTF converted to PDF successfully');
          setConvertedPdfFile(pdfFile);
        } catch (error) {
          console.error('❌ RTF conversion failed:', error);
          setConvertedPdfFile(null);
        }
        setIsConverting(false);
      } else {
        console.error('❌ Unsupported file type:', file.name);
        setConvertedPdfFile(null);
      }
    };

    processFile();
  }, [file, convertRTFToPDF]);

  if (!file) {
    console.log('🔍 UNIVERSAL VIEWER: No file - showing empty state');
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
        </div>
      </div>
    );
  }

  // Always use PDF viewer for consistency and control page support
  return (
    <PDFViewer
      pdfFile={convertedPdfFile}
      onPricesDetected={onPricesDetected}
      onTextExtracted={onTextExtracted}
    />
  );
};