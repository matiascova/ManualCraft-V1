import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Camera,
  FolderKanban,
  Building2,
  Shield,
  ShieldCheck,
  GraduationCap,
  Target,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Crop,
  Scissors,
  EyeOff,
} from 'lucide-react';
import {
  VideoFrameCandidate,
  UserManual,
  InstructorTranscriptSegment,
  reindexManualSteps,
  formatStepOperativeTitle,
} from '../types/manual';
import { Project } from '../types/project';
import { extractFramesFromVideo, parseTranscriptWithTimestamps } from '../utils/videoExtractor';
import { screenRecorder } from '../utils/screenRecorder';
import {
  screenActionDetector,
  AutoCapturedSnapshot,
  cropTaskbarFromDataUrl,
  blurTaskbarOnDataUrl,
} from '../utils/motionDetector';
import { speechTranscriptionService, TranscriptionStatus } from '../utils/speechTranscription';
import { DictationButton } from './DictationButton';
import { ImageCropModal } from './ImageCropModal';

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

// Ultra-fast lightweight canvas compressor for AI payload
async function compressImageForAi(dataUrl: string, maxDimension = 1280, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDimension && height <= maxDimension && dataUrl.length < 350000) {
        return resolve(dataUrl);
      }
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
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
  const autoSnapshotsRef = useRef<AutoCapturedSnapshot[]>([]);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const recordTimerRef = useRef<any>(null);

  // Instructor Speech Transcription (Teams Style)
  const [enableInstructorAudio, setEnableInstructorAudio] = useState(true);
  const [transcriptionStatus, setTranscriptionStatus] = useState<TranscriptionStatus>('inactive');
  const [interimSpeech, setInterimSpeech] = useState('');
  const [instructorTranscripts, setInstructorTranscripts] = useState<InstructorTranscriptSegment[]>([]);
  const instructorTranscriptsRef = useRef<InstructorTranscriptSegment[]>([]);
  const [micVolume, setMicVolume] = useState(0);
  const [newSpeechInput, setNewSpeechInput] = useState('');
  const [editingTranscriptId, setEditingTranscriptId] = useState<string | null>(null);
  const [editingTranscriptText, setEditingTranscriptText] = useState('');

  // Transcript Import & Screen Sync State
  const [showImportTranscriptModal, setShowImportTranscriptModal] = useState(false);
  const [rawTranscriptToImport, setRawTranscriptToImport] = useState('');
  const [autoSyncOnImport, setAutoSyncOnImport] = useState(true);

  useEffect(() => {
    autoSnapshotsRef.current = autoSnapshots;
  }, [autoSnapshots]);

  useEffect(() => {
    instructorTranscriptsRef.current = instructorTranscripts;
  }, [instructorTranscripts]);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Fullscreen Frame Viewer Lightbox state
  const [fullscreenViewer, setFullscreenViewer] = useState<{
    isOpen: boolean;
    currentIndex: number;
    source: 'snapshots' | 'extracted' | 'screenshots';
  }>({
    isOpen: false,
    currentIndex: 0,
    source: 'snapshots',
  });

  // Saved draft notification state
  const [draftSavedNotice, setDraftSavedNotice] = useState<{
    show: boolean;
    count: number;
    title: string;
    manualId: string;
  } | null>(null);

  // Sync notification banner
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Taskbar privacy & clean screenshot mode ('crop' | 'blur' | 'none')
  const [taskbarProtection, setTaskbarProtection] = useState<'crop' | 'blur' | 'none'>('crop');

  // Cropper Modal State
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    imageSrc: string;
    imageTitle?: string;
    targetId: string;
    source: 'snapshots' | 'extracted' | 'screenshots';
  }>({
    isOpen: false,
    imageSrc: '',
    imageTitle: '',
    targetId: '',
    source: 'snapshots',
  });

  // Keep screenActionDetector synchronized with taskbar protection setting
  useEffect(() => {
    screenActionDetector.setTaskbarProtection(taskbarProtection);
  }, [taskbarProtection]);

  // Clean up all active recording, media stream, transcription, and timers on modal unmount
  useEffect(() => {
    return () => {
      screenActionDetector.stop();
      screenRecorder.stopRecording();
      speechTranscriptionService.stop();
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    };
  }, []);

  // Active items array based on source
  const currentViewerItems: Array<{
    id: string;
    dataUrl: string;
    label: string;
    timestamp?: number;
    reason?: string;
    selected?: boolean;
  }> = useMemo(() => {
    if (fullscreenViewer.source === 'snapshots') {
      return autoSnapshots.map((s, idx) => ({
        id: s.id,
        dataUrl: s.dataUrl,
        label: s.label || `Fotograma #${idx + 1}`,
        timestamp: s.timestamp,
        reason: s.reason,
      }));
    }
    if (fullscreenViewer.source === 'extracted') {
      return extractedFrames.map((f, idx) => ({
        id: f.id,
        dataUrl: f.dataUrl,
        label: f.label || `Fotograma #${idx + 1}`,
        timestamp: f.timestamp,
        selected: f.selected,
      }));
    }
    if (fullscreenViewer.source === 'screenshots') {
      return screenshots.map((s, idx) => ({
        id: s.id,
        dataUrl: s.dataUrl,
        label: s.name || `Captura #${idx + 1}`,
        timestamp: undefined,
      }));
    }
    return [];
  }, [fullscreenViewer.source, autoSnapshots, extractedFrames, screenshots]);

  const currentViewerItem = currentViewerItems[fullscreenViewer.currentIndex] || null;

  // Active captures count across modes
  const activeCapturesCount = useMemo(() => {
    if (activeTab === 'screenshots') return screenshots.length;
    if (autoSnapshots.length > 0) return autoSnapshots.length;
    return extractedFrames.filter((f) => f.selected).length;
  }, [activeTab, screenshots.length, autoSnapshots.length, extractedFrames]);

  // Keyboard navigation for Fullscreen Viewer
  useEffect(() => {
    if (!fullscreenViewer.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenViewer((prev) => ({ ...prev, isOpen: false }));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setFullscreenViewer((prev) => ({
          ...prev,
          currentIndex: (prev.currentIndex + 1) % (currentViewerItems.length || 1),
        }));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setFullscreenViewer((prev) => ({
          ...prev,
          currentIndex:
            (prev.currentIndex - 1 + (currentViewerItems.length || 1)) % (currentViewerItems.length || 1),
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenViewer.isOpen, currentViewerItems.length]);

  const handleDeleteViewerItem = (id: string) => {
    if (fullscreenViewer.source === 'snapshots') {
      setAutoSnapshots((prev) => prev.filter((s) => s.id !== id));
      setExtractedFrames((prev) => prev.filter((f) => f.id !== id));
    } else if (fullscreenViewer.source === 'extracted') {
      setExtractedFrames((prev) => prev.filter((f) => f.id !== id));
    } else if (fullscreenViewer.source === 'screenshots') {
      removeScreenshot(id);
    }
    setFullscreenViewer((prev) => {
      const nextLength = currentViewerItems.length - 1;
      if (nextLength <= 0) {
        return { ...prev, isOpen: false, currentIndex: 0 };
      }
      return {
        ...prev,
        currentIndex: Math.min(prev.currentIndex, nextLength - 1),
      };
    });
  };

  // Apply cropped image to corresponding target
  const handleApplyCrop = (croppedDataUrl: string) => {
    if (!cropModal.targetId) return;

    if (cropModal.source === 'snapshots') {
      setAutoSnapshots((prev) =>
        prev.map((s) => (s.id === cropModal.targetId ? { ...s, dataUrl: croppedDataUrl } : s))
      );
      setExtractedFrames((prev) =>
        prev.map((f) => (f.id === cropModal.targetId ? { ...f, dataUrl: croppedDataUrl } : f))
      );
    } else if (cropModal.source === 'extracted') {
      setExtractedFrames((prev) =>
        prev.map((f) => (f.id === cropModal.targetId ? { ...f, dataUrl: croppedDataUrl } : f))
      );
    } else if (cropModal.source === 'screenshots') {
      setScreenshots((prev) =>
        prev.map((s) => (s.id === cropModal.targetId ? { ...s, dataUrl: croppedDataUrl } : s))
      );
    }
  };

  // 1-Click batch actions to crop or blur taskbar across all captured frames
  const handleBatchCropTaskbar = async () => {
    if (autoSnapshots.length > 0) {
      const updated = await Promise.all(
        autoSnapshots.map(async (s) => ({
          ...s,
          dataUrl: await cropTaskbarFromDataUrl(s.dataUrl),
        }))
      );
      setAutoSnapshots(updated);
      setExtractedFrames((prev) =>
        prev.map((f) => {
          const match = updated.find((u) => u.id === f.id);
          return match ? { ...f, dataUrl: match.dataUrl } : f;
        })
      );
    }

    if (screenshots.length > 0) {
      const updated = await Promise.all(
        screenshots.map(async (s) => ({
          ...s,
          dataUrl: await cropTaskbarFromDataUrl(s.dataUrl),
        }))
      );
      setScreenshots(updated);
    }

    if (extractedFrames.length > 0 && autoSnapshots.length === 0) {
      const updated = await Promise.all(
        extractedFrames.map(async (f) => ({
          ...f,
          dataUrl: await cropTaskbarFromDataUrl(f.dataUrl),
        }))
      );
      setExtractedFrames(updated);
    }
  };

  const handleBatchBlurTaskbar = async () => {
    if (autoSnapshots.length > 0) {
      const updated = await Promise.all(
        autoSnapshots.map(async (s) => ({
          ...s,
          dataUrl: await blurTaskbarOnDataUrl(s.dataUrl),
        }))
      );
      setAutoSnapshots(updated);
      setExtractedFrames((prev) =>
        prev.map((f) => {
          const match = updated.find((u) => u.id === f.id);
          return match ? { ...f, dataUrl: match.dataUrl } : f;
        })
      );
    }

    if (screenshots.length > 0) {
      const updated = await Promise.all(
        screenshots.map(async (s) => ({
          ...s,
          dataUrl: await blurTaskbarOnDataUrl(s.dataUrl),
        }))
      );
      setScreenshots(updated);
    }

    if (extractedFrames.length > 0 && autoSnapshots.length === 0) {
      const updated = await Promise.all(
        extractedFrames.map(async (f) => ({
          ...f,
          dataUrl: await blurTaskbarOnDataUrl(f.dataUrl),
        }))
      );
      setExtractedFrames(updated);
    }
  };

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
      if (existingManual.pedagogicalApproach) {
        setPedagogicalApproach(existingManual.pedagogicalApproach);
      }
      if (existingManual.projectId) {
        setSelectedProjectId(existingManual.projectId);
      }
      // If manual had an existing instructor transcript, pre-populate
      if (existingManual.instructorTranscript && existingManual.instructorTranscript.length > 0) {
        setInstructorTranscripts(existingManual.instructorTranscript);
      }
      // If manual had existing steps with images, load them as snapshots and candidate frames so the user doesn't lose them!
      if (existingManual.steps && existingManual.steps.length > 0) {
        const loadedSnaps: AutoCapturedSnapshot[] = existingManual.steps
          .filter((s) => s.image)
          .map((s, idx) => ({
            id: s.id || `snap-prev-${idx}`,
            timestamp: s.timestamp || idx * 3,
            dataUrl: s.image!,
            reason: 'manual_trigger',
            label: s.title || `Paso ${s.stepNumber || idx + 1}`,
            differenceScore: 1,
          }));
        if (loadedSnaps.length > 0) {
          setAutoSnapshots(loadedSnaps);
          setExtractedFrames(
            loadedSnaps.map((sn) => ({
              id: sn.id,
              timestamp: sn.timestamp,
              dataUrl: sn.dataUrl,
              selected: true,
              label: sn.label,
            }))
          );
        }
      }
    } else {
      // Try to recover draft data so the user never loses what they typed or recorded
      try {
        const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.topic && !topic) setTopic(parsed.topic);
          if (parsed.context && !context) setContext(parsed.context);
          if (parsed.targetAudience && (!targetAudience || targetAudience === 'Usuarios finales y colaboradores')) {
            setTargetAudience(parsed.targetAudience);
          }
          if (parsed.pedagogicalApproach) setPedagogicalApproach(parsed.pedagogicalApproach);
          if (parsed.selectedProjectId) setSelectedProjectId(parsed.selectedProjectId);
          if (Array.isArray(parsed.instructorTranscripts) && parsed.instructorTranscripts.length > 0) {
            setInstructorTranscripts(parsed.instructorTranscripts);
          }
          if (Array.isArray(parsed.autoSnapshots) && parsed.autoSnapshots.length > 0) {
            setAutoSnapshots(parsed.autoSnapshots);
          }
          if (Array.isArray(parsed.screenshots) && parsed.screenshots.length > 0) {
            setScreenshots(parsed.screenshots);
          }
          if (Array.isArray(parsed.extractedFrames) && parsed.extractedFrames.length > 0) {
            setExtractedFrames(parsed.extractedFrames);
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

  // Persist draft to sessionStorage so user never loses what was filled or recorded
  useEffect(() => {
    if (!existingManual && (topic || context || autoSnapshots.length > 0 || instructorTranscripts.length > 0 || screenshots.length > 0)) {
      try {
        sessionStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            topic,
            context,
            targetAudience,
            pedagogicalApproach,
            selectedProjectId,
            instructorTranscripts,
            autoSnapshots,
            screenshots,
            extractedFrames,
          })
        );
      } catch (e) {
        // ignore
      }
    }
  }, [topic, context, targetAudience, pedagogicalApproach, selectedProjectId, instructorTranscripts, autoSnapshots, screenshots, extractedFrames, existingManual]);

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

  /**
   * High-performance image normalizer: downsamples oversized 4K/retina screenshots
   * to a crisp 1280px JPEG (~90KB), reducing memory consumption by up to 95%.
   */
  const compressImageFile = (fileOrBlob: Blob, maxWidth = 1280, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          resolve('');
          return;
        }
        const img = new Image();
        img.onload = () => {
          const origW = img.naturalWidth || img.width;
          const origH = img.naturalHeight || img.height;
          if (origW <= maxWidth && fileOrBlob.size < 250000 && !fileOrBlob.type.includes('png')) {
            resolve(dataUrl);
            return;
          }
          const w = Math.min(maxWidth, origW);
          const h = Math.round(w * (origH / origW));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          canvas.width = 0;
          canvas.height = 0;
          resolve(compressed);
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };
      reader.readAsDataURL(fileOrBlob);
    });
  };

  // Handle Clipboard Paste (Ctrl+V) for instant screenshot pasting
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const compressed = await compressImageFile(blob);
            if (compressed) {
              setScreenshots((prev) => [
                ...prev,
                {
                  id: `paste-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  dataUrl: compressed,
                  name: `Captura pegada ${prev.length + 1}`,
                },
              ]);
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Multi Screenshots upload with instant downsampling
  const handleScreenshotFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(async (file) => {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file);
        if (compressed) {
          setScreenshots((prev) => [
            ...prev,
            {
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              dataUrl: compressed,
              name: file.name,
            },
          ]);
        }
      }
    });
  };

  const removeScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  // Handle Video Upload & Frame Extraction
  const handleVideoSelected = async (file: File, transcriptsOverride?: InstructorTranscriptSegment[]) => {
    setVideoFile(file);
    setIsExtracting(true);
    setExtractionProgress({ pct: 0, status: 'Analizando actividad y extrayendo fotogramas...' });
    setErrorMessage(null);
    try {
      const activeTranscripts = transcriptsOverride || instructorTranscriptsRef.current;
      const transcriptAnchors = activeTranscripts.map((t) => ({ timestamp: t.timestamp, text: t.text }));
      const frames = await extractFramesFromVideo(file, {
        maxFrames: 14,
        intervalSeconds: frameInterval,
        transcriptTimestamps: transcriptAnchors,
        deduplicateStaticFrames: true,
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

  // Sync Extracted Screens with Instructor Transcript Timestamps
  const handleSyncScreensWithTranscript = async (transcriptsToUse?: InstructorTranscriptSegment[]) => {
    const targetTranscripts = transcriptsToUse || instructorTranscripts;
    if (!videoFile) {
      setErrorMessage('No hay ningún video grabado o cargado para sincronizar las pantallas. Por favor sube o graba un video.');
      return;
    }
    if (!targetTranscripts || targetTranscripts.length === 0) {
      setErrorMessage('Por favor agrega o importa una transcripción con marcas de tiempo primero.');
      return;
    }

    setIsExtracting(true);
    setExtractionProgress({ pct: 0, status: 'Sincronizando pantallas activas con la transcripción...' });
    setErrorMessage(null);
    try {
      const transcriptAnchors = targetTranscripts.map((t) => ({ timestamp: t.timestamp, text: t.text }));
      const frames = await extractFramesFromVideo(videoFile, {
        maxFrames: 16,
        transcriptTimestamps: transcriptAnchors,
        deduplicateStaticFrames: true,
        onProgress: (pct, status) => {
          setExtractionProgress({ pct, status });
        },
      });

      if (frames.length > 0) {
        setExtractedFrames(frames);
        setSyncNotification(
          `¡Pantallas sincronizadas! Se extrajeron ${frames.length} capturas activas en los momentos exactos de la transcripción, eliminando pantallas iniciales vacías.`
        );
        setTimeout(() => setSyncNotification(null), 5000);
      } else {
        setErrorMessage('No se pudieron extraer fotogramas del video para los momentos indicados.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al sincronizar las pantallas con el video');
    } finally {
      setIsExtracting(false);
    }
  };

  // Import raw transcript with timestamps [mm:ss]
  const handleImportTranscriptText = async () => {
    if (!rawTranscriptToImport.trim()) return;

    const parsed = parseTranscriptWithTimestamps(rawTranscriptToImport);
    let newSegments: InstructorTranscriptSegment[] = [];

    if (parsed.length > 0) {
      newSegments = parsed.map((item, idx) => ({
        id: `transcript-imp-${Date.now()}-${idx}`,
        timestamp: item.timestamp,
        text: item.text,
      }));
    } else {
      // Fallback: split by line and space every 10s
      const lines = rawTranscriptToImport.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      newSegments = lines.map((line, idx) => ({
        id: `transcript-imp-${Date.now()}-${idx}`,
        timestamp: idx * 10,
        text: line,
      }));
    }

    setInstructorTranscripts(newSegments);
    instructorTranscriptsRef.current = newSegments;
    setShowImportTranscriptModal(false);
    setRawTranscriptToImport('');

    setSyncNotification(`¡Transcripción importada! Se cargaron ${newSegments.length} frases con sus marcas de tiempo.`);
    setTimeout(() => setSyncNotification(null), 4000);

    // If auto-sync is enabled and video is available, automatically resync screen frames!
    if (autoSyncOnImport && videoFile) {
      await handleSyncScreensWithTranscript(newSegments);
    }
  };

  // Start Screen Recording with Action Detection & Real-Time MS Teams Style Speech Transcription
  const handleStartRecording = async (appendMode = false) => {
    setErrorMessage(null);
    if (!appendMode) {
      setAutoSnapshots([]);
      autoSnapshotsRef.current = [];
      setExtractedFrames([]);
      setRecordedVideoUrl(null);
      setInstructorTranscripts([]);
      instructorTranscriptsRef.current = [];
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
        let currentTranscripts = instructorTranscriptsRef.current;
        if (enableInstructorAudio) {
          const finalTranscripts = speechTranscriptionService.stop();
          if (finalTranscripts.length > 0) {
            currentTranscripts = appendMode ? [...currentTranscripts, ...finalTranscripts] : finalTranscripts;
            setInstructorTranscripts(currentTranscripts);
            instructorTranscriptsRef.current = currentTranscripts;
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
        setVideoFile(recordedFile);

        const currentSnapshots = autoSnapshotsRef.current;
        // If we collected auto snapshots, integrate them directly into extractedFrames
        if (currentSnapshots.length > 0) {
          const snapshotFrames: VideoFrameCandidate[] = currentSnapshots.map((s, idx) => ({
            id: s.id,
            timestamp: s.timestamp,
            dataUrl: s.dataUrl,
            selected: true,
            label: s.label || `Acción ${idx + 1}`,
          }));
          setExtractedFrames((prev) => (appendMode ? [...prev, ...snapshotFrames] : snapshotFrames));
        } else {
          // Fall back to smart video frame extraction using transcript timestamps
          await handleVideoSelected(recordedFile, currentTranscripts);
        }
      });

      // Start live instructor audio transcription
      if (enableInstructorAudio) {
        await speechTranscriptionService.start(
          {
            onInterim: (txt) => setInterimSpeech(txt),
            onSentence: (segment) => {
              instructorTranscriptsRef.current.push(segment);
              setInstructorTranscripts([...instructorTranscriptsRef.current]);
              screenActionDetector.notifySpeechSentence(segment.text, segment.timestamp);
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
          autoSnapshotsRef.current.push(snapshot);
          setAutoSnapshots([...autoSnapshotsRef.current]);
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

  const handleTriggerActionSnapshot = (
    reason: 'click' | 'enter' | 'save' | 'type' | 'custom',
    customLabel?: string
  ) => {
    let label = 'Clic detectado';
    if (reason === 'enter') label = 'Tecla Enter presionada';
    if (reason === 'save') label = 'Acción Grabar/Guardar';
    if (reason === 'type') label = 'Interacción en campo / selección';
    if (reason === 'custom' && customLabel) label = customLabel;
    screenActionDetector.captureNow(
      reason === 'type' || reason === 'custom' ? 'change_detected' : reason,
      label
    );
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
      let candidatePool: Array<any> = extractedFrames;
      if (candidatePool.length === 0 && autoSnapshots.length > 0) {
        candidatePool = autoSnapshots.map((s, idx) => ({
          id: s.id,
          timestamp: s.timestamp,
          dataUrl: s.dataUrl,
          selected: true,
          label: s.label || `Acción ${idx + 1}`,
          focalX: s.focalX,
          focalY: s.focalY,
        }));
      }
      const selected = candidatePool.filter((f) => f.selected);
      if (selected.length === 0) {
        setErrorMessage('Por favor selecciona al menos un fotograma o acción capturada.');
        return;
      }
      imagesToSend = selected.map((f) => ({
        dataUrl: f.dataUrl,
        label: f.label,
        timestamp: f.timestamp,
        focalX: f.focalX,
        focalY: f.focalY,
      }));
    }

    const originalImages = imagesToSend.map((img) => img.dataUrl);

    setIsGenerating(true);
    setGenerationStage('Optimizando capturas para procesamiento rápido...');

    try {
      // Compress frames for fast network transmission without losing visual quality
      const compressedImagesToSend = await Promise.all(
        imagesToSend.map(async (img) => ({
          ...img,
          dataUrl: await compressImageForAi(img.dataUrl, 1280, 0.75),
        }))
      );

      setGenerationStage('Analizando capturas de pantalla y correlacionando con el audio del instructor...');

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
          images: compressedImagesToSend,
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

      const contentType = response.headers.get('content-type') || '';
      let data: any;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        console.error('Non-JSON response from /api/generate-manual:', rawText);
        if (response.status === 413 || rawText.includes('Payload Too Large') || rawText.includes('too large')) {
          throw new Error(`Las ${imagesToSend.length} capturas superan el límite del servidor. Usa "Crear Manual Directo" para armar el manual al instante con todas tus capturas.`);
        }
        throw new Error(`El servidor respondió con código ${response.status}. Puedes utilizar "Crear Manual Directo" para compilar tu manual de inmediato con todas tus capturas.`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo generar el manual.');
      }

      const generated = data.manual;
      if (generated && Array.isArray(generated.steps)) {
        // Re-attach pristine high-resolution images to each step
        generated.steps.forEach((step: any, idx: number) => {
          if (originalImages[idx]) {
            step.image = originalImages[idx];
          }
        });
        generated.steps = reindexManualSteps(generated.steps);
      }
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

      generated.projectId = selectedProjectId || activeProjectId || projects[0]?.id || undefined;
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
    let images: Array<{ dataUrl: string; label?: string; timestamp?: number; focalX?: number; focalY?: number }> = [];
    if (activeTab === 'screenshots') {
      images = screenshots.map((s) => ({ dataUrl: s.dataUrl, label: s.name }));
    } else {
      if (autoSnapshots.length > 0) {
        images = autoSnapshots.map((s) => ({
          dataUrl: s.dataUrl,
          label: s.label,
          timestamp: s.timestamp,
          focalX: s.focalX,
          focalY: s.focalY,
        }));
      } else {
        const selected = extractedFrames.filter((f) => f.selected);
        images = selected.map((f: any) => ({
          dataUrl: f.dataUrl,
          label: f.label,
          timestamp: f.timestamp,
          focalX: f.focalX,
          focalY: f.focalY,
        }));
      }
    }

    if (images.length === 0) return;

    const rawSteps = images.map((img, idx) => {
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
        title: formatStepOperativeTitle(img.label || 'Realizar acción', idx + 1),
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
            x: img.focalX !== undefined ? img.focalX : 50,
            y: img.focalY !== undefined ? img.focalY : 50,
            shape: 'circle' as const,
            color: '#ef4444',
            label: img.label || `Paso ${idx + 1}`,
          },
        ],
      };
    });

    const steps = reindexManualSteps(rawSteps);

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
      projectId: selectedProjectId || activeProjectId || projects[0]?.id || undefined,
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

  // Guardar Borrador: Salva inmediatamente los fotogramas, audio y textos en un borrador editable
  const handleSaveDraftManual = () => {
    let images: Array<{ dataUrl: string; label?: string; timestamp?: number; focalX?: number; focalY?: number }> = [];
    if (activeTab === 'screenshots') {
      images = screenshots.map((s) => ({ dataUrl: s.dataUrl, label: s.name }));
    } else if (activeTab === 'video') {
      const selected = extractedFrames.filter((f) => f.selected);
      images = (selected.length > 0 ? selected : extractedFrames).map((f: any) => ({
        dataUrl: f.dataUrl,
        label: f.label,
        timestamp: f.timestamp,
        focalX: f.focalX,
        focalY: f.focalY,
      }));
    } else {
      // record tab: autoSnapshots or extractedFrames
      if (autoSnapshots.length > 0) {
        images = autoSnapshots.map((s) => ({
          dataUrl: s.dataUrl,
          label: s.label,
          timestamp: s.timestamp,
          focalX: s.focalX,
          focalY: s.focalY,
        }));
      } else if (extractedFrames.length > 0) {
        const selected = extractedFrames.filter((f) => f.selected);
        images = (selected.length > 0 ? selected : extractedFrames).map((f: any) => ({
          dataUrl: f.dataUrl,
          label: f.label,
          timestamp: f.timestamp,
          focalX: f.focalX,
          focalY: f.focalY,
        }));
      }
    }

    const steps = images.map((img, idx) => {
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
        title: formatStepOperativeTitle(img.label || 'Acción registrada', idx + 1),
        actionType: 'click' as const,
        description: `Acción registrada durante la grabación de ${topic.trim() || 'la pantalla'}.`,
        targetElement: img.label || 'Elemento en pantalla',
        expectedResult: 'El sistema valida la acción realizada y avanza al siguiente paso.',
        purpose: `Asegurar la correcta ejecución del paso ${idx + 1}.`,
        instructorNotes: stepInstructorNote,
        instructorAudioQuote: stepInstructorQuote,
        image: img.dataUrl,
        annotations: [
          {
            id: `ann-${idx}`,
            x: img.focalX !== undefined ? img.focalX : 50,
            y: img.focalY !== undefined ? img.focalY : 50,
            shape: 'circle' as const,
            color: '#ef4444',
            label: img.label || `Paso ${idx + 1}`,
          },
        ],
      };
    });

    const reindexedSteps = reindexManualSteps(steps);

    const fullTranscriptionText = instructorTranscripts
      .map((t) => `[${speechTranscriptionService.formatTime(t.timestamp)}] ${t.text}`)
      .join('\n');

    const draftId = existingManual?.id || `manual-draft-${Date.now()}`;
    const draftTitle = topic.trim() || (existingManual?.title ? `${existingManual.title} (Borrador)` : 'Borrador de Manual');

    const draftManual: UserManual = {
      id: draftId,
      projectId: selectedProjectId || activeProjectId || projects[0]?.id || undefined,
      title: draftTitle,
      subtitle: 'Borrador guardado · Listo para editar o generar con IA',
      overview: context.trim() || (existingManual ? existingManual.overview : 'Borrador preliminar generado con capturas de pantalla y transcripción de voz.'),
      targetAudience: targetAudience || 'Usuarios finales y colaboradores',
      estimatedMinutes: Math.max(3, reindexedSteps.length * 2),
      difficulty: 'Principiante',
      prerequisites: ['Acceso con credenciales al sistema'],
      steps: reindexedSteps,
      summaryChecklist: ['Completar todas las acciones de la secuencia'],
      instructorTranscript: instructorTranscripts,
      fullTranscriptionText,
      pedagogicalApproach,
      createdAt: existingManual?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: existingManual?.version || '0.1-borrador',
      status: 'draft',
      isDraft: true,
    };

    if (existingManual && saveMode === 'update' && onManualUpdated) {
      onManualUpdated(draftManual);
    } else {
      onManualCreated(draftManual);
    }

    try {
      sessionStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          topic,
          context,
          targetAudience,
          pedagogicalApproach,
          selectedProjectId,
          instructorTranscripts,
          autoSnapshots,
          screenshots,
          extractedFrames,
        })
      );
    } catch (e) {
      console.warn('Draft storage:', e);
    }

    setDraftSavedNotice({
      show: true,
      count: images.length,
      title: draftTitle,
      manualId: draftId,
    });
  };

  const toggleFrameSelection = (id: string) => {
    setExtractedFrames((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-sm flex items-center justify-center p-1 sm:p-2 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-[98.5vw] h-[98vh] max-w-none max-h-none flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${existingManual ? 'bg-amber-600 shadow-amber-200' : 'bg-indigo-600 shadow-indigo-200'} flex items-center justify-center text-white shadow-xs`}>
              {existingManual ? <RotateCcw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 leading-none">
                <span>{existingManual ? 'Regenerar Grabación del Manual' : 'Nuevo Manual de Usuario con IA'}</span>
                {existingManual ? (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                    <RotateCcw className="w-2.5 h-2.5 text-amber-700" /> Conservando Datos
                  </span>
                ) : (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Mic className="w-2.5 h-2.5" /> Transcripción en Vivo Tipo MS Teams
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {existingManual
                  ? `Graba una nueva secuencia de pantallas y voz para «${existingManual.title}».`
                  : 'Graba tu pantalla mientras explicas por micrófono. El sistema capturará automáticamente cada paso.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner de Confirmación de Borrador Guardado */}
        {draftSavedNotice && draftSavedNotice.show && (
          <div className="mx-4 mt-2 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-150 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 leading-none">
                  <span>¡Borrador guardado exitosamente!</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-1.5 py-0.2 rounded">
                    {draftSavedNotice.count} fotogramas
                  </span>
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Toda tu grabación, capturas y transcripción de voz quedaron respaldadas en la biblioteca.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDraftSavedNotice(null)}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                Seguir en grabadora
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftSavedNotice(null);
                  onClose();
                }}
                className="px-3 py-1 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1"
              >
                <span>Abrir Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Sync Success Banner */}
        {syncNotification && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
              <span>{syncNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncNotification(null)}
              className="p-1 text-emerald-100 hover:text-white rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Body: 2 Columns 50% / 50% */}
        <div className="flex-1 overflow-hidden p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0">
          {/* Left Column: Form Parameters & Settings (50% width for extensive context) */}
          <div className="lg:col-span-6 flex flex-col justify-between h-full overflow-y-auto pr-1 gap-2.5 bg-slate-50/80 p-3 sm:p-4 rounded-xl border border-slate-200 min-h-0 scrollbar-thin">
            {/* Regeneration Notice Banner if editing existing manual */}
            {existingManual && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-2xs shrink-0">
                <div className="flex items-center gap-1.5 truncate">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-bold text-xs text-amber-950 truncate">
                    {existingManual.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-semibold text-slate-600">Guardar:</span>
                  <select
                    value={saveMode}
                    onChange={(e) => setSaveMode(e.target.value as 'update' | 'new_version')}
                    className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 rounded px-1.5 py-0.5 focus:outline-none"
                  >
                    <option value="update">Actualizar actual</option>
                    <option value="new_version">
                      Nueva versión (v{(parseFloat(existingManual.version || '1.0') + 0.1).toFixed(1)})
                    </option>
                  </select>
                </div>
              </div>
            )}

            {/* Proyecto Asociado */}
            {projects && projects.length > 0 && (
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs shrink-0">
                <div className="flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">Proyecto:</span>
                </div>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-md px-2 py-1 max-w-[280px] truncate focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.clientName} · {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Inputs: Título, Audiencia, Contexto Ampliado */}
            <div className="flex flex-col gap-2 shrink-0">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Título o Tarea a Documentar *
                  </label>
                  <DictationButton
                    value={topic}
                    onChange={setTopic}
                    title="Dictar título por voz"
                    size="xs"
                  />
                </div>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ej. Cómo autorizar una orden de compra en el ERP"
                  className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Público Objetivo
                  </label>
                  <DictationButton
                    value={targetAudience}
                    onChange={setTargetAudience}
                    title="Dictar público objetivo por voz"
                    size="xs"
                  />
                </div>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ej. Usuarios finales y colaboradores, analistas contables"
                  className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <span>Notas / Contexto Adicional (Opcional)</span>
                    <span className="text-[9px] text-indigo-600 font-medium lowercase">(reglas, requisitos o explicaciones para la IA)</span>
                  </label>
                  <DictationButton
                    value={context}
                    onChange={setContext}
                    title="Dictar contexto por voz"
                    size="xs"
                  />
                </div>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  placeholder="Escribe o dicta aquí notas clave, reglas de negocio, requerimientos previos, consideraciones especiales o advertencias que la IA deba incorporar en cada paso..."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y min-h-[92px]"
                />
              </div>
            </div>

            {/* Pedagogical Approach (4C/ID) */}
            <div className="bg-white p-2 border border-slate-200/90 rounded-lg shrink-0 shadow-2xs">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1">
                <Target className="w-3 h-3 text-indigo-600" />
                <span>Enfoque Pedagógico (Diseño 4C/ID)</span>
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setPedagogicalApproach('sop')}
                  className={`py-1 px-1 text-xs rounded border text-center transition-all ${
                    pedagogicalApproach === 'sop'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="font-bold text-[11px] leading-tight">SOP Formal</div>
                  <div className="text-[8.5px] opacity-80 leading-tight">Rigor & Auditoría</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPedagogicalApproach('microlearning')}
                  className={`py-1 px-1 text-xs rounded border text-center transition-all ${
                    pedagogicalApproach === 'microlearning'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="font-bold text-[11px] leading-tight">Guía Rápida</div>
                  <div className="text-[8.5px] opacity-80 leading-tight">Microaprendizaje</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPedagogicalApproach('onboarding')}
                  className={`py-1 px-1 text-xs rounded border text-center transition-all ${
                    pedagogicalApproach === 'onboarding'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="font-bold text-[11px] leading-tight">Capacitación</div>
                  <div className="text-[8.5px] opacity-80 leading-tight">Onboarding</div>
                </button>
              </div>
            </div>

            {/* PII Anonymization Toggle */}
            <div
              onClick={() => setAutoAnonymizePii(!autoAnonymizePii)}
              className={`py-1.5 px-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between shrink-0 shadow-2xs ${
                autoAnonymizePii
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Shield className={`w-3.5 h-3.5 ${autoAnonymizePii ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-[10.5px] font-semibold">
                  {autoAnonymizePii ? 'Difuminar datos sensibles (Emails, RUT, Tarjetas)' : 'Sin difuminado automático'}
                </span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${autoAnonymizePii ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {autoAnonymizePii ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {/* Taskbar Privacy & Screenshot Protection (Windows) */}
            <div className="bg-white p-2 border border-slate-200/90 rounded-lg shrink-0 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Scissors className="w-3 h-3 text-amber-600" />
                  <span>Barra de Tareas (Windows / OS)</span>
                </label>
                <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  {taskbarProtection === 'crop' ? '✂️ No registrar' : taskbarProtection === 'blur' ? '💧 Dejar borrosa' : 'Completa'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setTaskbarProtection('crop')}
                  className={`py-1 px-1 text-xs rounded border text-center transition-all ${
                    taskbarProtection === 'crop'
                      ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-2xs font-extrabold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                  }`}
                  title="No registrar la barra de tareas en la captura de pantallas (la recorta automáticamente)"
                >
                  <div className="font-bold text-[10.5px] leading-tight">No Registrar</div>
                  <div className="text-[8px] opacity-85 leading-tight">Recortar (Recom.)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskbarProtection('blur')}
                  className={`py-1 px-1 text-xs rounded border text-center transition-all ${
                    taskbarProtection === 'blur'
                      ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-2xs font-extrabold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                  }`}
                  title="Dejar borrosa la barra de tareas para que no se vean los iconos de las aplicaciones abiertas"
                >
                  <div className="font-bold text-[10.5px] leading-tight">Dejar Borrosa</div>
                  <div className="text-[8px] opacity-85 leading-tight">Ocultar Iconos</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskbarProtection('none')}
                  className={`py-1 px-1 text-xs rounded border text-center transition-all ${
                    taskbarProtection === 'none'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-extrabold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                  }`}
                  title="Mantiene la pantalla completa incluyendo la barra inferior"
                >
                  <div className="font-bold text-[10.5px] leading-tight">Completa</div>
                  <div className="text-[8px] opacity-85 leading-tight">Sin filtrar</div>
                </button>
              </div>
            </div>

            {/* Bottom info note */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 shrink-0">
              <span className="flex items-center gap-1 text-indigo-700 font-medium">
                <Save className="w-3 h-3 text-indigo-600" />
                Datos conservados automáticamente
              </span>
              {!existingManual && (topic || context) && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="text-slate-400 hover:text-red-600 font-medium transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Source Tabs & Capture / Record (50% width) */}
          <div className="lg:col-span-6 flex flex-col h-full overflow-hidden bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs min-h-0">
            {/* Source Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('record')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'record'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <MonitorPlay className="w-3.5 h-3.5" />
                <span>Grabar Pantalla + Voz</span>
                <span className={`text-[9px] px-1 py-0.5 rounded-full font-bold ${activeTab === 'record' ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-100 text-indigo-700'}`}>
                  Recomendado
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('screenshots')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'screenshots'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Capturas de Pantalla ({screenshots.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'video'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Subir Video ({extractedFrames.length})</span>
              </button>
            </div>

            {/* Tab Contents: Flex-1 and Overflow controlled */}
            <div className="flex-1 overflow-y-auto pt-2 flex flex-col pr-1 min-h-0 scrollbar-thin">
              {/* TAB 1: SCREEN RECORDING + MS TEAMS STYLE AUDIO TRANSCRIPTION */}
              {activeTab === 'record' && (
                <div className="flex flex-col gap-3">
                  {/* Pre-recording audio configuration card */}
                  {!isRecording && (
                    <div className="p-3 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-slate-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs shrink-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                          <Mic className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              Audio y Transcripción en Vivo (tipo MS Teams)
                            </h4>
                            <span className="text-[9.5px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full border border-purple-200 shrink-0">
                              Español Activo
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate mt-0.5">
                            Escucha tus explicaciones y transcribe cada frase para enriquecer las instrucciones y consejos.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                          <input
                            type="checkbox"
                            checked={enableInstructorAudio}
                            onChange={(e) => setEnableInstructorAudio(e.target.checked)}
                            className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span>Micrófono</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Recorder Control Center */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 gap-2.5 text-center shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow transition-all ${
                        isRecording
                          ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-200'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {isRecording ? <Radio className="w-6 h-6" /> : <MonitorPlay className="w-6 h-6" />}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {isRecording ? 'Grabando Pantalla y Transcribiendo Voz del Instructor...' : 'Grabador de Pantalla con Detección y Audio'}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-lg mt-0.5">
                        {isRecording
                          ? `Tiempo: ${speechTranscriptionService.formatTime(recordingDuration)} · Captura automática de cambios y transcripción de voz activa.`
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
                          <span>{autoSnapshots.length} acciones capturadas (Auto-detector activo)</span>
                        </div>

                        {/* Quick action triggers */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTriggerActionSnapshot('custom', 'Paso marcado por el instructor')}
                            className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                            title="Toma una captura de pantalla inmediatamente en este instante exacto"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>📸 Capturar Paso Ahora</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerActionSnapshot('type')}
                            className="px-2.5 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 transition-colors"
                            title="Registrar llenado de campo o selección"
                          >
                            📝 Campo / Opción
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerActionSnapshot('click')}
                            className="px-2.5 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-colors"
                            title="Registrar clic en botón o elemento"
                          >
                            🖱️ Clic
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
                            💾 Guardar
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
                {!isRecording && (
                  <div className="bg-gradient-to-br from-purple-50/70 to-indigo-50/50 rounded-xl p-5 border border-purple-200 flex flex-col gap-3 shadow-xs">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-purple-200/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                          <MessageSquareQuote className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Transcripción y Minuta del Paso a Paso (Instructor)</span>
                            <span className="text-[11px] bg-purple-200/80 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                              {instructorTranscripts.length} {instructorTranscripts.length === 1 ? 'frase' : 'frases'}
                            </span>
                          </h4>
                          <p className="text-xs text-purple-900/80">
                            Gemini AI utiliza esta transcripción para crear los pasos exactos y extraer pantallas sincronizadas con cada actividad.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                        {/* Botón Sincronizar Pantallas con Transcripción */}
                        {videoFile && instructorTranscripts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSyncScreensWithTranscript()}
                            disabled={isExtracting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            title="Extrae fotogramas en los momentos exactos de la transcripción, eliminando pantallas iniciales inactivas y capturando todas las acciones en la pantalla de trabajo"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
                            <span>Sincronizar pantallas con transcripción</span>
                          </button>
                        )}

                        {/* Botón Pegar Transcripción con Tiempos */}
                        <button
                          type="button"
                          onClick={() => setShowImportTranscriptModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 font-semibold text-xs rounded-lg border border-purple-300 shadow-2xs transition-colors"
                          title="Pega una transcripción existente con tiempos [mm:ss] para alinear las capturas"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Pegar Transcripción [mm:ss]</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const phrase = prompt('Escribe la indicación o consejo que dio el instructor:');
                            if (phrase && phrase.trim()) {
                              handleAddInstructorSpeechPhrase(phrase.trim());
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100/70 hover:bg-purple-200/80 text-purple-800 font-semibold text-xs rounded-lg border border-purple-200 shadow-2xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Añadir frase</span>
                        </button>
                      </div>
                    </div>

                    {instructorTranscripts.length === 0 ? (
                      <div className="py-4 px-3 bg-white/70 rounded-lg border border-dashed border-purple-200 text-center flex flex-col items-center gap-2">
                        <Subtitles className="w-6 h-6 text-purple-400" />
                        <p className="text-xs text-slate-600 max-w-md">
                          ¿Tienes una transcripción o minuta paso a paso de lo que se realizó en el video?
                          Pégala para que la IA extraiga las pantallas activas y genere los pasos correspondientes.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowImportTranscriptModal(true)}
                          className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Pegar Transcripción Paso a Paso</span>
                        </button>
                      </div>
                    ) : null}

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
                              <div className="flex items-center gap-1.5 flex-1">
                                <input
                                  type="text"
                                  value={editingTranscriptText}
                                  onChange={(e) => setEditingTranscriptText(e.target.value)}
                                  className="flex-1 text-xs px-2.5 py-1 border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  autoFocus
                                />
                                <DictationButton
                                  value={editingTranscriptText}
                                  onChange={setEditingTranscriptText}
                                  title="Dictar corrección por voz"
                                  size="xs"
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                          Secuencia Capturada ({autoSnapshots.length} capturas)
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium hidden sm:inline">
                          Clic para ampliar
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Botón Guardar Borrador habilitado en la zona destacada */}
                        <button
                          type="button"
                          onClick={handleSaveDraftManual}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm border border-amber-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          title="Guarda inmediatamente un borrador con todos los fotogramas y la transcripción de voz para editarlo sin perder nada"
                        >
                          <Save className="w-3.5 h-3.5 text-amber-950" />
                          <span>Guardar Borrador</span>
                        </button>

                        {/* Botón habilitado en el área marcada en rojo para ver a pantalla completa */}
                        <button
                          type="button"
                          onClick={() => setFullscreenViewer({ isOpen: true, currentIndex: 0, source: 'snapshots' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm border border-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          title="Abrir visor en pantalla completa para inspeccionar todos los fotogramas en alta resolución"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Ver a Pantalla Completa</span>
                        </button>

                        {/* Acciones Rápidas de Barra de Tareas */}
                        <button
                          type="button"
                          onClick={handleBatchCropTaskbar}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-2xs transition-colors"
                          title="Recorta automáticamente la barra de tareas de Windows (~5% inferior) en todas las capturas"
                        >
                          <Scissors className="w-3.5 h-3.5 text-amber-600" />
                          <span>Recortar barra en todas</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleBatchBlurTaskbar}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-2xs transition-colors"
                          title="Aplica difuminado a la barra de tareas de Windows en todas las capturas para proteger iconos de apps"
                        >
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Difuminar barra</span>
                        </button>

                        {videoFile && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (videoFile) {
                                setIsExtracting(true);
                                try {
                                  const extra = await extractFramesFromVideo(videoFile, {
                                    maxFrames: 12,
                                    intervalSeconds: 3,
                                  });
                                  const mappedExtra: AutoCapturedSnapshot[] = extra.map((ef, i) => ({
                                    id: ef.id,
                                    timestamp: ef.timestamp,
                                    dataUrl: ef.dataUrl,
                                    reason: 'change_detected',
                                    label: `Fotograma adicional (${Math.round(ef.timestamp)}s)`,
                                    differenceScore: 1,
                                  }));
                                  setAutoSnapshots((prev) => [...prev, ...mappedExtra]);
                                  setExtractedFrames((prev) => [...prev, ...extra]);
                                } catch (err) {
                                  console.error('Error extracting extra frames:', err);
                                } finally {
                                  setIsExtracting(false);
                                }
                              }
                            }}
                            disabled={isExtracting}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors self-start sm:self-auto disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                              {isExtracting ? 'Extrayendo...' : 'Extraer más fotogramas'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                      {autoSnapshots.map((snap, idx) => (
                        <div
                          key={snap.id}
                          onClick={() => setFullscreenViewer({ isOpen: true, currentIndex: idx, source: 'snapshots' })}
                          className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-900 shadow-xs cursor-pointer group hover:ring-2 hover:ring-indigo-500 hover:border-indigo-500 transition-all"
                          title={`Fotograma #${idx + 1} - Clic para ver en pantalla completa`}
                        >
                          <img src={snap.dataUrl} alt={snap.label} className="w-full h-24 object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-[11px] font-semibold">
                            <Maximize2 className="w-4 h-4 text-white drop-shadow" />
                            <span>Ampliar</span>
                          </div>
                          <span className="absolute top-1.5 left-1.5 bg-indigo-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow z-10 max-w-[70%] truncate">
                            {idx + 1}. {snap.label}
                          </span>

                          {/* Quick Crop & Delete Action Buttons */}
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCropModal({
                                  isOpen: true,
                                  imageSrc: snap.dataUrl,
                                  imageTitle: snap.label,
                                  targetId: snap.id,
                                  source: 'snapshots',
                                });
                              }}
                              className="p-1 bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 rounded shadow-xs transition-colors"
                              title="Editar tamaño y recortar esta captura"
                            >
                              <Crop className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteViewerItem(snap.id);
                              }}
                              className="p-1 bg-white/95 hover:bg-white text-slate-700 hover:text-red-600 rounded shadow-xs transition-colors"
                              title="Eliminar captura"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SCREENSHOTS UPLOAD */}
            {activeTab === 'screenshots' && (
              <div className="pt-2 flex flex-col gap-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5 shrink-0"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleScreenshotFiles(e.target.files)}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                      Haz clic para subir capturas
                    </span>{' '}
                    <span className="text-slate-500 text-xs">o arrastra tus archivos aquí</span>
                  </div>
                  <p className="text-[11px] text-indigo-600 font-medium">
                    💡 Consejo: ¡También puedes presionar <kbd className="px-1 py-0.5 bg-white border rounded shadow-2xs font-mono text-[10px]">Ctrl + V</kbd> para pegar capturas directamente desde el portapapeles!
                  </p>
                </div>

                {/* Screenshot Previews */}
                {screenshots.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Secuencia de Pasos ({screenshots.length})
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveDraftManual}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm border border-amber-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          title="Guardar borrador con las capturas actuales"
                        >
                          <Save className="w-3.5 h-3.5 text-amber-950" />
                          <span>Guardar Borrador</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFullscreenViewer({ isOpen: true, currentIndex: 0, source: 'screenshots' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm border border-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          title="Ver y navegar todas las capturas a pantalla completa"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Ver a Pantalla Completa</span>
                        </button>

                        {/* Batch Taskbar Privacy Buttons */}
                        <button
                          type="button"
                          onClick={handleBatchCropTaskbar}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-2xs transition-colors"
                          title="Recorta automáticamente la barra de tareas de Windows (~5% inferior) en todas las capturas"
                        >
                          <Scissors className="w-3.5 h-3.5 text-amber-600" />
                          <span>Recortar barra en todas</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleBatchBlurTaskbar}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-2xs transition-colors"
                          title="Aplica difuminado a la barra de tareas en todas las capturas para proteger iconos de apps"
                        >
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Difuminar barra</span>
                        </button>

                        <button
                          onClick={() => setScreenshots([])}
                          className="text-xs text-red-600 hover:underline ml-1"
                        >
                          Limpiar todas
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2.5">
                      {screenshots.map((s, idx) => (
                        <div
                          key={s.id}
                          onClick={() => setFullscreenViewer({ isOpen: true, currentIndex: idx, source: 'screenshots' })}
                          className="relative rounded-lg border border-slate-200 overflow-hidden group bg-slate-900 cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:border-indigo-500 transition-all shadow-xs"
                          title={`Captura #${idx + 1} - Clic para ampliar`}
                        >
                          <img
                            src={s.dataUrl}
                            alt={s.name}
                            className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-1 left-1 bg-indigo-600/90 text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded shadow z-10">
                            #{idx + 1}
                          </div>

                          {/* Action Buttons: Crop & Delete */}
                          <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCropModal({
                                  isOpen: true,
                                  imageSrc: s.dataUrl,
                                  imageTitle: s.name,
                                  targetId: s.id,
                                  source: 'screenshots',
                                });
                              }}
                              className="p-1 bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 rounded shadow-xs transition-colors"
                              title="Editar tamaño y recortar esta captura para ahorrar espacio en el PDF"
                            >
                              <Crop className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeScreenshot(s.id);
                              }}
                              className="p-1 bg-white/95 hover:bg-white text-slate-700 hover:text-red-600 rounded shadow-xs transition-colors"
                              title="Eliminar captura"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="p-1 bg-white text-[10px] font-medium text-slate-700 truncate">
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
              <div className="pt-2 flex flex-col gap-3">
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5 shrink-0"
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
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                      {videoFile ? videoFile.name : 'Haz clic para seleccionar un video'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
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
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveDraftManual}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm border border-amber-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          title="Guardar borrador con los fotogramas seleccionados"
                        >
                          <Save className="w-3.5 h-3.5 text-amber-950" />
                          <span>Guardar Borrador</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFullscreenViewer({ isOpen: true, currentIndex: 0, source: 'extracted' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm border border-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          title="Ver fotogramas extraídos a pantalla completa"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Ver a Pantalla Completa</span>
                        </button>

                        {/* Batch Taskbar Privacy Buttons */}
                        <button
                          type="button"
                          onClick={handleBatchCropTaskbar}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-2xs transition-colors"
                          title="Recorta automáticamente la barra de tareas de Windows (~5% inferior) en todos los fotogramas"
                        >
                          <Scissors className="w-3.5 h-3.5 text-amber-600" />
                          <span>Recortar barra en todas</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleBatchBlurTaskbar}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-2xs transition-colors"
                          title="Aplica difuminado a la barra de tareas en todos los fotogramas para proteger iconos"
                        >
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Difuminar barra</span>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                      {extractedFrames.map((frame, idx) => (
                        <div
                          key={frame.id}
                          onClick={() => toggleFrameSelection(frame.id)}
                          className={`relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all group ${
                            frame.selected
                              ? 'border-indigo-600 shadow-md ring-2 ring-indigo-200'
                              : 'border-slate-200 opacity-60'
                          }`}
                        >
                          <img
                            src={frame.dataUrl}
                            alt={`Frame ${idx + 1}`}
                            className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-1.5 left-1.5 z-10">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow ${
                                frame.selected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-white'
                              }`}
                            >
                              {frame.label || `#${idx + 1}`}
                            </span>
                          </div>

                          {/* Quick Crop and Select overlay */}
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-20">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCropModal({
                                  isOpen: true,
                                  imageSrc: frame.dataUrl,
                                  imageTitle: frame.label || `Fotograma #${idx + 1}`,
                                  targetId: frame.id,
                                  source: 'extracted',
                                });
                              }}
                              className="p-1 bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 rounded shadow-xs transition-colors opacity-0 group-hover:opacity-100"
                              title="Editar tamaño y recortar este fotograma"
                            >
                              <Crop className="w-3.5 h-3.5" />
                            </button>
                            {frame.selected ? (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 bg-white rounded-full shadow" />
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
          </div>

          {/* Error Message with Quick Actions */}
          {errorMessage && (
            <div className="lg:col-span-12 p-3 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
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
                  {activeCapturesCount > 0 ? `Crear Manual Directo (${activeCapturesCount} Pasos)` : 'Crear Manual Directo'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="py-1.5 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveDraftManual}
              disabled={
                isGenerating ||
                (activeTab === 'screenshots' && screenshots.length === 0) ||
                (activeTab === 'video' && extractedFrames.filter((f) => f.selected).length === 0) ||
                (activeTab === 'record' && extractedFrames.length === 0 && autoSnapshots.length === 0 && !topic.trim())
              }
              className="py-2 px-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-amber-950 font-bold text-xs rounded-xl border border-amber-500 shadow-2xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
              title="Guarda un borrador con todas tus capturas, fotogramas y texto para editarlo después sin perder la grabación"
            >
              <Save className="w-3.5 h-3.5 text-amber-950" />
              <span>Guardar Borrador</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateDirectManual}
              disabled={
                isGenerating ||
                (activeTab === 'screenshots' && screenshots.length === 0) ||
                (activeTab === 'video' && extractedFrames.filter((f) => f.selected).length === 0) ||
                (activeTab === 'record' && extractedFrames.length === 0 && autoSnapshots.length === 0)
              }
              className="py-2 px-3.5 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 shadow-2xs transition-colors"
              title="Compila el manual de inmediato con tus capturas y transcripción de voz sin consultar a la IA"
            >
              {activeCapturesCount > 0 ? `Creación Directa (${activeCapturesCount} Pasos)` : 'Creación Directa (Inmediata)'}
            </button>

            <button
              onClick={handleGenerateManual}
              disabled={
                isGenerating ||
                (activeTab === 'screenshots' && screenshots.length === 0) ||
                (activeTab === 'video' && extractedFrames.filter((f) => f.selected).length === 0) ||
                (activeTab === 'record' && extractedFrames.length === 0 && autoSnapshots.length === 0)
              }
              className={`py-2 px-5 ${
                existingManual ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
              } disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2`}
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

      {/* FULLSCREEN FRAME VIEWER LIGHTBOX */}
      {fullscreenViewer.isOpen && currentViewerItem && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200"
          onClick={() => setFullscreenViewer((prev) => ({ ...prev, isOpen: false }))}
        >
          {/* Top Control Bar */}
          <div
            className="flex items-center justify-between gap-3 text-white shrink-0 z-10 pb-2 border-b border-slate-800/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-600 text-white font-mono font-bold text-xs rounded-full shadow-xs">
                Fotograma {fullscreenViewer.currentIndex + 1} de {currentViewerItems.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200 truncate max-w-sm sm:max-w-md">
                  {currentViewerItem.label}
                </span>
                {currentViewerItem.timestamp !== undefined && (
                  <span className="text-xs text-indigo-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    ⏱️ {speechTranscriptionService.formatTime(currentViewerItem.timestamp)}
                  </span>
                )}
              </div>
            </div>

            {/* Middle shortcut hints */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[10px]">←</kbd>
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[10px]">→</kbd>
                <span>Navegar</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[10px]">ESC</kbd>
                <span>Cerrar</span>
              </span>
            </div>

            {/* Right action buttons */}
            <div className="flex items-center gap-2">
              {/* Botón Recortar / Editar Tamaño */}
              <button
                type="button"
                onClick={() =>
                  setCropModal({
                    isOpen: true,
                    imageSrc: currentViewerItem.dataUrl,
                    imageTitle: currentViewerItem.label,
                    targetId: currentViewerItem.id,
                    source: fullscreenViewer.source,
                  })
                }
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 text-xs font-bold"
                title="Editar tamaño y recortar esta captura para el manual y PDF"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Recortar</span>
              </button>

              {/* Botón 1-clic Quitar Barra de Tareas */}
              <button
                type="button"
                onClick={async () => {
                  const cropped = await cropTaskbarFromDataUrl(currentViewerItem.dataUrl);
                  handleApplyCrop(cropped);
                }}
                className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Elimina automáticamente los iconos de la barra de tareas de Windows (~5% inferior)"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Quitar Barra</span>
              </button>

              {/* Botón 1-clic Difuminar Barra */}
              <button
                type="button"
                onClick={async () => {
                  const blurred = await blurTaskbarOnDataUrl(currentViewerItem.dataUrl);
                  handleApplyCrop(blurred);
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Difumina la barra de tareas de Windows para que no se vean los iconos de aplicaciones abiertas"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Difuminar Barra</span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteViewerItem(currentViewerItem.id)}
                className="px-2.5 py-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Descartar este fotograma de la secuencia"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Descartar</span>
              </button>

              <button
                type="button"
                onClick={() => setFullscreenViewer((prev) => ({ ...prev, isOpen: false }))}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Cerrar visor a pantalla completa (ESC)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Main Stage with Large High-Res Image & Floating Chevrons */}
          <div
            className="flex-1 flex items-center justify-between gap-3 p-2 min-h-0 relative my-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Chevron Button */}
            <button
              type="button"
              onClick={() =>
                setFullscreenViewer((prev) => ({
                  ...prev,
                  currentIndex:
                    (prev.currentIndex - 1 + currentViewerItems.length) % currentViewerItems.length,
                }))
              }
              className="p-3 sm:p-4 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white shadow-2xl border border-slate-700 transition-all hover:scale-110 active:scale-95 shrink-0 z-20 group"
              title="Fotograma anterior (←)"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* High-Resolution Frame Display */}
            <div className="flex-1 h-full flex items-center justify-center p-1 sm:p-2 min-h-0 overflow-hidden">
              <img
                src={currentViewerItem.dataUrl}
                alt={currentViewerItem.label}
                className="max-h-[72vh] max-w-[88vw] w-auto h-auto object-contain rounded-xl shadow-2xl border border-slate-800/90 bg-slate-900"
              />
            </div>

            {/* Right Chevron Button */}
            <button
              type="button"
              onClick={() =>
                setFullscreenViewer((prev) => ({
                  ...prev,
                  currentIndex: (prev.currentIndex + 1) % currentViewerItems.length,
                }))
              }
              className="p-3 sm:p-4 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white shadow-2xl border border-slate-700 transition-all hover:scale-110 active:scale-95 shrink-0 z-20 group"
              title="Siguiente fotograma (→)"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Bottom Filmstrip Carousel */}
          <div
            className="h-18 pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 overflow-x-auto scrollbar-thin px-2 shrink-0 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {currentViewerItems.map((item, idx) => {
              const isActive = idx === fullscreenViewer.currentIndex;
              return (
                <button
                  key={item.id || idx}
                  type="button"
                  onClick={() => setFullscreenViewer((prev) => ({ ...prev, currentIndex: idx }))}
                  className={`relative rounded-md overflow-hidden transition-all shrink-0 border ${
                    isActive
                      ? 'ring-2 ring-indigo-500 border-indigo-400 scale-105 shadow-lg opacity-100'
                      : 'border-slate-700/80 opacity-45 hover:opacity-90 hover:border-slate-500'
                  }`}
                  style={{ width: '76px', height: '46px' }}
                  title={`Fotograma #${idx + 1}`}
                >
                  <img src={item.dataUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[9px] font-mono px-1 rounded">
                    #{idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Importar Transcripción con Tiempos [mm:ss] */}
      {showImportTranscriptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Pegar Transcripción / Minuta con Tiempos</h3>
                  <p className="text-xs text-purple-200">
                    Alinea cada momento de la explicación verbal con las pantallas del video
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportTranscriptModal(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-950 flex flex-col gap-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Formato compatible: [mm:ss] o [hh:mm:ss] seguido del texto</span>
                </p>
                <p className="text-purple-900/80">
                  El sistema detectará automáticamente cada marca de tiempo y extraerá las capturas activas en esos momentos exactos del video, evitando fotos redundantes de la pantalla inicial.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Texto de la transcripción paso a paso:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRawTranscriptToImport(
`[00:09] vamos a crear un manual para
[00:16] hacer la distribución de las facturas recibidas en relación a las
[00:27] provisiones realizadas en la orden de compra para los costos indirectos para ello vamos a entrar a la z mmt 0033
[00:51] en la sociedad vamos a indicar la sociedad polk Si queremos verificar varias presionamos enter Si queremos verificar alguna instrucción de embarque en particular podemos ingresar la solicitud o el embarque en este caso Vamos a ingresar la solicitud
[00:56] y como resultado nos va a traer que tenemos
[01:00] asociado con ese número de embarque
[01:02] estas facturas
[01:09] las cuales están relacionadas con esta orden de compra y esta posición
[01:22] en esta columna nosotros podemos ver la provisión donde tenemos 60 dólares en cada uno con un total de $120 y en esta columna podemos ver el número
[01:36] o el importe que corresponde a la cantidad en este caso 140,000 como ese está dentro de los parámetros que corresponden marcamos esa factura y grabamos los datos
[01:39] nos pide la confirmación
[01:52] ahora esa factura ya está disponible en el portal para que sean aprobadas y transformadas en contabilizaciones en la factura miro
[02:05] esta particularmente al parecer tiene un error no nos llegó el importe de la factura en teoría pero está así acá tenemos una provisión de $500
[02:16] y ya hemos recibido una factura por 178 por tanto vamos a tomar esto y vamos a grabar los datos
[02:28] esa factura también ya ha pasado al portal de actualizaciones para que se transforme en una factura en la transacción virus
[02:40] finalmente en la parte de abajo relacionado con esa misma solicitud tenemos estos 88 dólares que aún están a la espera de una factura están relacionadas con ese concepto`
                      );
                    }}
                    className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold underline"
                  >
                    Cargar transcripción de ZMMT0033 (ejemplo del usuario)
                  </button>
                </div>

                <textarea
                  value={rawTranscriptToImport}
                  onChange={(e) => setRawTranscriptToImport(e.target.value)}
                  placeholder={`[00:09] vamos a crear un manual para...\n[00:27] para ello vamos a entrar a la z mmt 0033\n[00:51] en la sociedad vamos a indicar la sociedad polk...\n[01:36] marcamos esa factura y grabamos los datos\n[01:39] nos pide la confirmación`}
                  rows={10}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
                />
              </div>

              {videoFile && (
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoSyncOnImport}
                    onChange={(e) => setAutoSyncOnImport(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">
                      Sincronizar y re-extraer automáticamente las capturas del video
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Elimina las fotos duplicadas de la pantalla inicial y genera una captura activa por cada acción documentada.
                    </span>
                  </div>
                </label>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowImportTranscriptModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleImportTranscriptText}
                disabled={!rawTranscriptToImport.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                <span>Importar y Procesar Transcripción</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Image Cropper & Resizer Modal */}
      <ImageCropModal
        isOpen={cropModal.isOpen}
        imageSrc={cropModal.imageSrc}
        imageTitle={cropModal.imageTitle}
        onApplyCrop={(croppedDataUrl) => handleApplyCrop(croppedDataUrl)}
        onClose={() => setCropModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
