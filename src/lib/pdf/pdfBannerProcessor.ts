import { PDFDocument, PDFImage, PageSizes } from 'pdf-lib';

export class PDFBannerProcessor {
  async replaceBanner(pdfDoc: PDFDocument, bannerImageBytes: Uint8Array): Promise<void> {
    try {
      console.log('🖼️ Processing banner image for PDF...');
      
      // Determine image format and embed
      let bannerImage: PDFImage;
      const imageHeader = Array.from(bannerImageBytes.slice(0, 4));
      
      if (imageHeader[0] === 0xFF && imageHeader[1] === 0xD8) {
        bannerImage = await pdfDoc.embedJpg(bannerImageBytes);
      } else if (imageHeader[0] === 0x89 && imageHeader[1] === 0x50) {
        bannerImage = await pdfDoc.embedPng(bannerImageBytes);
      } else {
        console.warn('Unsupported image format for banner');
        return;
      }
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      const bannerHeight = Math.min(120, height * 0.15);
      const bannerWidth = width - 40;
      
      const imageAspectRatio = bannerImage.width / bannerImage.height;
      let drawWidth = bannerWidth;
      let drawHeight = bannerHeight;
      
      if (imageAspectRatio > bannerWidth / bannerHeight) {
        drawHeight = drawWidth / imageAspectRatio;
      } else {
        drawWidth = drawHeight * imageAspectRatio;
      }
      
      const x = (width - drawWidth) / 2;
      const y = height - drawHeight - 20;
      
      firstPage.drawImage(bannerImage, {
        x, y, width: drawWidth, height: drawHeight,
      });
      
      console.log(`✅ Banner placed: ${drawWidth}x${drawHeight} at (${x}, ${y})`);
      
    } catch (error) {
      console.error('❌ Error processing banner:', error);
    }
  }
}