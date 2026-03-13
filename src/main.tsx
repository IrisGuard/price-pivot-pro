import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as pdfjsLib from 'pdfjs-dist';
import { validateEnvironment } from '@/lib/config/environment';
import { SystemStatus } from '@/components/system/SystemStatus';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';

// Validate environment configuration
const envValidation = validateEnvironment();
if (envValidation.warnings.length > 0) {
  console.warn('Environment Configuration Warnings:', envValidation.warnings);
}

// Configure PDF.js worker with CDN (ES module compatible)
if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
  const pdfjsVersion = pdfjsLib.version;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
  console.log('🔧 PDF.js worker configured, version:', pdfjsVersion);
}

// Enhanced error handling for production
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', event.error);
  
  // Don't show error boundary for network errors in production
  if (envValidation.config.APP_ENV === 'production' && event.error?.message?.includes('Network')) {
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
  
  // Handle PDF.js worker errors gracefully
  if (event.reason?.message?.includes('worker')) {
    console.warn('📄 PDF worker error handled gracefully');
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <SystemStatus />
      <Toaster />
    </ErrorBoundary>
  </StrictMode>
);
