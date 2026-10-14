/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserManual, ManualStep } from './types/manual';
import { SAMPLE_MANUALS } from './data/sampleManuals';
import { Navbar } from './components/Navbar';
import { ManualView } from './components/ManualView';
import { CreateManualModal } from './components/CreateManualModal';
import { InteractivePlayer } from './components/InteractivePlayer';
import { ExportModal } from './components/ExportModal';
import { StepEditorModal } from './components/StepEditorModal';
import { AnnotationEditor } from './components/AnnotationEditor';
import { InteractiveWorkflowSimulator } from './components/InteractiveWorkflowSimulator';
import {
  Sparkles,
  BookOpen,
  FileCheck2,
  Video,
  MonitorPlay,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

import { manualStorage } from './utils/storage';

export default function App() {
  const [manuals, setManuals] = useState<UserManual[]>(() => {
    return manualStorage.loadManuals(SAMPLE_MANUALS);
  });

  const [activeManualId, setActiveManualId] = useState<string>(() => {
    return SAMPLE_MANUALS[0]?.id || manuals[0]?.id || '';
  });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playerInitialStepIndex, setPlayerInitialStepIndex] = useState(0);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const [editingStep, setEditingStep] = useState<ManualStep | null>(null);
  const [annotatingStep, setAnnotatingStep] = useState<ManualStep | null>(null);

  // Sync with storage safely
  useEffect(() => {
    manualStorage.saveManuals(manuals);
  }, [manuals]);

  const activeManual = manuals.find((m) => m.id === activeManualId) || manuals[0] || SAMPLE_MANUALS[0];

  const handleManualCreated = (newManual: UserManual) => {
    setManuals((prev) => [newManual, ...prev]);
    setActiveManualId(newManual.id);
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
      <Navbar
        manuals={manuals}
        activeManualId={activeManualId}
        onSelectManual={setActiveManualId}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* Main Documentation Area */}
      <div className="flex-1">
        {activeManual ? (
          <ManualView
            manual={activeManual}
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
              onClick={() => setIsCreateModalOpen(true)}
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
            <span>Generación automatizada de manuales técnicos y onboarding</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Detección de Clics &amp; Enter</span>
            <span>·</span>
            <span>Exportación en PDF</span>
            <span>·</span>
            <span>Web Interactiva Autónoma</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <CreateManualModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onManualCreated={handleManualCreated}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {isSimulatorOpen && (
        <InteractiveWorkflowSimulator
          onManualGeneratedFromActions={handleManualCreated}
          onClose={() => setIsSimulatorOpen(false)}
        />
      )}

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
          />
        </>
      )}

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
