import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, ZoomIn, ZoomOut } from 'lucide-react';
import { CSVProcessor } from '@/lib/csv/csvProcessor';
import { toast } from '@/hooks/use-toast';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface SpreadsheetViewerProps {
  file: File;
  onProcessed?: (data: any) => void;
}

export const SpreadsheetViewer = ({ file, onProcessed }: SpreadsheetViewerProps) => {
  const [data, setData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1.0);
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    processFile();
  }, [file]);

  const processFile = async () => {
    setLoading(true);
    try {
      const processor = new CSVProcessor();
      const result = await processor.processCSVFile(file);
      
      // Get raw data for display
      const rawData = await getRawSpreadsheetData(file);
      
      if (rawData.length > 0) {
        setHeaders(rawData[0].map((h: any, i: number) => String(h) || `Column ${i + 1}`));
        setData(rawData.slice(1));
      }
      
      setMetadata(result.metadata);
      
      if (onProcessed) {
        onProcessed(result);
      }
      
      toast({
        title: "✅ Spreadsheet φόρτωση",
        description: `Φορτώθηκαν ${rawData.length - 1} σειρές με ${rawData[0]?.length || 0} στήλες`,
      });
      
    } catch (error) {
      toast({
        title: "❌ Σφάλμα φόρτωσης",
        description: error instanceof Error ? error.message : "Άγνωστο σφάλμα",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRawSpreadsheetData = async (file: File): Promise<any[][]> => {
    if (file.name.toLowerCase().endsWith('.csv')) {
      return new Promise((resolve, reject) => {
        import('papaparse').then(Papa => {
          Papa.default.parse(file, {
            complete: (results: any) => resolve(results.data),
            error: (error: any) => reject(error),
            skipEmptyLines: true,
            encoding: 'UTF-8'
          });
        }).catch(reject);
      });
    } else {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      return XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false 
      });
    }
  };

  const exportToPDF = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // A4 page setup
      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();
      const margin = 50;
      const cellHeight = 20;
      const fontSize = 9;
      
      // Calculate column widths
      const availableWidth = width - (margin * 2);
      const colWidth = availableWidth / headers.length;
      
      let currentY = height - margin;
      
      // Draw headers
      headers.forEach((header, colIndex) => {
        const x = margin + (colIndex * colWidth);
        
        // Header background
        page.drawRectangle({
          x,
          y: currentY - cellHeight,
          width: colWidth,
          height: cellHeight,
          color: rgb(0.9, 0.9, 0.9),
          borderColor: rgb(0, 0, 0),
          borderWidth: 1
        });
        
        // Header text
        page.drawText(String(header).substring(0, 15), {
          x: x + 5,
          y: currentY - 15,
          size: fontSize,
          font: boldFont,
          color: rgb(0, 0, 0)
        });
      });
      
      currentY -= cellHeight;
      
      // Draw data rows
      const maxRows = Math.floor((currentY - margin) / cellHeight);
      const displayData = data.slice(0, maxRows);
      
      displayData.forEach((row, rowIndex) => {
        headers.forEach((_, colIndex) => {
          const x = margin + (colIndex * colWidth);
          const cellData = String(row[colIndex] || '');
          
          // Cell border
          page.drawRectangle({
            x,
            y: currentY - cellHeight,
            width: colWidth,
            height: cellHeight,
            color: rgb(1, 1, 1),
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.5
          });
          
          // Cell text
          page.drawText(cellData.substring(0, 15), {
            x: x + 5,
            y: currentY - 15,
            size: fontSize,
            font,
            color: rgb(0, 0, 0)
          });
        });
        
        currentY -= cellHeight;
      });
      
      // If more data exists, add note
      if (data.length > maxRows) {
        page.drawText(`... και ${data.length - maxRows} επιπλέον σειρές`, {
          x: margin,
          y: currentY - 20,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5)
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace(/\.[^/.]+$/, '')}_spreadsheet.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "📄 PDF Εξαγωγή",
        description: "Το spreadsheet εξήχθη σε PDF επιτυχώς",
      });
      
    } catch (error) {
      toast({
        title: "❌ Σφάλμα εξαγωγής",
        description: "Δεν ήταν δυνατή η εξαγωγή σε PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Φόρτωση spreadsheet...</p>
            <p className="text-sm text-muted-foreground">Παρακαλώ περιμένετε</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b px-4 py-3 flex items-center justify-between pdf-header print-hide">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">
            {metadata?.fileType?.toUpperCase()} Spreadsheet Viewer
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setScale(s => Math.min(2.0, s + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button onClick={exportToPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Εξαγωγή PDF
          </Button>
        </div>
      </div>

      {/* Spreadsheet Content */}
      <div className="flex-1 overflow-auto bg-muted/20 p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="shadow-lg bg-white">
            <div 
              className="overflow-auto"
              style={{ 
                transform: `scale(${scale})`, 
                transformOrigin: 'top left',
                width: `${100 / scale}%`,
                height: `${100 / scale}%`
              }}
            >
              {/* Professional Spreadsheet Table */}
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    {headers.map((header, index) => (
                      <th
                        key={index}
                        className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 min-w-[120px]"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {headers.map((_, colIndex) => (
                        <td
                          key={colIndex}
                          className="border border-gray-300 px-3 py-2 text-gray-900"
                        >
                          {String(row[colIndex] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          
          {/* Metadata Info */}
          {metadata && (
            <Card className="mt-4 p-4 bg-muted/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Αρχείο:</span>
                  <p className="text-muted-foreground">{metadata.fileName}</p>
                </div>
                <div>
                  <span className="font-medium">Τύπος:</span>
                  <p className="text-muted-foreground">{metadata.fileType.toUpperCase()}</p>
                </div>
                <div>
                  <span className="font-medium">Σειρές:</span>
                  <p className="text-muted-foreground">{metadata.rowCount}</p>
                </div>
                <div>
                  <span className="font-medium">Στήλες:</span>
                  <p className="text-muted-foreground">{metadata.columnCount}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};