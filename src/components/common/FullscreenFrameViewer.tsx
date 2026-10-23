import React, { useEffect } from 'react';
import {
  Crop,
  Scissors,
  EyeOff,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cropTaskbar as cropTaskbarFromDataUrl, blurTaskbar as blurTaskbarOnDataUrl } from '../../utils/imageProcessing';
import { speechTranscriptionService } from '../../utils/speechTranscription';

export interface ViewerItem {
  id: string;
  dataUrl: string;
  label: string;
  timestamp?: number;
  reason?: string;
  selected?: boolean;
}

export interface FullscreenFrameViewerProps {
  isOpen: boolean;
  currentIndex: number;
  items: ViewerItem[];
  onClose: () => void;
  onNavigate: (index: number) => void;
  onOpenCrop: (item: ViewerItem) => void;
  onApplyCrop: (croppedDataUrl: string) => void;
  onDeleteItem: (id: string) => void;
  formatTimestamp?: (timestamp: number) => string;
}

export const FullscreenFrameViewer: React.FC<FullscreenFrameViewerProps> = ({
  isOpen,
  currentIndex,
  items,
  onClose,
  onNavigate,
  onOpenCrop,
  onApplyCrop,
  onDeleteItem,
  formatTimestamp = (ts: number) => speechTranscriptionService.formatTime(ts),
}) => {
  const currentItem = items[currentIndex] || null;

  // Keyboard navigation when lightbox is open
  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        onNavigate((currentIndex + 1) % items.length);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        onNavigate((currentIndex - 1 + items.length) % items.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, items.length, onClose, onNavigate]);

  if (!isOpen || !currentItem) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Control Bar */}
      <div
        className="flex items-center justify-between gap-3 text-white shrink-0 z-10 pb-2 border-b border-slate-800/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-indigo-600 text-white font-mono font-bold text-xs rounded-full shadow-xs">
            Fotograma {currentIndex + 1} de {items.length}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200 truncate max-w-sm sm:max-w-md">
              {currentItem.label}
            </span>
            {currentItem.timestamp !== undefined && (
              <span className="text-xs text-indigo-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                ⏱️ {formatTimestamp(currentItem.timestamp)}
              </span>
            )}
          </div>
        </div>

        {/* Middle shortcut hints */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[10px]">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[10px]">→</kbd>
            <span>Navegar</span>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[10px]">ESC</kbd>
            <span>Cerrar</span>
          </span>
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-2">
          {/* Botón Recortar / Editar Tamaño */}
          <button
            type="button"
            onClick={() => onOpenCrop(currentItem)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 text-xs font-bold"
            title="Editar tamaño y recortar esta captura para el manual y PDF"
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Recortar</span>
          </button>

          {/* Botón 1-clic Quitar Barra de Tareas */}
          <button
            type="button"
            onClick={async () => {
              const cropped = await cropTaskbarFromDataUrl(currentItem.dataUrl);
              onApplyCrop(cropped);
            }}
            className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Elimina automáticamente los iconos de la barra de tareas de Windows (~5% inferior)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Quitar Barra</span>
          </button>

          {/* Botón 1-clic Difuminar Barra */}
          <button
            type="button"
            onClick={async () => {
              const blurred = await blurTaskbarOnDataUrl(currentItem.dataUrl);
              onApplyCrop(blurred);
            }}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Difumina la barra de tareas de Windows para que no se vean los iconos de aplicaciones abiertas"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Difuminar Barra</span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteItem(currentItem.id)}
            className="px-2.5 py-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Descartar este fotograma de la secuencia"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Descartar</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Cerrar visor a pantalla completa (ESC)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Stage with Large High-Res Image & Floating Chevrons */}
      <div
        className="flex-1 flex items-center justify-between gap-3 p-2 min-h-0 relative my-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Chevron Button */}
        <button
          type="button"
          onClick={() => onNavigate((currentIndex - 1 + items.length) % items.length)}
          className="p-3 sm:p-4 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white shadow-2xl border border-slate-700 transition-all hover:scale-110 active:scale-95 shrink-0 z-20 group"
          title="Fotograma anterior (←)"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* High-Resolution Frame Display */}
        <div className="flex-1 h-full flex items-center justify-center p-1 sm:p-2 min-h-0 overflow-hidden">
          <img
            src={currentItem.dataUrl}
            alt={currentItem.label}
            className="max-h-[72vh] max-w-[88vw] w-auto h-auto object-contain rounded-xl shadow-2xl border border-slate-800/90 bg-slate-900"
          />
        </div>

        {/* Right Chevron Button */}
        <button
          type="button"
          onClick={() => onNavigate((currentIndex + 1) % items.length)}
          className="p-3 sm:p-4 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white shadow-2xl border border-slate-700 transition-all hover:scale-110 active:scale-95 shrink-0 z-20 group"
          title="Siguiente fotograma (→)"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Bottom Filmstrip Carousel */}
      <div
        className="h-18 pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 overflow-x-auto scrollbar-thin px-2 shrink-0 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={item.id || idx}
              type="button"
              onClick={() => onNavigate(idx)}
              className={`relative rounded-md overflow-hidden transition-all shrink-0 border ${
                isActive
                  ? 'ring-2 ring-indigo-500 border-indigo-400 scale-105 shadow-lg opacity-100'
                  : 'border-slate-700/80 opacity-45 hover:opacity-90 hover:border-slate-500'
              }`}
              style={{ width: '76px', height: '46px' }}
              title={`Fotograma #${idx + 1}`}
            >
              <img src={item.dataUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[9px] font-mono px-1 rounded">
                #{idx + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
