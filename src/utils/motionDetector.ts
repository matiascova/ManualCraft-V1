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
  focalX?: number; // Normalized 0-100 percentage where the interaction happened
  focalY?: number; // Normalized 0-100 percentage where the interaction happened
  focalWidth?: number;
  focalHeight?: number;
}

export class ScreenActionDetector {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  // Frame comparators
  private previousImageData: ImageData | null = null;
  private baselineImageData: ImageData | null = null; // Image data at the moment of the last snapshot
  private initialScreenImageData: ImageData | null = null; // Reference frame of initial screen
  private lastCapturedImageData: ImageData | null = null; // Exact image data of the last emitted snapshot
  private hasLeftInitialScreen = false;
  private initialCaptureDone = false;

  // Real-time detected focal point of the last UI interaction (typing, clicking, filling)
  private lastDetectedFocal: { x: number; y: number; width?: number; height?: number } | null = null;

  private intervalId: any = null;
  private isDetecting = false;
  private lastCaptureTime = 0;
  private pendingCaptureTimeout: any = null;
  private onSnapshotCallback: ((snapshot: AutoCapturedSnapshot) => void) | null = null;

  // High-fidelity grid dimensions for localized micro-interaction detection (typing letters, clicking buttons, checkboxes, inputs)
  private readonly sampleWidth = 320;
  private readonly sampleHeight = 180;
  private readonly gridCols = 16;
  private readonly gridRows = 9;

  // Thresholds
  public minCooldownMs = 500; // Responsive cooldown between distinct actions
  public maxTimeWithoutCaptureMs = 9000; // Max time on active work screen before taking an anchor snapshot
  private lastSubtleActivityTime = 0;

  // Taskbar privacy & clean screenshot mode ('crop' | 'blur' | 'none')
  public taskbarProtection: 'crop' | 'blur' | 'none' = 'crop';

  public setTaskbarProtection(mode: 'crop' | 'blur' | 'none') {
    this.taskbarProtection = mode;
  }

