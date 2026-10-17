import { VideoFrameCandidate } from '../types/manual';

export interface VideoTranscriptAnchor {
  timestamp: number;
  text?: string;
  label?: string;
}

export interface ExtractFramesOptions {
  maxFrames?: number;
  intervalSeconds?: number;
  transcriptTimestamps?: VideoTranscriptAnchor[];
  deduplicateStaticFrames?: boolean;
  onProgress?: (progress: number, status: string) => void;
}

/**
 * Parses raw text with timestamps like:
 * "[00:09] vamos a crear un manual..."
 * "01:36 marcamos esa factura y grabamos los datos"
 * "1:39 nos pide la confirmación"
 */
export function parseTranscriptWithTimestamps(rawText: string): Array<{
  timestamp: number;
  text: string;
  rawTimestamp: string;
}> {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const results: Array<{ timestamp: number; text: string; rawTimestamp: string }> = [];

  // Regex patterns:
  // 1. [00:09] or (00:09) or 00:09
  // 2. [01:36:20]
  // 3. [90s] or [90]
  const timeRegex = /^[\[(]?(\d{1,2}):(\d{2})(?::(\d{2}))?[\])]?\s*(.*)$/;
  const secRegex = /^[\[(]?(\d+)s?[\])]?\s*(.*)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const matchMinSec = trimmed.match(timeRegex);
    if (matchMinSec) {
      const part1 = parseInt(matchMinSec[1], 10);
      const part2 = parseInt(matchMinSec[2], 10);
      const part3 = matchMinSec[3] ? parseInt(matchMinSec[3], 10) : null;
      const text = matchMinSec[4]?.trim() || '';

      let seconds = 0;
      let rawStr = '';
      if (part3 !== null) {
        // hh:mm:ss
        seconds = part1 * 3600 + part2 * 60 + part3;
        rawStr = `${matchMinSec[1]}:${matchMinSec[2]}:${matchMinSec[3]}`;
      } else {
        // mm:ss
        seconds = part1 * 60 + part2;
        rawStr = `${matchMinSec[1]}:${matchMinSec[2]}`;
      }

      results.push({
        timestamp: seconds,
        text,
        rawTimestamp: rawStr,
      });
      continue;
    }

    const matchSec = trimmed.match(secRegex);
    if (matchSec && matchSec[2]) {
      const seconds = parseInt(matchSec[1], 10);
      results.push({
        timestamp: seconds,
        text: matchSec[2].trim(),
        rawTimestamp: `${seconds}s`,
      });
    }
  }

  return results;
}

/**
 * Extracts smart action frames from a video file, prioritizing:
 * 1. Transcript-anchored timestamps (moments when instructor performed/explained actions).
 * 2. Visual deduplication: filters out multiple redundant frames of an idle initial screen.
 * 3. Activity transitions: focuses on actual work screens, inputs, clicks, and confirmations.
 */
