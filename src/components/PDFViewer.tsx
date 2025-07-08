import { useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePDFWorkerSetup } from '@/hooks/usePDFWorkerSetup';
import { usePriceExtraction } from '@/hooks/usePriceExtraction';
import { usePDFRendering } from '@/hooks/usePDFRendering';
import { PDFZoomControls } from '@/components/pdf/PDFZoomControls';
import { PDFCanvasContainer } from '@/components/pdf/PDFCanvasContainer';
import { PDFPageWithControls } from '@/components/pdf/PDFPageWithControls';

// Initialize PDF.js worker
const { setupPDFWorker } = usePDFWorkerSetup();
setupPDFWorker();

interface PDFViewerProps {
  pdfFile: File | null;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const PDFViewer = ({ pdfFile, onTextExtracted, onPricesDetected }: PDFViewerProps) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [renderedPages, setRenderedPages] = useState<HTMLCanvasElement[]>([]);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { extractPricesFromText } = usePriceExtraction();
  const { renderAllPages } = usePDFRendering();

  useEffect(() => {
    if (!pdfFile) {
      console.log('🔄 PDF VIEWER: No PDF file provided');
      setPdfUrl(null);
      return;
    }

    console.log('🔄 PDF VIEWER: Starting PDF load for:', pdfFile.name);

    const loadPDF = async () => {
      setLoading(true);
      setError(null);
      
      // Create blob URL for immediate fallback display
      const url = URL.createObjectURL(pdfFile);
      setPdfUrl(url);
      console.log('✅ Blob URL created for immediate preview');
      
      try {
        console.log('🔄 Loading PDF with PDF.js...');
        const arrayBuffer = await pdfFile.arrayBuffer();
        console.log('📄 PDF arrayBuffer size:', arrayBuffer.byteLength);
        
        // Simplified, reliable PDF.js configuration
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: pdfjsLib.VerbosityLevel.ERRORS // Less verbose
        });
        
        // Set timeout for loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('PDF loading timeout')), 10000);
        });
        
        const doc = await Promise.race([loadingTask.promise, timeoutPromise]) as pdfjsLib.PDFDocumentProxy;
        console.log('✅ PDF loaded successfully, pages:', doc.numPages);
        
        if (doc.numPages === 0) {
          throw new Error('PDF has no pages');
        }
        
        setPdfDoc(doc);
        setError(null);
      } catch (error) {
        console.error('❌ PDF.js loading failed:', error);
        setError('PDF.js loading failed - using browser fallback');
        setPdfDoc(null);
        
        // Extract text using fallback method for price detection
        try {
          const text = await pdfFile.text();
          if (onTextExtracted) {
            onTextExtracted(text);
          }
          
          const detectedPrices = extractPricesFromText(text, 0);
          if (onPricesDetected && detectedPrices.length > 0) {
            onPricesDetected(detectedPrices);
          }
        } catch (textError) {
          console.warn('Text extraction also failed:', textError);
        }
      }
      setLoading(false);
    };

    loadPDF();
    
    // Cleanup blob URL on unmount
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfFile, onTextExtracted, onPricesDetected, extractPricesFromText]);

  useEffect(() => {
    if (pdfDoc) {
      renderAllPages(pdfDoc, {
        scale,
        onTextExtracted,
        onPricesDetected
      }).then(pages => {
        setRenderedPages(pages);
      }).catch(error => {
        console.error('Error rendering pages:', error);
      });
    }
  }, [pdfDoc, scale, renderAllPages, onTextExtracted, onPricesDetected]);

  const zoomIn = useCallback(() => {
    setScale(scale + 0.2);
  }, [scale]);

  const zoomOut = useCallback(() => {
    setScale(Math.max(0.5, scale - 0.2));
  }, [scale]);

  if (!pdfFile) {
    console.log('🔍 PDF VIEWER: No PDF file - showing empty state');
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Δεν έχει επιλεχθεί PDF αρχείο</p>
          <p className="text-sm">Επιλέξτε ένα PDF για να ξεκινήσετε την επεξεργασία</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <PDFZoomControls
        scale={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        pageCount={pdfDoc?.numPages}
      />

      {/* Error Alert */}
      {error && (
        <Alert className="mx-4 mb-4 border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <PDFCanvasContainer
        renderedPages={renderedPages}
        loading={loading}
        pdfUrl={pdfUrl}
        pdfDoc={pdfDoc}
      />
      
      {/* Control Page at the end */}
      {renderedPages.length > 0 && (
        <div className="bg-white border shadow-sm mx-auto block mb-4 p-8" style={{ width: (renderedPages[0]?.width || 595) + 'px', minHeight: '842px' }}>
          <div className="text-center space-y-6">
            <h1 className="text-2xl font-bold text-blue-700 mb-8">🔧 ΠΑΝΕΛ ΕΛΕΓΧΟΥ ΠΡΟΣΦΟΡΑΣ</h1>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-bold text-lg mb-3">1. ΑΛΛΑΓΗ ΠΟΣΟΣΤΟΥ ΤΙΜΩΝ</h3>
                <div className="flex items-center justify-center gap-3">
                  <input 
                    type="number" 
                    placeholder="+10 ή -15" 
                    className="border px-3 py-2 w-24 text-center" 
                    id="percentageInput"
                  />
                  <button 
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    onClick={() => {
                      const input = document.querySelector('#percentageInput') as HTMLInputElement;
                      const percentage = parseFloat(input.value);
                      if (!isNaN(percentage)) {
                        alert(`Εφαρμογή ποσοστού: ${percentage}%`);
                      }
                    }}
                  >
                    ΕΦΑΡΜΟΓΗ
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-bold text-lg mb-3">2. ΑΛΛΑΓΗ BANNER/ΛΟΓΟΤΥΠΟΥ</h3>
                <div className="flex items-center justify-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    id="bannerInput"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        alert(`Νέο banner: ${file.name}`);
                      }
                    }}
                  />
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => {
                      const input = document.querySelector('#bannerInput') as HTMLInputElement;
                      input?.click();
                    }}
                  >
                    ΑΛΛΑΓΗ BANNER
                  </button>
                  <button 
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    onClick={() => alert('Αφαίρεση banner')}
                  >
                    ΑΦΑΙΡΕΣΗ BANNER
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-bold text-lg mb-3">3. ΣΥΜΠΛΗΡΩΣΗ ΣΤΟΙΧΕΙΩΝ ΠΕΛΑΤΗ</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Ονοματεπώνυμο" className="border px-3 py-2" id="customerName" />
                  <input type="text" placeholder="Επάγγελμα" className="border px-3 py-2" id="customerJob" />
                  <input type="text" placeholder="ΑΦΜ" className="border px-3 py-2" id="customerTax" />
                  <input type="text" placeholder="Τηλέφωνο" className="border px-3 py-2" id="customerPhone" />
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded border border-yellow-300 text-left">
              <h4 className="font-bold text-yellow-800 mb-2">ΟΔΗΓΙΕΣ ΧΡΗΣΗΣ:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Για αλλαγή τιμών: Εισάγετε ποσοστό (π.χ. +10, -15) και πατήστε "ΕΦΑΡΜΟΓΗ"</li>
                <li>• Για αλλαγή banner: Πατήστε "ΑΛΛΑΓΗ BANNER" και επιλέξτε εικόνα</li>
                <li>• Συμπληρώστε τα στοιχεία σας στα αντίστοιχα πεδία</li>
                <li>• Μετά τις αλλαγές, χρησιμοποιήστε Ctrl+P για εκτύπωση</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};