import React, { useState } from 'react';
import { UserManual, ManualStep, getActionTypeSpanish } from '../types/manual';
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
} from 'lucide-react';
import { Project } from '../types/project';

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
}

export const ManualView: React.FC<ManualViewProps> = ({
  manual,
  project,
  onBackToProject,
  onUpdateManual,
  onStartInteractivePlayer,
  onOpenExportModal,
  onEditStep,
  onAnnotateStep,
  onAddNewStep,
  onRegenerateRecording,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStepAnchor, setActiveStepAnchor] = useState<string | null>(null);
  const [checkedChecklist, setCheckedChecklist] = useState<Record<number, boolean>>({});
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const filteredSteps = manual.steps.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      (s.targetElement && s.targetElement.toLowerCase().includes(q))
    );
  });

  const moveStep = (index: number, direction: 'up' | 'down') => {
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
  };

  const deleteStep = (stepId: string) => {
    if (manual.steps.length <= 1) {
      alert('El manual debe contener al menos un paso.');
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
  };

  const toggleChecklistItem = (idx: number) => {
    setCheckedChecklist((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCopyTranscript = () => {
    const textToCopy =
      manual.fullTranscriptionText ||
      manual.instructorTranscript?.map((t) => `[${t.timestamp}s] ${t.text}`).join('\n') ||
      '';
    navigator.clipboard.writeText(textToCopy);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
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
            <div className="flex items-center gap-2 text-xs text-slate-600">
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
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Manual del Proyecto
          </span>
        </div>
      )}

      {/* Top Action Header Bar */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Manual de Usuario</span>
            <span>·</span>
            <span>Versión {manual.version || '1.0'}</span>
            <span>·</span>
            <span>Actualizado {new Date(manual.updatedAt).toLocaleDateString()}</span>
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
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en el manual..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
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
                      <button
                        onClick={() => onAnnotateStep(step)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                        title="Editar puntos de enfoque y anotaciones visuales"
                      >
                        <Crosshair className="w-3.5 h-3.5 text-red-500" />
                        <span>Enfoque</span>
                      </button>
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

                    {/* Instructor Audio Transcription Callout (Teams Style) */}
                    {(step.instructorAudioQuote || step.instructorNotes) && (
                      <div className="p-3.5 bg-gradient-to-r from-purple-50 via-indigo-50/60 to-slate-50 border border-purple-200 rounded-xl text-xs text-purple-950 flex items-start gap-3 shadow-2xs md:col-span-2">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                          <Mic className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-purple-900 text-xs">Explicación del Instructor (Audio Transcrito)</span>
                            <span className="text-[10px] bg-purple-200/80 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                              Grabación en Vivo · Estilo MS Teams
                            </span>
                          </div>
                          {step.instructorAudioQuote && (
                            <p className="italic text-purple-900 font-semibold mb-1 text-xs">
                              "{step.instructorAudioQuote}"
                            </p>
                          )}
                          {step.instructorNotes && step.instructorNotes !== step.instructorAudioQuote && (
                            <p className="text-slate-700 leading-relaxed font-normal">
                              {step.instructorNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
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
                                let style: React.CSSProperties = {
                                  backgroundColor: ann.color || '#0f172a',
                                };
                                if (ann.labelPosition === 'custom' && (ann.labelOffsetX !== undefined || ann.labelOffsetY !== undefined)) {
                                  style.top = '0px';
                                  style.left = '0px';
                                  style.transform = `translate(${ann.labelOffsetX || 0}px, ${ann.labelOffsetY || 0}px)`;
                                } else {
                                  style.bottom = '-24px';
                                  style.left = '50%';
                                  style.transform = 'translateX(-50%)';
                                }
                                return (
                                  <span
                                    style={style}
                                    className="absolute text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow whitespace-nowrap"
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
              {manual.instructorTranscript && manual.instructorTranscript.length > 0 ? (
                manual.instructorTranscript.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 hover:border-purple-300 transition-colors"
                  >
                    <span className="font-mono text-purple-700 font-bold text-xs bg-purple-100/80 border border-purple-200 px-2 py-0.5 rounded flex-shrink-0 mt-0.5">
                      {Math.floor(t.timestamp / 60)
                        .toString()
                        .padStart(2, '0')}
                      :{(t.timestamp % 60).toString().padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <div className="text-[11px] font-bold text-slate-500 mb-0.5">
                        Relator / Instructor:
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-normal">
                        "{t.text}"
                      </p>
                    </div>
                  </div>
                ))
              ) : manual.fullTranscriptionText ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {manual.fullTranscriptionText}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No hay transcripción registrada para este manual.
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
    </div>
  );
};
