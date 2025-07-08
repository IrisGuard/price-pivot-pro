import { useState } from 'react';
import { UniversalFileProcessor } from '@/components/UniversalFileProcessor';
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
        <UniversalFileProcessor 
          file={file}
          onPricesDetected={onPricesDetected}
          onTextExtracted={setExtractedText}
          onContactsDetected={setContacts}
          onEmailsDetected={setEmails}
        />
      </div>

      {/* Note: Control Panel is now embedded in the PDF itself as the last page */}
      <div className="w-full bg-gray-100 border-t py-4">
        <div className="flex justify-center">
          <div className="text-center text-sm text-muted-foreground">
            <p>📄 Το Panel Ελέγχου είναι ενσωματωμένο στο PDF ως τελευταία σελίδα</p>
            <p>Ο πελάτης μπορεί να επεξεργαστεί τα πεδία απευθείας στο PDF</p>
          </div>
        </div>
      </div>
    </div>
  );
};