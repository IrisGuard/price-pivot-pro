import { useState, useCallback } from 'react';

export interface ProcessingResult {
  type: 'pdf' | 'rtf' | 'csv' | 'excel';
  content?: File;
  contacts?: any[];
  emails?: string[];
  text?: string;
  error?: string;
}

export const useFileProcessingState = () => {
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [useOptimizedMode, setUseOptimizedMode] = useState(false);
  const [showOptimizedLoader, setShowOptimizedLoader] = useState(false);

  const resetProcessing = useCallback(() => {
    setProcessingResult(null);
    setIsProcessing(false);
    setProgress(0);
    setStage('');
    setShowOptimizedLoader(false);
  }, []);

  const initializeProcessing = useCallback(() => {
    setProcessingResult(null);
    setProgress(0);
    setStage('');
    setShowOptimizedLoader(false);
  }, []);

  return {
    processingResult,
    isProcessing,
    progress,
    stage,
    useOptimizedMode,
    showOptimizedLoader,
    setProcessingResult,
    setIsProcessing,
    setProgress,
    setStage,
    setUseOptimizedMode,
    setShowOptimizedLoader,
    resetProcessing,
    initializeProcessing
  };
};