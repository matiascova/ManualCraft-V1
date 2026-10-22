import React, { useState } from 'react';
import { Client, ClientStatus, DEFAULT_CLIENT_BRAND_COLOR } from '../types/client';
import {
  X,
  Building2,
  Upload,
  Palette,
  CheckCircle2,
  Mail,
  User,
  Hash,
  Database,
  Factory,
  Check,
} from 'lucide-react';
import {
  WEBER_OFFICIAL_LOGO,
  SAINT_GOBAIN_WEBER_LOGO,
  ACME_CORP_LOGO,
  GLOBAL_TECH_LOGO,
} from '../data/sampleProjects';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClient: (client: Client) => void;
  existingClient?: Client | null;
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
  '#183B6C', // HSBT Steel Blue
  '#4f46e5', // Indigo
  '#059669', // Emerald
  '#dc2626', // Crimson
  '#d97706', // Amber
  '#475569', // Slate
];

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSaveClient,
  existingClient = null,
}) => {
  const isEditing = !!existingClient;

  const [name, setName] = useState(existingClient?.name || '');
  const [legalName, setLegalName] = useState(existingClient?.legalName || '');
  const [code, setCode] = useState(existingClient?.code || '');
  const [logo, setLogo] = useState(existingClient?.logo || WEBER_OFFICIAL_LOGO);
  const [brandColor, setBrandColor] = useState(existingClient?.brandColor || DEFAULT_CLIENT_BRAND_COLOR);
  const [industry, setIndustry] = useState(existingClient?.industry || 'Construcción, Morteros & Materiales');
  const [sapMandante, setSapMandante] = useState(existingClient?.sapMandante || 'S/4HANA Mandante 100');
  const [contactPerson, setContactPerson] = useState(existingClient?.contactPerson || '');
  const [contactEmail, setContactEmail] = useState(existingClient?.contactEmail || '');
  const [status, setStatus] = useState<ClientStatus>(existingClient?.status || 'Activo');
  const [description, setDescription] = useState(existingClient?.description || '');

  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setLogo(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Por favor ingresa el nombre comercial del cliente.');
      return;
    }
    setValidationError(null);

    const clientToSave: Client = {
      id: existingClient ? existingClient.id : `cli-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      legalName: legalName.trim() || undefined,
      code: (code.trim() || name.slice(0, 5)).toUpperCase(),
      logo: logo || undefined,
      brandColor,
      industry: industry.trim() || undefined,
      sapMandante: sapMandante.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      status,
      description: description.trim() || undefined,
      createdAt: existingClient ? existingClient.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveClient(clientToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[95vw] max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? `Editar Cliente: ${existingClient.name}` : 'Crear Nuevo Cliente Corporativo'}
              </h2>
              <p className="text-xs text-slate-500">
                Nivel superior de la jerarquía (Cliente → Proyectos → Manuales)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {validationError}
            </div>
          )}

          {/* Nombre y Razón Social */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre del Cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Weber"
                required
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Razón Social / Razón Legal
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Ej. Saint-Gobain Weber Chile S.A."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Código, Mandante SAP e Industria */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-400" />
                Código Cliente
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej. WEBER"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl uppercase font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-400" />
                Mandante SAP
              </label>
              <input
                type="text"
                value={sapMandante}
                onChange={(e) => setSapMandante(e.target.value)}
                placeholder="Ej. S/4HANA 100 · ZMMT"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Factory className="w-3 h-3 text-slate-400" />
                Industria / Rubro
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Ej. Construcción & Morteros"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Logo Corporativo */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Logo Corporativo del Cliente
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
              <div className="w-28 h-20 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center flex-shrink-0 shadow-xs">
                {logo ? (
                  <img src={logo} alt="Preview logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Imagen (SVG / PNG)</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo('')}
                      className="text-xs text-red-600 hover:underline font-semibold"
                    >
                      Remover
                    </button>
                  )}
                </div>
                {/* Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-medium">Presets:</span>
                  {PRESET_LOGOS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setLogo(p.logo);
                        setBrandColor(p.color);
                      }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Color Primario de Marca */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              Color Corporativo del Cliente
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setBrandColor(col)}
                  className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center ${
                    brandColor === col ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: col }}
                >
                  {brandColor === col && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
              <div className="flex items-center gap-1 ml-2">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-7 h-7 rounded border-0 cursor-pointer p-0"
                />
                <span className="text-xs font-mono font-semibold text-slate-500">{brandColor}</span>
              </div>
            </div>
          </div>

          {/* Contacto & Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                Persona de Contacto
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Ej. Gerencia TI Weber"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                Email de Contacto
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="soporte.sap@weber.saint-gobain.cl"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estado Operativo
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ClientStatus)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Activo">Activo</option>
                <option value="En Pausa">En Pausa</option>
                <option value="Archivado">Archivado</option>
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descripción / Alcance Operativo en SAP
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles de la empresa, plantas productivas, centros logísticos y módulos SAP implementados..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
            >
              {isEditing ? 'Guardar Cambios del Cliente' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
