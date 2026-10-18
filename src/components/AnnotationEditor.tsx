import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VisualAnnotation } from '../types/manual';
import {
  Trash2,
  Move,
  X,
  Check,
  Plus,
  Type,
  Sparkles,
  RotateCcw,
  CornerLeftUp,
  Square,
  Circle,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Crosshair,
  Sliders,
} from 'lucide-react';
import { DictationButton } from './DictationButton';

interface AnnotationEditorProps {
  imageSrc: string;
  annotations: VisualAnnotation[];
  onChange: (annotations: VisualAnnotation[]) => void;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Verde', hex: '#10b981' },
  { name: 'Ámbar', hex: '#f59e0b' },
  { name: 'Púrpura', hex: '#8b5cf6' },
  { name: 'Cian', hex: '#06b6d4' },
];

export const AnnotationEditor: React.FC<AnnotationEditorProps> = ({
  imageSrc,
  annotations,
  onChange,
  onClose,
}) => {
  const [localAnnotations, setLocalAnnotations] = useState<VisualAnnotation[]>(annotations);
  const localAnnotationsRef = useRef<VisualAnnotation[]>(annotations);
  localAnnotationsRef.current = localAnnotations;
  const rafRef = useRef<number | null>(null);
  const hasDraggedRef = useRef<boolean>(false);

  // Always select first or active annotation
  const [selectedId, setSelectedId] = useState<string | null>(
    annotations[0]?.id || null
  );

  // Tool mode: 'circle' (drop focal hotspot), 'rect', 'blur', or 'select'
  const [toolMode, setToolMode] = useState<'circle' | 'rect' | 'blur' | 'select'>('circle');
  // 'move' repositions current focal point on click; 'add' creates a new annotation on next click
  const [clickPlacementMode, setClickPlacementMode] = useState<'move' | 'add'>('move');
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number } | null>(null);

  // New item defaults
  const [activeShape, setActiveShape] = useState<'circle' | 'rect' | 'blur'>('circle');
  const [activeColor, setActiveColor] = useState<string>('#ef4444');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Dragging states
  const [isDraggingAnnotation, setIsDraggingAnnotation] = useState(false);
  const [isDraggingLabel, setIsDraggingLabel] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialAnnState, setInitialAnnState] = useState<VisualAnnotation | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Sync from props when not dragging
  useEffect(() => {
    if (!isDraggingAnnotation && !isDraggingLabel && !isResizing) {
      setLocalAnnotations(annotations);
    }
  }, [annotations, isDraggingAnnotation, isDraggingLabel, isResizing]);

  // Always resolve an active annotation if annotations exist
  const activeAnnotation: VisualAnnotation | null =
    localAnnotations.find((a) => a.id === selectedId) ||
    (localAnnotations.length > 0 ? localAnnotations[localAnnotations.length - 1] : null);

  // Keep selectedId synchronized
  useEffect(() => {
    if (localAnnotations.length > 0) {
      if (!selectedId || !localAnnotations.some((a) => a.id === selectedId)) {
        setSelectedId(localAnnotations[localAnnotations.length - 1].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [localAnnotations, selectedId]);

  // Update active annotation
  const updateActive = useCallback(
    (partial: Partial<VisualAnnotation>, commitImmediate = true) => {
      const targetId = activeAnnotation?.id || selectedId;
      if (!targetId) return;
      const updated = localAnnotationsRef.current.map((a) =>
        a.id === targetId ? { ...a, ...partial } : a
      );
      setLocalAnnotations(updated);
      if (commitImmediate) {
        onChange(updated);
      }
    },
    [activeAnnotation, selectedId, onChange]
  );

  // Precision Click-to-Place or Click-to-Move on Image Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasDraggedRef.current || isDraggingAnnotation || isDraggingLabel || isResizing) {
      return;
    }
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (clickX < 0 || clickX > rect.width || clickY < 0 || clickY > rect.height) {
      return;
    }

    // Exact sub-pixel normalized percentage coordinates (0.1% precision)
    const x = Math.round(((clickX / rect.width) * 100) * 10) / 10;
    const y = Math.round(((clickY / rect.height) * 100) * 10) / 10;

    // Show instant visual confirmation ripple
    setClickRipple({ x, y });
    setTimeout(() => setClickRipple(null), 650);

    // If in ADD mode, or if there are no annotations yet, or if toolMode is rect or blur:
    if (
      clickPlacementMode === 'add' ||
      localAnnotations.length === 0 ||
      toolMode === 'rect' ||
      toolMode === 'blur'
    ) {
      const shapeToCreate = toolMode === 'select' ? 'circle' : toolMode;
      const labelText = shapeToCreate === 'blur' ? '' : `Paso ${localAnnotations.length + 1}`;

      const newAnnotation: VisualAnnotation = {
        id: `ann-${Date.now()}`,
        x,
        y,
        shape: shapeToCreate,
        color: activeColor,
        label: labelText,
        labelPosition: y < 18 ? 'bottom' : 'top',
        width: shapeToCreate === 'circle' ? undefined : (shapeToCreate === 'blur' ? 22 : 22),
        height: shapeToCreate === 'circle' ? undefined : (shapeToCreate === 'blur' ? 12 : 14),
        labelOffsetX: 0,
        labelOffsetY: 0,
      };

      const updated = [...localAnnotations, newAnnotation];
      setLocalAnnotations(updated);
      onChange(updated);
      setSelectedId(newAnnotation.id);
      setClickPlacementMode('move');
      return;
    }

    // Default MOVE mode: Reposition the active focal point directly to the exact clicked coordinates!
    updateActive({ x, y }, true);
  };

  // Explicit function to activate adding a new annotation via click or instant drop
  const handleAddNewAnnotation = (shapeOverride?: 'circle' | 'rect' | 'blur') => {
    const shape = shapeOverride || activeShape;
    setToolMode(shape);
    setActiveShape(shape);
    setClickPlacementMode('add');
  };

  // Duplicate current annotation
  const handleDuplicateCurrent = () => {
    if (!activeAnnotation) return;
    const duplicated: VisualAnnotation = {
      ...activeAnnotation,
      id: `ann-${Date.now()}`,
      x: Math.min(90, activeAnnotation.x + 5),
      y: Math.min(90, activeAnnotation.y + 5),
      label: activeAnnotation.label ? `${activeAnnotation.label} (Copia)` : '',
    };
    const updated = [...localAnnotations, duplicated];
    setLocalAnnotations(updated);
    onChange(updated);
    setSelectedId(duplicated.id);
  };

  // Center current annotation
  const handleCenterCurrent = () => {
    if (!activeAnnotation) return;
    updateActive({ x: 50, y: 50 });
  };

  // Preset to place rectangle directly in the Top-Left Corner (SAP Command Bar)
  const handlePositionTopLeft = () => {
    if (!activeAnnotation) return;
    const width = activeAnnotation.width || 22;
    const height = activeAnnotation.height || 14;
    const targetX = Math.round(width / 2 + 2);
    const targetY = Math.round(height / 2 + 2);
    updateActive({
      x: targetX,
      y: targetY,
      labelPosition: 'inside',
      labelOffsetX: 0,
      labelOffsetY: 0,
    });
  };

  // Start dragging annotation body
  const handleStartDragAnnotation = (e: React.MouseEvent, ann: VisualAnnotation) => {
    e.stopPropagation();
    setSelectedId(ann.id);
    setIsDraggingAnnotation(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialAnnState({ ...ann });
  };

  // Start dragging label badge seamlessly with ZERO jump
  const handleStartDragLabel = (e: React.MouseEvent, ann: VisualAnnotation) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(ann.id);
    setIsDraggingLabel(true);
    setDragStart({ x: e.clientX, y: e.clientY });

    const badgeEl = e.currentTarget as HTMLElement;
    const parentEl = badgeEl.parentElement as HTMLElement;
    const badgeRect = badgeEl.getBoundingClientRect();
    const parentRect = parentEl.getBoundingClientRect();
    const curX = Math.round(badgeRect.left - parentRect.left);
    const curY = Math.round(badgeRect.top - parentRect.top);

    setInitialAnnState({
      ...ann,
      labelOffsetX: ann.labelPosition === 'custom' ? (ann.labelOffsetX ?? curX) : curX,
      labelOffsetY: ann.labelPosition === 'custom' ? (ann.labelOffsetY ?? curY) : curY,
    });
  };

  // Start resizing annotation
  const handleStartResize = (e: React.MouseEvent, ann: VisualAnnotation) => {
    e.stopPropagation();
    setSelectedId(ann.id);
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialAnnState({ ...ann });
  };

  // Window mouse move & up handlers for smooth 60 FPS dragging without root re-renders
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!imgRef.current || !dragStart || !initialAnnState) return;
      hasDraggedRef.current = true;
      const rect = imgRef.current.getBoundingClientRect();

      const deltaXPercent = ((e.clientX - dragStart.x) / (rect.width || 1)) * 100;
      const deltaYPercent = ((e.clientY - dragStart.y) / (rect.height || 1)) * 100;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (isDraggingAnnotation) {
          const newX = Math.max(0, Math.min(100, Math.round((initialAnnState.x + deltaXPercent) * 10) / 10));
          const newY = Math.max(0, Math.min(100, Math.round((initialAnnState.y + deltaYPercent) * 10) / 10));
          updateActive({ x: newX, y: newY }, false); // Do not bubble up to App during active drag!
        } else if (isDraggingLabel) {
          const deltaXPixels = Math.round(e.clientX - dragStart.x);
          const deltaYPixels = Math.round(e.clientY - dragStart.y);
          updateActive(
            {
              labelPosition: 'custom',
              labelOffsetX: (initialAnnState.labelOffsetX || 0) + deltaXPixels,
              labelOffsetY: (initialAnnState.labelOffsetY || 0) + deltaYPixels,
            },
            false
          );
        } else if (isResizing) {
          const newWidth = Math.max(4, Math.min(96, Math.round(((initialAnnState.width || 20) + deltaXPercent) * 10) / 10));
          const newHeight = Math.max(3, Math.min(96, Math.round(((initialAnnState.height || 12) + deltaYPercent) * 10) / 10));
          updateActive({ width: newWidth, height: newHeight }, false);
        }
      });
    };

    const handleMouseUp = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const wasActive = isDraggingAnnotation || isDraggingLabel || isResizing;
      setIsDraggingAnnotation(false);
      setIsDraggingLabel(false);
      setIsResizing(false);
      setDragStart(null);
      setInitialAnnState(null);

      // Single consolidated commit to parent application state once gesture completes!
      if (wasActive) {
        onChange(localAnnotationsRef.current);
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 80);
      }
    };

    if (isDraggingAnnotation || isDraggingLabel || isResizing) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDraggingAnnotation,
    isDraggingLabel,
    isResizing,
    dragStart,
    initialAnnState,
    updateActive,
    onChange,
  ]);

  const removeSelected = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = localAnnotationsRef.current.filter((a) => a.id !== id);
    setLocalAnnotations(updated);
    onChange(updated);
    if (selectedId === id) {
      setSelectedId(updated[0]?.id || null);
    }
  };

  // Keyboard shortcut to delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          removeSelected(selectedId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, localAnnotations]);

  // Compute label style based on position & offset
  const getLabelStyle = (ann: VisualAnnotation): React.CSSProperties => {
    if (ann.labelPosition === 'custom') {
      return {
        top: '0px',
        left: '0px',
        transform: `translate(${ann.labelOffsetX || 0}px, ${ann.labelOffsetY || 0}px)`,
        cursor: 'grab',
      };
    }

    const isNearTop = (ann.y || 0) < 18;
    const isNearBottom = (ann.y || 0) > 82;
    const pos = ann.labelPosition || (isNearTop ? 'bottom' : (isNearBottom ? 'top' : 'top'));

    if (ann.shape === 'circle') {
      switch (pos) {
        case 'bottom':
          return { top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', cursor: 'grab' };
        case 'right':
          return { top: '50%', left: 'calc(100% + 6px)', transform: 'translateY(-50%)', cursor: 'grab' };
        case 'left':
          return { top: '50%', right: 'calc(100% + 6px)', transform: 'translateY(-50%)', cursor: 'grab' };
        case 'inside':
          return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', cursor: 'grab' };
        case 'top':
        default:
          return { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', cursor: 'grab' };
      }
    }

    switch (pos) {
      case 'bottom':
        return { bottom: '-24px', left: '0', cursor: 'grab' };
      case 'inside':
        return { top: '4px', left: '4px', cursor: 'grab' };
      case 'right':
        return { top: '0', right: '-110px', cursor: 'grab' };
      case 'left':
        return { top: '0', left: '-110px', cursor: 'grab' };
      case 'top':
      default:
        return { top: '-24px', left: '0', cursor: 'grab' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col h-screen w-screen overflow-hidden select-none">
      {/* 1. Unified Studio Top Ribbon Bar: Zero waste of vertical space */}
      <header className="h-12 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 z-20">
        {/* Left: Studio Branding & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Crosshair className="w-4 h-4" />
          </div>
          <div className="hidden sm:block min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate leading-none">
              Editor de Enfoque y Puntos Focales
            </h2>
            <span className="text-[10px] text-slate-400 font-medium leading-none">
              Todas las herramientas visibles sin scroll
            </span>
          </div>
        </div>

        {/* Center: Quick Creation Palette */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 hidden md:inline">
            Puntos Focales:
          </span>

          {/* 1. Precision Relocate Mode (Default) */}
          <button
            type="button"
            onClick={() => {
              setToolMode('circle');
              setClickPlacementMode('move');
            }}
            className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
              clickPlacementMode === 'move' && activeAnnotation?.shape === 'circle'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200'
            }`}
            title="Haz clic en cualquier punto de la captura para ubicar el punto focal exactamente allí"
          >
            <Crosshair className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px]">Ubicar con Clic</span>
          </button>

          {/* 2. Add New Focal Hotspot */}
          <button
            type="button"
            onClick={() => handleAddNewAnnotation('circle')}
            className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
              clickPlacementMode === 'add' && toolMode === 'circle'
                ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-400 animate-pulse'
                : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200'
            }`}
            title="Añadir nuevo punto focal: activa este botón y haz clic en la captura"
          >
            <Circle className="w-3.5 h-3.5 text-red-300" />
            <span className="text-[11px]">+ Punto Focal</span>
          </button>

          {/* 3. Add Rectangle */}
          <button
            type="button"
            onClick={() => handleAddNewAnnotation('rect')}
            className={`py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
              clickPlacementMode === 'add' && toolMode === 'rect'
                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400'
                : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200'
            }`}
            title="Añadir Recuadro de Enfoque: haz clic en la captura para colocarlo"
          >
            <Square className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-[11px]">+ Recuadro</span>
          </button>

          {/* 4. Add Blur Box */}
          <button
            type="button"
            onClick={() => handleAddNewAnnotation('blur')}
            className={`py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
              clickPlacementMode === 'add' && toolMode === 'blur'
                ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400'
                : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200'
            }`}
            title="Añadir Difuminado para ocultar datos privados o sensibles"
          >
            <EyeOff className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[11px]">+ Difuminar</span>
          </button>

          {activeAnnotation?.shape === 'rect' && (
            <button
              type="button"
              onClick={handlePositionTopLeft}
              className="py-1 px-2 rounded-lg text-[11px] font-semibold bg-slate-700/40 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition-all hidden lg:flex items-center gap-1"
              title="Ajustar automáticamente a la barra de transacciones superior izquierda (SAP / ERP)"
            >
              <CornerLeftUp className="w-3 h-3 text-indigo-400" />
              <span>Esquina Sup. Izq.</span>
            </button>
          )}
        </div>

        {/* Right: Elements selector & Save Action */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Elements Quick Carousel */}
          {localAnnotations.length > 0 && (
            <div className="hidden xl:flex items-center gap-1 max-w-[240px] overflow-x-auto py-0.5">
              {localAnnotations.map((ann, idx) => {
                const isSelected = activeAnnotation?.id === ann.id;
                return (
                  <button
                    key={ann.id}
                    type="button"
                    onClick={() => setSelectedId(ann.id)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-all flex items-center gap-1 shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: ann.color || '#ef4444' }}
                    />
                    <span className="truncate max-w-[70px]">
                      {ann.label || `#${idx + 1}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="py-1 px-2.5 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
            title="Guardar y cerrar editor"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Guardar y Aplicar</span>
          </button>
        </div>
      </header>

      {/* 2. Main Studio Workspace: Guaranteed zero vertical scroll */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-slate-950">
        {/* Left / Center Canvas Area */}
        <div
          ref={canvasContainerRef}
          className="flex-1 flex flex-col items-center justify-center p-3 relative overflow-hidden min-h-0 min-w-0"
        >
          {/* Floating Guidance Banner */}
          <div className="absolute top-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full px-3.5 py-1 flex items-center gap-2 text-white shadow-xl z-20 pointer-events-none">
            <span className={`w-2 h-2 rounded-full ${clickPlacementMode === 'add' ? 'bg-amber-400 animate-ping' : 'bg-red-500 animate-pulse'}`} />
            <span className="font-semibold text-[11px] text-slate-200">
              {clickPlacementMode === 'add'
                ? '🎯 Modo Añadir Activo: Haz clic en la captura para colocar el nuevo elemento'
                : '🎯 Haz clic en cualquier parte de la imagen para posicionar el punto focal allí'}
            </span>
          </div>

          {/* Zoomable Image Container */}
          <div
            onClick={handleCanvasClick}
            className="relative inline-block cursor-crosshair shadow-2xl rounded-lg overflow-visible border border-slate-800 max-h-full max-w-full transition-transform duration-150 select-none"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Captura a anotar"
              className="max-h-[calc(100vh-80px)] max-w-full w-auto h-auto block pointer-events-none rounded select-none shadow-2xl"
              draggable={false}
            />

            {/* Instant Click Ripple Feedback */}
            {clickRipple && (
              <div
                style={{
                  left: `${clickRipple.x}%`,
                  top: `${clickRipple.y}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full border-2 border-red-500 animate-ping opacity-90" />
                <div className="w-4 h-4 rounded-full bg-red-600 shadow-xl border-2 border-white absolute" />
              </div>
            )}

            {/* Render Annotations Overlay */}
            {localAnnotations.map((ann) => {
              const isSelected = ann.id === selectedId || activeAnnotation?.id === ann.id;

              // 1. RECTANGLE
              if (ann.shape === 'rect') {
                const width = ann.width || 22;
                const height = ann.height || 14;
                return (
                  <div
                    key={ann.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(ann.id);
                    }}
                    onMouseDown={(e) => handleStartDragAnnotation(e, ann)}
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                      borderColor: ann.color || '#ef4444',
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute border-2 bg-red-500/15 rounded cursor-grab active:cursor-grabbing transition-shadow ${
                      isSelected
                        ? 'ring-2 ring-white shadow-2xl border-solid'
                        : 'hover:border-dashed hover:ring-1 hover:ring-white/60'
                    }`}
                  >
                    {/* Move Icon indicator */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-black/70 text-white rounded p-0.5 pointer-events-none">
                        <Move className="w-2.5 h-2.5" />
                      </div>
                    )}

                    {/* Draggable Label Badge */}
                    {ann.label && (
                      <div
                        onMouseDown={(e) => handleStartDragLabel(e, ann)}
                        style={{
                          backgroundColor: ann.color || '#ef4444',
                          ...getLabelStyle(ann),
                        }}
                        className="absolute text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 select-none flex items-center gap-1.5 hover:ring-2 hover:ring-white transition-transform active:cursor-grabbing cursor-grab"
                        title="Arrastra para mover la etiqueta libremente"
                      >
                        <Move className="w-2.5 h-2.5 opacity-80" />
                        <span>{ann.label}</span>
                      </div>
                    )}

                    {/* Resize Handle (Bottom-Right) */}
                    {isSelected && (
                      <div
                        onMouseDown={(e) => handleStartResize(e, ann)}
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full cursor-nwse-resize z-20 shadow-md hover:scale-125 transition-transform"
                        title="Arrastra para redimensionar"
                      />
                    )}
                  </div>
                );
              }

              // 2. BLUR BOX
              if (ann.shape === 'blur') {
                const width = ann.width || 22;
                const height = ann.height || 12;
                return (
                  <div
                    key={ann.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(ann.id);
                    }}
                    onMouseDown={(e) => handleStartDragAnnotation(e, ann)}
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute backdrop-blur-md bg-slate-900/60 border ${
                      isSelected ? 'border-amber-400 ring-2 ring-amber-400' : 'border-slate-400'
                    } cursor-grab active:cursor-grabbing rounded flex items-center justify-center`}
                  >
                    <span className="text-[10px] text-white/90 font-mono px-1 pointer-events-none">
                      Privado
                    </span>

                    {/* Resize Handle for blur */}
                    {isSelected && (
                      <div
                        onMouseDown={(e) => handleStartResize(e, ann)}
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border border-slate-900 rounded-full cursor-nwse-resize z-20 shadow-md"
                      />
                    )}
                  </div>
                );
              }

              // 3. CIRCLE HOTSPOT
              return (
                <div
                  key={ann.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(ann.id);
                  }}
                  onMouseDown={(e) => handleStartDragAnnotation(e, ann)}
                  style={{
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    borderColor: ann.color || '#ef4444',
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-3 flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform ${
                    isSelected
                      ? 'ring-4 ring-white scale-125 z-20 shadow-2xl'
                      : 'hover:scale-110 z-10'
                  }`}
                >
                  <div
                    style={{ backgroundColor: ann.color || '#ef4444' }}
                    className="w-3.5 h-3.5 rounded-full animate-ping opacity-75 pointer-events-none"
                  />
                  <div
                    style={{ backgroundColor: ann.color || '#ef4444' }}
                    className="w-3 h-3 rounded-full absolute text-[9px] text-white flex items-center justify-center font-bold pointer-events-none"
                  />

                  {/* Draggable Label Badge for Circle */}
                  {ann.label && (
                    <div
                      onMouseDown={(e) => handleStartDragLabel(e, ann)}
                      style={{
                        backgroundColor: ann.color || '#ef4444',
                        ...getLabelStyle(ann),
                      }}
                      className="absolute text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 select-none flex items-center gap-1.5 border border-white/20 hover:ring-2 hover:ring-white cursor-grab active:cursor-grabbing"
                      title="Arrastra para mover la etiqueta libremente"
                    >
                      <Move className="w-2.5 h-2.5 opacity-80" />
                      <span>{ann.label}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Floating Canvas Controls (Zoom & Status) */}
          <div className="absolute bottom-3 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-slate-300 text-xs shadow-xl z-20">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
              className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Alejar zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-slate-400 min-w-[36px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))))}
              className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Acercar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 1 && (
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="text-[10px] text-indigo-400 hover:underline pl-1 border-l border-slate-700"
              >
                100%
              </button>
            )}
            <span className="text-[10px] text-slate-500 pl-2 border-l border-slate-800 hidden sm:inline">
              Arrastra el elemento o su texto para reubicarlo
            </span>
          </div>
        </div>

        {/* 3. Right Inspector & Tools Panel: High-density layout, fits 100% on screen with ZERO vertical scroll */}
        <aside className="w-full md:w-80 lg:w-84 border-t md:border-t-0 md:border-l border-slate-200 bg-white p-3 flex flex-col justify-between shrink-0 overflow-y-auto max-h-full">
          {activeAnnotation ? (
            <div className="flex flex-col gap-2.5">
              {/* Header of Inspector */}
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: activeAnnotation.color || '#ef4444' }}
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Propiedades del Enfoque
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSelected(activeAnnotation.id)}
                  className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                  title="Eliminar este enfoque"
                >
                  <Trash2 className="w-3 h-3" /> Eliminar
                </button>
              </div>

              {/* 1. Texto / Etiqueta del Paso */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Type className="w-3 h-3 text-indigo-600" />
                    Texto de la Etiqueta
                  </label>
                  <div className="flex items-center gap-1">
                    <DictationButton
                      value={activeAnnotation.label || ''}
                      onChange={(val) => updateActive({ label: val })}
                      title="Dictar etiqueta por voz"
                      size="xs"
                    />
                    {activeAnnotation.labelPosition === 'custom' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateActive({
                            labelPosition: 'top',
                            labelOffsetX: 0,
                            labelOffsetY: 0,
                          })
                        }
                        className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                        title="Volver a posición automática"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Auto
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={activeAnnotation.label || ''}
                  onChange={(e) => updateActive({ label: e.target.value })}
                  placeholder="Ej. Clic en Grabar Datos"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                />
              </div>

              {/* 2. Posición Rápida del Texto (Inline Buttons) */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Posición del Texto
                </span>
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  {(['inside', 'bottom', 'top', 'right'] as const).map((pos) => {
                    const isPosSelected =
                      activeAnnotation.labelPosition === pos ||
                      (!activeAnnotation.labelPosition &&
                        (activeAnnotation.y < 18 ? pos === 'bottom' : pos === 'top'));
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() =>
                          updateActive({
                            labelPosition: pos,
                            labelOffsetX: 0,
                            labelOffsetY: 0,
                          })
                        }
                        className={`py-1 px-1 rounded-md border text-center font-semibold transition-all ${
                          isPosSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pos === 'inside'
                          ? 'Dentro'
                          : pos === 'bottom'
                          ? 'Abajo'
                          : pos === 'top'
                          ? 'Arriba'
                          : 'Der.'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Tipo de Enfoque */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Tipo de Forma
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => updateActive({ shape: 'rect' })}
                    className={`py-1 px-1.5 text-xs font-semibold rounded-lg border text-center transition-all flex items-center justify-center gap-1 ${
                      activeAnnotation.shape === 'rect'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Square className="w-3 h-3 text-indigo-600" /> Recuadro
                  </button>
                  <button
                    type="button"
                    onClick={() => updateActive({ shape: 'circle' })}
                    className={`py-1 px-1.5 text-xs font-semibold rounded-lg border text-center transition-all flex items-center justify-center gap-1 ${
                      activeAnnotation.shape === 'circle'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Circle className="w-3 h-3 text-red-500" /> Punto
                  </button>
                  <button
                    type="button"
                    onClick={() => updateActive({ shape: 'blur' })}
                    className={`py-1 px-1.5 text-xs font-semibold rounded-lg border text-center transition-all flex items-center justify-center gap-1 ${
                      activeAnnotation.shape === 'blur'
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <EyeOff className="w-3 h-3 text-amber-500" /> Censurar
                  </button>
                </div>
              </div>

              {/* 4. Color de Resalte */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Color de Resalte
                </span>
                <div className="flex items-center justify-between gap-1">
                  {COLOR_OPTIONS.map((c) => {
                    const isColorActive = (activeAnnotation.color || '#ef4444') === c.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          setActiveColor(c.hex);
                          updateActive({ color: c.hex });
                        }}
                        style={{ backgroundColor: c.hex }}
                        className={`w-6 h-6 rounded-full transition-all flex items-center justify-center ${
                          isColorActive
                            ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-sm'
                            : 'hover:scale-105 opacity-80'
                        }`}
                        title={c.name}
                      >
                        {isColorActive && <Check className="w-3 h-3 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Coordenadas & Tamaño (Compact 4-col single row) */}
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Posición & Dimensiones (%)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCenterCurrent}
                      className="text-[9px] text-slate-500 hover:text-indigo-600 font-medium"
                      title="Centrar en pantalla"
                    >
                      Centrar
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={handlePositionTopLeft}
                      className="text-[9px] text-slate-500 hover:text-indigo-600 font-medium"
                      title="Mover a esquina superior izquierda"
                    >
                      Sup. Izq
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block text-center">X %</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={activeAnnotation.x}
                      onChange={(e) => updateActive({ x: Number(e.target.value) })}
                      className="w-full px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block text-center">Y %</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={activeAnnotation.y}
                      onChange={(e) => updateActive({ y: Number(e.target.value) })}
                      className="w-full px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono text-center"
                    />
                  </div>
                  {activeAnnotation.shape !== 'circle' ? (
                    <>
                      <div>
                        <span className="text-[9px] text-slate-400 block text-center">Ancho %</span>
                        <input
                          type="number"
                          min="3"
                          max="100"
                          value={activeAnnotation.width || 22}
                          onChange={(e) => updateActive({ width: Number(e.target.value) })}
                          className="w-full px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block text-center">Alto %</span>
                        <input
                          type="number"
                          min="3"
                          max="100"
                          value={activeAnnotation.height || 14}
                          onChange={(e) => updateActive({ height: Number(e.target.value) })}
                          className="w-full px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono text-center"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 flex items-center justify-center text-[10px] text-slate-400 italic">
                      Hotspot circular
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Quick Tool Actions (Duplicar, Centrar) */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleDuplicateCurrent}
                  className="py-1 px-2 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center justify-center gap-1"
                  title="Duplicar este elemento"
                >
                  <Copy className="w-3 h-3 text-slate-600" /> Duplicar
                </button>
                <button
                  type="button"
                  onClick={() => handleAddNewAnnotation('rect')}
                  className="py-1 px-2 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors flex items-center justify-center gap-1 border border-indigo-200"
                  title="Añadir otro elemento"
                >
                  <Plus className="w-3 h-3 text-indigo-600" /> Otro Paso
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 p-3">
              <Crosshair className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-600">Sin elemento seleccionado</p>
              <p className="mt-1 text-[11px]">
                Pulsa en <strong>+ Recuadro</strong> o <strong>+ Punto Focal</strong> en la barra superior.
              </p>
            </div>
          )}

          {/* Bottom Action Button - Docked and visible with zero vertical scroll */}
          <div className="pt-2 border-t border-slate-200 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar y Aplicar al Paso</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
