import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFSidebarProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  currentPageIndex: number;
  onPageSelect: (pageIndex: number) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export const PDFSidebar = ({ 
  pdfDoc, 
  currentPageIndex, 
  onPageSelect, 
  collapsed = false,
  onToggle 
}: PDFSidebarProps) => {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

  useEffect(() => {
    if (!pdfDoc) {
      setThumbnails([]);
      return;
    }

    const generateThumbnails = async () => {
      setLoading(true);
      const thumbs: string[] = [];

      try {
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.2 }); // Small scale for thumbnails
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
          
          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/png');
          thumbs.push(dataUrl);
          
          // Store canvas reference for potential reuse
          canvasRefs.current.set(pageNum - 1, canvas);
        }
        
        setThumbnails(thumbs);
      } catch (error) {
        console.error('Error generating thumbnails:', error);
      }
      setLoading(false);
    };

    generateThumbnails();
  }, [pdfDoc]);

  if (!pdfDoc) {
    return (
      <div className={`${collapsed ? 'w-14' : 'w-60'} bg-gray-50 border-r flex flex-col items-center justify-center`}>
        <p className="text-sm text-muted-foreground text-center p-4">
          {!collapsed && 'Δεν έχει φορτωθεί PDF'}
        </p>
      </div>
    );
  }

  return (
    <div className={`${collapsed ? 'w-14' : 'w-60'} bg-gray-50 border-r flex flex-col transition-all duration-200`}>
      {/* Toggle Button */}
      <div className="p-2 border-b bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {!collapsed && (
        <>
          {/* Header */}
          <div className="p-3 bg-white border-b">
            <h3 className="text-sm font-medium text-gray-900">
              Σελίδες ({pdfDoc.numPages})
            </h3>
          </div>

          {/* Thumbnails */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {loading && (
                <div className="text-center p-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-xs text-muted-foreground">Δημιουργία thumbnails...</p>
                </div>
              )}
              
              {thumbnails.map((thumbnail, index) => (
                <button
                  key={index}
                  onClick={() => onPageSelect(index)}
                  className={`
                    w-full p-2 rounded-lg border transition-all duration-200 hover:shadow-md
                    ${currentPageIndex === index 
                      ? 'bg-primary/10 border-primary shadow-sm' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="relative">
                    <img
                      src={thumbnail}
                      alt={`Σελίδα ${index + 1}`}
                      className="w-full h-auto rounded border shadow-sm"
                      style={{ aspectRatio: '595/842' }}
                    />
                    <div className={`
                      absolute bottom-1 right-1 px-2 py-1 text-xs rounded
                      ${currentPageIndex === index 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-black/70 text-white'
                      }
                    `}>
                      {index + 1}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
};