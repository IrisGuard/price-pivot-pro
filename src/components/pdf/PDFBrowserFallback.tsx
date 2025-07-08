import { Card } from '@/components/ui/card';

interface PDFBrowserFallbackProps {
  pdfUrl: string;
}

export const PDFBrowserFallback = ({ pdfUrl }: PDFBrowserFallbackProps) => {
  return (
    <Card className="w-full border shadow-sm">
      <iframe
        src={pdfUrl}
        className="w-full h-[800px] border-0 rounded-lg"
        style={{ minHeight: '600px' }}
        title="PDF Preview"
      />
    </Card>
  );
};