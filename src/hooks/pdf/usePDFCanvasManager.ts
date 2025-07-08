import { useRef, useCallback } from 'react';

export const usePDFCanvasManager = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasesRef = useRef<HTMLCanvasElement[]>([]);

  const cleanup = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      // Clear canvases properly
      canvasesRef.current.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      });
      container.innerHTML = '';
      canvasesRef.current = [];
    }
  }, []);

  const addCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const container = containerRef.current;
    if (container) {
      container.appendChild(canvas);
      canvasesRef.current.push(canvas);
    }
  }, []);

  const clearPreviousCanvases = useCallback(() => {
    if (canvasesRef.current.length > 0) {
      canvasesRef.current.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        canvas.remove();
      });
      canvasesRef.current = [];
    }
  }, []);

  return {
    containerRef,
    canvasesRef,
    cleanup,
    addCanvas,
    clearPreviousCanvases
  };
};