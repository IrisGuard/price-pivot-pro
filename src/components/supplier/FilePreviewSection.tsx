import { useState } from 'react';
import { HybridPDFViewer } from '@/components/pdf/HybridPDFViewer';
import { ProfessionalControlPanel } from '@/components/pdf/ProfessionalControlPanel';

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

  return (
    <div className="w-full">
      {/* PDF Viewer */}
      <div className="w-full min-h-screen">
        <HybridPDFViewer 
          pdfFile={file}
          onPricesDetected={onPricesDetected}
          onTextExtracted={setExtractedText}
        />
      </div>

      {/* Control Panel - Aligned with PDF Viewer */}
      <div className="w-full bg-gray-50 border-t">
        <div className="flex justify-center py-6">
          <div className="w-full max-w-4xl px-6">
            <ProfessionalControlPanel 
              pageWidth={595} // A4 width
              isAdminMode={true}
              onPercentageChange={(percentage) => {
                console.log('Percentage change:', percentage);
              }}
              onBannerChange={(file) => {
                console.log('Banner change:', file);
              }}
              onCustomerDataChange={(data) => {
                console.log('Customer data change:', data);
              }}
              onExportCleanPDF={async () => {
                console.log('Export clean PDF requested');
                // Basic export functionality
                window.print();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};