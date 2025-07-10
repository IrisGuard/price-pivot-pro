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

// Configure PDF.js worker immediately - CRITICAL for production
if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
  // Always use local worker to avoid CORS issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
  console.log('🔧 PDF.js worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  console.log('🌍 Environment:', envValidation.config.APP_ENV);
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
