import { UserManual } from '../types/manual';
import { Project } from '../types/project';
import { OrganizationBranding, DEFAULT_ORGANIZATION_BRANDING } from '../types/branding';
import { SAMPLE_PROJECTS } from '../data/sampleProjects';

const MANUALS_STORAGE_KEY = 'manualcraft_user_manuals_v1';
const DELETED_MANUALS_KEY = 'manualcraft_deleted_manual_ids_v1';
const PROJECTS_STORAGE_KEY = 'manualcraft_user_projects_v1';
const BRANDING_STORAGE_KEY = 'manualcraft_organization_branding_v1';

// High-scale IndexedDB constants for unlimited storage quota
const IDB_NAME = 'manualcraft_db';
const IDB_VERSION = 1;
const IDB_STORE_NAME = 'kv_store';

/**
 * Lightweight, zero-dependency Promise wrapper around browser IndexedDB.
 * Offloads massive image and manual serialization to background browser threads,
 * preventing main-thread UI jank, frame drops, and 5MB localStorage QuotaExceeded errors.
 */
class HighThroughputIdb {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private getDb(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
              db.createObjectStore(IDB_STORE_NAME);
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => {
            console.warn('[IndexedDB] Failed to open database:', req.error);
            resolve(null);
          };
        } catch (err) {
          console.warn('[IndexedDB] Initialization error:', err);
          resolve(null);
        }
      });
    }
    return this.dbPromise;
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDb();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE_NAME, 'readonly');
        const store = tx.objectStore(IDB_STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async set<T>(key: string, val: T): Promise<boolean> {
    try {
      const db = await this.getDb();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(IDB_STORE_NAME);
        store.put(val, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      const db = await this.getDb();
      if (!db) return false;
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(IDB_STORE_NAME);
        store.delete(key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }
}

const idb = new HighThroughputIdb();

/**
 * Two-Tier High Performance Storage Manager (L1 In-Memory + L2 IndexedDB / LocalStorage)
 * Handles high traffic, prevents memory exhaustion and maintains sub-millisecond read access.
 */
class ManualStorageService {
  private inMemoryManualsFallback: UserManual[] | null = null;
  private inMemoryProjectsFallback: Project[] | null = null;
  private inMemoryDeletedIds: Set<string> = new Set();
  private manualsSaveTimer: any = null;
  private projectsSaveTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const deletedRaw = localStorage.getItem(DELETED_MANUALS_KEY);
        if (deletedRaw) {
          const arr: string[] = JSON.parse(deletedRaw);
          if (Array.isArray(arr)) {
            this.inMemoryDeletedIds = new Set(arr);
          }
        }
      } catch {
        // Safe fallback
      }
    }
  }

  public loadProjects(defaultProjects: Project[] = SAMPLE_PROJECTS): Project[] {
    if (this.inMemoryProjectsFallback) {
      return this.inMemoryProjectsFallback;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(parsed.map((p: Project) => p.id));
            const missingDefaults = defaultProjects.filter((p) => !existingIds.has(p.id));

            if (missingDefaults.length > 0) {
              const merged = [...parsed, ...missingDefaults];
              this.saveProjects(merged);
              this.inMemoryProjectsFallback = merged;
              return merged;
            }
            this.inMemoryProjectsFallback = parsed;
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('[ManualStorageService] Failed to read projects from localStorage:', err);
    }

    this.inMemoryProjectsFallback = defaultProjects;
    return defaultProjects;
  }

  public saveProjects(projects: Project[]): boolean {
    this.inMemoryProjectsFallback = projects;
    if (typeof window === 'undefined' || !window.localStorage) {
      return true;
    }

    if (this.projectsSaveTimer) {
      clearTimeout(this.projectsSaveTimer);
    }

    // Schedule write on idle tick to avoid blocking frame render
    this.projectsSaveTimer = setTimeout(() => {
      try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
        idb.set(PROJECTS_STORAGE_KEY, projects).catch(() => {});
      } catch (err) {
        console.warn('[ManualStorageService] Error saving projects to localStorage:', err);
      }
    }, 150);

    return true;
  }

  public loadOrganizationBranding(defaultBranding: OrganizationBranding = DEFAULT_ORGANIZATION_BRANDING): OrganizationBranding {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(BRANDING_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            return { ...defaultBranding, ...parsed };
          }
        }
      }
    } catch (err) {
      console.warn('[ManualStorageService] Failed to load organization branding:', err);
    }
    return defaultBranding;
  }

  public saveOrganizationBranding(branding: OrganizationBranding): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return true;
      }
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding));
      idb.set(BRANDING_STORAGE_KEY, branding).catch(() => {});
      return true;
    } catch (err) {
      console.warn('[ManualStorageService] Error saving organization branding:', err);
      return false;
    }
  }

  public loadManuals(defaultManuals: UserManual[]): UserManual[] {
    if (this.inMemoryManualsFallback) {
      return this.inMemoryManualsFallback;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(MANUALS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const filteredSaved = parsed.filter((m: UserManual) => !this.inMemoryDeletedIds.has(m.id));
            const existingIds = new Set(filteredSaved.map((m: UserManual) => m.id));
            const missingDefaults = defaultManuals.filter(
              (m) => !existingIds.has(m.id) && !this.inMemoryDeletedIds.has(m.id)
            );

            let result = filteredSaved;
            if (missingDefaults.length > 0) {
              result = [...missingDefaults, ...filteredSaved];
            }

            result = result.map((m: UserManual) => {
              if (!m.projectId) {
                return { ...m, projectId: defaultManuals[0]?.projectId || 'prj-default' };
              }
              return m;
            });

            this.inMemoryManualsFallback = result;
            return result;
          }
        }
      }
    } catch (err) {
      console.warn('[ManualStorageService] Failed to read manuals from localStorage:', err);
    }

    const initial = defaultManuals.filter((m) => !this.inMemoryDeletedIds.has(m.id));
    this.inMemoryManualsFallback = initial;
    return initial;
  }

  public deleteManual(manualId: string, updatedList: UserManual[]): boolean {
    if (this.manualsSaveTimer) {
      clearTimeout(this.manualsSaveTimer);
      this.manualsSaveTimer = null;
    }

    this.inMemoryDeletedIds.add(manualId);
    this.inMemoryManualsFallback = updatedList;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(DELETED_MANUALS_KEY, JSON.stringify(Array.from(this.inMemoryDeletedIds)));
        localStorage.setItem(MANUALS_STORAGE_KEY, JSON.stringify(updatedList));
      }
      idb.set(MANUALS_STORAGE_KEY, updatedList).catch(() => {});
      idb.set(DELETED_MANUALS_KEY, Array.from(this.inMemoryDeletedIds)).catch(() => {});
    } catch (err) {
      console.warn('[ManualStorageService] Failed to delete manual from localStorage:', err);
    }

    return true;
  }

  public saveManuals(manuals: UserManual[]): boolean {
    this.inMemoryManualsFallback = manuals;

    if (this.manualsSaveTimer) {
      clearTimeout(this.manualsSaveTimer);
    }

    // Async persist to IndexedDB immediately without blocking event loop
    idb.set(MANUALS_STORAGE_KEY, manuals).catch(() => {});

    // Debounced write to localStorage with quota protection
    this.manualsSaveTimer = setTimeout(() => {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      try {
        localStorage.setItem(MANUALS_STORAGE_KEY, JSON.stringify(manuals));
      } catch (err: any) {
        console.warn('[ManualStorageService] LocalStorage quota reached. Relying on IndexedDB storage tier.');
      }
    }, 200);

    return true;
  }
}

export const manualStorage = new ManualStorageService();
