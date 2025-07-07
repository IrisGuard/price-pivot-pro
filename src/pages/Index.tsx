import SupplierTool from "@/components/SupplierTool";

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            🔒 Δημιουργία Σφραγισμένου PDF Προσφοράς
          </h1>
          <p className="text-xl text-muted-foreground">
            Δημιουργία προστατευμένου PDF με ενσωματωμένες λειτουργίες τιμολόγησης και παραμετροποίησης
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
