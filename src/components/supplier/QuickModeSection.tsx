import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuickModeSectionProps {
  percentage: string;
  onPercentageChange: (value: string) => void;
  onCreateQuotation: () => void;
  disabled?: boolean;
}

export const QuickModeSection = ({ 
  percentage, 
  onPercentageChange, 
  onCreateQuotation,
  disabled = false
}: QuickModeSectionProps) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <Label className="text-sm font-medium">Γρήγορη Δημιουργία (χωρίς preview)</Label>
      
      <div className="space-y-2">
        <Label htmlFor="percentage" className="text-sm">
          Εισαγωγή ποσοστού αλλαγής τιμής:
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="percentage"
            type="number"
            placeholder="-15"
            value={percentage}
            onChange={(e) => onPercentageChange(e.target.value)}
            className="w-24"
            step="0.01"
            disabled={disabled}
          />
          <span className="text-sm font-medium">%</span>
          <span className="text-xs text-muted-foreground ml-2">
            (Αρνητικό για έκπτωση, θετικό για αύξηση)
          </span>
        </div>
      </div>

      <Button
        onClick={onCreateQuotation}
        className="w-full h-12 text-lg font-semibold"
        size="lg"
        disabled={disabled}
      >
        🔒 ΔΗΜΙΟΥΡΓΙΑ ΣΦΡΑΓΙΣΜΕΝΟΥ PDF
      </Button>
    </div>
  );
};