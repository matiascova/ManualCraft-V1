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
 * y quede siempre perfectamente anclado (con opción de referencia a la esquina superior izquierda o modo inmóvil).
 */
export function transformAnnotationsForCrop(
  annotations: VisualAnnotation[] = [],
  crop: CropArea,
  anchorMode: 'top-left' | 'dynamic' | 'fixed' = 'top-left'
): VisualAnnotation[] {
  if (!annotations || annotations.length === 0) return [];
  if (crop.width <= 0 || crop.height <= 0) return annotations;

  // Si no hay recorte efectivo (100% completo), mantener intacto
  if (crop.x === 0 && crop.y === 0 && crop.width === 100 && crop.height === 100) {
    return annotations;
  }

  // Si el usuario eligió modo fijo o inmóvil: las coordenadas relativas se mantienen exactamente idénticas
  if (anchorMode === 'fixed') {
    return annotations;
  }

  return annotations.map((ann) => {
    let newX: number;
    let newY: number;

    if (anchorMode === 'top-left') {
      // Referencia estricta a la esquina superior izquierda (0,0):
      // Si el recorte preserva el origen (0,0), mantiene la distancia física exacta en píxeles
      if (crop.x === 0 && crop.y === 0) {
        newX = (ann.x / crop.width) * 100;
        newY = (ann.y / crop.height) * 100;
      } else {
        newX = ((ann.x - crop.x) / crop.width) * 100;
        newY = ((ann.y - crop.y) / crop.height) * 100;
      }
    } else {
      // Modo dinámico respecto al cuadro de recorte
      newX = ((ann.x - crop.x) / crop.width) * 100;
      newY = ((ann.y - crop.y) / crop.height) * 100;
    }

    // Escalar dimensiones de rectángulos / regiones de difuminado
    const newWidth = ann.width !== undefined ? (ann.width / crop.width) * 100 : undefined;
    const newHeight = ann.height !== undefined ? (ann.height / crop.height) * 100 : undefined;

    return {
      ...ann,
      x: Math.round(Math.max(0.2, Math.min(99.8, newX)) * 10) / 10,
      y: Math.round(Math.max(0.2, Math.min(99.8, newY)) * 10) / 10,
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

/**
 * Limpia y normaliza el título descriptivo del paso, removiendo de forma exhaustiva
 * cualquier prefijo desactualizado de numeración simple o encadenada
 * (ej. "Paso 8:", "Paso 9 -", "8.", "Acción 8:", "Paso 1: Paso 2:").
 * Si el título contenía únicamente el prefijo sin descripción adicional, retorna cadena vacía.
 */
export function cleanStepTitle(title: string): string {
  if (!title) return '';
  let cleaned = title.trim();
  const prefixRegex = /^((Paso|Acci[oó]n|Step)\s*\d+[\s:.-]*|\d+[\s:.-]+)/i;
  // Bucle exhaustivo para remover prefijos encadenados si existieron reordenamientos previos
  while (prefixRegex.test(cleaned)) {
    cleaned = cleaned.replace(prefixRegex, '').trim();
  }
  return cleaned;
}

/**
 * Obtiene el título operativo alineado con el correlativo final (iniciando siempre estrictamente en 1).
 * Garantiza que en la columna "Paso Operativo" se muestre:
 * "Paso {correlativo}: {descripción}" o "Paso {correlativo}" si no hay descripción.
 */
export function formatStepOperativeTitle(title: string, indexOrNumber: number): string {
  const stepNum = indexOrNumber;
  const baseTitle = cleanStepTitle(title);
  if (!baseTitle) {
    return `Paso ${stepNum}`;
  }
  return `Paso ${stepNum}: ${baseTitle}`;
}

/**
 * Reajusta y recalcula todos los correlativos de una lista de pasos finales,
 * iniciando siempre estrictamente en 1.
 * Actualiza stepNumber, alinea el título del paso con su correlativo
 * y sincroniza las etiquetas de los puntos focales/anotaciones visuales.
 */
export function reindexManualSteps(steps: ManualStep[]): ManualStep[] {
  if (!steps || !Array.isArray(steps)) return [];

  return steps.map((step, idx) => {
    const newStepNumber = idx + 1;
    const clean = cleanStepTitle(step.title);
    const updatedTitle = formatStepOperativeTitle(clean, newStepNumber);

    // Ajustar etiquetas de anotaciones si tienen "Paso X" o "Paso"
    const updatedAnnotations = (step.annotations || []).map((ann) => {
      if (!ann.label) return ann;
      const updatedLabel = ann.label.replace(
        /^(Paso|Acci[oó]n|Step)\s*\d+/i,
        `Paso ${newStepNumber}`
      );
      return {
        ...ann,
        label: updatedLabel,
      };
    });

    // Ajustar propósito si menciona explícitamente "paso X"
    let updatedPurpose = step.purpose;
    if (updatedPurpose) {
      updatedPurpose = updatedPurpose.replace(
        /paso\s*\d+/gi,
        `paso ${newStepNumber}`
      );
    }

    return {
      ...step,
      stepNumber: newStepNumber,
      title: updatedTitle,
      purpose: updatedPurpose,
      annotations: updatedAnnotations,
    };
  });
}
