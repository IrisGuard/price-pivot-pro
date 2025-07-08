import { useState, useCallback } from 'react';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import { toast } from '@/hooks/use-toast';

export interface CustomerData {
  name: string;
  profession: string;
  taxId: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface CustomerFieldPlacement {
  field: keyof CustomerData;
  x: number;
  y: number;
  pageIndex: number;
  fontSize: number;
  maxWidth: number;
}

export const useCustomerDataIntegration = () => {
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    profession: '',
    taxId: '',
    phone: '',
    email: '',
    address: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const updateCustomerData = useCallback((field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  }, []);

  const detectCustomerPlaceholders = useCallback(async (pdfDoc: PDFDocument): Promise<CustomerFieldPlacement[]> => {
    // Ανίχνευση placeholder patterns στο PDF
    const placeholders: CustomerFieldPlacement[] = [];
    
    // Προκαθορισμένες θέσεις για common patterns
    const commonPlacements: CustomerFieldPlacement[] = [
      // Συνήθως στο header ή footer
      { field: 'name', x: 100, y: 50, pageIndex: 0, fontSize: 12, maxWidth: 200 },
      { field: 'profession', x: 100, y: 35, pageIndex: 0, fontSize: 10, maxWidth: 200 },
      { field: 'taxId', x: 300, y: 50, pageIndex: 0, fontSize: 10, maxWidth: 100 },
      { field: 'phone', x: 300, y: 35, pageIndex: 0, fontSize: 10, maxWidth: 150 },
    ];

    return commonPlacements;
  }, []);

  const applyCustomerDataToPDF = useCallback(async (
    originalPdfBytes: Uint8Array,
    customerInfo?: CustomerData
  ): Promise<Uint8Array> => {
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      const dataToUse = customerInfo || customerData;

      // Έλεγχος αν υπάρχουν δεδομένα πελάτη
      const hasData = Object.values(dataToUse).some(value => value && value.trim() !== '');
      
      if (!hasData) {
        toast({
          title: "Δεν υπάρχουν στοιχεία πελάτη",
          description: "Δεν προστέθηκαν στοιχεία στο PDF",
        });
        return originalPdfBytes;
      }

      // Ανίχνευση θέσεων για τα δεδομένα πελάτη
      const placements = await detectCustomerPlaceholders(pdfDoc);
      
      // Εφαρμογή δεδομένων στο PDF
      const pages = pdfDoc.getPages();
      
      for (const placement of placements) {
        const page = pages[placement.pageIndex];
        const value = dataToUse[placement.field];
        
        if (value && value.trim() !== '') {
          // Καθαρισμός περιοχής (λευκό παραλληλόγραμμο)
          page.drawRectangle({
            x: placement.x - 5,
            y: placement.y - 5,
            width: placement.maxWidth + 10,
            height: placement.fontSize + 10,
            color: rgb(1, 1, 1)
          });

          // Προσθήκη κειμένου
          let displayText = value;
          
          // Formatting ανάλογα με το πεδίο
          switch (placement.field) {
            case 'name':
              displayText = `Πελάτης: ${value}`;
              break;
            case 'profession':
              displayText = `Επάγγελμα: ${value}`;
              break;
            case 'taxId':
              displayText = `ΑΦΜ: ${value}`;
              break;
            case 'phone':
              displayText = `Τηλ.: ${value}`;
              break;
          }

          page.drawText(displayText, {
            x: placement.x,
            y: placement.y,
            size: placement.fontSize,
            color: rgb(0, 0, 0)
          });
        }
      }

      // Προσθήκη footer με όλα τα στοιχεία
      const lastPage = pages[pages.length - 1];
      const { height } = lastPage.getSize();
      
      let footerY = 30;
      const footerFields = [
        { label: 'Πελάτης', value: dataToUse.name },
        { label: 'Επάγγελμα', value: dataToUse.profession },
        { label: 'ΑΦΜ', value: dataToUse.taxId },
        { label: 'Τηλέφωνο', value: dataToUse.phone }
      ];

      footerFields.forEach(({ label, value }) => {
        if (value && value.trim() !== '') {
          lastPage.drawText(`${label}: ${value}`, {
            x: 50,
            y: footerY,
            size: 9,
            color: rgb(0.3, 0.3, 0.3)
          });
          footerY += 12;
        }
      });

      toast({
        title: "Στοιχεία πελάτη ενημερώθηκαν",
        description: "Τα στοιχεία του πελάτη προστέθηκαν στο PDF",
      });

      return await pdfDoc.save();
    } catch (error) {
      console.error('Σφάλμα κατά την ενημέρωση στοιχείων πελάτη:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την ενημέρωση στοιχείων πελάτη",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [customerData]);

  const resetCustomerData = useCallback(() => {
    setCustomerData({
      name: '',
      profession: '',
      taxId: '',
      phone: '',
      email: '',
      address: ''
    });
  }, []);

  return {
    customerData,
    isProcessing,
    updateCustomerData,
    applyCustomerDataToPDF,
    resetCustomerData
  };
};