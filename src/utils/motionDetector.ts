/**
 * Motion, UI Interaction & Screen Stabilization Detector
 * Listens to a MediaStream from getDisplayMedia, detects both macro transitions (page navigation)
 * AND micro-interactions on the same screen (form inputs, radio buttons, dropdowns, clicks, typing)
 * using multi-scale grid block analysis, accumulated baseline comparison, and voice synchronization.
 */

export interface AutoCapturedSnapshot {
  id: string;
  timestamp: number;
  dataUrl: string;
  reason: 'change_detected' | 'click' | 'enter' | 'save' | 'hotkey' | 'manual_trigger';
  label: string;
  differenceScore: number;
}

export class ScreenActionDetector {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  // Frame comparators
  private previousImageData: ImageData | null = null;
  private baselineImageData: ImageData | null = null; // Image data at the moment of the last snapshot

  private intervalId: any = null;
  private isDetecting = false;
  private lastCaptureTime = 0;
  private pendingCaptureTimeout: any = null;
  private onSnapshotCallback: ((snapshot: AutoCapturedSnapshot) => void) | null = null;

  // Grid dimensions for localized micro-interaction detection
  private readonly sampleWidth = 160;
  private readonly sampleHeight = 90;
  private readonly gridCols = 8;
  private readonly gridRows = 6;

  // Thresholds
  public minCooldownMs = 800; // Allow consecutive actions without spam
  public maxTimeWithoutCaptureMs = 8000; // Max 8s on active screen before taking an anchor snapshot
  private lastSubtleActivityTime = 0;

  public start(
    stream: MediaStream,
    onSnapshot: (snapshot: AutoCapturedSnapshot) => void
  ) {
    this.stream = stream;
    this.onSnapshotCallback = onSnapshot;
    this.isDetecting = true;
    this.lastCaptureTime = Date.now();
    this.lastSubtleActivityTime = Date.now();

    this.video = document.createElement('video');
    this.video.srcObject = stream;
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.play();

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.sampleWidth;
    this.canvas.height = this.sampleHeight;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    // Compare frames every 200ms for high responsiveness
    this.intervalId = setInterval(() => {
      this.checkFrame();
    }, 200);

    // Initial capture at second 0
    setTimeout(() => {
      this.captureNow('change_detected', 'Pantalla Inicial');
    }, 450);
  }

