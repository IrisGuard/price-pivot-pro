import { EditorMode } from "@/components/supplier/EditorMode";
import { FileUploadSection } from "@/components/supplier/FileUploadSection";
import { FilePreviewSection } from "@/components/supplier/FilePreviewSection";
import { ControlPanel } from "@/components/supplier/ControlPanel";
import { useSupplierTool } from "@/hooks/useSupplierTool";

const SupplierTool = () => {
  const {
    factoryFile,
    percentage,
    showEditor,
    detectedPrices,
    currentPrices,
    isProcessing,
    setPercentage,
    setShowEditor,
    handleFactoryFileChange,
    handlePricesDetected,
    handlePriceUpdate,
    handleCreateQuotationFromEditor,
    handleCreateQuotation,
  } = useSupplierTool();

  if (showEditor) {
    return (
      <EditorMode
        factoryFile={factoryFile}
        detectedPrices={detectedPrices}
        onPricesDetected={handlePricesDetected}
        onPriceUpdate={handlePriceUpdate}
        onExportPDF={handleCreateQuotationFromEditor}
        onBack={() => setShowEditor(false)}
        isProcessing={isProcessing}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!factoryFile ? (
        <FileUploadSection onFileChange={handleFactoryFileChange} />
      ) : (
        <>
          <FilePreviewSection 
            file={factoryFile}
            onPricesDetected={handlePricesDetected}
          />
          <ControlPanel
            percentage={percentage}
            isProcessing={isProcessing}
            onPercentageChange={setPercentage}
            onCreateQuotation={handleCreateQuotation}
          />
        </>
      )}
    </div>
  );
};

export default SupplierTool;