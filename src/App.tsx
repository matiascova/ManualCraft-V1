/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserManual, ManualStep } from './types/manual';
import { Project } from './types/project';
import { SAMPLE_MANUALS } from './data/sampleManuals';
import { SAMPLE_PROJECTS } from './data/sampleProjects';
import { Navbar } from './components/Navbar';
import { ManualView } from './components/ManualView';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { ProjectModal } from './components/ProjectModal';
import { CreateManualModal } from './components/CreateManualModal';
import { InteractivePlayer } from './components/InteractivePlayer';
import { ExportModal } from './components/ExportModal';
import { StepEditorModal } from './components/StepEditorModal';
import { AnnotationEditor } from './components/AnnotationEditor';
import { InteractiveWorkflowSimulator } from './components/InteractiveWorkflowSimulator';
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

export default function App() {
  // Projects state
  const [projects, setProjects] = useState<Project[]>(() => {
    return manualStorage.loadProjects(SAMPLE_PROJECTS);
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return projects[0]?.id || SAMPLE_PROJECTS[0]?.id || 'prj-weber-sap';
  });

  // Manuals state
  const [manuals, setManuals] = useState<UserManual[]>(() => {
    return manualStorage.loadManuals(SAMPLE_MANUALS);
  });

  const [activeManualId, setActiveManualId] = useState<string>(() => {
    return SAMPLE_MANUALS[0]?.id || manuals[0]?.id || '';
  });

  // Navigation mode: 'project' (Project Workspace & Solution view) | 'manual' (individual manual editor)
  const [viewMode, setViewMode] = useState<'project' | 'manual'>('project');

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createManualProjectId, setCreateManualProjectId] = useState<string>('');

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playerInitialStepIndex, setPlayerInitialStepIndex] = useState(0);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const [editingStep, setEditingStep] = useState<ManualStep | null>(null);
  const [annotatingStep, setAnnotatingStep] = useState<ManualStep | null>(null);

  // Sync projects with localStorage
  useEffect(() => {
    manualStorage.saveProjects(projects);
  }, [projects]);

  // Sync manuals with localStorage
  useEffect(() => {
    manualStorage.saveManuals(manuals);
  }, [manuals]);

  // Active Project and its associated manuals
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || SAMPLE_PROJECTS[0];

  const manualsInActiveProject = manuals.filter(
    (m) => m.projectId === activeProject?.id
  );

  // Active Manual
  const activeManual =
    manuals.find((m) => m.id === activeManualId) ||
    manualsInActiveProject[0] ||
    manuals[0] ||
    SAMPLE_MANUALS[0];

  // Handler: Save Project (create or edit)
  const handleSaveProject = (savedProject: Project) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === savedProject.id);
      if (exists) {
        return prev.map((p) => (p.id === savedProject.id ? savedProject : p));
      }
      return [savedProject, ...prev];
    });
    setActiveProjectId(savedProject.id);
    setViewMode('project');
  };

  // Handler: Select a Project
  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const relatedManuals = manuals.filter((m) => m.projectId === projectId);
    if (relatedManuals.length > 0) {
      setActiveManualId(relatedManuals[0].id);
    }
  };

  // Handler: Open Manual from Project Workspace
  const handleOpenManual = (manualId: string) => {
    setActiveManualId(manualId);
    setViewMode('manual');
  };

  // Handler: Open Project Settings modal
  const handleOpenProjectSettings = (projectToEdit: Project) => {
    setEditingProject(projectToEdit);
    setIsProjectModalOpen(true);
  };

  // Handler: Open Create Manual Modal bound to a specific project
  const handleOpenCreateManualForProject = (projectId: string) => {
    setCreateManualProjectId(projectId);
    setIsCreateModalOpen(true);
  };

  // Handler: Link an existing manual to a project
  const handleLinkManualToProject = (manualId: string, projectId: string) => {
    setManuals((prev) =>
      prev.map((m) => (m.id === manualId ? { ...m, projectId, updatedAt: new Date().toISOString() } : m))
    );
  };

  // Handler: Unlink manual from project
  const handleUnlinkManualFromProject = (manualId: string) => {
    if (window.confirm('¿Deseas desvincular este manual de este proyecto? Seguirá existiendo en tu biblioteca.')) {
      setManuals((prev) =>
        prev.map((m) => (m.id === manualId ? { ...m, projectId: undefined, updatedAt: new Date().toISOString() } : m))
      );
    }
  };

  // Handler: New Manual Created
  const handleManualCreated = (newManual: UserManual) => {
    const targetProjectId = newManual.projectId || activeProjectId;
    const manualWithProject = {
      ...newManual,
      projectId: targetProjectId,
    };
    setManuals((prev) => [manualWithProject, ...prev]);
    setActiveManualId(manualWithProject.id);
    setActiveProjectId(targetProjectId);
    setViewMode('manual');
  };

  const handleUpdateManual = (updated: UserManual) => {
    setManuals((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleStartInteractivePlayer = (stepIndex = 0) => {
    setPlayerInitialStepIndex(stepIndex);
    setIsPlayerOpen(true);
  };

  const handleSaveStep = (updatedStep: ManualStep) => {
    if (!activeManual) return;
    const updatedSteps = activeManual.steps.map((s) =>
      s.id === updatedStep.id ? updatedStep : s
    );
    handleUpdateManual({
      ...activeManual,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveAnnotations = (annotations: any[]) => {
    if (!annotatingStep || !activeManual) return;
    const updatedStep = { ...annotatingStep, annotations };
    handleSaveStep(updatedStep);
    setAnnotatingStep(updatedStep);
  };

  const handleAddNewStep = () => {
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
    handleUpdateManual({
      ...activeManual,
      steps: [...activeManual.steps, newStep],
      updatedAt: new Date().toISOString(),
    });
    setEditingStep(newStep);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar with Project selector & View Mode switch */}
      <Navbar
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
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      {/* Main Content Area: Project Workspace vs Manual View */}
      <div className="flex-1">
        {viewMode === 'project' && activeProject ? (
          <ProjectWorkspace
            project={activeProject}
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
          />
        ) : activeManual ? (
          <ManualView
            manual={activeManual}
            project={activeProject}
            onBackToProject={() => setViewMode('project')}
            onUpdateManual={handleUpdateManual}
            onStartInteractivePlayer={handleStartInteractivePlayer}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onEditStep={(step) => setEditingStep(step)}
            onAnnotateStep={(step) => setAnnotatingStep(step)}
            onAddNewStep={handleAddNewStep}
          />
        ) : (
          <div className="max-w-md mx-auto text-center py-24 px-4">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No hay manuales creados</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Crea tu primer manual subiendo capturas de pantalla o grabando un video de tu flujo.
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
            <span>Gestión de Proyectos, Clientes y Solución Integral de Manuales</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Cliente &amp; Logo Personalizado</span>
            <span>·</span>
            <span>Dossier Consolidado</span>
            <span>·</span>
            <span>Exportación Oficial en PDF</span>
          </div>
        </div>
      </footer>

      {/* PROJECT MODAL (New & Edit Project) */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSaveProject={handleSaveProject}
        existingProject={editingProject}
      />

      {/* CREATE MANUAL MODAL */}
      <CreateManualModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onManualCreated={handleManualCreated}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        projects={projects}
        activeProjectId={createManualProjectId || activeProjectId}
      />

      {isSimulatorOpen && (
        <InteractiveWorkflowSimulator
          onManualGeneratedFromActions={handleManualCreated}
          onClose={() => setIsSimulatorOpen(false)}
        />
      )}

      {/* INTERACTIVE PLAYER & EXPORT MODAL */}
      {activeManual && (
        <>
          <InteractivePlayer
            manual={activeManual}
            initialStepIndex={playerInitialStepIndex}
            isOpen={isPlayerOpen}
            onClose={() => setIsPlayerOpen(false)}
          />

          <ExportModal
            manual={activeManual}
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            project={activeProject}
            manualsInProject={manualsInActiveProject}
          />
        </>
      )}

      {/* STEP EDITOR MODAL */}
      {editingStep && (
        <StepEditorModal
          step={editingStep}
          manualContext={activeManual?.title}
          isOpen={true}
          onClose={() => setEditingStep(null)}
          onSave={handleSaveStep}
          onOpenAnnotationEditor={() => {
            setAnnotatingStep(editingStep);
            setEditingStep(null);
          }}
        />
      )}

      {/* ANNOTATION EDITOR */}
      {annotatingStep && annotatingStep.image && (
        <AnnotationEditor
          imageSrc={annotatingStep.image}
          annotations={annotatingStep.annotations || []}
          onChange={handleSaveAnnotations}
          onClose={() => setAnnotatingStep(null)}
        />
      )}
    </div>
  );
}
