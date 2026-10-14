import React, { useMemo, memo } from 'react';
import { UserManual } from '../types/manual';
import { Project } from '../types/project';
import { OrganizationBranding } from '../types/branding';
import {
  Sparkles,
  BookOpen,
  Plus,
  MonitorPlay,
  Download,
  ChevronDown,
  Layers,
  FolderKanban,
  Building2,
  FolderPlus,
  Settings,
  Image,
} from 'lucide-react';

interface NavbarProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onOpenNewProjectModal: () => void;
  onOpenProjectSettings: (project: Project) => void;
  manuals: UserManual[];
  activeManualId: string;
  onSelectManual: (id: string) => void;
  onOpenCreateModal: () => void;
  onOpenExportModal: () => void;
  onOpenSimulator: () => void;
  branding?: OrganizationBranding;
  onOpenOurLogoModal: () => void;
  viewMode: 'project' | 'manual';
  onChangeViewMode: (mode: 'project' | 'manual') => void;
}

const NavbarComponent: React.FC<NavbarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenNewProjectModal,
  onOpenProjectSettings,
  manuals,
  activeManualId,
  onSelectManual,
  onOpenCreateModal,
  onOpenExportModal,
  onOpenSimulator,
  branding,
  onOpenOurLogoModal,
  viewMode,
  onChangeViewMode,
}) => {
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0];
  }, [projects, activeProjectId]);

  const projectManuals = useMemo(() => {
    return manuals.filter((m) => m.projectId === activeProject?.id);
  }, [manuals, activeProject?.id]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="w-[98%] max-w-[98vw] mx-auto px-2 sm:px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand & Project Selector */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div
            onClick={() => onChangeViewMode('project')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="Ir al panel del proyecto"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div className="hidden xs:block">
              <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-none">
                ManualCraft<span className="text-indigo-600"> AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Gestión de Proyectos &amp; Manuales
              </span>
            </div>
          </div>

          {/* Project Selector Dropdown */}
          <div className="flex items-center gap-2 pl-3 sm:pl-4 border-l border-slate-200">
            <span className="hidden sm:inline text-xs text-slate-400 font-medium">Proyecto:</span>
            <div className="relative flex items-center gap-1.5">
              {activeProject?.clientLogo && (
                <div className="w-6 h-6 rounded bg-slate-50 border border-slate-200 p-0.5 hidden md:flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={activeProject.clientLogo}
                    alt={activeProject.clientName}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              <div className="relative">
                <select
                  value={activeProjectId}
                  onChange={(e) => {
                    onSelectProject(e.target.value);
                  }}
                  className="appearance-none bg-slate-100/80 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[180px] sm:max-w-xs truncate"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.clientName} · {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Quick button to add new project */}
              <button
                type="button"
                onClick={onOpenNewProjectModal}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Crear un nuevo proyecto"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View mode toggle tabs: Proyecto vs Manual */}
          <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onChangeViewMode('project')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'project'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Vista Proyecto ({projectManuals.length})</span>
            </button>

            <button
              onClick={() => onChangeViewMode('manual')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'manual'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ver Manual</span>
            </button>
          </div>

          {/* Active Manual Dropdown (When in manual mode) */}
          {viewMode === 'manual' && projectManuals.length > 0 && (
            <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-slate-200">
              <span className="text-xs text-slate-400 font-medium">Manual:</span>
              <div className="relative">
                <select
                  value={activeManualId}
                  onChange={(e) => onSelectManual(e.target.value)}
                  className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-xs truncate"
                >
                  {projectManuals.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Definir Nuestro Logo Button */}
          <button
            type="button"
            onClick={onOpenOurLogoModal}
            className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-700 bg-white hover:bg-indigo-50/50 border border-slate-300 hover:border-indigo-300 rounded-lg shadow-xs transition-all group"
            title="Definir Nuestro Logo e Identidad Corporativa (Emisora)"
          >
            <div className="w-5 h-5 rounded bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-indigo-400">
              {branding?.logo ? (
                <img
                  src={branding.logo}
                  alt="Nuestro Logo"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <Building2 className="w-3 h-3 text-slate-500" />
              )}
            </div>
            <span className="hidden sm:inline font-extrabold text-slate-800 group-hover:text-indigo-600">
              Nuestro Logo
            </span>
          </button>

          <button
            onClick={onOpenSimulator}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-xs transition-colors"
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
            title={`Crear un nuevo manual en ${activeProject?.name || 'el proyecto'}`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Crear Manual</span>
            <span className="xs:hidden">Nuevo</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export const Navbar = memo(NavbarComponent);
