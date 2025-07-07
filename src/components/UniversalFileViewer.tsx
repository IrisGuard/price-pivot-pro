import { PDFViewer } from './PDFViewer';
import { RTFViewer } from './RTFViewer';

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
  if (!file) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[600px] border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Δεν έχει επιλεχθεί αρχείο</p>
          <p className="text-sm">Επιλέξτε PDF ή RTF αρχείο για να ξεκινήσετε την επεξεργασία</p>
        </div>
      </div>
    );
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (fileExtension === 'pdf') {
    return (
      <PDFViewer 
        pdfFile={file}
        onTextExtracted={onTextExtracted}
        onPricesDetected={onPricesDetected}
      />
    );
  }

  if (fileExtension === 'rtf') {
    return (
      <RTFViewer 
        rtfFile={file}
        onTextExtracted={onTextExtracted}
        onPricesDetected={onPricesDetected}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center min-h-[600px] border-2 border-dashed border-destructive/25 rounded-lg">
      <div className="text-center text-destructive">
        <p className="text-lg">Μη υποστηριζόμενος τύπος αρχείου</p>
        <p className="text-sm">Υποστηρίζονται μόνο PDF και RTF αρχεία</p>
      </div>
    </div>
  );
};