import React, { useState, useMemo } from 'react';
import { Client, ClientStatus, DEFAULT_CLIENT_BRAND_COLOR } from '../types/client';
import { Project } from '../types/project';
import { UserManual } from '../types/manual';
import {
  X,
  Building2,
  Plus,
  Edit2,
  Trash2,
  FolderKanban,
  BookOpen,
  Check,
  Package,
  FileCode2,
  Loader2,
  Search,
  Upload,
  User,
  Mail,
  SlidersHorizontal,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Hash,
  Database,
  ExternalLink,
} from 'lucide-react';
import {
  WEBER_OFFICIAL_LOGO,
  SAINT_GOBAIN_WEBER_LOGO,
  ACME_CORP_LOGO,
  GLOBAL_TECH_LOGO,
} from '../data/sampleProjects';
import { exportClientAllManualsHtmlZip } from '../utils/clientExportUtils';

interface ClientManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  activeClientId: string;
  onSelectClient: (clientId: string) => void;
  onOpenNewClientModal?: () => void;
  onOpenEditClientModal?: (client: Client) => void;
  onSaveClient?: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  projects: Project[];
  manuals: UserManual[];
  onDownloadMasterIndex: (client: Client) => void;
}

const PRESET_LOGOS = [
  { label: 'Weber Oficial', logo: WEBER_OFFICIAL_LOGO, color: '#005596' },
  { label: 'Saint-Gobain Weber', logo: SAINT_GOBAIN_WEBER_LOGO, color: '#0f3a60' },
  { label: 'ACME Corp', logo: ACME_CORP_LOGO, color: '#4f46e5' },
  { label: 'Nexus Global', logo: GLOBAL_TECH_LOGO, color: '#0ea5e9' },
];

const PRESET_COLORS = [
  '#005596', // Weber Blue
  '#0f3a60', // Saint-Gobain Navy
  '#183B6C', // Steel Blue
  '#4f46e5', // Indigo
  '#059669', // Emerald
  '#dc2626', // Crimson
  '#d97706', // Amber
  '#334155', // Slate
];

const INDUSTRY_PRESETS = [
  'Construcción, Morteros & Materiales',
  'Minería, Metales & Recursos',
  'Manufactura & Procesos Industriales',
  'Retail, Consumo Masivo & Distribución',
  'Energía, Oil & Gas & Utilities',
  'Tecnología & Servicios Globales',
  'Logística, Transporte & Supply Chain',
];

const SAP_MANDANTE_PRESETS = [
  'S/4HANA Mandante 100',
  'S/4HANA PRD 400 · ZMMT',
  'ECC 6.0 PRD 200',
  'QAS Mandante 150',
  'DEV Mandante 050',
];

