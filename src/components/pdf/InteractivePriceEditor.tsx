import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  EyeOff, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Package,
  Calculator,
  Truck,
  Info
} from 'lucide-react';
import type { EnhancedPrice } from '@/lib/pdf/advancedPriceProcessor';

interface InteractivePriceEditorProps {
  detectedPrices: EnhancedPrice[];
  onPriceUpdate: (priceId: string, newValue: number) => void;
  onPercentageApply: (percentage: number) => void;
  onReset: () => void;
  isDetecting: boolean;
  statistics: {
    totalPrices: number;
    modifiedPrices: number;
    highConfidencePrices: number;
    totalValue: number;
    originalTotalValue: number;
    percentageChange: number;
    categoryCounts: Record<string, number>;
  };
  groupedPrices: Record<string, EnhancedPrice[]>;
  formatPrice: (price: EnhancedPrice) => string;
}

export const InteractivePriceEditor = ({
  detectedPrices,
  onPriceUpdate,
  onPercentageApply,
  onReset,
  isDetecting,
  statistics,
  groupedPrices,
  formatPrice
}: InteractivePriceEditorProps) => {
  const [showEditor, setShowEditor] = useState(true);
  const [percentage, setPercentage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const handlePercentageApply = () => {
    const value = parseFloat(percentage);
    if (!isNaN(value)) {
      onPercentageApply(value);
      setPercentage('');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'product': return <Package className="h-4 w-4" />;
      case 'total': return <Calculator className="h-4 w-4" />;
      case 'tax': return <DollarSign className="h-4 w-4" />;
      case 'shipping': return <Truck className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'product': return 'Προϊόντα';
      case 'total': return 'Σύνολα';
      case 'tax': return 'Φόροι';
      case 'shipping': return 'Μεταφορικά';
      default: return 'Άλλα';
    }
  };

  if (!showEditor) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowEditor(true)}
        className="fixed top-4 right-4 z-50 bg-white shadow-lg"
      >
        <Eye className="h-4 w-4 mr-2" />
        Επεξεργασία Τιμών ({detectedPrices.length})
      </Button>
    );
  }

  return (
    <Card className="fixed top-4 right-4 w-96 max-h-[80vh] overflow-hidden z-50 bg-white shadow-xl">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            💰 Επεξεργαστής Τιμών
            <Badge variant="secondary">{statistics.totalPrices}</Badge>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEditor(false)}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-muted p-2 rounded text-center">
            <div className="font-medium">{statistics.highConfidencePrices}</div>
            <div className="text-xs text-muted-foreground">Υψηλή Ακρίβεια</div>
          </div>
          <div className="bg-muted p-2 rounded text-center">
            <div className="font-medium">{statistics.modifiedPrices}</div>
            <div className="text-xs text-muted-foreground">Τροποποιημένες</div>
          </div>
        </div>

        {/* Percentage Change Indicator */}
        {statistics.percentageChange !== 0 && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            {statistics.percentageChange > 0 ? 
              <TrendingUp className="h-4 w-4 text-green-600" /> : 
              <TrendingDown className="h-4 w-4 text-red-600" />
            }
            <span className="text-sm font-medium">
              {statistics.percentageChange > 0 ? '+' : ''}{statistics.percentageChange.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">αλλαγή</span>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="+10 ή -15"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handlePercentageApply()}
            />
            <Button onClick={handlePercentageApply} size="sm" disabled={!percentage}>
              Εφαρμογή
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReset}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Επαναφορά
            </Button>
          </div>
        </div>

        {/* Loading */}
        {isDetecting && (
          <div className="text-center space-y-2">
            <Progress value={undefined} className="h-2" />
            <div className="text-sm text-muted-foreground animate-pulse">
              Ανίχνευση τιμών...
            </div>
          </div>
        )}

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Επισκόπηση</TabsTrigger>
            <TabsTrigger value="categories">Κατηγορίες</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-2 max-h-60 overflow-y-auto">
            {detectedPrices.map((price) => (
              <div
                key={price.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm space-x-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2">
                    {formatPrice(price)}
                    {price.confidence >= 0.9 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {Math.round(price.confidence * 100)}%
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {price.context} • Σελ. {price.pageIndex + 1}
                    {price.isModified && (
                      <span className="text-green-600 ml-1">
                        (από €{price.originalValue.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
                <Input
                  type="number"
                  value={price.value.toString()}
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
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-3 max-h-60 overflow-y-auto">
            {Object.entries(groupedPrices).map(([category, prices]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {getCategoryIcon(category)}
                  {getCategoryLabel(category)}
                  <Badge variant="outline" className="text-xs">
                    {prices.length}
                  </Badge>
                </div>
                <div className="space-y-1 pl-6">
                  {prices.map((price) => (
                    <div key={price.id} className="flex items-center justify-between text-xs">
                      <span className="flex-1 truncate">
                        {formatPrice(price)}
                        {price.isModified && <span className="text-green-600 ml-1">*</span>}
                      </span>
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {Math.round(price.confidence * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {detectedPrices.length === 0 && !isDetecting && (
          <div className="text-center text-sm text-muted-foreground py-8">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Δεν βρέθηκαν τιμές στο PDF
            <div className="text-xs mt-1">
              Δοκιμάστε διαφορετικό αρχείο ή ελέγξτε τη μορφή
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};