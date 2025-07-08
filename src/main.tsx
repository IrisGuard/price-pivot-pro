import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as pdfjsLib from 'pdfjs-dist';
import { validateEnvironment } from '@/lib/config/environment';
import { SystemStatus } from '@/components/system/SystemStatus';

// Validate environment configuration
const envValidation = validateEnvironment();
if (envValidation.warnings.length > 0) {
  console.warn('Environment Configuration Warnings:', envValidation.warnings);
}

// Configure PDF.js worker immediately - CRITICAL for production
if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
  // Always use local worker to avoid CORS issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
  console.log('PDF.js worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  console.log('Environment:', envValidation.config.APP_ENV);
}

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <SystemStatus />
  </>
);
