import { useState, useEffect, useCallback, useRef } from 'react';
import { UserManual } from '../types/manual';
import { Project, normalizeProject } from '../types/project';
import { Client } from '../types/client';
import { SAMPLE_MANUALS } from '../data/sampleManuals';
import { SAMPLE_PROJECTS } from '../data/sampleProjects';
import { SAMPLE_CLIENTS } from '../data/sampleClients';
import { manualStorage } from '../utils/storage';
import {
  subscribeToSharedManuals,
  saveManualToDatabase,
  deleteManualFromDatabase,
  subscribeToSharedProjects,
  saveProjectToDatabase,
  deleteProjectFromDatabase,
  subscribeToSharedClients,
  saveClientToDatabase,
  deleteClientFromDatabase,
  onFirestoreConnectionChange,
} from '../utils/firebase';

export interface UseManualDataSyncReturn {
  isDbConnected: boolean;
  clients: Client[];
  projects: Project[];
  manuals: UserManual[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setManuals: React.Dispatch<React.SetStateAction<UserManual[]>>;
  handleSaveClient: (client: Client) => void;
  handleDeleteClient: (clientId: string) => void;
  handleSaveProject: (project: Project) => void;
  handleDeleteProject: (projectId: string) => void;
  handleUpdateManual: (manual: UserManual) => void;
  handleDeleteManual: (manualId: string) => void;
  handleLinkManualToProject: (manualId: string, projectId: string) => void;
  handleUnlinkManualFromProject: (manualId: string) => void;
}

/**
 * Enterprise Custom Hook: Handles two-tier state synchronization (Firestore + IndexedDB/LocalStorage).
 * Implements anti-ping-pong guards to prevent circular Firestore write cascades.
 */
export function useManualDataSync(): UseManualDataSyncReturn {
  const [isDbConnected, setIsDbConnected] = useState(false);

  // 1. Clients State (Nivel Superior)
  const [clients, setClients] = useState<Client[]>(() => {
    return manualStorage.loadClients(SAMPLE_CLIENTS);
  });

  // 2. Projects State (Nivel Intermedio)
  const [projects, setProjects] = useState<Project[]>(() => {
    return manualStorage.loadProjects(SAMPLE_PROJECTS).map(normalizeProject);
  });

  // 3. Manuals State (Nivel Operativo)
  const [manuals, setManuals] = useState<UserManual[]>(() => {
    return manualStorage.loadManuals(SAMPLE_MANUALS);
  });

  // Anti-loop guards for Firestore normalization updates
  const correctedProjectsSyncSet = useRef<Set<string>>(new Set());

  // Real-time synchronization with Firestore shared database
  useEffect(() => {
    const unsubConn = onFirestoreConnectionChange((connected) => {
      setIsDbConnected(connected);
    });

    let hasAttemptedClientSeed = false;
    let hasAttemptedProjectSeed = false;
    let hasAttemptedManualSeed = false;

    // Real-time subscription to shared clients collection
    const unsubClients = subscribeToSharedClients((remoteClients) => {
      if (remoteClients && remoteClients.length > 0) {
        setClients(remoteClients);
      } else if (!hasAttemptedClientSeed) {
        hasAttemptedClientSeed = true;
        const local = manualStorage.loadClients(SAMPLE_CLIENTS);
        local.forEach((c) => {
          saveClientToDatabase(c).catch(() => {});
        });
      }
    });

    // Real-time subscription to shared projects collection
    const unsubProjects = subscribeToSharedProjects((remoteProjects) => {
      if (remoteProjects && remoteProjects.length > 0) {
        const normalized = remoteProjects.map(normalizeProject);
        setProjects(normalized);

        // Guarded normalization sync: ensure each corrected project is sent at most once
        normalized.forEach((p) => {
          const orig = remoteProjects.find((rp) => rp.id === p.id);
          const needsFix = orig && (orig.clientId !== p.clientId || orig.clientName !== p.clientName);
          if (needsFix && !correctedProjectsSyncSet.current.has(p.id)) {
            correctedProjectsSyncSet.current.add(p.id);
            saveProjectToDatabase(p).catch(() => {});
          }
        });
      } else if (!hasAttemptedProjectSeed) {
        hasAttemptedProjectSeed = true;
        const local = manualStorage.loadProjects(SAMPLE_PROJECTS).map(normalizeProject);
        local.forEach((p) => {
          saveProjectToDatabase(p).catch(() => {});
        });
      }
    });

    // Real-time subscription to shared manuals collection
    const unsubManuals = subscribeToSharedManuals((remoteManuals) => {
      const nonDeleted = (remoteManuals || []).filter((m) => !manualStorage.isManualDeleted(m.id));

      if (remoteManuals && remoteManuals.length > 0) {
        setManuals(nonDeleted);
      } else {
        const hasSeededBefore = typeof window !== 'undefined' && localStorage.getItem('manualcraft_manuals_seeded_v1') === 'true';
        if (!hasAttemptedManualSeed && !hasSeededBefore) {
          hasAttemptedManualSeed = true;
          if (typeof window !== 'undefined') {
            localStorage.setItem('manualcraft_manuals_seeded_v1', 'true');
          }
          const local = manualStorage.loadManuals(SAMPLE_MANUALS);
          local.forEach((m) => {
            saveManualToDatabase(m).catch(() => {});
          });
        } else {
          // Manuals collection is empty (e.g. all manuals deleted) -> reflect empty state immediately
          setManuals([]);
        }
      }
    });

    return () => {
      unsubConn();
      unsubClients();
      unsubProjects();
      unsubManuals();
    };
  }, []);

  // Sync with local cache
  useEffect(() => {
    manualStorage.saveClients(clients);
  }, [clients]);

  useEffect(() => {
    manualStorage.saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    manualStorage.saveManuals(manuals);
  }, [manuals]);

  // Client CRUD
  const handleSaveClient = useCallback((savedClient: Client) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === savedClient.id);
      if (exists) {
        return prev.map((c) => (c.id === savedClient.id ? savedClient : c));
      }
      return [savedClient, ...prev];
    });
    saveClientToDatabase(savedClient);
  }, []);

  const handleDeleteClient = useCallback((clientId: string) => {
    setClients((prev) => {
      const updated = prev.filter((c) => c.id !== clientId);
      manualStorage.deleteClient(clientId, updated);
      return updated;
    });
    deleteClientFromDatabase(clientId);
  }, []);

  // Project CRUD
  const handleSaveProject = useCallback((savedProject: Project) => {
    const normalized = normalizeProject(savedProject);
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === normalized.id);
      if (exists) {
        return prev.map((p) => (p.id === normalized.id ? normalized : p));
      }
      return [normalized, ...prev];
    });
    saveProjectToDatabase(normalized);
  }, []);

  const handleDeleteProject = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    deleteProjectFromDatabase(projectId);
  }, []);

  // Manual CRUD
  const handleUpdateManual = useCallback((updatedManual: UserManual) => {
    if (manualStorage.isManualDeleted(updatedManual.id)) {
      return;
    }
    setManuals((prev) => {
      const exists = prev.some((m) => m.id === updatedManual.id);
      if (exists) {
        return prev.map((m) => (m.id === updatedManual.id ? updatedManual : m));
      }
      return [updatedManual, ...prev];
    });
    saveManualToDatabase(updatedManual);
  }, []);

  const handleDeleteManual = useCallback((manualId: string) => {
    manualStorage.isManualDeleted(manualId);
    setManuals((prev) => {
      const updated = prev.filter((m) => m.id !== manualId);
      manualStorage.deleteManual(manualId, updated);
      return updated;
    });
    deleteManualFromDatabase(manualId).catch((err) => {
      console.warn('[Firebase] deleteManualFromDatabase caught:', err);
    });
  }, []);

  const handleLinkManualToProject = useCallback(
    (manualId: string, projectId: string) => {
      const targetManual = manuals.find((m) => m.id === manualId);
      if (!targetManual) return;
      const updated: UserManual = {
        ...targetManual,
        projectId,
        updatedAt: new Date().toISOString(),
      };
      handleUpdateManual(updated);
    },
    [manuals, handleUpdateManual]
  );

  const handleUnlinkManualFromProject = useCallback(
    (manualId: string) => {
      const targetManual = manuals.find((m) => m.id === manualId);
      if (!targetManual) return;
      const updated: UserManual = {
        ...targetManual,
        projectId: undefined,
        updatedAt: new Date().toISOString(),
      };
      handleUpdateManual(updated);
    },
    [manuals, handleUpdateManual]
  );

  return {
    isDbConnected,
    clients,
    projects,
    manuals,
    setClients,
    setProjects,
    setManuals,
    handleSaveClient,
    handleDeleteClient,
    handleSaveProject,
    handleDeleteProject,
    handleUpdateManual,
    handleDeleteManual,
    handleLinkManualToProject,
    handleUnlinkManualFromProject,
  };
}
