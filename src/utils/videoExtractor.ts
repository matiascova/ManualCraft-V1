import { VideoFrameCandidate } from '../types/manual';

/**
 * Extracts sample frames from a video file at given intervals
 */
export async function extractFramesFromVideo(
  file: File,
  options: {
    maxFrames?: number;
    intervalSeconds?: number;
    onProgress?: (progress: number, status: string) => void;
  } = {}
): Promise<VideoFrameCandidate[]> {
  const { maxFrames = 8, intervalSeconds, onProgress } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const fileUrl = URL.createObjectURL(file);
    video.src = fileUrl;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const frames: VideoFrameCandidate[] = [];

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration;
        if (!duration || isNaN(duration)) {
          throw new Error('No se pudo determinar la duración del video.');
        }

        // Set max canvas dimensions for optimal Gemini processing
        const maxWidth = 1280;
        let width = video.videoWidth || 1280;
        let height = video.videoHeight || 720;
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;

        // Determine timestamps to capture
        const timestamps: number[] = [];
        if (intervalSeconds && intervalSeconds > 0) {
          for (let t = 0.5; t < duration; t += intervalSeconds) {
            timestamps.push(t);
            if (timestamps.length >= maxFrames) break;
          }
        } else {
          // Distribute evenly across video
          const count = Math.min(maxFrames, Math.max(3, Math.floor(duration / 2)));
          const step = duration / (count + 1);
          for (let i = 1; i <= count; i++) {
            timestamps.push(Math.round(i * step * 10) / 10);
          }
        }

        for (let i = 0; i < timestamps.length; i++) {
          let time = timestamps[i];
          if (onProgress) {
            const pct = Math.round(((i + 1) / timestamps.length) * 100);
            onProgress(pct, `Analizando nitidez y extrayendo fotograma ${i + 1} de ${timestamps.length} (${Math.round(time)}s)...`);
          }

          await seekToTime(video, time);

          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);

            // Anti-Motion Blur Check: If frame sharpness is very low (motion transition), probe forward 300ms
            const sharpness = calculateFrameSharpness(ctx, width, height);
            if (sharpness < 8 && time + 0.35 < duration) {
              time = time + 0.35;
              await seekToTime(video, time);
              ctx.drawImage(video, 0, 0, width, height);
            }

            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            frames.push({
              id: `frame-${i + 1}-${Date.now()}`,
              timestamp: time,
              dataUrl,
              selected: true,
              label: `Segundo ${Math.round(time)}s`,
            });
          }
        }

        canvas.width = 0;
        canvas.height = 0;
        URL.revokeObjectURL(fileUrl);
        resolve(frames);
      } catch (err) {
        canvas.width = 0;
        canvas.height = 0;
        URL.revokeObjectURL(fileUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      canvas.width = 0;
      canvas.height = 0;
      URL.revokeObjectURL(fileUrl);
      reject(new Error('Error al cargar el archivo de video. Asegúrate de que sea un formato compatible (MP4, WebM).'));
    };
  });
}

function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        video.removeEventListener('seeked', handleSeeked);
        resolve(); // Continue gracefully rather than hanging forever
      }
    }, 2500);

    const handleSeeked = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        video.removeEventListener('seeked', handleSeeked);
        resolve();
      }
    };

    video.addEventListener('seeked', handleSeeked);
    video.currentTime = Math.min(time, Math.max(0, (video.duration || 1) - 0.1));
  });
}

/**
 * Capture single frame from a video element at its current playback position
 */
export function captureSingleFrameFromVideo(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  const maxWidth = 1280;
  let width = video.videoWidth || 1280;
  let height = video.videoHeight || 720;
  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * ratio);
  }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  let result = '';
  if (ctx) {
    ctx.drawImage(video, 0, 0, width, height);
    result = canvas.toDataURL('image/jpeg', 0.88);
  }
  // Free backing store immediately
  canvas.width = 0;
  canvas.height = 0;
  return result;
}

/**
 * Calculates a sharpness score using gradient edge detection on canvas pixels.
 * Used to detect and discard blurry frames caused by transitions or rapid movement.
 */
function calculateFrameSharpness(ctx: CanvasRenderingContext2D, width: number, height: number): number {
  try {
    const sampleW = Math.min(160, width);
    const sampleH = Math.min(90, height);
    const imgData = ctx.getImageData(
      Math.floor((width - sampleW) / 2),
      Math.floor((height - sampleH) / 2),
      sampleW,
      sampleH
    );
    const d = imgData.data;
    let score = 0;
    const stride = sampleW * 4;

    for (let y = 1; y < sampleH - 1; y += 2) {
      for (let x = 1; x < sampleW - 1; x += 2) {
        const idx = y * stride + x * 4;
        const current = d[idx];
        const right = d[idx + 4];
        const down = d[idx + stride];
        const diffX = Math.abs(current - right);
        const diffY = Math.abs(current - down);
        score += diffX + diffY;
      }
    }
    return score / ((sampleW / 2) * (sampleH / 2));
  } catch {
    return 100;
  }
}
