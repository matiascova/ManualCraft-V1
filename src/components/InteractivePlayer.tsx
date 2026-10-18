import React, { useState, useEffect } from 'react';
import { UserManual, ManualStep, getActionTypeSpanish } from '../types/manual';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Maximize2,
  Minimize2,
  ZoomIn,
  Mic,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getEffectiveInstructorContent } from '../utils/instructorUtils';

interface InteractivePlayerProps {
  manual: UserManual;
  initialStepIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const InteractivePlayer: React.FC<InteractivePlayerProps> = ({
  manual,
  initialStepIndex = 0,
  isOpen,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setCurrentStepIndex(initialStepIndex);
  }, [initialStepIndex, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const currentStep = manual.steps[currentStepIndex] || manual.steps[0];
  const totalSteps = manual.steps.length;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  const toggleStepCompleted = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = { ...prev, [stepId]: !prev[stepId] };
      if (next[stepId] && currentStepIndex === totalSteps - 1) {
        triggerCelebration();
      }
      return next;
    });
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6'],
    });
  };

  const goToNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      triggerCelebration();
    }
  };

  const goToPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col justify-between overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Modo Guía Interactiva
          </span>
          <span className="text-slate-500">·</span>
          <h2 className="text-sm font-bold text-white truncate max-w-md">
            {manual.title}
          </h2>
        </div>

        {/* Stepper counter & Exit */}
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-400 font-mono">
            Paso <span className="text-white font-bold">{currentStepIndex + 1}</span> de{' '}
            <span className="text-white font-bold">{totalSteps}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Cerrar reproductor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-800 h-1">
        <div
          className="bg-indigo-500 h-1 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 flex items-center justify-center">
        <div className="w-[98vw] max-w-[98vw] h-[94vh] max-h-[94vh] bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
          {/* Left / Top: Step Instructions */}
          <div className="lg:w-2/5 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 overflow-y-auto">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded border border-indigo-800/60">
                  {getActionTypeSpanish(currentStep.actionType)}
                </span>

                <button
                  onClick={() => toggleStepCompleted(currentStep.id)}
                  className={`text-xs flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    completedSteps[currentStep.id]
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{completedSteps[currentStep.id] ? '¡Completado!' : 'Marcar listo'}</span>
                </button>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  {currentStep.title}
                </h3>
                {currentStep.targetElement && (
                  <div className="text-xs text-indigo-300 font-mono mt-1">
                    En: {currentStep.targetElement}
                  </div>
                )}
              </div>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {currentStep.description}
              </p>

              {/* Tips & Warnings */}
              {currentStep.tip && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-900/60 rounded-xl text-xs text-indigo-200 flex gap-2.5">
                  <Lightbulb className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Consejo:</span> {currentStep.tip}
                  </div>
                </div>
              )}

              {currentStep.warning && (
                <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-xl text-xs text-amber-200 flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Atención:</span> {currentStep.warning}
                  </div>
                </div>
              )}

              {currentStep.expectedResult && (
                <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300 flex gap-2.5">
                  <span className="text-sm">🎯</span>
                  <div>
                    <span className="font-bold text-white">Resultado:</span> {currentStep.expectedResult}
                  </div>
                </div>
              )}

              {/* Instructor Spoken Quote / Audio Guidance (Non-Redundant Arguments & Examples Only) */}
              {(() => {
                const effective = getEffectiveInstructorContent(currentStep);
                if (!effective.shouldShow) return null;
                return (
                  <div className="p-3 bg-purple-950/50 border border-purple-800/60 rounded-xl text-xs text-purple-200 flex gap-2.5">
                    <Mic className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-purple-300">Argumentos & Ejemplos del Instructor</span>
                        <span className="text-[10px] bg-purple-900/80 text-purple-200 px-1.5 py-0.5 rounded font-semibold">
                          Audio de Sesión
                        </span>
                      </div>
                      {effective.quote && (
                        <p className="italic text-purple-100 font-medium mb-1">
                          "{effective.quote}"
                        </p>
                      )}
                      {effective.notes && (
                        <p className="text-purple-300/90 leading-relaxed font-normal">
                          {effective.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between text-xs text-slate-400">
              <span>Usa las teclas de flecha ← y →</span>
              <span>{Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% completado</span>
            </div>
          </div>

          {/* Right / Bottom: Screenshot with Hotspots */}
          <div className="lg:w-3/5 bg-slate-950 p-6 flex items-center justify-center relative overflow-hidden group">
            {currentStep.image ? (
              <div className="relative inline-block max-w-full max-h-full">
                <img
                  src={currentStep.image}
                  alt={currentStep.title}
                  className={`rounded-xl object-contain max-h-[78vh] max-w-full border border-slate-800 shadow-2xl transition-transform duration-200 ${
                    isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                />

                {/* Hotspots */}
                {!isZoomed &&
                  currentStep.annotations?.map((ann) => {
                    if (ann.shape === 'blur') {
                      return (
                        <div
                          key={ann.id}
                          style={{
                            left: `${ann.x}%`,
                            top: `${ann.y}%`,
                            width: `${ann.width || 20}%`,
                            height: `${ann.height || 10}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          className="absolute backdrop-blur-md bg-slate-900/60 border border-slate-400 rounded pointer-events-none"
                        />
                      );
                    }

                    if (ann.shape === 'rect') {
                      const width = ann.width || 22;
                      const height = ann.height || 14;
                      const isNearTop = (ann.y || 0) < 18;
                      const pos = ann.labelPosition || (isNearTop ? 'bottom' : 'top');
                      let labelStyle: React.CSSProperties = {
                        backgroundColor: ann.color || '#ef4444',
                      };
                      if (ann.labelPosition === 'custom' && (ann.labelOffsetX !== undefined || ann.labelOffsetY !== undefined)) {
                        labelStyle.top = '0px';
                        labelStyle.left = '0px';
                        labelStyle.transform = `translate(${ann.labelOffsetX || 0}px, ${ann.labelOffsetY || 0}px)`;
                      } else if (pos === 'bottom') {
                        labelStyle.bottom = '-26px';
                        labelStyle.left = '0';
                      } else if (pos === 'inside') {
                        labelStyle.top = '6px';
                        labelStyle.left = '6px';
                      } else if (pos === 'right') {
                        labelStyle.top = '0';
                        labelStyle.right = '-110px';
                      } else {
                        labelStyle.top = '-26px';
                        labelStyle.left = '0';
                      }

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
                          className="absolute border-2 bg-red-500/15 rounded pointer-events-none shadow-lg"
                        >
                          {ann.label && (
                            <span
                              style={labelStyle}
                              className="absolute text-white text-[11px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap z-20"
                            >
                              {ann.label}
                            </span>
                          )}
                        </div>
                      );
                    }

                    if (ann.shape === 'arrow') {
                      return (
                        <div
                          key={ann.id}
                          style={{
                            left: `${ann.x}%`,
                            top: `${ann.y}%`,
                            transform: 'none',
                          }}
                          className="absolute pointer-events-none select-none z-20"
                        >
                          <div className="relative">
                            <div
                              style={{
                                left: '0px',
                                top: '0px',
                                transform: 'translate(-50%, -50%)',
                                borderColor: ann.color || '#ef4444',
                              }}
                              className="w-6 h-6 rounded-full border-2 absolute animate-ping opacity-60"
                            />
                            <div
                              style={{
                                left: '0px',
                                top: '0px',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: ann.color || '#ef4444',
                              }}
                              className="w-2.5 h-2.5 rounded-full absolute ring-2 ring-white shadow-xs"
                            />
                            <svg
                              width="28"
                              height="28"
                              viewBox="0 0 28 28"
                              className="drop-shadow-xl"
                              style={{ fill: ann.color || '#ef4444' }}
                            >
                              <path
                                d="M 0 0 L 0 20 L 5.5 15.5 L 9.5 24.5 L 12.8 23 L 8.8 14 L 15 14 Z"
                                stroke="#ffffff"
                                strokeWidth="1.8"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          {ann.label && (
                            <span
                              style={{ backgroundColor: ann.color || '#ef4444' }}
                              className="absolute text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap ml-6 -mt-1"
                            >
                              {ann.label}
                            </span>
                          )}
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
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-3 flex items-center justify-center cursor-pointer pointer-events-none"
                      >
                        <div
                          style={{ backgroundColor: ann.color || '#ef4444' }}
                          className="w-4 h-4 rounded-full animate-ping opacity-80"
                        />
                        <div
                          style={{ backgroundColor: ann.color || '#ef4444' }}
                          className="w-3.5 h-3.5 rounded-full absolute"
                        />
                        {ann.label && (() => {
                          const isNearTop = (ann.y || 0) < 16;
                          const isNearBottom = (ann.y || 0) > 82;
                          const pos = ann.labelPosition || (isNearTop ? 'bottom' : (isNearBottom ? 'top' : 'top'));
                          const color = ann.color || '#ef4444';
                          let labelStyle: React.CSSProperties = {
                            backgroundColor: color,
                          };
                          if (ann.labelPosition === 'custom' && (ann.labelOffsetX !== undefined || ann.labelOffsetY !== undefined)) {
                            labelStyle.top = '0px';
                            labelStyle.left = '0px';
                            labelStyle.transform = `translate(${ann.labelOffsetX || 0}px, ${ann.labelOffsetY || 0}px)`;
                          } else if (pos === 'bottom') {
                            labelStyle.top = 'calc(100% + 6px)';
                            labelStyle.left = '50%';
                            labelStyle.transform = 'translateX(-50%)';
                          } else if (pos === 'right') {
                            labelStyle.top = '50%';
                            labelStyle.left = 'calc(100% + 6px)';
                            labelStyle.transform = 'translateY(-50%)';
                          } else if (pos === 'left') {
                            labelStyle.top = '50%';
                            labelStyle.right = 'calc(100% + 6px)';
                            labelStyle.transform = 'translateY(-50%)';
                          } else if (pos === 'inside') {
                            labelStyle.top = '50%';
                            labelStyle.left = '50%';
                            labelStyle.transform = 'translate(-50%, -50%)';
                          } else {
                            labelStyle.bottom = 'calc(100% + 6px)';
                            labelStyle.left = '50%';
                            labelStyle.transform = 'translateX(-50%)';
                          }
                          return (
                            <span
                              style={labelStyle}
                              className="absolute text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap border border-white/30 z-20"
                            >
                              {ann.label}
                            </span>
                          );
                        })()}
                      </div>
                    );
                  })}

                <button
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-800 text-white p-2 rounded-lg text-xs backdrop-blur border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={isZoomed ? 'Reducir zoom' : 'Aumentar zoom'}
                >
                  {isZoomed ? <Minimize2 className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="text-center p-8 text-slate-500">
                <p className="text-sm">No hay captura adjunta a este paso.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Controls */}
      <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-between z-10">
        <button
          onClick={goToPrev}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        {/* Step dots */}
        <div className="hidden sm:flex items-center gap-1.5">
          {manual.steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStepIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'bg-indigo-500 w-6'
                  : completedSteps[s.id]
                  ? 'bg-emerald-500'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              title={`Ir al paso ${idx + 1}`}
            />
          ))}
        </div>

        {currentStepIndex === totalSteps - 1 ? (
          <button
            onClick={() => {
              triggerCelebration();
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>¡Finalizar Guía!</span>
          </button>
        ) : (
          <button
            onClick={goToNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <span>Siguiente Paso</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
