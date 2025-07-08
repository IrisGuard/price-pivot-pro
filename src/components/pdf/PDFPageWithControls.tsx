import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

interface PDFPageWithControlsProps {
  pageWidth?: number;
  showControls?: boolean;
  onPercentageChange?: (percentage: number) => void;
  onBannerChange?: (file: File) => void;
  onCustomerDataChange?: (data: CustomerData) => void;
}

interface CustomerData {
  name: string;
  profession: string;
  taxId: string;
  phone: string;
}

export const PDFPageWithControls = ({ 
  pageWidth = 595, 
  showControls = true,
  onPercentageChange,
  onBannerChange,
  onCustomerDataChange
}: PDFPageWithControlsProps) => {
  const [percentage, setPercentage] = useState<string>('');
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    profession: '',
    taxId: '',
    phone: ''
  });

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

  if (!showControls) {
    return null;
  }

  return (
    <div 
      className="bg-white border shadow-sm mx-auto block mb-4 p-8"
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              1. ΑΛΛΑΓΗ ΠΟΣΟΣΤΟΥ ΤΙΜΩΝ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Banner Control Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🖼️</span>
              2. ΑΛΛΑΓΗ BANNER/ΛΟΓΟΤΥΠΟΥ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerFileChange}
                className="hidden"
                id="banner-upload"
              />
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <label htmlFor="banner-upload" className="cursor-pointer">
                  ΑΛΛΑΓΗ BANNER
                </label>
              </Button>
              <Button variant="destructive" onClick={handleRemoveBanner}>
                ΑΦΑΙΡΕΣΗ BANNER
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Ανεβάστε το δικό σας λογότυπο ή banner για να αντικαταστήσετε το προεπιλεγμένο
            </p>
          </CardContent>
        </Card>

        {/* Customer Data Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">👤</span>
              3. ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Separator />

        {/* Instructions */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <span className="text-xl">📋</span>
              ΟΔΗΓΙΕΣ ΧΡΗΣΗΣ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-amber-700">
              <li>• Για αλλαγή τιμών: Εισάγετε ποσοστό και πατήστε "ΕΦΑΡΜΟΓΗ"</li>
              <li>• Για αλλαγή banner: Πατήστε "ΑΛΛΑΓΗ BANNER" και επιλέξτε εικόνα</li>
              <li>• Συμπληρώστε τα στοιχεία του πελάτη στα αντίστοιχα πεδία</li>
              <li>• Μετά τις αλλαγές, χρησιμοποιήστε Ctrl+P για εκτύπωση ή αποθήκευση</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};