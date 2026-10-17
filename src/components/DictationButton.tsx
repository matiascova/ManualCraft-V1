import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  AlertCircle,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  X,
  CheckCircle2,
} from 'lucide-react';

// Global listener coordinator so only one field dictates at a time
let activeSessionStopFn: (() => void) | null = null;

interface DictationButtonProps {
  value: string;
  onChange: (newValue: string) => void;
  lang?: string;
  className?: string;
  title?: string;
  size?: 'xs' | 'sm' | 'md';
}

export const DictationButton: React.FC<DictationButtonProps> = ({
  value,
  onChange,
  lang = 'es-ES',
  className = '',
  title = 'Dictar por voz',
  size = 'sm',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [permissionSuccess, setPermissionSuccess] = useState(false);

  const recognitionRef = useRef<any>(null);
  const baseValueRef = useRef<string>('');
  const finalAccumulatedRef = useRef<string>('');

  useEffect(() => {
    return () => {
      stopDictation();
    };
  }, []);

  const stopDictation = () => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try {
        rec.onerror = null;
        rec.onend = null;
        rec.onresult = null;
        rec.abort();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
    if (activeSessionStopFn === handleInternalStop) {
      activeSessionStopFn = null;
    }
  };

  const handleInternalStop = () => {
    stopDictation();
  };

  /**
   * Tests and explicitly requests microphone permission via getUserMedia.
   * This triggers the native browser prompt ("Allow microphone?") if not yet decided,
   * or throws NotAllowedError if explicitly blocked.
   */
  const testAndRequestMic = async (): Promise<boolean> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Free audio hardware stream immediately so SpeechRecognition can take over
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err: any) {
      console.warn('Microphone permission check error:', err);
      return false;
    }
  };

  const handleRetryPermission = async () => {
    setIsRetrying(true);
    setPermissionSuccess(false);
    const granted = await testAndRequestMic();
    setIsRetrying(false);

    if (granted) {
      setPermissionSuccess(true);
      setErrorMessage(null);
      setTimeout(() => {
        setShowPermissionHelp(false);
        setPermissionSuccess(false);
        startDictationInternal();
      }, 700);
    } else {
      setShowPermissionHelp(true);
    }
  };

  const startDictationInternal = async () => {
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setErrorMessage('Navegador no compatible. Usa Chrome, Edge o Safari.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    // Stop any other active dictation button first
    let hadOtherSession = false;
    if (activeSessionStopFn && activeSessionStopFn !== handleInternalStop) {
      hadOtherSession = true;
      activeSessionStopFn();
    }
    activeSessionStopFn = handleInternalStop;

    if (hadOtherSession) {
      // Yield slightly so the browser audio capture hardware cleans up between inputs
      await new Promise((r) => setTimeout(r, 80));
    }

    baseValueRef.current = value || '';
    finalAccumulatedRef.current = '';

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let newFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || '';
          if (res.isFinal) {
            newFinal += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        if (newFinal) {
          finalAccumulatedRef.current += newFinal;
        }

        const currentSpoken = (finalAccumulatedRef.current + interimText).trim();
        if (currentSpoken) {
          const base = baseValueRef.current.trim();
          let combined = '';
          if (base) {
            const needsSpace = !base.endsWith(' ') && !base.endsWith('\n');
            combined = `${base}${needsSpace ? ' ' : ''}${currentSpoken}`;
          } else {
            // Capitalize first letter of newly spoken sentence
            combined = currentSpoken.charAt(0).toUpperCase() + currentSpoken.slice(1);
          }
          onChange(combined);
        }
      };

      recognition.onerror = (event: any) => {
        const err = event.error;
        // 'no-speech' and 'aborted' are normal lifecycle events (silence or switching fields), not errors
        if (err === 'no-speech' || err === 'aborted') {
          setIsListening(false);
          return;
        }
        if (err === 'not-allowed') {
          setErrorMessage('Permiso de micrófono denegado en el navegador');
          setShowPermissionHelp(true);
        } else if (err === 'network') {
          setErrorMessage('Error de red al transcribir');
        } else if (err === 'audio-capture') {
          setErrorMessage('Micrófono no disponible');
        } else {
          setErrorMessage(`Error: ${err}`);
        }
        setTimeout(() => setErrorMessage(null), 3500);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (activeSessionStopFn === handleInternalStop) {
          activeSessionStopFn = null;
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage('No se pudo activar el micrófono');
      setTimeout(() => setErrorMessage(null), 3500);
      setIsListening(false);
    }
  };

  const startDictation = async () => {
    setErrorMessage(null);

    // 1. Check if browser supports Web Speech API
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setErrorMessage('Navegador no compatible. Usa Chrome, Edge o Safari.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    // 2. Query permissions API if available
    if (navigator.permissions && (navigator.permissions as any).query) {
      try {
        const perm = await (navigator.permissions as any).query({
          name: 'microphone',
        });
        if (perm.state === 'denied') {
          setErrorMessage('Permiso de micrófono denegado en el navegador');
          setShowPermissionHelp(true);
          return;
        }
      } catch (e) {
        // Permissions query for microphone not supported in all browsers, proceed
      }
    }

    // 3. Proactively trigger getUserMedia if possible to prompt native allow dialog
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (mediaErr: any) {
        if (
          mediaErr.name === 'NotAllowedError' ||
          mediaErr.name === 'PermissionDeniedError'
        ) {
          setErrorMessage('Permiso de micrófono denegado en el navegador');
          setShowPermissionHelp(true);
          setTimeout(() => setErrorMessage(null), 4000);
          return;
        }
      }
    }

    // 4. Start speech recognition engine
    startDictationInternal();
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isListening) {
      stopDictation();
    } else {
      startDictation();
    }
  };

  const handleOpenStandaloneTab = () => {
    try {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Failed to open standalone tab:', e);
    }
  };

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  const btnPaddings = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-1.5',
  };

  return (
    <>
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={handleToggle}
          title={
            isListening
              ? 'Detener dictado por voz'
              : errorMessage
              ? `${errorMessage} (Clic para ver ayuda)`
              : title
          }
          aria-label={isListening ? 'Detener dictado por voz' : title}
          className={`relative inline-flex items-center justify-center rounded-md transition-all duration-150 focus:outline-none shrink-0 ${btnPaddings[size]} ${
            isListening
              ? 'bg-red-50 text-red-600 ring-2 ring-red-400/80 shadow-xs'
              : errorMessage
              ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-300'
              : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100/80 active:scale-95'
          } ${className}`}
        >
          {isListening ? (
            <>
              <Mic className={`${iconSizes[size]} text-red-600 animate-pulse`} />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </>
          ) : errorMessage ? (
            <AlertCircle className={`${iconSizes[size]} text-amber-600`} />
          ) : (
            <Mic className={iconSizes[size]} />
          )}
        </button>

        {errorMessage && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPermissionHelp(true);
            }}
            className="absolute bottom-full right-0 mb-1 z-50 whitespace-nowrap bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-md shadow-xl flex items-center gap-1.5 hover:bg-slate-800 transition-all cursor-pointer animate-fade-in"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{errorMessage}</span>
            <span className="text-[10px] text-indigo-300 underline font-semibold ml-1">
              Resolver
            </span>
          </button>
        )}
      </div>

      {/* Permission Guidance Modal */}
      {showPermissionHelp && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPermissionHelp(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-800 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowPermissionHelp(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Permiso de micrófono bloqueado en tu navegador
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  El navegador impidió el acceso al micrófono para el dictado por voz. Sigue estos pasos para activarlo en 2 clics:
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  <span className="font-semibold text-slate-900">
                    En la barra de direcciones de tu navegador (URL):
                  </span>
                  <p className="text-slate-600 mt-0.5">
                    Haz clic en el ícono del <strong className="text-slate-800">candado</strong> 🔒 o de <strong className="text-slate-800">ajustes del sitio</strong> (a la izquierda de la dirección web o el ícono de micrófono tachado en la barra).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <div>
                  <span className="font-semibold text-slate-900">
                    Cambia la opción de Micrófono a "Permitir":
                  </span>
                  <p className="text-slate-600 mt-0.5">
                    Localiza <strong className="text-slate-800">Micrófono</strong> y cambia de <em>"Bloqueado"</em> a <strong className="text-emerald-600">"Permitir"</strong>.
                  </p>
                </div>
              </div>

              {isInIframe && (
                <div className="flex items-start gap-2.5 bg-indigo-50/70 border border-indigo-200/60 rounded-lg p-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <div>
                    <span className="font-semibold text-indigo-900">
                      Entorno de Vista Previa (iFrame):
                    </span>
                    <p className="text-indigo-700 mt-0.5">
                      Algunos navegadores restringen el micrófono dentro de ventanas de vista previa. Abre la aplicación en una pestaña independiente para conceder permiso nativo.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {permissionSuccess && (
              <div className="mt-3.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">
                  ¡Permiso de micrófono concedido con éxito! Iniciando dictado...
                </span>
              </div>
            )}

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              {isInIframe && (
                <button
                  type="button"
                  onClick={handleOpenStandaloneTab}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir en pestaña independiente
                </button>
              )}

              <button
                type="button"
                onClick={handleRetryPermission}
                disabled={isRetrying}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`}
                />
                {isRetrying
                  ? 'Verificando...'
                  : 'Reintentar y Solicitar Permiso'}
              </button>

              <button
                type="button"
                onClick={() => setShowPermissionHelp(false)}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
