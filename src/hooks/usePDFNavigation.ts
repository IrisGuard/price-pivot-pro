import { useState, useCallback } from 'react';

export const usePDFNavigation = (totalPages: number = 0) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const goToPage = useCallback((pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      setCurrentPageIndex(pageIndex);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  }, [currentPageIndex, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  }, [currentPageIndex]);

  const resetToFirstPage = useCallback(() => {
    setCurrentPageIndex(0);
  }, []);

  return {
    currentPageIndex,
    goToPage,
    nextPage,
    prevPage,
    resetToFirstPage,
    hasNextPage: currentPageIndex < totalPages - 1,
    hasPrevPage: currentPageIndex > 0,
    currentPageNumber: currentPageIndex + 1
  };
};