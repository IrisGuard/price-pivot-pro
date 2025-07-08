import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface FileUploadSectionProps {
  onFileChange: (file: File | null) => void;
}

export const FileUploadSection = ({ onFileChange }: FileUploadSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    console.log('🔘 Button clicked - triggering file input');
    console.log('🔍 Input ref current:', fileInputRef.current);
    console.log('🔍 Input ref available:', !!fileInputRef.current);
    
    if (fileInputRef.current) {
      console.log('✅ Input element found, triggering click');
      fileInputRef.current.click();
    } else {
      console.error('❌ Input ref is null!');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔥 FILE CHANGE EVENT TRIGGERED!');
    console.log('🔍 Event target:', e.target);
    console.log('🔍 Files:', e.target.files);
    
    const file = e.target.files?.[0] || null;
    console.log('📁 File selected:', file?.name, 'Size:', file?.size, 'Type:', file?.type);
    
    if (file) {
      console.log('✅ Calling onFileChange with file:', file.name);
      onFileChange(file);
    } else {
      console.log('❌ No file selected');
      onFileChange(null);
    }
    
    // Reset the input to allow selecting the same file again
    e.target.value = '';
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">PDF Processor</h1>
            <p className="text-muted-foreground">Επιλέξτε PDF ή RTF αρχείο</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.rtf"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
              data-testid="file-upload"
            />
            
            <Button 
              onClick={handleButtonClick}
              className="w-full" 
              size="lg"
            >
              Επιλογή Αρχείου
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};