import React, { useMemo, memo } from 'react';
import { UserManual } from '../types/manual';
import { Project } from '../types/project';
import { Client } from '../types/client';
import { OrganizationBranding } from '../types/branding';
import {
  BookOpen,
  Plus,
  Download,
  ChevronDown,
  FolderKanban,
  Building2,
  FolderPlus,
  Settings,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  clients: Client[];
  activeClientId: string;
  onSelectClient: (id: string) => void;
  onOpenNewClientModal: () => void;
  onOpenManageClientsModal: () => void;
  onDownloadMasterIndex?: (client: Client) => void;
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
  viewMode: 'landing' | 'project' | 'manual';
  onChangeViewMode: (mode: 'landing' | 'project' | 'manual') => void;
  isDbConnected?: boolean;
}

const NavbarComponent: React.FC<NavbarProps> = ({
  clients = [],
  activeClientId,
  onSelectClient,
  onOpenNewClientModal,
  onOpenManageClientsModal,
  projects,
  activeProjectId,
  onSelectProject,
  onOpenNewProjectModal,
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
  isDbConnected = true,
}) => {
  const isAllClients = !activeClientId || activeClientId === 'all' || activeClientId === 'todos';

  // Active Client (null if 'all' is selected)
  const activeClient = useMemo(() => {
    if (isAllClients) {
      return null;
    }
    return clients.find((c) => c.id === activeClientId) || clients[0] || null;
  }, [clients, activeClientId, isAllClients]);

  // Projects strictly filtered:
  // If isAllClients: show ALL projects
  // If a specific client is selected (e.g. Weber): strictly filter ONLY projects belonging to that client!
  const clientProjects = useMemo(() => {
    if (isAllClients) {
      return projects;
    }
    return projects.filter((p) => p.clientId === activeClientId);
  }, [projects, activeClientId, isAllClients]);

  // Active Project (ensures it is part of clientProjects)
  const activeProject = useMemo(() => {
    return clientProjects.find((p) => p.id === activeProjectId) || clientProjects[0] || projects[0];
  }, [clientProjects, projects, activeProjectId]);

  // Manuals in active project
  const projectManuals = useMemo(() => {
    return manuals.filter((m) => m.projectId === activeProject?.id);
  }, [manuals, activeProject?.id]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="w-[98%] max-w-[98vw] mx-auto px-2 sm:px-4 h-16 flex items-center justify-between gap-3">
        {/* ============================================================== */}
        {/* Left Section: Logo & Cohesive Context Selector (Cliente / Proyecto) */}
        {/* ============================================================== */}
        <div className="flex items-center gap-3 lg:gap-4 min-w-0">
          {/* Logo Brand */}
          <div
            onClick={() => onChangeViewMode('landing')}
            className="flex items-center gap-2 cursor-pointer select-none group flex-shrink-0"
            title="ManualCraft AI · Ir a la presentación y bondades de la solución"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div className="hidden md:block">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-none">
                ManualCraft<span className="text-indigo-600"> AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-none">
                SAP Enterprise
              </span>
            </div>
          </div>

          {/* Unified Breadcrumb Context Bar (Cliente → Proyecto) */}
          <div className="flex items-center bg-slate-100/80 hover:bg-slate-100 border border-slate-200/90 rounded-xl px-2 py-1 transition-colors min-w-0">
            {/* 1. Selector de Cliente */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isAllClients ? (
                <span className="text-xs" title="Todos los Clientes">🌐</span>
              ) : activeClient?.logo ? (
                <div className="w-4 h-4 bg-white rounded border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={activeClient.logo}
                    alt={activeClient.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              )}

              <div className="relative flex items-center">
                <select
                  value={isAllClients ? 'all' : activeClientId}
                  onChange={(e) => onSelectClient(e.target.value)}
                  className="appearance-none bg-transparent text-slate-900 font-bold text-xs pr-4 py-0.5 focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[160px] truncate"
                  title="Cambiar Cliente Corporativo"
                >
                  <option value="all">Todos los Clientes</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={onOpenManageClientsModal}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                title="Administrar Clientes"
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>

            <span className="text-slate-300 font-light mx-1.5 select-none">/</span>

            {/* 2. Selector de Proyecto */}
            <div className="flex items-center gap-1.5 min-w-0">
              <FolderKanban className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <div className="relative flex items-center min-w-0">
                <select
                  value={activeProject?.id || activeProjectId}
                  onChange={(e) => onSelectProject(e.target.value)}
                  className="appearance-none bg-transparent text-slate-900 font-bold text-xs pr-4 py-0.5 focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[200px] xl:max-w-[240px] truncate"
                  title={
                    isAllClients
                      ? 'Todos los Proyectos'
                      : `Proyectos de ${activeClient?.name || 'este cliente'}`
                  }
                >
                  {clientProjects.length === 0 ? (
                    <option value="" disabled>
                      (Sin proyectos en este cliente)
                    </option>
                  ) : (
                    clientProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {isAllClients && p.clientName ? `[${p.clientName}] ` : ''}
                        {p.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={onOpenNewProjectModal}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                title={`Crear un nuevo proyecto en ${activeClient?.name || 'este cliente'}`}
              >
                <FolderPlus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Center: View Switch Tabs (Inicio / Solución vs Workspace vs Manual) */}
        {/* ============================================================== */}
        <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onChangeViewMode('landing')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'landing'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Conoce las bondades, características y simulador de la solución"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Inicio / Solución</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('project')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'project'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Workspace ({projectManuals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('manual')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'manual'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manual</span>
          </button>
        </div>

        {/* Manual selector dropdown (only when viewing manual) */}
        {viewMode === 'manual' && projectManuals.length > 0 && (
          <div className="hidden 2xl:flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Manual:</span>
            <div className="relative">
              <select
                value={activeManualId}
                onChange={(e) => onSelectManual(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-xs truncate"
              >
                {projectManuals.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* Right Section Actions: Clean, Balanced, Unified Hierarchy */}
        {/* ============================================================== */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Captura SAP Quick Launcher */}
          <button
            onClick={onOpenSimulator}
            className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
            title="Captura automática de pantallas y flujos transaccionales SAP"
          >
            <span>⚡ Captura SAP</span>
          </button>

          {/* Configuración Nuestro Logo (Icono discreto con tooltip) */}
          <button
            type="button"
            onClick={onOpenOurLogoModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title={`Logotipo Emisor: ${branding?.companyName || 'HSBT'}`}
          >
            {branding?.logo ? (
              <img
                src={branding.logo}
                alt="Logo Emisor"
                className="w-4 h-4 object-contain rounded"
              />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden 2xl:inline font-semibold">Nuestro Logo</span>
          </button>

          {/* Status Base de Datos (Dot sutil con tooltip, sin romper la línea) */}
          <div
            className="flex items-center px-1.5 py-1 rounded-md"
            title={
              isDbConnected
                ? 'Base de datos Firestore sincronizada en tiempo real'
                : 'Conectando con base de datos...'
            }
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isDbConnected ? 'bg-emerald-500 shadow-2xs shadow-emerald-300' : 'bg-amber-400 animate-pulse'
              }`}
            />
          </div>

          {/* Exportar Entregables (Abre el modal unificado con HTML por cliente, ZIP, PDF, Word) */}
          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-700 bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-lg shadow-2xs transition-all cursor-pointer"
            title="Exportar manuales en HTML por cliente, ZIP, PDF oficial con plantilla y Word"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Exportar</span>
          </button>

          {/* Botón Principal: Crear Nuevo Manual */}
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title={`Crear un nuevo manual en ${activeProject?.name || 'el proyecto'}`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Manual</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export const Navbar = memo(NavbarComponent);
