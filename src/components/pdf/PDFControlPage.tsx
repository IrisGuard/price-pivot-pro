interface PDFControlPageProps {
  pageWidth?: number;
}

export const PDFControlPage = ({ pageWidth = 595 }: PDFControlPageProps) => {
  const handlePercentageApply = () => {
    const input = document.querySelector('#percentageInput') as HTMLInputElement;
    const percentage = parseFloat(input.value);
    if (!isNaN(percentage)) {
      console.log('Applying percentage:', percentage);
      // TODO: Implement price update logic
      alert(`Εφαρμογή ποσοστού: ${percentage}%`);
    }
  };

  const handleBannerChange = () => {
    const input = document.querySelector('#bannerInput') as HTMLInputElement;
    input?.click();
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Banner file selected:', file.name);
      // TODO: Implement banner replacement
      alert(`Νέο banner: ${file.name}`);
    }
  };

  const handleRemoveBanner = () => {
    console.log('Removing banner');
    // TODO: Implement banner removal
    alert('Αφαίρεση banner');
  };

  return (
    <div 
      className="bg-white border shadow-sm mx-auto block mb-4 p-8"
      style={{ width: pageWidth + 'px', minHeight: '842px' }}
    >
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-8">🔧 ΠΑΝΕΛ ΕΛΕΓΧΟΥ ΠΡΟΣΦΟΡΑΣ</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded border">
            <h3 className="font-bold text-lg mb-3">1. ΑΛΛΑΓΗ ΠΟΣΟΣΤΟΥ ΤΙΜΩΝ</h3>
            <div className="flex items-center justify-center gap-3">
              <input 
                type="number" 
                placeholder="+10 ή -15" 
                className="border px-3 py-2 w-24 text-center" 
                id="percentageInput"
              />
              <button 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={handlePercentageApply}
              >
                ΕΦΑΡΜΟΓΗ
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded border">
            <h3 className="font-bold text-lg mb-3">2. ΑΛΛΑΓΗ BANNER/ΛΟΓΟΤΥΠΟΥ</h3>
            <div className="flex items-center justify-center gap-3">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                id="bannerInput"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBannerFileChange(e)}
              />
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleBannerChange}
              >
                ΑΛΛΑΓΗ BANNER
              </button>
              <button 
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={handleRemoveBanner}
              >
                ΑΦΑΙΡΕΣΗ BANNER
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded border">
            <h3 className="font-bold text-lg mb-3">3. ΣΥΜΠΛΗΡΩΣΗ ΣΤΟΙΧΕΙΩΝ ΠΕΛΑΤΗ</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Ονοματεπώνυμο" className="border px-3 py-2" id="customerName" />
              <input type="text" placeholder="Επάγγελμα" className="border px-3 py-2" id="customerJob" />
              <input type="text" placeholder="ΑΦΜ" className="border px-3 py-2" id="customerTax" />
              <input type="text" placeholder="Τηλέφωνο" className="border px-3 py-2" id="customerPhone" />
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded border border-yellow-300 text-left">
          <h4 className="font-bold text-yellow-800 mb-2">ΟΔΗΓΙΕΣ ΧΡΗΣΗΣ:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Για αλλαγή τιμών: Εισάγετε ποσοστό (π.χ. +10, -15) και πατήστε "ΕΦΑΡΜΟΓΗ"</li>
            <li>• Για αλλαγή banner: Πατήστε "ΑΛΛΑΓΗ BANNER" και επιλέξτε εικόνα</li>
            <li>• Συμπληρώστε τα στοιχεία σας στα αντίστοιχα πεδία</li>
            <li>• Μετά τις αλλαγές, χρησιμοποιήστε Ctrl+P για εκτύπωση</li>
          </ul>
        </div>
      </div>
    </div>
  );
};