import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { FileUp } from "lucide-react";

const SupplierTool = () => {
  const [factoryPdf, setFactoryPdf] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [percentage, setPercentage] = useState<string>("");

  const handleFactoryPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setFactoryPdf(file);
      toast({
        title: "PDF Εργοστασίου",
        description: `Επιλέχθηκε: ${file.name}`,
      });
    } else {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε έγκυρο PDF αρχείο",
        variant: "destructive",
      });
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setBannerImage(file);
      toast({
        title: "Banner",
        description: `Επιλέχθηκε: ${file.name}`,
      });
    } else {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε έγκυρη εικόνα (PNG, JPG)",
        variant: "destructive",
      });
    }
  };

  const handleCreateQuotation = async () => {
    if (!factoryPdf) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε PDF εργοστασίου",
        variant: "destructive",
      });
      return;
    }

    if (!bannerImage) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε banner",
        variant: "destructive",
      });
      return;
    }

    if (!percentage || isNaN(Number(percentage))) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ εισάγετε έγκυρο ποσοστό",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Επεξεργασία",
        description: "Δημιουργία σφραγισμένου PDF με ενσωματωμένες λειτουργίες...",
      });

      // Import the processor
      const { interactivePDFProcessor } = await import("@/lib/pdfProcessor");

      // Convert files to Uint8Array
      const factoryPdfBytes = new Uint8Array(await factoryPdf.arrayBuffer());
      const bannerImageBytes = new Uint8Array(await bannerImage.arrayBuffer());

      // Create sealed interactive PDF
      const sealedPdfBytes = await interactivePDFProcessor.createSealedQuotationPDF({
        factoryPdfBytes,
        bannerImageBytes,
        percentage: Number(percentage),
      });

      // Create download link
      const blob = new Blob([sealedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Προσφορά_Δική_Μου.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Επιτυχία",
        description: "Το σφραγισμένο PDF δημιουργήθηκε και λήφθηκε επιτυχώς",
      });
    } catch (error) {
      console.error('Error creating interactive PDF:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη δημιουργία του PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Δημιουργία Σφραγισμένου PDF
          </CardTitle>
          <CardDescription className="text-center">
            Δημιουργία προσφοράς με ενσωματωμένες διαδραστικές λειτουργίες
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PDF Selection */}
          <div className="space-y-2">
            <Label htmlFor="factory-pdf" className="text-sm font-medium">
              Επιλογή PDF εργοστασίου:
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="factory-pdf"
                type="file"
                accept=".pdf"
                onChange={handleFactoryPdfChange}
                className="flex-1"
              />
              <FileUp className="h-5 w-5 text-muted-foreground" />
            </div>
            {factoryPdf && (
              <p className="text-sm text-muted-foreground">
                Επιλεγμένο: {factoryPdf.name}
              </p>
            )}
          </div>

          {/* Banner Selection */}
          <div className="space-y-2">
            <Label htmlFor="banner-image" className="text-sm font-medium">
              Επιλογή banner (εικόνα PNG/JPG):
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="banner-image"
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="flex-1"
              />
              <FileUp className="h-5 w-5 text-muted-foreground" />
            </div>
            {bannerImage && (
              <p className="text-sm text-muted-foreground">
                Επιλεγμένο: {bannerImage.name}
              </p>
            )}
          </div>

          {/* Percentage Input */}
          <div className="space-y-2">
            <Label htmlFor="percentage" className="text-sm font-medium">
              Εισαγωγή ποσοστού αλλαγής τιμής:
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="percentage"
                type="number"
                placeholder="-15"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="w-24"
                step="0.01"
              />
              <span className="text-sm font-medium">%</span>
              <span className="text-xs text-muted-foreground ml-2">
                (Αρνητικό για έκπτωση, θετικό για αύξηση)
              </span>
            </div>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreateQuotation}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΣΦΟΡΑΣ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierTool;