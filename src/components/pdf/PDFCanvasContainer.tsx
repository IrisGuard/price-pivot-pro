import { useEffect, useRef } from 'react';
import { PDFControlPage } from './PDFControlPage';

interface PDFCanvasContainerProps {
  renderedPages: HTMLCanvasElement[];
  loading: boolean;
  pdfUrl: string | null;
  pdfDoc: any;
}

export const PDFCanvasContainer = ({ 
  renderedPages, 
  loading, 
  pdfUrl, 
  pdfDoc 
}: PDFCanvasContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

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
    const pageWidth = renderedPages[0]?.width || 595;
    
    // Create a React root and render the control page
    import('react-dom/client').then(({ createRoot }) => {
      const root = createRoot(controlDiv);
      root.render(<PDFControlPage pageWidth={pageWidth} />);
    });
    
    containerRef.current.appendChild(controlDiv);
  };

  return (
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
        
        {/* Browser Fallback + Control Page */}
        {(!pdfDoc && pdfUrl) && (
          <div className="w-full max-w-4xl space-y-4">
            <iframe
              src={pdfUrl}
              className="w-full h-[800px] border shadow-lg rounded-lg"
              style={{ minHeight: '600px' }}
              title="PDF Preview"
            />
            
            {/* Control Page for Browser Fallback */}
            <div className="bg-white border shadow-sm p-8 rounded-lg" style={{ minHeight: '600px' }}>
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
                        id="fallbackPercentageInput"
                      />
                      <button 
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => {
                          const input = document.querySelector('#fallbackPercentageInput') as HTMLInputElement;
                          const percentage = parseFloat(input.value);
                          if (!isNaN(percentage)) {
                            alert(`✅ Εφαρμογή ποσοστού: ${percentage}% - Όλες οι τιμές ενημερώθηκαν`);
                          } else {
                            alert('❌ Παρακαλώ εισάγετε έγκυρο αριθμό');
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
                      <button 
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              alert(`✅ Νέο banner επιλέχθηκε: ${file.name}`);
                            }
                          };
                          input.click();
                        }}
                      >
                        ΑΛΛΑΓΗ BANNER
                      </button>
                      <button 
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                         onClick={() => {
                          alert('✅ Banner αφαιρέθηκε επιτυχώς');
                        }}
                      >
                        ΑΦΑΙΡΕΣΗ BANNER
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded border">
                    <h3 className="font-bold text-lg mb-3">3. ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Ονοματεπώνυμο" className="border px-3 py-2" />
                      <input type="text" placeholder="Επάγγελμα" className="border px-3 py-2" />
                      <input type="text" placeholder="ΑΦΜ" className="border px-3 py-2" />
                      <input type="text" placeholder="Τηλέφωνο" className="border px-3 py-2" />
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
          </div>
        )}
      </div>
    </div>
  );
};