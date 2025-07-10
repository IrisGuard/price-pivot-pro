import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, FileSpreadsheet, File, Download } from 'lucide-react';

interface FilePreviewProps {
  file: File;
  onRemove?: () => void;
}

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return FileText;
  if (type.includes('rtf')) return FileText;
  if (type.includes('csv') || type.includes('excel') || type.includes('spreadsheet')) return FileSpreadsheet;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileTypeLabel = (type: string): string => {
  if (type.includes('pdf')) return 'PDF Document';
  if (type.includes('rtf')) return 'RTF Document';
  if (type.includes('csv')) return 'CSV Spreadsheet';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'Excel Spreadsheet';
  return 'Document';
};

export const FilePreview = ({ file, onRemove }: FilePreviewProps) => {
  const IconComponent = getFileIcon(file.type);
  const fileTypeLabel = getFileTypeLabel(file.type);

  return (
    <Card className="p-4 border-2 border-dashed border-primary/20 bg-primary/5">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="p-3 bg-primary/10 rounded-lg">
            <IconComponent className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <p className="text-sm font-medium text-foreground truncate">
              {file.name}
            </p>
            <Badge variant="secondary" className="text-xs">
              {fileTypeLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)} • Ανεβάστηκε επιτυχώς
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-xs text-destructive hover:text-destructive/80"
            >
              Αφαίρεση
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};