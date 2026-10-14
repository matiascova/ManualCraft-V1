import React, { useState } from 'react';
import { Project, ProjectDocumentOptions, DEFAULT_DOCUMENT_OPTIONS, ProjectStatus } from '../types/project';
import {
  X,
  FolderPlus,
  Building2,
  Image as ImageIcon,
  CheckCircle2,
  Layers,
  Sparkles,
  FileText,
  Upload,
  Palette,
  Shield,
  Users,
  Settings2,
} from 'lucide-react';
import {
  SAINT_GOBAIN_WEBER_LOGO,
  ACME_CORP_LOGO,
  GLOBAL_TECH_LOGO,
} from '../data/sampleProjects';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProject: (project: Project) => void;
  existingProject?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSaveProject,
  existingProject = null,
}) => {
  const isEditing = !!existingProject;

  const [name, setName] = useState(existingProject?.name || '');
  const [code, setCode] = useState(existingProject?.code || '');
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

  const [activeTab, setActiveTab] = useState<'general' | 'logo' | 'documentFeatures'>('general');

  if (!isOpen) return null;

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

  const handleToggleDocOption = (key: keyof ProjectDocumentOptions) => {
    setDocOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingresa un nombre para el proyecto.');
      return;
    }
    if (!clientName.trim()) {
      alert('Por favor ingresa el nombre del cliente.');
      return;
    }

    const projectToSave: Project = {
      id: existingProject ? existingProject.id : `prj-${Date.now()}`,
      name: name.trim(),
      code: code.trim() || `PRJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isEditing ? 'Configurar Proyecto' : 'Crear Nuevo Proyecto'}
              </h2>
              <p className="text-xs text-slate-300">
                Agrupa manuales por cliente, define identidad visual y personaliza las características del documento.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Datos del Cliente & Proyecto</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logo')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'logo'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>2. Logo & Branding del Cliente</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documentFeatures')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'documentFeatures'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>3. Características del Documento</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
            {/* TAB 1: GENERAL */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre del Proyecto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Implementación SAP S/4HANA Supply Chain & Logística"
                      className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre del Cliente / Empresa <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ej: Saint-Gobain Weber Chile"
                        className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Código del Proyecto (Identificador)
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Ej: PRJ-2026-WEBER-01"
                      className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Estado del Proyecto
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                      className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="Borrador">Borrador</option>
                      <option value="En Progreso">En Progreso</option>
                      <option value="Revisión">En Revisión</option>
                      <option value="Aprobado">Aprobado</option>
                      <option value="Publicado">Publicado / Entregado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Área / Categoría
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Ej: Supply Chain, SAP SD/MM"
                      className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Versión de la Solución
                    </label>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="Ej: 1.0"
                      className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descripción &amp; Propósito del Proyecto
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe el objetivo integral de la solución y los manuales que formarán parte..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Consultor / Autor Responsable
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Ej: Equipo de Consultoría y Procesos"
                      className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Audiencia Objetivo
                    </label>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="Ej: Key Users, Operadores Logísticos"
                      className="w-full text-xs font-semibold px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LOGO & BRANDING */}
            {activeTab === 'logo' && (
              <div className="space-y-5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-48 h-24 bg-white rounded-lg border border-slate-200 shadow-xs flex items-center justify-center p-2 overflow-hidden flex-shrink-0">
                    {clientLogo ? (
                      <img
                        src={clientLogo}
                        alt="Logo del cliente"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Sin logo asignado</span>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-xs font-bold text-slate-800">Logo Oficial del Cliente</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Este logo se insertará automáticamente en la portada de los manuales, en el membrete superior de las páginas y en el dossier consolidado del proyecto.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Imagen (PNG/SVG/JPG)</span>
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
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium"
                        >
                          Quitar Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">
                    O selecciona un logo predeterminado:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setClientLogo(SAINT_GOBAIN_WEBER_LOGO);
                        if (!clientName) setClientName('Saint-Gobain Weber Chile');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        clientLogo === SAINT_GOBAIN_WEBER_LOGO
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="h-12 flex items-center justify-center bg-white rounded border border-slate-100 p-1 mb-2">
                        <img src={SAINT_GOBAIN_WEBER_LOGO} alt="Saint-Gobain Weber" className="max-h-10 object-contain" />
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate">Saint-Gobain Weber</div>
                      <div className="text-[10px] text-slate-500">Corporativo Oficial</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setClientLogo(ACME_CORP_LOGO);
                        if (!clientName) setClientName('Grupo Industrial ACME');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        clientLogo === ACME_CORP_LOGO
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="h-12 flex items-center justify-center bg-white rounded border border-slate-100 p-1 mb-2">
                        <img src={ACME_CORP_LOGO} alt="ACME Corp" className="max-h-10 object-contain" />
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate">ACME Corp</div>
                      <div className="text-[10px] text-slate-500">Industrial &amp; Logística</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setClientLogo(GLOBAL_TECH_LOGO);
                        if (!clientName) setClientName('Nexus Global Systems');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        clientLogo === GLOBAL_TECH_LOGO
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="h-12 flex items-center justify-center bg-white rounded border border-slate-100 p-1 mb-2">
                        <img src={GLOBAL_TECH_LOGO} alt="Nexus Global" className="max-h-10 object-contain" />
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate">Nexus Global</div>
                      <div className="text-[10px] text-slate-500">Tecnología &amp; Cloud</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Color Corporativo Principal del Proyecto
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={colorTheme}
                      onChange={(e) => setColorTheme(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-1"
                    />
                    <input
                      type="text"
                      value={colorTheme}
                      onChange={(e) => setColorTheme(e.target.value)}
                      className="w-28 text-xs font-mono font-semibold px-3 py-2 border border-slate-300 rounded-lg uppercase"
                    />
                    <span className="text-xs text-slate-500">
                      Utilizado para los encabezados, cintas y bandas del documento
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CARACTERÍSTICAS DEL DOCUMENTO */}
            {activeTab === 'documentFeatures' && (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
                  <span className="font-bold">Personalización de salida del Proyecto:</span> Selecciona los bloques y características que deben incluirse en los documentos y manuales generados para este cliente.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      key: 'includeClientLogo' as keyof ProjectDocumentOptions,
                      title: 'Logo del Cliente en Portada y Encabezados',
                      desc: 'Muestra la imagen corporativa del cliente en cada página y en la carátula.',
                      badge: 'Identidad',
                    },
                    {
                      key: 'includeCoverPage' as keyof ProjectDocumentOptions,
                      title: 'Portada Oficial con Membrete y Control',
                      desc: 'Genera la carátula formal con título, subtítulo, fecha y estado de aprobación.',
                      badge: 'Estructura',
                    },
                    {
                      key: 'includeExecutiveSummary' as keyof ProjectDocumentOptions,
                      title: 'Resumen Ejecutivo y Alcance',
                      desc: 'Incluye la introducción del proyecto, objetivo general y destinatarios.',
                      badge: 'Contenido',
                    },
                    {
                      key: 'includeDocumentControl' as keyof ProjectDocumentOptions,
                      title: 'Control de Cambios y Versión',
                      desc: 'Ficha técnica con tabla de autores, aprobadores, fecha y revisión.',
                      badge: 'Gobierno',
                    },
                    {
                      key: 'includeTableOfContents' as keyof ProjectDocumentOptions,
                      title: 'Índice de Contenidos Unificado',
                      desc: 'Tabla de contenido jerárquica con numeración y páginas calculadas.',
                      badge: 'Navegación',
                    },
                    {
                      key: 'includeProcessMatrix' as keyof ProjectDocumentOptions,
                      title: 'Matriz de Procesos y Transacciones',
                      desc: 'Tabla resumen con código de transacción, descripción y responsables.',
                      badge: 'SAP / Flujos',
                    },
                    {
                      key: 'includePrerequisites' as keyof ProjectDocumentOptions,
                      title: 'Requisitos y Accesos Previos',
                      desc: 'Condiciones de sistema, roles y credenciales indispensables.',
                      badge: 'Operativo',
                    },
                    {
                      key: 'includeStepScreenshots' as keyof ProjectDocumentOptions,
                      title: 'Capturas de Pantalla con Marcas Visuales',
                      desc: 'Imágenes nítidas con círculos y rectángulos señalando la acción.',
                      badge: 'Visual',
                    },
                    {
                      key: 'includeActionBadges' as keyof ProjectDocumentOptions,
                      title: 'Insignias Normalizadas de Acción',
                      desc: 'Etiquetas destacadas tipo CLIC, INGRESAR, GRABAR, ENTER.',
                      badge: 'Estándar',
                    },
                    {
                      key: 'includeTroubleshooting' as keyof ProjectDocumentOptions,
                      title: 'Resolución de Problemas (Troubleshooting)',
                      desc: 'Matriz de errores comunes del sistema y su solución guiada.',
                      badge: 'Soporte',
                    },
                    {
                      key: 'includeChecklists' as keyof ProjectDocumentOptions,
                      title: 'Lista de Verificación de Conformidad',
                      desc: 'Checklist para validación de éxito del procedimiento.',
                      badge: 'Auditoría',
                    },
                    {
                      key: 'includeInstructorNotes' as keyof ProjectDocumentOptions,
                      title: 'Notas y Citas del Instructor',
                      desc: 'Consejos orales capturados durante la grabación del proceso.',
                      badge: 'Onboarding',
                    },
                  ].map((feat) => {
                    const isChecked = !!docOptions[feat.key];
                    return (
                      <label
                        key={feat.key}
                        onClick={() => handleToggleDocOption(feat.key)}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-indigo-50/40 border-indigo-300 shadow-xs'
                            : 'bg-white border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container
                          className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-800">{feat.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold">
                              {feat.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{feat.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{clientName || 'Cliente'}</span>
              {name ? ` · ${name}` : ''}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isEditing ? 'Guardar Cambios' : 'Crear Proyecto'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
