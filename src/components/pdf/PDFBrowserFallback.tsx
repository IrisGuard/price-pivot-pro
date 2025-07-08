import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download } from 'lucide-react';

interface PDFBrowserFallbackProps {
  pdfUrl: string;
}

export const PDFBrowserFallback = ({ pdfUrl }: PDFBrowserFallbackProps) => {
  const [embedSupported, setEmbedSupported] = useState(true);

  useEffect(() => {
    // Test if iframe embedding works in this browser/context
    const testEmbed = () => {
      try {
        // Some browsers/hosting environments don't support PDF embed
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        
        // Mobile browsers often don't support PDF embed well
        if (isMobile) {
          setEmbedSupported(false);
        }
      } catch (error) {
        setEmbedSupported(false);
      }
    };

    testEmbed();
  }, []);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  if (!embedSupported) {
    return (
      <Card className="w-full border shadow-sm p-8 text-center">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">PDF Ready για Προβολή</h3>
          <p className="text-muted-foreground">
            Το PDF είναι έτοιμο. Επιλέξτε έναν από τους παρακάτω τρόπους προβολής:
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleOpenInNewTab} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Άνοιγμα σε Νέα Καρτέλα
            </Button>
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Λήψη PDF
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full border shadow-sm">
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
        className="w-full h-[800px] border-0 rounded-lg"
        style={{ 
          minHeight: '600px',
          overflow: 'hidden'
        }}
        title="PDF Preview"
        onError={() => setEmbedSupported(false)}
      />
      <div className="p-4 border-t bg-gray-50 flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={handleOpenInNewTab} className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Άνοιγμα σε Νέα Καρτέλα
        </Button>
        <Button size="sm" variant="outline" onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Λήψη PDF
        </Button>
      </div>
    </Card>
  );
};