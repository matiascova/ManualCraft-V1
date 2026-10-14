/**
 * Motion & Screen Stabilization Detector
 * Listens to a MediaStream from getDisplayMedia, detects visual changes (clicks, opens, enters, typing)
 * and takes snapshots automatically when a change settles.
 */

export interface AutoCapturedSnapshot {
  id: string;
  timestamp: number;
  dataUrl: string;
  reason: 'change_detected' | 'click' | 'enter' | 'save' | 'hotkey';
  label: string;
  differenceScore: number;
}

export class ScreenActionDetector {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private previousImageData: ImageData | null = null;
  private intervalId: any = null;
  private isDetecting = false;
  private lastCaptureTime = 0;
  private pendingCaptureTimeout: any = null;
  private onSnapshotCallback: ((snapshot: AutoCapturedSnapshot) => void) | null = null;

  // Sensitivity settings
  public threshold = 0.035; // 3.5% pixel diff triggers potential action
  public minCooldownMs = 1200; // minimum 1.2s between auto-captures to avoid spamming

  public start(
    stream: MediaStream,
    onSnapshot: (snapshot: AutoCapturedSnapshot) => void
  ) {
    this.stream = stream;
    this.onSnapshotCallback = onSnapshot;
    this.isDetecting = true;
    this.lastCaptureTime = Date.now();

    this.video = document.createElement('video');
    this.video.srcObject = stream;
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.play();

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    // Compare frames every 250ms
    this.intervalId = setInterval(() => {
      this.checkFrame();
    }, 250);

    // Initial capture at second 0
    setTimeout(() => {
      this.captureNow('change_detected', 'Pantalla Inicial');
    }, 500);
  }

  public stop() {
    this.isDetecting = false;
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.pendingCaptureTimeout) clearTimeout(this.pendingCaptureTimeout);
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video = null;
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

    let defaultLabel = 'Captura de Acción';
    if (reason === 'click') defaultLabel = 'Clic detectado';
    if (reason === 'enter') defaultLabel = 'Tecla Enter presionada';
    if (reason === 'save') defaultLabel = 'Acción de Guardar';
    if (reason === 'change_detected') defaultLabel = 'Cambio en pantalla detectado';

    const snapshot: AutoCapturedSnapshot = {
      id: `auto-snap-${Date.now()}`,
      timestamp: Math.round((Date.now() - this.lastCaptureTime) / 100) / 10,
      dataUrl,
      reason,
      label: customLabel || defaultLabel,
      differenceScore: 1,
    };

    this.lastCaptureTime = Date.now();
    if (this.onSnapshotCallback) {
      this.onSnapshotCallback(snapshot);
    }
  }

  private checkFrame() {
    if (!this.video || !this.canvas || !this.ctx || !this.video.videoWidth) return;

    // Use small 160x90 canvas for fast pixel diff comparison
    const sampleWidth = 160;
    const sampleHeight = 90;
    this.canvas.width = sampleWidth;
    this.canvas.height = sampleHeight;

    this.ctx.drawImage(this.video, 0, 0, sampleWidth, sampleHeight);
    const currentImageData = this.ctx.getImageData(0, 0, sampleWidth, sampleHeight);

    if (this.previousImageData) {
      const diffScore = this.calculateDiff(this.previousImageData, currentImageData);

      // If change detected and cooled down
      if (diffScore > this.threshold && Date.now() - this.lastCaptureTime > this.minCooldownMs) {
        // Wait 350ms for transition/animation to settle before taking high-res snapshot
        if (!this.pendingCaptureTimeout) {
          this.pendingCaptureTimeout = setTimeout(() => {
            this.captureNow(
              'change_detected',
              `Acción detectada (${Math.round(diffScore * 100)}% de cambio)`
            );
            this.pendingCaptureTimeout = null;
          }, 400);
        }
      }
    }

    this.previousImageData = currentImageData;
  }

  private calculateDiff(img1: ImageData, img2: ImageData): number {
    const data1 = img1.data;
    const data2 = img2.data;
    let changedPixels = 0;
    const totalPixels = data1.length / 4;

    for (let i = 0; i < data1.length; i += 4) {
      const rDiff = Math.abs(data1[i] - data2[i]);
      const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
      const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);
      if (rDiff + gDiff + bDiff > 70) {
        changedPixels++;
      }
    }

    return changedPixels / totalPixels;
  }
}

export const screenActionDetector = new ScreenActionDetector();
