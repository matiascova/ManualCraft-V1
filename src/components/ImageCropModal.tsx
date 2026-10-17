import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  X,
  Check,
  RotateCcw,
  Scissors,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  FileText,
  Sliders,
  Eye,
  EyeOff,
  Target,
  Crosshair,
  ShieldCheck,
} from 'lucide-react';

import { blurTaskbarOnDataUrl } from '../utils/motionDetector';
import { VisualAnnotation, CropArea, transformAnnotationsForCrop } from '../types/manual';

export type { CropArea };

export interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  imageTitle?: string;
  annotations?: VisualAnnotation[];
  onApplyCrop: (
    croppedDataUrl: string,
    cropArea: CropArea,
    updatedAnnotations: VisualAnnotation[]
  ) => void;
  onClose: () => void;
  initialCropArea?: CropArea;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  imageTitle = 'Captura de Pantalla',
  annotations = [],
  onApplyCrop,
  onClose,
  initialCropArea,
}) => {
  // Working image dataUrl (allows applying taskbar blur or returning to original)
  const [workingImageSrc, setWorkingImageSrc] = useState<string>(imageSrc);
  const [isTaskbarBlurred, setIsTaskbarBlurred] = useState<boolean>(false);
  const [isProcessingBlur, setIsProcessingBlur] = useState<boolean>(false);

  // Guarantee: Maintain focal point fixed relative to the screen content
  const [preserveFocalPoint, setPreserveFocalPoint] = useState<boolean>(true);

  // Crop area in percentages (0 to 100)
  const [crop, setCrop] = useState<CropArea>(
    initialCropArea || { x: 0, y: 0, width: 100, height: 100 }
  );

  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({
    width: 1280,
    height: 720,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<
    'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | null
  >(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialCropAtDrag, setInitialCropAtDrag] = useState<CropArea | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Initialize or reset crop and image when opening or image changes
  useEffect(() => {
    if (isOpen) {
      setWorkingImageSrc(imageSrc);
      setIsTaskbarBlurred(false);
      setCrop(initialCropArea || { x: 0, y: 0, width: 100, height: 100 });
    }
  }, [isOpen, initialCropArea, imageSrc]);

  // Load natural dimensions of the image
  useEffect(() => {
    if (!workingImageSrc) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = workingImageSrc;
  }, [workingImageSrc]);

  // 1-Click: Dejar borrosa la barra de tareas inferior (para que no se vean los iconos de aplicaciones)
  const handleToggleTaskbarBlur = async () => {
    if (isTaskbarBlurred) {
      // Revert to original
      setWorkingImageSrc(imageSrc);
      setIsTaskbarBlurred(false);
    } else {
      setIsProcessingBlur(true);
      try {
        const blurred = await blurTaskbarOnDataUrl(imageSrc, 0.052);
        setWorkingImageSrc(blurred);
        setIsTaskbarBlurred(true);
      } catch (e) {
        console.error('Error applying taskbar blur:', e);
      } finally {
        setIsProcessingBlur(false);
      }
    }
  };

  // Quick Preset Handlers
  const handlePresetTaskbarCrop = () => {
    // Exclude bottom ~5.2% where Windows taskbar is located
    setCrop({ x: 0, y: 0, width: 100, height: 94.8 });
  };

  const handlePresetBrowserAppCrop = () => {
    // Exclude top ~5.5% (tabs / browser bar) and bottom ~5.2% (Windows taskbar)
    setCrop({ x: 0, y: 5.5, width: 100, height: 89.3 });
  };

  const handlePresetCenterFocus = () => {
    setCrop({ x: 10, y: 10, width: 80, height: 80 });
  };

  // Centrar automáticamente el encuadre de recorte alrededor del punto focal / anotación activa
  const handleCenterOnFocalPoint = () => {
    if (!annotations || annotations.length === 0) return;
    const primary = annotations[0];
    const w = primary.width ? Math.max(38, Math.min(88, primary.width * 1.8)) : 46;
    const h = primary.height ? Math.max(30, Math.min(85, primary.height * 2.2)) : 42;
    const x = Math.max(0, Math.min(100 - w, primary.x - w / 2));
    const y = Math.max(0, Math.min(100 - h, primary.y - h / 2));
    setCrop({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      width: Math.round(w * 10) / 10,
      height: Math.round(h * 10) / 10,
    });
  };

  const handlePresetLeftHalf = () => {
    setCrop({ x: 0, y: 0, width: 50, height: 94.8 });
  };

  const handlePresetRightHalf = () => {
    setCrop({ x: 50, y: 0, width: 50, height: 94.8 });
  };

  const handlePresetResetFull = () => {
    setWorkingImageSrc(imageSrc);
    setIsTaskbarBlurred(false);
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
  };

  // Convert mouse/touch event to normalized percentage (0-100) inside image bounds
  const getNormalizedPoint = useCallback((e: MouseEvent | TouchEvent) => {
    if (!imgRef.current) return null;
    const rect = imgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }, []);

  const handleStartDrag = (
    e: React.MouseEvent | React.TouchEvent,
    handle: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const pxX = ((clientX - rect.left) / rect.width) * 100;
    const pxY = ((clientY - rect.top) / rect.height) * 100;

    setIsDragging(true);
    setActiveHandle(handle);
    setDragStart({ x: pxX, y: pxY });
    setInitialCropAtDrag({ ...crop });
  };

  useEffect(() => {
    if (!isDragging || !activeHandle || !dragStart || !initialCropAtDrag) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const pt = getNormalizedPoint(e);
      if (!pt) return;

      const dx = pt.x - dragStart.x;
      const dy = pt.y - dragStart.y;

      let newX = initialCropAtDrag.x;
      let newY = initialCropAtDrag.y;
      let newW = initialCropAtDrag.width;
      let newH = initialCropAtDrag.height;

      const minW = 5; // min 5% width
      const minH = 5; // min 5% height

      if (activeHandle === 'move') {
        newX = Math.max(0, Math.min(100 - newW, initialCropAtDrag.x + dx));
        newY = Math.max(0, Math.min(100 - newH, initialCropAtDrag.y + dy));
      } else {
        if (activeHandle.includes('w')) {
          const maxLeft = initialCropAtDrag.x + initialCropAtDrag.width - minW;
          newX = Math.max(0, Math.min(maxLeft, initialCropAtDrag.x + dx));
          newW = initialCropAtDrag.width - (newX - initialCropAtDrag.x);
        }
        if (activeHandle.includes('e')) {
          newW = Math.max(minW, Math.min(100 - newX, initialCropAtDrag.width + dx));
        }
        if (activeHandle.includes('n')) {
          const maxTop = initialCropAtDrag.y + initialCropAtDrag.height - minH;
          newY = Math.max(0, Math.min(maxTop, initialCropAtDrag.y + dy));
          newH = initialCropAtDrag.height - (newY - initialCropAtDrag.y);
        }
        if (activeHandle.includes('s')) {
          newH = Math.max(minH, Math.min(100 - newY, initialCropAtDrag.height + dy));
        }
      }

      setCrop({
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
        width: Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10,
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setActiveHandle(null);
      setDragStart(null);
      setInitialCropAtDrag(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, activeHandle, dragStart, initialCropAtDrag, getNormalizedPoint]);

  // Execute high resolution crop and export dataUrl
  const handleConfirmCrop = () => {
    if (!workingImageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const srcW = img.naturalWidth || 1280;
      const srcH = img.naturalHeight || 720;

      const cropX = Math.round((crop.x / 100) * srcW);
      const cropY = Math.round((crop.y / 100) * srcH);
      const cropW = Math.max(10, Math.round((crop.width / 100) * srcW));
      const cropH = Math.max(10, Math.round((crop.height / 100) * srcH));

      // If full 100% and user simply wanted taskbar blur without clipping
      if (cropX === 0 && cropY === 0 && cropW === srcW && cropH === srcH) {
        const updatedAnnotations = preserveFocalPoint
          ? transformAnnotationsForCrop(annotations, crop)
          : annotations;
        onApplyCrop(workingImageSrc, crop, updatedAnnotations);
        onClose();
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw cropped slice
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      // Immediately free GPU texture memory
      canvas.width = 0;
      canvas.height = 0;

      // Automatically re-anchor annotations so focal point does NOT move
      const updatedAnnotations = preserveFocalPoint
        ? transformAnnotationsForCrop(annotations, crop)
        : annotations;

      onApplyCrop(croppedDataUrl, crop, updatedAnnotations);
      onClose();
    };
    img.src = workingImageSrc;
  };

  if (!isOpen) return null;

  // Real-time computed pixel dimensions
  const computedPixelWidth = Math.round((crop.width / 100) * naturalDimensions.width);
  const computedPixelHeight = Math.round((crop.height / 100) * naturalDimensions.height);
  const spaceSavedPct = Math.round(100 - crop.height);

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 leading-none">
                <span>Editar Tamaño y Recortar Captura</span>
                {spaceSavedPct > 0 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    ~{spaceSavedPct}% ahorro en altura para PDF
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Selecciona solo el área relevante de la pantalla para enfocar la atención y ahorrar espacio en el PDF.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Toolbar */}
        <div className="px-5 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-indigo-600" />
              <span>Ajustes Rápidos:</span>
            </span>

            {/* Quitar Barra de Tareas (Windows) */}
            {/* Centrar en Punto Focal */}
            {annotations && annotations.length > 0 && (
              <button
                type="button"
                onClick={handleCenterOnFocalPoint}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-950 bg-indigo-100 hover:bg-indigo-200 rounded-md border border-indigo-300 shadow-2xs transition-colors"
                title="Ajusta automáticamente el recorte para enmarcar el punto focal sin moverlo de la pantalla"
              >
                <Target className="w-3.5 h-3.5 text-indigo-700" />
                <span>Centrar en Punto Focal</span>
              </button>
            )}

            {/* Quitar Barra de Tareas (Windows) */}
            <button
              type="button"
              onClick={handlePresetTaskbarCrop}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-300 hover:bg-amber-200 rounded-md border border-amber-400 shadow-2xs transition-colors"
              title="Omite los iconos de la barra de tareas de Windows situada en la parte inferior (~5%)"
            >
              <Scissors className="w-3 h-3" />
              <span>Quitar Barra de Tareas</span>
            </button>

            {/* Dejar Borrosa la Barra de Tareas */}
            <button
              type="button"
              onClick={handleToggleTaskbarBlur}
              disabled={isProcessingBlur}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md border shadow-2xs transition-colors ${
                isTaskbarBlurred
                  ? 'bg-amber-400 text-amber-950 border-amber-500'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
              title="Aplica un efecto borroso sobre la barra de tareas inferior para ocultar los iconos de las aplicaciones abiertas"
            >
              <EyeOff className="w-3 h-3 text-amber-600" />
              <span>
                {isProcessingBlur
                  ? 'Difuminando...'
                  : isTaskbarBlurred
                  ? 'Barra Borrosa (Activo)'
                  : 'Dejar Borrosa Barra'}
              </span>
            </button>

            {/* Quitar Cabecera y Barra de Tareas */}
            <button
              type="button"
              onClick={handlePresetBrowserAppCrop}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-300 shadow-2xs transition-colors"
              title="Elimina pestañas superiores y barra de tareas inferior"
            >
              <span>Ventana de Aplicación</span>
            </button>

            {/* Centro */}
            <button
              type="button"
              onClick={handlePresetCenterFocus}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-300 shadow-2xs transition-colors"
            >
              <span>Enfoque Central (80%)</span>
            </button>

            {/* Mitades */}
            <button
              type="button"
              onClick={handlePresetLeftHalf}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-md border border-slate-300 transition-colors"
            >
              <span>Mitad Izq.</span>
            </button>
            <button
              type="button"
              onClick={handlePresetRightHalf}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-md border border-slate-300 transition-colors"
            >
              <span>Mitad Der.</span>
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={handlePresetResetFull}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              title="Restablecer captura original completa"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Focal Point Anchor Indicator */}
            <button
              type="button"
              onClick={() => setPreserveFocalPoint(!preserveFocalPoint)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                preserveFocalPoint
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
              }`}
              title="Garantiza que el punto focal mantenga exactamente su posición física en la pantalla tras recortar"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${preserveFocalPoint ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>{preserveFocalPoint ? 'Anclaje Fijo: Activo' : 'Anclaje Fijo: Inactivo'}</span>
            </button>

            <span className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs text-[11px] font-mono text-slate-600">
              {computedPixelWidth} × {computedPixelHeight} px
            </span>
          </div>
        </div>

        {/* Cropper Canvas Workspace */}
        <div
          ref={containerRef}
          className="flex-1 bg-slate-900 overflow-auto p-4 flex items-center justify-center min-h-[360px] max-h-[64vh] select-none"
        >
          <div className="relative inline-block max-w-full max-h-full shadow-2xl rounded overflow-hidden">
            <img
              ref={imgRef}
              src={workingImageSrc}
              alt={imageTitle}
              className="max-h-[58vh] max-w-full block pointer-events-none object-contain"
            />

            {/* Visual Annotations / Focal Points on Original Screen */}
            {annotations.map((ann) => {
              if (ann.shape === 'rect') {
                const w = ann.width || 22;
                const h = ann.height || 14;
                return (
                  <div
                    key={ann.id}
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      width: `${w}%`,
                      height: `${h}%`,
                      transform: 'translate(-50%, -50%)',
                      borderColor: ann.color || '#ef4444',
                    }}
                    className="absolute border-2 bg-red-500/15 rounded pointer-events-none z-10 shadow-sm"
                  >
                    {ann.label && (
                      <span
                        style={{ backgroundColor: ann.color || '#ef4444' }}
                        className="absolute -top-6 left-0 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap"
                      >
                        {ann.label}
                      </span>
                    )}
                  </div>
                );
              }
              if (ann.shape === 'blur') {
                const w = ann.width || 20;
                const h = ann.height || 12;
                return (
                  <div
                    key={ann.id}
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      width: `${w}%`,
                      height: `${h}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="absolute backdrop-blur-md bg-slate-800/70 border border-slate-400 rounded pointer-events-none z-10"
                  />
                );
              }
              return (
                <div
                  key={ann.id}
                  style={{
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    transform: 'translate(-50%, -50%)',
                    borderColor: ann.color || '#ef4444',
                  }}
                  className="absolute w-7 h-7 rounded-full border-2 bg-red-500/30 flex items-center justify-center pointer-events-none z-10 shadow-sm"
                >
                  <div
                    style={{ backgroundColor: ann.color || '#ef4444' }}
                    className="w-2.5 h-2.5 rounded-full"
                  />
                  {ann.label && (
                    <span
                      style={{ backgroundColor: ann.color || '#ef4444' }}
                      className="absolute -top-6 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap"
                    >
                      {ann.label}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Dark Masks Outside Crop Rectangle */}
            {/* Top Mask */}
            <div
              className="absolute left-0 right-0 top-0 bg-black/65 backdrop-blur-[1px] pointer-events-none transition-all"
              style={{ height: `${crop.y}%` }}
            />
            {/* Bottom Mask */}
            <div
              className="absolute left-0 right-0 bottom-0 bg-black/65 backdrop-blur-[1px] pointer-events-none transition-all"
              style={{ height: `${100 - (crop.y + crop.height)}%` }}
            />
            {/* Left Mask */}
            <div
              className="absolute left-0 bg-black/65 backdrop-blur-[1px] pointer-events-none transition-all"
              style={{
                top: `${crop.y}%`,
                height: `${crop.height}%`,
                width: `${crop.x}%`,
              }}
            />
            {/* Right Mask */}
            <div
              className="absolute right-0 bg-black/65 backdrop-blur-[1px] pointer-events-none transition-all"
              style={{
                top: `${crop.y}%`,
                height: `${crop.height}%`,
                width: `${100 - (crop.x + crop.width)}%`,
              }}
            />

            {/* Crop Selection Box */}
            <div
              className="absolute border-2 border-indigo-400 shadow-lg cursor-move transition-all"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
              }}
              onMouseDown={(e) => handleStartDrag(e, 'move')}
              onTouchStart={(e) => handleStartDrag(e, 'move')}
            >
              {/* Corner Handles */}
              <div
                className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize shadow"
                onMouseDown={(e) => handleStartDrag(e, 'nw')}
                onTouchStart={(e) => handleStartDrag(e, 'nw')}
              />
              <div
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize shadow"
                onMouseDown={(e) => handleStartDrag(e, 'ne')}
                onTouchStart={(e) => handleStartDrag(e, 'ne')}
              />
              <div
                className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize shadow"
                onMouseDown={(e) => handleStartDrag(e, 'sw')}
                onTouchStart={(e) => handleStartDrag(e, 'sw')}
              />
              <div
                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize shadow"
                onMouseDown={(e) => handleStartDrag(e, 'se')}
                onTouchStart={(e) => handleStartDrag(e, 'se')}
              />

              {/* Edge Handles */}
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-ns-resize shadow"
                onMouseDown={(e) => handleStartDrag(e, 'n')}
                onTouchStart={(e) => handleStartDrag(e, 'n')}
              />
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-ns-resize shadow"
                onMouseDown={(e) => handleStartDrag(e, 's')}
                onTouchStart={(e) => handleStartDrag(e, 's')}
              />
              <div
                className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 bg-white border-2 border-indigo-600 rounded-xs cursor-ew-resize shadow"
                onMouseDown={(e) => handleStartDrag(e, 'w')}
                onTouchStart={(e) => handleStartDrag(e, 'w')}
              />
              <div
                className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 bg-white border-2 border-indigo-600 rounded-xs cursor-ew-resize shadow"
                onMouseDown={(e) => handleStartDrag(e, 'e')}
                onTouchStart={(e) => handleStartDrag(e, 'e')}
              />

              {/* Guide Lines (Rule of Thirds) */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
                <div className="border-r border-b border-indigo-300" />
                <div className="border-r border-b border-indigo-300" />
                <div className="border-b border-indigo-300" />
                <div className="border-r border-b border-indigo-300" />
                <div className="border-r border-b border-indigo-300" />
                <div className="border-b border-indigo-300" />
              </div>

              {/* Tag with Dimensions */}
              <div className="absolute top-2 left-2 bg-indigo-900/90 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none">
                {computedPixelWidth} × {computedPixelHeight} px
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            Arrastra el recuadro o sus esquinas para encuadrar la zona deseada.
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmCrop}
              className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Aplicar Recorte a la Captura</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
