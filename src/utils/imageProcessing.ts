/**
 * Centralized High-Performance Image Processing Utility
 * Unifies client-side canvas compression, taskbar privacy filters (crop / blur),
 * and memory-safe image data conversions.
 */

import { cropTaskbarFromDataUrl, blurTaskbarOnDataUrl } from './motionDetector';

/**
 * Normalizes oversized files (e.g. 4K/retina screenshots) to a crisp 1280px JPEG (~90KB),
 * reducing payload and memory consumption by up to 90%.
 */
export function compressImageFile(
  fileOrBlob: Blob,
  maxWidth = 1280,
  quality = 0.85
): Promise<string> {
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
    reader.onerror = () => resolve('');
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Compresses an existing base64 data URL for fast AI multimodal transmission.
 * Reduces 65 high-res frames (~130MB total) down to ~3-4MB without dropping steps.
 */
export function compressImageForAi(
  dataUrl: string,
  maxWidth = 1280,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      if (origW <= maxWidth && dataUrl.length < 200000) {
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
  });
}

/**
 * Taskbar privacy filter: crops the bottom Windows/macOS taskbar (~5% of screen height).
 */
export async function cropTaskbar(dataUrl: string, ratio = 0.052): Promise<string> {
  return cropTaskbarFromDataUrl(dataUrl, ratio);
}

/**
 * Taskbar privacy filter: applies frosted glass blur to bottom taskbar.
 */
export async function blurTaskbar(dataUrl: string, ratio = 0.052): Promise<string> {
  return blurTaskbarOnDataUrl(dataUrl, ratio);
}

/**
 * Helper to read a File as a base64 Data URL.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
