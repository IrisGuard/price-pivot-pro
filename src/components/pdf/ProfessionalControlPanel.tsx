import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useClientMode } from '@/hooks/useClientMode';
import { cleanPDFExporter } from '@/lib/pdf/cleanPDFExporter';

interface CustomerData {
  name: string;
  profession: string;
  taxId: string;
  phone: string;
}

interface ProfessionalControlPanelProps {
  pageWidth?: number;
  isAdminMode?: boolean;
  pdfFile?: File | null;
  onPercentageChange?: (percentage: number) => void;
  onBannerChange?: (file: File) => void;
  onCustomerDataChange?: (data: CustomerData) => void;
  onExportCleanPDF?: () => void;
}

export const ProfessionalControlPanel = ({ 
  pageWidth = 595, 
  isAdminMode = false,
  pdfFile,
  onPercentageChange,
  onBannerChange,
  onCustomerDataChange,
  onExportCleanPDF
}: ProfessionalControlPanelProps) => {
  const [hideControls, setHideControls] = useState(false);
  const { isClientMode, showControls, toggleClientMode, enterClientMode, enterAdminMode } = useClientMode();
  const [percentage, setPercentage] = useState<string>('');
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    profession: '',
    taxId: '',
    phone: ''
  });
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handlePercentageApply = () => {
    const value = parseFloat(percentage);
    if (isNaN(value)) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ εισάγετε έγκυρο ποσοστό",
        variant: "destructive",
      });
      return;
    }
    
    if (onPercentageChange) {
      onPercentageChange(value);
      toast({
        title: "Επιτυχία",
        description: `Ποσοστό ${value}% εφαρμόστηκε στις τιμές`,
      });
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onBannerChange) {
        onBannerChange(file);
      }
      toast({
        title: "Banner ενημερώθηκε",
        description: `Νέο banner: ${file.name}`,
      });
    }
  };

  const handleRemoveBanner = () => {
    toast({
      title: "Banner αφαιρέθηκε",
      description: "Το banner αφαιρέθηκε από την προσφορά",
    });
  };

  const handleCustomerDataUpdate = (field: keyof CustomerData, value: string) => {
    const newData = { ...customerData, [field]: value };
    setCustomerData(newData);
    if (onCustomerDataChange) {
      onCustomerDataChange(newData);
    }
  };

  const handleExportPDF = async () => {
    if (onExportCleanPDF) {
      onExportCleanPDF();
      return;
    }
    
    if (pdfFile) {
      try {
        const pdfBytes = new Uint8Array(await pdfFile.arrayBuffer());
        const cleanPdfBytes = await cleanPDFExporter.createCleanPDF(pdfBytes, {
          removeControlPanels: true,
          applyCustomerData: true,
          customerData
        });
        
        await cleanPDFExporter.downloadCleanPDF(cleanPdfBytes);
        
        toast({
          title: "PDF Εξαγωγή",
          description: "Το καθαρό PDF εξήχθη επιτυχώς",
        });
      } catch (error) {
        toast({
          title: "Σφάλμα",
          description: "Σφάλμα κατά την εξαγωγή του PDF",
          variant: "destructive",
        });
      }
    } else {
      window.print();
    }
  };

  // Hide controls in client mode or when explicitly hidden
  if ((hideControls && !isAdminMode) || (isClientMode && !showControls)) {
    return null;
  }

  return (
    <Card 
      className="bg-white shadow-lg print:shadow-none pdf-control-panel print-hide"
      style={{ width: pageWidth + 'px', maxWidth: '100%' }}
    >
      <div className="p-8 space-y-8">
        {/* Header with Mode Toggle */}
        <div className="text-center">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-primary">
              🔧 ΠΑΝΕΛ ΕΛΕΓΧΟΥ ΠΡΟΣΦΟΡΑΣ
            </h1>
            {isAdminMode && (
              <div className="flex items-center gap-2">
                <Button
                  variant={isClientMode ? "outline" : "default"}
                  size="sm"
                  onClick={toggleClientMode}
                  className="flex items-center gap-2"
                >
                  {isClientMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {isClientMode ? "Προβολή Πελάτη" : "Προβολή Admin"}
                </Button>
              </div>
            )}
          </div>
          <p className="text-muted-foreground">
            {isClientMode 
              ? "Προβολή όπως θα τη δει ο πελάτης - χωρίς admin εργαλεία"
              : "Χρησιμοποιήστε τα παρακάτω εργαλεία για να παραμετροποιήσετε την προσφορά σας"
            }
          </p>
        </div>

        <Separator />

        {/* Price Control Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <span>💰</span>
            1. ΑΛΛΑΓΗ ΠΟΣΟΣΤΟΥ ΤΙΜΩΝ
          </h3>
          <div className="flex items-center gap-4">
            <Label htmlFor="percentage" className="font-medium">
              Ποσοστό αλλαγής:
            </Label>
            <Input
              id="percentage"
              type="number"
              placeholder="+10 ή -15"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="w-32"
            />
            <Button onClick={handlePercentageApply} className="bg-green-600 hover:bg-green-700">
              ΕΦΑΡΜΟΓΗ
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Εισάγετε θετικό ή αρνητικό ποσοστό για να αυξήσετε ή να μειώσετε όλες τις τιμές
          </p>
        </div>

        <Separator />

        {/* Banner Control Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <span>🖼️</span>
            2. ΑΛΛΑΓΗ BANNER/ΛΟΓΟΤΥΠΟΥ
          </h3>
          <div className="flex items-center gap-4">
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerFileChange}
              className="hidden"
            />
            <Button 
              onClick={() => bannerInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              ΑΛΛΑΓΗ BANNER
            </Button>
            <Button variant="destructive" onClick={handleRemoveBanner}>
              ΑΦΑΙΡΕΣΗ BANNER
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Ανεβάστε το δικό σας λογότυπο ή banner για να αντικαταστήσετε το προεπιλεγμένο
          </p>
        </div>

        <Separator />

        {/* Customer Data Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <span>👤</span>
            3. ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer-name">Ονοματεπώνυμο</Label>
              <Input
                id="customer-name"
                value={customerData.name}
                onChange={(e) => handleCustomerDataUpdate('name', e.target.value)}
                placeholder="Εισάγετε ονοματεπώνυμο"
              />
            </div>
            <div>
              <Label htmlFor="customer-profession">Επάγγελμα</Label>
              <Input
                id="customer-profession"
                value={customerData.profession}
                onChange={(e) => handleCustomerDataUpdate('profession', e.target.value)}
                placeholder="Εισάγετε επάγγελμα"
              />
            </div>
            <div>
              <Label htmlFor="customer-tax">Α.Φ.Μ.</Label>
              <Input
                id="customer-tax"
                value={customerData.taxId}
                onChange={(e) => handleCustomerDataUpdate('taxId', e.target.value)}
                placeholder="Εισάγετε Α.Φ.Μ."
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">Τηλέφωνο</Label>
              <Input
                id="customer-phone"
                value={customerData.phone}
                onChange={(e) => handleCustomerDataUpdate('phone', e.target.value)}
                placeholder="Εισάγετε τηλέφωνο"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Admin Controls */}
        {isAdminMode && !isClientMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4 pdf-admin-controls">
            <h3 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
              <span>⚙️</span>
              ΕΛΕΓΧΟΣ ADMIN
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="hide-controls-toggle" className="text-sm font-medium">
                  Απόκρυψη σελίδας ελέγχου στην εξαγωγή:
                </Label>
                <Switch
                  id="hide-controls-toggle"
                  checked={hideControls}
                  onCheckedChange={setHideControls}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="client-mode-toggle" className="text-sm font-medium">
                  Προβολή Πελάτη:
                </Label>
                <Switch
                  id="client-mode-toggle"
                  checked={isClientMode}
                  onCheckedChange={toggleClientMode}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={handleExportPDF}
                className="bg-blue-600 hover:bg-blue-700"
              >
                📄 ΕΞΑΓΩΓΗ ΚΑΘΑΡΟΥ PDF
              </Button>
              
              <Button 
                onClick={enterClientMode}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                👁️ ΠΡΟΒΟΛΗ ΠΕΛΑΤΗ
              </Button>
            </div>
            
            <p className="text-xs text-blue-600">
              Χρησιμοποιήστε τα controls για να δείτε πώς βλέπει ο πελάτης το PDF και να εξάγετε καθαρές εκδόσεις
            </p>
          </div>
        )}

        <Separator />

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-amber-800 mb-4 flex items-center gap-2">
            <span>📋</span>
            ΟΔΗΓΙΕΣ ΧΡΗΣΗΣ
          </h3>
          <ul className="space-y-2 text-sm text-amber-700">
            <li>• Για αλλαγή τιμών: Εισάγετε ποσοστό και πατήστε "ΕΦΑΡΜΟΓΗ"</li>
            <li>• Για αλλαγή banner: Πατήστε "ΑΛΛΑΓΗ BANNER" και επιλέξτε εικόνα</li>
            <li>• Συμπληρώστε τα στοιχεία του πελάτη στα αντίστοιχα πεδία</li>
            <li>• Μετά τις αλλαγές, χρησιμοποιήστε Ctrl+P για εκτύπωση ή αποθήκευση</li>
            {isAdminMode && (
              <li className="text-blue-700 font-medium">• ADMIN: Χρησιμοποιήστε τα controls πάνω για διαχείριση της εξαγωγής</li>
            )}
          </ul>
        </div>
      </div>
    </Card>
  );
};