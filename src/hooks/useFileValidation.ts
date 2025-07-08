import { useState } from 'react';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: 'pdf' | 'rtf' | 'csv' | 'excel';
  details?: {
    size: string;
    mimeType: string;
    extension: string;
  };
}

export const useFileValidation = () => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFile = (file: File): FileValidationResult => {
    setValidationError(null);

    // Enhanced file details
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop() || '';
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    
    const details = {
      size: `${sizeInMB} MB`,
      mimeType: file.type || 'unknown',
      extension: extension
    };

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      const error = `Το αρχείο είναι πολύ μεγάλο (${sizeInMB} MB). Μέγιστο μέγεθος: 50MB`;
      setValidationError(error);
      return { isValid: false, error, details };
    }

    // Enhanced file type checking with better error messages
    if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
      return { isValid: true, fileType: 'pdf', details };
    } else if (fileName.endsWith('.rtf') || file.type === 'text/rtf') {
      return { isValid: true, fileType: 'rtf', details };
    } else if (fileName.endsWith('.csv') || file.type === 'text/csv') {
      return { isValid: true, fileType: 'csv', details };
    } else if (fileName.match(/\.(xlsx|xls)$/) || file.type.includes('spreadsheet')) {
      return { isValid: true, fileType: 'excel', details };
    } else {
      // Check for common typos
      if (fileName.endsWith('.rpf')) {
        const error = 'Μήπως εννοείτε RTF αρχείο; Το .rpf δεν υποστηρίζεται.';
        setValidationError(error);
        return { isValid: false, error, details };
      }
      
      const supportedTypes = 'PDF, RTF, CSV, Excel (.xlsx, .xls)';
      const error = `Μη υποστηριζόμενος τύπος αρχείου: "${extension}". Υποστηρίζονται: ${supportedTypes}`;
      setValidationError(error);
      return { isValid: false, error, details };
    }
  };

  const clearValidationError = () => {
    setValidationError(null);
  };

  return {
    validateFile,
    validationError,
    clearValidationError
  };
};