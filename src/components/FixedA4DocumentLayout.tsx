import { ReactNode } from 'react';

interface FixedA4DocumentLayoutProps {
  children: ReactNode;
  showControlPanel?: boolean;
  controlPanel?: ReactNode;
}

export const FixedA4DocumentLayout = ({ 
  children, 
  showControlPanel = true, 
  controlPanel 
}: FixedA4DocumentLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {/* Fixed A4 Container */}
      <div className="mx-auto max-w-none" style={{ width: '210mm' }}>
        
        {/* Main Document Content */}
        <div 
          className="bg-white shadow-xl border border-gray-300 mx-auto"
          style={{ 
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm',
            fontSize: '12pt',
            lineHeight: '1.4',
            fontFamily: 'Times, serif'
          }}
        >
          {children}
        </div>

        {/* Control Panel (if shown) */}
        {showControlPanel && controlPanel && (
          <div 
            className="bg-white shadow-xl border border-gray-300 mx-auto mt-4"
            style={{ 
              width: '210mm',
              padding: '15mm'
            }}
          >
            {controlPanel}
          </div>
        )}
      </div>

      {/* Print-specific styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          
          .print-hide {
            display: none !important;
          }
          
          .fixed-a4-container {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always;
          }
          
          .control-panel-print {
            page-break-before: always;
            width: 210mm !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
        
        @page {
          size: A4;
          margin: 0;
        }
        `
      }} />
    </div>
  );
};