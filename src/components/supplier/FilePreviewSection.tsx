import { UniversalFileViewer } from "@/components/UniversalFileViewer";

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

interface FilePreviewSectionProps {
  file: File;
  onPricesDetected: (prices: PriceData[]) => void;
}

export const FilePreviewSection = ({ file, onPricesDetected }: FilePreviewSectionProps) => {
  return (
    <div className="w-full">
      <div className="w-full min-h-screen">
        <UniversalFileViewer 
          file={file}
          onPricesDetected={onPricesDetected}
        />
      </div>
    </div>
  );
};