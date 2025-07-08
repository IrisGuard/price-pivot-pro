import { useMemo } from 'react';

interface PriceData {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

export const useTotalCalculation = (prices: PriceData[]) => {
  const total = useMemo(() => {
    return prices.reduce((sum, price) => sum + price.value, 0);
  }, [prices]);

  const formattedTotal = useMemo(() => {
    return `€${total.toFixed(2)}`;
  }, [total]);

  return {
    total,
    formattedTotal
  };
};