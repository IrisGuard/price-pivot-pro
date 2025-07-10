import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export const FileEmptyState = () => {
  return (
    <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
      <div className="text-center text-muted-foreground">
        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">Δεν έχει επιλεχθεί αρχείο</p>
        <p className="text-sm">Επιλέξτε ένα PDF, RTF, CSV ή Excel για να ξεκινήσετε</p>
      </div>
    </Card>
  );
};