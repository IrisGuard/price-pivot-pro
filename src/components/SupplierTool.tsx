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
        title: "🔄 ΔΗΜΙΟΥΡΓΙΑ ΣΦΡΑΓΙΣΜΕΝΟΥ PDF",
        description: "Ενσωμάτωση JavaScript engine και δημιουργία εξουσιοδοτημένου PDF...",
      });

      // Import the advanced processor
      const { interactivePDFProcessor } = await import("@/lib/pdfProcessor");

      // Convert files to Uint8Array
      const factoryPdfBytes = new Uint8Array(await factoryPdf.arrayBuffer());
      const bannerImageBytes = new Uint8Array(await bannerImage.arrayBuffer());

      // Create sealed interactive PDF with embedded JavaScript
      const sealedPdfBytes = await interactivePDFProcessor.createSealedQuotationPDF({
        factoryPdfBytes,
        bannerImageBytes,
        percentage: Number(percentage),
      });

      // Create download link with specific filename
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
        title: "✅ ΣΦΡΑΓΙΣΜΕΝΟ PDF ΕΤΟΙΜΟ",
        description: "Το PDF περιέχει ενσωματωμένες λειτουργίες για τον πελάτη. Μόνο αυτό το αρχείο θα δουλεύει με τις διαδραστικές λειτουργίες.",
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
            🔒 Δημιουργία Σφραγισμένου PDF
          </CardTitle>
          <CardDescription className="text-center text-sm">
            Δημιουργία προσφοράς με ενσωματωμένες διαδραστικές λειτουργίες για Adobe Acrobat.<br/>
            <span className="text-red-600 font-medium">⚠️ Το PDF θα δουλεύει ΜΟΝΟ με τις δικές σας προσφορές</span>
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
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            🔒 ΔΗΜΙΟΥΡΓΙΑ ΣΦΡΑΓΙΣΜΕΝΟΥ PDF
          </Button>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">📋 Τι θα περιέχει το PDF:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>✅ Ενσωματωμένο panel ελέγχου στο κάτω μέρος</li>
              <li>✅ Λειτουργίες αλλαγής ποσοστού τιμών</li>
              <li>✅ Διαχείριση banner εταιρείας</li>
              <li>✅ Πεδία στοιχείων πελάτη</li>
              <li>✅ Κουμπιά εκτύπωσης και email</li>
              <li>🔒 Ασφάλεια - δουλεύει μόνο με το δικό σας PDF</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierTool;