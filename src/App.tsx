/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { UserManual, ManualStep, reindexManualSteps } from './types/manual';
import { Project, normalizeProject } from './types/project';
import { Client } from './types/client';
import { OrganizationBranding, DEFAULT_ORGANIZATION_BRANDING } from './types/branding';
import { SAMPLE_MANUALS } from './data/sampleManuals';
import { SAMPLE_PROJECTS } from './data/sampleProjects';
import { SAMPLE_CLIENTS } from './data/sampleClients';
import { Navbar } from './components/Navbar';
import { ManualView } from './components/ManualView';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import {
  Sparkles,
  BookOpen,
  FolderKanban,
  FileCheck2,
  Video,
  MonitorPlay,
  ShieldCheck,
  CheckCircle,
  Building2,
  FolderPlus,
} from 'lucide-react';

import { manualStorage } from './utils/storage';
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
} from './utils/firebase';
import { generateClientMasterIndexHtml } from './utils/masterIndexGenerator';
import { LandingPage } from './components/LandingPage';

// Dynamic code-splitting for heavy modals to reduce initial bundle and memory footprint
const ClientModal = lazy(() => import('./components/ClientModal').then((m) => ({ default: m.ClientModal })));
const ClientManagementModal = lazy(() => import('./components/ClientManagementModal').then((m) => ({ default: m.ClientManagementModal })));
const ProjectModal = lazy(() => import('./components/ProjectModal').then((m) => ({ default: m.ProjectModal })));
const OrganizationLogoModal = lazy(() => import('./components/OrganizationLogoModal').then((m) => ({ default: m.OrganizationLogoModal })));
const CreateManualModal = lazy(() => import('./components/CreateManualModal').then((m) => ({ default: m.CreateManualModal })));
const InteractivePlayer = lazy(() => import('./components/InteractivePlayer').then((m) => ({ default: m.InteractivePlayer })));
const ExportModal = lazy(() => import('./components/ExportModal').then((m) => ({ default: m.ExportModal })));
const StepEditorModal = lazy(() => import('./components/StepEditorModal').then((m) => ({ default: m.StepEditorModal })));
const AnnotationEditor = lazy(() => import('./components/AnnotationEditor').then((m) => ({ default: m.AnnotationEditor })));
const InteractiveWorkflowSimulator = lazy(() => import('./components/InteractiveWorkflowSimulator').then((m) => ({ default: m.InteractiveWorkflowSimulator })));

