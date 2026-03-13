import { useEffect, useMemo, useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRTFToPDFConverter } from "@/hooks/useRTFToPDFConverter";

interface DocumentViewerProps {
  file: File;
}

/**
 * Stable, non-freezing document preview.
 * - PDF: native browser viewer
 * - RTF: convert to PDF first, then native browser viewer
 */
export const DocumentViewer = ({ file }: DocumentViewerProps) => {
  const { convertRTFToPDF } = useRTFToPDFConverter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isRTF = useMemo(() => file.name.toLowerCase().endsWith(".rtf"), [file.name]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const preparePreview = async () => {
      setLoading(true);
      setError(null);
      setPreviewUrl(null);

      try {
        if (!isRTF) {
          objectUrl = URL.createObjectURL(file);
          if (!cancelled) setPreviewUrl(objectUrl);
          return;
        }

        // RTF -> PDF conversion (fast converter) for stable preview
        const pdfBytes = await convertRTFToPDF(file);
        const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(pdfBlob);

        if (!cancelled) setPreviewUrl(objectUrl);
      } catch (err) {
        console.error("Document preview error:", err);
        if (!cancelled) {
          setError("Αποτυχία φόρτωσης προεπισκόπησης. Δοκιμάστε μικρότερο αρχείο ή PDF.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    preparePreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, isRTF, convertRTFToPDF]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[480px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Φόρτωση σελίδων...</p>
        </div>
      </div>
    );
  }

  if (error || !previewUrl) {
    return (
      <div className="flex items-center justify-center h-full min-h-[480px]">
        <p className="text-destructive text-sm">{error ?? "Αποτυχία φόρτωσης αρχείου"}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[980px] mx-auto space-y-2">
      {isRTF && (
        <p className="text-xs text-muted-foreground px-1">
          Το RTF μετατράπηκε σε PDF για σταθερή προβολή χωρίς κολλήματα.
        </p>
      )}

      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <object
          data={previewUrl}
          type="application/pdf"
          className="w-full h-[calc(100vh-170px)] min-h-[640px]"
          aria-label="Document preview"
        >
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Ο browser δεν υποστηρίζει ενσωματωμένο PDF preview.</p>
            <Button asChild variant="outline">
              <a href={previewUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Άνοιγμα σε νέα καρτέλα
              </a>
            </Button>
          </div>
        </object>
      </div>
    </div>
  );
};
