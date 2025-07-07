import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SupplierTool from "@/components/SupplierTool";
import ClientTool from "@/components/ClientTool";

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

        <Tabs defaultValue="supplier" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="supplier" className="text-lg py-3">
              Εργαλείο Προμηθευτή
            </TabsTrigger>
            <TabsTrigger value="client" className="text-lg py-3">
              Εργαλείο Πελάτη
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="supplier" className="mt-0">
            <SupplierTool />
          </TabsContent>
          
          <TabsContent value="client" className="mt-0">
            <ClientTool />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
