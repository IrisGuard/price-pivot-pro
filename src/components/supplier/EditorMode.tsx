import { Button } from "@/components/ui/button";
import { UniversalFileViewer } from "@/components/UniversalFileViewer";
import { PDFEditingPanel } from "@/components/PDFEditingPanel";
import { useBannerReplacement } from "@/hooks/useBannerReplacement";

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

interface EditorModeProps {
  factoryFile: File | null;
  detectedPrices: PriceData[];
  onPricesDetected: (prices: PriceData[]) => void;
  onPriceUpdate: (prices: PriceData[]) => void;
  onExportPDF: (bannerFile?: File | null) => void;
  onBack: () => void;
  isProcessing: boolean;
}

export const EditorMode = ({
  factoryFile,
  detectedPrices,
  onPricesDetected,
  onPriceUpdate,
  onExportPDF,
  onBack,
  isProcessing
}: EditorModeProps) => {
  const { bannerState, loadBannerFile, removeBanner } = useBannerReplacement();

  const handleExportPDF = () => {
    onExportPDF(bannerState.currentBanner);
  };
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📝 File Editor - {factoryFile?.name}</h1>
            <p className="text-sm text-muted-foreground">
              Επεξεργαστείτε το αρχείο σας σε πραγματικό χρόνο
            </p>
          </div>
          <Button variant="outline" onClick={onBack}>
            Επιστροφή
          </Button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* File Viewer - Left Side */}
        <div className="flex-1 min-w-0">
          <UniversalFileViewer 
            file={factoryFile} 
            onPricesDetected={onPricesDetected}
          />
        </div>

        {/* Editing Panel - Right Side */}
        <div className="w-80 flex-shrink-0">
          <PDFEditingPanel
            detectedPrices={detectedPrices}
            onPriceUpdate={onPriceUpdate}
            onExportPDF={handleExportPDF}
            isProcessing={isProcessing}
            bannerState={bannerState}
            onBannerLoad={loadBannerFile}
            onBannerRemove={removeBanner}
          />
        </div>
      </div>
    </div>
  );
};