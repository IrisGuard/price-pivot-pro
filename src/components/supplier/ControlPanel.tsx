import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ControlPanelProps {
  percentage: string;
  isProcessing: boolean;
  onPercentageChange: (value: string) => void;
  onCreateQuotation: () => void;
}

export const ControlPanel = ({ 
  percentage, 
  isProcessing, 
  onPercentageChange, 
  onCreateQuotation 
}: ControlPanelProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          
          {/* Banner Control */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Banner</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Αλλαγή
              </Button>
              <Button variant="outline" size="sm">
                Αφαίρεση
              </Button>
            </div>
          </div>

          {/* Price Control */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ποσοστό Τιμών</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="+10 ή -15"
                value={percentage}
                onChange={(e) => onPercentageChange(e.target.value)}
                className="w-20"
              />
              <Button variant="outline" size="sm">
                Εφαρμογή
              </Button>
            </div>
          </div>

          {/* Export */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Τελικό PDF</Label>
            <Button
              onClick={onCreateQuotation}
              disabled={isProcessing}
              className="w-full"
              size="sm"
            >
              {isProcessing ? "Δημιουργία..." : "Κατέβασμα"}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};