import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface SignaturePadRef {
  clear: () => void;
  getSignature: () => string | null;
}

const SignaturePad = forwardRef<SignaturePadRef>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getCanvasContext = () => {
    return canvasRef.current?.getContext('2d') || null;
  };

  const getCoords = (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    if (e instanceof MouseEvent) {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return null;
  };

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const coords = getCoords(e);
    if (coords) {
      isDrawing.current = true;
      lastPos.current = coords;
    }
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const ctx = getCanvasContext();
    const coords = getCoords(e);
    if (ctx && coords && lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      lastPos.current = coords;
    }
  };

  const stopDrawing = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    isDrawing.current = false;
    lastPos.current = null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Desktop events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Mobile events
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = getCanvasContext();
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    getSignature: () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        if(!context) return null;
        const pixelBuffer = new Uint32Array(
          context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        );
        const isEmpty = !pixelBuffer.some(color => color !== 0);
        
        if (isEmpty) {
          return null;
        }
        return canvas.toDataURL('image/png');
      }
      return null;
    }
  }));

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-48 bg-slate-700 border border-slate-600 rounded-md cursor-crosshair"
    />
  );
});

export default SignaturePad;
