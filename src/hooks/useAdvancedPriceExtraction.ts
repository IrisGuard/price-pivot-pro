import { useState, useCallback } from 'react';
import { advancedPriceProcessor, type EnhancedPrice } from '@/lib/pdf/advancedPriceProcessor';

export const useAdvancedPriceExtraction = () => {
  const [detectedPrices, setDetectedPrices] = useState<EnhancedPrice[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentPercentage, setCurrentPercentage] = useState(0);

  /**
   * Έξυπνη ανίχνευση τιμών από text
   */
  const extractSmartPrices = useCallback((text: string, pageIndex: number) => {
    setIsDetecting(true);
    
    try {
      const smartPrices = advancedPriceProcessor.extractSmartPrices(text, pageIndex);
      const highConfidencePrices = advancedPriceProcessor.filterHighConfidencePrices(smartPrices);
      
      setDetectedPrices(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPrices = highConfidencePrices.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPrices];
      });
      
      return smartPrices;
    } catch (error) {
      console.error('Smart price extraction error:', error);
      return [];
    } finally {
      setIsDetecting(false);
    }
  }, []);

  /**
   * Position-aware ανίχνευση τιμών
   */
  const extractPositionedPrices = useCallback((
    textItems: Array<{text: string, x: number, y: number, width: number, height: number}>,
    pageIndex: number
  ) => {
    setIsDetecting(true);
    
    try {
      const positionedPrices = advancedPriceProcessor.extractPositionedPrices(textItems, pageIndex);
      
      setDetectedPrices(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPrices = positionedPrices.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPrices];
      });
      
      return positionedPrices;
    } catch (error) {
      console.error('Positioned price extraction error:', error);
      return [];
    } finally {
      setIsDetecting(false);
    }
  }, []);

  /**
   * Εφαρμογή ποσοστού σε όλες τις τιμές
   */
  const applyPercentageToAllPrices = useCallback((percentage: number) => {
    setCurrentPercentage(percentage);
    setDetectedPrices(prev => 
      advancedPriceProcessor.applyPercentageToAllPrices(prev, percentage)
    );
  }, []);

  /**
   * Update μεμονωμένης τιμής
   */
  const updateSinglePrice = useCallback((priceId: string, newValue: number) => {
    setDetectedPrices(prev => 
      advancedPriceProcessor.updateSinglePrice(prev, priceId, newValue)
    );
  }, []);

  /**
   * Reset όλων των τιμών στις αρχικές τους τιμές
   */
  const resetAllPrices = useCallback(() => {
    setCurrentPercentage(0);
    setDetectedPrices(prev => prev.map(price => ({
      ...price,
      value: price.originalValue,
      isModified: false
    })));
  }, []);

  /**
   * Clear όλων των ανιχνευμένων τιμών
   */
  const clearAllPrices = useCallback(() => {
    setDetectedPrices([]);
    setCurrentPercentage(0);
  }, []);

  /**
   * Format τιμής για εμφάνιση
   */
  const formatPrice = useCallback((price: EnhancedPrice): string => {
    return advancedPriceProcessor.formatPrice(price);
  }, []);

  /**
   * Group τιμών βάσει category
   */
  const getGroupedPrices = useCallback(() => {
    return advancedPriceProcessor.groupPricesByCategory(detectedPrices);
  }, [detectedPrices]);

  /**
   * Στατιστικά ανιχνευμένων τιμών
   */
  const getPriceStatistics = useCallback(() => {
    const groupedPrices = getGroupedPrices();
    const totalPrices = detectedPrices.length;
    const modifiedPrices = detectedPrices.filter(p => p.isModified).length;
    const highConfidencePrices = detectedPrices.filter(p => p.confidence >= 0.8).length;
    
    const totalValue = detectedPrices.reduce((sum, price) => sum + price.value, 0);
    const originalTotalValue = detectedPrices.reduce((sum, price) => sum + price.originalValue, 0);
    const percentageChange = originalTotalValue > 0 
      ? ((totalValue - originalTotalValue) / originalTotalValue) * 100 
      : 0;

    return {
      totalPrices,
      modifiedPrices,
      highConfidencePrices,
      totalValue,
      originalTotalValue,
      percentageChange,
      categoryCounts: Object.entries(groupedPrices).reduce((acc, [category, prices]) => {
        acc[category] = prices.length;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [detectedPrices, getGroupedPrices]);

  return {
    // State
    detectedPrices,
    isDetecting,
    currentPercentage,
    
    // Actions
    extractSmartPrices,
    extractPositionedPrices,
    applyPercentageToAllPrices,
    updateSinglePrice,
    resetAllPrices,
    clearAllPrices,
    
    // Utilities
    formatPrice,
    getGroupedPrices,
    getPriceStatistics
  };
};