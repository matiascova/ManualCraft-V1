import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  UserManual,
  ManualStep,
  getActionTypeSpanish,
  transformAnnotationsForCrop,
  CropArea,
  VisualAnnotation,
} from '../types/manual';
import {
  Sparkles,
  Play,
  Share2,
  Download,
  Plus,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  Target,
  Users,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  Search,
  ExternalLink,
  Crosshair,
  Printer,
  ChevronDown,
  ChevronUp,
  Mic,
  MessageSquareQuote,
  Copy,
  Check,
  X,
  RotateCcw,
  ArrowLeft,
  Building2,
  FolderKanban,
  Settings,
  Save,
  Crop,
  Scissors,
  EyeOff,
} from 'lucide-react';
import { Project } from '../types/project';
import { OrganizationBranding } from '../types/branding';
import { getEffectiveInstructorContent } from '../utils/instructorUtils';
import { DictationButton } from './DictationButton';
import { ImageCropModal } from './ImageCropModal';
import { cropTaskbarFromDataUrl, blurTaskbarOnDataUrl } from '../utils/motionDetector';

interface ManualViewProps {
  manual: UserManual;
  project?: Project;
  onBackToProject?: () => void;
  onUpdateManual: (manual: UserManual) => void;
  onStartInteractivePlayer: (stepIndex?: number) => void;
  onOpenExportModal: () => void;
  onEditStep: (step: ManualStep) => void;
  onAnnotateStep: (step: ManualStep) => void;
  onAddNewStep: () => void;
  onRegenerateRecording?: (manual: UserManual) => void;
  onDeleteManual?: (manualId: string) => void;
  branding?: OrganizationBranding;
  onOpenOurLogoModal?: () => void;
}

