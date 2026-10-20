import { useState } from 'react';
import { Client } from '../types/client';
import { Project } from '../types/project';
import { ManualStep } from '../types/manual';

export interface UseModalsStateReturn {
  // Client Modal
  isClientModalOpen: boolean;
  setIsClientModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingClient: Client | null;
  setEditingClient: React.Dispatch<React.SetStateAction<Client | null>>;

  // Client Management Modal
  isManageClientsModalOpen: boolean;
  setIsManageClientsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Project Modal
  isProjectModalOpen: boolean;
  setIsProjectModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingProject: Project | null;
  setEditingProject: React.Dispatch<React.SetStateAction<Project | null>>;

  // Our Logo / Organization Branding Modal
  isOurLogoModalOpen: boolean;
  setIsOurLogoModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Create Manual Modal
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  createManualProjectId: string;
  setCreateManualProjectId: React.Dispatch<React.SetStateAction<string>>;

  // Export Modal
  isExportModalOpen: boolean;
  setIsExportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Interactive Player Modal
  isPlayerOpen: boolean;
  setIsPlayerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  playerInitialStepIndex: number;
  setPlayerInitialStepIndex: React.Dispatch<React.SetStateAction<number>>;

  // Simulator Modal
  isSimulatorOpen: boolean;
  setIsSimulatorOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Step Editor & Annotation Editor Modals
  editingStep: ManualStep | null;
  setEditingStep: React.Dispatch<React.SetStateAction<ManualStep | null>>;
  annotatingStep: ManualStep | null;
  setAnnotatingStep: React.Dispatch<React.SetStateAction<ManualStep | null>>;
}

/**
 * Enterprise Custom Hook: Centralizes modal overlay visibility and transient modal context state.
 * Keeps core business logic in App.tsx uncluttered from presentation-layer toggle mechanics.
 */
export function useModalsState(): UseModalsStateReturn {
  // Client Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isManageClientsModalOpen, setIsManageClientsModalOpen] = useState(false);

  // Project Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Branding Modal
  const [isOurLogoModalOpen, setIsOurLogoModalOpen] = useState(false);

  // Create Manual Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createManualProjectId, setCreateManualProjectId] = useState<string>('');

  // Export & Simulation Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playerInitialStepIndex, setPlayerInitialStepIndex] = useState(0);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Step & Annotation Modals
  const [editingStep, setEditingStep] = useState<ManualStep | null>(null);
  const [annotatingStep, setAnnotatingStep] = useState<ManualStep | null>(null);

  return {
    isClientModalOpen,
    setIsClientModalOpen,
    editingClient,
    setEditingClient,
    isManageClientsModalOpen,
    setIsManageClientsModalOpen,
    isProjectModalOpen,
    setIsProjectModalOpen,
    editingProject,
    setEditingProject,
    isOurLogoModalOpen,
    setIsOurLogoModalOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createManualProjectId,
    setCreateManualProjectId,
    isExportModalOpen,
    setIsExportModalOpen,
    isPlayerOpen,
    setIsPlayerOpen,
    playerInitialStepIndex,
    setPlayerInitialStepIndex,
    isSimulatorOpen,
    setIsSimulatorOpen,
    editingStep,
    setEditingStep,
    annotatingStep,
    setAnnotatingStep,
  };
}
