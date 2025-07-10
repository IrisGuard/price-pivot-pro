import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FilePreview } from '@/components/file/FilePreview';

interface FileUploadSectionProps {
  onFileChange: (file: File | null) => void;
}

export const FileUploadSection = ({ onFileChange }: FileUploadSectionProps) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const handleFileSelect = useCallback((files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type - Support PDF, RTF, CSV, Excel
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const supportedTypes = ['pdf', 'rtf', 'csv', 'xlsx', 'xls'];
      const isPDF = fileExtension === 'pdf' || file.type === 'application/pdf';
      const isRTF = fileExtension === 'rtf' || file.type === 'text/rtf';
      const isCSV = fileExtension === 'csv' || file.type === 'text/csv';
      const isExcel = fileExtension?.match(/^(xlsx|xls)$/) || file.type.includes('spreadsheet');
      
      if (!isPDF && !isRTF && !isCSV && !isExcel) {
        console.error('❌ Invalid file type:', file.type, 'Extension:', fileExtension);
        alert('Παρακαλώ επιλέξτε PDF, RTF, CSV ή Excel αρχείο');
        return;
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        console.error('❌ File too large:', Math.round(file.size/1024/1024), 'MB');
        alert('Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: 50MB');
        return;
      }

      console.log('✅ File validation passed:', file.name, 'Size:', Math.round(file.size/1024), 'KB');
      console.log('🔄 Calling onFileChange with file:', file.name);
      
      setUploadedFile(file);
      onFileChange(file);
    }
  }, [onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileSelect,
    accept: {
      'application/pdf': ['.pdf'],
      'text/rtf': ['.rtf'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
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
            <strong>Υποστηριζόμενα αρχεία:</strong> PDF, RTF, CSV, Excel (XLSX/XLS)
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
                  Σύρετε και αποθέστε PDF, RTF, CSV ή Excel αρχείο ή κάντε κλικ για επιλογή
                </p>
              </div>
              
              <Button size="lg" variant="outline">
                <Upload className="h-5 w-5 mr-2" />
                Επιλογή αρχείου
              </Button>
              
              <div className="text-sm text-muted-foreground">
                <p>Μέγιστο μέγεθος: 50MB</p>
                <p>Υποστηριζόμενοι τύποι: PDF, RTF, CSV, Excel</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced File Preview */}
        {uploadedFile && (
          <div className="mt-6">
            <FilePreview 
              file={uploadedFile} 
              onRemove={() => {
                setUploadedFile(null);
                onFileChange(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};