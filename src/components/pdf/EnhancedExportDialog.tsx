import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Shield, Lock, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SecuritySettings {
  password: string;
  watermarkText: string;
  watermarkOpacity: number;
  preventPrinting: boolean;
  preventCopying: boolean;
}

interface EnhancedExportDialogProps {
  onExport: (security: SecuritySettings) => Promise<void>;
  disabled?: boolean;
}

export const EnhancedExportDialog = ({ onExport, disabled }: EnhancedExportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const [security, setSecurity] = useState<SecuritySettings>({
    password: '',
    watermarkText: 'EUROPLAST ΠΡΟΣΦΟΡΑ',
    watermarkOpacity: 10,
    preventPrinting: false,
    preventCopying: false
  });

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setStatus('Έναρξη εξαγωγής...');
    
    try {
      await onExport(security);
      setIsOpen(false);
      toast({
        title: "✅ Επιτυχής Εξαγωγή",
        description: "Το PDF δημιουργήθηκε και κατέβηκε επιτυχώς",
      });
    } catch (error) {
      toast({
        title: "Σφάλμα Εξαγωγής",
        description: error instanceof Error ? error.message : "Άγνωστο σφάλμα",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setProgress(0);
      setStatus('');
    }
  };

  const updateSecurity = (field: keyof SecuritySettings, value: any) => {
    setSecurity(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4 mr-2" />
          ΕΞΑΓΩΓΗ ΠΡΟΣΤΑΤΕΥΜΕΝΟΥ PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Προστατευμένη Εξαγωγή PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Password Protection */}
          <Card className="p-4">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4" />
                Προστασία με Κωδικό
              </Label>
              <Input
                type="password"
                placeholder="Εισάγετε κωδικό (προαιρετικό)"
                value={security.password}
                onChange={(e) => updateSecurity('password', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={security.preventPrinting}
                    onCheckedChange={(checked) => updateSecurity('preventPrinting', checked)}
                  />
                  <Label className="text-sm">Απαγόρευση εκτύπωσης</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={security.preventCopying}
                    onCheckedChange={(checked) => updateSecurity('preventCopying', checked)}
                  />
                  <Label className="text-sm">Απαγόρευση αντιγραφής</Label>
                </div>
              </div>
            </div>
          </Card>

          {/* Watermark Settings */}
          <Card className="p-4">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 font-medium">
                <FileText className="w-4 h-4" />
                Υδατογράφημα
              </Label>
              <Input
                placeholder="Κείμενο υδατογραφήματος"
                value={security.watermarkText}
                onChange={(e) => updateSecurity('watermarkText', e.target.value)}
              />
              <div className="space-y-2">
                <Label className="text-sm">Διαφάνεια: {security.watermarkOpacity}%</Label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={security.watermarkOpacity}
                  onChange={(e) => updateSecurity('watermarkOpacity', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">{status}</p>
            </div>
          )}

          <Separator />

          {/* Export Button */}
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isExporting ? 'Εξαγωγή σε εξέλιξη...' : 'ΕΞΑΓΩΓΗ ΠΡΟΣΤΑΤΕΥΜΕΝΟΥ PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};