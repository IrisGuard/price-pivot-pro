import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface FileProcessingStatusProps {
  stage: string;
  progress: number;
}

export const FileProcessingStatus = ({ stage, progress }: FileProcessingStatusProps) => {
  return (
    <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-lg font-medium">Επεξεργασία αρχείου...</p>
            <p className="text-sm text-muted-foreground">{stage || 'Προετοιμασία...'}</p>
          </div>
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span>Πρόοδος</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </Card>
  );
};