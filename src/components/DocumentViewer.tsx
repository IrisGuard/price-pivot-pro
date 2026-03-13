import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Loader2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

interface DocumentViewerProps {
  file: File;
}

/**
 * Renders all pages of a PDF or RTF file, stacked vertically like LibreOffice.
 * For RTF files, converts to PDF first then renders.
 */
export const DocumentViewer = ({ file }: DocumentViewerProps) => {
  const [pageDataUrls, setPageDataUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderFile = async () => {
      setLoading(true);
      setError(null);
      setPageDataUrls([]);

      try {
        let pdfData: ArrayBuffer;

        if (file.name.toLowerCase().endsWith(".rtf")) {
          // Convert RTF to PDF first
          const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
          const rtfText = await file.text();

          // Parse RTF to plain text
          const plainText = rtfText
            .replace(/\\u(\d+)\\\??'?[0-9a-fA-F]*/g, (_m, code) => {
              try { return String.fromCharCode(parseInt(code, 10)); } catch { return " "; }
            })
            .replace(/\\'([0-9a-fA-F]{2})/g, (_m, hex) => {
              try { return String.fromCharCode(parseInt(hex, 16)); } catch { return " "; }
            })
            .replace(/\\par\b/g, "\n")
            .replace(/\\line\b/g, "\n")
            .replace(/\\tab\b/g, "\t")
            .replace(/\\cell\b/g, "\t")
            .replace(/\\row\b/g, "\n")
            .replace(/\\[a-zA-Z]+\d*\s?/g, " ")
            .replace(/[{}]/g, "")
            .replace(/\s+/g, " ")
            .trim();

          // Split into lines
          const lines = plainText.split("\n").filter(l => l.trim());

          // Create multi-page PDF
          const pdfDoc = await PDFDocument.create();
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const fontSize = 10;
          const lineHeight = 14;
          const pageWidth = 595;
          const pageHeight = 842;
          const marginX = 50;
          const marginTop = 50;
          const marginBottom = 50;
          const usableHeight = pageHeight - marginTop - marginBottom;
          const linesPerPage = Math.floor(usableHeight / lineHeight);

          // Word-wrap lines
          const wrappedLines: string[] = [];
          for (const line of lines) {
            const words = line.split(" ");
            let current = "";
            for (const word of words) {
              const test = current ? `${current} ${word}` : word;
              const width = font.widthOfTextAtSize(test, fontSize);
              if (width > pageWidth - 2 * marginX) {
                if (current) wrappedLines.push(current);
                current = word;
              } else {
                current = test;
              }
            }
            if (current) wrappedLines.push(current);
          }

          // Render pages
          for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            const pageLines = wrappedLines.slice(i, i + linesPerPage);
            let y = pageHeight - marginTop;

            for (const line of pageLines) {
              page.drawText(line, {
                x: marginX,
                y,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
                maxWidth: pageWidth - 2 * marginX,
              });
              y -= lineHeight;
            }
          }

          pdfData = (await pdfDoc.save()).buffer as ArrayBuffer;
        } else {
          pdfData = await file.arrayBuffer();
        }

        // Render each PDF page to canvas → data URL
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const urls: string[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) return;

          const page = await pdf.getPage(pageNum);
          const scale = 1.5; // Good quality for screen
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;

          await page.render({ canvasContext: ctx, viewport }).promise;
          urls.push(canvas.toDataURL("image/png"));
        }

        if (!cancelled) {
          setPageDataUrls(urls);
        }
      } catch (err) {
        console.error("Document render error:", err);
        if (!cancelled) setError("Αποτυχία φόρτωσης αρχείου");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    renderFile();
    return () => { cancelled = true; };
  }, [file]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Φόρτωση σελίδων...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {pageDataUrls.map((url, index) => (
        <div key={index} className="bg-white shadow-lg rounded border border-border">
          <img
            src={url}
            alt={`Σελίδα ${index + 1}`}
            className="w-full max-w-[800px]"
          />
          <div className="text-center py-1 text-xs text-muted-foreground border-t border-border">
            Σελίδα {index + 1} / {pageDataUrls.length}
          </div>
        </div>
      ))}
    </div>
  );
};
