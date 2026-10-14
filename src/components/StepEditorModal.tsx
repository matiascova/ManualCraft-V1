import React, { useState } from 'react';
import { ManualStep, ActionType } from '../types/manual';
import {
  X,
  Sparkles,
  Loader2,
  Check,
  AlertTriangle,
  Lightbulb,
  Crosshair,
  Image as ImageIcon,
  Mic,
} from 'lucide-react';

interface StepEditorModalProps {
  step: ManualStep;
  manualContext?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedStep: ManualStep) => void;
  onOpenAnnotationEditor: () => void;
}

const ACTION_TYPES: Array<{ value: ActionType; label: string }> = [
  { value: 'click', label: 'Clic' },
  { value: 'type', label: 'Ingresar / Escribir Dato' },
  { value: 'enter', label: 'Presionar Enter' },
  { value: 'save', label: 'Grabar' },
  { value: 'navigate', label: 'Navegar' },
  { value: 'select', label: 'Seleccionar' },
  { value: 'verify', label: 'Verificar' },
  { value: 'info', label: 'Información' },
];

export const StepEditorModal: React.FC<StepEditorModalProps> = ({
  step,
  manualContext = '',
  isOpen,
  onClose,
  onSave,
  onOpenAnnotationEditor,
}) => {
  const [formData, setFormData] = useState<ManualStep>({ ...step });
  const [aiInstruction, setAiInstruction] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [activeExtraTab, setActiveExtraTab] = useState<'tip' | 'warning' | 'audio'>('tip');

  if (!isOpen) return null;

  const handleEnhanceWithAi = async (quickInstruction?: string) => {
    setIsEnhancing(true);
    setAiMessage(null);
    try {
      const instructionToUse =
        quickInstruction ||
        aiInstruction.trim() ||
        'Mejora la redacción, hazlo más claro, conciso y profesional con un consejo útil.';

      const res = await fetch('/api/enhance-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: formData,
          instruction: instructionToUse,
          context: manualContext,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al mejorar el paso');
      }

      setFormData((prev) => ({
        ...prev,
        title: data.enhanced.title || prev.title,
        description: data.enhanced.description || prev.description,
        actionType: data.enhanced.actionType || prev.actionType,
        targetElement: data.enhanced.targetElement || prev.targetElement,
        expectedResult: data.enhanced.expectedResult || prev.expectedResult,
        tip: data.enhanced.tip || prev.tip,
        warning: data.enhanced.warning || prev.warning,
      }));

      setAiMessage('✨ ¡Paso mejorado con éxito por la IA!');
      setTimeout(() => setAiMessage(null), 4000);
    } catch (err: any) {
      setAiMessage(`⚠️ Error: ${err.message}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
      <div className="bg-white rounded-2xl shadow-2xl w-[98vw] max-w-[98vw] h-[96vh] max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header - Unified with AI polish buttons */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {formData.stepNumber}
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Editar Paso #{formData.stepNumber}
              </h3>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Configura la acción, descripción, consejos y captura del paso.
              </p>
            </div>
          </div>

          {/* AI Polish Tools directly in header */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="hidden md:flex items-center gap-1 text-xs font-semibold text-indigo-900 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>IA:</span>
            </div>
            {aiMessage && (
              <span className="text-xs font-semibold text-indigo-700 animate-fade-in mr-1 hidden lg:inline">
                {aiMessage}
              </span>
            )}
            <button
              type="button"
              onClick={() => handleEnhanceWithAi('Hazlo más claro, conciso y profesional')}
              disabled={isEnhancing}
              className="text-[11px] bg-white hover:bg-indigo-50 text-indigo-700 font-semibold px-2 py-1 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 shadow-2xs"
            >
              {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : '⚡'} Conciso
            </button>
            <button
              type="button"
              onClick={() => handleEnhanceWithAi('Añade un tip o consejo pro muy útil')}
              disabled={isEnhancing}
              className="text-[11px] bg-white hover:bg-indigo-50 text-indigo-700 font-semibold px-2 py-1 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 shadow-2xs"
            >
              💡 Consejo
            </button>
            <button
              type="button"
              onClick={() => handleEnhanceWithAi('Añade una advertencia importante para evitar errores')}
              disabled={isEnhancing}
              className="text-[11px] bg-white hover:bg-indigo-50 text-indigo-700 font-semibold px-2 py-1 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 shadow-2xs"
            >
              ⚠️ Advertencia
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body (2-Column Grid designed to fit 100% on screen with ZERO vertical scroll) */}
        <div className="flex-1 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Form Fields (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-2.5 h-full min-h-0">
            {/* Row 1: Title & Action Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Título de la Acción *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Tipo de Acción
                </label>
                <select
                  value={formData.actionType}
                  onChange={(e) =>
                    setFormData({ ...formData, actionType: e.target.value as ActionType })
                  }
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
                >
                  {ACTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Target Element & Expected Result */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Elemento Objetivo en Pantalla
                </label>
                <input
                  type="text"
                  value={formData.targetElement || ''}
                  onChange={(e) => setFormData({ ...formData, targetElement: e.target.value })}
                  placeholder="Ej. Campo 'Sociedad' o Botón 'Guardar'"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Resultado Esperado
                </label>
                <input
                  type="text"
                  value={formData.expectedResult || ''}
                  onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                  placeholder="Ej. El código de sociedad queda ingresado"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Row 3: Description */}
            <div className="flex-1 flex flex-col min-h-0">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Descripción Detallada
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none min-h-[60px]"
              />
            </div>

            {/* Row 4: Tabbed Extra Information (Consejos, Advertencias, Audio) to eliminate vertical height bloat */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveExtraTab('tip')}
                    className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                      activeExtraTab === 'tip'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Lightbulb className="w-3 h-3 text-emerald-600" />
                    <span>Consejo Pro</span>
                    {formData.tip && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveExtraTab('warning')}
                    className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                      activeExtraTab === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Advertencia</span>
                    {formData.warning && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveExtraTab('audio')}
                    className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                      activeExtraTab === 'audio'
                        ? 'bg-purple-100 text-purple-800'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Mic className="w-3 h-3 text-purple-600" />
                    <span>Audio del Instructor</span>
                    {(formData.instructorAudioQuote || formData.instructorNotes) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    )}
                  </button>
                </div>
              </div>

              {activeExtraTab === 'tip' && (
                <div>
                  <input
                    type="text"
                    value={formData.tip || ''}
                    onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                    placeholder="Ej. Puedes usar Ctrl+S o Enter como atajo rápido"
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {activeExtraTab === 'warning' && (
                <div>
                  <input
                    type="text"
                    value={formData.warning || ''}
                    onChange={(e) => setFormData({ ...formData, warning: e.target.value })}
                    placeholder="Ej. Escribir siempre el código en mayúsculas para evitar errores"
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {activeExtraTab === 'audio' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-purple-900 font-semibold block mb-0.5">
                      Cita Textual
                    </span>
                    <input
                      type="text"
                      value={formData.instructorAudioQuote || ''}
                      onChange={(e) => setFormData({ ...formData, instructorAudioQuote: e.target.value })}
                      placeholder='Ej. "No dejen el campo en blanco"'
                      className="w-full text-xs px-2 py-1 bg-white border border-purple-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 italic"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-900 font-semibold block mb-0.5">
                      Notas del Instructor
                    </span>
                    <input
                      type="text"
                      value={formData.instructorNotes || ''}
                      onChange={(e) => setFormData({ ...formData, instructorNotes: e.target.value })}
                      placeholder="Detalles hablados en la sesión..."
                      className="w-full text-xs px-2 py-1 bg-white border border-purple-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Screenshot & Interactive Annotation Focus Preview (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2.5 h-full min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Captura & Puntos Focales
                </span>
                <span className="text-[11px] text-slate-500">
                  {formData.annotations?.length || 0} enfoques visuales
                </span>
              </div>

              {formData.image && (
                <button
                  type="button"
                  onClick={() => {
                    onSave(formData);
                    onOpenAnnotationEditor();
                  }}
                  className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Crosshair className="w-3.5 h-3.5 text-white" />
                  Abrir Editor de Enfoque
                </button>
              )}
            </div>

            {formData.image ? (
              <div
                onClick={() => {
                  onSave(formData);
                  onOpenAnnotationEditor();
                }}
                className="relative flex-1 bg-slate-950 rounded-xl overflow-hidden border border-slate-300 group cursor-pointer shadow-inner flex items-center justify-center p-1 min-h-0"
                title="Haz clic para abrir el editor de enfoque visual sin scroll"
              >
                <div className="relative inline-block max-w-full max-h-full">
                  <img
                    src={formData.image}
                    alt="Captura del paso"
                    className="max-h-full max-w-full w-auto h-auto block rounded"
                  />

                  {/* Hotspots mini-preview */}
                  {formData.annotations?.map((ann) => (
                    <div
                      key={ann.id}
                      style={{
                        left: `${ann.x}%`,
                        top: `${ann.y}%`,
                        borderColor: ann.color || '#ef4444',
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 bg-red-500/20 pointer-events-none"
                    />
                  ))}
                </div>

                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-semibold text-xs backdrop-blur-2xs">
                  <Crosshair className="w-4 h-4 text-red-400" />
                  <span>Clic para editar recuadros, flechas y censura</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center min-h-0">
                <ImageIcon className="w-7 h-7 text-slate-300" />
                <span className="text-xs font-medium">Sin captura adjunta a este paso.</span>
              </div>
            )}

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200 shrink-0">
              <span>💡 Puntos focales editables en el lienzo interactivo</span>
              <span className="font-semibold text-indigo-600">Paso #{formData.stepNumber}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="py-1.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Check className="w-4 h-4" /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
