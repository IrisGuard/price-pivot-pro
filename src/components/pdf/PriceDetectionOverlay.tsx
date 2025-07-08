import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { DetectedPrice } from '@/hooks/useSmartPriceDetection';

interface PriceDetectionOverlayProps {
  detectedPrices: DetectedPrice[];
  onPriceUpdate: (priceId: string, newValue: number) => void;
  onPercentageApply: (percentage: number) => void;
  onReset: () => void;
  isDetecting: boolean;
}

export const PriceDetectionOverlay = ({
  detectedPrices,
  onPriceUpdate,
  onPercentageApply,
  onReset,
  isDetecting
}: PriceDetectionOverlayProps) => {
  const [showOverlay, setShowOverlay] = useState(true);
  const [percentage, setPercentage] = useState('');

  const handlePercentageApply = () => {
    const value = parseFloat(percentage);
    if (!isNaN(value)) {
      onPercentageApply(value);
    }
  };

  if (!showOverlay) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowOverlay(true)}
        className="fixed top-4 right-4 z-50 bg-white shadow-lg"
      >
        <Eye className="h-4 w-4 mr-2" />
        Εμφάνιση Τιμών
      </Button>
    );
  }

  return (
    <Card className="fixed top-4 right-4 w-80 max-h-96 overflow-y-auto z-50 bg-white shadow-xl">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            💰 Ανιχνευμένες Τιμές
            <Badge variant="secondary">{detectedPrices.length}</Badge>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOverlay(false)}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>

        {/* Percentage Control */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="+10 ή -15"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handlePercentageApply} size="sm">
              Εφαρμογή
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReset}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Επαναφορά
          </Button>
        </div>

        {/* Loading */}
        {isDetecting && (
          <div className="text-center text-sm text-muted-foreground">
            <div className="animate-pulse">Ανίχνευση τιμών...</div>
          </div>
        )}

        {/* Price List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {detectedPrices.map((price) => (
            <div
              key={price.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
            >
              <div className="flex-1">
                <div className="font-medium">
                  €{price.isModified && price.newValue !== undefined 
                    ? price.newValue.toFixed(2) 
                    : price.value.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Σελίδα {price.pageIndex + 1}
                  {price.isModified && (
                    <span className="text-green-600 ml-1">
                      (από €{price.value.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
              <Input
                type="number"
                value={price.newValue?.toString() || price.value.toString()}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  if (!isNaN(newValue)) {
                    onPriceUpdate(price.id, newValue);
                  }
                }}
                className="w-20 h-8 text-xs"
                step="0.01"
              />
            </div>
          ))}
        </div>

        {detectedPrices.length === 0 && !isDetecting && (
          <div className="text-center text-sm text-muted-foreground">
            Δεν βρέθηκαν τιμές στο PDF
          </div>
        )}
      </div>
    </Card>
  );
};