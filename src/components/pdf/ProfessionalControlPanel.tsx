import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Shield, LogOut } from 'lucide-react';
import { useClientMode } from '@/hooks/useClientMode';
import { useAdminMode } from '@/hooks/useAdminMode';
import { cleanPDFExporter } from '@/lib/pdf/cleanPDFExporter';
import { AdminLoginModal } from './AdminLoginModal';
import { EnhancedExportDialog } from './EnhancedExportDialog';

interface CustomerData {
  name: string;
  profession: string;
  taxId: string;
  phone: string;
}

interface ProfessionalControlPanelProps {
  pageWidth?: number;
  pdfFile?: File | null;
  onPercentageChange?: (percentage: number) => void;
  onBannerChange?: (file: File) => void;
  onCustomerDataChange?: (data: CustomerData) => void;
  onExportCleanPDF?: () => void;
}

export const ProfessionalControlPanel = ({ 
  pageWidth = 595, 
  pdfFile,
  onPercentageChange,
  onBannerChange,
  onCustomerDataChange,
  onExportCleanPDF
}: ProfessionalControlPanelProps) => {
  const [hideControls, setHideControls] = useState(false);
  const { isClientMode, showControls, toggleClientMode, enterClientMode, enterAdminMode } = useClientMode();
  const { isAdminMode, showAdminLogin, enterAdminMode: handleAdminLogin, exitAdminMode, toggleAdminLogin } = useAdminMode();
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
        toast({
          title: "🔄 Δημιουργία PDF",
          description: "Προετοιμασία σφραγισμένου PDF με όλες τις παραμέτρους...",
        });

        // Import the PDF processor
        const { interactivePDFProcessor } = await import("@/lib/pdf/pdfProcessor");
        
        // Get file as bytes
        const factoryPdfBytes = new Uint8Array(await pdfFile.arrayBuffer());
        
        // Create sealed PDF with customer data and settings
        const sealedPdfBytes = await interactivePDFProcessor.createSealedQuotationPDF({
          factoryPdfBytes,
          percentage: parseFloat(percentage) || 0,
        });
        
        // Download the file
        const blob = new Blob([sealedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Προσφορά_${customerData.name || 'Πελάτης'}_${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "✅ PDF Ετοιμο",
          description: `Το σφραγισμένο PDF (${(sealedPdfBytes.length / 1024).toFixed(1)} KB) εξήχθη επιτυχώς`,
        });
      } catch (error) {
        console.error('PDF Export Error:', error);
        toast({
          title: "❌ Σφάλμα",
          description: "Σφάλμα κατά την εξαγωγή του PDF. Δοκιμάστε ξανά.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Σφάλμα",
        description: "Δεν υπάρχει αρχείο για εξαγωγή",
        variant: "destructive",
      });
    }
  };

  const handleEnhancedExport = async (securitySettings: any) => {
    if (!pdfFile) {
      throw new Error('Δεν υπάρχει αρχείο PDF');
    }

    try {
      const originalBytes = new Uint8Array(await pdfFile.arrayBuffer());
      
      const cleanBytes = await cleanPDFExporter.createCleanPDF(originalBytes, {
        removeControlPanels: true,
        applyCustomerData: Object.values(customerData).some(v => v.trim()),
        customerData: customerData,
        security: {
          password: securitySettings.password,
          watermarkText: securitySettings.watermarkText,
          watermarkOpacity: securitySettings.watermarkOpacity / 100,
          preventPrinting: securitySettings.preventPrinting,
          preventCopying: securitySettings.preventCopying
        },
        onProgress: (progress, status) => {
          // Progress will be handled by the dialog
        }
      });

      await cleanPDFExporter.downloadCleanPDF(cleanBytes, 'Προσφορά_Προστατευμένη.pdf');
    } catch (error) {
      console.error('Enhanced export error:', error);
      throw error;
    }
  };

  // Hide controls in client mode or when explicitly hidden
  if ((hideControls && !isAdminMode) || (isClientMode && !showControls)) {
    return null;
  }

  return (
    <>
      <Card 
        className={`shadow-lg print:shadow-none pdf-control-panel print-hide w-full ${
          isAdminMode ? 'bg-blue-50 border-blue-200' : 'bg-card'
        }`}
        style={{ maxWidth: pageWidth + 'px' }}
      >
        <div className="p-8 space-y-8">
          {/* Header with Mode Toggle */}
        <div className="text-center">
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-3xl font-bold ${isAdminMode ? 'text-blue-800' : 'text-primary'}`}>
              {isAdminMode ? '⚙️ ADMIN - ΠΑΝΕΛ ΕΛΕΓΧΟΥ' : '🔧 ΠΑΝΕΛ ΕΛΕΓΧΟΥ ΠΡΟΣΦΟΡΑΣ'}
            </h1>
            <div className="flex items-center gap-2">
              {!isAdminMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAdminLogin}
                  className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              )}
              {isAdminMode && (
                <>
                  <Button
                    variant={isClientMode ? "outline" : "default"}
                    size="sm"
                    onClick={toggleClientMode}
                    className="flex items-center gap-2"
                  >
                    {isClientMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {isClientMode ? "Προβολή Πελάτη" : "Προβολή Admin"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={exitAdminMode}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Έξοδος
                  </Button>
                </>
              )}
            </div>
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
              onChange={(e) => {
                const newValue = e.target.value;
                setPercentage(newValue);
                // Real-time percentage application
                const numValue = parseFloat(newValue);
                if (!isNaN(numValue) && onPercentageChange) {
                  onPercentageChange(numValue);
                }
              }}
              className="w-32"
              disabled={false} // Always enabled for clients
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
              disabled={false} // Always enabled for clients
            >
              ΑΛΛΑΓΗ BANNER
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveBanner}
              disabled={false} // Always enabled for clients
            >
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
                disabled={false} // Always enabled for clients
              />
            </div>
            <div>
              <Label htmlFor="customer-profession">Επάγγελμα</Label>
              <Input
                id="customer-profession"
                value={customerData.profession}
                onChange={(e) => handleCustomerDataUpdate('profession', e.target.value)}
                placeholder="Εισάγετε επάγγελμα"
                disabled={false} // Always enabled for clients
              />
            </div>
            <div>
              <Label htmlFor="customer-tax">Α.Φ.Μ.</Label>
              <Input
                id="customer-tax"
                value={customerData.taxId}
                onChange={(e) => handleCustomerDataUpdate('taxId', e.target.value)}
                placeholder="Εισάγετε Α.Φ.Μ."
                disabled={false} // Always enabled for clients
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">Τηλέφωνο</Label>
              <Input
                id="customer-phone"
                value={customerData.phone}
                onChange={(e) => handleCustomerDataUpdate('phone', e.target.value)}
                placeholder="Εισάγετε τηλέφωνο"
                disabled={false} // Always enabled for clients
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
            
            <div className="grid grid-cols-1 gap-4">
              <Button 
                onClick={handleExportPDF}
                className="bg-blue-600 hover:bg-blue-700"
              >
                📄 ΕΞΑΓΩΓΗ ΚΑΘΑΡΟΥ PDF
              </Button>
              
              <EnhancedExportDialog 
                onExport={handleEnhancedExport}
                disabled={!pdfFile}
              />
              
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
      
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={toggleAdminLogin}
        onAdminLogin={handleAdminLogin}
      />
    </>
  );
};