import React, { useState } from 'react';
import { Project, ProjectDocumentOptions } from '../types/project';
import { UserManual } from '../types/manual';
import { OrganizationBranding } from '../types/branding';
import {
  FolderKanban,
  Building2,
  BookOpen,
  Plus,
  Settings,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FileText,
  Sliders,
  Shield,
  Trash2,
  ArrowRight,
  FolderOpen,
  Eye,
  Check,
  Image,
} from 'lucide-react';

interface ProjectWorkspaceProps {
  project: Project;
  allProjects: Project[];
  manualsInProject: UserManual[];
  allManuals: UserManual[];
  onSelectProject: (projectId: string) => void;
  onOpenManual: (manualId: string) => void;
  onOpenCreateManualForProject: (projectId: string) => void;
  onOpenProjectSettings: (project: Project) => void;
  onOpenExportProject: (project: Project) => void;
  onUpdateProject: (updatedProject: Project) => void;
  onLinkManualToProject: (manualId: string, projectId: string) => void;
  onUnlinkManualFromProject: (manualId: string) => void;
  branding?: OrganizationBranding;
  onOpenOurLogoModal?: () => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  allProjects,
  manualsInProject,
  allManuals,
  onSelectProject,
  onOpenManual,
  onOpenCreateManualForProject,
  onOpenProjectSettings,
  onOpenExportProject,
  onUpdateProject,
  onLinkManualToProject,
  onUnlinkManualFromProject,
  branding,
  onOpenOurLogoModal,
}) => {
  const [activeTab, setActiveTab] = useState<'manuals' | 'features' | 'info'>('manuals');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Unlinked manuals or manuals from other projects
  const availableManualsToLink = allManuals.filter(
    (m) => m.projectId !== project.id
  );

  // Statistics
  const totalSteps = manualsInProject.reduce((acc, m) => acc + (m.steps?.length || 0), 0);
  const totalMinutes = manualsInProject.reduce((acc, m) => acc + (m.estimatedMinutes || 3), 0);
  const activeFeaturesCount = Object.values(project.documentOptions || {}).filter(Boolean).length;

  const handleToggleDocOption = (key: keyof ProjectDocumentOptions) => {
    const updatedOptions = {
      ...project.documentOptions,
      [key]: !project.documentOptions[key],
    };
    onUpdateProject({
      ...project,
      documentOptions: updatedOptions,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="w-[98%] max-w-[98vw] mx-auto px-2 sm:px-4 py-6 space-y-6">
      {/* Project Hero Banner */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        {/* Subtle accent bar matching project color */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: project.colorTheme || '#0f3a60' }}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Dual Branding & Project Title */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Dual Logos Showcase */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Nuestro Logo Card */}
              <div className="w-24 sm:w-32 h-20 sm:h-24 bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center flex-shrink-0 shadow-xs group relative">
                {(project.organizationLogo || branding?.logo) ? (
                  <img
                    src={project.organizationLogo || branding?.logo}
                    alt={project.organizationName || branding?.companyName || 'Nuestro Logo'}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <Building2 className="w-6 h-6 text-slate-300" />
                    <span className="text-[9px] mt-1 font-semibold">Sin logo</span>
                  </div>
                )}
                <span className="absolute bottom-1 right-1 text-[8px] bg-indigo-700 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                  Nuestro
                </span>
                {onOpenOurLogoModal && (
                  <button
                    onClick={onOpenOurLogoModal}
                    title="Definir Nuestro Logo e Identidad Emisora"
                    className="absolute inset-0 bg-indigo-950/70 text-white text-[11px] font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-xs"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Definir</span>
                  </button>
                )}
              </div>

              {/* Client Logo Card */}
              <div className="w-24 sm:w-32 h-20 sm:h-24 bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center flex-shrink-0 shadow-xs group relative">
                {project.clientLogo ? (
                  <img
                    src={project.clientLogo}
                    alt={project.clientName}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <Building2 className="w-6 h-6 text-slate-300" />
                    <span className="text-[9px] mt-1 font-semibold">Sin logo</span>
                  </div>
                )}
                <span className="absolute bottom-1 right-1 text-[8px] bg-slate-800 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                  Cliente
                </span>
                <button
                  onClick={() => onOpenProjectSettings(project)}
                  title="Cambiar logo del cliente"
                  className="absolute inset-0 bg-slate-900/60 text-white text-[11px] font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-xs"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Cambiar</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Building2 className="w-3 h-3" />
                  Cliente: {project.clientName}
                </span>

                {project.code && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                    {project.code}
                  </span>
                )}

                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    project.status === 'Aprobado' || project.status === 'Publicado'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : project.status === 'En Progreso'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  ● {project.status}
                </span>

                <span className="text-[11px] text-slate-500 font-medium">
                  Versión {project.version}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {project.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                {project.description ||
                  'Conjunto estructurado de manuales operativos y procedimientos estándar para este proyecto.'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-stretch lg:self-auto justify-end">
            <button
              onClick={() => onOpenProjectSettings(project)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Configuración</span>
            </button>

            <button
              onClick={() => onOpenExportProject(project)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              <span>Exportar Solución</span>
            </button>

            <button
              onClick={() => onOpenCreateManualForProject(project.id)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Manual para este Proyecto</span>
            </button>
          </div>
        </div>

        {/* Project KPI Stats bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
          <div className="px-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Manuales del Proyecto
            </div>
            <div className="text-xl font-black text-slate-800 mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>{manualsInProject.length}</span>
              <span className="text-xs font-normal text-slate-500">manual(es)</span>
            </div>
          </div>

          <div className="px-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pasos Procedimentales
            </div>
            <div className="text-xl font-black text-slate-800 mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>{totalSteps}</span>
              <span className="text-xs font-normal text-slate-500">pasos</span>
            </div>
          </div>

          <div className="px-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tiempo Total Estimado
            </div>
            <div className="text-xl font-black text-slate-800 mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span>~{totalMinutes} min</span>
            </div>
          </div>

          <div className="px-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Características del Doc.
            </div>
            <div className="text-xl font-black text-slate-800 mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <span>{activeFeaturesCount} / 12</span>
              <span className="text-xs font-normal text-slate-500">activas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 font-bold text-xs">
        <button
          onClick={() => setActiveTab('manuals')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'manuals'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Manuales del Proyecto ({manualsInProject.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('features')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'features'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Características del Documento ({activeFeaturesCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'info'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Ficha Técnica &amp; Alcance</span>
        </button>
      </div>

      {/* TAB 1: MANUALS LIST */}
      {activeTab === 'manuals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Manuales asignados a este proyecto
              </h2>
              <p className="text-xs text-slate-500">
                Cada manual documenta un flujo específico del cliente <span className="font-semibold text-slate-700">{project.clientName}</span>. Puedes añadir nuevos manuales o vincular los existentes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {availableManualsToLink.length > 0 && (
                <button
                  onClick={() => setIsLinkModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs"
                >
                  + Vincular Manual Existente
                </button>
              )}
              <button
                onClick={() => onOpenCreateManualForProject(project.id)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Manual</span>
              </button>
            </div>
          </div>

          {manualsInProject.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center max-w-lg mx-auto">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">
                No hay manuales creados en este proyecto aún
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Crea el primer manual paso a paso para {project.clientName} subiendo capturas de pantalla o grabando un video de tu pantalla.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => onOpenCreateManualForProject(project.id)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow"
                >
                  Crear Primer Manual
                </button>
                {availableManualsToLink.length > 0 && (
                  <button
                    onClick={() => setIsLinkModalOpen(true)}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl shadow-xs"
                  >
                    Vincular Manual Existente
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {manualsInProject.map((manual, idx) => (
                <div
                  key={manual.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Manual #{idx + 1}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        v{manual.version || '1.0'}
                      </span>
                    </div>

                    <div>
                      <h3
                        onClick={() => onOpenManual(manual.id)}
                        className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 cursor-pointer line-clamp-2 transition-colors"
                      >
                        {manual.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {manual.subtitle || manual.overview}
                      </p>
                    </div>

                    {/* Step previews */}
                    <div className="pt-2 flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        {manual.steps.slice(0, 4).map((st, sIdx) => (
                          <div
                            key={st.id || sIdx}
                            className="w-8 h-8 rounded-lg border-2 border-white bg-slate-100 overflow-hidden shadow-xs flex-shrink-0"
                          >
                            {st.image ? (
                              <img
                                src={st.image}
                                alt={st.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                {sIdx + 1}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        {manual.steps.length} pasos
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500">
                        ~{manual.estimatedMinutes || 3} min
                      </span>
                    </div>
                  </div>

                  {/* Card footer actions */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onUnlinkManualFromProject(manual.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Quitar este manual del proyecto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenManual(manual.id)}
                      className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Abrir Manual</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add New Manual Card CTA */}
              <button
                onClick={() => onOpenCreateManualForProject(project.id)}
                className="rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 p-6 flex flex-col items-center justify-center text-center transition-all group min-h-[180px]"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                  Añadir otro manual a este proyecto
                </span>
                <span className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Sube capturas de pantalla, graba tu flujo o importa un video
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOCUMENT CHARACTERISTICS SELECTION */}
      {activeTab === 'features' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Características del Documento para {project.clientName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona qué componentes y secciones se incorporarán dentro del documento formal del proyecto y en los manuales generados.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                {activeFeaturesCount} de 13 activas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: 'includeOurLogo' as keyof ProjectDocumentOptions,
                title: 'Nuestro Logo (Organización Emisora) en Documentos',
                desc: `Inserta el logotipo oficial de ${project.organizationName || branding?.companyName || 'nuestra empresa'} en la carátula y el membrete de todas las páginas foliadas.`,
                badge: 'Identidad Emisora',
              },
              {
                key: 'includeClientLogo' as keyof ProjectDocumentOptions,
                title: 'Logo del Cliente en Portada y Encabezados',
                desc: `Inserta el logo oficial de ${project.clientName} en la portada del documento y en el encabezado de todas las páginas foliadas.`,
                badge: 'Identidad Visual',
              },
              {
                key: 'includeCoverPage' as keyof ProjectDocumentOptions,
                title: 'Portada Oficial con Membrete y Control de Cambios',
                desc: 'Genera la carátula institucional con título de la solución, cliente, versión, autor, aprobador y fecha formal.',
                badge: 'Estructura Corporativa',
              },
              {
                key: 'includeExecutiveSummary' as keyof ProjectDocumentOptions,
                title: 'Resumen Ejecutivo y Alcance del Proyecto',
                desc: 'Sección introductoria con objetivos, justificación del sistema, destinatarios y descripción funcional.',
                badge: 'Contenido Ejecutivo',
              },
              {
                key: 'includeDocumentControl' as keyof ProjectDocumentOptions,
                title: 'Tabla de Control de Versiones y Aprobaciones',
                desc: 'Ficha técnica formal con historial de revisiones, autoría y validaciones de calidad.',
                badge: 'Gobierno de TI',
              },
              {
                key: 'includeTableOfContents' as keyof ProjectDocumentOptions,
                title: 'Índice de Contenidos Unificado',
                desc: 'Tabla jerárquica con numeración automática y páginas calculadas dinámicamente.',
                badge: 'Navegación',
              },
              {
                key: 'includeProcessMatrix' as keyof ProjectDocumentOptions,
                title: 'Matriz de Flujos de Proceso y Transacciones',
                desc: 'Cuadro sinóptico de transacciones (SAP, módulos, códigos, roles responsables e inputs requeridos).',
                badge: 'Flujo de Proceso',
              },
              {
                key: 'includePrerequisites' as keyof ProjectDocumentOptions,
                title: 'Requisitos y Accesos Previos',
                desc: 'Listado exhaustivo de permisos, roles, transacciones y condiciones del sistema para ejecutar los manuales.',
                badge: 'Requisitos',
              },
              {
                key: 'includeStepScreenshots' as keyof ProjectDocumentOptions,
                title: 'Capturas de Pantalla con Señalizaciones Visuales',
                desc: 'Imágenes nítidas con recuadros rojos, flechas y círculos que guían con exactitud al usuario.',
                badge: 'Guía Visual',
              },
              {
                key: 'includeActionBadges' as keyof ProjectDocumentOptions,
                title: 'Insignias de Acción Normalizadas (CLIC, INGRESAR, etc.)',
                desc: 'Estandarización de verbos de acción en español para uniformidad de procedimiento.',
                badge: 'Terminología',
              },
              {
                key: 'includeTroubleshooting' as keyof ProjectDocumentOptions,
                title: 'Resolución de Problemas (Troubleshooting)',
                desc: 'Matriz de fallas o mensajes de advertencia habituales con su correspondiente solución de desbloqueo.',
                badge: 'Soporte al Usuario',
              },
              {
                key: 'includeChecklists' as keyof ProjectDocumentOptions,
                title: 'Listas de Verificación de Conformidad (Checklist)',
                desc: 'Puntos de comprobación rápida para validar la correcta ejecución antes del pase a producción.',
                badge: 'Auditoría & Calidad',
              },
              {
                key: 'includeInstructorNotes' as keyof ProjectDocumentOptions,
                title: 'Notas Orales y Citas del Instructor',
                desc: 'Explicaciones verbales y recomendaciones transcriptas durante la captura de las grabaciones.',
                badge: 'Capacitación',
              },
            ].map((feat) => {
              const isChecked = !!project.documentOptions?.[feat.key];
              return (
                <div
                  key={feat.key}
                  onClick={() => handleToggleDocOption(feat.key)}
                  className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-4 ${
                    isChecked
                      ? 'bg-indigo-50/30 border-indigo-300 ring-1 ring-indigo-200'
                      : 'bg-white border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{feat.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {feat.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Document Section Preview Pipeline */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Esquema de Salida del Documento del Proyecto</span>
            </h3>
            <p className="text-xs text-slate-500">
              Así se ordenará el documento final cuando se exporte la solución completa:
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {project.documentOptions?.includeCoverPage && (
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-xs">
                  1. Portada con Logo {project.clientName}
                </span>
              )}
              {project.documentOptions?.includeTableOfContents && (
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-xs">
                  2. Índice General
                </span>
              )}
              {project.documentOptions?.includeExecutiveSummary && (
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-xs">
                  3. Resumen Ejecutivo &amp; Alcance
                </span>
              )}
              {project.documentOptions?.includeProcessMatrix && (
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-xs">
                  4. Matriz de Procesos y Transacciones
                </span>
              )}
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-lg shadow-xs">
                5. Procedimientos Detallados ({manualsInProject.length} manuales)
              </span>
              {project.documentOptions?.includeTroubleshooting && (
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-xs">
                  6. Resolución de Problemas
                </span>
              )}
              {project.documentOptions?.includeChecklists && (
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-xs">
                  7. Lista de Verificación
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROJECT INFO & SCOPE */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Datos del Cliente &amp; Organización
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Nombre de la Empresa / Cliente:</span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">{project.clientName}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Identificador del Proyecto:</span>
                  <div className="font-mono font-semibold text-slate-700 mt-0.5">{project.code || 'N/A'}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Área / Categoría:</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{project.category || 'General'}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Estado del Proyecto:</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{project.status}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Gobierno &amp; Alcance de la Solución
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Consultor / Autor Líder:</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{project.author}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Audiencia Objetivo:</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{project.targetAudience}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Alcance Declarado:</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{project.scope}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Fecha de Creación:</span>
                  <div className="font-semibold text-slate-700 mt-0.5">
                    {new Date(project.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal to link existing manuals */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Vincular manual a {project.clientName}
            </h3>
            <p className="text-xs text-slate-500">
              Selecciona uno de los manuales existentes para incorporarlo a este proyecto:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableManualsToLink.map((man) => (
                <div
                  key={man.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-xs"
                >
                  <div className="flex-1 pr-3">
                    <div className="font-bold text-slate-800 line-clamp-1">{man.title}</div>
                    <div className="text-[11px] text-slate-500">{man.steps.length} pasos</div>
                  </div>
                  <button
                    onClick={() => {
                      onLinkManualToProject(man.id, project.id);
                      setIsLinkModalOpen(false);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
                  >
                    Vincular
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
