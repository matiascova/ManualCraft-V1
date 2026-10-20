export type ClientStatus = 'Activo' | 'En Pausa' | 'Archivado';

export interface Client {
  id: string; // ej. 'cli-weber'
  name: string; // ej. 'Weber' o 'Saint-Gobain Weber'
  legalName?: string; // ej. 'Saint-Gobain Weber Chile S.A.'
  code: string; // ej. 'WEB'
  logo?: string; // Data URL SVG/PNG
  brandColor?: string; // Color primario corporativo (ej. '#005596')
  industry?: string; // ej. 'Construcción, Adhesivos & Materiales'
  description?: string;
  sapMandante?: string; // ej. 'S/4HANA Mandante 100 · ZMMT'
  contactPerson?: string;
  contactEmail?: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CLIENT_BRAND_COLOR = '#0f3a60';
