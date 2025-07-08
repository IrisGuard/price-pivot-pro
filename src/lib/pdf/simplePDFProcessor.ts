import { PDFDocument } from 'pdf-lib';
import { priceDetector } from './priceDetector';
import { controlPanelCreator } from './controlPanelCreator';
import { javaScriptIntegrator } from './javascriptIntegrator';

export class SimplePDFProcessor {
  async processFactoryPDF(pdfBytes: Uint8Array): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Detect real prices in the PDF
    const prices = await priceDetector.detectRealPrices(pdfDoc);
    
    // Add control page at the end
    await controlPanelCreator.addControlPage(pdfDoc, prices);
    
    // Add JavaScript functionality
    await javaScriptIntegrator.addInteractiveJavaScript(pdfDoc, prices);
    
    return await pdfDoc.save();
  }
}

export const simplePDFProcessor = new SimplePDFProcessor();