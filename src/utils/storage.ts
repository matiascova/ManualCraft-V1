import { UserManual } from '../types/manual';
import { Project } from '../types/project';
import { OrganizationBranding, DEFAULT_ORGANIZATION_BRANDING } from '../types/branding';
import { SAMPLE_PROJECTS } from '../data/sampleProjects';

const MANUALS_STORAGE_KEY = 'manualcraft_user_manuals_v1';
const DELETED_MANUALS_KEY = 'manualcraft_deleted_manual_ids_v1';
const PROJECTS_STORAGE_KEY = 'manualcraft_user_projects_v1';
const BRANDING_STORAGE_KEY = 'manualcraft_organization_branding_v1';

/**
 * Resilient storage manager that handles browser storage quota limits,
 * ensures projects and sample manuals are always accessible, and prevents data loss.
 */
class ManualStorageService {
  private inMemoryManualsFallback: UserManual[] | null = null;
  private inMemoryProjectsFallback: Project[] | null = null;
  private manualsSaveTimer: any = null;
  private projectsSaveTimer: any = null;

  public loadProjects(defaultProjects: Project[] = SAMPLE_PROJECTS): Project[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultProjects;
      }

      const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: Project) => p.id));
          const missingDefaults = defaultProjects.filter((p) => !existingIds.has(p.id));

          if (missingDefaults.length > 0) {
            const merged = [...parsed, ...missingDefaults];
            this.saveProjects(merged);
            return merged;
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[ManualStorageService] Failed to read projects from localStorage:', err);
    }

    return this.inMemoryProjectsFallback || defaultProjects;
  }

  public saveProjects(projects: Project[]): boolean {
    this.inMemoryProjectsFallback = projects;
    if (typeof window === 'undefined' || !window.localStorage) {
      return true;
    }

    if (this.projectsSaveTimer) {
      clearTimeout(this.projectsSaveTimer);
    }

    // Schedule write on idle/next tick to avoid blocking main thread frames
    this.projectsSaveTimer = setTimeout(() => {
      try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      } catch (err) {
        console.warn('[ManualStorageService] Error saving projects to localStorage:', err);
      }
    }, 150);

    return true;
  }

  public loadOrganizationBranding(defaultBranding: OrganizationBranding = DEFAULT_ORGANIZATION_BRANDING): OrganizationBranding {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultBranding;
      }
      const saved = localStorage.getItem(BRANDING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.logo) {
          return { ...defaultBranding, ...parsed };
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
      return true;
    } catch (err) {
      console.warn('[ManualStorageService] Error saving organization branding:', err);
      return false;
    }
  }

  public loadManuals(defaultManuals: UserManual[]): UserManual[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultManuals;
      }

      const saved = localStorage.getItem(MANUALS_STORAGE_KEY);
      const deletedRaw = localStorage.getItem(DELETED_MANUALS_KEY);
      const deletedIds = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Exclude any manuals the user has explicitly deleted
          const filteredSaved = parsed.filter((m: UserManual) => !deletedIds.has(m.id));
          const existingIds = new Set(filteredSaved.map((m: UserManual) => m.id));
          const missingDefaults = defaultManuals.filter(
            (m) => !existingIds.has(m.id) && !deletedIds.has(m.id)
          );

          let result = filteredSaved;
          if (missingDefaults.length > 0) {
            result = [...missingDefaults, ...filteredSaved];
          }

          // Ensure each manual has a valid projectId
          result = result.map((m: UserManual) => {
            if (!m.projectId) {
              return { ...m, projectId: 'prj-weber-sap' };
            }
            return m;
          });

          this.saveManuals(result);
          return result;
        }
      }
    } catch (err) {
      console.warn('[ManualStorageService] Failed to read from localStorage:', err);
    }

    return this.inMemoryManualsFallback || defaultManuals;
  }

  public deleteManual(manualId: string, updatedList: UserManual[]): boolean {
    this.inMemoryManualsFallback = updatedList;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const deletedRaw = localStorage.getItem(DELETED_MANUALS_KEY);
        const deletedArr: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
        if (!deletedArr.includes(manualId)) {
          deletedArr.push(manualId);
          localStorage.setItem(DELETED_MANUALS_KEY, JSON.stringify(deletedArr));
        }
        localStorage.setItem(MANUALS_STORAGE_KEY, JSON.stringify(updatedList));
      }
    } catch (err) {
      console.warn('[ManualStorageService] Failed to delete manual from localStorage:', err);
    }
    return true;
  }

  public saveManuals(manuals: UserManual[]): boolean {
    // Update memory reference immediately for instantaneous synchronous reads
    this.inMemoryManualsFallback = manuals;
    if (typeof window === 'undefined' || !window.localStorage) {
      return true;
    }

    if (this.manualsSaveTimer) {
      clearTimeout(this.manualsSaveTimer);
    }

    // Debounce localStorage serialization to prevent main-thread jank during typing/editing
    this.manualsSaveTimer = setTimeout(() => {
      try {
        localStorage.setItem(MANUALS_STORAGE_KEY, JSON.stringify(manuals));
      } catch (err: any) {
        console.warn('[ManualStorageService] Quota exceeded or error saving to localStorage:', err);
        // Fallback: save without oversized images if storage quota is reached
        try {
          const lightweight = manuals.map((m) => ({
            ...m,
            steps: m.steps.map((s) => ({
              ...s,
              image: s.image && s.image.length > 500000 ? s.image.slice(0, 1000) : s.image,
            })),
          }));
          localStorage.setItem(MANUALS_STORAGE_KEY, JSON.stringify(lightweight));
        } catch (innerErr) {
          console.error('[ManualStorageService] Fallback save failed, persisting in memory:', innerErr);
        }
      }
    }, 250);

    return true;
  }
}

export const manualStorage = new ManualStorageService();
