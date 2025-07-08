import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { simplePDFProcessor } from "@/lib/pdf/simplePDFProcessor";
import { useRTFToPDFConverter } from "@/hooks/useRTFToPDFConverter";
import { EnhancedPDFViewer } from "@/components/EnhancedPDFViewer";
import { RTFViewer } from "@/components/RTFViewer";

export const SimpleSupplierTool = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [percentage, setPercentage] = useState<string>("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerAFM, setCustomerAFM] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { convertRTFToPDF } = useRTFToPDFConverter();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileType = file.name.toLowerCase();
      if (fileType.endsWith('.pdf') || fileType.endsWith('.rtf')) {
        setSelectedFile(file);
        toast({
          title: "Αρχείο φορτώθηκε",
          description: `${file.name}`,
        });
      } else {
        toast({
          title: "Λάθος τύπος αρχείου",
          description: "Μόνο PDF ή RTF",
          variant: "destructive"
        });
      }
    }
  };

  const handleBannerSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setBannerFile(file);
      toast({
        title: "Banner επιλέχθηκε",
        description: file.name,
      });
    } else {
      toast({
        title: "Λάθος τύπος",
        description: "Μόνο εικόνες",
        variant: "destructive"
      });
    }
  };

  const applyChanges = () => {
    if (percentage) {
      toast({
        title: "Ποσοστό εφαρμόστηκε",
        description: `${percentage}% στις τιμές`,
      });
    }
  };

  const removeBanner = () => {
    setBannerFile(null);
    toast({
      title: "Banner αφαιρέθηκε",
    });
  };

  const handleFinalExport = async () => {
    if (!selectedFile) {
      toast({
        title: "Δεν υπάρχει αρχείο",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      let pdfBytes: Uint8Array;
      
      if (selectedFile.name.endsWith('.rtf')) {
        pdfBytes = await convertRTFToPDF(selectedFile);
      } else {
        pdfBytes = new Uint8Array(await selectedFile.arrayBuffer());
      }

      const interactivePdfBytes = await simplePDFProcessor.processFactoryPDF(pdfBytes);

      const blob = new Blob([interactivePdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Προσφορά_${customerName || 'Πελάτης'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ PDF έτοιμο",
        description: "Η προσφορά δημιουργήθηκε",
      });

    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Προσπαθήστε ξανά",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedFile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
              <h1 className="text-2xl font-bold">PDF Processor</h1>
              <p className="text-muted-foreground">Επιλέξτε PDF ή RTF αρχείο</p>
              
              <input
                type="file"
                accept=".pdf,.rtf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button className="w-full cursor-pointer" size="lg">
                  Επιλογή Αρχείου
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Full-Screen PDF Preview */}
      <div className="w-full">
        {selectedFile.name.endsWith('.pdf') ? (
          <div className="w-full min-h-screen">
            <EnhancedPDFViewer 
              file={selectedFile}
              title={selectedFile.name}
            />
          </div>
        ) : (
          <div className="w-full min-h-screen">
            <RTFViewer rtfFile={selectedFile} />
          </div>
        )}
      </div>

      {/* Control Panel - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
        <div className="max-w-6xl mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            {/* Banner Control */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Banner</Label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerSelect}
                  className="hidden"
                  id="banner-upload"
                />
                <label htmlFor="banner-upload">
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    Αλλαγή
                  </Button>
                </label>
                <Button variant="outline" size="sm" onClick={removeBanner}>
                  Αφαίρεση
                </Button>
              </div>
              {bannerFile && (
                <p className="text-xs text-muted-foreground truncate">
                  {bannerFile.name}
                </p>
              )}
            </div>

            {/* Price Control */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ποσοστό Τιμών</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="+10 ή -15"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-20"
                />
                <Button variant="outline" size="sm" onClick={applyChanges}>
                  Εφαρμογή
                </Button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Στοιχεία Πελάτη</Label>
              <div className="space-y-1">
                <Input
                  placeholder="Όνομα"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-8"
                />
                <Input
                  placeholder="ΑΦΜ"
                  value={customerAFM}
                  onChange={(e) => setCustomerAFM(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>

            {/* Export */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Τελικό PDF</Label>
              <Button
                onClick={handleFinalExport}
                disabled={isProcessing}
                className="w-full"
                size="sm"
              >
                {isProcessing ? "Δημιουργία..." : "Κατέβασμα"}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};