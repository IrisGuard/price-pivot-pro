import { PDFDocument, PDFImage, PageSizes, rgb } from 'pdf-lib';

export class PDFBannerProcessor {
  async replaceBanner(pdfDoc: PDFDocument, bannerImageBytes: Uint8Array): Promise<void> {
    try {
      console.log('🖼️ Replacing banner in PDF...');
      
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      // First, clear existing banner area (remove Bulgarian banner)
      const bannerClearHeight = 150;
      firstPage.drawRectangle({
        x: 0,
        y: height - bannerClearHeight,
        width: width,
        height: bannerClearHeight,
        color: rgb(1, 1, 1) // White background to cover existing banner
      });
      
      // Determine image format and embed new banner
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
      
      // Place new banner with exact document width (1:1 ratio as requested)
      const bannerWidth = width;
      const bannerHeight = Math.min(120, height * 0.15);
      
      // Maintain aspect ratio but fit to document width
      const imageAspectRatio = bannerImage.width / bannerImage.height;
      let drawWidth = bannerWidth;
      let drawHeight = bannerWidth / imageAspectRatio;
      
      // If height is too large, scale down
      if (drawHeight > bannerHeight) {
        drawHeight = bannerHeight;
        drawWidth = drawHeight * imageAspectRatio;
      }
      
      const x = (width - drawWidth) / 2;
      const y = height - drawHeight - 20;
      
      firstPage.drawImage(bannerImage, {
        x, y, width: drawWidth, height: drawHeight,
      });
      
      console.log(`✅ Banner replaced: ${drawWidth}x${drawHeight} at (${x}, ${y})`);
      
    } catch (error) {
      console.error('❌ Error replacing banner:', error);
    }
  }
}