const ManualViewComponent: React.FC<ManualViewProps> = ({
  manual,
  project,
  onBackToProject,
  onUpdateManual,
  onDeleteManual,
  onStartInteractivePlayer,
  onOpenExportModal,
  onEditStep,
  onAnnotateStep,
  onAddNewStep,
  onRegenerateRecording,
  branding,
  onOpenOurLogoModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStepAnchor, setActiveStepAnchor] = useState<string | null>(null);
  const [checkedChecklist, setCheckedChecklist] = useState<Record<number, boolean>>({});
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [editingInstructorStepId, setEditingInstructorStepId] = useState<string | null>(null);
  const [editingInstructorText, setEditingInstructorText] = useState('');
  const [editingTranscriptIdx, setEditingTranscriptIdx] = useState<number | null>(null);
  const [editingTranscriptText, setEditingTranscriptText] = useState('');
  const [cropStep, setCropStep] = useState<ManualStep | null>(null);

  const handleApplyStepCrop = (
    croppedDataUrl: string,
    cropArea?: CropArea,
    updatedAnnotations?: VisualAnnotation[]
  ) => {
    if (!cropStep) return;
    const finalAnnotations =
      updatedAnnotations ||
      (cropArea
        ? transformAnnotationsForCrop(cropStep.annotations || [], cropArea)
        : cropStep.annotations || []);

    const updatedSteps = manual.steps.map((s) =>
      s.id === cropStep.id
        ? { ...s, image: croppedDataUrl, annotations: finalAnnotations }
        : s
    );
    onUpdateManual({
      ...manual,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
    });
    setCropStep(null);
  };

  const [isBatchOptimizing, setIsBatchOptimizing] = useState(false);

  const handleApplyStepCropDirect = (
    stepId: string,
    newImageDataUrl: string,
    cropArea?: CropArea
  ) => {
    const updatedSteps = manual.steps.map((s) => {
      if (s.id === stepId) {
        const transformedAnnotations = cropArea
          ? transformAnnotationsForCrop(s.annotations || [], cropArea)
          : s.annotations;
        return { ...s, image: newImageDataUrl, annotations: transformedAnnotations };
      }
      return s;
    });
    onUpdateManual({
      ...manual,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
    });
  };

  // Optimizar todas las capturas del manual para ahorrar espacio en PDF eliminando la barra de tareas
  // Concurrencia controlada (bloques de 2) y pausas de micro-tarea para permitir recolección de basura (GC)
  const handleBatchCropTaskbarInManual = async () => {
    if (isBatchOptimizing) return;
    setIsBatchOptimizing(true);
    const taskbarCropArea: CropArea = { x: 0, y: 0, width: 100, height: 94.8 };
    try {
      const updatedSteps = [...manual.steps];
      const chunkSize = 2;
      for (let i = 0; i < updatedSteps.length; i += chunkSize) {
        const slice = updatedSteps.slice(i, i + chunkSize);
        await Promise.all(
          slice.map(async (s, sliceIdx) => {
            if (!s.image) return;
            const cropped = await cropTaskbarFromDataUrl(s.image, 0.052);
            const transformedAnnotations = transformAnnotationsForCrop(
              s.annotations || [],
              taskbarCropArea
            );
            updatedSteps[i + sliceIdx] = {
              ...s,
              image: cropped,
              annotations: transformedAnnotations,
            };
          })
        );
        // Ceder el hilo principal para que el recolector de basura libere los búferes de imagen intermedios
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
      onUpdateManual({
        ...manual,
        steps: updatedSteps,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error batch cropping taskbar:', e);
    } finally {
      setIsBatchOptimizing(false);
    }
  };

  // Dejar borrosa la barra de tareas en todas las capturas del manual para ocultar iconos de aplicaciones
  // Concurrencia controlada para evitar picos de memoria RAM en manuales extensos
  const handleBatchBlurTaskbarInManual = async () => {
    if (isBatchOptimizing) return;
    setIsBatchOptimizing(true);
    try {
      const updatedSteps = [...manual.steps];
      const chunkSize = 2;
      for (let i = 0; i < updatedSteps.length; i += chunkSize) {
        const slice = updatedSteps.slice(i, i + chunkSize);
        await Promise.all(
          slice.map(async (s, sliceIdx) => {
            if (!s.image) return;
            const blurred = await blurTaskbarOnDataUrl(s.image, 0.052);
            updatedSteps[i + sliceIdx] = { ...s, image: blurred };
          })
        );
        // Ceder el hilo principal para evitar saturación de memoria en GPU/VRAM
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
      onUpdateManual({
        ...manual,
        steps: updatedSteps,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error batch blurring taskbar:', e);
    } finally {
      setIsBatchOptimizing(false);
    }
  };

  const filteredSteps = useMemo(() => {
    if (!searchQuery.trim()) return manual.steps;
    const q = searchQuery.toLowerCase();
    return manual.steps.filter((s) => {
      return (
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.targetElement && s.targetElement.toLowerCase().includes(q))
      );
    });
  }, [manual.steps, searchQuery]);

  const moveStep = useCallback((index: number, direction: 'up' | 'down') => {
    const newSteps = [...manual.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;

    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;

    // Renumber
    newSteps.forEach((s, idx) => {
      s.stepNumber = idx + 1;
    });

    onUpdateManual({
      ...manual,
      steps: newSteps,
      updatedAt: new Date().toISOString(),
    });
  }, [manual, onUpdateManual]);

  const deleteStep = useCallback((stepId: string) => {
    if (manual.steps.length <= 1) {
      return;
    }
    const newSteps = manual.steps.filter((s) => s.id !== stepId);
    newSteps.forEach((s, idx) => {
      s.stepNumber = idx + 1;
    });
    onUpdateManual({
      ...manual,
      steps: newSteps,
      updatedAt: new Date().toISOString(),
    });
  }, [manual, onUpdateManual]);

  const toggleChecklistItem = useCallback((idx: number) => {
    setCheckedChecklist((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }, []);

  const handleCopyTranscript = () => {
    const textToCopy =
      manual.fullTranscriptionText ||
      manual.instructorTranscript?.map((t) => `[${t.timestamp}s] ${t.text}`).join('\n') ||
      '';
    navigator.clipboard.writeText(textToCopy);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const handleStartEditInstructor = (step: ManualStep) => {
    setEditingInstructorStepId(step.id);
    setEditingInstructorText(step.instructorAudioQuote || step.instructorNotes || '');
  };

  const handleSaveInstructor = (stepId: string) => {
    const trimmed = editingInstructorText.trim();
    const updatedSteps = manual.steps.map((s) => {
      if (s.id === stepId) {
        return {
          ...s,
          instructorAudioQuote: trimmed,
          instructorNotes: trimmed,
        };
      }
      return s;
    });

    onUpdateManual({
      ...manual,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
    });

    setEditingInstructorStepId(null);
    setEditingInstructorText('');
  };

  const handleCancelEditInstructor = () => {
    setEditingInstructorStepId(null);
    setEditingInstructorText('');
  };

  const handleStartEditTranscriptItem = (idx: number, currentText: string) => {
    setEditingTranscriptIdx(idx);
    setEditingTranscriptText(currentText);
  };

  const handleSaveEditTranscriptItem = (idx: number) => {
    if (!manual.instructorTranscript) return;
    const updated = [...manual.instructorTranscript];
    if (updated[idx]) {
      updated[idx] = {
        ...updated[idx],
        text: editingTranscriptText.trim(),
      };
      onUpdateManual({
        ...manual,
        instructorTranscript: updated,
        updatedAt: new Date().toISOString(),
      });
    }
    setEditingTranscriptIdx(null);
    setEditingTranscriptText('');
  };

  const handleAddTranscriptItem = () => {
    const text = prompt('Escribe la nueva indicación o explicación verbal del instructor:');
    if (!text || !text.trim()) return;
    const currentList = manual.instructorTranscript ? [...manual.instructorTranscript] : [];
    const lastTime = currentList.length > 0 ? currentList[currentList.length - 1].timestamp + 10 : 0;
    currentList.push({
      id: `tr-${Date.now()}`,
      text: text.trim(),
      timestamp: lastTime,
    });
    onUpdateManual({
      ...manual,
      instructorTranscript: currentList,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTranscriptItem = (idx: number) => {
    if (!manual.instructorTranscript) return;
    const updated = manual.instructorTranscript.filter((_, i) => i !== idx);
    onUpdateManual({
      ...manual,
      instructorTranscript: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="w-[98%] max-w-[98vw] mx-auto px-2 sm:px-4 py-6">
      {/* Project Context & Breadcrumb Bar */}
      {project && (
        <div className="mb-4 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            {onBackToProject && (
              <button
                onClick={onBackToProject}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
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
          {((manual.instructorTranscript && manual.instructorTranscript.length > 0) || manual.fullTranscriptionText) && (
            <button
              onClick={() => setShowTranscriptModal(true)}
              className="inline-flex items-center gap-2 py-2.5 px-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Mic className="w-4 h-4 text-purple-600" />
              <span>Transcripción de Sesión ({manual.instructorTranscript?.length || 'Audio'})</span>
            </button>
          )}

          <button
            onClick={() => onStartInteractivePlayer(0)}
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Modo Interactivo</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Exportar (PDF / Word)</span>
          </button>

          {/* Botones para Optimizar Capturas en PDF (Quitar o Difuminar Barra) */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={handleBatchCropTaskbarInManual}
              disabled={isBatchOptimizing}
              className="inline-flex items-center gap-1.5 py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              title="Recorta automáticamente la barra de tareas (~5% inferior) en todos los pasos del manual para usar menos espacio en el PDF"
            >
              <Scissors className="w-3.5 h-3.5 text-amber-600" />
              <span>{isBatchOptimizing ? 'Procesando...' : 'Quitar barra (Todos)'}</span>
            </button>
            <button
              type="button"
              onClick={handleBatchBlurTaskbarInManual}
              disabled={isBatchOptimizing}
              className="inline-flex items-center gap-1.5 py-1.5 px-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              title="Aplica un efecto borroso sobre la barra de tareas en todos los pasos para ocultar los iconos de aplicaciones abiertas"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-600" />
              <span>Difuminar barra</span>
            </button>
          </div>

          {onRegenerateRecording && (
            <button
              onClick={() => onRegenerateRecording(manual)}
              className="inline-flex items-center gap-2 py-2.5 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-xs rounded-xl shadow-xs transition-colors hover:scale-[1.02] active:scale-[0.98]"
              title="Volver a grabar pantalla y audio para este manual sin perder los datos llenados por primera vez"
            >
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <span>Regenerar Grabación</span>
            </button>
          )}

          <button
            onClick={onAddNewStep}
            className="inline-flex items-center gap-1.5 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            <span>Añadir Paso</span>
          </button>

          {onDeleteManual && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 py-2.5 px-3 bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 text-slate-600 hover:text-red-700 font-semibold text-xs rounded-xl shadow-xs transition-colors"
              title="Eliminar este manual de forma definitiva"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Table of Contents (Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tabla de Contenidos
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {manual.steps.length} pasos
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative mb-3 flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en el manual..."
              className="w-full text-xs pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="absolute right-1.5">
              <DictationButton
                value={searchQuery}
                onChange={setSearchQuery}
                title="Dictar búsqueda por voz"
                size="xs"
              />
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <a
              href="#resumen-general"
              className="text-xs font-medium text-slate-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors block truncate"
            >
              📋 Resumen & Requisitos
            </a>
            {manual.steps.map((step, idx) => (
              <a
                key={step.id}
                href={`#step-${step.id}`}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors block truncate flex items-center gap-2 ${
                  activeStepAnchor === step.id
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="truncate">{step.title}</span>
              </a>
            ))}
            {manual.troubleshooting && manual.troubleshooting.length > 0 && (
              <a
                href="#resolucion-problemas"
                className="text-xs font-medium text-slate-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors block truncate"
              >
                🛠️ Resolución de Problemas
              </a>
            )}
            {manual.summaryChecklist && manual.summaryChecklist.length > 0 && (
              <a
                href="#checklist-final"
                className="text-xs font-medium text-slate-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors block truncate"
              >
                ✅ Lista de Verificación
              </a>
            )}
          </nav>
        </aside>

        {/* Center / Right: Main Document Stream */}
        <main className="lg:col-span-9 flex flex-col gap-8">
          {/* Official Corporate Template Header Showcase (Matching Word & PDF) */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
            {/* Top Logo Bar */}
            <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-4">
              {/* Left: Nuestro Logo */}
              <div className="flex items-center gap-3">
                <div className="w-36 h-14 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center overflow-hidden shadow-2xs group relative">
                  {(project?.organizationLogo || branding?.logo) ? (
                    <img
                      src={project?.organizationLogo || branding?.logo}
                      alt={project?.organizationName || branding?.companyName || 'Nuestro Logo'}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold">weber Saint-Gobain</span>
                  )}
                  {onOpenOurLogoModal && (
                    <button
                      type="button"
                      onClick={onOpenOurLogoModal}
                      title="Definir Nuestro Logo"
                      className="absolute inset-0 bg-indigo-950/75 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-2xs"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Cambiar</span>
                    </button>
                  )}
                </div>
                <div className="hidden sm:block">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    {project?.organizationName || branding?.companyName || 'Saint-Gobain Weber'}
                  </span>
                  <span className="text-[10px] text-slate-500 block max-w-xs truncate">
                    {project?.organizationSlogan || branding?.companySlogan || 'Identidad Corporativa Oficial'}
                  </span>
                </div>
              </div>

              {/* Right: Client Logo / HSBT */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    {project?.clientName || 'Cliente SAP'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {branding?.secondarySlogan || 'COMPROMISO & CALIDAD'}
                  </span>
                </div>
                <div className="w-32 h-14 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center overflow-hidden shadow-2xs">
                  {project?.clientLogo ? (
                    <img
                      src={project.clientLogo}
                      alt={project.clientName}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#183B6C] rounded flex flex-col items-center justify-center text-white">
                      <span className="text-xs font-bold leading-tight">
                        {branding?.secondaryName || 'HSBT'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navy Blue Banner matching Word & PDF Cover */}
            <div className="bg-[#183B6C] text-white p-5 sm:p-7">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200 bg-white/10 px-2.5 py-0.5 rounded-full inline-block mb-2">
                MANUAL DE USUARIO SAP · PROCEDIMIENTO OFICIAL
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {manual.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-3xl leading-relaxed">
                {manual.subtitle || manual.overview}
              </p>
            </div>

            {/* 4-column Ficha Técnica */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-200 bg-slate-50 text-xs border-t border-slate-200">
              <div className="p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cliente Destinatario
                </span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {project?.clientName || 'Saint-Gobain Weber'}
                </span>
              </div>
              <div className="p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Código de Documento
                </span>
                <span className="font-bold text-slate-800 font-mono block mt-0.5">
                  {manual.code || project?.code || 'MAN-SAP-2026'}
                </span>
              </div>
              <div className="p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Versión / Estado
                </span>
                <span className="font-bold text-slate-800 block mt-0.5">
                  v{manual.version || '1.0'} · {project?.status || 'Aprobado'}
                </span>
              </div>
              <div className="p-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Autor Emisor
                </span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {manual.author || project?.author || branding?.companyName || 'Consultoría de Procesos'}
                </span>
              </div>
            </div>
          </div>

          {/* Overview Hero Card */}
          <section id="resumen-general" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Tiempo estimado: <strong>{manual.estimatedMinutes || 5} min</strong></span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-slate-400" />
                <span>Nivel: <strong>{manual.difficulty || 'Principiante'}</strong></span>
              </div>
              {manual.targetAudience && (
                <>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Audiencia: <strong>{manual.targetAudience}</strong></span>
                  </div>
                </>
              )}
            </div>

            {manual.subtitle && (
              <p className="text-base text-slate-600 mb-3 font-medium">
                {manual.subtitle}
              </p>
            )}

            <div className="p-4 bg-slate-50 border-l-4 border-indigo-600 rounded-r-xl text-sm text-slate-700 leading-relaxed mb-6">
              {manual.overview}
            </div>

            {/* Prerequisites */}
            {manual.prerequisites && manual.prerequisites.length > 0 && (
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Requisitos Previos
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {manual.prerequisites.map((p, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {onRegenerateRecording && (
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-2xs">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block text-amber-950">
                      ¿El sistema, interfaz o flujo cambiaron?
                    </span>
                    <span className="text-[11px] text-amber-900/90 leading-relaxed block">
                      Puedes <strong>Regenerar la Grabación</strong> en cualquier momento. Se mantendrán intactos el título, contexto y audiencia ya configurados.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRegenerateRecording(manual)}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerar Grabación</span>
                </button>
              </div>
            )}
          </section>

          {/* Steps List */}
          <div className="flex flex-col gap-6">
            {filteredSteps.map((step, idx) => (
              <article
                key={step.id}
                id={`step-${step.id}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Step Card Header */}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                      {step.stepNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded">
                          {getActionTypeSpanish(step.actionType)}
                        </span>
                        {step.targetElement && (
                          <span className="text-xs font-mono text-slate-500">
                            · {step.targetElement}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 leading-snug">
                        {step.title}
                      </h2>
                    </div>
                  </div>

                  {/* Step Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => onStartInteractivePlayer(idx)}
                      className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                      title="Ver en modo interactivo desde aquí"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Probar</span>
                    </button>
                    <button
                      onClick={() => onEditStep(step)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                      title="Editar contenido del paso"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    {step.image && (
                      <>
                        <button
                          onClick={() => setCropStep(step)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                          title="Editar tamaño y recortar captura para enfocar la acción y usar menos espacio en el PDF"
                        >
                          <Crop className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Recortar</span>
                        </button>
                        <button
                          onClick={async () => {
                            const cropped = await cropTaskbarFromDataUrl(step.image!, 0.052);
                            handleApplyStepCropDirect(step.id, cropped, {
                              x: 0,
                              y: 0,
                              width: 100,
                              height: 94.8,
                            });
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                          title="Quitar automáticamente la barra de tareas (~5% inferior) para usar menos espacio en el PDF"
                        >
                          <Scissors className="w-3.5 h-3.5 text-amber-600" />
                          <span className="hidden xl:inline">Quitar Barra</span>
                        </button>
                        <button
                          onClick={async () => {
                            const blurred = await blurTaskbarOnDataUrl(step.image!, 0.052);
                            handleApplyStepCropDirect(step.id, blurred);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                          title="Dejar borrosa la barra de tareas para ocultar los iconos de las aplicaciones abiertas"
                        >
                          <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                          <span className="hidden xl:inline">Difuminar</span>
                        </button>
                        <button
                          onClick={() => onAnnotateStep(step)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                          title="Editar puntos de enfoque y anotaciones visuales"
                        >
                          <Crosshair className="w-3.5 h-3.5 text-red-500" />
                          <span>Enfoque</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => moveStep(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg transition-colors"
                      title="Mover arriba"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveStep(idx, 'down')}
                      disabled={idx === manual.steps.length - 1}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg transition-colors"
                      title="Mover abajo"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteStep(step.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar paso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Step Body */}
                <div className="p-5 sm:p-6 flex flex-col gap-5">
                  <p className="text-sm text-slate-700 leading-relaxed font-normal">
                    {step.description}
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 4C/ID Pedagogical Purpose ("El Por Qué") */}
                    {step.purpose && (
                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5 md:col-span-2">
                        <Target className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-blue-950 font-bold">Propósito & Justificación:</strong>{' '}
                          {step.purpose}
                        </div>
                      </div>
                    )}
                    {step.expectedResult && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
                        <span className="text-sm">🎯</span>
                        <div>
                          <strong className="text-slate-900">Resultado esperado:</strong>{' '}
                          {step.expectedResult}
                        </div>
                      </div>
                    )}
                    {step.tip && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Consejo:</strong> {step.tip}
                        </div>
                      </div>
                    )}
                    {step.warning && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5 md:col-span-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Precaución:</strong> {step.warning}
                        </div>
                      </div>
                    )}

                    {/* Instructor Audio Transcription Callout (Teams Style) - ALWAYS VISIBLE & EDITABLE */}
                    {/* Instructor Audio Transcription Callout - ARGUMENTS & EXAMPLES ONLY (NON-REDUNDANT) */}
                    {editingInstructorStepId === step.id ? (
                      <div className="p-4 bg-purple-50 border-2 border-purple-400 rounded-xl text-xs text-purple-950 flex flex-col gap-2.5 shadow-md md:col-span-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                              <Mic className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-purple-950 text-xs block">
                                Editar Explicación del Instructor (Argumentos & Ejemplos · Paso #{step.stepNumber})
                              </span>
                              <span className="text-[10px] text-purple-700">
                                Argumentos de fondo, justificaciones de negocio o ejemplos prácticos (no repetir la acción física ya descrita)
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DictationButton
                              value={editingInstructorText}
                              onChange={setEditingInstructorText}
                              title="Dictar explicación del instructor por voz"
                              size="xs"
                            />
                            <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                              Edición en Vivo
                            </span>
                          </div>
                        </div>

                        <textarea
                          rows={3}
                          value={editingInstructorText}
                          onChange={(e) => setEditingInstructorText(e.target.value)}
                          placeholder='Escribe los argumentos o ejemplos prácticos que dio el instructor (ej. "En clientes corporativos usamos el almacén central para evitar retrasos"). Si la información ya está en la descripción detallada, déjalo vacío.'
                          className="w-full text-xs p-3 bg-white border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 leading-relaxed resize-none shadow-2xs"
                          autoFocus
                        />

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <span className="text-[10px] text-purple-700">
                            💡 Si la información ya está en la descripción detallada, no es necesario ponerla aquí.
                          </span>
                          <div className="flex items-center gap-2">
                            {editingInstructorText && (
                              <button
                                type="button"
                                onClick={() => setEditingInstructorText('')}
                                className="px-2.5 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors"
                              >
                                Limpiar / Dejar vacío
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={handleCancelEditInstructor}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveInstructor(step.id)}
                              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Guardar Explicación
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (() => {
                      const effective = getEffectiveInstructorContent(step);
                      if (effective.shouldShow) {
                        return (
                          <div className="p-3.5 bg-gradient-to-r from-purple-50 via-indigo-50/60 to-slate-50 border border-purple-200 rounded-xl text-xs text-purple-950 flex items-start gap-3 shadow-2xs md:col-span-2 group/inst">
                            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                              <Mic className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-purple-900 text-xs">Explicación del Instructor (Argumentos & Ejemplos)</span>
                                  <span className="text-[10px] bg-purple-200/80 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                                    Valor Pedagógico
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditInstructor(step)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 text-xs font-semibold rounded-lg border border-purple-300 shadow-2xs transition-colors"
                                  title="Editar la explicación o indicación verbal del instructor"
                                >
                                  <Edit3 className="w-3 h-3 text-purple-600" />
                                  <span>Editar Explicación</span>
                                </button>
                              </div>
                              {effective.quote && (
                                <p
                                  onClick={() => handleStartEditInstructor(step)}
                                  className="italic text-purple-900 font-semibold mb-1 text-xs cursor-pointer hover:bg-purple-100/50 p-1 -ml-1 rounded transition-colors"
                                  title="Haz clic para editar este argumento del instructor"
                                >
                                  "{effective.quote}"
                                </p>
                              )}
                              {effective.notes && (
                                <p
                                  onClick={() => handleStartEditInstructor(step)}
                                  className="text-slate-700 leading-relaxed font-normal cursor-pointer hover:bg-purple-100/50 p-1 -ml-1 rounded transition-colors"
                                  title="Haz clic para editar las notas del instructor"
                                >
                                  {effective.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="p-3 bg-purple-50/40 border border-dashed border-purple-300 rounded-xl text-xs text-purple-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 md:col-span-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                              <Mic className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-bold text-purple-900 block text-xs">
                                ¿El instructor aportó algún argumento o ejemplo verbal en este paso?
                              </span>
                              <span className="text-[11px] text-purple-700/80">
                                En la explicación se colocan argumentos o ejemplos prácticos (si ya está en la descripción, no es necesario).
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartEditInstructor(step)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-lg border border-purple-300 shadow-2xs transition-colors self-start sm:self-auto"
                          >
                            <Plus className="w-3.5 h-3.5 text-purple-600" />
                            <span>+ Añadir Argumento / Ejemplo</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Step Annotated Screenshot */}
                  {step.image && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-xs group flex items-center justify-center p-1 sm:p-2">
                      <div className="relative inline-block max-w-full">
                        <img
                          src={step.image}
                          alt={step.title}
                          className="max-h-[540px] max-w-full w-auto h-auto block rounded select-none shadow-md"
                          loading="lazy"
                          decoding="async"
                        />

                        {/* Visual Hotspots */}
                        {step.annotations?.map((ann) => {
                          if (ann.shape === 'blur') {
                            const width = ann.width || 22;
                            const height = ann.height || 12;
                            return (
                              <div
                                key={ann.id}
                                style={{
                                  left: `${ann.x}%`,
                                  top: `${ann.y}%`,
                                  width: `${width}%`,
                                  height: `${height}%`,
                                  transform: 'translate(-50%, -50%)',
                                }}
                                className="absolute backdrop-blur-md bg-slate-800/60 border border-slate-400 rounded pointer-events-none"
                              />
                            );
                          }
                          if (ann.shape === 'rect') {
                            const width = ann.width || 22;
                            const height = ann.height || 14;
                            return (
                              <div
                                key={ann.id}
                                style={{
                                  left: `${ann.x}%`,
                                  top: `${ann.y}%`,
                                  width: `${width}%`,
                                  height: `${height}%`,
                                  borderColor: ann.color || '#ef4444',
                                  transform: 'translate(-50%, -50%)',
                                }}
                                className="absolute border-2 bg-red-500/10 rounded pointer-events-none"
                              >
                                {ann.label && (() => {
                                  const isNearTop = (ann.y || 0) < 14;
                                  const pos = ann.labelPosition || (isNearTop ? 'bottom' : 'top');
                                  let style: React.CSSProperties = {
                                    backgroundColor: ann.color || '#ef4444',
                                  };
                                  if (ann.labelPosition === 'custom' && (ann.labelOffsetX !== undefined || ann.labelOffsetY !== undefined)) {
                                    style.top = '0px';
                                    style.left = '0px';
                                    style.transform = `translate(${ann.labelOffsetX || 0}px, ${ann.labelOffsetY || 0}px)`;
                                  } else if (pos === 'bottom') {
                                    style.bottom = '-24px';
                                    style.left = '0';
                                  } else if (pos === 'inside') {
                                    style.top = '4px';
                                    style.left = '4px';
                                  } else if (pos === 'right') {
                                    style.top = '0';
                                    style.right = '-90px';
                                  } else {
                                    style.top = '-24px';
                                    style.left = '0';
                                  }

                                  return (
                                    <span
                                      style={style}
                                      className="absolute text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-20"
                                    >
                                      {ann.label}
                                    </span>
                                  );
                                })()}
                              </div>
                            );
                          }
                          return (
                            <div
                              key={ann.id}
                              style={{
                                left: `${ann.x}%`,
                                top: `${ann.y}%`,
                                borderColor: ann.color || '#ef4444',
                              }}
                              className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-3 flex items-center justify-center pointer-events-none shadow-lg"
                            >
                              <div
                                style={{ backgroundColor: ann.color || '#ef4444' }}
                                className="w-4 h-4 rounded-full animate-ping opacity-80"
                              />
                              <div
                                style={{ backgroundColor: ann.color || '#ef4444' }}
                                className="w-3 h-3 rounded-full absolute"
                              />
                              {ann.label && (() => {
                                const isNearTop = (ann.y || 0) < 16;
                                const isNearBottom = (ann.y || 0) > 82;
                                const pos = ann.labelPosition || (isNearTop ? 'bottom' : (isNearBottom ? 'top' : 'top'));
                                const color = ann.color || '#ef4444';
                                let style: React.CSSProperties = {
                                  backgroundColor: color,
                                };
                                if (ann.labelPosition === 'custom' && (ann.labelOffsetX !== undefined || ann.labelOffsetY !== undefined)) {
                                  style.top = '0px';
                                  style.left = '0px';
                                  style.transform = `translate(${ann.labelOffsetX || 0}px, ${ann.labelOffsetY || 0}px)`;
                                } else if (pos === 'bottom') {
                                  style.top = 'calc(100% + 6px)';
                                  style.left = '50%';
                                  style.transform = 'translateX(-50%)';
                                } else if (pos === 'right') {
                                  style.top = '50%';
                                  style.left = 'calc(100% + 6px)';
                                  style.transform = 'translateY(-50%)';
                                } else if (pos === 'left') {
                                  style.top = '50%';
                                  style.right = 'calc(100% + 6px)';
                                  style.transform = 'translateY(-50%)';
                                } else if (pos === 'inside') {
                                  style.top = '50%';
                                  style.left = '50%';
                                  style.transform = 'translate(-50%, -50%)';
                                } else {
                                  style.bottom = 'calc(100% + 6px)';
                                  style.left = '50%';
                                  style.transform = 'translateX(-50%)';
                                }
                                return (
                                  <span
                                    style={style}
                                    className="absolute text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap border border-white/30 z-20"
                                  >
                                    {ann.label}
                                  </span>
                                );
                              })()}
                            </div>
                          );
                        })}

                        {/* Quick Edit Overlay Button */}
                        <button
                          onClick={() => onAnnotateStep(step)}
                          className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5"
                        >
                          <Crosshair className="w-3.5 h-3.5 text-red-500" />
                          <span>Ajustar enfoque visual</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}

            {filteredSteps.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-semibold">No se encontraron pasos coincidentes.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs text-indigo-600 font-medium hover:underline"
                >
                  Limpiar búsqueda
                </button>
              </div>
            )}
          </div>

          {/* Troubleshooting Section */}
          {manual.troubleshooting && manual.troubleshooting.length > 0 && (
            <section id="resolucion-problemas" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                Resolución de Problemas Comunes
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {manual.troubleshooting.map((t, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <span className="text-amber-500">❓</span> {t.problem}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed pl-5">
                      💡 {t.solution}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Final Verification Checklist */}
          {manual.summaryChecklist && manual.summaryChecklist.length > 0 && (
            <section id="checklist-final" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Lista de Verificación Final
              </h2>
              <div className="flex flex-col gap-2">
                {manual.summaryChecklist.map((item, idx) => (
                  <label
                    key={idx}
                    onClick={() => toggleChecklistItem(idx)}
                    className={`p-3 rounded-xl border transition-colors flex items-center gap-3 cursor-pointer ${
                      checkedChecklist[idx]
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(checkedChecklist[idx])}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={`text-xs ${checkedChecklist[idx] ? 'line-through text-slate-400' : ''}`}>
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* MS Teams Style Meeting Transcription Modal */}
      {showTranscriptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Transcripción del Instructor (Estilo MS Teams)</span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                      Audio de la Sesión
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registro textual de lo que el instructor explicó verbalmente durante la grabación de pantallas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTranscriptModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Transcript Segments */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700">
                  Frases e intervenciones del instructor registradas
                </span>
                <button
                  type="button"
                  onClick={handleAddTranscriptItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg border border-purple-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Frase</span>
                </button>
              </div>

              {manual.instructorTranscript && manual.instructorTranscript.length > 0 ? (
                manual.instructorTranscript.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 hover:border-purple-300 transition-colors group"
                  >
                    <span className="font-mono text-purple-700 font-bold text-xs bg-purple-100/80 border border-purple-200 px-2 py-0.5 rounded flex-shrink-0 mt-0.5">
                      {Math.floor(t.timestamp / 60)
                        .toString()
                        .padStart(2, '0')}
                      :{(t.timestamp % 60).toString().padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold text-slate-500">
                          Relator / Instructor:
                        </span>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          {editingTranscriptIdx === idx ? null : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEditTranscriptItem(idx, t.text)}
                                className="p-1 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded text-xs"
                                title="Editar texto"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTranscriptItem(idx)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded text-xs"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {editingTranscriptIdx === idx ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingTranscriptText}
                              onChange={(e) => setEditingTranscriptText(e.target.value)}
                              className="flex-1 text-xs p-2 bg-white border border-purple-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              autoFocus
                            />
                            <DictationButton
                              value={editingTranscriptText}
                              onChange={setEditingTranscriptText}
                              title="Dictar corrección por voz"
                              size="xs"
                            />
                          </div>
                          <div className="flex items-center gap-2 self-end">
                            <button
                              type="button"
                              onClick={() => setEditingTranscriptIdx(null)}
                              className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditTranscriptItem(idx)}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded shadow-xs"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          onClick={() => handleStartEditTranscriptItem(idx, t.text)}
                          className="text-xs text-slate-800 leading-relaxed font-normal cursor-pointer hover:text-purple-900"
                          title="Haz clic para editar"
                        >
                          "{t.text}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : manual.fullTranscriptionText ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">
                      Texto Completo de la Transcripción
                    </span>
                    <DictationButton
                      value={manual.fullTranscriptionText}
                      onChange={(val) => {
                        onUpdateManual({
                          ...manual,
                          fullTranscriptionText: val,
                          updatedAt: new Date().toISOString(),
                        });
                      }}
                      title="Dictar en transcripción completa"
                      size="xs"
                    />
                  </div>
                  <textarea
                    rows={8}
                    value={manual.fullTranscriptionText}
                    onChange={(e) => {
                      onUpdateManual({
                        ...manual,
                        fullTranscriptionText: e.target.value,
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-[10px] text-slate-400">
                    💡 Puedes dictar o escribir para editar el texto completo de la transcripción directamente.
                  </span>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                  <Mic className="w-8 h-8 text-slate-300" />
                  <p>No hay transcripción registrada para este manual todavía.</p>
                  <button
                    type="button"
                    onClick={handleAddTranscriptItem}
                    className="mt-2 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    + Añadir primera frase hablada
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {manual.instructorTranscript?.length || 0} intervenciones habladas registradas
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg shadow-2xs transition-colors"
                >
                  {copiedTranscript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Transcripción</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTranscriptModal(false)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-app Manual Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ¿Eliminar este manual?
                  </h3>
                  <span className="text-xs text-slate-500">
                    Esta acción eliminará el manual definitivamente
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="font-bold text-slate-900 text-sm leading-snug">{manual.title}</div>
              <div className="text-xs text-slate-500 mt-1">
                {manual.steps.length} pasos · Versión {manual.version || '1.0'}
              </div>
            </div>

            <p className="text-xs text-slate-600">
              ¿Confirmas que deseas eliminar este manual de la plataforma? Esta acción no se puede deshacer.
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onDeleteManual?.(manual.id);
                  setShowDeleteModal(false);
                }}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar Manual Definitivamente</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-2 px-4 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl text-center"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recorte y Edición de Tamaño de Captura */}
      {cropStep && cropStep.image && (
        <ImageCropModal
          isOpen={!!cropStep}
          imageSrc={cropStep.image}
          imageTitle={`Paso ${cropStep.stepNumber}: ${cropStep.title}`}
          annotations={cropStep.annotations || []}
          onApplyCrop={handleApplyStepCrop}
          onClose={() => setCropStep(null)}
        />
      )}
    </div>
  );
};

export const ManualView = memo(ManualViewComponent);
