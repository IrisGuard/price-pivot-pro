import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { getFileProcessingConfig, ENV_CONFIG } from '@/lib/config/environment';
import { performanceMonitor } from '@/lib/performance/monitor';

interface CustomerData {
  name: string;
  profession: string;
  taxId: string;
  phone: string;
}

interface CleanPDFViewerProps {
  pageWidth?: number;
  isAdminMode?: boolean;
  onPercentageChange?: (percentage: number) => void;
  onBannerChange?: (file: File) => void;
  onCustomerDataChange?: (data: CustomerData) => void;
  onExportCleanPDF?: () => void;
}

export const CleanPDFViewer = ({ 
  pageWidth = 595, 
  isAdminMode = false,
  onPercentageChange,
  onBannerChange,
  onCustomerDataChange,
  onExportCleanPDF
}: CleanPDFViewerProps) => {
  const [hideControls, setHideControls] = useState(false);
  const [percentage, setPercentage] = useState<string>('');
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    profession: '',
    taxId: '',
    phone: ''
  });
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const config = getFileProcessingConfig();

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
      // Validate file size
      if (file.size > config.maxFileSize / 10) { // Banner should be smaller
        toast({
          title: "Μέγεθος εικόνας",
          description: `Η εικόνα είναι πολύ μεγάλη (${Math.round(file.size / 1024)}KB). Μέγιστο: ${Math.round(config.maxFileSize / 10 / 1024)}KB`,
          variant: "destructive",
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Τύπος αρχείου",
          description: "Παρακαλώ επιλέξτε μια εικόνα (PNG, JPG, JPEG, GIF)",
          variant: "destructive",
        });
        return;
      }
      
      if (onBannerChange) {
        onBannerChange(file);
      }
      toast({
        title: "Banner ενημερώθηκε",
        description: `Νέο banner: ${file.name} (${Math.round(file.size / 1024)}KB)`,
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

  const handleExportPDF = () => {
    if (onExportCleanPDF) {
      onExportCleanPDF();
    } else {
      window.print();
    }
  };

  if (hideControls && !isAdminMode) {
    return null;
  }

  return (
    <div 
      className="bg-white border shadow-sm mx-auto block mb-4 p-8 print:shadow-none"
      style={{ width: pageWidth + 'px', minHeight: '842px' }}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">
            🔧 ΠΑΝΕΛ ΕΛΕΓΧΟΥ ΠΡΟΣΦΟΡΑΣ
          </h1>
          <p className="text-muted-foreground">
            Χρησιμοποιήστε τα παρακάτω εργαλεία για να παραμετροποιήσετε την προσφορά σας
          </p>
        </div>

        <Separator />

        {/* Price Control Section */}
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
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
            <p className="text-sm text-muted-foreground mt-2">
              Εισάγετε θετικό ή αρνητικό ποσοστό για να αυξήσετε ή να μειώσετε όλες τις τιμές
            </p>
          </div>
        </Card>

        {/* Banner Control Section */}
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
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
            <p className="text-sm text-muted-foreground mt-2">
              Ανεβάστε το δικό σας λογότυπο ή banner για να αντικαταστήσετε το προεπιλεγμένο
            </p>
          </div>
        </Card>

        {/* Customer Data Section */}
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
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
        </Card>

        <Separator />

        {/* Admin Controls */}
        {isAdminMode && (
          <Card className="border-blue-200 bg-blue-50">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <span>⚙️</span>
                ΕΛΕΓΧΟΣ ADMIN
              </h3>
              <div className="space-y-4">
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
                
                <Button 
                  onClick={handleExportPDF}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  📄 ΕΞΑΓΩΓΗ ΚΑΘΑΡΟΥ PDF
                </Button>
                
                <p className="text-xs text-blue-600">
                  Χρησιμοποιήστε αυτές τις ρυθμίσεις για να ελέγξετε τι βλέπουν οι πελάτες
                </p>
              </div>
            </div>
          </Card>
        )}

        <Separator />

        {/* Instructions */}
        <Card className="border-amber-200 bg-amber-50">
          <div className="p-6">
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
        </Card>
      </div>
    </div>
  );
};