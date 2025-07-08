import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FileUploadSectionProps {
  factoryFile: File | null;
  onFileChange: (file: File | null) => void;
  onOpenEditor: () => void;
}

export const FileUploadSection = ({ factoryFile, onFileChange, onOpenEditor }: FileUploadSectionProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.endsWith('.rtf'))) {
      onFileChange(file);
      toast({
        title: "Αρχείο Εργοστασίου",
        description: `Επιλέχθηκε: ${file.name}`,
      });
    } else {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε έγκυρο PDF ή RTF αρχείο",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="factory-file" className="text-sm font-medium">
        Επιλογή αρχείου προσφοράς (PDF ή RTF):
      </Label>
      <div className="flex items-center gap-4">
        <Input
          id="factory-file"
          type="file"
          accept=".pdf,.rtf"
          onChange={handleFileChange}
          className="flex-1"
        />
        <FileUp className="h-5 w-5 text-muted-foreground" />
      </div>
      {factoryFile && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Επιλεγμένο: {factoryFile.name}
          </p>
          <Button 
            variant="outline" 
            onClick={onOpenEditor}
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            Άνοιγμα File Editor
          </Button>
        </div>
      )}
    </div>
  );
};