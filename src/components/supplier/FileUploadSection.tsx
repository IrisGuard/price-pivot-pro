import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadSectionProps {
  onFileChange: (file: File | null) => void;
}

export const FileUploadSection = ({ onFileChange }: FileUploadSectionProps) => {
  const handleFileSelect = useCallback((files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        alert('Παρακαλώ επιλέξτε ένα PDF αρχείο');
        return;
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: 50MB');
        return;
      }
      
      onFileChange(file);
    }
  }, [onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileSelect,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Alert className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Υποστηριζόμενα αρχεία:</strong> PDF μόνο
          </AlertDescription>
        </Alert>

        <Card className="p-12">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-6">
              <div className="flex justify-center">
                {isDragActive ? (
                  <Upload className="h-20 w-20 text-primary animate-bounce" />
                ) : (
                  <FileText className="h-20 w-20 text-muted-foreground" />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">
                  {isDragActive ? 'Αποθέστε το αρχείο εδώ' : 'Επιλέξτε αρχείο προσφοράς'}
                </h3>
                <p className="text-muted-foreground">
                  Σύρετε και αποθέστε ένα PDF αρχείο ή κάντε κλικ για επιλογή
                </p>
              </div>
              
              <Button size="lg" variant="outline">
                <Upload className="h-5 w-5 mr-2" />
                Επιλογή αρχείου
              </Button>
              
              <div className="text-sm text-muted-foreground">
                <p>Μέγιστο μέγεθος: 50MB</p>
                <p>Υποστηριζόμενοι τύποι: PDF</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};