  public start(
    stream: MediaStream,
    onSnapshot: (snapshot: AutoCapturedSnapshot) => void
  ) {
    this.stream = stream;
    this.onSnapshotCallback = onSnapshot;
    this.isDetecting = true;
    this.lastCaptureTime = Date.now();
    this.lastSubtleActivityTime = Date.now();
    this.hasLeftInitialScreen = false;
    this.initialCaptureDone = false;
    this.lastCapturedImageData = null;
    this.lastDetectedFocal = null;

    this.video = document.createElement('video');
    this.video.srcObject = stream;
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.play();

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.sampleWidth;
    this.canvas.height = this.sampleHeight;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    // Compare frames every 180ms for high responsiveness
    this.intervalId = setInterval(() => {
      this.checkFrame();
    }, 180);

    // Initial capture at second 0 (strictly once)
    setTimeout(() => {
      if (this.isDetecting && !this.initialCaptureDone) {
        this.captureNow('change_detected', 'Pantalla Inicial');
        this.initialCaptureDone = true;
      }
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
    this.initialScreenImageData = null;
    this.lastCapturedImageData = null;
    this.lastDetectedFocal = null;
    this.onSnapshotCallback = null;
  }

  /**
   * Procedural action keywords in Spanish for business/ERP processes
   */
  private static readonly ACTION_KEYWORDS = [
    'marcar', 'marcamos', 'marca', 'grabar', 'grabamos', 'graba', 'guardar', 'guardamos',
    'confirmar', 'confirmacion', 'confirmación', 'seleccionar', 'seleccionamos', 'indicar',
    'ingresar', 'ingresamos', 'entrar', 'entramos', 'factura', 'facturas', 'provision', 'provisión',
    'embarque', 'solicitud', 'posicion', 'posición', 'tomar', 'tomamos', 'enter', 'clic',
    'verificar', 'verificamos', 'revisar', 'revisamos', 'miro', 'virus', 'orden de compra',
    'aceptar', 'sociedad', 'ejecutar', 'buscar', 'consulta'
  ];

  /**
   * Called when the instructor speaks a sentence in the recording.
   */
  public notifySpeechSentence(spokenText: string, timestampSec?: number) {
    if (!this.isDetecting || !this.video || !this.video.videoWidth || !this.ctx) return;
    const now = Date.now();
    const lowerText = (spokenText || '').toLowerCase();

    // Sample current frame
    this.ctx.drawImage(this.video, 0, 0, this.sampleWidth, this.sampleHeight);
    const current = this.ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);

    // Check if this spoken sentence indicates a real procedural action
    const hasActionKeyword = ScreenActionDetector.ACTION_KEYWORDS.some((kw) => lowerText.includes(kw));

    // Dynamic cooldown: allow faster captures (1000ms) if explicit action keyword mentioned
    const cooldownNeeded = hasActionKeyword ? 1000 : 2500;
    if (now - this.lastCaptureTime > cooldownNeeded) {
      let diff = 0.05;
      if (this.lastCapturedImageData) {
        diff = this.calculateGlobalDiff(this.lastCapturedImageData, current);
      } else if (this.baselineImageData) {
        diff = this.calculateGlobalDiff(this.baselineImageData, current);
      }

      // Check if current screen has real interaction
      if (diff > 0.003 || (hasActionKeyword && diff > 0.0008)) {
        this.hasLeftInitialScreen = true;
        const cleanSnippet = spokenText.length > 55 ? spokenText.slice(0, 52) + '...' : spokenText;
        const reasonLabel = hasActionKeyword ? `Acción: "${cleanSnippet}"` : `Explicación: "${cleanSnippet}"`;
        this.captureNow('change_detected', reasonLabel);
      }
    }
  }

  public captureNow(
    reason: AutoCapturedSnapshot['reason'] = 'hotkey',
    customLabel?: string,
    focalHint?: { x: number; y: number; width?: number; height?: number }
  ) {
    if (!this.video || !this.video.videoWidth) return;

    // Grab current sample for deduplication check
    let currentSample: ImageData | null = null;
    if (this.ctx) {
      try {
        this.ctx.drawImage(this.video, 0, 0, this.sampleWidth, this.sampleHeight);
        currentSample = this.ctx.getImageData(0, 0, this.sampleWidth, this.sampleHeight);
      } catch (e) {
        // continue
      }
    }

    const effectiveFocal = focalHint || this.lastDetectedFocal;

    // Intelligent Deduplication: Do NOT drop micro-interactions (like entering text or clicking a button)
    if (currentSample && this.lastCapturedImageData) {
      const diffWithLast = this.calculateGlobalDiff(this.lastCapturedImageData, currentSample);
      // Only skip if frame is practically identical (<0.0006) and there is no fresh focal interaction
      if (diffWithLast < 0.0006 && !effectiveFocal && reason !== 'hotkey' && reason !== 'manual_trigger') {
        return;
      }
    }

    const fullCanvas = document.createElement('canvas');
    const fullCtx = fullCanvas.getContext('2d');
    if (!fullCtx) return;

    const maxWidth = 1280;
    const origW = this.video.videoWidth;
    const origH = this.video.videoHeight;
    const width = Math.min(maxWidth, origW);
    const height = Math.round(width * (origH / origW));

    // Standard taskbar ratio: bottom ~5.2% of height
    const taskbarRatio = 0.052;

    if (this.taskbarProtection === 'crop') {
      const croppedSrcH = Math.round(origH * (1 - taskbarRatio));
      const targetH = Math.round(width * (croppedSrcH / origW));
      fullCanvas.width = width;
      fullCanvas.height = targetH;
      fullCtx.drawImage(
        this.video,
        0, 0, origW, croppedSrcH,
        0, 0, width, targetH
      );
    } else if (this.taskbarProtection === 'blur') {
      fullCanvas.width = width;
      fullCanvas.height = height;
      fullCtx.drawImage(this.video, 0, 0, width, height);

      const tbHeight = Math.max(38, Math.round(height * taskbarRatio));
      const tbY = height - tbHeight;

      try {
        fullCtx.save();
        const miniCanvas = document.createElement('canvas');
        miniCanvas.width = Math.max(20, Math.round(width / 12));
        miniCanvas.height = Math.max(4, Math.round(tbHeight / 12));
        const miniCtx = miniCanvas.getContext('2d');
        if (miniCtx) {
          miniCtx.drawImage(fullCanvas, 0, tbY, width, tbHeight, 0, 0, miniCanvas.width, miniCanvas.height);
          fullCtx.imageSmoothingEnabled = true;
          fullCtx.imageSmoothingQuality = 'high';
          fullCtx.drawImage(miniCanvas, 0, 0, miniCanvas.width, miniCanvas.height, 0, tbY, width, tbHeight);
        }
        if ('filter' in fullCtx) {
          fullCtx.filter = 'blur(16px)';
          fullCtx.drawImage(fullCanvas, 0, tbY, width, tbHeight, 0, tbY, width, tbHeight);
          fullCtx.filter = 'none';
        }
        fullCtx.fillStyle = 'rgba(235, 240, 248, 0.65)';
        fullCtx.fillRect(0, tbY, width, tbHeight);
        fullCtx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
        fullCtx.lineWidth = 1;
        fullCtx.beginPath();
        fullCtx.moveTo(0, tbY);
        fullCtx.lineTo(width, tbY);
        fullCtx.stroke();
        fullCtx.restore();
      } catch (e) {
        fullCtx.fillStyle = '#1e293b';
        fullCtx.fillRect(0, tbY, width, tbHeight);
      }
    } else {
      fullCanvas.width = width;
      fullCanvas.height = height;
      fullCtx.drawImage(this.video, 0, 0, width, height);
    }

    const dataUrl = fullCanvas.toDataURL('image/jpeg', 0.88);

    // Promptly release canvas memory
    fullCanvas.width = 0;
    fullCanvas.height = 0;

    let defaultLabel = 'Captura de Acción';
    if (reason === 'click') defaultLabel = 'Clic detectado';
    if (reason === 'enter') defaultLabel = 'Tecla Enter presionada';
    if (reason === 'save') defaultLabel = 'Acción de Guardar';
    if (reason === 'change_detected') {
      defaultLabel = effectiveFocal ? 'Interacción en pantalla' : 'Actividad en pantalla';
    }

    const now = Date.now();
    const snapshot: AutoCapturedSnapshot = {
      id: `auto-snap-${now}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Math.round((now - this.lastCaptureTime) / 100) / 10,
      dataUrl,
      reason,
      label: customLabel || defaultLabel,
      differenceScore: 1,
      focalX: effectiveFocal ? effectiveFocal.x : undefined,
      focalY: effectiveFocal ? effectiveFocal.y : undefined,
      focalWidth: effectiveFocal ? effectiveFocal.width : undefined,
      focalHeight: effectiveFocal ? effectiveFocal.height : undefined,
    };

    this.lastCaptureTime = now;
    this.lastSubtleActivityTime = now;

    // Track baseline and last snapshot image data
    if (currentSample) {
      this.lastCapturedImageData = currentSample;
      this.baselineImageData = currentSample;
      if (!this.initialScreenImageData) {
        this.initialScreenImageData = currentSample;
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
    if (!this.initialScreenImageData) {
      this.initialScreenImageData = currentImageData;
    }

    const now = Date.now();
    const timeSinceLastCapture = now - this.lastCaptureTime;

    if (this.previousImageData) {
      // 1. Motion diff between consecutive frames
      const instantDiff = this.calculateGlobalDiff(this.previousImageData, currentImageData);

      // 2. Accumulated diff compared to baseline (the state at the last captured snapshot)
      const baselineDiff = this.calculateGlobalDiff(this.baselineImageData, currentImageData);

      // 3. Diff compared to initial screen
      const initialDiff = this.calculateGlobalDiff(this.initialScreenImageData, currentImageData);
      if (initialDiff > 0.02) {
        this.hasLeftInitialScreen = true;
      }

      // 4. Regional & Centroid focal point analysis:
      // Pinpoints the EXACT (x, y) coordinates of where the user typed, clicked, or filled a field!
      const blockAnalysis = this.calculateBlockDiffAndFocalPoint(this.baselineImageData, currentImageData);
      const instantBlockAnalysis = this.calculateBlockDiffAndFocalPoint(this.previousImageData, currentImageData);

      const maxBlockBaselineDiff = blockAnalysis.maxRatio;
      const maxBlockInstantDiff = instantBlockAnalysis.maxRatio;

      if (instantDiff > 0.0008 || baselineDiff > 0.001 || maxBlockInstantDiff > 0.015) {
        this.lastSubtleActivityTime = now;
      }

      // Update the active focal point if a localized UI interaction was pinpointed
      if (blockAnalysis.focalPoint && (blockAnalysis.maxRatio > 0.015 || baselineDiff > 0.0005)) {
        this.lastDetectedFocal = blockAnalysis.focalPoint;
      } else if (instantBlockAnalysis.focalPoint && instantBlockAnalysis.maxRatio > 0.018) {
        this.lastDetectedFocal = instantBlockAnalysis.focalPoint;
      }

      // Action detection conditions:
      // Condition A: Significant global transition (page/transaction navigation, large table load)
      const hasGlobalChange = baselineDiff > 0.008;

      // Condition B: Localized micro-interaction on the screen (e.g. typing "VOLC" in Sociedad,
      // clicking Aceptar, checking a checkbox, selecting a row)
      // High-resolution grid ensures short typed words and buttons reliably trigger detection!
      const hasLocalMicroAction =
        (maxBlockBaselineDiff > 0.018 && baselineDiff > 0.00015) ||
        (blockAnalysis.focalPoint !== null && maxBlockBaselineDiff > 0.028);

      // Condition C: Sudden burst of action settled (e.g. clicked button or opened popup menu)
      const hasInstantAction = maxBlockInstantDiff > 0.025 || instantDiff > 0.004;

      // If change detected and cooled down
      if ((hasGlobalChange || hasLocalMicroAction || hasInstantAction) && timeSinceLastCapture > this.minCooldownMs) {
        // Any real interaction activates work screen mode
        this.hasLeftInitialScreen = true;

        const capturedFocal = this.lastDetectedFocal;

        // Wait 250ms for typing or click animation to settle before taking snapshot
        if (!this.pendingCaptureTimeout) {
          this.pendingCaptureTimeout = setTimeout(() => {
            if (this.isDetecting && this.video) {
              const actionLabel = hasLocalMicroAction
                ? 'Acción en pantalla (campo / selección / botón)'
                : `Cambio en pantalla (${Math.round(baselineDiff * 100)}%)`;

              this.captureNow('change_detected', actionLabel, capturedFocal || undefined);
            }
            this.pendingCaptureTimeout = null;
          }, 250);
        }
      }

      // Condition D: Active screen heartbeat on work screen
      if (this.hasLeftInitialScreen && timeSinceLastCapture > this.maxTimeWithoutCaptureMs && (now - this.lastSubtleActivityTime < 3000)) {
        if (!this.pendingCaptureTimeout) {
          this.captureNow('change_detected', 'Continuación del procedimiento', this.lastDetectedFocal || undefined);
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
      // Threshold 28 captures subtle typing, antialiased text fonts, input focus rings, and buttons
      if (rDiff + gDiff + bDiff > 28) {
        changedPixels++;
      }
    }

    return changedPixels / totalPixels;
  }

  /**
   * Divides the frame into a 16x9 grid of 144 spatial blocks and returns
   * the maximum percentage change, plus the precise centroid (focalX, focalY)
   * where the user typed or clicked!
   */
  private calculateBlockDiffAndFocalPoint(
    img1: ImageData,
    img2: ImageData
  ): {
    maxRatio: number;
    focalPoint: { x: number; y: number; width?: number; height?: number } | null;
  } {
    const data1 = img1.data;
    const data2 = img2.data;

    const blockW = Math.floor(this.sampleWidth / this.gridCols);
    const blockH = Math.floor(this.sampleHeight / this.gridRows);
    const pixelsPerBlock = blockW * blockH;

    const blockChangedCounts = new Array(this.gridCols * this.gridRows).fill(0);

    let sumX = 0;
    let sumY = 0;
    let changedCount = 0;
    let minX = this.sampleWidth;
    let maxX = 0;
    let minY = this.sampleHeight;
    let maxY = 0;

    for (let y = 0; y < this.sampleHeight; y++) {
      const rowIdx = Math.min(this.gridRows - 1, Math.floor(y / blockH));
      for (let x = 0; x < this.sampleWidth; x++) {
        const colIdx = Math.min(this.gridCols - 1, Math.floor(x / blockW));
        const blockIndex = rowIdx * this.gridCols + colIdx;

        const pixelIdx = (y * this.sampleWidth + x) * 4;
        const rDiff = Math.abs(data1[pixelIdx] - data2[pixelIdx]);
        const gDiff = Math.abs(data1[pixelIdx + 1] - data2[pixelIdx + 1]);
        const bDiff = Math.abs(data1[pixelIdx + 2] - data2[pixelIdx + 2]);

        if (rDiff + gDiff + bDiff > 28) {
          blockChangedCounts[blockIndex]++;
          sumX += x;
          sumY += y;
          changedCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    let maxRatio = 0;
    let mostActiveBlockIdx = -1;
    for (let b = 0; b < blockChangedCounts.length; b++) {
      const ratio = blockChangedCounts[b] / pixelsPerBlock;
      if (ratio > maxRatio) {
        maxRatio = ratio;
        mostActiveBlockIdx = b;
      }
    }

    let focalPoint: { x: number; y: number; width?: number; height?: number } | null = null;
    const effectiveH = this.taskbarProtection === 'crop' ? this.sampleHeight * (1 - 0.052) : this.sampleHeight;

    if (changedCount >= 4) {
      // Calculate geometric centroid of the changed interaction
      const avgX = sumX / changedCount;
      const avgY = sumY / changedCount;

      const normX = Math.round((avgX / this.sampleWidth) * 100);
      const normY = Math.round((avgY / effectiveH) * 100);
      const spanW = Math.max(10, Math.round(((maxX - minX + 8) / this.sampleWidth) * 100));
      const spanH = Math.max(5, Math.round(((maxY - minY + 6) / effectiveH) * 100));

      focalPoint = {
        x: Math.max(4, Math.min(96, normX)),
        y: Math.max(4, Math.min(96, normY)),
        width: Math.min(60, spanW),
        height: Math.min(35, spanH),
      };
    } else if (mostActiveBlockIdx >= 0 && maxRatio > 0.015) {
      const activeRow = Math.floor(mostActiveBlockIdx / this.gridCols);
      const activeCol = mostActiveBlockIdx % this.gridCols;
      focalPoint = {
        x: Math.round(((activeCol + 0.5) / this.gridCols) * 100),
        y: Math.round((((activeRow + 0.5) * blockH) / effectiveH) * 100),
        width: 14,
        height: 7,
      };
    }

    return { maxRatio, focalPoint };
  }
}

export const screenActionDetector = new ScreenActionDetector();

/**
 * Utility to crop the bottom taskbar from any image dataUrl
 * Ensures Windows 10/11 taskbar icons are not included in the screenshot
 */
export function cropTaskbarFromDataUrl(dataUrl: string, ratio = 0.052): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || 1280;
      const h = img.naturalHeight || 720;
      const targetH = Math.max(10, Math.round(h * (1 - ratio)));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, w, targetH, 0, 0, w, targetH);
      const result = canvas.toDataURL('image/jpeg', 0.92);
      // Immediately release GPU surface buffer
      canvas.width = 0;
      canvas.height = 0;
      img.onload = null;
      img.onerror = null;
      resolve(result);
    };
    img.onerror = () => {
      img.onload = null;
      img.onerror = null;
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

/**
 * Utility to blur the bottom taskbar on any image dataUrl
 * Blurs the taskbar so application icons and system tray cannot be identified
 */
export function blurTaskbarOnDataUrl(dataUrl: string, ratio = 0.052): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || 1280;
      const h = img.naturalHeight || 720;
      const tbH = Math.max(38, Math.round(h * ratio));
      const tbY = h - tbH;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Draw base image
      ctx.drawImage(img, 0, 0, w, h);

      // Apply guaranteed frosted blur to taskbar area
      ctx.save();
      let miniCanvas: HTMLCanvasElement | null = null;
      try {
        // Step 1: Pixel dispersion via downscale-upscale for universal blur
        miniCanvas = document.createElement('canvas');
        miniCanvas.width = Math.max(20, Math.round(w / 12));
        miniCanvas.height = Math.max(4, Math.round(tbH / 12));
        const miniCtx = miniCanvas.getContext('2d');
        if (miniCtx) {
          miniCtx.drawImage(canvas, 0, tbY, w, tbH, 0, 0, miniCanvas.width, miniCanvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(miniCanvas, 0, 0, miniCanvas.width, miniCanvas.height, 0, tbY, w, tbH);
        }

        // Step 2: Canvas filter blur
        if ('filter' in ctx) {
          ctx.filter = 'blur(16px)';
          ctx.drawImage(canvas, 0, tbY, w, tbH, 0, tbY, w, tbH);
          ctx.filter = 'none';
        }

        // Step 3: Frosted translucent privacy tint
        ctx.fillStyle = 'rgba(235, 240, 248, 0.65)';
        ctx.fillRect(0, tbY, w, tbH);
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, tbY);
        ctx.lineTo(w, tbY);
        ctx.stroke();
      } catch (e) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, tbY, w, tbH);
      }
      ctx.restore();

      const result = canvas.toDataURL('image/jpeg', 0.92);

      // Immediate release of all GPU surface memory
      if (miniCanvas) {
        miniCanvas.width = 0;
        miniCanvas.height = 0;
      }
      canvas.width = 0;
      canvas.height = 0;
      img.onload = null;
      img.onerror = null;

      resolve(result);
    };
    img.onerror = () => {
      img.onload = null;
      img.onerror = null;
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

