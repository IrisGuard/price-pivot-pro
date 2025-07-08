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
    <div className="min-h-screen bg-background">
      {/* Professional Document Viewer with Dark Background */}
      <div className="w-full bg-background">
        <ProfessionalDocumentViewer 
          file={file}
          onPricesDetected={onPricesDetected}
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
                window.print();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};