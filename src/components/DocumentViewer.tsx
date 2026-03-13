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
  const [rtfRuntimeStyles, setRtfRuntimeStyles] = useState("");

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
    <style>${rtfRuntimeStyles}</style>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: hsl(220 14% 96%);
        color: hsl(0 0% 0%);
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
        background: hsl(0 0% 100%);
        width: max-content;
        max-width: 100%;
        border: 1px solid hsl(220 13% 85%);
        box-shadow: 0 2px 6px hsl(0 0% 0% / 0.08);
        overflow: auto;
      }
    </style>
  </head>
  <body>
    <main class="rtf-root">${pagesHtml}</main>
  </body>
</html>`;
  }, [rtfPages, rtfRuntimeStyles]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const preparePreview = async () => {
      setLoading(true);
      setError(null);
      setPreviewUrl(null);
      setRtfPages([]);
      setRtfRuntimeStyles("");

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
        const rtfRoot = rtfModule?.default ?? rtfModule;
        const rtfEngine = rtfRoot?.RTFJS ?? rtfRoot;

        if (typeof rtfEngine?.loggingEnabled === "function") {
          rtfEngine.loggingEnabled(false);
        }

        if (!rtfEngine?.Document) {
          throw new Error("RTF engine unavailable");
        }

        const existingStyleContents = new Set(
          Array.from(document.head.querySelectorAll("style"))
            .map((style) => style.textContent ?? "")
            .filter((content) => content.length > 0)
        );

        const rtfDocument = new rtfEngine.Document(rtfBuffer, {
          onPicture: (_isLegacy: boolean | null, create: () => HTMLElement) => create(),
        });

        const renderedPages = (await rtfDocument.render()) as HTMLElement[];

        if (cancelled) return;

        const pageHtml = renderedPages
          .map((page) => page?.outerHTML?.trim())
          .filter((html): html is string => Boolean(html && html.length > 0));

        const runtimeStyleContents = Array.from(document.head.querySelectorAll("style"))
          .map((style) => style.textContent ?? "")
          .filter((content) => content.length > 0 && !existingStyleContents.has(content));

        if (pageHtml.length > 0) {
          setRtfRuntimeStyles(runtimeStyleContents.join("\n"));
          setRtfPages(pageHtml);
          return;
        }

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

  // RTF: rendered in isolated frame to avoid app theme/style interference
  if (rtfPreviewSrcDoc) {
    return (
      <div className="w-full max-w-[1120px] mx-auto">
        <div className="bg-muted/20 border border-border rounded-lg overflow-hidden h-[calc(100vh-170px)] min-h-[640px]">
          <iframe
            title={`${file.name} RTF preview`}
            className="w-full h-full"
            srcDoc={rtfPreviewSrcDoc}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    );
  }

  return null;
};

