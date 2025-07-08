import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";

interface FileUploadSectionProps {
  onFileChange: (file: File | null) => void;
}

export const FileUploadSection = ({ onFileChange }: FileUploadSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    console.log('🔥 FILE SELECTED!');
    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    
    // Validate file type
    const validTypes = ['.pdf', '.rtf'];
    const isValidType = validTypes.some(type => file.name.toLowerCase().endsWith(type));
    
    if (!isValidType) {
      console.error('❌ Invalid file type:', file.type);
      alert('Παρακαλώ επιλέξτε αρχείο PDF ή RTF');
      return;
    }
    
    console.log('✅ Valid file type, calling onFileChange');
    onFileChange(file);
  };

  const handleButtonClick = () => {
    console.log('🔘 Direct button click - opening file dialog');
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset first
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔥 INPUT CHANGE EVENT FIRED!');
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = ''; // Reset for next selection
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    console.log('🔥 FILE DROPPED!');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div 
            className={`text-center space-y-6 p-8 border-2 border-dashed rounded-lg transition-colors ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className={`h-16 w-16 mx-auto transition-colors ${
              isDragOver ? 'text-primary' : 'text-muted-foreground'
            }`} />
            
            <div>
              <h1 className="text-2xl font-bold mb-2">🔒 PDF Processor</h1>
              <p className="text-muted-foreground">
                Επιλέξτε PDF ή RTF αρχείο για δημιουργία σφραγισμένης προσφοράς
              </p>
            </div>
            
            {/* Direct visible input */}
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.rtf"
                onChange={handleInputChange}
                className="hidden"
                key={Date.now()} // Force re-render
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