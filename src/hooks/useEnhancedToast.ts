import { useToast as useBaseToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

export const useEnhancedToast = () => {
  const { toast } = useBaseToast();

  const showSuccess = useCallback((message: string, description?: string) => {
    toast({
      title: "✅ Επιτυχία",
      description: description || message,
      duration: 3000,
    });
  }, [toast]);

  const showError = useCallback((message: string, description?: string) => {
    toast({
      title: "❌ Σφάλμα",
      description: description || message,
      variant: "destructive",
      duration: 5000,
    });
  }, [toast]);

  const showWarning = useCallback((message: string, description?: string) => {
    toast({
      title: "⚠️ Προειδοποίηση",
      description: description || message,
      duration: 4000,
    });
  }, [toast]);

  const showInfo = useCallback((message: string, description?: string) => {
    toast({
      title: "ℹ️ Πληροφορία",
      description: description || message,
      duration: 3000,
    });
  }, [toast]);

  const showProgress = useCallback((message: string, progress?: number) => {
    const progressText = progress !== undefined ? ` (${Math.round(progress)}%)` : '';
    toast({
      title: "🔄 Επεξεργασία...",
      description: `${message}${progressText}`,
      duration: 2000,
    });
  }, [toast]);

  return {
    toast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showProgress
  };
};