  public stop() {
    this.isDetecting = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.pendingCaptureTimeout) {
      clearTimeout(this.pendingCaptureTimeout);
      this.pendingCaptureTimeout = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Track already stopped
        }
      });
      this.stream = null;
    }
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video = null;
    }
    if (this.canvas) {
      this.canvas.width = 0;
      this.canvas.height = 0;
      this.canvas = null;
      this.ctx = null;
    }
    this.previousImageData = null;
    this.baselineImageData = null;
    this.onSnapshotCallback = null;
  }

  /**
   * Called when the instructor speaks a sentence in the recording.
   * If there has been visual activity on the screen since the last capture,
   * snaps the screen state synchronized with this spoken explanation.
   */
  public notifySpeechSentence(spokenText: string, timestampSec?: number) {
    if (!this.isDetecting || !this.video || !this.video.videoWidth) return;
    const now = Date.now();

    // If at least 2.5s passed since last capture
    if (now - this.lastCaptureTime > 2500) {
      // Check if current screen differs from baseline
      let diff = 0.05;
      if (this.ctx && this.baselineImageData) {
        try {
          this.ctx.drawImage(this.video, 0, 0, this.sampleWidth, this.sampleHeight);
          const current = this.ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);
          diff = this.calculateGlobalDiff(this.baselineImageData, current);
        } catch (e) {
          diff = 0.05;
        }
      }

      // If there's even slight difference (>0.2%) from baseline or user was talking
      if (diff > 0.002) {
        const cleanSnippet = spokenText.length > 55 ? spokenText.slice(0, 52) + '...' : spokenText;
        this.captureNow('change_detected', `Explicación: "${cleanSnippet}"`);
      }
    }
  }

  public captureNow(
    reason: AutoCapturedSnapshot['reason'] = 'hotkey',
    customLabel?: string
  ) {
    if (!this.video || !this.video.videoWidth) return;

    const fullCanvas = document.createElement('canvas');
    const width = Math.min(1280, this.video.videoWidth);
    const height = Math.round(width * (this.video.videoHeight / this.video.videoWidth));
    fullCanvas.width = width;
    fullCanvas.height = height;
    const fullCtx = fullCanvas.getContext('2d');
    if (!fullCtx) return;

    fullCtx.drawImage(this.video, 0, 0, width, height);
    const dataUrl = fullCanvas.toDataURL('image/jpeg', 0.88);

    // Promptly release canvas memory
    fullCanvas.width = 0;
    fullCanvas.height = 0;

    let defaultLabel = 'Captura de Acción';
    if (reason === 'click') defaultLabel = 'Clic detectado';
    if (reason === 'enter') defaultLabel = 'Tecla Enter presionada';
    if (reason === 'save') defaultLabel = 'Acción de Guardar';
    if (reason === 'change_detected') defaultLabel = 'Cambio en pantalla detectado';

    const now = Date.now();
    const snapshot: AutoCapturedSnapshot = {
      id: `auto-snap-${now}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Math.round((now - this.lastCaptureTime) / 100) / 10,
      dataUrl,
      reason,
      label: customLabel || defaultLabel,
      differenceScore: 1,
    };

    this.lastCaptureTime = now;
    this.lastSubtleActivityTime = now;

    // Reset baseline comparison image to this newly taken snapshot
    if (this.ctx) {
      try {
        this.ctx.drawImage(this.video, 0, 0, this.sampleWidth, this.sampleHeight);
        this.baselineImageData = this.ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);
      } catch (e) {
        // ignore
      }
    }

    if (this.onSnapshotCallback) {
      this.onSnapshotCallback(snapshot);
    }
  }

  private checkFrame() {
    if (!this.video || !this.canvas || !this.ctx || !this.video.videoWidth) return;

    this.ctx.drawImage(this.video, 0, 0, this.sampleWidth, this.sampleHeight);
    const currentImageData = this.ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);

    if (!this.baselineImageData) {
      this.baselineImageData = currentImageData;
    }

    const now = Date.now();
    const timeSinceLastCapture = now - this.lastCaptureTime;

    if (this.previousImageData) {
      // 1. Motion diff between consecutive 200ms frames (detects if user is currently moving / typing)
      const instantDiff = this.calculateGlobalDiff(this.previousImageData, currentImageData);

      // 2. Accumulated diff compared to baseline (the state at the last captured snapshot)
      const baselineDiff = this.calculateGlobalDiff(this.baselineImageData, currentImageData);

      // 3. Regional / Local grid block analysis (detects local clicks, checkboxes, inputs, dropdowns)
      const maxBlockBaselineDiff = this.calculateMaxBlockDiff(this.baselineImageData, currentImageData);
      const maxBlockInstantDiff = this.calculateMaxBlockDiff(this.previousImageData, currentImageData);

      if (instantDiff > 0.002 || baselineDiff > 0.003 || maxBlockInstantDiff > 0.03) {
        this.lastSubtleActivityTime = now;
      }

      // Micro-action detection conditions:
      // Condition A: Significant global change (> 1.2% total screen)
      const hasGlobalChange = baselineDiff > 0.012;

      // Condition B: Localized micro-interaction on the same screen (e.g. typing in a field, selecting a radio button)
      // Even if the global diff is only 0.3%, a single block having > 6.5% change indicates a clear local action!
      const hasLocalMicroAction = maxBlockBaselineDiff > 0.065 && baselineDiff > 0.0025;

      // Condition C: Sudden burst of action settled (e.g. clicked button or opened menu)
      const hasInstantAction = maxBlockInstantDiff > 0.08 || instantDiff > 0.015;

      // If change detected and cooled down
      if ((hasGlobalChange || hasLocalMicroAction || hasInstantAction) && timeSinceLastCapture > this.minCooldownMs) {
        // Wait 380ms for transition/typing to settle before taking high-res snapshot
        if (!this.pendingCaptureTimeout) {
          this.pendingCaptureTimeout = setTimeout(() => {
            if (this.isDetecting && this.video) {
              const actionLabel = hasLocalMicroAction
                ? 'Interacción en pantalla (campo / selección)'
                : `Acción detectada (${Math.round(baselineDiff * 100)}% de cambio)`;

              this.captureNow('change_detected', actionLabel);
            }
            this.pendingCaptureTimeout = null;
          }, 380);
        }
      }

      // Condition D: Active screen heartbeat (if the user spent > 8s on the same screen while explaining, and there was activity)
      if (timeSinceLastCapture > this.maxTimeWithoutCaptureMs && (now - this.lastSubtleActivityTime < 3000)) {
        if (!this.pendingCaptureTimeout) {
          this.captureNow('change_detected', 'Continuación del procedimiento');
        }
      }
    }

    this.previousImageData = currentImageData;
  }

  /**
   * Calculates overall percentage of changed pixels between two sample frames.
   */
  private calculateGlobalDiff(img1: ImageData, img2: ImageData): number {
    const data1 = img1.data;
    const data2 = img2.data;
    let changedPixels = 0;
    const totalPixels = data1.length / 4;

    for (let i = 0; i < data1.length; i += 4) {
      const rDiff = Math.abs(data1[i] - data2[i]);
      const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
      const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);
      // Threshold 45 captures subtle UI highlights, text cursors, and radio button state changes
      if (rDiff + gDiff + bDiff > 45) {
        changedPixels++;
      }
    }

    return changedPixels / totalPixels;
  }

  /**
   * Divides the frame into an 8x6 grid of 48 spatial blocks and returns
   * the maximum percentage change found in any individual block.
   * This is key to detecting localized actions (like a text input, toggle or radio) on a static screen.
   */
  private calculateMaxBlockDiff(img1: ImageData, img2: ImageData): number {
    const data1 = img1.data;
    const data2 = img2.data;

    const blockW = Math.floor(this.sampleWidth / this.gridCols); // 20px
    const blockH = Math.floor(this.sampleHeight / this.gridRows); // 15px
    const pixelsPerBlock = blockW * blockH;

    const blockChangedCounts = new Array(this.gridCols * this.gridRows).fill(0);

    for (let y = 0; y < this.sampleHeight; y++) {
      const rowIdx = Math.min(this.gridRows - 1, Math.floor(y / blockH));
      for (let x = 0; x < this.sampleWidth; x++) {
        const colIdx = Math.min(this.gridCols - 1, Math.floor(x / blockW));
        const blockIndex = rowIdx * this.gridCols + colIdx;

        const pixelIdx = (y * this.sampleWidth + x) * 4;
        const rDiff = Math.abs(data1[pixelIdx] - data2[pixelIdx]);
        const gDiff = Math.abs(data1[pixelIdx + 1] - data2[pixelIdx + 1]);
        const bDiff = Math.abs(data1[pixelIdx + 2] - data2[pixelIdx + 2]);

        if (rDiff + gDiff + bDiff > 45) {
          blockChangedCounts[blockIndex]++;
        }
      }
    }

    let maxRatio = 0;
    for (let b = 0; b < blockChangedCounts.length; b++) {
      const ratio = blockChangedCounts[b] / pixelsPerBlock;
      if (ratio > maxRatio) {
        maxRatio = ratio;
      }
    }

    return maxRatio;
  }
}

export const screenActionDetector = new ScreenActionDetector();
