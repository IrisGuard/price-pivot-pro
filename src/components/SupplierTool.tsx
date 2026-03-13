import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Calculator, Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { extractPricesFromFile } from "@/lib/pdf/pdfTextExtractor";
import type { ExtractedPrice } from "@/lib/pdf/pdfTextExtractor";
import { DocumentViewer } from "@/components/DocumentViewer";

const SupplierTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [prices, setPrices] = useState<ExtractedPrice[]>([]);
  const [detectedTotal, setDetectedTotal] = useState<number | null>(null);
  const [newTotal, setNewTotal] = useState<string>("");
  const [ratio, setRatio] = useState<number | null>(null);

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
        description: `Βρέθηκαν ${result.prices.length} τιμές. ${result.totalDetected ? `Σύνολο: ${result.totalDetected.toFixed(2)} €` : 'Εισάγετε σύνολο χειροκίνητα.'}`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({ title: "Σφάλμα", description: "Αποτυχία ανάλυσης αρχείου", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewTotalChange = (value: string) => {
    setNewTotal(value);
    const parsed = parseFloat(value.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0 && detectedTotal && detectedTotal > 0) {
      setRatio(parsed / detectedTotal);
    } else {
      setRatio(null);
    }
  };

  const handleExport = async () => {
    if (!file || !ratio) return;

    setIsExporting(true);
    try {
      const { interactivePDFProcessor } = await import("@/lib/pdf/pdfProcessor");
      
      // If RTF, convert to PDF first
      let fileBytes: Uint8Array;
      if (file.name.toLowerCase().endsWith('.rtf')) {
        const { useRTFToPDFConverter } = await import("@/hooks/useRTFToPDFConverter");
        const { convertRTFToPDF } = useRTFToPDFConverter();
        fileBytes = await convertRTFToPDF(file);
      } else {
        fileBytes = new Uint8Array(await file.arrayBuffer());
      }

      let bannerBytes: Uint8Array | undefined;
      try {
        const resp = await fetch('/europlast-banner.png');
        bannerBytes = new Uint8Array(await resp.arrayBuffer());
      } catch { /* no banner */ }

      const percentage = (ratio - 1) * 100;

      const pdfBytes = await interactivePDFProcessor.createCleanQuotationPDF({
        factoryPdfBytes: fileBytes,
        percentage,
        bannerImageBytes: bannerBytes,
        detectedPrices: prices,
      });

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
        description: `Νέο σύνολο: ${parseFloat(newTotal.replace(',', '.')).toFixed(2)} €`,
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

  // Upload screen
  if (!file) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Εργαλείο Προσφοράς</h1>
            <p className="text-muted-foreground">
              Ανέβασε PDF ή RTF εργοστασίου → Βάλε νέο σύνολο → Πάρε την προσφορά σου
            </p>
          </div>
          <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
            <CardContent className="p-12">
              <label className="flex flex-col items-center gap-4 cursor-pointer">
                <Upload className="h-16 w-16 text-muted-foreground" />
                <span className="text-lg font-medium text-foreground">Ανέβασε το PDF ή RTF του εργοστασίου</span>
                <span className="text-sm text-muted-foreground">Κάνε κλικ για επιλογή αρχείου</span>
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
        </div>
      </div>
    );
  }

  // Main layout: Document viewer (left) + Controls (right)
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-foreground text-sm">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB • {prices.length} τιμές εντοπίστηκαν</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <X className="h-4 w-4 mr-1" /> Νέο αρχείο
        </Button>
      </div>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document pages */}
        <div className="flex-1 overflow-y-auto bg-muted/30 p-4">
          {isAnalyzing ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-3" />
                <p className="text-foreground font-medium">Ανάλυση αρχείου...</p>
              </div>
            </div>
          ) : (
            <DocumentViewer file={file} />
          )}
        </div>

        {/* Right: Controls panel */}
        <div className="w-80 border-l border-border bg-card overflow-y-auto p-4 shrink-0">
          <div className="space-y-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Υπολογισμός
            </h2>

            {/* Detected total */}
            {detectedTotal !== null ? (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Σύνολο εργοστασίου</p>
                <p className="text-xl font-bold text-foreground">{detectedTotal.toFixed(2)} €</p>
              </div>
            ) : !isAnalyzing ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Δεν βρέθηκε σύνολο αυτόματα. Γράψε το:</p>
                <Input
                  type="text"
                  placeholder="π.χ. 1904"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(',', '.'));
                    if (!isNaN(val) && val > 0) setDetectedTotal(val);
                  }}
                />
              </div>
            ) : null}

            {/* New total input */}
            {detectedTotal !== null && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Νέο σύνολο
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="π.χ. 2094"
                      value={newTotal}
                      onChange={(e) => handleNewTotalChange(e.target.value)}
                      className="text-lg"
                    />
                    <span className="flex items-center text-muted-foreground text-sm">€</span>
                  </div>
                </div>

                {ratio !== null && (
                  <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Αλλαγή:</span>
                      <span className={`text-lg font-bold ${ratio > 1 ? 'text-green-400' : ratio < 1 ? 'text-red-400' : 'text-foreground'}`}>
                        {ratio > 1 ? '+' : ''}{((ratio - 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!ratio || isExporting}
                  onClick={handleExport}
                >
                  {isExporting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Δημιουργία...</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" /> Δημιουργία Προσφοράς</>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierTool;
