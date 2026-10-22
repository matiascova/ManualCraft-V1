import React, { useState } from 'react';
import { Project, ProjectDocumentOptions, DEFAULT_DOCUMENT_OPTIONS, ProjectStatus } from '../types/project';
import {
  X,
  FolderPlus,
  Building2,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Upload,
  Shield,
  Users,
  Settings2,
  Trash2,
  SlidersHorizontal,
  Eye,
  Check,
  CheckSquare,
  Square,
  FileText,
  Calendar,
  Layers,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  SAINT_GOBAIN_WEBER_LOGO,
  ACME_CORP_LOGO,
  GLOBAL_TECH_LOGO,
  WEBER_OFFICIAL_LOGO,
} from '../data/sampleProjects';
import { OrganizationBranding } from '../types/branding';
import { Client } from '../types/client';
import { DictationButton } from './DictationButton';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProject: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  manualsCount?: number;
  existingProject?: Project | null;
  clients?: Client[];
  activeClientId?: string;
  branding?: OrganizationBranding;
  onOpenOurLogoModal?: () => void;
}

const PRESET_LOGOS = [
  { label: 'Weber Oficial', logo: WEBER_OFFICIAL_LOGO, company: 'Saint-Gobain Weber Chile', color: '#005596' },
  { label: 'Saint-Gobain Weber', logo: SAINT_GOBAIN_WEBER_LOGO, company: 'Saint-Gobain Weber S.A.', color: '#0f3a60' },
  { label: 'ACME Corp', logo: ACME_CORP_LOGO, company: 'Grupo Industrial ACME', color: '#4f46e5' },
  { label: 'Nexus Global', logo: GLOBAL_TECH_LOGO, company: 'Nexus Global Systems', color: '#0284c7' },
];

const PRESET_COLORS = [
  '#005596', // Weber Blue
  '#0f3a60', // Saint-Gobain Navy
  '#183B6C', // Steel Blue
  '#4f46e5', // Indigo
  '#059669', // Emerald
  '#dc2626', // Crimson
  '#d97706', // Amber
  '#0284c7', // Sky Blue
  '#334155', // Slate
];

interface SapTemplate {
  name: string;
  tag: string;
  category: string;
  scope: string;
  targetAudience: string;
}

