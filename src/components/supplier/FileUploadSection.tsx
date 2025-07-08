import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FileUploadSectionProps {
  onFileChange: (file: File | null) => void;
}

export const FileUploadSection = ({ onFileChange }: FileUploadSectionProps) => {
  const handleFileSelect = (file: File) => {
    console.log('🔥 FILE SELECTED - SIMPLIFIED VERSION!');
    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    
    // Validate file type
    const validTypes = ['.pdf', '.rtf'];
    const isValidType = validTypes.some(type => file.name.toLowerCase().endsWith(type));
    
    if (!isValidType) {
      console.error('❌ Invalid file type:', file.type);
      alert('Παρακαλώ επιλέξτε αρχείο PDF ή RTF');
      return;
    }
    
    console.log('✅ CALLING onFileChange NOW');
    onFileChange(file);
  };

  const handleDirectClick = () => {
    console.log('🔘 BUTTON CLICKED - Creating direct input');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.rtf';
    
    input.onchange = (e) => {
      console.log('🔥 DIRECT INPUT CHANGE FIRED!');
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        console.log('📁 File found:', target.files[0].name);
        handleFileSelect(target.files[0]);
      } else {
        console.log('❌ No files in direct input');
      }
    };
    
    console.log('🖱️ Triggering click on dynamic input');
    input.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    console.log('🔥 FILE DROPPED!');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      console.log('📁 Processing dropped file:', files[0].name);
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
              <Button 
                onClick={handleDirectClick}
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