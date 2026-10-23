import React, { memo } from 'react';
import {
  ArrowLeft,
  Save,
  Mic,
  Play,
  Download,
  Scissors,
  EyeOff,
  RotateCcw,
  Plus,
  Trash2,
} from 'lucide-react';
import { UserManual } from '../../types/manual';
import { Project } from '../../types/project';
import { OrganizationBranding } from '../../types/branding';

export interface ManualHeaderProps {
  manual: UserManual;
  project?: Project;
  branding?: OrganizationBranding;
  onBackToProject?: () => void;
  onOpenOurLogoModal?: () => void;
  onStartInteractivePlayer: (stepIndex?: number) => void;
  onOpenExportModal: () => void;
  onRegenerateRecording?: (manual: UserManual) => void;
  onAddNewStep: () => void;
  onRequestDelete?: () => void;
  onOpenTranscriptModal?: () => void;
  onBatchCropTaskbar?: () => void;
  onBatchBlurTaskbar?: () => void;
  isBatchOptimizing?: boolean;
}

/**
 * Isolated Header Component for ManualView.
 * Encapsulates project breadcrumbs, dual branding logos, metadata badges,
 * and high-frequency operational action buttons.
 */
export const ManualHeader = memo(function ManualHeader({
  manual,
  project,
  branding,
  onBackToProject,
  onOpenOurLogoModal,
  onStartInteractivePlayer,
  onOpenExportModal,
  onRegenerateRecording,
  onAddNewStep,
  onRequestDelete,
  onOpenTranscriptModal,
  onBatchCropTaskbar,
  onBatchBlurTaskbar,
  isBatchOptimizing = false,
}: ManualHeaderProps) {
  const hasTranscript =
    Boolean(manual.instructorTranscript && manual.instructorTranscript.length > 0) ||
    Boolean(manual.fullTranscriptionText);

  return (
    <>
      {/* Project Context & Breadcrumb Bar */}
      {project && (
        <div className="mb-4 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            {onBackToProject && (
              <button
                onClick={onBackToProject}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Volver a la vista del proyecto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Proyecto</span>
              </button>
            )}
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
              {/* Nuestro Logo */}
              <div
                onClick={onOpenOurLogoModal}
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                title="Definir o cambiar Nuestro Logo"
              >
                {(project.organizationLogo || branding?.logo) && (
                  <div className="w-6 h-6 rounded bg-slate-50 border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={project.organizationLogo || branding?.logo}
                      alt="Nuestro Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <span className="font-bold text-slate-800">
                  {project.organizationName || branding?.companyName || 'Saint-Gobain Weber'}
                </span>
              </div>

              <span className="text-slate-300">/</span>

              {/* Cliente */}
              <div className="flex items-center gap-1.5">
                {project.clientLogo && (
                  <div className="w-6 h-6 rounded bg-slate-50 border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={project.clientLogo}
                      alt={project.clientName}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <span className="font-semibold text-slate-400">Cliente:</span>
                <span className="font-bold text-slate-900">{project.clientName}</span>
                <span className="text-slate-300">/</span>
                <span className="font-semibold text-indigo-700">{project.name}</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Manual del Proyecto
          </span>
        </div>
      )}

      {/* Top Action Header Bar */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 flex-wrap">
            <span>Manual de Usuario</span>
            <span>·</span>
            <span>Versión {manual.version || '1.0'}</span>
            <span>·</span>
            <span>Actualizado {new Date(manual.updatedAt).toLocaleDateString()}</span>
            {manual.isDraft && (
              <>
                <span>·</span>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1">
                  <Save className="w-3 h-3 text-amber-700" /> Borrador en progreso
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {manual.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {hasTranscript && onOpenTranscriptModal && (
            <button
              onClick={onOpenTranscriptModal}
              className="inline-flex items-center gap-2 py-2.5 px-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Mic className="w-4 h-4 text-purple-600" />
              <span>Transcripción de Sesión ({manual.instructorTranscript?.length || 'Audio'})</span>
            </button>
          )}

          <button
            onClick={() => onStartInteractivePlayer(0)}
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Modo Interactivo</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Exportar (PDF / Word)</span>
          </button>

          {/* Botones para Optimizar Capturas en PDF (Quitar o Difuminar Barra) */}
          {onBatchCropTaskbar && onBatchBlurTaskbar && (
            <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={onBatchCropTaskbar}
                disabled={isBatchOptimizing}
                className="inline-flex items-center gap-1.5 py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                title="Recorta automáticamente la barra de tareas (~5% inferior) en todos los pasos del manual para usar menos espacio en el PDF"
              >
                <Scissors className="w-3.5 h-3.5 text-amber-600" />
                <span>{isBatchOptimizing ? 'Procesando...' : 'Quitar barra (Todos)'}</span>
              </button>
              <button
                type="button"
                onClick={onBatchBlurTaskbar}
                disabled={isBatchOptimizing}
                className="inline-flex items-center gap-1.5 py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                title="Aplica un efecto borroso sobre la barra de tareas en todos los pasos para ocultar los iconos de aplicaciones abiertas"
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                <span>Difuminar barra</span>
              </button>
            </div>
          )}

          {onRegenerateRecording && (
            <button
              onClick={() => onRegenerateRecording(manual)}
              className="inline-flex items-center gap-2 py-2.5 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-xs rounded-xl shadow-xs transition-colors hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Volver a grabar pantalla y audio para este manual sin perder los datos llenados por primera vez"
            >
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <span>Regenerar Grabación</span>
            </button>
          )}

          <button
            onClick={onAddNewStep}
            className="inline-flex items-center gap-1.5 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>Añadir Paso</span>
          </button>

          {onRequestDelete && (
            <button
              onClick={onRequestDelete}
              className="inline-flex items-center gap-1.5 py-2.5 px-3 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 text-slate-600 hover:text-red-700 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Eliminar este manual de forma definitiva"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
});
