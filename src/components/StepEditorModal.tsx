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
  Trash2,
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
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-[98vw] max-w-[98vw] h-[98vh] max-h-[98vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              {formData.stepNumber}
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Editar Paso #{formData.stepNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (2-Column Grid to avoid vertical scroll) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: Form Fields (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-3">
            {/* AI Quick Polish Bar */}
            <div className="p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="text-xs font-bold text-indigo-900 hidden sm:inline">
                  Asistente IA:
                </span>
                {aiMessage && (
                  <span className="text-xs font-semibold text-indigo-700 animate-fade-in truncate max-w-xs">
                    {aiMessage}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleEnhanceWithAi('Hazlo más claro, conciso y profesional')}
                  disabled={isEnhancing}
                  className="text-[11px] bg-white hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : '⚡'} Más Conciso
                </button>
                <button
                  type="button"
                  onClick={() => handleEnhanceWithAi('Añade un tip o consejo pro muy útil')}
                  disabled={isEnhancing}
                  className="text-[11px] bg-white hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  💡 Consejo Pro
                </button>
                <button
                  type="button"
                  onClick={() => handleEnhanceWithAi('Añade una advertencia importante para evitar errores')}
                  disabled={isEnhancing}
                  className="text-[11px] bg-white hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  ⚠️ Advertencia
                </button>
              </div>
            </div>

            {/* Row 1: Title & Action Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Título de la Acción *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tipo de Acción
                </label>
                <select
                  value={formData.actionType}
                  onChange={(e) =>
                    setFormData({ ...formData, actionType: e.target.value as ActionType })
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Elemento Objetivo en Pantalla
                </label>
                <input
                  type="text"
                  value={formData.targetElement || ''}
                  onChange={(e) => setFormData({ ...formData, targetElement: e.target.value })}
                  placeholder="Ej. Campo 'Sociedad' o Botón 'Guardar'"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Resultado Esperado
                </label>
                <input
                  type="text"
                  value={formData.expectedResult || ''}
                  onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                  placeholder="Ej. El código de sociedad queda ingresado"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Row 3: Description */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Descripción Detallada
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
              />
            </div>

            {/* Row 4: Tip & Warning */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-600" /> Consejo Pro (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.tip || ''}
                  onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                  placeholder="Ej. Puedes agregar a Favoritos"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Advertencia (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.warning || ''}
                  onChange={(e) => setFormData({ ...formData, warning: e.target.value })}
                  placeholder="Ej. Escribir siempre en mayúsculas"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Row 5: Instructor Audio Notes / Quote (Teams Style) */}
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <Mic className="w-3.5 h-3.5 text-purple-600" />
                <span>Explicación del Instructor (Transcripción de Audio)</span>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-purple-900/80 block mb-1">
                  Cita Textual o Frase Destacada
                </label>
                <input
                  type="text"
                  value={formData.instructorAudioQuote || ''}
                  onChange={(e) => setFormData({ ...formData, instructorAudioQuote: e.target.value })}
                  placeholder='Ej. "Recuerden no dejar el centro de costo en blanco"'
                  className="w-full text-xs px-3 py-1.5 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 italic"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-purple-900/80 block mb-1">
                  Notas / Explicación Verbal Detallada
                </label>
                <textarea
                  rows={2}
                  value={formData.instructorNotes || ''}
                  onChange={(e) => setFormData({ ...formData, instructorNotes: e.target.value })}
                  placeholder="Detalla lo que el instructor explicó verbalmente en esta pantalla..."
                  className="w-full text-xs px-3 py-1.5 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Screenshot & Interactive Annotation Focus Preview (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between gap-3 h-full">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Captura de Pantalla
                </span>
                <span className="text-[11px] text-slate-500">
                  {formData.annotations?.length || 0} puntos de enfoque configurados
                </span>
              </div>

              {formData.image && (
                <button
                  type="button"
                  onClick={() => {
                    onSave(formData);
                    onOpenAnnotationEditor();
                  }}
                  className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Crosshair className="w-3.5 h-3.5 text-white" />
                  Editar Enfoque
                </button>
              )}
            </div>

            {formData.image ? (
              <div
                onClick={() => {
                  onSave(formData);
                  onOpenAnnotationEditor();
                }}
                className="relative flex-1 min-h-[220px] max-h-[380px] bg-slate-950 rounded-xl overflow-hidden border border-slate-300 group cursor-pointer shadow-inner flex items-center justify-center"
                title="Haz clic para abrir el editor de enfoque visual"
              >
                <img
                  src={formData.image}
                  alt="Captura del paso"
                  className="w-full h-full object-contain"
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

                <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-semibold text-xs backdrop-blur-2xs">
                  <Crosshair className="w-4 h-4 text-red-400" />
                  <span>Haz clic para editar recuadros y flechas</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-[180px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
                <ImageIcon className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-medium">No hay captura adjunta a este paso.</span>
              </div>
            )}

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200">
              <span>💡 Puedes reubicar los puntos focales cuando desees.</span>
              <span className="font-semibold text-indigo-600">Paso #{formData.stepNumber}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="py-2 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
