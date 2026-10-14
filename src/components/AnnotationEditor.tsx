import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VisualAnnotation } from '../types/manual';
import {
  Trash2,
  Move,
  X,
  Check,
  Plus,
  Type,
  Maximize2,
  Sparkles,
  Eye,
  RotateCcw,
  CornerLeftUp,
  Square,
  Circle,
  EyeOff,
} from 'lucide-react';

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
  // Always select first or active annotation
  const [selectedId, setSelectedId] = useState<string | null>(
    annotations[0]?.id || null
  );

  // New item defaults
  const [activeShape, setActiveShape] = useState<'circle' | 'rect' | 'blur'>('rect');
  const [activeColor, setActiveColor] = useState<string>('#ef4444');
  const [newLabelText, setNewLabelText] = useState<string>('');

  // Dragging states
  const [isDraggingAnnotation, setIsDraggingAnnotation] = useState(false);
  const [isDraggingLabel, setIsDraggingLabel] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialAnnState, setInitialAnnState] = useState<VisualAnnotation | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Always resolve an active annotation if annotations exist
  const activeAnnotation: VisualAnnotation | null =
    annotations.find((a) => a.id === selectedId) ||
    (annotations.length > 0 ? annotations[annotations.length - 1] : null);

  // Keep selectedId synchronized
  useEffect(() => {
    if (annotations.length > 0) {
      if (!selectedId || !annotations.some((a) => a.id === selectedId)) {
        setSelectedId(annotations[annotations.length - 1].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [annotations, selectedId]);

  // Update active annotation
  const updateActive = useCallback(
    (partial: Partial<VisualAnnotation>) => {
      const targetId = activeAnnotation?.id || selectedId;
      if (!targetId) return;
      const updated = annotations.map((a) =>
        a.id === targetId ? { ...a, ...partial } : a
      );
      onChange(updated);
    },
    [annotations, activeAnnotation, selectedId, onChange]
  );

  // Explicit function to add a new annotation via button
  const handleAddNewAnnotation = (shapeOverride?: 'circle' | 'rect' | 'blur') => {
    const shape = shapeOverride || activeShape;
    const offset = (annotations.length % 5) * 6;
    const x = Math.min(75, 25 + offset);
    const y = Math.min(75, 20 + offset);

    const labelText =
      newLabelText.trim() ||
      (shape === 'blur' ? '' : `Paso ${annotations.length + 1}`);

    const newAnnotation: VisualAnnotation = {
      id: `ann-${Date.now()}`,
      x,
      y,
      shape,
      color: activeColor,
      label: labelText,
      // Smart default: if near top edge, place label inside or bottom
      labelPosition: y < 18 ? 'bottom' : 'top',
      width: shape === 'circle' ? undefined : 22,
      height: shape === 'circle' ? undefined : 14,
      labelOffsetX: 0,
      labelOffsetY: 0,
    };

    const updated = [...annotations, newAnnotation];
    onChange(updated);
    setSelectedId(newAnnotation.id);
    setActiveShape(shape);
    setNewLabelText('');
  };

  // Preset to place rectangle directly in the Top-Left Corner
  const handlePositionTopLeft = () => {
    if (!activeAnnotation) return;
    const width = activeAnnotation.width || 22;
    const height = activeAnnotation.height || 14;
    // Calculate center coordinates so the top-left edge touches (2%, 2%)
    const targetX = Math.round(width / 2 + 2);
    const targetY = Math.round(height / 2 + 2);
    updateActive({
      x: targetX,
      y: targetY,
      labelPosition: 'inside', // Put label inside so it never bleeds off top-left
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

    // Measure exact current visual offset relative to parent to prevent jump
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

  // Window mouse move & up handlers for smooth dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!imgRef.current || !dragStart || !initialAnnState) return;
      const rect = imgRef.current.getBoundingClientRect();

      // Delta in percentage for annotation movement
      const deltaXPercent = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStart.y) / rect.height) * 100;

      if (isDraggingAnnotation) {
        // Move the entire element
        const newX = Math.max(0, Math.min(100, Math.round(initialAnnState.x + deltaXPercent)));
        const newY = Math.max(0, Math.min(100, Math.round(initialAnnState.y + deltaYPercent)));
        updateActive({ x: newX, y: newY });
      } else if (isDraggingLabel) {
        // Move label offset in pixels without jump
        const deltaXPixels = Math.round(e.clientX - dragStart.x);
        const deltaYPixels = Math.round(e.clientY - dragStart.y);
        updateActive({
          labelPosition: 'custom',
          labelOffsetX: (initialAnnState.labelOffsetX || 0) + deltaXPixels,
          labelOffsetY: (initialAnnState.labelOffsetY || 0) + deltaYPixels,
        });
      } else if (isResizing) {
        // Resize width & height
        const newWidth = Math.max(5, Math.min(95, Math.round((initialAnnState.width || 20) + deltaXPercent)));
        const newHeight = Math.max(4, Math.min(95, Math.round((initialAnnState.height || 12) + deltaYPercent)));
        updateActive({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingAnnotation(false);
      setIsDraggingLabel(false);
      setIsResizing(false);
      setDragStart(null);
      setInitialAnnState(null);
    };

    if (isDraggingAnnotation || isDraggingLabel || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
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
  ]);

  const removeSelected = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = annotations.filter((a) => a.id !== id);
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
  }, [selectedId, annotations]);

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

    // Smart default: if near top edge (< 18%), place label below or inside
    const isNearTop = (ann.y || 0) < 18;
    const pos = ann.labelPosition || (isNearTop ? 'bottom' : 'top');

    switch (pos) {
      case 'bottom':
        return { bottom: '-26px', left: '0', cursor: 'grab' };
      case 'inside':
        return { top: '6px', left: '6px', cursor: 'grab' };
      case 'right':
        return { top: '0', right: '-120px', cursor: 'grab' };
      case 'left':
        return { top: '0', left: '-120px', cursor: 'grab' };
      case 'top':
      default:
        return { top: '-26px', left: '0', cursor: 'grab' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-sm flex items-center justify-center p-1 sm:p-2">
      <div className="bg-white rounded-2xl shadow-2xl w-[98vw] max-w-[98vw] h-[98vh] max-h-[98vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Editor de Enfoque y Puntos Focales
            </h3>
            <p className="text-xs text-slate-500">
              Usa los botones para adicionar Recuadro o Punto Focal. Arrastra el elemento o el texto para posicionarlo donde desees.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Cerrar editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Canvas Area */}
          <div
            ref={canvasContainerRef}
            className="flex-1 bg-slate-950 p-6 sm:p-8 flex items-center justify-center overflow-auto relative select-none"
          >
            <div className="relative inline-block cursor-default shadow-2xl rounded-lg overflow-visible border border-slate-800">
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Captura a anotar"
                className="max-h-[68vh] max-w-full block object-contain pointer-events-none rounded select-none"
              />

              {/* Render Annotations Overlay */}
              {annotations.map((ann) => {
                const isSelected = ann.id === selectedId || activeAnnotation?.id === ann.id;

                // 1. RECTANGLE
                if (ann.shape === 'rect') {
                  const width = ann.width || 22;
                  const height = ann.height || 14;
                  return (
                    <div
                      key={ann.id}
                      onClick={() => setSelectedId(ann.id)}
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
                          <Move className="w-3 h-3" />
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
                          className={`absolute text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 select-none flex items-center gap-1.5 hover:ring-2 hover:ring-white transition-transform active:cursor-grabbing cursor-grab`}
                          title="Arrastra para mover la etiqueta de texto libremente"
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
                          title="Arrastra para redimensionar el recuadro"
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
                      onClick={() => setSelectedId(ann.id)}
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
                    onClick={() => setSelectedId(ann.id)}
                    onMouseDown={(e) => handleStartDragAnnotation(e, ann)}
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      borderColor: ann.color || '#ef4444',
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-3 flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform ${
                      isSelected
                        ? 'ring-4 ring-white scale-125 z-20 shadow-2xl'
                        : 'hover:scale-110 z-10'
                    }`}
                  >
                    <div
                      style={{ backgroundColor: ann.color || '#ef4444' }}
                      className="w-4 h-4 rounded-full animate-ping opacity-75 pointer-events-none"
                    />
                    <div
                      style={{ backgroundColor: ann.color || '#ef4444' }}
                      className="w-3.5 h-3.5 rounded-full absolute text-[10px] text-white flex items-center justify-center font-bold pointer-events-none"
                    />

                    {/* Draggable Label Badge for Circle */}
                    {ann.label && (
                      <div
                        onMouseDown={(e) => handleStartDragLabel(e, ann)}
                        style={{
                          backgroundColor: ann.color || '#0f172a',
                          ...getLabelStyle(ann),
                        }}
                        className="absolute text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 select-none flex items-center gap-1.5 border border-white/20 hover:ring-2 hover:ring-white cursor-grab active:cursor-grabbing"
                        title="Arrastra para mover la etiqueta de texto libremente"
                      >
                        <Move className="w-2.5 h-2.5 opacity-80" />
                        <span>{ann.label}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Controls - Full Height & Always Accessible */}
          <div className="w-full md:w-88 border-t md:border-t-0 md:border-l border-slate-200 p-5 bg-white flex flex-col gap-4 overflow-y-auto max-h-[45vh] md:max-h-none">
            {/* 1. BUTTONS TO ADD NEW ITEMS - ALWAYS VISIBLE */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                Adicionar a la Pantalla:
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddNewAnnotation('rect')}
                  className="py-2 px-1.5 bg-white hover:bg-indigo-600 hover:text-white text-slate-800 border border-indigo-200 text-xs font-bold rounded-lg shadow-xs flex flex-col items-center gap-1 transition-all group"
                  title="Añadir Recuadro de Enfoque"
                >
                  <Square className="w-4 h-4 text-indigo-600 group-hover:text-white" />
                  <span>+ Recuadro</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddNewAnnotation('circle')}
                  className="py-2 px-1.5 bg-white hover:bg-indigo-600 hover:text-white text-slate-800 border border-indigo-200 text-xs font-bold rounded-lg shadow-xs flex flex-col items-center gap-1 transition-all group"
                  title="Añadir Punto Focal Circular"
                >
                  <Circle className="w-4 h-4 text-indigo-600 group-hover:text-white" />
                  <span>+ Punto Focal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddNewAnnotation('blur')}
                  className="py-2 px-1.5 bg-white hover:bg-indigo-600 hover:text-white text-slate-800 border border-indigo-200 text-xs font-bold rounded-lg shadow-xs flex flex-col items-center gap-1 transition-all group"
                  title="Añadir Difuminado de Privacidad"
                >
                  <EyeOff className="w-4 h-4 text-indigo-600 group-hover:text-white" />
                  <span>+ Difuminar</span>
                </button>
              </div>
            </div>

            {/* 2. LIST OF EXISTING ANNOTATIONS */}
            {annotations.length > 0 && (
              <div className="flex flex-col gap-1.5 pb-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Elementos en la Captura ({annotations.length}):
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-100">
                  {annotations.map((ann, idx) => {
                    const isSelected = activeAnnotation?.id === ann.id;
                    return (
                      <button
                        key={ann.id}
                        type="button"
                        onClick={() => setSelectedId(ann.id)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: ann.color || '#ef4444' }}
                        />
                        <span className="truncate max-w-[120px]">
                          {ann.label || (ann.shape === 'circle' ? `Punto ${idx + 1}` : `Recuadro ${idx + 1}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. ACTIVE ELEMENT FULL CONTROLS */}
            {activeAnnotation ? (
              <div className="flex flex-col gap-4">
                {/* Text Label */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Type className="w-3.5 h-3.5 text-indigo-600" />
                      Texto / Etiqueta del Paso
                    </label>
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
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Restablecer posición
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={activeAnnotation.label || ''}
                    onChange={(e) => updateActive({ label: e.target.value })}
                    placeholder="Ej. Clic en Guardar"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    💡 Puedes tomar y arrastrar la etiqueta en la imagen para moverla a cualquier parte.
                  </p>
                </div>

                {/* Shape Selector for Selected Annotation */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Tipo de Enfoque
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateActive({ shape: 'rect' })}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg border text-center transition-all flex items-center justify-center gap-1 ${
                        activeAnnotation.shape === 'rect'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Square className="w-3.5 h-3.5" /> Recuadro
                    </button>
                    <button
                      type="button"
                      onClick={() => updateActive({ shape: 'circle' })}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg border text-center transition-all flex items-center justify-center gap-1 ${
                        activeAnnotation.shape === 'circle'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Circle className="w-3.5 h-3.5" /> Punto Focal
                    </button>
                    <button
                      type="button"
                      onClick={() => updateActive({ shape: 'blur' })}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg border text-center transition-all flex items-center justify-center gap-1 ${
                        activeAnnotation.shape === 'blur'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5" /> Difuminar
                    </button>
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Color de Resalte
                  </span>
                  <div className="flex items-center gap-2">
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
                          className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                            isColorActive
                              ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-md'
                              : 'hover:scale-105 opacity-80'
                          }`}
                          title={c.name}
                        >
                          {isColorActive && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Text Label Position Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Move className="w-3.5 h-3.5 text-slate-400" />
                      Posición Rápida del Texto
                    </span>
                    {activeAnnotation.labelPosition === 'custom' && (
                      <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        Arrastre Libre
                      </span>
                    )}
                  </div>
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
                          className={`py-1.5 px-1 rounded border text-center font-medium ${
                            isPosSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {pos === 'inside'
                            ? 'Dentro'
                            : pos === 'bottom'
                            ? 'Abajo'
                            : pos === 'top'
                            ? 'Arriba'
                            : 'Derecha'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Corner Preset & Dimensions */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Ubicación &amp; Esquinas
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSelected(activeAnnotation.id)}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </button>
                  </div>

                  {/* Corner helper button specifically addressing upper-left corner */}
                  {activeAnnotation.shape === 'rect' && (
                    <button
                      type="button"
                      onClick={handlePositionTopLeft}
                      className="w-full py-1.5 px-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      title="Ajusta el recuadro exactamente en la esquina superior izquierda"
                    >
                      <CornerLeftUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Colocar en Esquina Superior Izquierda</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Posición X (%)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={activeAnnotation.x}
                        onChange={(e) => updateActive({ x: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Posición Y (%)</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={activeAnnotation.y}
                        onChange={(e) => updateActive({ y: Number(e.target.value) })}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                      />
                    </div>
                    {activeAnnotation.shape !== 'circle' && (
                      <>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Ancho (%)</span>
                          <input
                            type="number"
                            min="3"
                            max="100"
                            value={activeAnnotation.width || 22}
                            onChange={(e) => updateActive({ width: Number(e.target.value) })}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Alto (%)</span>
                          <input
                            type="number"
                            min="3"
                            max="100"
                            value={activeAnnotation.height || 14}
                            onChange={(e) => updateActive({ height: Number(e.target.value) })}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                <p className="font-semibold text-slate-600">No hay elementos en esta captura aún.</p>
                <p className="mt-1">
                  Haz clic en <strong>+ Recuadro</strong> o <strong>+ Punto Focal</strong> arriba para colocar tu primer enfoque.
                </p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-auto pt-4 border-t border-slate-200 flex flex-col gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar y Aplicar al Paso</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
