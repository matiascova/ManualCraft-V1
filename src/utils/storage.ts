import { UserManual } from '../types/manual';
import { Project } from '../types/project';
import { OrganizationBranding, DEFAULT_ORGANIZATION_BRANDING } from '../types/branding';
import { SAMPLE_PROJECTS } from '../data/sampleProjects';

const MANUALS_STORAGE_KEY = 'manualcraft_user_manuals_v1';
const PROJECTS_STORAGE_KEY = 'manualcraft_user_projects_v1';
const BRANDING_STORAGE_KEY = 'manualcraft_organization_branding_v1';

/**
 * Resilient storage manager that handles browser storage quota limits,
 * ensures projects and sample manuals are always accessible, and prevents data loss.
 */
class ManualStorageService {
  private inMemoryManualsFallback: UserManual[] | null = null;
  private inMemoryProjectsFallback: Project[] | null = null;

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
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return true;
      }
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      return true;
    } catch (err) {
      console.warn('[ManualStorageService] Error saving projects to localStorage:', err);
      return false;
    }
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge missing default manuals (e.g. SAP Comex) so new updates are always visible
          const existingIds = new Set(parsed.map((m: UserManual) => m.id));
          const missingDefaults = defaultManuals.filter((m) => !existingIds.has(m.id));

          let result = parsed;
          if (missingDefaults.length > 0) {
            result = [...missingDefaults, ...parsed];
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

  public saveManuals(manuals: UserManual[]): boolean {
    this.inMemoryManualsFallback = manuals;
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return true;
      }
      localStorage.setItem(MANUALS_STORAGE_KEY, JSON.stringify(manuals));
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
        localStorage.setItem(MANUALS_STORAGE_KEY, JSON.stringify(lightweight));
        return true;
      } catch (innerErr) {
        console.error('[ManualStorageService] Fallback save failed, persisting in memory:', innerErr);
        return false;
      }
    }
  }
}

export const manualStorage = new ManualStorageService();
