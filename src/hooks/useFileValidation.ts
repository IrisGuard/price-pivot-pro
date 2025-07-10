import { useCallback } from 'react';

export interface FileValidation {
  isPDF: boolean;
  isRTF: boolean;
  isCSV: boolean;
  isExcel: boolean;
  isValid: boolean;
}

export const useFileValidation = () => {
  const validateFile = useCallback((file: File): FileValidation => {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isPDF = fileExtension === 'pdf' || file.type === 'application/pdf';
    const isRTF = fileExtension === 'rtf' || file.type === 'text/rtf';
    const isCSV = fileExtension === 'csv' || file.type === 'text/csv';
    const isExcel = Boolean(fileExtension?.match(/^(xlsx|xls)$/)) || file.type.includes('spreadsheet');

    return { isPDF, isRTF, isCSV, isExcel, isValid: isPDF || isRTF || isCSV || isExcel };
  }, []);

  const shouldUseOptimizedProcessing = useCallback((file: File, useOptimizedMode: boolean) => {
    return useOptimizedMode || file.size > 10 * 1024 * 1024; // 10MB+ or explicit request
  }, []);

  return {
    validateFile,
    shouldUseOptimizedProcessing
  };
};