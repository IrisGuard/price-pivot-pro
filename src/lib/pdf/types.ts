export interface InteractivePDFOptions {
  factoryPdfBytes: Uint8Array;
  bannerImageBytes?: Uint8Array;
  percentage: number;
}

export interface PriceInfo {
  value: number;
  x: number;
  y: number;
  pageIndex: number;
}

export interface PriceMetadata {
  prices: PriceInfo[];
  security: string;
  timestamp: number;
}