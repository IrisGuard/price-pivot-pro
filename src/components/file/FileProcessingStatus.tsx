import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileText, FileSpreadsheet, File } from 'lucide-react';

interface FileProcessingStatusProps {
  stage: string;
  progress: number;
  fileType?: string;
}

const getFileIcon = (fileType?: string) => {
  if (!fileType) return File;
  
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('rtf')) return FileText;
  if (fileType.includes('csv') || fileType.includes('excel') || fileType.includes('spreadsheet')) return FileSpreadsheet;
  return File;
};

const getFileTypeMessage = (fileType?: string) => {
  if (!fileType) return 'Ανάλυση τύπου αρχείου...';
  
  if (fileType.includes('pdf')) return 'Επεξεργασία PDF - Εξαγωγή κειμένου και τιμών...';
  if (fileType.includes('rtf')) return 'Μετατροπή RTF σε PDF...';
  if (fileType.includes('csv')) return 'Ανάλυση CSV δεδομένων...';
  if (fileType.includes('excel')) return 'Επεξεργασία Excel αρχείου...';
  return 'Επεξεργασία αρχείου...';
};

export const FileProcessingStatus = ({ stage, progress, fileType }: FileProcessingStatusProps) => {
  const IconComponent = getFileIcon(fileType);
  const typeMessage = getFileTypeMessage(fileType);

  return (
    <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <IconComponent className="h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          {progress > 0 && (
            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
              {Math.round(progress)}%
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-lg font-medium">{typeMessage}</p>
            <p className="text-sm text-muted-foreground">{stage || 'Προετοιμασία...'}</p>
          </div>
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span>Πρόοδος</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          <div className="text-xs text-muted-foreground">
            {progress < 30 && 'Φόρτωση αρχείου...'}
            {progress >= 30 && progress < 60 && 'Ανάλυση περιεχομένου...'}
            {progress >= 60 && progress < 90 && 'Εξαγωγή δεδομένων...'}
            {progress >= 90 && 'Ολοκλήρωση...'}
          </div>
        </div>
      </div>
    </Card>
  );
};