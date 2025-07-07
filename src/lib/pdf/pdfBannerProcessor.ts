import { PDFDocument, rgb } from 'pdf-lib';

export class PDFBannerProcessor {
  async replaceBanner(pdfDoc: PDFDocument, bannerImageBytes: Uint8Array): Promise<void> {
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    // Determine image type and embed accordingly
    let bannerImage;
    try {
      bannerImage = await pdfDoc.embedPng(bannerImageBytes);
    } catch {
      try {
        bannerImage = await pdfDoc.embedJpg(bannerImageBytes);
      } catch {
        throw new Error('Unsupported image format');
      }
    }
    
    // Cover existing banner area with white rectangle
    firstPage.drawRectangle({
      x: 350,
      y: 720,
      width: 200,
      height: 70,
      color: rgb(1, 1, 1)
    });
    
    // Add new EUROPLAST GROUP banner
    firstPage.drawImage(bannerImage, {
      x: 380,
      y: 750,
      width: 180,
      height: 60,
    });
  }
}