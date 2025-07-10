import { lazy, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Lazy load heavy PDF components for better performance
const HybridPDFViewer = lazy(() => 
  import('@/components/pdf/HybridPDFViewer').then(module => ({
    default: module.HybridPDFViewer
  }))
);

const ProfessionalPDFViewer = lazy(() => 
  import('@/components/pdf/ProfessionalPDFViewer').then(module => ({
    default: module.ProfessionalPDFViewer
  }))
);

interface LazyPDFViewerProps {
  pdfFile: File | null;
  mode?: 'hybrid' | 'professional';
  onTextExtracted?: (text: string) => void;
  onPricesDetected?: (prices: Array<{ value: number; x: number; y: number; pageIndex: number }>) => void;
  detectedPrices?: Array<{ value: number; x: number; y: number; pageIndex: number }>;
}

const LoadingFallback = () => (
  <Card className="w-full h-full flex items-center justify-center min-h-[600px]">
    <div className="text-center space-y-4">
      <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
      <div className="space-y-2">
        <p className="text-lg font-medium">Φόρτωση PDF επεξεργαστή...</p>
        <p className="text-sm text-muted-foreground">Βελτιστοποίηση για καλύτερη απόδοση</p>
      </div>
    </div>
  </Card>
);

export const LazyPDFViewer = ({ 
  mode = 'hybrid', 
  ...props 
}: LazyPDFViewerProps) => {
  const Component = mode === 'professional' ? ProfessionalPDFViewer : HybridPDFViewer;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
};