import React, { useState } from 'react';
import { UserManual } from '../types/manual';
import {
  X,
  FileDown,
  Globe,
  Printer,
  FileCode,
  FileJson,
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  exportToInteractiveHtml,
  exportToMarkdown,
  exportToJson,
  exportToPdf,
  exportToDocx,
} from '../utils/exportUtils';

interface ExportModalProps {
  manual: UserManual;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  manual,
  isOpen,
  onClose,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string>('');
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [docxStatus, setDocxStatus] = useState<string>('');
  const [docxSuccess, setDocxSuccess] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isBusy = isGeneratingPdf || isGeneratingDocx;

  const handleDownloadPdf = async () => {
    if (isBusy) return;
    setIsGeneratingPdf(true);
    setPdfStatus('Iniciando generador de PDF...');
    setErrorMessage(null);
    setPdfSuccess(false);

    try {
      await exportToPdf(manual, (msg) => {
        setPdfStatus(msg);
      });
      setPdfSuccess(true);
      setPdfStatus('¡PDF generado y descargado con éxito!');
      setTimeout(() => {
        onClose();
        setPdfSuccess(false);
        setIsGeneratingPdf(false);
      }, 1500);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setErrorMessage(
        err.message || 'Ocurrió un error al generar el PDF. Puedes intentar imprimir directamente.'
      );
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (isBusy) return;
    setIsGeneratingDocx(true);
    setDocxStatus('Iniciando generador de Word (.docx)...');
    setErrorMessage(null);
    setDocxSuccess(false);

    try {
      await exportToDocx(manual, (msg) => {
        setDocxStatus(msg);
      });
      setDocxSuccess(true);
      setDocxStatus('¡Documento Word (.docx) generado y descargado con éxito!');
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
            <h3 className="text-lg font-bold text-slate-900">
              Exportar Manual de Usuario
            </h3>
            <p className="text-xs text-slate-500">
              Elige el formato de publicación oficial para tu equipo, clientes o auditoría.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 disabled:opacity-50 transition-colors"
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

        {/* Options Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {/* Option A: Real Native PDF Download */}
          <div
            onClick={handleDownloadPdf}
            className={`group p-4 rounded-xl border transition-all flex items-start gap-4 shadow-xs cursor-pointer ${
              isGeneratingPdf
                ? 'border-rose-400 bg-rose-50/70'
                : pdfSuccess
                ? 'border-emerald-400 bg-emerald-50/70'
                : 'border-slate-200 bg-white hover:bg-rose-50/30 hover:border-rose-400'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              {isGeneratingPdf ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : pdfSuccess ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <FileDown className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">
                  Documento PDF Oficial (.pdf)
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                  Páginas Atómicas
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Descarga directa en PDF de alta fidelidad con regla de bloque atómico: cada instrucción y su captura anotada permanecen siempre unidas en la misma hoja.
              </p>

              {/* Progress feedback */}
              {isGeneratingPdf && (
                <div className="mt-2.5 p-2 bg-white/95 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800 font-medium animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600 flex-shrink-0" />
                  <span>{pdfStatus}</span>
                </div>
              )}

              {pdfSuccess && (
                <div className="mt-2.5 p-2 bg-emerald-100/90 border border-emerald-300 rounded-lg flex items-center gap-2 text-xs text-emerald-800 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{pdfStatus}</span>
                </div>
              )}

              {/* Alternative Print link */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">¿Deseas enviar a impresora física?</span>
                <button
                  type="button"
                  onClick={handleNativePrint}
                  className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold underline flex items-center gap-1"
                >
                  <Printer className="w-3 h-3" />
                  <span>Imprimir con el navegador</span>
                </button>
              </div>
            </div>
          </div>

          {/* Option B: Microsoft Word (.docx) */}
          <div
            onClick={handleDownloadDocx}
            className={`group p-4 rounded-xl border transition-all flex items-start gap-4 shadow-xs cursor-pointer ${
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
                  Documento Microsoft Word (.docx)
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  100% Editable
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Genera un documento Word corporativo nativo editable con portadas ejecutivas, tablas de metadatos, cajas destacadas de resultados y capturas anotadas incrustadas.
              </p>

              {/* Progress feedback */}
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

          {/* Option C: Standalone Interactive HTML */}
          <div
            onClick={() => {
              if (isBusy) return;
              exportToInteractiveHtml(manual);
              onClose();
            }}
            className="group p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-500 cursor-pointer transition-all flex items-start gap-4 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-indigo-950">
                  Página Web Interactiva Autónoma (.html)
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  Interactivo Offline
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Descarga un archivo HTML 100% autónomo con buscador en vivo, modo de simulación interactiva paso a paso y capturas incrustadas sin depender de internet.
              </p>
            </div>
          </div>

          {/* Option D: Markdown */}
          <div
            onClick={() => {
              if (isBusy) return;
              exportToMarkdown(manual);
              onClose();
            }}
            className="group p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-400 cursor-pointer transition-all flex items-start gap-4 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">
                Markdown Estructurado (.md)
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Formato ligero optimizado para importar directamente en Notion, Confluence, Obsidian, GitHub Wiki o intranets corporativas.
              </p>
            </div>
          </div>

          {/* Option E: JSON Data */}
          <div
            onClick={() => {
              if (isBusy) return;
              exportToJson(manual);
              onClose();
            }}
            className="group p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-400 cursor-pointer transition-all flex items-start gap-4 shadow-xs md:col-span-2"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <FileJson className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">
                  Copia de Seguridad de Datos JSON (.json)
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Backup Completo
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Estructura íntegra de datos para respaldar, versionar en Git o sincronizar con otras instancias de la plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
