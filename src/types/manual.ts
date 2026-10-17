export type ActionType = 'click' | 'type' | 'enter' | 'save' | 'navigate' | 'select' | 'verify' | 'info';

/**
 * Traduce y estandariza los tipos de acción a terminología oficial en español
 */
export function getActionTypeSpanish(action: ActionType | string): string {
  const norm = (action || '').toLowerCase().trim();
  switch (norm) {
    case 'click':
      return 'CLIC';
    case 'type':
    case 'input':
      return 'INGRESAR';
    case 'enter':
      return 'ENTER';
    case 'save':
      return 'GRABAR';
    case 'navigate':
      return 'NAVEGAR';
    case 'select':
      return 'SELECCIONAR';
    case 'verify':
      return 'VERIFICAR';
    case 'info':
      return 'INFORMACIÓN';
    case 'drag':
      return 'ARRASTRAR';
    case 'hover':
      return 'ENFOCAR';
    default:
      return norm ? norm.toUpperCase() : 'ACCIÓN';
  }
}

export interface VisualAnnotation {
  id: string;
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  width?: number; // percentage
  height?: number; // percentage
  shape: 'circle' | 'rect' | 'arrow' | 'blur';
  color: string;
  label?: string;
  labelPosition?: 'top' | 'bottom' | 'inside' | 'left' | 'right' | 'custom';
  labelOffsetX?: number;
  labelOffsetY?: number;
}

export interface CropArea {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
}

/**
 * Recalcula y transforma matemáticamente las anotaciones visuales y puntos focales
 * al recortar una captura, garantizando que el punto focal NUNCA se desplace
 * y quede siempre perfectamente anclado al mismo elemento del sistema en pantalla.
 */
export function transformAnnotationsForCrop(
  annotations: VisualAnnotation[] = [],
  crop: CropArea
): VisualAnnotation[] {
  if (!annotations || annotations.length === 0) return [];
  if (crop.width <= 0 || crop.height <= 0) return annotations;

  // Si no hay recorte efectivo (100% completo), mantener intacto
  if (crop.x === 0 && crop.y === 0 && crop.width === 100 && crop.height === 100) {
    return annotations;
  }

  return annotations.map((ann) => {
    // Nueva posición en el sistema de coordenadas relativo a la imagen recortada
    const newX = ((ann.x - crop.x) / crop.width) * 100;
    const newY = ((ann.y - crop.y) / crop.height) * 100;

    // Escalar dimensiones de rectángulos / regiones de difuminado
    const newWidth = ann.width !== undefined ? (ann.width / crop.width) * 100 : undefined;
    const newHeight = ann.height !== undefined ? (ann.height / crop.height) * 100 : undefined;

    return {
      ...ann,
      x: Math.round(Math.max(1, Math.min(99, newX)) * 10) / 10,
      y: Math.round(Math.max(1, Math.min(99, newY)) * 10) / 10,
      width: newWidth !== undefined ? Math.round(Math.max(2, Math.min(98, newWidth)) * 10) / 10 : undefined,
      height: newHeight !== undefined ? Math.round(Math.max(2, Math.min(98, newHeight)) * 10) / 10 : undefined,
    };
  });
}

export interface ManualStep {
  id: string;
  stepNumber: number;
  title: string;
  actionType: ActionType;
  interactionTrigger?: 'click' | 'enter' | 'input' | 'submit' | 'manual';
  description: string;
  targetElement?: string;
  expectedResult?: string;
  purpose?: string; // Propósito de negocio y justificación pedagógica (Modelo 4C/ID: el "por qué" de la acción)
  tip?: string;
  warning?: string;
  instructorNotes?: string; // Transcripción o explicación verbal clave que el instructor indicó durante la grabación
  instructorAudioQuote?: string; // Cita textual destacada de la voz del instructor
  sapTransaction?: string; // p.ej: ME22N, VA01, MIRO, etc.
  sapModule?: string; // p.ej: SD, MM, FI, etc.
  image?: string; // base64 or URL
  imageName?: string;
  timestamp?: number; // if from video in seconds
  annotations: VisualAnnotation[];
}

export interface TroubleshootingItem {
  problem: string;
  solution: string;
}

export interface InstructorTranscriptSegment {
  id: string;
  timestamp: number; // segundos desde el inicio
  text: string;
  stepIndex?: number;
}

export interface UserManual {
  id: string;
  projectId?: string;
  title: string;
  subtitle: string;
  overview: string;
  targetAudience?: string;
  estimatedMinutes?: number;
  difficulty?: 'Principiante' | 'Intermedio' | 'Avanzado';
  prerequisites: string[];
  steps: ManualStep[];
  troubleshooting?: TroubleshootingItem[];
  summaryChecklist?: string[];
  instructorTranscript?: InstructorTranscriptSegment[];
  fullTranscriptionText?: string;
  createdAt: string;
  updatedAt: string;
  author?: string;
  version?: string;
  code?: string;
  category?: string;
  pedagogicalApproach?: 'sop' | 'microlearning' | 'onboarding';
  status?: 'draft' | 'published';
  isDraft?: boolean;
}

export interface VideoFrameCandidate {
  id: string;
  timestamp: number;
  dataUrl: string;
  selected: boolean;
  label?: string;
}
