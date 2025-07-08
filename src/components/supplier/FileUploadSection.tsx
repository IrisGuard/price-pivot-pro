import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useFileValidation } from "@/hooks/useFileValidation";

interface FileUploadSectionProps {
  onFileChange: (file: File | null) => void;
}

export const FileUploadSection = ({ onFileChange }: FileUploadSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { validateFile, validationError } = useFileValidation();

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    
    if (!validation.isValid) {
      alert(`❌ ${validation.error}`);
      return;
    }
    
    onFileChange(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    // Reset input value for re-selection
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div 
            className="text-center space-y-6 p-8 border-2 border-dashed rounded-lg transition-colors border-muted-foreground/25 hover:border-primary"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
            
            <div>
              <h1 className="text-2xl font-bold mb-2">🔒 PDF Processor</h1>
              <p className="text-muted-foreground">
                Επιλέξτε PDF ή RTF αρχείο για δημιουργία σφραγισμένης προσφοράς
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.rtf"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              <Button 
                onClick={handleButtonClick}
                className="w-full" 
                size="lg"
                variant="default"
              >
                📁 Επιλογή Αρχείου
              </Button>
              
              <p className="text-xs text-muted-foreground">
                ή σύρετε το αρχείο εδώ
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};