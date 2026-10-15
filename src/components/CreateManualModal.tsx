import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Video,
  MonitorPlay,
  Sparkles,
  X,
  Trash2,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  FileText,
  AlertCircle,
  Plus,
  Mic,
  MicOff,
  Radio,
  Volume2,
  Subtitles,
  MessageSquareQuote,
  Headphones,
  Edit2,
  Check,
  RotateCcw,
  RefreshCw,
  History,
  Save,
  FolderKanban,
  Building2,
  Shield,
  ShieldCheck,
  GraduationCap,
  Target,
} from 'lucide-react';
import { VideoFrameCandidate, UserManual, InstructorTranscriptSegment } from '../types/manual';
import { Project } from '../types/project';
import { extractFramesFromVideo } from '../utils/videoExtractor';
import { screenRecorder } from '../utils/screenRecorder';
import { screenActionDetector, AutoCapturedSnapshot } from '../utils/motionDetector';
import { speechTranscriptionService, TranscriptionStatus } from '../utils/speechTranscription';

const DRAFT_STORAGE_KEY = 'manualcraft_create_manual_draft_v1';

export interface CreateManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualCreated: (manual: UserManual) => void;
  onManualUpdated?: (manual: UserManual) => void;
  existingManual?: UserManual | null;
  onOpenSimulator?: () => void;
  initialTab?: 'screenshots' | 'video' | 'record';
  projects?: Project[];
  activeProjectId?: string;
}

