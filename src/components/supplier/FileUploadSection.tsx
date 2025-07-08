import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FileUploadSectionProps {
  onFileChange: (file: File | null) => void;
}

export const FileUploadSection = ({ onFileChange }: FileUploadSectionProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">PDF Processor</h1>
            <p className="text-muted-foreground">Επιλέξτε PDF ή RTF αρχείο</p>
            
            <input
              type="file"
              accept=".pdf,.rtf"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                console.log('Input change triggered:', file?.name);
                onFileChange(file);
              }}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button asChild className="w-full cursor-pointer" size="lg">
                <span>Επιλογή Αρχείου</span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};