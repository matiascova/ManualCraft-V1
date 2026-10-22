import { useState, useMemo, useCallback } from 'react';
import { Client } from '../types/client';
import { Project } from '../types/project';
import { UserManual } from '../types/manual';
import { SAMPLE_CLIENTS } from '../data/sampleClients';
import { SAMPLE_PROJECTS } from '../data/sampleProjects';
import { SAMPLE_MANUALS } from '../data/sampleManuals';

export type ViewMode = 'landing' | 'project' | 'manual';

interface UseHierarchyNavigationProps {
  clients: Client[];
  projects: Project[];
  manuals: UserManual[];
}

export interface UseHierarchyNavigationReturn {
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  activeClientId: string;
  setActiveClientId: React.Dispatch<React.SetStateAction<string>>;
  activeProjectId: string;
  setActiveProjectId: React.Dispatch<React.SetStateAction<string>>;
  activeManualId: string;
  setActiveManualId: React.Dispatch<React.SetStateAction<string>>;
  isAllClients: boolean;
  activeClient: Client | null;
  projectsInActiveClient: Project[];
  activeProject: Project;
  manualsInActiveProject: UserManual[];
  activeManual: UserManual | null;
  handleSelectClient: (clientId: string) => void;
  handleSelectProject: (projectId: string) => void;
  handleSelectManual: (manualId: string) => void;
  handleEnterApp: (clientId?: string, projectId?: string) => void;
}

/**
 * Enterprise Custom Hook: Manages hierarchical 3-tier navigation (Cliente -> Proyecto -> Manual).
 * Guarantees referential stability, strict client-project isolation, and graceful fallback resolution.
 */
export function useHierarchyNavigation({
  clients,
  projects,
  manuals,
}: UseHierarchyNavigationProps): UseHierarchyNavigationReturn {
  // Navigation mode: 'landing' (presentation) | 'project' (workspace) | 'manual' (editor)
  const [viewMode, setViewMode] = useState<ViewMode>('landing');

  // 1. Active Client ID
  const [activeClientId, setActiveClientId] = useState<string>(() => {
    return clients[0]?.id || SAMPLE_CLIENTS[0]?.id || 'cli-weber';
  });

  // 2. Active Project ID
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const weberProjects = SAMPLE_PROJECTS.filter((p) => p.clientId === 'cli-weber');
    return weberProjects[0]?.id || projects[0]?.id || 'prj-weber-wms-hu';
  });

  // 3. Active Manual ID
  const [activeManualId, setActiveManualId] = useState<string>(() => {
    return SAMPLE_MANUALS[0]?.id || manuals[0]?.id || '';
  });

  // Determines whether the "All Clients" view is active
  const isAllClients = !activeClientId || activeClientId === 'all' || activeClientId === 'todos';

  // Active Client entity (null if 'all' is selected)
  const activeClient = useMemo(() => {
    if (isAllClients) {
      return null;
    }
    return clients.find((c) => c.id === activeClientId) || clients[0] || SAMPLE_CLIENTS[0];
  }, [clients, activeClientId, isAllClients]);

  // Projects strictly belonging to the active client, or ALL projects if activeClientId === 'all'
  const projectsInActiveClient = useMemo(() => {
    if (isAllClients) {
      return projects;
    }
    return projects.filter((p) => p.clientId === activeClientId);
  }, [projects, activeClientId, isAllClients]);

  // Active Project entity (strictly scoped to filtered client projects)
  const activeProject = useMemo(() => {
    const found = projectsInActiveClient.find((p) => p.id === activeProjectId);
    if (found) return found;
    return projectsInActiveClient[0] || (isAllClients ? projects[0] : null) || null;
  }, [projectsInActiveClient, projects, activeProjectId, isAllClients]);

  // Associated manuals in active project
  const manualsInActiveProject = useMemo(() => {
    return manuals.filter((m) => m.projectId === activeProject?.id);
  }, [manuals, activeProject?.id]);

  // Active Manual entity (fallback to first manual in project)
  const activeManual = useMemo(() => {
    if (activeManualId) {
      const found = manuals.find((m) => m.id === activeManualId);
      if (found) return found;
    }
    return manualsInActiveProject[0] || manuals[0] || null;
  }, [manuals, activeManualId, manualsInActiveProject]);

  // Client Selection Handler
  const handleSelectClient = useCallback(
    (clientId: string) => {
      setActiveClientId(clientId);
      if (clientId === 'all' || clientId === 'todos') {
        setActiveProjectId((cur) => {
          if (projects.some((p) => p.id === cur)) return cur;
          return projects[0]?.id || '';
        });
      } else {
        const clientProjs = projects.filter((p) => p.clientId === clientId);
        if (clientProjs.length > 0) {
          setActiveProjectId((cur) => {
            if (clientProjs.some((p) => p.id === cur)) return cur;
            const newProjId = clientProjs[0].id;
            const relatedManuals = manuals.filter((m) => m.projectId === newProjId);
            if (relatedManuals.length > 0) {
              setActiveManualId(relatedManuals[0].id);
            }
            return newProjId;
          });
        }
      }
      setViewMode('project');
    },
    [projects, manuals]
  );

  // Project Selection Handler
  const handleSelectProject = useCallback(
    (projectId: string) => {
      setActiveProjectId(projectId);
      const targetProj = projects.find((p) => p.id === projectId);
      if (targetProj && targetProj.clientId && targetProj.clientId !== activeClientId && !isAllClients) {
        setActiveClientId(targetProj.clientId);
      }
      const relatedManuals = manuals.filter((m) => m.projectId === projectId);
      if (relatedManuals.length > 0) {
        setActiveManualId(relatedManuals[0].id);
      }
      setViewMode('project');
    },
    [projects, manuals, activeClientId, isAllClients]
  );

  // Manual Selection Handler
  const handleSelectManual = useCallback(
    (manualId: string) => {
      setActiveManualId(manualId);
      const targetManual = manuals.find((m) => m.id === manualId);
      if (targetManual?.projectId && targetManual.projectId !== activeProjectId) {
        setActiveProjectId(targetManual.projectId);
        const relatedProj = projects.find((p) => p.id === targetManual.projectId);
        if (relatedProj?.clientId && relatedProj.clientId !== activeClientId && !isAllClients) {
          setActiveClientId(relatedProj.clientId);
        }
      }
      setViewMode('manual');
    },
    [manuals, projects, activeProjectId, activeClientId, isAllClients]
  );

  // Direct entry into manual workspace from Landing Page
  const handleEnterApp = useCallback(
    (clientId?: string, projectId?: string) => {
      if (clientId) {
        handleSelectClient(clientId);
      }
      if (projectId) {
        setActiveProjectId(projectId);
      }
      setViewMode('project');
    },
    [handleSelectClient]
  );

  return {
    viewMode,
    setViewMode,
    activeClientId,
    setActiveClientId,
    activeProjectId,
    setActiveProjectId,
    activeManualId,
    setActiveManualId,
    isAllClients,
    activeClient,
    projectsInActiveClient,
    activeProject,
    manualsInActiveProject,
    activeManual,
    handleSelectClient,
    handleSelectProject,
    handleSelectManual,
    handleEnterApp,
  };
}