export const CreateManualModal: React.FC<CreateManualModalProps> = ({
  isOpen,
  onClose,
  onManualCreated,
  onManualUpdated,
  existingManual = null,
  onOpenSimulator,
  initialTab = 'screenshots',
  projects = [],
  activeProjectId = '',
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    existingManual?.projectId || activeProjectId || projects[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'screenshots' | 'video' | 'record'>('screenshots');
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [targetAudience, setTargetAudience] = useState('Usuarios finales y colaboradores');
  const [saveMode, setSaveMode] = useState<'update' | 'new_version'>('update');
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [pedagogicalApproach, setPedagogicalApproach] = useState<'sop' | 'microlearning' | 'onboarding'>('sop');
  const [autoAnonymizePii, setAutoAnonymizePii] = useState(true);

  // Screenshots state
  const [screenshots, setScreenshots] = useState<Array<{ id: string; dataUrl: string; name: string }>>([]);

  // Video extraction state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [extractedFrames, setExtractedFrames] = useState<VideoFrameCandidate[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState({ pct: 0, status: '' });
  const [frameInterval, setFrameInterval] = useState<number>(3); // seconds

  // Screen recording state with Auto-Action detection
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [autoSnapshots, setAutoSnapshots] = useState<AutoCapturedSnapshot[]>([]);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const recordTimerRef = useRef<any>(null);

  // Instructor Speech Transcription (Teams Style)
  const [enableInstructorAudio, setEnableInstructorAudio] = useState(true);
  const [transcriptionStatus, setTranscriptionStatus] = useState<TranscriptionStatus>('inactive');
  const [interimSpeech, setInterimSpeech] = useState('');
  const [instructorTranscripts, setInstructorTranscripts] = useState<InstructorTranscriptSegment[]>([]);
  const [micVolume, setMicVolume] = useState(0);
  const [newSpeechInput, setNewSpeechInput] = useState('');
  const [editingTranscriptId, setEditingTranscriptId] = useState<string | null>(null);
  const [editingTranscriptText, setEditingTranscriptText] = useState('');

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Scroll transcript to bottom when new item arrives
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [instructorTranscripts, interimSpeech]);

  // Clean up recorded video blob URLs to prevent massive memory leaks
  useEffect(() => {
    return () => {
      if (recordedVideoUrl && recordedVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  // Load existing manual data or saved draft when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (existingManual) {
      setTopic(existingManual.title || '');
      setContext(existingManual.overview || '');
      setTargetAudience(existingManual.targetAudience || 'Usuarios finales y colaboradores');
      setActiveTab('record');
      setSaveMode('update');
      // If manual had an existing instructor transcript, pre-populate if needed
      if (existingManual.instructorTranscript && existingManual.instructorTranscript.length > 0) {
        setInstructorTranscripts(existingManual.instructorTranscript);
      }
    } else {
      // Try to recover draft data so the user never loses what they typed
      try {
        const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.topic && !topic) setTopic(parsed.topic);
          if (parsed.context && !context) setContext(parsed.context);
          if (parsed.targetAudience && (!targetAudience || targetAudience === 'Usuarios finales y colaboradores')) {
            setTargetAudience(parsed.targetAudience);
          }
        }
      } catch (e) {
        // ignore
      }
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, existingManual]);

  // Persist draft to sessionStorage so user never loses what was filled
  useEffect(() => {
    if (!existingManual && (topic || context)) {
      try {
        sessionStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ topic, context, targetAudience })
        );
      } catch (e) {
        // ignore
      }
    }
  }, [topic, context, targetAudience, existingManual]);

  const handleClearDraft = () => {
    setTopic('');
    setContext('');
    setTargetAudience('Usuarios finales y colaboradores');
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  // Handle Clipboard Paste (Ctrl+V) for instant screenshot pasting
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setScreenshots((prev) => [
                  ...prev,
                  {
                    id: `paste-${Date.now()}-${Math.random()}`,
                    dataUrl: event.target!.result as string,
                    name: `Captura pegada ${prev.length + 1}`,
                  },
                ]);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Multi Screenshots upload
  const handleScreenshotFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setScreenshots((prev) => [
              ...prev,
              {
                id: `img-${Date.now()}-${Math.random()}`,
                dataUrl: e.target!.result as string,
                name: file.name,
              },
            ]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  // Handle Video Upload & Frame Extraction
  const handleVideoSelected = async (file: File) => {
    setVideoFile(file);
    setIsExtracting(true);
    setExtractionProgress({ pct: 0, status: 'Cargando video...' });
    setErrorMessage(null);
    try {
      const frames = await extractFramesFromVideo(file, {
        maxFrames: 10,
        intervalSeconds: frameInterval,
        onProgress: (pct, status) => {
          setExtractionProgress({ pct, status });
        },
      });
      setExtractedFrames(frames);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar el video');
    } finally {
      setIsExtracting(false);
    }
  };

  // Start Screen Recording with Action Detection & Real-Time MS Teams Style Speech Transcription
  const handleStartRecording = async (appendMode = false) => {
    setErrorMessage(null);
    if (!appendMode) {
      setAutoSnapshots([]);
      setExtractedFrames([]);
      setRecordedVideoUrl(null);
      setInstructorTranscripts([]);
    }
    setInterimSpeech('');

    try {
      setIsRecording(true);
      setRecordingDuration(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Start screen recorder
      const stream = await screenRecorder.startRecording(async (session) => {
        setIsRecording(false);
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        screenActionDetector.stop();

        // Stop speech transcription if active
        if (enableInstructorAudio) {
          const finalTranscripts = speechTranscriptionService.stop();
          if (finalTranscripts.length > 0) {
            setInstructorTranscripts((prev) => (appendMode ? [...prev, ...finalTranscripts] : finalTranscripts));
          }
          setTranscriptionStatus('inactive');
          setMicVolume(0);
          setInterimSpeech('');
        }

        setRecordedVideoUrl(session.videoUrl);

        // Convert blob to File
        const recordedFile = new File([session.blob], 'grabacion-pantalla.webm', {
          type: session.blob.type,
        });

        // If we collected auto snapshots, integrate them directly into extractedFrames
        if (autoSnapshots.length > 0) {
          const snapshotFrames: VideoFrameCandidate[] = autoSnapshots.map((s, idx) => ({
            id: s.id,
            timestamp: s.timestamp,
            dataUrl: s.dataUrl,
            selected: true,
            label: s.label || `Acción ${idx + 1}`,
          }));
          setExtractedFrames((prev) => (appendMode ? [...prev, ...snapshotFrames] : snapshotFrames));
        } else {
          await handleVideoSelected(recordedFile);
        }
      });

      // Start live instructor audio transcription
      if (enableInstructorAudio) {
        await speechTranscriptionService.start(
          {
            onInterim: (txt) => setInterimSpeech(txt),
            onSentence: (segment) => {
              setInstructorTranscripts((prev) => [...prev, segment]);
            },
            onStatusChange: (status, msg) => {
              setTranscriptionStatus(status);
              if (msg && status === 'error') {
                console.warn('Speech recognition warning:', msg);
              }
            },
            onVolume: (vol) => setMicVolume(vol),
          },
          'es-ES'
        );
      }

      // Hook live action detector
      if (autoDetectEnabled) {
        screenActionDetector.start(stream, (snapshot) => {
          setAutoSnapshots((prev) => [...prev, snapshot]);
        });
      }
    } catch (err: any) {
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      screenActionDetector.stop();
      if (enableInstructorAudio) {
        speechTranscriptionService.stop();
        setTranscriptionStatus('inactive');
      }
      if (err.name !== 'NotAllowedError') {
        setErrorMessage('No se pudo acceder a la pantalla o micrófono. Comprueba los permisos del navegador.');
      }
    }
  };

  // Regenerate recording without losing topic, context, audience, etc.
  const handleRegenerateRecording = (mode: 'replace' | 'append' = 'replace') => {
    setShowRegenerateConfirm(false);
    handleStartRecording(mode === 'append');
  };

  const handleClearRecordingOnly = () => {
    setAutoSnapshots([]);
    setExtractedFrames([]);
    setRecordedVideoUrl(null);
    setInstructorTranscripts([]);
    setInterimSpeech('');
    setRecordingDuration(0);
    setShowRegenerateConfirm(false);
  };

  const handleStopRecording = () => {
    screenActionDetector.stop();
    screenRecorder.stopRecording();
    if (enableInstructorAudio) {
      const finalTranscripts = speechTranscriptionService.stop();
      if (finalTranscripts.length > 0) {
        setInstructorTranscripts(finalTranscripts);
      }
      setTranscriptionStatus('inactive');
      setMicVolume(0);
      setInterimSpeech('');
    }
    setIsRecording(false);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
  };

  const handleTriggerActionSnapshot = (reason: 'click' | 'enter' | 'save' | 'type') => {
    let label = 'Clic detectado';
    if (reason === 'enter') label = 'Tecla Enter presionada';
    if (reason === 'save') label = 'Acción Grabar/Guardar';
    if (reason === 'type') label = 'Dato completado';
    screenActionDetector.captureNow(reason === 'type' ? 'change_detected' : reason, label);
  };

  // Add simulated instructor voice phrase (convenient for testing or dictating manually)
  const handleAddInstructorSpeechPhrase = (text: string) => {
    const currentSecs = isRecording ? recordingDuration : (instructorTranscripts.length * 5 + 3);
    const newSeg = speechTranscriptionService.addManualSegment(text, currentSecs);
    setInstructorTranscripts((prev) => [...prev, newSeg]);
  };

  const handleSaveEditTranscript = (id: string) => {
    if (!editingTranscriptText.trim()) return;
    setInstructorTranscripts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text: editingTranscriptText.trim() } : t))
    );
    setEditingTranscriptId(null);
    setEditingTranscriptText('');
  };

  const handleDeleteTranscript = (id: string) => {
    setInstructorTranscripts((prev) => prev.filter((t) => t.id !== id));
  };

  // Run AI Generation with Instructor Speech Transcription Enrichment
  const handleGenerateManual = async () => {
    setErrorMessage(null);
    let imagesToSend: Array<{ dataUrl: string; label?: string; timestamp?: number }> = [];

    if (activeTab === 'screenshots') {
      if (screenshots.length === 0) {
        setErrorMessage('Por favor sube o pega al menos una captura de pantalla.');
        return;
      }
      imagesToSend = screenshots.map((s) => ({
        dataUrl: s.dataUrl,
        label: s.name,
      }));
    } else {
      const selected = extractedFrames.filter((f) => f.selected);
      if (selected.length === 0) {
        setErrorMessage('Por favor selecciona al menos un fotograma o acción capturada.');
        return;
      }
      imagesToSend = selected.map((f) => ({
        dataUrl: f.dataUrl,
        label: f.label,
        timestamp: f.timestamp,
      }));
    }

    setIsGenerating(true);
    setGenerationStage('Analizando capturas de pantalla y correlacionando con el audio del instructor...');

    try {
      const timer1 = setTimeout(() => {
        setGenerationStage(
          instructorTranscripts.length > 0
            ? 'Enriqueciendo las instrucciones y consejos con las palabras del instructor...'
            : 'Reconociendo clics, campos y botones con Gemini AI...'
        );
      }, 2500);

      const timer2 = setTimeout(() => {
        setGenerationStage('Redactando manual estructurado paso a paso con citas y explicaciones operativas...');
      }, 5000);

      // Build instructor transcription payload if present
      const fullTranscriptionText = instructorTranscripts
        .map((t) => `[${speechTranscriptionService.formatTime(t.timestamp)}] ${t.text}`)
        .join('\n');

      const response = await fetch('/api/generate-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim() || 'Procedimiento de Sistema',
          context: context.trim(),
          targetAudience: targetAudience.trim(),
          images: imagesToSend,
          instructorTranscription:
            instructorTranscripts.length > 0
              ? {
                  fullText: fullTranscriptionText,
                  items: instructorTranscripts,
                }
              : undefined,
          language: 'es',
          pedagogicalApproach,
          autoAnonymizePii,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo generar el manual.');
      }

      const generated = data.manual;
      if (existingManual) {
        if (saveMode === 'update' && onManualUpdated) {
          const updatedManual: UserManual = {
            ...existingManual,
            title: topic.trim() || existingManual.title,
            overview: context.trim() || existingManual.overview,
            targetAudience: targetAudience.trim() || existingManual.targetAudience,
            steps: generated.steps,
            instructorTranscript:
              instructorTranscripts.length > 0 ? instructorTranscripts : existingManual.instructorTranscript,
            fullTranscriptionText: fullTranscriptionText || existingManual.fullTranscriptionText,
            updatedAt: new Date().toISOString(),
          };
          onManualUpdated(updatedManual);
          onClose();
          return;
        } else {
          const currVer = parseFloat(existingManual.version || '1.0');
          const nextVer = isNaN(currVer) ? '2.0' : (currVer + 0.1).toFixed(1);
          const newVersionManual: UserManual = {
            ...generated,
            id: `manual-${Date.now()}`,
            title: topic.trim() || existingManual.title,
            version: nextVer,
            overview: context.trim() || existingManual.overview,
            targetAudience: targetAudience.trim() || existingManual.targetAudience,
            projectId: selectedProjectId || existingManual.projectId,
            instructorTranscript:
              instructorTranscripts.length > 0 ? instructorTranscripts : existingManual.instructorTranscript,
            fullTranscriptionText: fullTranscriptionText || existingManual.fullTranscriptionText,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          onManualCreated(newVersionManual);
          onClose();
          return;
        }
      }

      generated.projectId = selectedProjectId || 'prj-weber-sap';
      onManualCreated(generated);
      onClose();
    } catch (err: any) {
      console.error(err);
      const rawMsg = err.message || '';
      if (rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE')) {
        setErrorMessage(
          'Los servidores de Google Gemini están experimentando alta demanda temporal (Error 503). Puedes reintentar ahora o crear el manual directamente con tus capturas guardadas.'
        );
      } else {
        setErrorMessage(rawMsg || 'Error durante la generación con inteligencia artificial.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Immediate manual compilation from screenshots without external API wait, also enriched with instructor audio!
  const handleGenerateDirectManual = () => {
    let images: Array<{ dataUrl: string; label?: string; timestamp?: number }> = [];
    if (activeTab === 'screenshots') {
      images = screenshots.map((s) => ({ dataUrl: s.dataUrl, label: s.name }));
    } else {
      const selected = extractedFrames.filter((f) => f.selected);
      images = selected.map((f) => ({ dataUrl: f.dataUrl, label: f.label, timestamp: f.timestamp }));
    }

    if (images.length === 0) return;

    const steps = images.map((img, idx) => {
      // Find matching instructor speech for this step
      let stepInstructorNote = '';
      let stepInstructorQuote = '';
      if (instructorTranscripts.length > 0) {
        const matchedTrans =
          img.timestamp !== undefined
            ? instructorTranscripts.find((t) => Math.abs(t.timestamp - img.timestamp!) <= 4)
            : instructorTranscripts[idx] || instructorTranscripts[0];
        if (matchedTrans) {
          stepInstructorNote = matchedTrans.text;
          stepInstructorQuote = matchedTrans.text;
        }
      }

      return {
        id: `step-${Date.now()}-${idx}`,
        stepNumber: idx + 1,
        title: img.label || `Paso ${idx + 1}: Realizar acción`,
        actionType: 'click' as const,
        description: `Ejecuta la acción indicada en la captura de pantalla para completar este paso dentro del flujo de ${topic || 'la tarea'}.`,
        targetElement: img.label || 'Elemento en pantalla',
        expectedResult: 'El sistema valida la acción realizada y avanza al siguiente paso.',
        purpose: `Garantizar la correcta ejecución del paso ${idx + 1} dentro del procedimiento de ${topic || 'la tarea'}.`,
        instructorNotes: stepInstructorNote,
        instructorAudioQuote: stepInstructorQuote,
        image: img.dataUrl,
        annotations: [
          {
            id: `ann-${idx}`,
            x: 50,
            y: 50,
            shape: 'circle' as const,
            color: '#ef4444',
            label: img.label || `Paso ${idx + 1}`,
          },
        ],
      };
    });

    const fullTranscriptionText = instructorTranscripts
      .map((t) => `[${speechTranscriptionService.formatTime(t.timestamp)}] ${t.text}`)
      .join('\n');

    const directManual: UserManual = {
      id: `manual-${Date.now()}`,
      title: topic.trim() || 'Manual de Usuario',
      subtitle: 'Guía paso a paso generada a partir de capturas de pantalla y voz del instructor',
      overview: context.trim() || 'Guía de procedimiento creada a partir de las acciones, pantallas y transcripción de voz del instructor.',
      targetAudience,
      estimatedMinutes: Math.max(3, steps.length * 2),
      difficulty: 'Principiante',
      prerequisites: ['Acceso con credenciales al sistema'],
      steps,
      summaryChecklist: ['Completar todas las acciones de la secuencia'],
      instructorTranscript: instructorTranscripts,
      fullTranscriptionText,
      pedagogicalApproach,
      projectId: selectedProjectId || 'prj-weber-sap',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0',
    };

    if (existingManual) {
      if (saveMode === 'update' && onManualUpdated) {
        const updatedManual: UserManual = {
          ...existingManual,
          title: topic.trim() || existingManual.title,
          overview: context.trim() || existingManual.overview,
          targetAudience: targetAudience.trim() || existingManual.targetAudience,
          projectId: selectedProjectId || existingManual.projectId,
          steps,
          instructorTranscript:
            instructorTranscripts.length > 0 ? instructorTranscripts : existingManual.instructorTranscript,
          fullTranscriptionText: fullTranscriptionText || existingManual.fullTranscriptionText,
          updatedAt: new Date().toISOString(),
        };
        onManualUpdated(updatedManual);
        onClose();
        return;
      } else {
        const currVer = parseFloat(existingManual.version || '1.0');
        const nextVer = isNaN(currVer) ? '2.0' : (currVer + 0.1).toFixed(1);
        const newVersionManual: UserManual = {
          ...directManual,
          id: `manual-${Date.now()}`,
          title: topic.trim() || existingManual.title,
          version: nextVer,
          projectId: selectedProjectId || existingManual.projectId,
          overview: context.trim() || existingManual.overview,
          targetAudience: targetAudience.trim() || existingManual.targetAudience,
          instructorTranscript:
            instructorTranscripts.length > 0 ? instructorTranscripts : existingManual.instructorTranscript,
          fullTranscriptionText: fullTranscriptionText || existingManual.fullTranscriptionText,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        onManualCreated(newVersionManual);
        onClose();
        return;
      }
    }

    onManualCreated(directManual);
    onClose();
  };

  const toggleFrameSelection = (id: string) => {
    setExtractedFrames((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-[98vw] max-w-[98vw] h-[98vh] max-h-[98vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${existingManual ? 'bg-amber-600 shadow-amber-200' : 'bg-indigo-600 shadow-indigo-200'} flex items-center justify-center text-white shadow-md`}>
              {existingManual ? <RotateCcw className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>{existingManual ? 'Regenerar Grabación del Manual' : 'Nuevo Manual de Usuario con IA'}</span>
                {existingManual ? (
                  <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                    <RotateCcw className="w-3 h-3 text-amber-700" /> Conservando Datos Llenados
                  </span>
                ) : (
                  <span className="text-[11px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Mic className="w-3 h-3" /> Transcripción en Vivo Tipo MS Teams
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                {existingManual
                  ? `Graba una nueva secuencia de pantallas y voz para «${existingManual.title}». Todo lo que llenaste al crearlo por primera vez se mantiene guardado.`
                  : 'Graba tu pantalla mientras explicas por micrófono. El sistema transcribirá tu voz y enriquecerá automáticamente el manual con tus explicaciones.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Regeneration Notice Banner if editing existing manual */}
          {existingManual && (
            <div className="bg-gradient-to-r from-amber-50 via-orange-50/40 to-indigo-50/50 border border-amber-300 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-amber-950 uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                      Modo Regeneración Activo
                    </span>
                    <span className="text-xs text-slate-600 font-medium truncate max-w-sm">
                      {existingManual.title}
                    </span>
                  </div>
                  <p className="text-xs text-amber-950 mt-0.5">
                    <strong>Los datos originales se han conservado:</strong> El título, notas de contexto y público objetivo ya están llenos. Graba la nueva sesión para renovar capturas y la transcripción del instructor.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0 bg-white px-2.5 py-1.5 rounded-lg border border-amber-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-700">Guardar como:</span>
                <select
                  value={saveMode}
                  onChange={(e) => setSaveMode(e.target.value as 'update' | 'new_version')}
                  className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="update">Actualizar manual actual (mantener ID)</option>
                  <option value="new_version">
                    Nueva versión (v{(parseFloat(existingManual.version || '1.0') + 0.1).toFixed(1)})
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {projects && projects.length > 0 && (
              <div className="md:col-span-2 bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      Proyecto Asociado
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Este manual se incorporará dentro de la solución del cliente seleccionado
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full sm:w-auto text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.clientName} · {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                Título o Tarea a Documentar *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej. Cómo autorizar una orden de compra en el ERP"
                className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                Público Objetivo
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ej. Clientes nuevos, equipo de ventas"
                className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                Notas / Contexto Adicional (Opcional)
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Ej. Enfatizar que se debe revisar el número de referencia antes de guardar"
                className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Pedagogical Approach (4C/ID) & PII Auto-Anonymization */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Enfoque Pedagógico (Diseño Instruccional 4C/ID)</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPedagogicalApproach('sop')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      pedagogicalApproach === 'sop'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold">SOP Formal</div>
                    <div className="text-[10px] opacity-80">Rigor & Auditoría</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPedagogicalApproach('microlearning')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      pedagogicalApproach === 'microlearning'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold">Guía Rápida</div>
                    <div className="text-[10px] opacity-80">Microaprendizaje</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPedagogicalApproach('onboarding')}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      pedagogicalApproach === 'onboarding'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold">Capacitación</div>
                    <div className="text-[10px] opacity-80">Didáctico / Onboarding</div>
                  </button>
                </div>
              </div>

              {/* PII Anonymization Toggle */}
              <div className="flex flex-col justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Privacidad & Anonimización Automática (PII)</span>
                </label>
                <div
                  onClick={() => setAutoAnonymizePii(!autoAnonymizePii)}
                  className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    autoAnonymizePii
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${autoAnonymizePii ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold">
                      {autoAnonymizePii ? 'Difuminar datos sensibles (Emails, RUT, Tarjetas)' : 'Sin difuminado automático de datos'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${autoAnonymizePii ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {autoAnonymizePii ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Preservation notice and clear button */}
            <div className="flex items-center justify-between col-span-1 md:col-span-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200/70 mt-1">
              <span className="flex items-center gap-1.5 text-indigo-700 font-medium">
                <Save className="w-3.5 h-3.5 text-indigo-600" />
                Los datos llenados (tema, contexto y audiencia) se conservan automáticamente y no se borran al regenerar la grabación.
              </span>
              {!existingManual && (topic || context) && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="text-slate-400 hover:text-red-600 transition-colors text-xs font-medium"
                >
                  Limpiar campos
                </button>
              )}
            </div>
          </div>

          {/* Source Tabs */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('record')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'record'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <MonitorPlay className="w-4 h-4" />
                <span>Grabar Pantalla + Transcripción de Voz</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'record' ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-100 text-indigo-700'}`}>
                  Recomendado
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('screenshots')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'screenshots'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Upload className="w-4 h-4" /> Capturas de Pantalla ({screenshots.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === 'video'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Video className="w-4 h-4" /> Subir Video ({extractedFrames.length} fotogramas)
              </button>
            </div>

            {/* TAB 1: SCREEN RECORDING + MS TEAMS STYLE AUDIO TRANSCRIPTION */}
            {activeTab === 'record' && (
              <div className="pt-4 flex flex-col gap-5">
                {/* Pre-recording audio configuration card */}
                {!isRecording && (
                  <div className="p-4 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-slate-50 border border-indigo-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-200">
                        <Mic className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            Escuchar y transcribir al instructor en vivo (tipo MS Teams)
                          </h4>
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                            Voz Activa (Español)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          Mientras grabas tus pantallas, el sistema escuchará tus explicaciones como en una reunión de Teams, transcribiendo cada frase para enriquecer las instrucciones, consejos y advertencias del manual.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto flex-shrink-0">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
                        <input
                          type="checkbox"
                          checked={enableInstructorAudio}
                          onChange={(e) => setEnableInstructorAudio(e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span>Activar micrófono</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Recorder Control Center */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200 gap-4 text-center">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
                      isRecording
                        ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-200'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {isRecording ? <Radio className="w-8 h-8" /> : <MonitorPlay className="w-8 h-8" />}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      {isRecording ? 'Grabando Pantalla y Transcribiendo Voz del Instructor...' : 'Grabador de Pantalla con Detección y Audio'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xl mt-1">
                      {isRecording
                        ? `Tiempo: ${speechTranscriptionService.formatTime(recordingDuration)} · El sistema captura automáticamente cada cambio en pantalla y transcribe en tiempo real todo lo que vas explicando.`
                        : 'Al iniciar la grabación, habla con naturalidad indicando los pasos. El sistema capturará las pantallas y dejará una transcripción para enriquecer el texto.'}
                    </p>
                  </div>

                  {/* ACTIVE RECORDING HUD: LIVE SUBTITLES & TEAMS CAPTIONS */}
                  {isRecording ? (
                    <div className="w-full flex flex-col gap-4 pt-2">
                      {/* MS Teams Live Subtitle Bar */}
                      <div className="w-full bg-slate-900 text-white rounded-xl p-4 shadow-xl border border-slate-800 text-left flex flex-col gap-2 relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                              <Subtitles className="w-4 h-4 text-purple-400" />
                              Subtítulos &amp; Transcripción en Vivo (Reunión con Instructor)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                            <span>Duración: {speechTranscriptionService.formatTime(recordingDuration)}</span>
                            <span>·</span>
                            <span className="text-purple-400">{instructorTranscripts.length} frases registradas</span>
                          </div>
                        </div>

                        {/* Live voice indicator & Active typing caption */}
                        <div className="min-h-[50px] flex items-center gap-3 pt-1">
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 text-white">
                            <Mic className="w-4 h-4 animate-bounce" />
                          </div>
                          <div className="flex-1">
                            <div className="text-[11px] text-purple-300 font-semibold mb-0.5">
                              Instructor (Hablando ahora):
                            </div>
                            <div className="text-sm sm:text-base font-medium text-slate-100 italic">
                              {interimSpeech ? (
                                <span>"{interimSpeech}..."</span>
                              ) : (
                                <span className="text-slate-400 font-normal">
                                  🎙️ Escuchando al instructor... (explica en voz alta lo que vas haciendo en pantalla)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Recent transcripts log */}
                        {instructorTranscripts.length > 0 && (
                          <div
                            ref={transcriptScrollRef}
                            className="max-h-36 overflow-y-auto mt-2 pt-2 border-t border-slate-800 flex flex-col gap-1.5 text-xs text-slate-300 pr-1"
                          >
                            {instructorTranscripts.slice(-4).map((t, i) => (
                              <div key={t.id || i} className="flex items-start gap-2 bg-slate-800/60 p-1.5 rounded-lg">
                                <span className="font-mono text-indigo-400 font-bold text-[10px] bg-slate-900 px-1.5 py-0.5 rounded">
                                  {speechTranscriptionService.formatTime(t.timestamp)}
                                </span>
                                <span className="flex-1 text-slate-200">"{t.text}"</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick action triggers & quick speech simulator while recording */}
                      <div className="p-3 bg-white rounded-xl border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                        <div className="text-xs font-semibold text-indigo-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>{autoSnapshots.length} acciones de pantalla capturadas</span>
                        </div>

                        {/* Quick action triggers */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTriggerActionSnapshot('click')}
                            className="px-2.5 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-colors"
                          >
                            🖱️ Clic
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerActionSnapshot('type')}
                            className="px-2.5 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 transition-colors"
                          >
                            📝 Dato
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerActionSnapshot('enter')}
                            className="px-2.5 py-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg border border-amber-200 transition-colors"
                          >
                            ⌨️ Enter
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerActionSnapshot('save')}
                            className="px-2.5 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 transition-colors"
                          >
                            💾 Grabar
                          </button>
                        </div>
                      </div>

                      {/* Quick speech preset helper buttons (especially handy when testing in environments without physical mic) */}
                      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                        <span className="text-slate-500 font-medium">💡 Agregar frase hablada de prueba:</span>
                        <button
                          type="button"
                          onClick={() => handleAddInstructorSpeechPhrase('Hagan clic en el botón Grabar Cambios para persistir la información')}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-medium transition-colors"
                        >
                          + "Hagan clic en Grabar..."
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddInstructorSpeechPhrase('Recuerden verificar que el número de cliente esté cargado antes de presionar Enter')}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-medium transition-colors"
                        >
                          + "Recuerden verificar..."
                        </button>
                      </div>

                      <button
                        onClick={handleStopRecording}
                        className="py-3 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 self-center hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="w-3.5 h-3.5 bg-white rounded-xs" />
                        Detener Grabación y Procesar con Transcripción ({speechTranscriptionService.formatTime(recordingDuration)})
                      </button>
                    </div>
                  ) : (
                    <>
                      {(autoSnapshots.length > 0 || extractedFrames.length > 0 || recordedVideoUrl) ? (
                        <div className="w-full flex flex-col items-center gap-3">
                          {/* Regeneration action card */}
                          <div className="w-full bg-gradient-to-r from-amber-50 via-orange-50/40 to-slate-50 border border-amber-300 rounded-xl p-4 text-left shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                                <RotateCcw className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-amber-950 flex items-center gap-2">
                                  <span>¿Deseas regenerar o repetir la grabación?</span>
                                  <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                                    Sin perder datos llenados
                                  </span>
                                </h4>
                                <p className="text-xs text-amber-900/90 mt-0.5">
                                  Se conservarán intactos el <strong>Título</strong> («{topic || 'Manual'}»), notas de contexto y público objetivo.
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleRegenerateRecording('replace')}
                                className="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Regenerar Grabación (Nueva toma)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRegenerateRecording('append')}
                                className="py-2 px-3 bg-white hover:bg-amber-100 text-amber-900 font-semibold text-xs rounded-lg border border-amber-300 shadow-2xs flex items-center gap-1.5 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Anexar capturas</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleClearRecordingOnly}
                                className="py-2 px-2.5 text-slate-500 hover:text-red-600 text-xs font-medium transition-colors"
                                title="Limpiar capturas previas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                              onClick={() => handleStartRecording(false)}
                              className="py-2 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-200 shadow-2xs transition-all flex items-center gap-1.5"
                            >
                              <MonitorPlay className="w-3.5 h-3.5" />
                              <span>Iniciar Nueva Grabación</span>
                            </button>

                            {onOpenSimulator && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onOpenSimulator();
                                }}
                                className="py-2 px-4 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5"
                              >
                                <span>⚡ Simulador de Clics / Enter</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <button
                            onClick={() => handleStartRecording(false)}
                            className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <MonitorPlay className="w-4 h-4" />
                            Iniciar Grabación de Pantalla + Voz
                          </button>

                          {onOpenSimulator && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenSimulator();
                              }}
                              className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm rounded-xl border border-slate-300 shadow-xs transition-colors flex items-center gap-2"
                            >
                              <span>⚡ Abrir Simulador de Clics / Enter</span>
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* POST-RECORDING REVIEW: TRANSCRIBED INSTRUCTOR SPEECH SECTION */}
                {instructorTranscripts.length > 0 && !isRecording && (
                  <div className="bg-gradient-to-br from-purple-50/70 to-indigo-50/50 rounded-xl p-5 border border-purple-200 flex flex-col gap-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                          <MessageSquareQuote className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Transcripción del Instructor Capturada (Estilo MS Teams)</span>
                            <span className="text-[11px] bg-purple-200/80 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                              {instructorTranscripts.length} frases
                            </span>
                          </h4>
                          <p className="text-xs text-purple-900/80">
                            Esta transcripción será analizada por Gemini AI para enriquecer las instrucciones, títulos, advertencias y consejos del manual.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const phrase = prompt('Escribe la indicación o consejo que dio el instructor:');
                          if (phrase && phrase.trim()) {
                            handleAddInstructorSpeechPhrase(phrase.trim());
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 font-semibold text-xs rounded-lg border border-purple-300 shadow-2xs transition-colors self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir indicación hablada</span>
                      </button>
                    </div>

                    {/* Timeline List of Instructor Phrases */}
                    <div className="max-h-56 overflow-y-auto flex flex-col gap-2 pr-1">
                      {instructorTranscripts.map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 bg-white rounded-lg border border-purple-100 flex items-start justify-between gap-3 shadow-2xs group hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-start gap-2.5 flex-1">
                            <span className="font-mono text-purple-700 font-bold text-xs bg-purple-50 border border-purple-200 px-2 py-0.5 rounded flex-shrink-0 mt-0.5">
                              {speechTranscriptionService.formatTime(t.timestamp)}
                            </span>

                            {editingTranscriptId === t.id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editingTranscriptText}
                                  onChange={(e) => setEditingTranscriptText(e.target.value)}
                                  className="flex-1 text-xs px-2.5 py-1 border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditTranscript(t.id)}
                                  className="p-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingTranscriptId(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                                "{t.text}"
                              </p>
                            )}
                          </div>

                          {editingTranscriptId !== t.id && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTranscriptId(t.id);
                                  setEditingTranscriptText(t.text);
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                title="Editar texto"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTranscript(t.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show captured auto snapshots if any */}
                {autoSnapshots.length > 0 && !isRecording && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Secuencia Capturada ({autoSnapshots.length} capturas)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {autoSnapshots.map((snap, idx) => (
                        <div
                          key={snap.id}
                          className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-900 shadow-xs"
                        >
                          <img src={snap.dataUrl} alt={snap.label} className="w-full h-24 object-cover" />
                          <span className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                            {idx + 1}. {snap.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SCREENSHOTS UPLOAD */}
            {activeTab === 'screenshots' && (
              <div className="pt-4 flex flex-col gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleScreenshotFiles(e.target.files)}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">
                      Haz clic para subir capturas
                    </span>{' '}
                    <span className="text-slate-500 text-sm">o arrastra tus archivos aquí</span>
                  </div>
                  <p className="text-xs text-indigo-600 font-medium">
                    💡 Consejo: ¡También puedes presionar <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-xs font-mono">Ctrl + V</kbd> para pegar capturas directamente desde el portapapeles!
                  </p>
                </div>

                {/* Screenshot Previews */}
                {screenshots.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Secuencia de Pasos ({screenshots.length})
                      </span>
                      <button
                        onClick={() => setScreenshots([])}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Limpiar todas
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {screenshots.map((s, idx) => (
                        <div
                          key={s.id}
                          className="relative rounded-lg border border-slate-200 overflow-hidden group bg-slate-900"
                        >
                          <img
                            src={s.dataUrl}
                            alt={s.name}
                            className="w-full h-24 object-cover group-hover:opacity-80 transition-opacity"
                          />
                          <div className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                            #{idx + 1}
                          </div>
                          <button
                            onClick={() => removeScreenshot(s.id)}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="p-1.5 bg-white text-[11px] font-medium text-slate-700 truncate">
                            {s.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: VIDEO UPLOAD */}
            {activeTab === 'video' && (
              <div className="pt-4 flex flex-col gap-4">
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleVideoSelected(e.target.files[0]);
                      }
                    }}
                    accept="video/*"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">
                      {videoFile ? videoFile.name : 'Haz clic para seleccionar un video'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Soporta MP4, WebM o MOV. Extraeremos automáticamente los fotogramas clave.
                  </p>
                </div>

                {/* Extraction progress */}
                {isExtracting && (
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                      <span>{extractionProgress.status}</span>
                      <span>{extractionProgress.pct}%</span>
                    </div>
                    <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full transition-all duration-300"
                        style={{ width: `${extractionProgress.pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Extracted Frames Grid */}
                {extractedFrames.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Fotogramas Extraídos ({extractedFrames.filter((f) => f.selected).length} de{' '}
                        {extractedFrames.length} seleccionados)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {extractedFrames.map((frame, idx) => (
                        <div
                          key={frame.id}
                          onClick={() => toggleFrameSelection(frame.id)}
                          className={`relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                            frame.selected
                              ? 'border-indigo-600 shadow-md ring-2 ring-indigo-200'
                              : 'border-slate-200 opacity-60'
                          }`}
                        >
                          <img
                            src={frame.dataUrl}
                            alt={`Frame ${idx + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow ${
                                frame.selected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'
                              }`}
                            >
                              {frame.label || `#${idx + 1}`}
                            </span>
                          </div>
                          <div className="absolute top-1.5 right-1.5">
                            {frame.selected ? (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 bg-white rounded-full" />
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Message with Quick Actions */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-red-900 mb-0.5">
                    Aviso del Servidor de Inteligencia Artificial
                  </div>
                  <div className="text-xs text-red-700 leading-relaxed">
                    {errorMessage}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={handleGenerateManual}
                  disabled={isGenerating}
                  className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                >
                  🔄 Reintentar
                </button>
                <button
                  type="button"
                  onClick={handleGenerateDirectManual}
                  className="py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition-colors shadow-xs"
                  title="Crea el manual con tus capturas inmediatamente sin esperar a la IA"
                >
                  Crear Manual Directo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="py-2 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGenerateDirectManual}
              disabled={
                isGenerating ||
                (activeTab === 'screenshots' && screenshots.length === 0) ||
                (activeTab === 'video' && extractedFrames.filter((f) => f.selected).length === 0) ||
                (activeTab === 'record' && extractedFrames.length === 0 && autoSnapshots.length === 0)
              }
              className="py-2.5 px-4 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 shadow-2xs transition-colors"
              title="Compila el manual de inmediato con tus capturas y transcripción de voz sin consultar a la IA"
            >
              Creación Directa (Inmediata)
            </button>

            <button
              onClick={handleGenerateManual}
              disabled={
                isGenerating ||
                (activeTab === 'screenshots' && screenshots.length === 0) ||
                (activeTab === 'video' && extractedFrames.filter((f) => f.selected).length === 0) ||
                (activeTab === 'record' && extractedFrames.length === 0 && autoSnapshots.length === 0)
              }
              className={`py-2.5 px-6 ${
                existingManual ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
              } disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{generationStage}</span>
                </>
              ) : (
                <>
                  {existingManual ? <RotateCcw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  <span>
                    {existingManual
                      ? saveMode === 'update'
                        ? 'Actualizar Manual con Nueva Grabación'
                        : 'Guardar Nueva Versión del Manual'
                      : `Generar Manual con IA ${instructorTranscripts.length > 0 ? '+ Transcripción' : ''}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
