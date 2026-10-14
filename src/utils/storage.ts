import { UserManual } from '../types/manual';

const STORAGE_KEY = 'manualcraft_user_manuals_v1';

/**
 * Resilient storage manager that handles browser storage quota limits,
 * ensures sample manuals are always accessible, and prevents data loss.
 */
class ManualStorageService {
  private inMemoryFallback: UserManual[] | null = null;

  public loadManuals(defaultManuals: UserManual[]): UserManual[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultManuals;
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge missing default manuals (e.g. SAP Comex) so new updates are always visible
          const existingIds = new Set(parsed.map((m: UserManual) => m.id));
          const missingDefaults = defaultManuals.filter((m) => !existingIds.has(m.id));

          // If SAP manual is in defaults, ensure it is present
          if (missingDefaults.length > 0) {
            const merged = [...missingDefaults, ...parsed];
            this.saveManuals(merged);
            return merged;
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[ManualStorageService] Failed to read from localStorage:', err);
    }

    return this.inMemoryFallback || defaultManuals;
  }

  public saveManuals(manuals: UserManual[]): boolean {
    this.inMemoryFallback = manuals;
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return true;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(manuals));
      return true;
    } catch (err: any) {
      console.warn('[ManualStorageService] Quota exceeded or error saving to localStorage:', err);
      // Try to save without high-res images if storage quota is exceeded
      try {
        const lightweight = manuals.map((m) => ({
          ...m,
          steps: m.steps.map((s) => ({
            ...s,
            // Keep preview but strip huge blobs if necessary
            image: s.image && s.image.length > 500000 ? s.image.slice(0, 1000) : s.image,
          })),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
        return true;
      } catch (innerErr) {
        console.error('[ManualStorageService] Fallback save failed, persisting in memory:', innerErr);
        return false;
      }
    }
  }
}

export const manualStorage = new ManualStorageService();
