interface PDFBrowserFallbackProps {
  pdfUrl: string;
}

export const PDFBrowserFallback = ({ pdfUrl }: PDFBrowserFallbackProps) => {
  return (
    <div className="flex justify-center">
      <iframe
        src={pdfUrl}
        className="border shadow-lg"
        style={{ 
          width: '595px',  // A4 width
          height: '842px', // A4 height
          maxWidth: '100%'
        }}
        title="PDF Preview"
      />
    </div>
  );
};