export async function extractFramesFromVideo(
  file: File,
  options: ExtractFramesOptions = {}
): Promise<VideoFrameCandidate[]> {
  const {
    maxFrames = 12,
    intervalSeconds,
    transcriptTimestamps = [],
    deduplicateStaticFrames = true,
    onProgress,
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const fileUrl = URL.createObjectURL(file);
    video.src = fileUrl;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Small sampling canvas for fast difference & sharpness checking
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 160;
    sampleCanvas.height = 90;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

    const frames: VideoFrameCandidate[] = [];

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration;
        if (!duration || isNaN(duration)) {
          throw new Error('No se pudo determinar la duración del video.');
        }

        // Set max canvas dimensions for optimal high-res quality
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

        // Build list of candidate time anchors
        interface CandidateAnchor {
          time: number;
          label: string;
          isTranscriptAnchor: boolean;
        }

        const candidateAnchors: CandidateAnchor[] = [];

        // Strategy A: If transcript timestamps are provided, prioritize action moments
        if (transcriptTimestamps && transcriptTimestamps.length > 0) {
          for (const item of transcriptTimestamps) {
            if (item.timestamp >= 0 && item.timestamp < duration) {
              // Add a small offset (0.8s) so the screen stabilizes after the action is uttered
              const targetTime = Math.min(duration - 0.2, Math.max(0.3, item.timestamp + 0.8));
              const textSnippet = (item.text || item.label || '').trim();
              const label = textSnippet
                ? (textSnippet.length > 55 ? textSnippet.slice(0, 52) + '...' : textSnippet)
                : `Momento ${Math.round(targetTime)}s`;

              candidateAnchors.push({
                time: targetTime,
                label,
                isTranscriptAnchor: true,
              });
            }
          }
        }

        // Strategy B: If no transcript timestamps, or to complement empty gaps
        if (candidateAnchors.length === 0) {
          if (intervalSeconds && intervalSeconds > 0) {
            for (let t = 0.5; t < duration; t += intervalSeconds) {
              candidateAnchors.push({
                time: t,
                label: `Segundo ${Math.round(t)}s`,
                isTranscriptAnchor: false,
              });
              if (candidateAnchors.length >= maxFrames * 2) break;
            }
          } else {
            // Adaptive sampling across the video
            const count = Math.min(18, Math.max(6, Math.floor(duration / 3)));
            const step = duration / (count + 1);
            for (let i = 1; i <= count; i++) {
              const t = Math.round(i * step * 10) / 10;
              candidateAnchors.push({
                time: t,
                label: `Segundo ${Math.round(t)}s`,
                isTranscriptAnchor: false,
              });
            }
          }
        }

        // Sort chronologically and deduplicate very close timestamps (< 1.5s)
        candidateAnchors.sort((a, b) => a.time - b.time);
        const filteredAnchors: CandidateAnchor[] = [];
        for (const cand of candidateAnchors) {
          const prev = filteredAnchors[filteredAnchors.length - 1];
          if (!prev || cand.time - prev.time >= 1.4) {
            filteredAnchors.push(cand);
          }
        }

        let previousSampleImageData: ImageData | null = null;
        let initialScreenImageData: ImageData | null = null;
        let hasLeftInitialScreen = false;

        for (let i = 0; i < filteredAnchors.length; i++) {
          const anchor = filteredAnchors[i];
          let time = anchor.time;

          if (onProgress) {
            const pct = Math.round(((i + 1) / filteredAnchors.length) * 100);
            onProgress(
              pct,
              `Analizando actividad y extrayendo fotograma (${Math.round(time)}s): ${anchor.label}...`
            );
          }

          await seekToTime(video, time);

          if (ctx && sampleCtx) {
            // Check sample on mini canvas first
            sampleCtx.drawImage(video, 0, 0, 160, 90);
            const currentSample = sampleCtx.getImageData(0, 0, 160, 90);

            if (!initialScreenImageData) {
              initialScreenImageData = currentSample;
            }

            // Check diff against initial screen
            const diffFromInitial = calculateSampleDiff(initialScreenImageData, currentSample);
            if (diffFromInitial > 0.035) {
              hasLeftInitialScreen = true;
            }

            // DEDUPLICATION: Check if this candidate is virtually identical to previous extracted frame
            if (deduplicateStaticFrames && previousSampleImageData) {
              const diffFromPrev = calculateSampleDiff(previousSampleImageData, currentSample);

              // If difference is under 1.2% (static screen, no new action occurred)
              if (diffFromPrev < 0.012) {
                // If we are still in the initial intro before action started, DROP redundant duplicate!
                if (!hasLeftInitialScreen) {
                  continue;
                }

                // If on work screen but nothing changed and this wasn't an explicit action anchor, skip
                if (!anchor.isTranscriptAnchor) {
                  continue;
                }
              }
            }

            // Draw high resolution image on main canvas
            ctx.drawImage(video, 0, 0, width, height);

            // Anti-Motion Blur Check: If frame sharpness is very low (motion blur), probe forward 300ms
            const sharpness = calculateFrameSharpness(ctx, width, height);
            if (sharpness < 7 && time + 0.35 < duration) {
              time = time + 0.35;
              await seekToTime(video, time);
              ctx.drawImage(video, 0, 0, width, height);
            }

            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            frames.push({
              id: `frame-${frames.length + 1}-${Date.now()}`,
              timestamp: time,
              dataUrl,
              selected: true,
              label: anchor.label,
            });

            previousSampleImageData = currentSample;

            if (frames.length >= maxFrames) {
              break;
            }
          }
        }

        // Cleanup
        canvas.width = 0;
        canvas.height = 0;
        sampleCanvas.width = 0;
        sampleCanvas.height = 0;
        URL.revokeObjectURL(fileUrl);
        resolve(frames);
      } catch (err) {
        canvas.width = 0;
        canvas.height = 0;
        sampleCanvas.width = 0;
        sampleCanvas.height = 0;
        URL.revokeObjectURL(fileUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      canvas.width = 0;
      canvas.height = 0;
      sampleCanvas.width = 0;
      sampleCanvas.height = 0;
      URL.revokeObjectURL(fileUrl);
      reject(
        new Error(
          'Error al cargar el archivo de video. Asegúrate de que sea un formato compatible (MP4, WebM).'
        )
      );
    };
  });
}

/**
 * Calculates percentage difference between two 160x90 sample frames
 */
function calculateSampleDiff(img1: ImageData, img2: ImageData): number {
  const d1 = img1.data;
  const d2 = img2.data;
  let changed = 0;
  const total = d1.length / 4;

  for (let i = 0; i < d1.length; i += 4) {
    const diff =
      Math.abs(d1[i] - d2[i]) +
      Math.abs(d1[i + 1] - d2[i + 1]) +
      Math.abs(d1[i + 2] - d2[i + 2]);
    if (diff > 40) {
      changed++;
    }
  }

  return changed / total;
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
