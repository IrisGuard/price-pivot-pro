import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Shield, X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminLogin: (key: string) => boolean;
}

export const AdminLoginModal = ({ isOpen, onClose, onAdminLogin }: AdminLoginModalProps) => {
  const [adminKey, setAdminKey] = useState('');

  const handleLogin = () => {
    if (onAdminLogin(adminKey)) {
      toast({
        title: "Admin Access Granted",
        description: "Καλώς ήρθατε στη διαχείριση",
      });
      setAdminKey('');
    } else {
      toast({
        title: "Σφάλμα Πρόσβασης",
        description: "Λάθος κλειδί διαχειριστή",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Admin Access
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="admin-key">Κλειδί Διαχειριστή</Label>
            <Input
              id="admin-key"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Εισάγετε το κλειδί διαχειριστή"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleLogin} className="flex-1">
              Σύνδεση
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Μόνο εξουσιοδοτημένο προσωπικό έχει πρόσβαση στις λειτουργίες διαχείρισης
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};