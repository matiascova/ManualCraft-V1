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
  name: string;
  code?: string;
  organizationName?: string; // Nombre de nuestra empresa u organización emisora
  organizationLogo?: string; // Logo de nuestra empresa (Data URL o URL)
  organizationSlogan?: string; // Slogan de nuestra empresa
  clientName: string;
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
