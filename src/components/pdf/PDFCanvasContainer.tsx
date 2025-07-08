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
  );
};