const SAP_TEMPLATES: SapTemplate[] = [
  {
    name: 'S/4HANA MM · Abastecimiento & Stock',
    tag: 'MM',
    category: 'Supply Chain & Compras (MM)',
    scope: 'Procedimientos de solicitud de pedido, órdenes de compra, entrada de mercancías (MIGO) y verificación de facturas (MIRO).',
    targetAudience: 'Compradores, Analistas de Abastecimiento y Key Users de Compras',
  },
  {
    name: 'S/4HANA SD · Ventas & Despachos',
    tag: 'SD',
    category: 'Comercial, Ventas & Logística (SD)',
    scope: 'Flujo completo de pedidos de venta, entregas de salida, picking, packing y contabilización de salida de mercancías.',
    targetAudience: 'Ejecutivos Comerciales, Encargados de Despacho y Facturación',
  },
  {
    name: 'S/4HANA FI/CO · Finanzas & Control',
    tag: 'FI/CO',
    category: 'Finanzas, Tesorería & Costos (FI/CO)',
    scope: 'Contabilizaciones directas, compensaciones de cuentas, libro mayor, centros de costo y conciliación bancaria.',
    targetAudience: 'Contadores, Analistas Financieros y Controllers de Gestión',
  },
  {
    name: 'S/4HANA PM · Mantenimiento de Planta',
    tag: 'PM',
    category: 'Mantenimiento & Gestión de Activos (PM)',
    scope: 'Gestión de avisos de avería, órdenes de mantenimiento preventivo/correctivo y notificación de actividades técnicas.',
    targetAudience: 'Supervisores de Planta, Planificadores y Técnicos de Mantenimiento',
  },
  {
    name: 'S/4HANA PP · Fabricación & Producción',
    tag: 'PP',
    category: 'Producción & Manufactura (PP)',
    scope: 'Planificación MRP, creación de órdenes de fabricación, consumo de materias primas y entrada de producto terminado.',
    targetAudience: 'Jefes de Turno, Operadores de Línea y Planificadores de Producción',
  },
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSaveProject,
  onDeleteProject,
  manualsCount = 0,
  existingProject = null,
  clients = [],
  activeClientId = '',
  branding,
  onOpenOurLogoModal,
}) => {
  const isEditing = !!existingProject;

  const [clientId, setClientId] = useState<string>(
    existingProject?.clientId || activeClientId || clients[0]?.id || 'cli-weber'
  );
  const [name, setName] = useState(existingProject?.name || '');
  const [code, setCode] = useState(existingProject?.code || '');
  const [organizationName, setOrganizationName] = useState(existingProject?.organizationName || '');
  const [organizationLogo, setOrganizationLogo] = useState(existingProject?.organizationLogo || '');
  const [organizationSlogan, setOrganizationSlogan] = useState(existingProject?.organizationSlogan || '');
  const [clientName, setClientName] = useState(existingProject?.clientName || '');
  const [clientLogo, setClientLogo] = useState(existingProject?.clientLogo || SAINT_GOBAIN_WEBER_LOGO);
  const [description, setDescription] = useState(existingProject?.description || '');
  const [status, setStatus] = useState<ProjectStatus>(existingProject?.status || 'En Progreso');
  const [category, setCategory] = useState(existingProject?.category || 'Supply Chain & ERP');
  const [version, setVersion] = useState(existingProject?.version || '1.0');
  const [author, setAuthor] = useState(existingProject?.author || 'Consultoría de Procesos & Soluciones');
  const [targetAudience, setTargetAudience] = useState(
    existingProject?.targetAudience || 'Usuarios finales, Key Users y Administradores'
  );
  const [scope, setScope] = useState(
    existingProject?.scope || 'Manuales operativos y procedimientos estándar para el sistema'
  );
  const [colorTheme, setColorTheme] = useState(existingProject?.colorTheme || '#0f3a60');
  const [docOptions, setDocOptions] = useState<ProjectDocumentOptions>(
    existingProject?.documentOptions || { ...DEFAULT_DOCUMENT_OPTIONS }
  );

  const [leftTab, setLeftTab] = useState<'project' | 'branding'>('project');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [showBlockedInfo, setShowBlockedInfo] = useState(false);

  // Initialize client info if starting clean
  React.useEffect(() => {
    if (!isEditing && clients.length > 0 && !clientName) {
      const currentClient = clients.find((c) => c.id === clientId) || clients[0];
      if (currentClient) {
        setClientName(currentClient.name);
        if (currentClient.logo) setClientLogo(currentClient.logo);
        if (currentClient.brandColor) setColorTheme(currentClient.brandColor);
      }
    }
  }, [clientId, clients, isEditing, clientName]);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: SapTemplate) => {
    setCategory(tpl.category);
    setScope(tpl.scope);
    setTargetAudience(tpl.targetAudience);
    if (!name.trim()) {
      setName(`Implementación ${tpl.name}`);
    }
    if (!code.trim()) {
      const year = new Date().getFullYear();
      setCode(`PRJ-${year}-${tpl.tag}-01`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setClientLogo(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOurLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setOrganizationLogo(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleDocOption = (key: keyof ProjectDocumentOptions) => {
    setDocOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSetAllDocOptions = (val: boolean) => {
    const updated: ProjectDocumentOptions = { ...docOptions };
    (Object.keys(updated) as (keyof ProjectDocumentOptions)[]).forEach((k) => {
      updated[k] = val;
    });
    setDocOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Por favor ingresa un nombre para el proyecto.');
      return;
    }
    if (!clientName.trim()) {
      setValidationError('Por favor ingresa el nombre del cliente.');
      return;
    }
    setValidationError(null);

    const projectToSave: Project = {
      id: existingProject ? existingProject.id : `prj-${Date.now()}`,
      clientId: clientId || 'cli-weber',
      name: name.trim(),
      code: code.trim() || `PRJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
      organizationName: organizationName.trim() || undefined,
      organizationLogo: organizationLogo || undefined,
      organizationSlogan: organizationSlogan.trim() || undefined,
      clientName: clientName.trim(),
      clientLogo,
      description: description.trim(),
      status,
      category: category.trim(),
      version: version.trim() || '1.0',
      author: author.trim(),
      targetAudience: targetAudience.trim(),
      scope: scope.trim(),
      colorTheme,
      documentOptions: docOptions,
      createdAt: existingProject ? existingProject.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveProject(projectToSave);
    onClose();
  };

  const DOCUMENT_FEATURE_LIST: {
    key: keyof ProjectDocumentOptions;
    title: string;
    desc: string;
    badge: string;
  }[] = [
    {
      key: 'includeOurLogo',
      title: 'Nuestro Logo Emisor',
      desc: 'Logotipo en portada y membrete superior.',
      badge: 'Identidad',
    },
    {
      key: 'includeClientLogo',
      title: 'Logo del Cliente',
      desc: 'Imagen corporativa del cliente en carátula.',
      badge: 'Cliente',
    },
    {
      key: 'includeCoverPage',
      title: 'Portada Oficial',
      desc: 'Carátula formal con membrete y estado.',
      badge: 'Estructura',
    },
    {
      key: 'includeExecutiveSummary',
      title: 'Resumen Ejecutivo',
      desc: 'Introducción, objetivo y destinatarios.',
      badge: 'Contenido',
    },
    {
      key: 'includeDocumentControl',
      title: 'Control de Cambios',
      desc: 'Ficha de versiones, autores y fechas.',
      badge: 'Gobierno',
    },
    {
      key: 'includeTableOfContents',
      title: 'Índice de Contenidos',
      desc: 'Tabla jerárquica con paginación.',
      badge: 'Navegación',
    },
    {
      key: 'includeProcessMatrix',
      title: 'Matriz de Transacciones',
      desc: 'Tabla de transacciones SAP y roles.',
      badge: 'SAP / Flujos',
    },
    {
      key: 'includePrerequisites',
      title: 'Requisitos Previos',
      desc: 'Accesos, credenciales y condiciones.',
      badge: 'Operativo',
    },
    {
      key: 'includeStepScreenshots',
      title: 'Capturas con Marcas',
      desc: 'Imágenes con anotaciones y recuadros.',
      badge: 'Visual',
    },
    {
      key: 'includeActionBadges',
      title: 'Insignias de Acción',
      desc: 'Badges CLIC, INGRESAR, GRABAR, ENTER.',
      badge: 'Estándar',
    },
    {
      key: 'includeTroubleshooting',
      title: 'Troubleshooting',
      desc: 'Resolución de errores y dudas frecuentes.',
      badge: 'Soporte',
    },
    {
      key: 'includeChecklists',
      title: 'Checklists de Éxito',
      desc: 'Validación de éxito del procedimiento.',
      badge: 'Auditoría',
    },
    {
      key: 'includeInstructorNotes',
      title: 'Notas del Instructor',
      desc: 'Consejos orales de expertos.',
      badge: 'Onboarding',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      {/* 95%+ Viewport Container */}
      <div className="w-[96vw] max-w-[98vw] h-[94vh] sm:h-[95vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-900 text-white flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-xs flex-shrink-0">
              <FolderPlus className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {isEditing ? `Configurar Proyecto: ${name || 'Sin título'}` : 'Crear y Configurar Proyecto Enterprise'}
                </h2>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" /> S/4HANA Project Studio
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Jerarquía: <strong className="text-white">{clientName || 'Cliente'}</strong> → Proyecto ({code || 'ID'}) → Manuales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Quick Presets Dropdown / Buttons */}
            <div className="hidden xl:flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <span className="text-[11px] font-bold text-slate-300 px-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Plantillas SAP:
              </span>
              {SAP_TEMPLATES.slice(0, 3).map((tpl) => (
                <button
                  key={tpl.tag}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2 py-1 text-[10px] font-bold bg-slate-700/80 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title={tpl.name}
                >
                  {tpl.tag}
                </button>
              ))}
            </div>

            {/* Save Button in Top Bar */}
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Proyecto'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Validation Banner */}
        {validationError && (
          <div className="px-6 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700 font-bold flex items-center justify-between animate-in slide-in-from-top-1">
            <span>{validationError}</span>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="text-red-500 hover:text-red-800 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main 95% Widescreen Split Workstation */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden">
            {/* Left Column (lg:col-span-7 or 8 ~ 62%): Agile Data Entry */}
            <div className="lg:col-span-7 xl:col-span-7 flex flex-col bg-slate-50/40 min-h-0 overflow-y-auto">
              {/* Sub-Header Tabs for Left Column */}
              <div className="px-5 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10 shadow-2xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLeftTab('project')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      leftTab === 'project'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>1. Datos del Proyecto & Jerarquía SAP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeftTab('branding')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      leftTab === 'branding'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>2. Logos, Colores & Co-Branding</span>
                  </button>
                </div>

                {/* Templates Quick Chip for mobile / compact */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {code || 'NUEVO'}
                  </span>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-5 space-y-4">
                {leftTab === 'project' ? (
                  <div className="space-y-4">
                    {/* Cliente Corporativo Propietario (Jerarquía Superior) */}
                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                          <span>Cliente Corporativo Propietario (Nivel Superior)</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                          Jerarquía S/4HANA
                        </span>
                      </div>
                      <select
                        value={clientId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          setClientId(selectedId);
                          const chosen = clients.find((c) => c.id === selectedId);
                          if (chosen) {
                            setClientName(chosen.name);
                            if (chosen.logo) setClientLogo(chosen.logo);
                            if (chosen.brandColor) setColorTheme(chosen.brandColor);
                          }
                        }}
                        className="w-full text-xs font-bold px-3 py-2 border border-indigo-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
                      >
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} · {c.legalName || c.code} {c.sapMandante ? `(${c.sapMandante})` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Al seleccionar el cliente, se vinculan automáticamente su logotipo oficial, colores institucionales y mandante SAP.
                      </p>
                    </div>

                    {/* Nombre del Proyecto */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Nombre del Proyecto <span className="text-red-500">*</span>
                        </label>
                        <DictationButton
                          value={name}
                          onChange={setName}
                          title="Dictar nombre del proyecto por voz"
                          size="xs"
                        />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Implementación SAP S/4HANA Supply Chain & Logística"
                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 shadow-2xs"
                        required
                      />
                    </div>

                    {/* Cliente / Empresa y Código */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Nombre del Cliente / Empresa <span className="text-red-500">*</span>
                          </label>
                          <DictationButton
                            value={clientName}
                            onChange={setClientName}
                            title="Dictar nombre del cliente"
                            size="xs"
                          />
                        </div>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Ej: Saint-Gobain Weber Chile"
                          className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 shadow-2xs"
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Código del Proyecto (ID)
                          </label>
                          <DictationButton
                            value={code}
                            onChange={setCode}
                            title="Dictar código del proyecto"
                            size="xs"
                          />
                        </div>
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value.toUpperCase())}
                          placeholder="Ej: PRJ-2026-WEBER-01"
                          className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase bg-white text-slate-900 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Estado, Categoría y Versión */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Estado del Proyecto
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                          className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 shadow-2xs cursor-pointer"
                        >
                          <option value="Borrador">Borrador</option>
                          <option value="En Progreso">En Progreso</option>
                          <option value="Revisión">En Revisión</option>
                          <option value="Aprobado">Aprobado</option>
                          <option value="Publicado">Publicado / Entregado</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Área / Categoría
                          </label>
                          <DictationButton
                            value={category}
                            onChange={setCategory}
                            title="Dictar área / categoría"
                            size="xs"
                          />
                        </div>
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="Ej: Supply Chain, SAP SD/MM"
                          className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 shadow-2xs"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Versión Solución
                          </label>
                          <DictationButton
                            value={version}
                            onChange={setVersion}
                            title="Dictar versión"
                            size="xs"
                          />
                        </div>
                        <input
                          type="text"
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                          placeholder="1.0"
                          className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Descripción & Propósito */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Descripción &amp; Propósito del Proyecto
                        </label>
                        <DictationButton
                          value={description}
                          onChange={setDescription}
                          title="Dictar descripción del proyecto"
                          size="xs"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe el objetivo integral de la solución, los módulos abarcados y los manuales que formarán parte..."
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none bg-white text-slate-900 shadow-2xs"
                      />
                    </div>

                    {/* Consultor / Autor & Audiencia */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Consultor / Autor Responsable
                          </label>
                          <DictationButton
                            value={author}
                            onChange={setAuthor}
                            title="Dictar autor"
                            size="xs"
                          />
                        </div>
                        <input
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          placeholder="Ej: Equipo de Consultoría y Procesos"
                          className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 shadow-2xs"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Audiencia Objetivo
                          </label>
                          <DictationButton
                            value={targetAudience}
                            onChange={setTargetAudience}
                            title="Dictar audiencia objetivo"
                            size="xs"
                          />
                        </div>
                        <input
                          type="text"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="Ej: Key Users, Operadores Logísticos"
                          className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Alcance Operativo */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Alcance del Documento y Manuales
                        </label>
                        <DictationButton
                          value={scope}
                          onChange={setScope}
                          title="Dictar alcance del documento"
                          size="xs"
                        />
                      </div>
                      <input
                        type="text"
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                        placeholder="Ej: Manuales operativos y procedimientos estándar para el sistema"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900 shadow-2xs"
                      />
                    </div>
                  </div>
                ) : (
                  /* TAB 2: BRANDING & LOGOS */
                  <div className="space-y-5">
                    {/* 1. Logo Oficial del Cliente */}
                    <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                            1
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">
                            Logo Oficial del Cliente (Receptor del Proyecto)
                          </h4>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Portada &amp; Membrete
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="w-32 h-18 bg-white rounded-lg border border-slate-200 p-2 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
                          {clientLogo ? (
                            <img
                              src={clientLogo}
                              alt="Logo cliente"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">Sin logo</span>
                          )}
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-1">
                          <span className="text-xs font-bold text-slate-800 block">
                            {clientName || 'Cliente del Proyecto'}
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Aparecerá en la portada oficial, en el membrete superior de cada paso y en el dossier exportado.
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Subir Logo (PNG/SVG)</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </label>
                            {clientLogo && (
                              <button
                                type="button"
                                onClick={() => setClientLogo('')}
                                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium"
                              >
                                Quitar Logo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Presets Rápidos de Logo Cliente */}
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-700 mb-2">
                          Logos predefinidos de clientes corporativos:
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {PRESET_LOGOS.map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => {
                                setClientLogo(item.logo);
                                if (!clientName) setClientName(item.company);
                                setColorTheme(item.color);
                              }}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                clientLogo === item.logo
                                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/50'
                                  : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="h-9 flex items-center justify-center bg-white rounded border border-slate-100 p-1 mb-1 shadow-2xs">
                                <img src={item.logo} alt={item.label} className="max-h-7 object-contain" />
                              </div>
                              <div className="text-[10px] font-bold text-slate-800 truncate">{item.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Color Corporativo del Proyecto */}
                    <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-900">
                          Color Corporativo Principal del Proyecto
                        </label>
                        <span className="text-[11px] font-mono font-bold text-slate-600">
                          {colorTheme}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Utilizado para los encabezados, barras de títulos, acentos del manual y exportaciones PDF/HTML.
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {PRESET_COLORS.map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setColorTheme(col)}
                            className={`w-8 h-8 rounded-lg border-2 transition-transform cursor-pointer flex items-center justify-center ${
                              colorTheme === col ? 'scale-110 border-slate-900 shadow-xs' : 'border-white hover:scale-105'
                            }`}
                            style={{ backgroundColor: col }}
                          >
                            {colorTheme === col && <Check className="w-4 h-4 text-white" />}
                          </button>
                        ))}
                        <input
                          type="color"
                          value={colorTheme}
                          onChange={(e) => setColorTheme(e.target.value)}
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0 bg-transparent"
                          title="Color personalizado"
                        />
                      </div>
                    </div>

                    {/* 2. Nuestro Logo (Organización Emisora) */}
                    <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                            2
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">
                            Nuestro Logo &amp; Identidad (Organización Emisora)
                          </h4>
                        </div>
                        {onOpenOurLogoModal && (
                          <button
                            type="button"
                            onClick={onOpenOurLogoModal}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-100/70 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                          >
                            <Settings2 className="w-3 h-3" />
                            <span>Definir Nuestro Logo Global</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-lg border border-indigo-100">
                        <div className="w-32 h-18 bg-slate-50 rounded-lg border border-slate-200 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {(organizationLogo || branding?.logo || SAINT_GOBAIN_WEBER_LOGO) ? (
                            <img
                              src={organizationLogo || branding?.logo || SAINT_GOBAIN_WEBER_LOGO}
                              alt="Nuestro Logo"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400">Sin logo</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-1 text-center sm:text-left">
                          <span className="text-xs font-bold text-slate-900 block">
                            {organizationName || branding?.companyName || 'Organización Emisora'}
                          </span>
                          <p className="text-[11px] text-slate-500">
                            {organizationLogo
                              ? 'Personalizado específicamente para este proyecto.'
                              : 'Utilizando la identidad corporativa global predeterminada.'}
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                            <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer border border-slate-200 transition-colors">
                              <Upload className="w-3 h-3 text-slate-500" />
                              <span>Cambiar para este proyecto</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleOurLogoUpload}
                                className="hidden"
                              />
                            </label>
                            {organizationLogo && (
                              <button
                                type="button"
                                onClick={() => setOrganizationLogo('')}
                                className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800"
                              >
                                Usar Global
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (lg:col-span-5 or 4 ~ 38%): Previsualización en Vivo & Opciones del Documento */}
            <div className="lg:col-span-5 xl:col-span-5 flex flex-col bg-white min-h-0 overflow-y-auto">
              <div className="px-5 py-2.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Previsualización en Vivo de Portada
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  A4 Enterprise
                </span>
              </div>

              <div className="p-5 space-y-5">
                {/* Real-time Scaled Document Cover Preview Card */}
                <div className="bg-slate-900/5 p-3 rounded-2xl border border-slate-200">
                  <div
                    className="w-full aspect-[1/1.3] bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden flex flex-col justify-between p-4 relative"
                    style={{ borderTop: `6px solid ${colorTheme}` }}
                  >
                    {/* Header bar of preview */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      {/* Left: Organization Logo */}
                      <div className="h-7 w-20 flex items-center">
                        {docOptions.includeOurLogo && (organizationLogo || branding?.logo || SAINT_GOBAIN_WEBER_LOGO) ? (
                          <img
                            src={organizationLogo || branding?.logo || SAINT_GOBAIN_WEBER_LOGO}
                            alt="Org"
                            className="max-h-6 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[8px] font-bold text-slate-400">ORGANIZACIÓN</span>
                        )}
                      </div>

                      {/* Right: Client Logo */}
                      <div className="h-7 w-20 flex items-center justify-end">
                        {docOptions.includeClientLogo && clientLogo ? (
                          <img src={clientLogo} alt="Client" className="max-h-6 max-w-full object-contain" />
                        ) : (
                          <span className="text-[8px] font-bold text-slate-400">CLIENTE</span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Title, Code, & Subtitle */}
                    <div className="my-auto text-center space-y-2 py-2">
                      <div className="inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold text-white shadow-2xs" style={{ backgroundColor: colorTheme }}>
                        {code || 'PRJ-2026-SAP'}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight line-clamp-2 px-2">
                        {name || 'Nombre del Proyecto S/4HANA'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium px-4 line-clamp-2">
                        {description || 'Manual de Procedimientos y Operaciones Estándar'}
                      </p>
                      <div className="inline-flex items-center gap-1 text-[9px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                        <span>{category || 'Módulo SAP'}</span>
                        <span>·</span>
                        <span>v{version || '1.0'}</span>
                      </div>
                    </div>

                    {/* Bottom Metadata Block */}
                    <div className="pt-3 border-t border-slate-100 text-[9px] text-slate-500 space-y-1 bg-slate-50/80 -mx-4 -mb-4 p-3 rounded-b-xl">
                      <div className="flex justify-between font-semibold">
                        <span>Cliente:</span>
                        <span className="text-slate-800 font-bold">{clientName || 'Cliente'}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Autor / Consultor:</span>
                        <span className="text-slate-800">{author || 'Consultoría'}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Estado:</span>
                        <span className="text-indigo-600 font-bold">{status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Options Suite with Master Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Características del Documento
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Bloques activos en manuales y exportaciones
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSetAllDocOptions(true)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAllDocOptions(false)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        Ninguno
                      </button>
                    </div>
                  </div>

                  {/* Checklist Grid */}
                  <div className="grid grid-cols-1 gap-1.5 max-h-[30vh] overflow-y-auto pr-1">
                    {DOCUMENT_FEATURE_LIST.map((feat) => {
                      const isChecked = !!docOptions[feat.key];
                      return (
                        <label
                          key={feat.key}
                          onClick={() => handleToggleDocOption(feat.key)}
                          className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-indigo-50/50 border-indigo-200 text-slate-900 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-500 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="truncate">
                              <span className="text-xs font-bold block truncate">{feat.title}</span>
                              <span className="text-[10px] text-slate-500 truncate block">{feat.desc}</span>
                            </div>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-600 flex-shrink-0 ml-2">
                            {feat.badge}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            {/* Delete / Left status */}
            <div className="flex items-center gap-3">
              {isEditing && existingProject && onDeleteProject && (
                manualsCount === 0 ? (
                  !isConfirmingDelete ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Eliminar este proyecto permanentemente"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Borrar Proyecto</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
                      <span className="text-xs font-bold text-rose-800">¿Eliminar definitivamente?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteProject(existingProject.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-2xs transition-colors cursor-pointer"
                      >
                        Sí, Borrar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  )
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowBlockedInfo((prev) => !prev)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      title={`No se puede eliminar: el proyecto contiene ${manualsCount} manual(es).`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Borrar Proyecto ({manualsCount})</span>
                    </button>
                    {showBlockedInfo && (
                      <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl z-50 border border-slate-700">
                        <div className="font-bold text-amber-300 mb-1">Proyecto con manuales asociados</div>
                        <p className="text-slate-200 leading-normal">
                          Para eliminar este proyecto, primero debes eliminar sus {manualsCount} manual(es) o vincularlos a otro proyecto.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowBlockedInfo(false)}
                          className="mt-2 text-indigo-400 hover:text-indigo-300 font-bold block text-right cursor-pointer"
                        >
                          Cerrar
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}

              <div className="hidden sm:block text-xs text-slate-600">
                <span className="font-bold text-slate-800">{clientName || 'Cliente'}</span>
                {name ? ` · ${name}` : ''}
              </div>
            </div>

            {/* Right Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isEditing ? 'Guardar Cambios del Proyecto' : 'Crear y Activar Proyecto'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
