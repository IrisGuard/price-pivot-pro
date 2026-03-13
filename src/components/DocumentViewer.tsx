import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Loader2 } from "lucide-react";

// Worker is set globally in main.tsx

interface DocumentViewerProps {
  file: File;
}

/**
 * Renders all pages of a PDF or RTF file, stacked vertically.
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
        let pdfArrayBuffer: ArrayBuffer;
        const isRTF = file.name.toLowerCase().endsWith(".rtf");

        if (isRTF) {
          console.log("📄 RTF file detected, converting to PDF...");
          pdfArrayBuffer = await convertRTFtoPDFBuffer(file);
          console.log("✅ RTF converted, PDF size:", pdfArrayBuffer.byteLength);
        } else {
          console.log("📄 PDF file detected, reading...");
          pdfArrayBuffer = await file.arrayBuffer();
          console.log("✅ PDF read, size:", pdfArrayBuffer.byteLength);
        }

        // Render PDF pages
        console.log("🔄 Loading PDF with pdfjs...");
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfArrayBuffer) }).promise;
        console.log("✅ PDF loaded, pages:", pdf.numPages);

        const urls: string[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) return;

          const page = await pdf.getPage(pageNum);
          const scale = 1.5;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;

          await page.render({ canvasContext: ctx, viewport }).promise;
          urls.push(canvas.toDataURL("image/png"));
          console.log(`✅ Page ${pageNum}/${pdf.numPages} rendered`);
        }

        if (!cancelled) {
          setPageDataUrls(urls);
          console.log("✅ All pages rendered successfully");
        }
      } catch (err) {
        console.error("❌ Document render error:", err);
        if (!cancelled) {
          setError(`Αποτυχία φόρτωσης: ${err instanceof Error ? err.message : 'Άγνωστο σφάλμα'}`);
        }
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
        <p className="text-destructive text-sm">{error}</p>
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

/**
 * Convert RTF file to PDF ArrayBuffer using pdf-lib
 */
async function convertRTFtoPDFBuffer(file: File): Promise<ArrayBuffer> {
  const rtfContent = await file.text();
  console.log("📝 RTF content length:", rtfContent.length);

  // Parse RTF to plain text - handle Unicode and special chars
  let plainText = rtfContent;

  // Handle Unicode sequences like \u1234
  plainText = plainText.replace(/\\u(-?\d+)[\\?]?'?[0-9a-fA-F]*/g, (_m, code) => {
    try {
      const charCode = parseInt(code, 10);
      if (charCode < 0) return String.fromCharCode(charCode + 65536);
      return String.fromCharCode(charCode);
    } catch { return " "; }
  });

  // Handle hex chars like \'c0
  plainText = plainText.replace(/\\'([0-9a-fA-F]{2})/g, (_m, hex) => {
    try { return String.fromCharCode(parseInt(hex, 16)); } catch { return " "; }
  });

  // Convert RTF control words to text
  plainText = plainText.replace(/\\par\b/g, "\n");
  plainText = plainText.replace(/\\line\b/g, "\n");
  plainText = plainText.replace(/\\tab\b/g, "\t");
  plainText = plainText.replace(/\\cell\b/g, "\t");
  plainText = plainText.replace(/\\row\b/g, "\n");

  // Remove RTF groups: {\fonttbl...}, {\colortbl...}, {\stylesheet...}, {\info...}
  // Use recursive bracket removal for nested groups
  plainText = removeNestedBraces(plainText, "fonttbl");
  plainText = removeNestedBraces(plainText, "colortbl");
  plainText = removeNestedBraces(plainText, "stylesheet");
  plainText = removeNestedBraces(plainText, "info");
  plainText = removeNestedBraces(plainText, "\\*");

  // Remove remaining RTF control words
  plainText = plainText.replace(/\\[a-zA-Z]+[-]?\d*\s?/g, " ");
  // Remove braces
  plainText = plainText.replace(/[{}]/g, "");
  // Clean up
  plainText = plainText.replace(/\s+/g, " ").trim();

  // Split into lines
  const lines = plainText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  console.log("📝 Parsed lines:", lines.length);

  // Create PDF with pdf-lib
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
  const maxTextWidth = pageWidth - 2 * marginX;
  const usableHeight = pageHeight - marginTop - marginBottom;

  // Word-wrap all lines
  const wrappedLines: string[] = [];
  for (const line of lines) {
    if (line.length === 0) {
      wrappedLines.push("");
      continue;
    }
    const words = line.split(/\s+/);
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      try {
        const width = font.widthOfTextAtSize(test, fontSize);
        if (width > maxTextWidth && current) {
          wrappedLines.push(current);
          current = word;
        } else {
          current = test;
        }
      } catch {
        // If character not in font, skip
        current = test;
      }
    }
    if (current) wrappedLines.push(current);
  }

  // Render pages
  const linesPerPage = Math.floor(usableHeight / lineHeight);
  
  for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const pageLines = wrappedLines.slice(i, i + linesPerPage);
    let y = pageHeight - marginTop;

    for (const line of pageLines) {
      if (line.length > 0) {
        try {
          // Filter out characters not supported by Helvetica
          const safeLine = line.replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
          page.drawText(safeLine, {
            x: marginX,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        } catch (e) {
          // Skip lines that can't be rendered
          console.warn("Skipped line:", e);
        }
      }
      y -= lineHeight;
    }
  }

  if (pdfDoc.getPageCount() === 0) {
    // Add at least one page
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawText("Document loaded but could not extract text", {
      x: marginX, y: pageHeight - marginTop, size: 12, font, color: rgb(0.5, 0.5, 0.5)
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes.buffer as ArrayBuffer;
}

/**
 * Remove nested brace groups starting with a keyword
 */
function removeNestedBraces(text: string, keyword: string): string {
  const searchStr = `{\\${keyword}`;
  let idx = text.indexOf(searchStr);
  while (idx !== -1) {
    let depth = 0;
    let end = idx;
    for (let i = idx; i < text.length; i++) {
      if (text[i] === '{') depth++;
      if (text[i] === '}') depth--;
      if (depth === 0) { end = i + 1; break; }
    }
    text = text.slice(0, idx) + text.slice(end);
    idx = text.indexOf(searchStr);
  }
  return text;
}
