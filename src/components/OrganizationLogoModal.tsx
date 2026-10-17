import React, { useState } from 'react';
import {
  OrganizationBranding,
  DEFAULT_ORGANIZATION_BRANDING,
  HSBT_LOGO,
  TECHCONSULT_LOGO,
  INNOVA_SYSTEMS_LOGO,
} from '../types/branding';
import { SAINT_GOBAIN_WEBER_LOGO } from '../data/sampleProjects';
import {
  X,
  Upload,
  Building2,
  Check,
  RotateCcw,
  Sparkles,
  FileText,
  Eye,
  Sliders,
  CheckCircle2,
  Info,
  Layers,
  Palette,
} from 'lucide-react';

interface OrganizationLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: OrganizationBranding;
  onSaveBranding: (branding: OrganizationBranding) => void;
  sampleClientLogo?: string;
  sampleClientName?: string;
}

export const OrganizationLogoModal: React.FC<OrganizationLogoModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSaveBranding,
  sampleClientLogo,
  sampleClientName = 'Cliente Modelo SAP',
}) => {
  const [companyName, setCompanyName] = useState(branding.companyName || 'Saint-Gobain Weber');
  const [companySlogan, setCompanySlogan] = useState(
    branding.companySlogan || 'Soluciones Integrales para la Construcción y Procesos Industriales'
  );
  const [logo, setLogo] = useState(branding.logo || SAINT_GOBAIN_WEBER_LOGO);
  const [secondaryName, setSecondaryName] = useState(branding.secondaryName || 'HSBT');
  const [secondarySlogan, setSecondarySlogan] = useState(
    branding.secondarySlogan || 'COMPROMISO & CALIDAD'
  );
  const [secondaryLogo, setSecondaryLogo] = useState(branding.secondaryLogo || HSBT_LOGO);
  const [showOurLogoInCover, setShowOurLogoInCover] = useState(
    branding.showOurLogoInCover !== false
  );
  const [showOurLogoInHeader, setShowOurLogoInHeader] = useState(
    branding.showOurLogoInHeader !== false
  );
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor || '#183B6C');

  const [activeTab, setActiveTab] = useState<'logo' | 'presets' | 'options'>('logo');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('La imagen no debe superar los 5MB.');
        return;
      }
      setUploadError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSecondaryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSecondaryLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updated: OrganizationBranding = {
      companyName: companyName.trim() || 'Nuestra Organización',
      companySlogan: companySlogan.trim(),
      logo: logo || SAINT_GOBAIN_WEBER_LOGO,
      secondaryLogo: secondaryLogo || undefined,
      secondaryName: secondaryName.trim() || undefined,
      secondarySlogan: secondarySlogan.trim() || undefined,
      showOurLogoInCover,
      showOurLogoInHeader,
      primaryColor,
      updatedAt: new Date().toISOString(),
    };

    onSaveBranding(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 700);
  };

  const handleResetDefaults = () => {
    if (confirm('¿Restablecer el logo y datos a la identidad corporativa predeterminada?')) {
      setCompanyName(DEFAULT_ORGANIZATION_BRANDING.companyName);
      setCompanySlogan(DEFAULT_ORGANIZATION_BRANDING.companySlogan || '');
      setLogo(DEFAULT_ORGANIZATION_BRANDING.logo);
      setSecondaryName(DEFAULT_ORGANIZATION_BRANDING.secondaryName || '');
      setSecondarySlogan(DEFAULT_ORGANIZATION_BRANDING.secondarySlogan || '');
      setSecondaryLogo(DEFAULT_ORGANIZATION_BRANDING.secondaryLogo || '');
      setShowOurLogoInCover(true);
      setShowOurLogoInHeader(true);
      setPrimaryColor(DEFAULT_ORGANIZATION_BRANDING.primaryColor || '#183B6C');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                  Definir Nuestro Logo &amp; Identidad Corporativa
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Global
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Configura el logotipo oficial, nombre y sello institucional de nuestra empresa u organización emisora.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              Vista Previa en Membrete Oficial (Encabezado de Documentos)
            </span>
            <span className="text-[10px] text-slate-400">
              Se verá así en PDF, Word (.docx) y vistas interactivas
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-300 p-3 shadow-xs flex items-center justify-between gap-4">
            {/* Nuestro Logo (Izquierda) */}
            <div className="flex items-center gap-3">
              <div className="w-32 h-12 bg-slate-50 rounded-lg border border-slate-200 p-1 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
                {logo ? (
                  <img
                    src={logo}
                    alt={companyName}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Sin Logo</span>
                )}
              </div>
              <div className="hidden sm:block">
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {companyName}
                </span>
                <span className="text-[10px] text-slate-500 block line-clamp-1 max-w-xs">
                  {companySlogan || 'Empresa Emisora Oficial'}
                </span>
              </div>
            </div>

            {/* Separador sutil */}
            <div className="hidden md:flex flex-col items-center justify-center px-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                VS CLIENTE
              </span>
              <div className="w-12 h-px bg-slate-200 my-0.5" />
            </div>

            {/* Logo del Cliente / Partner (Derecha) */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  {secondaryName || 'HSBT'}
                </span>
                <span className="text-[9px] text-slate-500 block">
                  {secondarySlogan || 'COMPROMISO & CALIDAD'}
                </span>
              </div>
              <div className="w-20 h-10 bg-slate-50 rounded-lg border border-slate-200 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                {secondaryLogo ? (
                  <img
                    src={secondaryLogo}
                    alt="Logo secundario"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-[#183B6C] rounded flex items-center justify-center text-white text-[10px] font-bold">
                    {secondaryName || 'HSBT'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-2">
          <button
            onClick={() => setActiveTab('logo')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'logo'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir / Definir Nuestro Logo</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'presets'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Logos Predeterminados</span>
          </button>

          <button
            onClick={() => setActiveTab('options')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'options'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Opciones de Portada y Membrete</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'logo' && (
            <div className="space-y-6">
              {/* Box 1: Subida de Logo Principal */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-44 h-24 bg-white rounded-xl border border-slate-300 shadow-xs flex items-center justify-center p-2.5 overflow-hidden flex-shrink-0 group relative">
                    {logo ? (
                      <img
                        src={logo}
                        alt="Logo Principal"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Building2 className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                        <span className="text-[11px] text-slate-400">Sin logo asignado</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Logotipo Oficial de Nuestra Empresa / Organización
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Formatos recomendados: PNG con fondo transparente o SVG vectorial para máxima nitidez en impresiones y exportaciones de Word y PDF.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start pt-1">
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Imagen desde mi PC</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      {logo && (
                        <button
                          type="button"
                          onClick={() => setLogo('')}
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Quitar Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Datos de Identidad Institucional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    Nombre de Nuestra Empresa / Organización *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Saint-Gobain Weber, Consultoría Digital, etc."
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Aparece como entidad emisora en los metadatos y portadas.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Slogan o Descripción Institucional
                  </label>
                  <input
                    type="text"
                    value={companySlogan}
                    onChange={(e) => setCompanySlogan(e.target.value)}
                    placeholder="Ej. Soluciones Integrales para la Construcción"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Subtítulo institucional que complementa el logotipo.
                  </p>
                </div>
              </div>

              {/* Box 3: Logo Secundario / Partner Tecnológico / Certificación */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Logo Secundario / Partner o Sello de Calidad (Opcional)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      En el template corporativo se sitúa en la esquina superior derecha (por defecto HSBT Compromiso &amp; Calidad).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Nombre / Sigla</label>
                    <input
                      type="text"
                      value={secondaryName}
                      onChange={(e) => setSecondaryName(e.target.value)}
                      placeholder="HSBT / SAP Partner"
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Lema / Slogan</label>
                    <input
                      type="text"
                      value={secondarySlogan}
                      onChange={(e) => setSecondarySlogan(e.target.value)}
                      placeholder="COMPROMISO & CALIDAD"
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer">
                      <Upload className="w-3 h-3 text-slate-500" />
                      <span>Cambiar Imagen</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSecondaryUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-indigo-900">
                <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p>
                  Haz clic en cualquiera de las siguientes opciones para cargar automáticamente el logotipo y los datos institucionales correspondientes. Puedes editarlos en cualquier momento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Preset 1: Saint-Gobain Weber */}
                <div
                  onClick={() => {
                    setLogo(SAINT_GOBAIN_WEBER_LOGO);
                    setCompanyName('Saint-Gobain Weber');
                    setCompanySlogan('Soluciones Integrales para la Construcción y Procesos Industriales');
                    setSecondaryLogo(HSBT_LOGO);
                    setSecondaryName('HSBT');
                    setSecondarySlogan('COMPROMISO & CALIDAD');
                  }}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    companyName.includes('Weber')
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="h-16 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center mb-2.5 overflow-hidden">
                    <img
                      src={SAINT_GOBAIN_WEBER_LOGO}
                      alt="Weber"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Saint-Gobain Weber</span>
                      {companyName.includes('Weber') && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Identidad estándar del template oficial de operaciones y procesos.
                    </p>
                  </div>
                </div>

                {/* Preset 2: HSBT Consulting */}
                <div
                  onClick={() => {
                    setLogo(HSBT_LOGO);
                    setCompanyName('HSBT Consulting Solutions');
                    setCompanySlogan('Compromiso, Calidad & Consultoría en Procesos SAP');
                    setSecondaryName('SAP');
                    setSecondarySlogan('CERTIFIED STANDARD');
                  }}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    companyName.includes('HSBT')
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="h-16 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center mb-2.5 overflow-hidden">
                    <img
                      src={HSBT_LOGO}
                      alt="HSBT"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">HSBT Consulting</span>
                      {companyName.includes('HSBT') && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Firma de consultoría especializada en ingeniería y soporte SAP.
                    </p>
                  </div>
                </div>

                {/* Preset 3: TechConsult Pro */}
                <div
                  onClick={() => {
                    setLogo(TECHCONSULT_LOGO);
                    setCompanyName('TechConsult Global');
                    setCompanySlogan('Process Engineering, Architecture & Cloud ERP');
                    setSecondaryName('ISO 9001');
                    setSecondarySlogan('QUALITY ASSURED');
                  }}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    companyName.includes('TechConsult')
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="h-16 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center mb-2.5 overflow-hidden">
                    <img
                      src={TECHCONSULT_LOGO}
                      alt="TechConsult"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">TechConsult Global</span>
                      {companyName.includes('TechConsult') && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Enfoque moderno de consultoría tecnológica y transformación digital.
                    </p>
                  </div>
                </div>

                {/* Preset 4: Innova Systems */}
                <div
                  onClick={() => {
                    setLogo(INNOVA_SYSTEMS_LOGO);
                    setCompanyName('Innova Enterprise Systems');
                    setCompanySlogan('Enterprise Cloud & Business Process Automation');
                    setSecondaryName('GLOBAL');
                    setSecondarySlogan('EXCELLENCE & GOVERNANCE');
                  }}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    companyName.includes('Innova')
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="h-16 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center mb-2.5 overflow-hidden">
                    <img
                      src={INNOVA_SYSTEMS_LOGO}
                      alt="Innova"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Innova Solutions</span>
                      {companyName.includes('Innova') && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Solución corporativa para automatización y control operacional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'options' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3.5">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Configuración de Visualización en Documentos
                </h5>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showOurLogoInCover}
                    onChange={(e) => setShowOurLogoInCover(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      Incluir Nuestro Logo en la Portada Principal
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Ubica el logotipo de nuestra organización en la cabecera de la primera página del manual y del Dossier Consolidado.
                    </p>
                  </div>
                </label>

                <div className="h-px bg-slate-200" />

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showOurLogoInHeader}
                    onChange={(e) => setShowOurLogoInHeader(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      Incluir Nuestro Logo en el Membrete de Páginas Foliadas
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Muestra una versión compacta del logotipo en la esquina superior de cada página numerada del procedimiento.
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200 text-xs text-blue-900 space-y-2">
                <span className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  ¿Cómo interactúa con el Logo del Cliente?
                </span>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  En cada proyecto puedes definir el <strong>Logo del Cliente</strong> (por ejemplo el cliente para el cual realizas la implementación). Cuando exportes a Word (.docx) o PDF, ambos logotipos coexistirán armónicamente: <strong>Nuestro Logo</strong> como la empresa proveedora / emisora de la documentación, y el <strong>Logo del Cliente</strong> como el destinatario de la solución.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Valores Predeterminados</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all ${
                saveSuccess
                  ? 'bg-emerald-600 scale-105'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Identidad Guardada!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Nuestro Logo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
