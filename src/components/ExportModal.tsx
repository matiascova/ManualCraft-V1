import React, { useState, useMemo } from 'react';
import { UserManual } from '../types/manual';
import { Project } from '../types/project';
import { Client } from '../types/client';
import {
  X,
  FileDown,
  Globe,
  Printer,
  FileCode,
  FileCode2,
  FileJson,
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText,
  Award,
  Sparkles,
  Layers,
  Check,
  Building2,
  FolderKanban,
  Settings,
  Package,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import {
  exportToInteractiveHtml,
  exportToMarkdown,
  exportToJson,
  exportToPdf,
  exportToPdfWithTemplateStructure,
  exportProjectDossierPdf,
  exportToDocx,
  exportProjectDossierDocx,
} from '../utils/exportUtils';
import {
  exportClientMasterPortalHtml,
  exportClientAllManualsHtmlZip,
} from '../utils/clientExportUtils';
import { OrganizationBranding } from '../types/branding';

interface ExportModalProps {
  manual: UserManual;
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
  manualsInProject?: UserManual[];
  branding?: OrganizationBranding;
  onOpenOurLogoModal?: () => void;
  client?: Client | null;
  clients?: Client[];
  allProjects?: Project[];
  allManuals?: UserManual[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  manual,
  isOpen,
  onClose,
  project,
  manualsInProject = [],
  branding,
  onOpenOurLogoModal,
  client,
  clients = [],
  allProjects = [],
  allManuals = [],
}) => {
  // State for client export
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    return client?.id || project?.clientId || (clients[0]?.id ?? 'cli-weber');
  });

  const effectiveClient = useMemo(() => {
    if (selectedClientId && selectedClientId !== 'all') {
      const found = clients.find((c) => c.id === selectedClientId);
      if (found) return found;
    }
    return client || clients[0] || null;
  }, [selectedClientId, clients, client]);

  // Projects strictly belonging to the effective client
  const clientProjects = useMemo(() => {
    if (!effectiveClient) return allProjects.length > 0 ? allProjects : (project ? [project] : []);
    const filtered = allProjects.filter((p) => p.clientId === effectiveClient.id);
    if (filtered.length > 0) return filtered;
    return project && project.clientId === effectiveClient.id ? [project] : [];
  }, [allProjects, effectiveClient, project]);

  // Manuals strictly belonging to the effective client
  const clientManuals = useMemo(() => {
    if (!effectiveClient) return allManuals.length > 0 ? allManuals : (manualsInProject.length > 0 ? manualsInProject : [manual]);
    const filtered = allManuals.filter((m) => clientProjects.some((p) => p.id === m.projectId));
    if (filtered.length > 0) return filtered;
    return manualsInProject.length > 0 ? manualsInProject : [manual];
  }, [allManuals, clientProjects, manualsInProject, manual, effectiveClient]);

  // Status states for Client HTML exports
  const [isGeneratingClientHtmlPortal, setIsGeneratingClientHtmlPortal] = useState(false);
  const [clientHtmlPortalStatus, setClientHtmlPortalStatus] = useState<string>('');
  const [clientHtmlPortalSuccess, setClientHtmlPortalSuccess] = useState(false);

  const [isGeneratingClientHtmlZip, setIsGeneratingClientHtmlZip] = useState(false);
  const [clientHtmlZipStatus, setClientHtmlZipStatus] = useState<string>('');
  const [clientHtmlZipSuccess, setClientHtmlZipSuccess] = useState(false);

  // Status states for Project PDF / DOCX
  const [isGeneratingTemplatePdf, setIsGeneratingTemplatePdf] = useState(false);
  const [templatePdfStatus, setTemplatePdfStatus] = useState<string>('');
  const [templatePdfSuccess, setTemplatePdfSuccess] = useState(false);

  const [isGeneratingCompactPdf, setIsGeneratingCompactPdf] = useState(false);
  const [compactPdfStatus, setCompactPdfStatus] = useState<string>('');
  const [compactPdfSuccess, setCompactPdfSuccess] = useState(false);

  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [docxStatus, setDocxStatus] = useState<string>('');
  const [docxSuccess, setDocxSuccess] = useState(false);

  const [isGeneratingDossierPdf, setIsGeneratingDossierPdf] = useState(false);
  const [dossierPdfStatus, setDossierPdfStatus] = useState<string>('');
  const [dossierPdfSuccess, setDossierPdfSuccess] = useState(false);

  const [isGeneratingDossierDocx, setIsGeneratingDossierDocx] = useState(false);
  const [dossierDocxStatus, setDossierDocxStatus] = useState<string>('');
  const [dossierDocxSuccess, setDossierDocxSuccess] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isBusy =
    isGeneratingTemplatePdf ||
    isGeneratingCompactPdf ||
    isGeneratingDocx ||
    isGeneratingDossierPdf ||
    isGeneratingDossierDocx ||
    isGeneratingClientHtmlPortal ||
    isGeneratingClientHtmlZip;

  // 1. Export Client Standalone Master Portal HTML
  const handleDownloadClientHtmlPortal = () => {
    if (isBusy || !effectiveClient) return;
    setIsGeneratingClientHtmlPortal(true);
    setClientHtmlPortalStatus(`Generando Portal Maestro HTML para ${effectiveClient.name}...`);
    setErrorMessage(null);
    setClientHtmlPortalSuccess(false);

    try {
      exportClientMasterPortalHtml(effectiveClient, clientProjects, clientManuals, branding);
      setClientHtmlPortalSuccess(true);
      setClientHtmlPortalStatus(`¡Portal Maestro HTML de ${effectiveClient.name} generado con éxito!`);
      setTimeout(() => {
        setClientHtmlPortalSuccess(false);
        setIsGeneratingClientHtmlPortal(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error generating client HTML portal:', err);
      setErrorMessage(err.message || 'Ocurrió un error al generar el portal HTML del cliente.');
      setIsGeneratingClientHtmlPortal(false);
    }
  };

  // 2. Export Client All Manuals in HTML (ZIP Package)
  const handleDownloadClientHtmlZip = async () => {
    if (isBusy || !effectiveClient) return;
    setIsGeneratingClientHtmlZip(true);
    setClientHtmlZipStatus(`Iniciando compilación de todos los manuales HTML para ${effectiveClient.name}...`);
    setErrorMessage(null);
    setClientHtmlZipSuccess(false);

    try {
      await exportClientAllManualsHtmlZip(
        effectiveClient,
        clientProjects,
        clientManuals,
        branding,
        (msg) => setClientHtmlZipStatus(msg)
      );
      setClientHtmlZipSuccess(true);
      setClientHtmlZipStatus(`¡Paquete ZIP institucional de ${effectiveClient.name} descargado con éxito!`);
      setTimeout(() => {
        setClientHtmlZipSuccess(false);
        setIsGeneratingClientHtmlZip(false);
      }, 2500);
    } catch (err: any) {
      console.error('Error generating client HTML ZIP:', err);
      setErrorMessage(err.message || 'Ocurrió un error al generar el archivo ZIP de manuales HTML.');
      setIsGeneratingClientHtmlZip(false);
    }
  };

  // 3. Export using Official Corporate Template Structure PDF
  const handleDownloadTemplatePdf = async () => {
    if (isBusy) return;
    setIsGeneratingTemplatePdf(true);
    setTemplatePdfStatus('Iniciando generador de plantilla corporativa oficial...');
    setErrorMessage(null);
    setTemplatePdfSuccess(false);

    try {
      await exportToPdfWithTemplateStructure(
        manual,
        (msg) => {
          setTemplatePdfStatus(msg);
        },
        project,
        branding
      );
      setTemplatePdfSuccess(true);
      setTemplatePdfStatus('¡PDF con estructura de plantilla generado y descargado!');
      setTimeout(() => {
        onClose();
        setTemplatePdfSuccess(false);
        setIsGeneratingTemplatePdf(false);
      }, 1500);
    } catch (err: any) {
      console.error('Error generating Template PDF:', err);
      setErrorMessage(
        err.message || 'Ocurrió un error al generar el PDF con estructura oficial.'
      );
      setIsGeneratingTemplatePdf(false);
    }
  };

  // 4. Export Compact Procedural PDF
  const handleDownloadCompactPdf = async () => {
    if (isBusy) return;
    setIsGeneratingCompactPdf(true);
    setCompactPdfStatus('Iniciando generador de PDF compacto...');
    setErrorMessage(null);
    setCompactPdfSuccess(false);

    try {
      await exportToPdf(manual, (msg) => {
        setCompactPdfStatus(msg);
      });
      setCompactPdfSuccess(true);
      setCompactPdfStatus('¡PDF compacto generado y descargado con éxito!');
      setTimeout(() => {
        onClose();
        setCompactPdfSuccess(false);
        setIsGeneratingCompactPdf(false);
      }, 1500);
    } catch (err: any) {
      console.error('Error generating compact PDF:', err);
      setErrorMessage(
        err.message || 'Ocurrió un error al generar el PDF. Puedes intentar imprimir directamente.'
      );
      setIsGeneratingCompactPdf(false);
    }
  };

  // 5. Export Consolidated Project Dossier PDF
  const handleDownloadDossierPdf = async () => {
    if (!project || isBusy) return;
    setIsGeneratingDossierPdf(true);
    setDossierPdfStatus(`Compilando dossier del proyecto "${project.name}"...`);
    setErrorMessage(null);
    setDossierPdfSuccess(false);

    try {
      const listToExport = manualsInProject.length > 0 ? manualsInProject : [manual];
      await exportProjectDossierPdf(
        project,
        listToExport,
        (msg) => {
          setDossierPdfStatus(msg);
        },
        branding
      );
      setDossierPdfSuccess(true);
      setDossierPdfStatus('¡Dossier integral del proyecto generado y descargado!');
      setTimeout(() => {
        onClose();
        setDossierPdfSuccess(false);
        setIsGeneratingDossierPdf(false);
      }, 1500);
    } catch (err: any) {
      console.error('Error generating project dossier PDF:', err);
      setErrorMessage(
        err.message || 'Ocurrió un error al generar el Dossier consolidado del proyecto.'
      );
      setIsGeneratingDossierPdf(false);
    }
  };

  // 6. Export Word DOCX Single Manual
  const handleDownloadDocx = async () => {
    if (isBusy) return;
    setIsGeneratingDocx(true);
    setDocxStatus('Iniciando generador de Word (.docx) con plantilla corporativa...');
    setErrorMessage(null);
    setDocxSuccess(false);

    try {
      await exportToDocx(
        manual,
        (msg) => {
          setDocxStatus(msg);
        },
        project,
        branding
      );
      setDocxSuccess(true);
      setDocxStatus('¡Documento Word (.docx) corporativo generado y descargado con éxito!');
      setTimeout(() => {
        onClose();
        setDocxSuccess(false);
        setIsGeneratingDocx(false);
      }, 1500);
    } catch (err: any) {
      console.error('Error generating Word document:', err);
      setErrorMessage(
        err.message || 'Ocurrió un error al generar el documento Word (.docx).'
      );
      setIsGeneratingDocx(false);
    }
  };

  // 7. Export Project Solution Dossier Word DOCX
  const handleDownloadDossierDocx = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isBusy || !project) return;
    setIsGeneratingDossierDocx(true);
    setDossierDocxStatus(`Iniciando Dossier Word para "${project.name}"...`);
    setErrorMessage(null);
    setDossierDocxSuccess(false);

    try {
      const listToExport = manualsInProject.length > 0 ? manualsInProject : [manual];
      await exportProjectDossierDocx(
        project,
        listToExport,
        (msg) => {
          setDossierDocxStatus(msg);
        },
        branding
      );
      setDossierDocxSuccess(true);
      setDossierDocxStatus('¡Dossier Word (.docx) consolidado generado con éxito!');
      setTimeout(() => {
        onClose();
        setDossierDocxSuccess(false);
        setIsGeneratingDossierDocx(false);
      }, 1500);
    } catch (err: any) {
      console.error('Error generating project dossier Word:', err);
      setErrorMessage(
        err.message || 'Ocurrió un error al generar el Dossier consolidado en Word.'
      );
      setIsGeneratingDossierDocx(false);
    }
  };

  const handleNativePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.warn('window.print was blocked:', err);
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-[98vw] max-w-4xl max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileDown className="w-5 h-5 text-indigo-600" />
              <span>Exportar Manuales &amp; Entregables Oficiales</span>
            </h3>
            <p className="text-xs text-slate-500">
              Elige el formato de publicación oficial para tu equipo, clientes, auditoría o repositorio institucional.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Brand & Logos Identity Header */}
        <div className="mx-6 mt-4 p-3.5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Nuestro Logo */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                🏢 Emisor:
              </span>
              <div className="w-14 h-7 bg-white border border-slate-200 rounded-lg p-0.5 flex items-center justify-center overflow-hidden shadow-2xs">
                {branding?.logo ? (
                  <img
                    src={branding.logo}
                    alt={branding.companyName || 'Nuestro Logo'}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-[9px] text-slate-400">Sin logo</span>
                )}
              </div>
              <span className="font-bold text-slate-800">
                {branding?.companyName || 'HSBT'}
              </span>
            </div>

            {/* Logo Cliente */}
            {effectiveClient && (
              <div className="flex items-center gap-2 sm:pl-3 sm:border-l border-slate-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  👥 Cliente:
                </span>
                <div className="w-14 h-7 bg-white border border-slate-200 rounded-lg p-0.5 flex items-center justify-center overflow-hidden shadow-2xs">
                  {effectiveClient.logo ? (
                    <img
                      src={effectiveClient.logo}
                      alt={effectiveClient.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-[9px] text-slate-400">Sin logo</span>
                  )}
                </div>
                <span className="font-bold text-slate-800">{effectiveClient.name}</span>
                {effectiveClient.code && (
                  <span className="text-[10px] font-mono text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                    {effectiveClient.code}
                  </span>
                )}
              </div>
            )}
          </div>

          {onOpenOurLogoModal && (
            <button
              type="button"
              onClick={onOpenOurLogoModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50/80 text-indigo-700 hover:text-indigo-800 font-bold border border-slate-200 hover:border-indigo-300 rounded-lg text-xs shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
              title="Cambiar o definir el logotipo de nuestra empresa"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span>Configurar Nuestro Logo</span>
            </button>
          )}
        </div>

        {/* Options Grid */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* ============================================================== */}
          {/* NUEVA OPCIÓN PRINCIPAL: EXPORTAR POR CLIENTE TODOS LOS MANUALES EN HTML */}
          {/* ============================================================== */}
          {effectiveClient && (
            <div className="p-5 rounded-2xl border-2 border-indigo-600 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 shadow-md relative">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-200">
                  {isGeneratingClientHtmlZip || isGeneratingClientHtmlPortal ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : clientHtmlZipSuccess || clientHtmlPortalSuccess ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <Globe className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-slate-900">
                        Exportar por Cliente · Todos los Manuales Interactivos en HTML
                      </h4>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        Cliente: {effectiveClient.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200">
                      Entregable de Cliente · 100% Offline
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Compila y exporta la colección completa de manuales operativos interactivos para <strong>{effectiveClient.name}</strong> ({clientManuals.length} manuales integrados en {clientProjects.length} proyectos). Diseñado para visualización interactiva en cualquier navegador web, publicación en SharePoint, intranet institucional o distribución sin conexión.
                  </p>

                  {/* Selector de Cliente si existen varios registrados */}
                  {clients.length > 1 && (
                    <div className="mt-3 flex items-center gap-2 p-2 bg-white/90 border border-indigo-100 rounded-xl text-xs">
                      <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span className="font-bold text-slate-700">Cliente a exportar:</span>
                      <select
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="font-bold text-indigo-900 bg-indigo-50/60 border border-indigo-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.code ? `(${c.code})` : ''}
                          </option>
                        ))}
                      </select>
                      <span className="text-slate-400 font-medium ml-auto hidden sm:inline">
                        {clientProjects.length} proyectos · {clientManuals.length} manuales
                      </span>
                    </div>
                  )}

                  {/* Highlights de la entrega */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-indigo-100 text-[11px] text-slate-700 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      <span>Portal Maestro (index.html)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      <span>{clientManuals.length} Manuales en HTML</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      <span>Matriz &amp; Simulador SAP</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      <span>Listo para SharePoint / Intranet</span>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="mt-3.5 pt-3 border-t border-indigo-100 flex flex-wrap items-center gap-2.5">
                    {/* Botón 1: Descargar Portal Maestro HTML individual */}
                    <button
                      type="button"
                      onClick={handleDownloadClientHtmlPortal}
                      disabled={isBusy || clientManuals.length === 0}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      title="Descarga un único archivo HTML autocontenido con todos los manuales y proyectos del cliente"
                    >
                      {isGeneratingClientHtmlPortal ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileCode2 className="w-4 h-4" />
                      )}
                      <span>Descargar Portal Maestro HTML ({effectiveClient.name})</span>
                    </button>

                    {/* Botón 2: Descargar Paquete ZIP con todos los HTMLs */}
                    <button
                      type="button"
                      onClick={handleDownloadClientHtmlZip}
                      disabled={isBusy || clientManuals.length === 0}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      title="Descarga un archivo ZIP que incluye el portal index.html más cada manual interactivo individual en HTML"
                    >
                      {isGeneratingClientHtmlZip ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Package className="w-4 h-4 text-indigo-300" />
                      )}
                      <span>Descargar Paquete ZIP (Todos los HTMLs)</span>
                    </button>
                  </div>

                  {/* Feedback en vivo: Portal HTML */}
                  {isGeneratingClientHtmlPortal && (
                    <div className="mt-3 p-2.5 bg-white/95 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900 font-semibold animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600 flex-shrink-0" />
                      <span>{clientHtmlPortalStatus}</span>
                    </div>
                  )}

                  {clientHtmlPortalSuccess && (
                    <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{clientHtmlPortalStatus}</span>
                    </div>
                  )}

                  {/* Feedback en vivo: Paquete ZIP */}
                  {isGeneratingClientHtmlZip && (
                    <div className="mt-3 p-2.5 bg-white/95 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900 font-semibold animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600 flex-shrink-0" />
                      <span>{clientHtmlZipStatus}</span>
                    </div>
                  )}

                  {clientHtmlZipSuccess && (
                    <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{clientHtmlZipStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* OPTION: Consolidated Project Dossier PDF / Word */}
          {/* ============================================================== */}
          {project && (
            <div
              className={`group p-5 rounded-2xl border-2 transition-all shadow-sm relative ${
                isGeneratingDossierPdf || isGeneratingDossierDocx
                  ? 'border-amber-500 bg-amber-50/70'
                  : dossierPdfSuccess || dossierDocxSuccess
                  ? 'border-emerald-500 bg-emerald-50/70'
                  : 'border-amber-400/90 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  {isGeneratingDossierPdf || isGeneratingDossierDocx ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : dossierPdfSuccess || dossierDocxSuccess ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <FolderKanban className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">
                        Dossier Consolidado del Proyecto: {project.name}
                      </h4>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        {manualsInProject.length || 1} manuales integrados
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200">
                      Entregable de Proyecto
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Compila todos los manuales de este proyecto en un único documento corporativo con carátula oficial del cliente ({project.clientName || 'Cliente'}), índice consolidado, matriz unificada de procesos y las características de salida seleccionadas.
                  </p>

                  {/* Highlights */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-amber-200/70 text-[11px] text-slate-700 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>Logo {project.clientName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>{manualsInProject.length || 1} Manuales Integrados</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>Matriz de Procesos Unificada</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>Control de Cambios &amp; Foliado</span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-amber-200/80 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadDossierPdf}
                      disabled={isBusy}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isGeneratingDossierPdf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileDown className="w-3.5 h-3.5" />
                      )}
                      <span>Descargar Dossier en PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDownloadDossierDocx(e)}
                      disabled={isBusy}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isGeneratingDossierDocx ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      <span>Descargar Dossier en Word (.docx)</span>
                    </button>
                  </div>

                  {isGeneratingDossierPdf && (
                    <div className="mt-3 p-2.5 bg-white/95 border border-amber-300 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 font-semibold animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600 flex-shrink-0" />
                      <span>{dossierPdfStatus}</span>
                    </div>
                  )}

                  {dossierPdfSuccess && (
                    <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{dossierPdfStatus}</span>
                    </div>
                  )}

                  {isGeneratingDossierDocx && (
                    <div className="mt-3 p-2.5 bg-white/95 border border-blue-300 rounded-xl flex items-center gap-2.5 text-xs text-blue-900 font-semibold animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" />
                      <span>{dossierDocxStatus}</span>
                    </div>
                  )}

                  {dossierDocxSuccess && (
                    <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{dossierDocxStatus}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* FEATURED OPTION: Official Corporate Template Structure PDF */}
          {/* ============================================================== */}
          <div
            onClick={handleDownloadTemplatePdf}
            className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm relative ${
              isGeneratingTemplatePdf
                ? 'border-indigo-500 bg-indigo-50/70'
                : templatePdfSuccess
                ? 'border-emerald-500 bg-emerald-50/70'
                : 'border-slate-300 bg-white hover:border-indigo-600 hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {isGeneratingTemplatePdf ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : templatePdfSuccess ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <Award className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">
                      PDF Oficial con Estructura del Template Corporativo
                    </h4>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      Estructura Oficial
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    Formato Institucional
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Reproduce con precisión milimétrica la estructura del manual modelo entregado: portada con logos institucionales ({effectiveClient?.name || 'Cliente'} + {branding?.companyName || 'HSBT'}), ficha técnica de control documental de 4 columnas, índice formal con guías de puntos tabuladas y páginas exactas, Sección 1 (Introducción y Parámetros), Sección 2 (Matriz completa del Flujo de Proceso), y páginas procedimentales con franja de transacción, capturas enmarcadas y cajas de llamado.
                </p>

                {/* Highlights pill tags */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-indigo-100/70 text-[11px] text-slate-700 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span>Portada + Ficha Técnica</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span>Índice Formal Dinámico</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span>Matriz de Flujo (#/Tx/Mod)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span>Encabezados &amp; Pág. X de Y</span>
                  </div>
                </div>

                {/* Progress feedback */}
                {isGeneratingTemplatePdf && (
                  <div className="mt-3 p-2.5 bg-white/95 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900 font-semibold animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600 flex-shrink-0" />
                    <span>{templatePdfStatus}</span>
                  </div>
                )}

                {templatePdfSuccess && (
                  <div className="mt-3 p-2.5 bg-emerald-100/90 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{templatePdfStatus}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* Secondary Options Grid */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option B: Compact Procedural PDF */}
            <div
              onClick={handleDownloadCompactPdf}
              className={`group p-4 rounded-xl border transition-all flex items-start gap-3.5 shadow-xs cursor-pointer ${
                isGeneratingCompactPdf
                  ? 'border-rose-400 bg-rose-50/70'
                  : compactPdfSuccess
                  ? 'border-emerald-400 bg-emerald-50/70'
                  : 'border-slate-200 bg-white hover:bg-rose-50/30 hover:border-rose-400'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {isGeneratingCompactPdf ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : compactPdfSuccess ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <FileDown className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    PDF Compacto (Páginas Atómicas)
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    Ágil
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Versión directa sin portada extendida. Cada instrucción y su captura anotada se consolidan en una misma hoja sin cortes.
                </p>

                {isGeneratingCompactPdf && (
                  <div className="mt-2.5 p-2 bg-white/95 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800 font-medium animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600 flex-shrink-0" />
                    <span>{compactPdfStatus}</span>
                  </div>
                )}

                {compactPdfSuccess && (
                  <div className="mt-2.5 p-2 bg-emerald-100/90 border border-emerald-300 rounded-lg flex items-center gap-2 text-xs text-emerald-800 font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{compactPdfStatus}</span>
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleNativePrint}
                    className="text-[11px] text-slate-500 hover:text-slate-900 font-medium underline flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Imprimir con el navegador</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Option C: Microsoft Word (.docx) */}
            <div
              onClick={handleDownloadDocx}
              className={`group p-4 rounded-xl border transition-all flex items-start gap-3.5 shadow-xs cursor-pointer ${
                isGeneratingDocx
                  ? 'border-blue-400 bg-blue-50/70'
                  : docxSuccess
                  ? 'border-emerald-400 bg-emerald-50/70'
                  : 'border-slate-200 bg-white hover:bg-blue-50/30 hover:border-blue-500'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {isGeneratingDocx ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : docxSuccess ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Documento Word (.docx) · Estructura Oficial
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    100% Editable
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Genera el manual idéntico al template corporativo: portada institucional con doble logo, banner azul marino (#183B6C), ficha técnica de control de 4 columnas, índice formal, matriz de proceso y pasos con franjas de transacción SAP.
                </p>

                {isGeneratingDocx && (
                  <div className="mt-2.5 p-2 bg-white/95 border border-blue-200 rounded-lg flex items-center gap-2 text-xs text-blue-800 font-medium animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 flex-shrink-0" />
                    <span>{docxStatus}</span>
                  </div>
                )}

                {docxSuccess && (
                  <div className="mt-2.5 p-2 bg-emerald-100/90 border border-emerald-300 rounded-lg flex items-center gap-2 text-xs text-emerald-800 font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{docxStatus}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Option D: Standalone Interactive HTML (Single Manual or All) */}
            <div className="group p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 hover:border-indigo-400 transition-all flex items-start gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-indigo-950">
                    Web Interactiva Autónoma (.html)
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    Offline
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Archivo HTML único con buscador en tiempo real, reproductor paso a paso interactivo y capturas incrustadas para uso sin internet.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isBusy) return;
                      exportToInteractiveHtml(manual);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    Descargar Este Manual (.html)
                  </button>
                  {effectiveClient && (
                    <button
                      type="button"
                      onClick={handleDownloadClientHtmlPortal}
                      disabled={isBusy}
                      className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Exportar Todos de {effectiveClient.name} (.html)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Option E: Markdown & JSON row */}
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => {
                  if (isBusy) return;
                  exportToMarkdown(manual);
                  onClose();
                }}
                className="group p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-400 cursor-pointer transition-all flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-900">Markdown (.md)</h5>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Para Notion, Confluence, Obsidian o repositorios Wiki.
                </p>
              </div>

              <div
                onClick={() => {
                  if (isBusy) return;
                  exportToJson(manual);
                  onClose();
                }}
                className="group p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50/40 hover:border-emerald-400 cursor-pointer transition-all flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-900">Datos (.json)</h5>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Backup íntegro para versionar o importar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
