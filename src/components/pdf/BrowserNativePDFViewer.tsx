import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BrowserNativePDFViewerProps {
  file: File | null;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const BrowserNativePDFViewer = ({ 
  file, 
  onTextExtracted, 
  onPricesDetected 
}: BrowserNativePDFViewerProps) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setFileUrl(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create object URL for immediate display
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      
      // Mock text extraction for compatibility
      setTimeout(() => {
        if (onTextExtracted) {
          onTextExtracted(`Αρχείο ${file.name} φορτώθηκε επιτυχώς`);
        }
        if (onPricesDetected) {
          // No actual price detection, but callback expected
          onPricesDetected([]);
        }
        setLoading(false);
      }, 500);

      // Cleanup on unmount
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      setError('Σφάλμα φόρτωσης αρχείου');
      setLoading(false);
    }
  }, [file, onTextExtracted, onPricesDetected]);

  const handleDownload = () => {
    if (!file || !fileUrl) return;
    
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!file) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Δεν έχει επιλεχθεί αρχείο</p>
          <p className="text-sm">Επιλέξτε ένα αρχείο για να ξεκινήσετε</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Σφάλμα φόρτωσης</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Κατέβασμα αρχείου
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full bg-background py-8">
      {/* Header with controls */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold">Προεπισκόπηση Αρχείου</h2>
          <div className="flex gap-2">
            <Button onClick={handleOpenInNewTab} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Άνοιγμα σε Νέα Καρτέλα
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Κατέβασμα
            </Button>
          </div>
        </div>
        
        <Alert className="max-w-2xl">
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Αρχείο: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </AlertDescription>
        </Alert>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center mb-6">
          <div className="bg-white shadow-2xl border border-border" style={{ width: '210mm', minHeight: '400px' }}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 p-8">
                <div className="animate-spin h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto"></div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-foreground">Φόρτωση αρχείου...</p>
                  <p className="text-sm text-muted-foreground">Παρακαλώ περιμένετε</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Display - Professional A4 Format */}
      {fileUrl && !loading && (
        <div className="flex justify-center">
          <div 
            className="bg-white shadow-2xl border border-border"
            style={{ 
              width: '210mm',
              minHeight: '297mm',
              maxHeight: '80vh'
            }}
          >
            <iframe
              src={fileUrl}
              width="100%"
              height="100%"
              style={{ minHeight: '800px' }}
              className="border-0"
              title="File Preview"
              onLoad={() => setLoading(false)}
              onError={() => setError('Σφάλμα φόρτωσης αρχείου')}
            />
          </div>
        </div>
      )}
    </div>
  );
};