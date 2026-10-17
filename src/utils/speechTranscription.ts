import { InstructorTranscriptSegment } from '../types/manual';

export type TranscriptionStatus = 'inactive' | 'listening' | 'paused' | 'error' | 'unsupported';

export interface SpeechTranscriptionCallbacks {
  onInterim?: (text: string) => void;
  onSentence?: (segment: InstructorTranscriptSegment) => void;
  onStatusChange?: (status: TranscriptionStatus, errorMsg?: string) => void;
  onVolume?: (volume: number) => void; // 0 to 100
}

// Window declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
    AudioContext?: any;
    webkitAudioContext?: any;
  }
}

export class SpeechTranscriptionService {
  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private isRunning = false;
  private startTime = 0;
  private transcripts: InstructorTranscriptSegment[] = [];
  private callbacks: SpeechTranscriptionCallbacks = {};
  private currentLanguage = 'es-ES';
  private manualStopTriggered = false;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public async start(callbacks: SpeechTranscriptionCallbacks, lang: string = 'es-ES'): Promise<boolean> {
    this.callbacks = callbacks;
    this.currentLanguage = lang;
    this.transcripts = [];
    this.manualStopTriggered = false;
    this.startTime = Date.now();

    // 1. Try to initialize microphone audio stream for volume metering
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.setupAudioMetering(this.micStream);
      }
    } catch (micErr) {
      console.warn('Microphone stream access for metering was not granted or failed:', micErr);
      // We will still attempt speech recognition even if direct audio metering is denied
    }

    // 2. Initialize Web Speech API
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      if (this.callbacks.onStatusChange) {
        this.callbacks.onStatusChange(
          'unsupported',
          'El navegador no soporta Web Speech API de forma nativa. Puedes escribir o añadir notas del instructor.'
        );
      }
      return false;
    }

    try {
      this.initRecognition(SpeechRec);
      this.recognition.start();
      this.isRunning = true;
      if (this.callbacks.onStatusChange) {
        this.callbacks.onStatusChange('listening');
      }
      return true;
    } catch (err: any) {
      console.error('Error starting SpeechRecognition:', err);
      if (this.callbacks.onStatusChange) {
        this.callbacks.onStatusChange('error', err.message || 'Error al iniciar reconocimiento de voz.');
      }
      return false;
    }
  }

  private initRecognition(SpeechRec: any) {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // ignore
      }
    }

    this.recognition = new SpeechRec();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.currentLanguage;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      const now = Date.now();
      const relativeTimestamp = Math.max(0, Math.round((now - this.startTime) / 1000));

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0]?.transcript?.trim() || '';

        if (res.isFinal && text) {
          const segment: InstructorTranscriptSegment = {
            id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            timestamp: relativeTimestamp,
            text,
          };
          this.transcripts.push(segment);
          if (this.callbacks.onSentence) {
            this.callbacks.onSentence(segment);
          }
          if (this.callbacks.onInterim) {
            this.callbacks.onInterim('');
          }
        } else {
          interim += text + ' ';
        }
      }

      if (interim && this.callbacks.onInterim) {
        this.callbacks.onInterim(interim.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error event:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Normal silence or intentional abort/stop; do not trigger error
        return;
      }
      if (event.error === 'not-allowed') {
        if (this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange('error', 'Permiso de micrófono bloqueado. Haz clic en el ícono del candado 🔒 en la barra de direcciones y activa el micrófono.');
        }
        this.stop();
      }
    };

    this.recognition.onend = () => {
      // SpeechRecognition in Chrome often stops on silence. If still running and not stopped manually, auto-restart!
      if (this.isRunning && !this.manualStopTriggered) {
        try {
          this.recognition.start();
        } catch (e) {
          // If restart fails, wait 300ms and retry
          setTimeout(() => {
            if (this.isRunning && !this.manualStopTriggered) {
              try {
                this.recognition.start();
              } catch (retryErr) {
                console.warn('Could not auto-restart SpeechRecognition:', retryErr);
              }
            }
          }, 300);
        }
      } else {
        if (this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange('inactive');
        }
      }
    };
  }

  private setupAudioMetering(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      this.audioContext = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      this.analyser = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!this.analyser || !this.isRunning) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const volumeScore = Math.min(100, Math.round((avg / 128) * 100));

        if (this.callbacks.onVolume) {
          this.callbacks.onVolume(volumeScore);
        }

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Error setting up audio metering:', e);
    }
  }

  public stop(): InstructorTranscriptSegment[] {
    this.manualStopTriggered = true;
    this.isRunning = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        // ignore
      }
      this.audioContext = null;
    }

    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange('inactive');
    }

    return [...this.transcripts];
  }

  public addManualSegment(text: string, timestamp?: number): InstructorTranscriptSegment {
    const relativeTimestamp =
      timestamp !== undefined
        ? timestamp
        : Math.max(0, Math.round((Date.now() - (this.startTime || Date.now())) / 1000));

    const segment: InstructorTranscriptSegment = {
      id: `manual-trans-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: relativeTimestamp,
      text: text.trim(),
    };
    this.transcripts.push(segment);
    if (this.callbacks.onSentence) {
      this.callbacks.onSentence(segment);
    }
    return segment;
  }

  public getTranscripts(): InstructorTranscriptSegment[] {
    return [...this.transcripts];
  }

  public getFullText(): string {
    return this.transcripts.map((t) => `[${this.formatTime(t.timestamp)}] ${t.text}`).join('\n');
  }

  public formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export const speechTranscriptionService = new SpeechTranscriptionService();
