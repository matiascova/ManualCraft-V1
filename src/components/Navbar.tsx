import React from 'react';
import { UserManual } from '../types/manual';
import {
  Sparkles,
  BookOpen,
  Plus,
  MonitorPlay,
  Download,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  manuals: UserManual[];
  activeManualId: string;
  onSelectManual: (id: string) => void;
  onOpenCreateModal: () => void;
  onOpenExportModal: () => void;
  onOpenSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  manuals,
  activeManualId,
  onSelectManual,
  onOpenCreateModal,
  onOpenExportModal,
  onOpenSimulator,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="w-[98%] max-w-[98vw] mx-auto px-2 sm:px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand & Selector */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-none">
                ManualCraft<span className="text-indigo-600"> AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Generador de Manuales & Guías
              </span>
            </div>
          </div>

          {/* Active Manual Dropdown */}
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200">
            <span className="text-xs text-slate-400 font-medium">Manual:</span>
            <div className="relative">
              <select
                value={activeManualId}
                onChange={(e) => onSelectManual(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-xs truncate"
              >
                {manuals.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenSimulator}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-xs transition-colors"
            title="Captura automática de clics, inputs, Enter y guardado"
          >
            <span>⚡ Capturar Clics &amp; Enter</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Manual</span>
          </button>
        </div>
      </div>
    </header>
  );
};
