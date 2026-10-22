/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, Suspense, lazy } from 'react';
import { UserManual, ManualStep, reindexManualSteps } from './types/manual';
import { Project } from './types/project';
import { Client } from './types/client';
import { OrganizationBranding } from './types/branding';
import { Navbar } from './components/Navbar';
import { ManualView } from './components/ManualView';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { LandingPage } from './components/LandingPage';
import { BookOpen } from 'lucide-react';
import { manualStorage } from './utils/storage';
import { generateClientMasterIndexHtml } from './utils/masterIndexGenerator';
import { useManualDataSync } from './hooks/useManualDataSync';
import { useHierarchyNavigation } from './hooks/useHierarchyNavigation';
import { useModalsState } from './hooks/useModalsState';

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
  // 1. Data Synchronization & Persistence Tier
  const {
    isDbConnected,
    clients,
    projects,
    manuals,
    setManuals,
    handleSaveClient,
    handleDeleteClient,
    handleSaveProject,
    handleDeleteProject,
    handleUpdateManual,
    handleDeleteManual,
    handleLinkManualToProject,
    handleUnlinkManualFromProject,
  } = useManualDataSync();

  // 2. 3-Tier Hierarchy Navigation State (Cliente -> Proyecto -> Manual)
  const {
    viewMode,
    setViewMode,
    activeClientId,
    setActiveClientId,
    activeProjectId,
    setActiveProjectId,
    activeManualId,
    setActiveManualId,
    activeClient,
    projectsInActiveClient,
    activeProject,
    manualsInActiveProject,
    activeManual,
    handleSelectClient,
    handleSelectProject,
    handleSelectManual,
    handleEnterApp,
  } = useHierarchyNavigation({ clients, projects, manuals });

  // 3. UI Modal Overlays State
  const modals = useModalsState();

  // 4. Organization Co-Branding State
  const [branding, setBranding] = useState<OrganizationBranding>(() => {
    return manualStorage.loadOrganizationBranding();
  });

  const handleSaveBranding = useCallback((updatedBranding: OrganizationBranding) => {
    setBranding(updatedBranding);
    manualStorage.saveOrganizationBranding(updatedBranding);
  }, []);

  // 5. Domain Action Handlers
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

  const handleOpenProjectSettings = useCallback(
    (projectToEdit: Project) => {
      modals.setEditingProject(projectToEdit);
      modals.setIsProjectModalOpen(true);
    },
    [modals]
  );

  const handleDeleteProjectAndNavigate = useCallback(
    (projectIdToDelete: string) => {
      handleDeleteProject(projectIdToDelete);

      const remainingProjects = projects.filter((p) => p.id !== projectIdToDelete);
      const remainingInClient = remainingProjects.filter(
        (p) => activeClientId === 'all' || p.clientId === activeClientId
      );

      if (remainingInClient.length > 0) {
        setActiveProjectId(remainingInClient[0].id);
      } else if (remainingProjects.length > 0) {
        const nextProject = remainingProjects[0];
        if (nextProject.clientId && nextProject.clientId !== activeClientId && activeClientId !== 'all') {
          setActiveClientId(nextProject.clientId);
        }
        setActiveProjectId(nextProject.id);
      } else {
        setActiveProjectId('');
      }

      setViewMode('project');
    },
    [handleDeleteProject, projects, activeClientId, setActiveProjectId, setActiveClientId, setViewMode]
  );
  const handleDeleteManualAndNavigate = useCallback(
    (manualIdToDelete: string) => {
      handleDeleteManual(manualIdToDelete);
      if (activeManualId === manualIdToDelete) {
        setActiveManualId('');
      }
      setViewMode('project');
    },
    [handleDeleteManual, activeManualId, setActiveManualId, setViewMode]
  );

  const handleOpenCreateManualForProject = useCallback(
    (projectId: string) => {
      modals.setCreateManualProjectId(projectId);
      modals.setIsCreateModalOpen(true);
    },
    [modals]
  );

  const handleManualCreated = useCallback(
    (newManual: UserManual) => {
      const targetProjectId = newManual.projectId || activeProjectId;
      const manualWithProject: UserManual = {
        ...newManual,
        projectId: targetProjectId,
      };
      setManuals((prev) => [manualWithProject, ...prev]);
      setActiveProjectId(targetProjectId);
      setActiveManualId(manualWithProject.id);
      setViewMode('manual');
      handleUpdateManual(manualWithProject);
    },
    [activeProjectId, setActiveProjectId, setActiveManualId, setViewMode, setManuals, handleUpdateManual]
  );

  const handleStartInteractivePlayer = useCallback(
    (stepIndex = 0) => {
      modals.setPlayerInitialStepIndex(stepIndex);
      modals.setIsPlayerOpen(true);
    },
    [modals]
  );

  const handleSaveStep = useCallback(
    (updatedStep: ManualStep) => {
      setManuals((prev) =>
        prev.map((m) => {
          if (!m.steps.some((s) => s.id === updatedStep.id)) return m;
          const newSteps = m.steps.map((s) => (s.id === updatedStep.id ? updatedStep : s));
          const reindexed = reindexManualSteps(newSteps);
          const updatedManual: UserManual = {
            ...m,
            steps: reindexed,
            updatedAt: new Date().toISOString(),
          };
          handleUpdateManual(updatedManual);
          return updatedManual;
        })
      );
    },
    [setManuals, handleUpdateManual]
  );

  const handleSaveAnnotations = useCallback(
    (annotations: any[]) => {
      if (!modals.annotatingStep) return;
      const updatedStep = { ...modals.annotatingStep, annotations };
      handleSaveStep(updatedStep);
      modals.setAnnotatingStep(updatedStep);
    },
    [modals, handleSaveStep]
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
    modals.setEditingStep(newStep);
  }, [activeManual, handleUpdateManual, modals]);

  // If on Landing Page, render the dedicated solution overview page
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
          modals.setEditingClient(null);
          modals.setIsClientModalOpen(true);
        }}
        onOpenManageClientsModal={() => modals.setIsManageClientsModalOpen(true)}
        onDownloadMasterIndex={handleDownloadMasterIndex}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onOpenNewProjectModal={() => {
          modals.setEditingProject(null);
          modals.setIsProjectModalOpen(true);
        }}
        onOpenProjectSettings={handleOpenProjectSettings}
        manuals={manuals}
        activeManualId={activeManualId}
        onSelectManual={handleSelectManual}
        onOpenCreateModal={() => {
          modals.setCreateManualProjectId(activeProjectId);
          modals.setIsCreateModalOpen(true);
        }}
        onOpenExportModal={() => modals.setIsExportModalOpen(true)}
        onOpenSimulator={() => modals.setIsSimulatorOpen(true)}
        branding={branding}
        onOpenOurLogoModal={() => modals.setIsOurLogoModalOpen(true)}
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
            activeClientId={activeClientId}
            allProjects={projects}
            manualsInProject={manualsInActiveProject}
            allManuals={manuals}
            onSelectProject={handleSelectProject}
            onOpenManual={handleSelectManual}
            onOpenCreateManualForProject={handleOpenCreateManualForProject}
            onManualCreated={handleManualCreated}
            onOpenProjectSettings={handleOpenProjectSettings}
            onOpenExportProject={() => modals.setIsExportModalOpen(true)}
            onUpdateProject={handleSaveProject}
            onLinkManualToProject={handleLinkManualToProject}
            onUnlinkManualFromProject={handleUnlinkManualFromProject}
            onDeleteManual={handleDeleteManualAndNavigate}
            onDeleteProject={handleDeleteProjectAndNavigate}
            onOpenManageClientsModal={() => modals.setIsManageClientsModalOpen(true)}
            onDownloadMasterIndex={handleDownloadMasterIndex}
            branding={branding}
            onOpenOurLogoModal={() => modals.setIsOurLogoModalOpen(true)}
          />
        ) : activeManual ? (
          <ManualView
            manual={activeManual}
            project={activeProject}
            onBackToProject={() => setViewMode('project')}
            onUpdateManual={handleUpdateManual}
            onDeleteManual={handleDeleteManualAndNavigate}
            onStartInteractivePlayer={handleStartInteractivePlayer}
            onOpenExportModal={() => modals.setIsExportModalOpen(true)}
            onEditStep={(step) => modals.setEditingStep(step)}
            onAnnotateStep={(step) => modals.setAnnotatingStep(step)}
            onAddNewStep={handleAddNewStep}
            branding={branding}
            onOpenOurLogoModal={() => modals.setIsOurLogoModalOpen(true)}
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
                modals.setCreateManualProjectId(activeProjectId);
                modals.setIsCreateModalOpen(true);
              }}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow cursor-pointer"
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
            <span>Cliente Activo: <strong className="text-slate-800">{activeClient?.name || 'Todos'}</strong></span>
            <span>·</span>
            <span>Dossier Consolidado</span>
            <span>·</span>
            <span>Exportación Oficial en PDF &amp; HTML</span>
          </div>
        </div>
      </footer>

      {/* LAZY LOADED MODALS WITH SUSPENSE */}
      <Suspense fallback={null}>
        {modals.isClientModalOpen && (
          <ClientModal
            isOpen={modals.isClientModalOpen}
            onClose={() => {
              modals.setIsClientModalOpen(false);
              modals.setEditingClient(null);
            }}
            onSaveClient={(c) => {
              handleSaveClient(c);
              setActiveClientId(c.id);
            }}
            existingClient={modals.editingClient}
          />
        )}

        {modals.isManageClientsModalOpen && (
          <ClientManagementModal
            isOpen={modals.isManageClientsModalOpen}
            onClose={() => modals.setIsManageClientsModalOpen(false)}
            clients={clients}
            activeClientId={activeClientId}
            onSelectClient={handleSelectClient}
            onSaveClient={handleSaveClient}
            onOpenNewClientModal={() => {
              modals.setEditingClient(null);
              modals.setIsClientModalOpen(true);
            }}
            onOpenEditClientModal={(client) => {
              modals.setEditingClient(client);
              modals.setIsClientModalOpen(true);
            }}
            onDeleteClient={handleDeleteClient}
            projects={projects}
            manuals={manuals}
            onDownloadMasterIndex={handleDownloadMasterIndex}
          />
        )}

        {modals.isOurLogoModalOpen && (
          <OrganizationLogoModal
            isOpen={modals.isOurLogoModalOpen}
            onClose={() => modals.setIsOurLogoModalOpen(false)}
            branding={branding}
            onSaveBranding={handleSaveBranding}
            sampleClientLogo={activeProject?.clientLogo}
            sampleClientName={activeProject?.clientName}
          />
        )}

        {modals.isProjectModalOpen && (
          <ProjectModal
            isOpen={modals.isProjectModalOpen}
            onClose={() => {
              modals.setIsProjectModalOpen(false);
              modals.setEditingProject(null);
            }}
            onSaveProject={handleSaveProject}
            onDeleteProject={handleDeleteProjectAndNavigate}
            manualsCount={manuals.filter((m) => m.projectId === modals.editingProject?.id).length}
            existingProject={modals.editingProject}
            clients={clients}
            activeClientId={activeClientId === 'all' ? (clients[0]?.id || 'cli-weber') : activeClientId}
            branding={branding}
            onOpenOurLogoModal={() => modals.setIsOurLogoModalOpen(true)}
          />
        )}

        {modals.isCreateModalOpen && (
          <CreateManualModal
            isOpen={modals.isCreateModalOpen}
            onClose={() => modals.setIsCreateModalOpen(false)}
            onManualCreated={handleManualCreated}
            activeProjectId={modals.createManualProjectId || activeProjectId}
            projects={projectsInActiveClient}
          />
        )}

        {modals.isExportModalOpen && activeManual && (
          <ExportModal
            isOpen={modals.isExportModalOpen}
            onClose={() => modals.setIsExportModalOpen(false)}
            manual={activeManual}
            project={activeProject}
            client={activeClient}
            allProjects={projects}
            allManuals={manuals}
            branding={branding}
            onOpenOurLogoModal={() => modals.setIsOurLogoModalOpen(true)}
          />
        )}

        {modals.isPlayerOpen && activeManual && (
          <InteractivePlayer
            isOpen={modals.isPlayerOpen}
            onClose={() => modals.setIsPlayerOpen(false)}
            manual={activeManual}
            initialStepIndex={modals.playerInitialStepIndex}
          />
        )}

        {modals.isSimulatorOpen && (
          <InteractiveWorkflowSimulator
            onManualGeneratedFromActions={handleManualCreated}
            onClose={() => modals.setIsSimulatorOpen(false)}
          />
        )}

        {modals.editingStep && (
          <StepEditorModal
            isOpen={Boolean(modals.editingStep)}
            onClose={() => modals.setEditingStep(null)}
            step={modals.editingStep}
            onSave={handleSaveStep}
            onOpenAnnotationEditor={(s) => modals.setAnnotatingStep(s || modals.editingStep)}
          />
        )}

        {modals.annotatingStep && (
          <AnnotationEditor
            imageSrc={modals.annotatingStep.image || ''}
            annotations={modals.annotatingStep.annotations || []}
            onChange={handleSaveAnnotations}
            onClose={() => modals.setAnnotatingStep(null)}
          />
        )}
      </Suspense>
    </div>
  );
}
