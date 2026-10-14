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

export interface ManualStep {
  id: string;
  stepNumber: number;
  title: string;
  actionType: ActionType;
  interactionTrigger?: 'click' | 'enter' | 'input' | 'submit' | 'manual';
  description: string;
  targetElement?: string;
  expectedResult?: string;
  tip?: string;
  warning?: string;
  instructorNotes?: string; // Transcripción o explicación verbal clave que el instructor indicó durante la grabación
  instructorAudioQuote?: string; // Cita textual destacada de la voz del instructor
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
  category?: string;
}

export interface VideoFrameCandidate {
  id: string;
  timestamp: number;
  dataUrl: string;
  selected: boolean;
  label?: string;
}
