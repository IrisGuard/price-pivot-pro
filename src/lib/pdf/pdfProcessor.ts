import { PDFDocument, PDFForm } from 'pdf-lib';
import type { InteractivePDFOptions } from './types';
import { PDFSecurityHandler } from './pdfSecurity';
import { PDFPriceProcessor } from './pdfPriceProcessor';
import { PDFBannerProcessor } from './pdfBannerProcessor';
import { PDFFormCreator } from './pdfFormCreator';
import { PDFJavaScriptEngine } from './pdfJavaScriptEngine';

export class InteractivePDFProcessor {
  private pdfDoc: PDFDocument | null = null;
  private form: PDFForm | null = null;
  
  private securityHandler = new PDFSecurityHandler();
  private priceProcessor = new PDFPriceProcessor(this.securityHandler.getSecurityHash());
  private bannerProcessor = new PDFBannerProcessor();
  private formCreator = new PDFFormCreator();
  private jsEngine = new PDFJavaScriptEngine(
    this.securityHandler.getSecuritySignature(),
    this.securityHandler.getSecurityHash()
  );

  async createSealedQuotationPDF(options: InteractivePDFOptions): Promise<Uint8Array> {
    const { factoryPdfBytes, percentage } = options;
    let { bannerImageBytes } = options;
    
    // Load default EUROPLAST banner if none provided
    if (!bannerImageBytes) {
      try {
        const response = await fetch('/europlast-banner.png');
        const arrayBuffer = await response.arrayBuffer();
        bannerImageBytes = new Uint8Array(arrayBuffer);
      } catch (error) {
        console.warn('Could not load default banner:', error);
        // Continue without banner replacement
      }
    }
    
    // Load the factory PDF
    this.pdfDoc = await PDFDocument.load(factoryPdfBytes);
    this.form = this.pdfDoc.getForm();

    // Add security signature for authentication
    await this.securityHandler.addSecuritySignature(this.pdfDoc);
    
    // Apply initial price adjustment and extract price coordinates
    await this.priceProcessor.processPricesWithCoordinates(
      this.pdfDoc, 
      percentage, 
      this.securityHandler.getSecuritySignature()
    );
    
    // Replace banner with supplier's banner (if available)
    if (bannerImageBytes) {
      await this.bannerProcessor.replaceBanner(this.pdfDoc, bannerImageBytes);
    }
    
    // Add comprehensive JavaScript engine with detected prices
    const priceCoordinates = await this.priceProcessor.getDetectedPrices();
    await this.jsEngine.addAdvancedJavaScriptEngine(this.pdfDoc, priceCoordinates);
    
    // Add embedded control panel as last page of PDF
    const { controlPanelCreator } = await import('./controlPanelCreator');
    await controlPanelCreator.addControlPage(this.pdfDoc, priceCoordinates);
    
    // Create interactive form fields for the control panel
    await this.formCreator.createInteractiveControlFields(this.pdfDoc, this.form);
    
    return await this.pdfDoc.save();
  }
}

export const interactivePDFProcessor = new InteractivePDFProcessor();