export const ClientManagementModal: React.FC<ClientManagementModalProps> = ({
  isOpen,
  onClose,
  clients,
  activeClientId,
  onSelectClient,
  onOpenNewClientModal,
  onOpenEditClientModal,
  onSaveClient,
  onDeleteClient,
  projects,
  manuals,
  onDownloadMasterIndex,
}) => {
  const [zippingClientId, setZippingClientId] = useState<string | null>(null);
  const [clientToDeleteConfirmId, setClientToDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAgileForm, setShowAgileForm] = useState(true);

  // Agile Form State
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formName, setFormName] = useState('');
  const [formLegalName, setFormLegalName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formIndustry, setFormIndustry] = useState('Construcción, Morteros & Materiales');
  const [formSapMandante, setFormSapMandante] = useState('S/4HANA Mandante 100');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formBrandColor, setFormBrandColor] = useState(DEFAULT_CLIENT_BRAND_COLOR);
  const [formLogo, setFormLogo] = useState(WEBER_OFFICIAL_LOGO);
  const [formStatus, setFormStatus] = useState<ClientStatus>('Activo');
  const [formDescription, setFormDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Initialize or reset form
  const resetForm = () => {
    setEditingClient(null);
    setFormName('');
    setFormLegalName('');
    setFormCode('');
    setFormIndustry('Construcción, Morteros & Materiales');
    setFormSapMandante('S/4HANA Mandante 100');
    setFormContactPerson('');
    setFormContactEmail('');
    setFormBrandColor(DEFAULT_CLIENT_BRAND_COLOR);
    setFormLogo(WEBER_OFFICIAL_LOGO);
    setFormStatus('Activo');
    setFormDescription('');
    setValidationError(null);
  };

  const handleStartEditClient = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name || '');
    setFormLegalName(client.legalName || '');
    setFormCode(client.code || '');
    setFormIndustry(client.industry || 'Construcción, Morteros & Materiales');
    setFormSapMandante(client.sapMandante || 'S/4HANA Mandante 100');
    setFormContactPerson(client.contactPerson || '');
    setFormContactEmail(client.contactEmail || '');
    setFormBrandColor(client.brandColor || DEFAULT_CLIENT_BRAND_COLOR);
    setFormLogo(client.logo || WEBER_OFFICIAL_LOGO);
    setFormStatus(client.status || 'Activo');
    setFormDescription(client.description || '');
    setValidationError(null);
    setShowAgileForm(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingClient && (!formCode || formCode === formName.slice(0, 5).toUpperCase())) {
      const generated = val.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();
      setFormCode(generated);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setFormLogo(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formName.trim()) {
      setValidationError('Por favor ingresa el nombre comercial del cliente.');
      return;
    }
    setValidationError(null);

    const clientToSave: Client = {
      id: editingClient
        ? editingClient.id
        : `cli-${formName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
      name: formName.trim(),
      legalName: formLegalName.trim() || undefined,
      code: (formCode.trim() || formName.slice(0, 5)).toUpperCase(),
      logo: formLogo || undefined,
      brandColor: formBrandColor,
      industry: formIndustry.trim() || undefined,
      sapMandante: formSapMandante.trim() || undefined,
      contactPerson: formContactPerson.trim() || undefined,
      contactEmail: formContactEmail.trim() || undefined,
      status: formStatus,
      description: formDescription.trim() || undefined,
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (onSaveClient) {
      onSaveClient(clientToSave);
      setSaveSuccessMsg(
        editingClient
          ? `✓ Cliente "${clientToSave.name}" actualizado exitosamente`
          : `⚡ Cliente "${clientToSave.name}" registrado e incorporado a la jerarquía`
      );
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      resetForm();
    } else if (onOpenEditClientModal && editingClient) {
      onOpenEditClientModal(clientToSave);
    } else if (onOpenNewClientModal) {
      onOpenNewClientModal();
    }
  };

  const handleDownloadZip = async (targetClient: Client) => {
    try {
      setZippingClientId(targetClient.id);
      await exportClientAllManualsHtmlZip(targetClient, projects, manuals);
    } catch (err: any) {
      console.error('Error exporting ZIP for client:', err);
    } finally {
      setZippingClientId(null);
    }
  };

  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.legalName && c.legalName.toLowerCase().includes(q)) ||
        c.code.toLowerCase().includes(q) ||
        (c.industry && c.industry.toLowerCase().includes(q)) ||
        (c.sapMandante && c.sapMandante.toLowerCase().includes(q))
    );
  }, [clients, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      {/* 95%+ Viewport Container */}
      <div className="w-[96vw] max-w-[98vw] h-[94vh] sm:h-[95vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50/80 flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Building2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Gestión y Registro Ágil de Clientes Corporativos
                </h2>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  <ShieldCheck className="w-3.5 h-3.5" /> Nivel Superior
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Jerarquía Enterprise S/4HANA: <strong className="text-slate-700">Cliente</strong> → Proyectos SAP → Manuales de Usuario
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Quick Metrics */}
            <div className="hidden lg:flex items-center gap-3 text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="font-semibold text-slate-700">
                <strong className="text-indigo-600">{clients.length}</strong> Clientes
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-slate-700">
                <strong className="text-indigo-600">{projects.length}</strong> Proyectos
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-slate-700">
                <strong className="text-emerald-600">{manuals.length}</strong> Manuales
              </span>
            </div>

            {/* Toggle form button */}
            <button
              type="button"
              onClick={() => setShowAgileForm(!showAgileForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAgileForm ? 'Ocultar Formulario' : 'Mostrar Formulario Ágil'}</span>
            </button>

            {/* Quick New Client button */}
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAgileForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Cliente</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/80 transition-colors cursor-pointer ml-1"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {saveSuccessMsg && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-bold animate-in slide-in-from-top-1">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {saveSuccessMsg}
            </span>
            <button
              type="button"
              onClick={() => setSaveSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Workstation Body: Split 95%+ Layout */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left Column: Formulario de Ingreso Ágil (Takes ~38-40% on desktop) */}
          {showAgileForm && (
            <div className="w-full md:w-[420px] lg:w-[480px] xl:w-[520px] flex-shrink-0 flex flex-col bg-slate-50/50 min-h-0 overflow-y-auto">
              <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: formBrandColor }}
                  />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {editingClient ? `Editando: ${editingClient.name}` : '⚡ Ingreso Ágil de Cliente'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {editingClient && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                      title="Cancelar edición y limpiar para nuevo cliente"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Nuevo</span>
                    </button>
                  )}
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {formCode || 'AUTO'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveForm} className="p-5 space-y-4">
                {validationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold animate-in shake">
                    {validationError}
                  </div>
                )}

                {/* Nombre Comercial y Código SAP */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nombre Comercial <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="ej. Weber, CMPC, Codelco..."
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Código ID
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                      placeholder="WEBER"
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 transition-all"
                    />
                  </div>
                </div>

                {/* Razón Social */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Razón Social Legal (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formLegalName}
                    onChange={(e) => setFormLegalName(e.target.value)}
                    placeholder="ej. Saint-Gobain Weber Chile S.A."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Rubro / Industria y SAP Mandante */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Rubro / Industria
                    </label>
                    <input
                      type="text"
                      list="industries-list"
                      value={formIndustry}
                      onChange={(e) => setFormIndustry(e.target.value)}
                      placeholder="Construcción & Materiales"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 transition-all"
                    />
                    <datalist id="industries-list">
                      {INDUSTRY_PRESETS.map((ind) => (
                        <option key={ind} value={ind} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mandante / Instancia SAP
                    </label>
                    <input
                      type="text"
                      list="sap-mandantes-list"
                      value={formSapMandante}
                      onChange={(e) => setFormSapMandante(e.target.value)}
                      placeholder="S/4HANA Mandante 100"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 transition-all"
                    />
                    <datalist id="sap-mandantes-list">
                      {SAP_MANDANTE_PRESETS.map((sap) => (
                        <option key={sap} value={sap} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Contacto & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Responsable / Contacto
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={formContactPerson}
                        onChange={(e) => setFormContactPerson(e.target.value)}
                        placeholder="Nombre del Administrador"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Corporativo
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="email"
                        value={formContactEmail}
                        onChange={(e) => setFormContactEmail(e.target.value)}
                        placeholder="contacto@empresa.com"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Corporativo */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Color Primario de Marca
                    </label>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {formBrandColor}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setFormBrandColor(col)}
                        className={`w-7 h-7 rounded-lg border-2 transition-transform cursor-pointer flex items-center justify-center ${
                          formBrandColor === col
                            ? 'scale-110 border-slate-900 shadow-xs'
                            : 'border-white hover:scale-105'
                        }`}
                        style={{ backgroundColor: col }}
                      >
                        {formBrandColor === col && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={formBrandColor}
                      onChange={(e) => setFormBrandColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0 bg-transparent"
                      title="Seleccionar color personalizado"
                    />
                  </div>
                </div>

                {/* Logotipo: Presets y Carga */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Logotipo Corporativo
                  </label>
                  <div className="flex items-center gap-3">
                    {/* Preview Box */}
                    <div className="w-20 h-14 rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      {formLogo ? (
                        <img
                          src={formLogo}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-300" />
                      )}
                    </div>

                    {/* Presets Rápidos */}
                    <div className="flex-1 grid grid-cols-2 gap-1.5">
                      {PRESET_LOGOS.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setFormLogo(item.logo);
                            setFormBrandColor(item.color);
                          }}
                          className={`px-2 py-1 text-[10px] font-bold rounded-md border text-left truncate transition-colors cursor-pointer ${
                            formLogo === item.logo
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload File Input */}
                  <div className="mt-2 flex items-center gap-2">
                    <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Subir Logo (SVG / PNG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{editingClient ? '💾 Guardar Cambios' : '⚡ Registrar Cliente al Instante'}</span>
                  </button>
                  {editingClient && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Right Column: Biblioteca de Clientes Widescreen (Takes ~60% on desktop) */}
          <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden">
            {/* Top Toolbar in Directory */}
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar por nombre, código SAP, mandante o industria..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 transition-all placeholder:text-slate-400 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>Mostrando <strong className="text-slate-800">{filteredClients.length}</strong> de {clients.length} clientes</span>
              </div>
            </div>

            {/* Scrollable Clients Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
              {/* Card: Vista Global (Todos los Clientes) */}
              <div
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  activeClientId === 'all'
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-11 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-extrabold text-lg flex-shrink-0 shadow-2xs">
                    🌐
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Todos los Clientes (Vista Global Corporativa)
                      </h3>
                      {activeClientId === 'all' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Activo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Visualiza todos los proyectos y manuales de la organización sin restricción de cliente.
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 font-semibold mt-1.5">
                      <span className="flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
                        {projects.length} Proyectos Totales
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        {manuals.length} Manuales Totales
                      </span>
                    </div>
                  </div>
                </div>

                <div className="self-end sm:self-center flex-shrink-0">
                  {activeClientId !== 'all' ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectClient('all');
                        onClose();
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Activar Vista Global
                    </button>
                  ) : (
                    <div className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-100 rounded-lg border border-indigo-200">
                      Vista Seleccionada
                    </div>
                  )}
                </div>
              </div>

              {/* Client Cards: Widescreen Grid (2 Columns on large displays) */}
              {filteredClients.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700">No se encontraron clientes</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? 'Ningún cliente coincide con los criterios de búsqueda. Intenta con otro término.'
                      : 'Utiliza el formulario de la izquierda para registrar tu primer cliente corporativo.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                  {filteredClients.map((client) => {
                    const clientProjects = projects.filter((p) => p.clientId === client.id);
                    const clientManuals = manuals.filter((m) =>
                      clientProjects.some((p) => p.id === m.projectId)
                    );
                    const isSelected = client.id === activeClientId;
                    const isCurrentlyEditing = editingClient?.id === client.id;

                    return (
                      <div
                        key={client.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/30 shadow-xs ring-1 ring-indigo-500/20'
                            : isCurrentlyEditing
                            ? 'border-amber-400 bg-amber-50/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-2xs'
                        }`}
                      >
                        {/* Top: Logo, Info & Badges */}
                        <div className="flex items-start gap-3.5">
                          {/* Logo container */}
                          <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 p-1.5 flex items-center justify-center flex-shrink-0 shadow-2xs">
                            {client.logo ? (
                              <img
                                src={client.logo}
                                alt={client.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <Building2 className="w-6 h-6 text-slate-400" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-black text-slate-900 truncate">
                                {client.name}
                              </h3>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {client.code}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Activo
                                </span>
                              )}
                              {isCurrentlyEditing && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                  Editando
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {client.legalName || client.industry || client.description || 'Cliente Corporativo'}
                            </p>

                            {/* Tags */}
                            <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600 font-semibold mt-2">
                              <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                                <FolderKanban className="w-3 h-3 text-indigo-600" />
                                {clientProjects.length} Proyecto(s)
                              </span>
                              <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                                <BookOpen className="w-3 h-3 text-emerald-600" />
                                {clientManuals.length} Manual(es)
                              </span>
                              {client.sapMandante && (
                                <span className="text-slate-600 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                                  {client.sapMandante}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions Suite */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Portal HTML */}
                            <button
                              type="button"
                              onClick={() => onDownloadMasterIndex(client)}
                              className="px-2.5 py-1 text-xs font-bold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              title={`Descargar Portal Maestro HTML de ${client.name}`}
                            >
                              <FileCode2 className="w-3.5 h-3.5" />
                              <span>Portal HTML</span>
                            </button>

                            {/* ZIP HTMLs */}
                            <button
                              type="button"
                              onClick={() => handleDownloadZip(client)}
                              disabled={zippingClientId === client.id || clientManuals.length === 0}
                              className="px-2.5 py-1 text-xs font-bold text-purple-700 hover:text-white bg-purple-50 hover:bg-purple-600 border border-purple-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                              title={`Descargar archivo ZIP con todos los manuales de ${client.name}`}
                            >
                              {zippingClientId === client.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Package className="w-3.5 h-3.5" />
                              )}
                              <span>ZIP</span>
                            </button>

                            {/* Editar Ágil */}
                            <button
                              type="button"
                              onClick={() => handleStartEditClient(client)}
                              className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Editar en formulario ágil"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>

                            {/* Eliminar (si no es el único) */}
                            {clients.length > 1 && (
                              clientToDeleteConfirmId === client.id ? (
                                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                                  <span className="text-[10px] font-bold text-rose-800">¿Eliminar?</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteClient(client.id);
                                      setClientToDeleteConfirmId(null);
                                      if (editingClient?.id === client.id) {
                                        resetForm();
                                      }
                                    }}
                                    className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors cursor-pointer"
                                  >
                                    Sí
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setClientToDeleteConfirmId(null)}
                                    className="px-1 py-0.5 text-[10px] text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setClientToDeleteConfirmId(client.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar cliente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>

                          {/* Seleccionar como Activo */}
                          {!isSelected ? (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectClient(client.id);
                                onClose();
                              }}
                              className="px-3.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                            >
                              <span>Seleccionar</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <div className="px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 rounded-md border border-indigo-200 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Seleccionado
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Jerarquía Enterprise:</span>
            <span className="hidden sm:inline">Seleccionar un cliente filtra automáticamente todos los proyectos y manuales correspondientes.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
