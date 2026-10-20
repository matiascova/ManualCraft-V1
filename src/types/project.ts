export interface ProjectDocumentOptions {
  includeOurLogo: boolean;
  includeClientLogo: boolean;
  includeCoverPage: boolean;
  includeExecutiveSummary: boolean;
  includeDocumentControl: boolean;
  includeTableOfContents: boolean;
  includeProcessMatrix: boolean;
  includePrerequisites: boolean;
  includeStepScreenshots: boolean;
  includeActionBadges: boolean;
  includeTroubleshooting: boolean;
  includeChecklists: boolean;
  includeInstructorNotes: boolean;
}

export type ProjectStatus = 'Borrador' | 'En Progreso' | 'Revisión' | 'Aprobado' | 'Publicado';

export interface Project {
  id: string;
  clientId: string; // ID del Cliente corporativo (Nivel superior de la jerarquía)
  name: string;
  code?: string;
  organizationName?: string; // Nombre de nuestra empresa u organización emisora
  organizationLogo?: string; // Logo de nuestra empresa (Data URL o URL)
  organizationSlogan?: string; // Slogan de nuestra empresa
  clientName?: string;
  clientLogo?: string; // Data URL (PNG, JPG, SVG)
  description: string;
  status: ProjectStatus;
  category?: string;
  version: string;
  author: string;
  targetAudience?: string;
  scope?: string;
  colorTheme?: string;
  documentOptions: ProjectDocumentOptions;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_DOCUMENT_OPTIONS: ProjectDocumentOptions = {
  includeOurLogo: true,
  includeClientLogo: true,
  includeCoverPage: true,
  includeExecutiveSummary: true,
  includeDocumentControl: true,
  includeTableOfContents: true,
  includeProcessMatrix: true,
  includePrerequisites: true,
  includeStepScreenshots: true,
  includeActionBadges: true,
  includeTroubleshooting: true,
  includeChecklists: true,
  includeInstructorNotes: true,
};

/**
 * Normaliza y garantiza que todo proyecto tenga un clientId válido y asignado.
 * Si proviene de almacenamiento legacy sin clientId, infiere automáticamente
 * si pertenece a Weber, ACME o Nexus por nombre o ID.
 */
export function normalizeProject(project: Partial<Project> & { id: string; name: string }): Project {
  let clientId = project.clientId;
  const nameLower = (project.name || '').toLowerCase();
  const clientNameLower = (project.clientName || '').toLowerCase();
  const idLower = (project.id || '').toLowerCase();

  // Strictly fix any project IDs or client names belonging to known clients
  if (
    idLower.includes('acme') ||
    clientNameLower.includes('acme') ||
    nameLower.includes('acme') ||
    nameLower.includes('factura') ||
    nameLower.includes('tributari')
  ) {
    clientId = 'cli-acme';
  } else if (
    idLower.includes('nexus') ||
    clientNameLower.includes('nexus') ||
    nameLower.includes('nexus') ||
    nameLower.includes('seguridad') ||
    nameLower.includes('2fa') ||
    nameLower.includes('identidad')
  ) {
    clientId = 'cli-nexus';
  } else if (
    idLower.includes('weber') ||
    clientNameLower.includes('weber') ||
    nameLower.includes('weber') ||
    nameLower.includes('wms') ||
    nameLower.includes('mortero') ||
    nameLower.includes('sgcl') ||
    nameLower.includes('hu')
  ) {
    clientId = 'cli-weber';
  } else if (!clientId || clientId.trim() === '') {
    clientId = 'cli-weber';
  }

  let clientName = project.clientName;
  if (clientId === 'cli-weber') {
    clientName = 'Weber';
  } else if (clientId === 'cli-acme') {
    clientName = 'Grupo Industrial ACME';
  } else if (clientId === 'cli-nexus') {
    clientName = 'Nexus Global Systems';
  } else if (!clientName || clientName.trim() === '') {
    clientName = 'Cliente Corporativo';
  }

  return {
    ...project,
    clientId,
    clientName,
    description: project.description || '',
    status: project.status || 'En Progreso',
    version: project.version || '1.0',
    author: project.author || 'Equipo de Procesos SAP',
    documentOptions: project.documentOptions || { ...DEFAULT_DOCUMENT_OPTIONS },
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || new Date().toISOString(),
  } as Project;
}

