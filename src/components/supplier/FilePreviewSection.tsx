import { useState, useCallback } from 'react';
import { UniversalFileProcessor } from '@/components/UniversalFileProcessor';
import { ProfessionalControlPanel } from '@/components/pdf/ProfessionalControlPanel';
import { usePDFProcessor } from '@/hooks/usePDFProcessor';

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

interface FilePreviewSectionProps {
  file: File;
  onPricesDetected: (prices: PriceData[]) => void;
}

export const FilePreviewSection = ({ file, onPricesDetected }: FilePreviewSectionProps) => {
  const [extractedText, setExtractedText] = useState<string>('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [detectedPrices, setDetectedPrices] = useState<PriceData[]>([]);
  const [currentPercentage, setCurrentPercentage] = useState<number>(0);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [customerData, setCustomerData] = useState({
    name: '',
    profession: '',
    taxId: '',
    phone: ''
  });

  const { createInteractivePDF } = usePDFProcessor();

  const handlePricesDetected = useCallback((prices: PriceData[]) => {
    setDetectedPrices(prices);
    onPricesDetected(prices);
  }, [onPricesDetected]);

  const handlePercentageChange = useCallback((percentage: number) => {
    setCurrentPercentage(percentage);
    // Real-time price updates would go here
  }, []);

  const handleBannerChange = useCallback((file: File) => {
    setBannerFile(file);
  }, []);

  const handleCustomerDataChange = useCallback((data: any) => {
    setCustomerData(data);
  }, []);

  const handleExportPDF = useCallback(async () => {
    try {
      await createInteractivePDF({
        factoryFile: file,
        percentage: currentPercentage,
        detectedPrices,
        currentPrices: detectedPrices.map(price => ({
          ...price,
          value: Math.round(price.value * (1 + currentPercentage / 100) * 100) / 100
        }))
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [file, currentPercentage, detectedPrices, createInteractivePDF]);

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Document Viewer with Dark Background */}
      <div className="w-full bg-background">
        <UniversalFileProcessor 
          file={file}
          onPricesDetected={handlePricesDetected}
          onTextExtracted={setExtractedText}
          onContactsDetected={setContacts}
          onEmailsDetected={setEmails}
        />
      </div>

      {/* Control Panel - Professional A4 Format */}
      <div className="w-full bg-background py-8">
        <div className="flex justify-center">
          <div 
            className="bg-white shadow-2xl border border-border print:shadow-none print:border-none"
            style={{ 
              width: '210mm',
              minHeight: '297mm',
              padding: '20mm',
              borderRadius: '8px'
            }}
          >
            <ProfessionalControlPanel 
              pageWidth={595} // A4 width in points  
              pdfFile={file}
              onPercentageChange={handlePercentageChange}
              onBannerChange={handleBannerChange}
              onCustomerDataChange={handleCustomerDataChange}
              onExportCleanPDF={handleExportPDF}
            />
          </div>
        </div>
      </div>
    </div>
  );
};