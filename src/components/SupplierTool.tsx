import { useState } from "react";
import { Upload, FileText, Calculator, Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { extractPricesFromFile } from "@/lib/pdf/pdfTextExtractor";
import type { ExtractedPrice } from "@/lib/pdf/pdfTextExtractor";

const SupplierTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [prices, setPrices] = useState<ExtractedPrice[]>([]);
  const [detectedTotal, setDetectedTotal] = useState<number | null>(null);
  const [newTotal, setNewTotal] = useState<string>("");
  const [ratio, setRatio] = useState<number | null>(null);

  // Handle file upload
  const handleFileUpload = async (selectedFile: File) => {
    const ext = selectedFile.name.toLowerCase().split('.').pop();
    if (ext !== 'pdf' && ext !== 'rtf') {
      toast({ title: "Σφάλμα", description: "Μόνο αρχεία PDF ή RTF", variant: "destructive" });
      return;
    }

    setFile(selectedFile);
    setIsAnalyzing(true);
    setPrices([]);
    setDetectedTotal(null);
    setNewTotal("");
    setRatio(null);

    try {
      const result = await extractPricesFromFile(selectedFile);
      setPrices(result.prices);
      setDetectedTotal(result.totalDetected);

      toast({
        title: "✅ Ανάλυση ολοκληρώθηκε",
        description: `Βρέθηκαν ${result.prices.length} τιμές. ${result.totalDetected ? `Σύνολο: ${result.totalDetected.toFixed(2)} €` : 'Δεν βρέθηκε σύνολο αυτόματα.'}`,
      });
    } catch (error) {
      console.error("PDF analysis error:", error);
      toast({ title: "Σφάλμα", description: "Αποτυχία ανάλυσης PDF", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate ratio when user enters new total
  const handleNewTotalChange = (value: string) => {
    setNewTotal(value);
    const parsed = parseFloat(value.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0 && detectedTotal && detectedTotal > 0) {
      setRatio(parsed / detectedTotal);
    } else {
      setRatio(null);
    }
  };

  // Export the modified PDF
  const handleExport = async () => {
    if (!file || !ratio) return;

    setIsExporting(true);
    try {
      const { interactivePDFProcessor } = await import("@/lib/pdf/pdfProcessor");
      const fileBytes = new Uint8Array(await file.arrayBuffer());

      // Load default banner
      let bannerBytes: Uint8Array | undefined;
      try {
        const bannerResponse = await fetch('/europlast-banner.png');
        bannerBytes = new Uint8Array(await bannerResponse.arrayBuffer());
      } catch {
        console.warn('Banner not found');
      }

      // Scale all prices by ratio
      const scaledPrices = prices.map(p => ({
        ...p,
        value: p.value, // original value - processor will apply percentage
      }));

      const percentage = (ratio - 1) * 100;

      const pdfBytes = await interactivePDFProcessor.createCleanQuotationPDF({
        factoryPdfBytes: fileBytes,
        percentage,
        bannerImageBytes: bannerBytes,
        detectedPrices: scaledPrices,
      });

      // Download
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Προσφορά_${new Date().toLocaleDateString('el-GR').replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "✅ PDF Έτοιμο",
        description: `Η προσφορά εξήχθη με νέο σύνολο ${parseFloat(newTotal.replace(',', '.')).toFixed(2)} €`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "Σφάλμα", description: "Αποτυχία δημιουργίας PDF", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPrices([]);
    setDetectedTotal(null);
    setNewTotal("");
    setRatio(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Εργαλείο Προσφοράς
          </h1>
          <p className="text-muted-foreground">
            Ανέβασε PDF εργοστασίου → Βάλε νέο σύνολο → Πάρε την προσφορά σου
          </p>
        </div>

        {/* Step 1: Upload */}
        {!file ? (
          <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
            <CardContent className="p-12">
              <label className="flex flex-col items-center gap-4 cursor-pointer">
                <Upload className="h-16 w-16 text-muted-foreground" />
                <span className="text-lg font-medium text-foreground">Ανέβασε το PDF του εργοστασίου</span>
                <span className="text-sm text-muted-foreground">Κάνε κλικ ή σύρε αρχείο εδώ</span>
                <input
                  type="file"
                  accept=".pdf,.rtf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />
              </label>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* File info */}
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={reset}>
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Analyzing state */}
            {isAnalyzing && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
                  <p className="text-foreground font-medium">Ανάλυση τιμών...</p>
                  <p className="text-sm text-muted-foreground">Εντοπισμός όλων των τιμών στο PDF</p>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Price info + new total */}
            {!isAnalyzing && detectedTotal !== null && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="h-5 w-5 text-primary" />
                    Υπολογισμός Τιμών
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Detected total */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Σύνολο εργοστασίου (αυτόματος εντοπισμός)</p>
                    <p className="text-2xl font-bold text-foreground">{detectedTotal.toFixed(2)} €</p>
                    <p className="text-xs text-muted-foreground mt-1">Βρέθηκαν {prices.length} τιμές στο PDF</p>
                  </div>

                  {/* New total input */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Νέο σύνολο (η τιμή που θέλεις εσύ)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="π.χ. 2094"
                        value={newTotal}
                        onChange={(e) => handleNewTotalChange(e.target.value)}
                        className="text-lg"
                      />
                      <span className="flex items-center text-muted-foreground font-medium">€</span>
                    </div>
                  </div>

                  {/* Ratio preview */}
                  {ratio !== null && (
                    <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Αλλαγή τιμών:</span>
                        <span className={`text-lg font-bold ${ratio > 1 ? 'text-green-400' : ratio < 1 ? 'text-red-400' : 'text-foreground'}`}>
                          {ratio > 1 ? '+' : ''}{((ratio - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Κάθε τιμή πολλαπλασιάζεται × {ratio.toFixed(4)}
                      </p>
                    </div>
                  )}

                  {/* Export button */}
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!ratio || isExporting}
                    onClick={handleExport}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Δημιουργία PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Δημιουργία Προσφοράς
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Manual total entry if auto-detection failed */}
            {!isAnalyzing && detectedTotal === null && prices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Δεν βρέθηκε σύνολο αυτόματα</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Βρέθηκαν {prices.length} τιμές αλλά δεν εντοπίστηκε το τελικό σύνολο. Γράψε το χειροκίνητα:
                  </p>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Τρέχον σύνολο εργοστασίου
                    </label>
                    <Input
                      type="text"
                      placeholder="π.χ. 1904"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value.replace(',', '.'));
                        if (!isNaN(val) && val > 0) setDetectedTotal(val);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SupplierTool;
