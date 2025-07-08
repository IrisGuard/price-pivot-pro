import { useState } from 'react';
import { ProfessionalDocumentViewer } from '@/components/ProfessionalDocumentViewer';
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
  const [contacts, setContacts] = useState<any[]>([]);
  const [emails, setEmails] = useState<string[]>([]);

  return (
    <div className="w-full">
      {/* Universal File Processor */}
      <div className="w-full min-h-screen">
        <ProfessionalDocumentViewer 
          file={file}
          onPricesDetected={onPricesDetected}
          onTextExtracted={setExtractedText}
          onContactsDetected={setContacts}
          onEmailsDetected={setEmails}
        />
      </div>

      {/* Control Panel - Professional A4 Format */}
      <div className="w-full bg-gray-50 border-t print-hide">
        <div className="py-6">
          <div className="mx-auto" style={{ width: '210mm' }}>
            <div 
              className="bg-white shadow-xl border border-gray-300"
              style={{ 
                width: '210mm',
                padding: '15mm'
              }}
            >
              <ProfessionalControlPanel 
                pageWidth={595} // A4 width in points
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
                  // Enhanced export with A4 format preservation
                  window.print();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};