import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

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
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    if (activeSessionStopFn === handleInternalStop) {
      activeSessionStopFn = null;
    }
  };

  const handleInternalStop = () => {
    stopDictation();
  };

  const startDictation = () => {
    setErrorMessage(null);
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setErrorMessage('Navegador no compatible. Usa Chrome, Edge o Safari.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    // Stop any other active dictation button first
    if (activeSessionStopFn && activeSessionStopFn !== handleInternalStop) {
      activeSessionStopFn();
    }
    activeSessionStopFn = handleInternalStop;

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
        if (event.error === 'no-speech') {
          return;
        }
        if (event.error === 'not-allowed') {
          setErrorMessage('Permiso de micrófono denegado en el navegador');
        } else {
          setErrorMessage(`Error: ${event.error}`);
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

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isListening) {
      stopDictation();
    } else {
      startDictation();
    }
  };

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
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        title={
          isListening
            ? 'Detener dictado por voz'
            : errorMessage
            ? errorMessage
            : title
        }
        aria-label={isListening ? 'Detener dictado por voz' : title}
        className={`relative inline-flex items-center justify-center rounded-md transition-all duration-150 focus:outline-none shrink-0 ${btnPaddings[size]} ${
          isListening
            ? 'bg-red-50 text-red-600 ring-2 ring-red-400/80 shadow-xs'
            : errorMessage
            ? 'bg-amber-50 text-amber-600'
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
          <AlertCircle className={iconSizes[size]} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>

      {errorMessage && (
        <span className="absolute bottom-full right-0 mb-1 z-50 whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none animate-fade-in">
          {errorMessage}
        </span>
      )}
    </div>
  );
};
