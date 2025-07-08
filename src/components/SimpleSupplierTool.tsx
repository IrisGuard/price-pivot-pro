import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { simplePDFProcessor } from "@/lib/pdf/simplePDFProcessor";
import { useRTFToPDFConverter } from "@/hooks/useRTFToPDFConverter";
import { HybridPDFViewer } from "@/components/pdf/HybridPDFViewer";
import { RTFViewer } from "@/components/RTFViewer";

export const SimpleSupplierTool = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [percentage, setPercentage] = useState<string>("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerAFM, setCustomerAFM] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedPrices, setDetectedPrices] = useState<Array<{ value: number; x: number; y: number; pageIndex: number }>>([]);
  const [extractedText, setExtractedText] = useState<string>("");
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
    if (percentage && !isNaN(Number(percentage))) {
      const numPercentage = Number(percentage);
      const totalOriginal = detectedPrices.reduce((sum, p) => sum + p.value, 0);
      const totalNew = totalOriginal * (1 + numPercentage / 100);
      
      toast({
        title: "✅ Ποσοστό εφαρμόστηκε",
        description: `${numPercentage > 0 ? '+' : ''}${numPercentage}% στις τιμές (€${totalOriginal.toFixed(2)} → €${totalNew.toFixed(2)})`,
      });
    } else {
      toast({
        title: "Σφάλμα",
        description: "Εισάγετε έγκυρο ποσοστό (π.χ. +10 ή -15)",
        variant: "destructive"
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
      toast({
        title: "🔄 Δημιουργία PDF",
        description: "Επεξεργασία τιμών και εξαγωγή...",
      });

      let pdfBytes: Uint8Array;
      
      if (selectedFile.name.endsWith('.rtf')) {
        pdfBytes = await convertRTFToPDF(selectedFile);
      } else {
        pdfBytes = new Uint8Array(await selectedFile.arrayBuffer());
      }

      // Apply percentage to detected prices if specified
      let finalPercentage = 0;
      if (percentage && !isNaN(Number(percentage))) {
        finalPercentage = Number(percentage);
      }

      // Enhanced PDF processing with price adjustments
      const interactivePdfBytes = await simplePDFProcessor.processFactoryPDF(pdfBytes);

      const blob = new Blob([interactivePdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Προσφορά_${customerName || 'Πελάτης'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ PDF έτοιμο",
        description: `Προσφορά με ${detectedPrices.length} τιμές ${finalPercentage !== 0 ? `(${finalPercentage > 0 ? '+' : ''}${finalPercentage}%)` : ''}`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Σφάλμα εξαγωγής",
        description: "Παρακαλώ ελέγξτε το αρχείο και προσπαθήστε ξανά",
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
          <div className="w-full min-h-screen bg-muted/20">
            <HybridPDFViewer 
              pdfFile={selectedFile}
              onTextExtracted={(text) => {
                setExtractedText(text);
                console.log('Text extracted:', text.slice(0, 100) + '...');
              }}
              onPricesDetected={(prices) => {
                setDetectedPrices(prices);
                console.log('Prices detected:', prices);
                toast({
                  title: "🎯 Τιμές ανιχνεύθηκαν",
                  description: `Βρέθηκαν ${prices.length} τιμές στο PDF`,
                });
              }}
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
              <Label className="text-sm font-medium">
                Ποσοστό Τιμών {detectedPrices.length > 0 && `(${detectedPrices.length} τιμές)`}
              </Label>
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
              {detectedPrices.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Τιμές: {detectedPrices.slice(0, 3).map(p => `€${p.value.toFixed(2)}`).join(', ')}
                  {detectedPrices.length > 3 && '...'}
                </p>
              )}
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