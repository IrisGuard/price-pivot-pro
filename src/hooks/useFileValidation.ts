import { useState } from 'react';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: 'pdf' | 'rtf';
}

export const useFileValidation = () => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFile = (file: File): FileValidationResult => {
    setValidationError(null);

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      const error = 'Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: 50MB';
      setValidationError(error);
      return { isValid: false, error };
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.pdf')) {
      return { isValid: true, fileType: 'pdf' };
    } else if (fileName.endsWith('.rtf')) {
      return { isValid: true, fileType: 'rtf' };
    } else {
      const error = 'Μη υποστηριζόμενος τύπος αρχείου. Επιτρέπονται μόνο PDF και RTF αρχεία.';
      setValidationError(error);
      return { isValid: false, error };
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