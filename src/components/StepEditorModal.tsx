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
  Target,
  MessageSquareQuote,
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
        purpose: data.enhanced.purpose || prev.purpose,
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
          {/* Left Column: Form Fields (7 cols) - Scrollable to ensure all fields are visible */}
          <div className="lg:col-span-7 flex flex-col gap-3 h-full min-h-0 overflow-y-auto pr-1 sm:pr-2">
            {/* Row 1: Title & Action Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Título de la Acción *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej. Ingresar Código de Sociedad"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 shrink-0">
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
            <div className="flex flex-col shrink-0">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Descripción Detallada *
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explica detalladamente qué debe hacer el usuario en este paso..."
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
              />
            </div>

            {/* Row 4: Propósito y Justificación Pedagógica (Modelo 4C/ID) */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-2.5 shrink-0">
              <div className="flex items-center gap-1.5 mb-1 text-blue-900 font-bold text-[11px]">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span>Propósito & Justificación Funcional (¿Por qué se realiza este paso?)</span>
              </div>
              <input
                type="text"
                value={formData.purpose || ''}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Ej. Garantizar que la solicitud se asigne a la entidad legal correspondiente para su imputación contable..."
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Row 5: EXPLICACIÓN DEL INSTRUCTOR (Audio Transcrito / Explicación Verbal) - VISIBLE ON THIS SCREEN */}
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50/70 border-2 border-purple-300 rounded-xl p-3 shrink-0 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold shadow-2xs">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-purple-950 block leading-tight">
                      Explicación del Instructor (Argumentos & Ejemplos)
                    </span>
                    <span className="text-[10px] text-purple-700">
                      Argumentos de fondo, justificaciones de negocio o ejemplos prácticos
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-purple-200/90 text-purple-900 font-bold px-2 py-0.5 rounded-full border border-purple-300">
                  Visible en PDF & Word
                </span>
              </div>

              <textarea
                rows={2}
                value={formData.instructorAudioQuote || formData.instructorNotes || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    instructorAudioQuote: val,
                    instructorNotes: val,
                  });
                }}
                placeholder='Escribe los argumentos o ejemplos prácticos que dio el instructor (ej. "En clientes corporativos usamos el almacén central para evitar quiebres"). Si la información ya está en la descripción detallada, déjalo vacío.'
                className="w-full text-xs px-2.5 py-2 bg-white border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 leading-relaxed resize-none shadow-2xs"
              />

              <div className="flex items-center justify-between mt-1 text-[10px] text-purple-800">
                <span>💡 Regla pedagógica: Coloca argumentos o ejemplos prácticos. Si ya está en la descripción, déjalo vacío.</span>
                {(formData.instructorAudioQuote || formData.instructorNotes) && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        instructorAudioQuote: '',
                        instructorNotes: '',
                      })
                    }
                    className="text-red-500 hover:text-red-700 font-semibold text-[10px] underline ml-2 shrink-0"
                  >
                    Borrar explicación
                  </button>
                )}
              </div>
            </div>

            {/* Row 6: Consejos Pro y Advertencias (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 shrink-0">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5">
                <label className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Consejo Pro</span>
                </label>
                <input
                  type="text"
                  value={formData.tip || ''}
                  onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                  placeholder="Ej. Puedes usar Ctrl+S o Enter como atajo rápido"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-2.5">
                <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Advertencia / Precaución</span>
                </label>
                <input
                  type="text"
                  value={formData.warning || ''}
                  onChange={(e) => setFormData({ ...formData, warning: e.target.value })}
                  placeholder="Ej. Escribir siempre el código en mayúsculas"
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
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
