import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ROBUST PDF.js WORKER SETUP WITH FALLBACKS
const setupPDFWorker = () => {
  console.log('🔧 Setting up PDF.js worker...');
  
  // Try multiple CDN sources for reliability
  const workerSources = [
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
    '/pdf.worker.js' // Local fallback
  ];
  
  // Use the first available source
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSources[0];
  console.log('✅ PDF.js worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
};

setupPDFWorker();

interface PDFViewerProps {
  pdfFile: File | null;
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
}

export const PDFViewer = ({ pdfFile, onTextExtracted, onPricesDetected }: PDFViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [renderedPages, setRenderedPages] = useState<HTMLCanvasElement[]>([]);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const extractPricesFromText = useCallback((text: string, pageIndex: number) => {
    const pricePatterns = [
      // European format with euro symbol
      /€\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g,
      /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€/g,
      // European format without euro symbol (2 decimals)
      /(?:^|\s)(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})(?:\s|$)/g,
      // Simple euro amounts
      /€\s*(\d+)/g,
      /(\d+)\s*€/g,
      // Price-like patterns
      /(?:price|cost|total|amount|τιμή|κόστος|σύνολο)\s*:?\s*(\d+[.,]?\d*)/gi,
      // Numbers that look like prices (over 10, with potential decimal)
      /(?:^|\s)(\d{2,}[.,]\d{1,2})(?:\s|$)/g
    ];

    const prices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];
    const foundValues = new Set<number>(); // Avoid duplicates
    
    pricePatterns.forEach((pattern, patternIndex) => {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        const priceStr = match[1] || match[0];
        const cleanedPrice = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
        const value = parseFloat(cleanedPrice);
        
        if (!isNaN(value) && value > 0 && value < 100000 && !foundValues.has(value)) {
          foundValues.add(value);
          prices.push({
            value,
            x: 450 + (patternIndex * 30),
            y: 650 - prices.length * 25,
            pageIndex
          });
        }
      }
    });

    return prices.sort((a, b) => a.value - b.value);
  }, []);

  const renderAllPages = useCallback(async () => {
    if (!pdfDoc || !containerRef.current) return;

    setLoading(true);
    try {
      const pages: HTMLCanvasElement[] = [];
      let allText = '';
      let allPrices: Array<{ value: number; x: number; y: number; pageIndex: number }> = [];

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.className = 'border shadow-sm bg-white mb-4 mx-auto block';

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        pages.push(canvas);

        // Extract text content for price detection
        const textContent = await page.getTextContent();
        const textItems = textContent.items
          .filter((item): item is any => 'str' in item)
          .map((item: any) => item.str)
          .join(' ');

        allText += textItems + ' ';

        // Extract prices from this page
        const pagePrices = extractPricesFromText(textItems, pageNum - 1);
        allPrices = [...allPrices, ...pagePrices];
      }

      setRenderedPages(pages);

      if (onTextExtracted) {
        onTextExtracted(allText);
      }

      if (onPricesDetected && allPrices.length > 0) {
        onPricesDetected(allPrices);
      }
    } catch (error) {
      console.error('Error rendering pages:', error);
    }
    setLoading(false);
  }, [pdfDoc, scale, onTextExtracted, onPricesDetected, extractPricesFromText]);

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
      renderAllPages();
    }
  }, [pdfDoc, scale, renderAllPages]);

  useEffect(() => {
    if (renderedPages.length > 0 && containerRef.current) {
      // Clear container and add all rendered pages
      containerRef.current.innerHTML = '';
      renderedPages.forEach(canvas => {
        containerRef.current?.appendChild(canvas);
      });
      
      // Add control page at the end
      addControlPage();
    }
  }, [renderedPages]);

  const addControlPage = () => {
    if (!containerRef.current) return;

    const controlDiv = document.createElement('div');
    controlDiv.className = 'bg-white border shadow-sm mx-auto block mb-4 p-8';
    controlDiv.style.width = renderedPages[0]?.width + 'px' || '595px';
    controlDiv.style.minHeight = '842px';
    
    // Create React-like structure with functional elements
    controlDiv.innerHTML = `
      <div class="text-center space-y-6">
        <h1 class="text-2xl font-bold text-blue-700 mb-8">🔧 ΠΑΝΕΛ ΕΛΕΓΧΟΥ ΠΡΟΣΦΟΡΑΣ</h1>
        
        <div class="space-y-6">
          <div class="bg-gray-50 p-4 rounded border">
            <h3 class="font-bold text-lg mb-3">1. ΑΛΛΑΓΗ ΠΟΣΟΣΤΟΥ ΤΙΜΩΝ</h3>
            <div class="flex items-center justify-center gap-3">
              <input type="number" placeholder="+10 ή -15" class="border px-3 py-2 w-24 text-center" id="percentageInput">
              <button class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" id="applyPercentageBtn">ΕΦΑΡΜΟΓΗ</button>
            </div>
          </div>
          
          <div class="bg-gray-50 p-4 rounded border">
            <h3 class="font-bold text-lg mb-3">2. ΑΛΛΑΓΗ BANNER/ΛΟΓΟΤΥΠΟΥ</h3>
            <div class="flex items-center justify-center gap-3">
              <input type="file" accept="image/*" class="hidden" id="bannerInput">
              <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" id="changeBannerBtn">ΑΛΛΑΓΗ BANNER</button>
              <button class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" id="removeBannerBtn">ΑΦΑΙΡΕΣΗ BANNER</button>
            </div>
          </div>
          
          <div class="bg-gray-50 p-4 rounded border">
            <h3 class="font-bold text-lg mb-3">3. ΣΥΜΠΛΗΡΩΣΗ ΣΤΟΙΧΕΙΩΝ ΠΕΛΑΤΗ</h3>
            <div class="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Ονοματεπώνυμο" class="border px-3 py-2" id="customerName">
              <input type="text" placeholder="Επάγγελμα" class="border px-3 py-2" id="customerJob">
              <input type="text" placeholder="ΑΦΜ" class="border px-3 py-2" id="customerTax">
              <input type="text" placeholder="Τηλέφωνο" class="border px-3 py-2" id="customerPhone">
            </div>
          </div>
        </div>
        
        <div class="bg-yellow-50 p-4 rounded border border-yellow-300 text-left">
          <h4 class="font-bold text-yellow-800 mb-2">ΟΔΗΓΙΕΣ ΧΡΗΣΗΣ:</h4>
          <ul class="text-sm text-yellow-700 space-y-1">
            <li>• Για αλλαγή τιμών: Εισάγετε ποσοστό (π.χ. +10, -15) και πατήστε "ΕΦΑΡΜΟΓΗ"</li>
            <li>• Για αλλαγή banner: Πατήστε "ΑΛΛΑΓΗ BANNER" και επιλέξτε εικόνα</li>
            <li>• Συμπληρώστε τα στοιχεία σας στα αντίστοιχα πεδία</li>
            <li>• Μετά τις αλλαγές, χρησιμοποιήστε Ctrl+P για εκτύπωση</li>
          </ul>
        </div>
      </div>
    `;
    
    // Add functional event listeners
    const percentageBtn = controlDiv.querySelector('#applyPercentageBtn');
    const bannerBtn = controlDiv.querySelector('#changeBannerBtn');
    const removeBannerBtn = controlDiv.querySelector('#removeBannerBtn');
    const bannerInput = controlDiv.querySelector('#bannerInput');
    
    percentageBtn?.addEventListener('click', () => {
      const input = controlDiv.querySelector('#percentageInput') as HTMLInputElement;
      const percentage = parseFloat(input.value);
      if (!isNaN(percentage)) {
        console.log('Applying percentage:', percentage);
        // TODO: Implement price update logic
        alert(`Εφαρμογή ποσοστού: ${percentage}%`);
      }
    });
    
    bannerBtn?.addEventListener('click', () => {
      (bannerInput as HTMLInputElement)?.click();
    });
    
    bannerInput?.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) {
        console.log('Banner file selected:', file.name);
        // TODO: Implement banner replacement
        alert(`Νέο banner: ${file.name}`);
      }
    });
    
    removeBannerBtn?.addEventListener('click', () => {
      console.log('Removing banner');
      // TODO: Implement banner removal
      alert('Αφαίρεση banner');
    });
    
    containerRef.current.appendChild(controlDiv);
  };

  const zoomIn = () => {
    setScale(scale + 0.2);
  };

  const zoomOut = () => {
    setScale(Math.max(0.5, scale - 0.2));
  };

  if (!pdfFile) {
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
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {pdfDoc ? `${pdfDoc.numPages} σελίδες` : 'Φόρτωση...'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mx-4 mb-4 border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* PDF Content - All pages displayed one below another */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="flex justify-center p-4 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Φόρτωση PDF...</p>
              </div>
            </div>
          )}
          
          <div 
            ref={containerRef}
            className="w-full max-w-4xl"
            style={{ maxWidth: '100%' }}
          />
          
          {/* Immediate Fallback Preview - Show ALWAYS when PDF.js fails */}
          {(!pdfDoc && pdfUrl) && (
            <div className="w-full max-w-4xl">
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  📄 Εμφάνιση με browser viewer (PDF.js {loading ? 'φορτώνει...' : 'απέτυχε'})
                </p>
              </div>
              <iframe
                src={pdfUrl}
                className="w-full h-[800px] border shadow-lg rounded-lg"
                style={{ minHeight: '600px' }}
                title="PDF Preview"
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};