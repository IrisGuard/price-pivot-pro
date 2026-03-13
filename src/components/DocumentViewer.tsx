import { useEffect, useMemo, useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentViewerProps {
  file: File;
}

/**
 * Document viewer:
 * - PDF: native browser PDF viewer (iframe)
 * - RTF: parse and render as formatted HTML
 */
export const DocumentViewer = ({ file }: DocumentViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rtfPages, setRtfPages] = useState<string[]>([]);

  const isRTF = useMemo(() => file.name.toLowerCase().endsWith(".rtf"), [file.name]);

  const rtfPreviewSrcDoc = useMemo(() => {
    if (rtfPages.length === 0) return null;

    const pagesHtml = rtfPages
      .map((pageHtml, index) => `<section class="rtf-page" data-page="${index + 1}">${pageHtml}</section>`)
      .join("");

    return `<!doctype html>
<html lang="el">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #f3f4f6;
        color: #000;
      }

      * {
        box-sizing: border-box;
      }

      .rtf-root {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: center;
      }

      .rtf-page {
        background: #fff;
        color: #000;
        width: max-content;
        max-width: 100%;
        border: 1px solid #d1d5db;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        overflow: auto;
      }

      .rtf-page * {
        color: inherit !important;
      }

      .rtf-page input,
      .rtf-page textarea,
      .rtf-page select {
        color: #000 !important;
        background: transparent !important;
        border: 1px solid #9ca3af !important;
      }
    </style>
  </head>
  <body>
    <main class="rtf-root">${pagesHtml}</main>
  </body>
</html>`;
  }, [rtfPages]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const preparePreview = async () => {
      setLoading(true);
      setError(null);
      setPreviewUrl(null);
      setRtfPages([]);

      try {
        if (!isRTF) {
          // PDF: use native browser viewer
          objectUrl = URL.createObjectURL(file);
          if (!cancelled) {
            setPreviewUrl(objectUrl);
            setLoading(false);
          }
          return;
        }

        // RTF: render with dedicated RTF engine for faithful visual preview
        const rtfBuffer = await file.arrayBuffer();
        const rtfModule = (await import("rtf.js")) as any;
        const rtfEngine = rtfModule?.RTFJS ?? rtfModule;

        if (typeof rtfEngine?.loggingEnabled === "function") {
          rtfEngine.loggingEnabled(false);
        }

        if (!rtfEngine?.Document) {
          throw new Error("RTF engine unavailable");
        }

        const rtfDocument = new rtfEngine.Document(rtfBuffer, {
          onPicture: (_isLegacy: boolean | null, create: () => HTMLElement) => create(),
        });

        const renderedPages = (await rtfDocument.render()) as HTMLElement[];

        if (cancelled) return;

        const pageHtml = renderedPages
          .map((page) => page?.outerHTML?.trim())
          .filter((html): html is string => Boolean(html && html.length > 0));

        if (pageHtml.length > 0) {
          setRtfPages(pageHtml);
          return;
        }

        // No text-conversion fallback: keep original-layout preview only
        setError("Αδυναμία πιστής προβολής του RTF αρχείου");
      } catch (err) {
        console.error("Preview error:", err);
        if (!cancelled) {
          setError("Αποτυχία φόρτωσης αρχείου");
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
  }, [file, isRTF]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[480px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Φόρτωση αρχείου...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[480px]">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  // PDF: native viewer
  if (previewUrl) {
    return (
      <div className="w-full max-w-[980px] mx-auto">
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <object
            data={previewUrl}
            type="application/pdf"
            className="w-full h-[calc(100vh-170px)] min-h-[640px]"
            aria-label="PDF preview"
          >
            <div className="p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Ο browser δεν υποστηρίζει ενσωματωμένο PDF.</p>
              <Button asChild variant="outline">
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> Άνοιγμα σε νέα καρτέλα
                </a>
              </Button>
            </div>
          </object>
        </div>
      </div>
    );
  }

  // RTF: rendered pages
  if (rtfPages.length > 0) {
    return (
      <div className="w-full max-w-[1120px] mx-auto">
        <div className="bg-muted/20 border border-border rounded-lg overflow-auto h-[calc(100vh-170px)] min-h-[640px] p-4">
          <div className="space-y-6">
            {rtfPages.map((pageHtml, index) => (
              <div
                key={`${file.name}-page-${index}`}
                className="border border-border rounded-md shadow-sm overflow-auto"
                style={{
                  backgroundColor: "hsl(0 0% 100%)",
                  color: "hsl(0 0% 0%)",
                }}
                dangerouslySetInnerHTML={{ __html: pageHtml }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Convert parsed plain text to styled HTML that looks like the document
 */
function convertTextToHtml(text: string): string {
  if (!text || text.trim().length === 0) {
    return '<p style="color: #999;">Δεν βρέθηκε περιεχόμενο στο αρχείο.</p>';
  }

  // Split into lines
  const lines = text.split("\n");
  let html = "";

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      html += "<br/>";
      continue;
    }

    // Detect table-like rows (tab-separated values)
    if (trimmed.includes("\t")) {
      const cells = trimmed.split("\t").map(c => c.trim()).filter(c => c);
      if (cells.length >= 2) {
        html += '<div style="display: flex; border-bottom: 1px solid #ddd; padding: 3px 0;">';
        cells.forEach((cell, i) => {
          const isPrice = /\d+[.,]\d{2}\s*€?$/.test(cell) || /€\s*\d/.test(cell);
          const style = i === 0
            ? 'flex: 1; font-weight: 500;'
            : `min-width: 120px; text-align: right;${isPrice ? ' color: #0066cc; font-weight: 600;' : ''}`;
          html += `<span style="${style}">${escapeHtml(cell)}</span>`;
        });
        html += "</div>";
        continue;
      }
    }

    // Detect headers/titles (all caps or short bold-looking lines)
    const isHeader = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 80 && /[A-ZΑ-Ω]/.test(trimmed);
    
    // Detect section titles like "001 - Component 001"
    const isSection = /^\d{3}\s*-\s*Component/i.test(trimmed);

    // Detect price lines
    const isPrice = /\d+[.,]\d{2}\s*€/.test(trimmed) || /€\s*\d/.test(trimmed);
    
    // Detect totals
    const isTotal = /σύνολο|total|synolo/i.test(trimmed);

    if (isSection) {
      html += `<div style="background: #4472C4; color: white; padding: 6px 10px; margin: 16px 0 8px; font-weight: bold; font-size: 13px;">${escapeHtml(trimmed)}</div>`;
    } else if (isTotal) {
      html += `<div style="background: #f0f0f0; padding: 6px 10px; font-weight: bold; border-top: 2px solid #333; margin-top: 8px;">${escapeHtml(trimmed)}</div>`;
    } else if (isHeader) {
      html += `<div style="font-weight: bold; font-size: 14px; margin: 12px 0 4px; color: #333;">${escapeHtml(trimmed)}</div>`;
    } else if (isPrice) {
      html += `<div style="color: #0066cc; font-weight: 500;">${escapeHtml(trimmed)}</div>`;
    } else {
      html += `<div style="margin: 2px 0;">${escapeHtml(trimmed)}</div>`;
    }
  }

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
