import SupplierTool from "@/components/SupplierTool";

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Σύστημα Διαχείρισης Προσφορών PDF
          </h1>
          <p className="text-xl text-muted-foreground">
            Επαγγελματικά εργαλεία για προμηθευτές και πελάτες
          </p>
        </div>

        <div className="w-full">
          <SupplierTool />
        </div>
      </div>
    </div>
  );
};

export default Index;
