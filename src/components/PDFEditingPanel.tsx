import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, Palette, Upload, X, Image, User, FileDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BannerState } from '@/hooks/useBannerReplacement';
import { useCustomerDataIntegration, CustomerData } from '@/hooks/useCustomerDataIntegration';

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

interface PDFEditingPanelProps {
  detectedPrices: PriceData[];
  onPriceUpdate: (prices: PriceData[]) => void;
  onExportPDF: (customerData?: CustomerData) => void;
  onCleanExport?: (customerData?: CustomerData) => void;
  isProcessing: boolean;
  bannerState: BannerState;
  onBannerLoad: (file: File) => void;
  onBannerRemove: () => void;
}

export const PDFEditingPanel = ({ 
  detectedPrices, 
  onPriceUpdate, 
  onExportPDF, 
  onCleanExport,
  isProcessing,
  bannerState,
  onBannerLoad,
  onBannerRemove
}: PDFEditingPanelProps) => {
  const [percentage, setPercentage] = useState<number>(0);
  const [customPrices, setCustomPrices] = useState<PriceData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { customerData, updateCustomerData } = useCustomerDataIntegration();

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        onBannerLoad(file);
      } else {
        toast({
          title: "Μη υποστηριζόμενος τύπος αρχείου",
          description: "Παρακαλώ επιλέξτε εικόνα (PNG, JPG, JPEG)",
          variant: "destructive",
        });
      }
    }
  };

  const handleBannerClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    setCustomPrices(detectedPrices);
  }, [detectedPrices]);

  const applyPercentageChange = (newPercentage: number) => {
    setPercentage(newPercentage);
    const multiplier = 1 + (newPercentage / 100);
    const updatedPrices = detectedPrices.map(price => ({
      ...price,
      value: Math.round(price.value * multiplier * 100) / 100
    }));
    setCustomPrices(updatedPrices);
    onPriceUpdate(updatedPrices);
    
    toast({
      title: "Τιμές Ενημερώθηκαν",
      description: `Εφαρμόστηκε ${newPercentage > 0 ? '+' : ''}${newPercentage}% στις τιμές`,
    });
  };

  const updateIndividualPrice = (index: number, newValue: number) => {
    const updatedPrices = [...customPrices];
    updatedPrices[index] = { ...updatedPrices[index], value: newValue };
    setCustomPrices(updatedPrices);
    onPriceUpdate(updatedPrices);
  };

  const resetPrices = () => {
    setPercentage(0);
    setCustomPrices(detectedPrices);
    onPriceUpdate(detectedPrices);
    toast({
      title: "Επαναφορά Τιμών",
      description: "Οι τιμές επαναφέρθηκαν στις αρχικές τους τιμές",
    });
  };

  const totalOriginal = detectedPrices.reduce((sum, price) => sum + price.value, 0);
  const totalCurrent = customPrices.reduce((sum, price) => sum + price.value, 0);
  const actualPercentage = totalOriginal > 0 ? ((totalCurrent - totalOriginal) / totalOriginal) * 100 : 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Πίνακας Επεξεργασίας PDF
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6 overflow-auto">
        {/* Global Price Adjustment */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Συνολικό Ποσοστό Αλλαγής</Label>
            <Badge variant={percentage === 0 ? "secondary" : percentage > 0 ? "destructive" : "default"}>
              {percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%
            </Badge>
          </div>
          
          <Slider
            value={[percentage]}
            onValueChange={(value) => applyPercentageChange(value[0])}
            min={-50}
            max={50}
            step={0.5}
            className="w-full"
          />
          
          <div className="flex gap-2">
            <Input
              type="number"
              value={percentage}
              onChange={(e) => applyPercentageChange(Number(e.target.value))}
              step="0.1"
              className="w-24"
            />
            <Button variant="outline" size="sm" onClick={resetPrices}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Επαναφορά
            </Button>
          </div>
        </div>

        <Separator />

        {/* Price Summary */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Σύνοψη Τιμών</Label>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Αρχικό Σύνολο:</p>
              <p className="font-medium">€{totalOriginal.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Νέο Σύνολο:</p>
              <p className="font-medium text-primary">€{totalCurrent.toFixed(2)}</p>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              Πραγματική Αλλαγή: {actualPercentage >= 0 ? '+' : ''}{actualPercentage.toFixed(2)}%
            </p>
          </div>
        </div>

        <Separator />

        {/* Individual Price Editing */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">
            Επεξεργασία Μεμονωμένων Τιμών ({detectedPrices.length} τιμές)
          </Label>
          
          <div className="space-y-3 max-h-80 overflow-auto">
            {customPrices.map((price, index) => {
              const originalPrice = detectedPrices[index]?.value || 0;
              const change = ((price.value - originalPrice) / originalPrice) * 100;
              
              return (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Τιμή {index + 1}</span>
                    <Badge 
                      variant={Math.abs(change) < 0.01 ? "secondary" : change > 0 ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={price.value.toFixed(2)}
                      onChange={(e) => updateIndividualPrice(index, Number(e.target.value))}
                      step="0.01"
                      className="text-sm"
                    />
                    <span className="text-sm text-muted-foreground">€</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Αρχική: €{originalPrice.toFixed(2)} | Σελίδα {price.pageIndex + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Banner Upload Section */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Image className="h-4 w-4" />
            Logo/Banner Επιχείρησης
          </Label>
          
          {bannerState.bannerPreview ? (
            <div className="space-y-3">
              <div className="relative border rounded-lg overflow-hidden">
                <img
                  src={bannerState.bannerPreview}
                  alt="Banner Preview"
                  className="w-full h-20 object-contain bg-muted"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={onBannerRemove}
                  disabled={bannerState.isProcessing}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Banner: {bannerState.currentBanner?.name}
              </p>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onClick={handleBannerClick}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                Κάντε κλικ για ανέβασμα banner
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG μέχρι 5MB
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
          />

          {bannerState.isProcessing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
              Επεξεργασία banner...
            </div>
          )}
        </div>

        <Separator />

        {/* Customer Data Section */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Στοιχεία Πελάτη
          </Label>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="customer-name" className="text-xs">Όνομα Πελάτη</Label>
              <Input
                id="customer-name"
                value={customerData.name}
                onChange={(e) => updateCustomerData('name', e.target.value)}
                placeholder="Όνομα πελάτη"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-profession" className="text-xs">Επάγγελμα</Label>
              <Input
                id="customer-profession"
                value={customerData.profession}
                onChange={(e) => updateCustomerData('profession', e.target.value)}
                placeholder="Επάγγελμα"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-taxid" className="text-xs">Α.Φ.Μ.</Label>
              <Input
                id="customer-taxid"
                value={customerData.taxId}
                onChange={(e) => updateCustomerData('taxId', e.target.value)}
                placeholder="ΑΦΜ"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone" className="text-xs">Τηλέφωνο</Label>
              <Input
                id="customer-phone"
                value={customerData.phone}
                onChange={(e) => updateCustomerData('phone', e.target.value)}
                placeholder="Τηλέφωνο"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Export Section */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Εξαγωγή PDF</Label>
          
          <div className="space-y-3">
            <Button 
              onClick={() => onExportPDF(customerData)} 
              disabled={isProcessing}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  Δημιουργία PDF...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  ΔΗΜΙΟΥΡΓΙΑ ΣΦΡΑΓΙΣΜΕΝΟΥ PDF
                </>
              )}
            </Button>
            
            {onCleanExport && (
              <Button 
                onClick={() => onCleanExport(customerData)} 
                disabled={isProcessing}
                variant="secondary"
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                size="lg"
              >
                <FileDown className="h-4 w-4 mr-2" />
                ΕΞΑΓΩΓΗ ΕΠΑΓΓΕΛΜΑΤΙΚΟΥ PDF
              </Button>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <div>
              <strong>Σφραγισμένο PDF:</strong> Περιέχει διαδραστικά elements για επεξεργασία
            </div>
            <div>
              <strong>Επαγγελματικό PDF:</strong> Καθαρή προσφορά έτοιμη για αποστολή
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};