import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker immediately - CRITICAL for production
if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
  // Always use local worker to avoid CORS issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
  console.log('PDF.js worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
}

createRoot(document.getElementById("root")!).render(<App />);