export default function App() {
  // Database connection status
  const [isDbConnected, setIsDbConnected] = useState(false);

  // 1. Clients State (Nivel Superior de la Jerarquía)
  const [clients, setClients] = useState<Client[]>(() => {
    return manualStorage.loadClients(SAMPLE_CLIENTS);
  });

  const [activeClientId, setActiveClientId] = useState<string>(() => {
    return clients[0]?.id || SAMPLE_CLIENTS[0]?.id || 'cli-weber';
  });

  // 2. Projects State (Nivel Intermedio)
  const [projects, setProjects] = useState<Project[]>(() => {
    return manualStorage.loadProjects(SAMPLE_PROJECTS).map(normalizeProject);
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const weberProjects = SAMPLE_PROJECTS.filter((p) => p.clientId === 'cli-weber');
    return weberProjects[0]?.id || projects[0]?.id || 'prj-weber-wms-hu';
  });

  // 3. Manuals State (Nivel Operativo)
  const [manuals, setManuals] = useState<UserManual[]>(() => {
    return manualStorage.loadManuals(SAMPLE_MANUALS);
  });

  const [activeManualId, setActiveManualId] = useState<string>(() => {
    return SAMPLE_MANUALS[0]?.id || manuals[0]?.id || '';
  });

  // Real-time synchronization with Firestore shared database (Accessible to all users)
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
        // Sync any corrected clientIds back to Firestore
        normalized.forEach((p) => {
          const orig = remoteProjects.find((rp) => rp.id === p.id);
          if (!orig || orig.clientId !== p.clientId || orig.clientName !== p.clientName) {
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
      if (remoteManuals && remoteManuals.length > 0) {
        setManuals(remoteManuals);
      } else if (!hasAttemptedManualSeed) {
        hasAttemptedManualSeed = true;
        const local = manualStorage.loadManuals(SAMPLE_MANUALS);
        local.forEach((m) => {
          saveManualToDatabase(m).catch(() => {});
        });
      }
    });

    return () => {
      unsubConn();
      unsubClients();
      unsubProjects();
      unsubManuals();
    };
  }, []);

  // Navigation mode: 'landing' (Presentation & Value Proposition) | 'project' (Project Workspace) | 'manual' (individual manual editor)
  const [viewMode, setViewMode] = useState<'landing' | 'project' | 'manual'>('landing');

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isManageClientsModalOpen, setIsManageClientsModalOpen] = useState(false);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Organization Branding & Nuestro Logo state
  const [branding, setBranding] = useState<OrganizationBranding>(() => {
    return manualStorage.loadOrganizationBranding();
  });
  const [isOurLogoModalOpen, setIsOurLogoModalOpen] = useState(false);

  const handleSaveBranding = (updatedBranding: OrganizationBranding) => {
    setBranding(updatedBranding);
    manualStorage.saveOrganizationBranding(updatedBranding);
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createManualProjectId, setCreateManualProjectId] = useState<string>('');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playerInitialStepIndex, setPlayerInitialStepIndex] = useState(0);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const [editingStep, setEditingStep] = useState<ManualStep | null>(null);
  const [annotatingStep, setAnnotatingStep] = useState<ManualStep | null>(null);

  // Sync clients with localStorage / IndexedDB cache
  useEffect(() => {
    manualStorage.saveClients(clients);
  }, [clients]);

  // Sync projects with localStorage cache
  useEffect(() => {
    manualStorage.saveProjects(projects);
  }, [projects]);

  // Sync manuals with localStorage cache
  useEffect(() => {
    manualStorage.saveManuals(manuals);
  }, [manuals]);

  // Active Client (null if activeClientId === 'all')
  const activeClient = useMemo(() => {
    if (activeClientId === 'all') {
      return null;
    }
    return clients.find((c) => c.id === activeClientId) || clients[0] || SAMPLE_CLIENTS[0];
  }, [clients, activeClientId]);

  // Projects strictly belonging to the active client, or ALL projects if activeClientId === 'all'
  const projectsInActiveClient = useMemo(() => {
    if (activeClientId === 'all') {
      return projects;
    }
    // Strict filter: ONLY projects belonging to the active client!
    return projects.filter((p) => p.clientId === activeClientId);
  }, [projects, activeClientId]);

  // Active Project (memoized for high-scale performance)
  const activeProject = useMemo(() => {
    const found = projectsInActiveClient.find((p) => p.id === activeProjectId);
    if (found) return found;
    return projectsInActiveClient[0] || projects[0] || SAMPLE_PROJECTS[0];
  }, [projectsInActiveClient, projects, activeProjectId]);

  // Associated manuals in active project
  const manualsInActiveProject = useMemo(() => {
    return manuals.filter((m) => m.projectId === activeProject?.id);
  }, [manuals, activeProject?.id]);

  // Active Manual (memoized)
  const activeManual = useMemo(() => {
    if (activeManualId) {
      const found = manuals.find((m) => m.id === activeManualId);
      if (found) return found;
    }
    return manualsInActiveProject[0] || manuals[0] || null;
  }, [manuals, activeManualId, manualsInActiveProject]);

  // Handler: Select a Client
  const handleSelectClient = useCallback(
    (clientId: string) => {
      setActiveClientId(clientId);
      if (clientId === 'all') {
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

  // Direct launcher from Landing Page into the Manual workspace
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

  // Handler: Save Client (create or edit) - persisted to Firestore
  const handleSaveClient = useCallback((savedClient: Client) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === savedClient.id);
      if (exists) {
        return prev.map((c) => (c.id === savedClient.id ? savedClient : c));
      }
      return [savedClient, ...prev];
    });
    saveClientToDatabase(savedClient);
    setActiveClientId(savedClient.id);
  }, []);

  // Handler: Delete Client
  const handleDeleteClient = useCallback(
    (clientId: string) => {
      setClients((prev) => {
        const updated = prev.filter((c) => c.id !== clientId);
        manualStorage.deleteClient(clientId, updated);
        deleteClientFromDatabase(clientId);
        return updated;
      });
      if (activeClientId === clientId) {
        const remaining = clients.filter((c) => c.id !== clientId);
        if (remaining.length > 0) {
          handleSelectClient(remaining[0].id);
        }
      }
    },
    [activeClientId, clients, handleSelectClient]
  );

  // Handler: Download Master Index HTML for a Client
  const handleDownloadMasterIndex = useCallback(
    (client: Client) => {
      const clientProjects =
        client.id === 'all' ? projects : projects.filter((p) => p.clientId === client.id);
      const clientManuals = manuals.filter((m) => clientProjects.some((p) => p.id === m.projectId));
      const htmlContent = generateClientMasterIndexHtml(client, clientProjects, clientManuals, branding);

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Indice_Maestro_${client.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_SAP.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [projects, manuals, branding]
  );

  // Handler: Save Project (create or edit) - persisted to Firestore
  const handleSaveProject = useCallback(
    (savedProject: Project) => {
      setProjects((prev) => {
        const exists = prev.some((p) => p.id === savedProject.id);
        if (exists) {
          return prev.map((p) => (p.id === savedProject.id ? savedProject : p));
        }
        return [savedProject, ...prev];
      });
      saveProjectToDatabase(savedProject);
      setActiveProjectId(savedProject.id);
      if (savedProject.clientId && savedProject.clientId !== activeClientId) {
        setActiveClientId(savedProject.clientId);
      }
      setViewMode('project');
    },
    [activeClientId]
  );

  // Handler: Select a Project
  const handleSelectProject = useCallback((projectId: string) => {
    setActiveProjectId(projectId);
    setManuals((currentManuals) => {
      const relatedManuals = currentManuals.filter((m) => m.projectId === projectId);
      if (relatedManuals.length > 0) {
        setActiveManualId(relatedManuals[0].id);
      }
      return currentManuals;
    });
  }, []);

  // Handler: Open Manual from Project Workspace
  const handleOpenManual = useCallback((manualId: string) => {
    setActiveManualId(manualId);
    setViewMode('manual');
  }, []);

  // Handler: Open Project Settings modal
  const handleOpenProjectSettings = useCallback((projectToEdit: Project) => {
    setEditingProject(projectToEdit);
    setIsProjectModalOpen(true);
  }, []);

  // Handler: Open Create Manual Modal bound to a specific project
  const handleOpenCreateManualForProject = useCallback((projectId: string) => {
    setCreateManualProjectId(projectId);
    setIsCreateModalOpen(true);
  }, []);

  // Handler: Link an existing manual to a project
  const handleLinkManualToProject = useCallback((manualId: string, projectId: string) => {
    setManuals((prev) =>
      prev.map((m) => (m.id === manualId ? { ...m, projectId, updatedAt: new Date().toISOString() } : m))
    );
  }, []);

  // Handler: Delete manual permanently from projects and library
  const handleDeleteManual = useCallback((manualId: string) => {
    setManuals((prev) => {
      const updated = prev.filter((m) => m.id !== manualId);
      manualStorage.deleteManual(manualId, updated);
      deleteManualFromDatabase(manualId);
      return updated;
    });

    setActiveManualId((currentId) => (currentId === manualId ? '' : currentId));
    setViewMode('project');
  }, []);

  // Handler: Unlink manual from project
  const handleUnlinkManualFromProject = useCallback((manualId: string) => {
    setManuals((prev) => {
      const updated = prev.map((m) => {
        if (m.id === manualId) {
          const mod = { ...m, projectId: undefined, updatedAt: new Date().toISOString() };
          saveManualToDatabase(mod);
          return mod;
        }
        return m;
      });
      manualStorage.saveManuals(updated);
      return updated;
    });
  }, []);

  // Handler: New Manual Created
  const handleManualCreated = useCallback((newManual: UserManual) => {
    setActiveProjectId((currentProjectId) => {
      const targetProjectId = newManual.projectId || currentProjectId;
      const manualWithProject = {
        ...newManual,
        projectId: targetProjectId,
      };
      setManuals((prev) => [manualWithProject, ...prev]);
      setActiveManualId(manualWithProject.id);
      setViewMode('manual');
      // Save directly to shared Firestore database
      saveManualToDatabase(manualWithProject);
      return targetProjectId;
    });
  }, []);

  const handleUpdateManual = useCallback((updated: UserManual) => {
    setManuals((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    // Save directly to shared Firestore database
    saveManualToDatabase(updated);
  }, []);

  const handleStartInteractivePlayer = useCallback((stepIndex = 0) => {
    setPlayerInitialStepIndex(stepIndex);
    setIsPlayerOpen(true);
  }, []);

  const handleSaveStep = useCallback((updatedStep: ManualStep) => {
    setManuals((prev) =>
      prev.map((m) => {
        if (!m.steps.some((s) => s.id === updatedStep.id)) return m;
        const newSteps = m.steps.map((s) => (s.id === updatedStep.id ? updatedStep : s));
        const reindexed = reindexManualSteps(newSteps);
        const updatedManual = {
          ...m,
          steps: reindexed,
          updatedAt: new Date().toISOString(),
        };
        saveManualToDatabase(updatedManual);
        return updatedManual;
      })
    );
  }, []);

  const handleSaveAnnotations = useCallback(
    (annotations: any[]) => {
      if (!annotatingStep) return;
      const updatedStep = { ...annotatingStep, annotations };
      handleSaveStep(updatedStep);
      setAnnotatingStep(updatedStep);
    },
    [annotatingStep, handleSaveStep]
  );

  const handleAddNewStep = useCallback(() => {
    if (!activeManual) return;
    const newStepNumber = activeManual.steps.length + 1;
    const newStep: ManualStep = {
      id: `step-${Date.now()}`,
      stepNumber: newStepNumber,
      title: `Paso ${newStepNumber}: Nueva acción`,
      actionType: 'click',
      description: 'Describe con claridad qué debe hacer el usuario en este paso.',
      targetElement: 'Elemento en pantalla',
      expectedResult: 'El sistema confirmará la operación realizada.',
      annotations: [],
    };
    const updatedSteps = reindexManualSteps([...activeManual.steps, newStep]);
    handleUpdateManual({
      ...activeManual,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
    });
    setEditingStep(newStep);
  }, [activeManual, handleUpdateManual]);

  // If on Landing Page, render the dedicated high-converting marketing & solution overview page
  if (viewMode === 'landing') {
    return (
      <LandingPage
        clients={clients}
        projects={projects}
        manuals={manuals}
        branding={branding}
        onEnterApp={handleEnterApp}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar with 3-Tier Selector: Cliente -> Proyecto -> Manual */}
      <Navbar
        clients={clients}
        activeClientId={activeClientId}
        onSelectClient={handleSelectClient}
        onOpenNewClientModal={() => {
          setEditingClient(null);
          setIsClientModalOpen(true);
        }}
        onOpenManageClientsModal={() => setIsManageClientsModalOpen(true)}
        onDownloadMasterIndex={handleDownloadMasterIndex}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onOpenNewProjectModal={() => {
          setEditingProject(null);
          setIsProjectModalOpen(true);
        }}
        onOpenProjectSettings={handleOpenProjectSettings}
        manuals={manuals}
        activeManualId={activeManualId}
        onSelectManual={setActiveManualId}
        onOpenCreateModal={() => {
          setCreateManualProjectId(activeProjectId);
          setIsCreateModalOpen(true);
        }}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        branding={branding}
        onOpenOurLogoModal={() => setIsOurLogoModalOpen(true)}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        isDbConnected={isDbConnected}
      />

      {/* Main Content Area: Project Workspace vs Manual View */}
      <div className="flex-1">
        {viewMode === 'project' && activeProject ? (
          <ProjectWorkspace
            project={activeProject}
            client={activeClient}
            allProjects={projects}
            manualsInProject={manualsInActiveProject}
            allManuals={manuals}
            onSelectProject={handleSelectProject}
            onOpenManual={handleOpenManual}
            onOpenCreateManualForProject={handleOpenCreateManualForProject}
            onOpenProjectSettings={handleOpenProjectSettings}
            onOpenExportProject={() => setIsExportModalOpen(true)}
            onUpdateProject={handleSaveProject}
            onLinkManualToProject={handleLinkManualToProject}
            onUnlinkManualFromProject={handleUnlinkManualFromProject}
            onDeleteManual={handleDeleteManual}
            onOpenManageClientsModal={() => setIsManageClientsModalOpen(true)}
            onDownloadMasterIndex={handleDownloadMasterIndex}
            branding={branding}
            onOpenOurLogoModal={() => setIsOurLogoModalOpen(true)}
          />
        ) : activeManual ? (
          <ManualView
            manual={activeManual}
            project={activeProject}
            onBackToProject={() => setViewMode('project')}
            onUpdateManual={handleUpdateManual}
            onDeleteManual={handleDeleteManual}
            onStartInteractivePlayer={handleStartInteractivePlayer}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onEditStep={(step) => setEditingStep(step)}
            onAnnotateStep={(step) => setAnnotatingStep(step)}
            onAddNewStep={handleAddNewStep}
            branding={branding}
            onOpenOurLogoModal={() => setIsOurLogoModalOpen(true)}
          />
        ) : (
          <div className="max-w-md mx-auto text-center py-24 px-4">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No hay manuales creados en este proyecto</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Crea tu primer manual subiendo capturas de pantalla o grabando un video de tu flujo operativo SAP.
            </p>
            <button
              onClick={() => {
                setCreateManualProjectId(activeProjectId);
                setIsCreateModalOpen(true);
              }}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow"
            >
              Crear Nuevo Manual
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-16">
        <div className="w-[98%] max-w-[98vw] mx-auto px-2 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">ManualCraft AI</span>
            <span>·</span>
            <span>Jerarquía Corporativa: Cliente → Proyectos → Manuales SAP</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Cliente Activo: <strong className="text-slate-800">{activeClient?.name}</strong></span>
            <span>·</span>
            <span>Dossier Consolidado</span>
            <span>·</span>
            <span>Exportación Oficial en PDF &amp; HTML</span>
          </div>
        </div>
      </footer>

      {/* LAZY LOADED MODALS WITH SUSPENSE */}
      <Suspense fallback={null}>
        {/* Modal de Crear / Editar Cliente */}
        {isClientModalOpen && (
          <ClientModal
            isOpen={isClientModalOpen}
            onClose={() => {
              setIsClientModalOpen(false);
              setEditingClient(null);
            }}
            onSaveClient={handleSaveClient}
            existingClient={editingClient}
          />
        )}

        {/* Modal de Gestión de Todos los Clientes */}
        {isManageClientsModalOpen && (
          <ClientManagementModal
            isOpen={isManageClientsModalOpen}
            onClose={() => setIsManageClientsModalOpen(false)}
            clients={clients}
            activeClientId={activeClientId}
            onSelectClient={handleSelectClient}
            onOpenNewClientModal={() => {
              setEditingClient(null);
              setIsClientModalOpen(true);
            }}
            onOpenEditClientModal={(client) => {
              setEditingClient(client);
              setIsClientModalOpen(true);
            }}
            onDeleteClient={handleDeleteClient}
            projects={projects}
            manuals={manuals}
            onDownloadMasterIndex={handleDownloadMasterIndex}
          />
        )}

        {isOurLogoModalOpen && (
          <OrganizationLogoModal
            isOpen={isOurLogoModalOpen}
            onClose={() => setIsOurLogoModalOpen(false)}
            branding={branding}
            onSaveBranding={handleSaveBranding}
            sampleClientLogo={activeProject?.clientLogo}
            sampleClientName={activeProject?.clientName}
          />
        )}

        {isProjectModalOpen && (
          <ProjectModal
            isOpen={isProjectModalOpen}
            onClose={() => {
              setIsProjectModalOpen(false);
              setEditingProject(null);
            }}
            onSaveProject={handleSaveProject}
            existingProject={editingProject}
            clients={clients}
            activeClientId={activeClientId}
            branding={branding}
            onOpenOurLogoModal={() => setIsOurLogoModalOpen(true)}
          />
        )}

        {isCreateModalOpen && (
          <CreateManualModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onManualCreated={handleManualCreated}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
            projects={projectsInActiveClient}
            activeProjectId={createManualProjectId || activeProjectId}
          />
        )}

        {isSimulatorOpen && (
          <InteractiveWorkflowSimulator
            onManualGeneratedFromActions={handleManualCreated}
            onClose={() => setIsSimulatorOpen(false)}
          />
        )}

        {activeManual && isPlayerOpen && (
          <InteractivePlayer
            manual={activeManual}
            initialStepIndex={playerInitialStepIndex}
            isOpen={isPlayerOpen}
            onClose={() => setIsPlayerOpen(false)}
          />
        )}

        {isExportModalOpen && (
          <ExportModal
            manual={
              activeManual ||
              manualsInActiveProject[0] ||
              manuals[0] || {
                id: 'manual-default',
                title: 'Manual de Usuario SAP',
                description: '',
                overview: '',
                difficulty: 'Principiante',
                estimatedMinutes: 5,
                steps: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            }
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            project={activeProject}
            manualsInProject={manualsInActiveProject}
            branding={branding}
            onOpenOurLogoModal={() => setIsOurLogoModalOpen(true)}
            client={activeClient}
            clients={clients}
            allProjects={projects}
            allManuals={manuals}
          />
        )}

        {editingStep && (
          <StepEditorModal
            step={editingStep}
            manualContext={activeManual?.title}
            isOpen={true}
            onClose={() => setEditingStep(null)}
            onSave={handleSaveStep}
            onOpenAnnotationEditor={(stepToAnnotate) => {
              setAnnotatingStep(stepToAnnotate || editingStep);
              setEditingStep(null);
            }}
          />
        )}

        {annotatingStep && annotatingStep.image && (
          <AnnotationEditor
            imageSrc={annotatingStep.image}
            annotations={annotatingStep.annotations || []}
            onChange={handleSaveAnnotations}
            onClose={() => setAnnotatingStep(null)}
          />
        )}
      </Suspense>
    </div>
  );
}
