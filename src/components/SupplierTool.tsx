import { EditorMode } from "@/components/supplier/EditorMode";
import { FileUploadSection } from "@/components/supplier/FileUploadSection";
import { FilePreviewSection } from "@/components/supplier/FilePreviewSection";
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
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-foreground py-8">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4 text-white">
            🔒 Δημιουργία Σφραγισμένου PDF Προσφοράς
          </h1>
          <p className="text-xl text-primary-foreground/80">
            Δημιουργία προστατευμένου PDF με ενσωματωμένες λειτουργίες τιμολόγησης και παραμετροποίησης
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen">
        {!factoryFile ? (
          <FileUploadSection onFileChange={handleFactoryFileChange} />
        ) : (
          <FilePreviewSection 
            file={factoryFile}
            onPricesDetected={handlePricesDetected}
          />
        )}
      </div>
    </div>
  );
};

export default SupplierTool;