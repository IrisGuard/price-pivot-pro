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

export interface InteractivePDFOptions {
  factoryPdfBytes: Uint8Array;
  percentage: number;
  bannerImageBytes?: Uint8Array;
  customerData?: {
    name: string;
    profession: string;
    taxId: string;
    phone: string;
  };
  detectedPrices?: PriceInfo[];
}

export interface ProcessingProgress {
  stage: string;
  progress: number;
  message: string;
}

export interface RTFParseResult {
  text: string;
  prices: PriceInfo[];
  formatting?: {
    bold: boolean;
    italic: boolean;
    fontSize: number;
    fontFamily: string;
  };
}

export interface FileProcessingResult {
  success: boolean;
  text?: string;
  prices?: PriceInfo[];
  error?: string;
  fileType: 'pdf' | 'rtf';
}