/**
 * Domain AI Service: Google Gemini Multimodal Orchestration
 * Handles prompt engineering, 4C/ID instructional guidelines, schema definitions,
 * retry loops with model fallback, timeout races, and deterministic fallback synthesis.
 */

import { GoogleGenAI, Type } from '@google/genai';

export interface GenerateManualInput {
  topic: string;
  context?: string;
  targetAudience?: string;
  images: Array<{
    dataUrl: string;
    label?: string;
    timestamp?: number;
    focalX?: number;
    focalY?: number;
  }>;
  instructorTranscription?: {
    fullText?: string;
    items?: Array<{ timestamp: number; text: string }>;
  };
  language?: string;
  pedagogicalApproach?: 'microlearning' | 'onboarding' | 'sop';
  autoAnonymizePii?: boolean;
}

export class AiManualService {
  private static getAiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  /**
   * Generates a complete structured manual from screen captures and instructor speech.
   */
  static async generateManual(input: GenerateManualInput) {
    const {
      topic,
      context = '',
      targetAudience = 'Usuarios finales y colaboradores',
      images,
      instructorTranscription,
      language = 'es',
      pedagogicalApproach = 'sop',
      autoAnonymizePii = true,
    } = input;

    const deduplicatedImages = images;
    const selectedImages = deduplicatedImages.slice(0, 75);

    const transcriptItems = Array.isArray(instructorTranscription?.items)
      ? instructorTranscription.items
      : [];
    const transcriptFullText =
      instructorTranscription?.fullText ||
      transcriptItems.map((t: any) => `[${t.timestamp}s] ${t.text}`).join('\n');

    let transcriptBlock = '';
    if (transcriptFullText && transcriptFullText.trim()) {
      transcriptBlock = `
===================================================================
TRANSCRIPCIÓN EN VIVO DEL INSTRUCTOR (AUDIO CAPTURADO - ESTILO MS TEAMS):
Durante la grabación de las pantallas, el instructor fue explicando verbalmente el proceso en tiempo real.
Esta es la transcripción cronológica de lo que el instructor fue indicando:
"""
${transcriptFullText.trim()}
"""
INSTRUCCIONES CLAVE DE ENRIQUECIMIENTO CON EL AUDIO DEL INSTRUCTOR:
1. Utiliza las palabras, términos de negocio, códigos y explicaciones exactas que mencionó el instructor.
2. REGLA ESTRICTA DE DIFERENCIACIÓN PEDAGÓGICA (ARGUMENTOS Y EJEMPLOS):
   - En 'description' (Descripción detallada) explica con claridad la ACCIÓN física y procedimental paso a paso.
   - En 'instructorNotes' e 'instructorAudioQuote': NO coloques la acción que se está realizando (ej. NO escribir "Hacer clic en Guardar" o "Seleccionar la fecha").
   - En 'instructorNotes' DEBES colocar EXCLUSIVAMENTE los ARGUMENTOS, RAZONAMIENTOS DE FONDO O EJEMPLOS PRÁCTICOS que aporta el instructor (ej. justificaciones de negocio, impacto en auditoría, casos de uso habituales, ejemplos con clientes reales o configuraciones de excepción).
   - REGLA DE NO REDUNDANCIA: Si la información de la explicación del instructor YA ESTÁ en la descripción detallada, o si no aporta ningún argumento ni ejemplo adicional, NO ES NECESARIO PONERLO: deja 'instructorNotes' e 'instructorAudioQuote' vacíos ("") para no redundar.
3. Si el instructor mencionó precauciones o trucos ("tips"), intégralos directamente en "warning" y "tip".
4. El manual debe reflejar el valor pedagógico del instructor como si se tratara de una minuta técnica de reunión ejecutiva.
===================================================================`;
    }

    let approachGuideline = '';
    if (pedagogicalApproach === 'microlearning') {
      approachGuideline = `ENFOQUE PEDAGÓGICO: Microaprendizaje / Guía Rápida (Quick Start). Prioriza pasos breves, verbos directos, máxima concisión y velocidad de resolución sin rodeos innecesarios.`;
    } else if (pedagogicalApproach === 'onboarding') {
      approachGuideline = `ENFOQUE PEDAGÓGICO: Capacitación Integral y Onboarding. Explica con claridad pedagógica el contexto empresarial, define términos clave y ayuda a colaboradores nuevos a comprender la visión global del proceso.`;
    } else {
      approachGuideline = `ENFOQUE PEDAGÓGICO: Procedimiento Operativo Estándar (SOP). Prioriza rigor normativo, nombres exactos de campos del sistema, validaciones críticas, precauciones de seguridad y trazabilidad de auditoría.`;
    }

    const instructionPrompt = `Eres un Redactor Técnico Senior y Especialista en Usabilidad, Diseño Instruccional y Pedagogía de Adultos (Andragogía), experto en crear manuales operativos y procedimientos estándar (SOPs) basados en el Modelo 4C/ID y microaprendizaje.
Analiza detenidamente la secuencia cronológica de capturas de pantalla/fotogramas proporcionados para el tema: "${topic || 'Proceso de Sistema / Flujo de Software'}".
Contexto adicional proporcionado por el autor: "${context || 'Ninguno'}".
Público objetivo: "${targetAudience}".
Idioma de respuesta: ${language === 'es' ? 'Español' : language}.
${approachGuideline}
${transcriptBlock}

REGLA FUNDAMENTAL DE FIDELIDAD ESTRICTA A LA GRABACIÓN (PROHIBICIÓN DE ALUCINAR O COPIAR DE PLANTILLAS):
1. CERO INVENCIÓN: Basa TODO el contenido exclusivamente en lo que se observa visualmente en las capturas de pantalla y lo que explica el instructor en el audio.
2. NO ASUMAS SAP NI OTRO ERP A MENOS QUE SEA EVIDENTE: Si la aplicación mostrada es una web, portal interno, sistema administrativo, CRM u otra herramienta que no sea SAP, NO menciones transacciones de SAP (como VA01, MM02, MIRO, ME21N, BANS, Solcrom, etc.) ni inventes códigos de transacción ajenos a la grabación.
3. Utiliza los nombres de campos, botones, secciones y terminología real que se leen en la pantalla capturada y en el audio del instructor.

CONTROL CRÍTICO DE PANTALLAS Y MULTI-ACTIVIDADES EN LA MISMA VENTANA (ANTI-REDUNDANCIA Y COBERTURA COMPLETA):
1. CONTROL DE PANTALLA INICIAL (CERO PASOS REDUNDANTES):
   Si el instructor comienza el video hablando o explicando el contexto antes de ejecutar acciones operativas (ej. 00:00 a 00:50 de introducción verbal), la pantalla inicial sólo debe tener como máximo UN paso introductorio ("Acceder al sistema" o "Navegar a la transacción") o asociarse al primer paso operativo. NUNCA crees 3 o 4 pasos repetidos de una pantalla donde no se realizaron actividades.
2. VARIAS ACTIVIDADES DOCUMENTADAS EN LA MISMA PANTALLA O TABLA:
   En sistemas de gestión (SAP, ERPs, tablas dinámicas, portales de facturación), es normal que el usuario realice MÚLTIPLES actividades consecutivas en la misma pantalla o tabla (ejemplo: filtrar por solicitud de embarque, verificar columnas de provisión, marcar la casilla de una factura, pulsar Grabar datos, confirmar la ventana modal emergente, seleccionar una segunda factura con provisión $500 y recibida $178, volver a pulsar Grabar, y finalmente revisar el saldo pendiente).
   DEBES CREAR UN PASO SEPARADO Y EXPLÍCITO PARA CADA UNA DE ESAS ACTIVIDADES REALIZADAS, asociando la captura correspondiente de ese momento y configurando:
   - 'title' claro y específico para esa acción concreta (ej. "Verificar provisión e importe de la primera factura", "Marcar casilla y grabar datos", "Confirmar registro en ventana emergente", "Seleccionar y grabar segunda factura recibida", "Comprobar saldo restante pendiente de facturación").
   - 'actionType' exacto (click, select, save, enter, verify, type).
   - 'targetElement' señalando el botón, celda, casilla o línea exacta operada.
   - 'hotspotX' y 'hotspotY' apuntando al punto visual de la pantalla donde se efectúa la acción.
3. ALINEACIÓN TOTAL CON LA TRANSCRIPCIÓN:
   Cada actividad que el instructor describe en el audio (como ingresar sociedad POLK, indicar solicitud de embarque, cotejar montos de $60 y $120, registrar $140,000, aceptar confirmación, gestionar provisión de $500 / $178 y revisar remanente de $88) DEBE quedar fielmente reflejada en los pasos del manual con sus notas de instructor correspondientes.

CAPA DE ANÁLISIS FUNCIONAL, OCR DE PRECISIÓN Y DETECCIÓN DE INTERACCIONES:
1. IDENTIFICACIÓN DE TEXTO DIGITADO Y CAMPOS LLENADOS (OCR DE ALTA PRECISIÓN):
   - Examina minuciosamente los campos de entrada de texto, formularios, casillas y tablas en cada captura.
   - DETECTA EXACTAMENTE QUÉ TEXTO DIGITÓ EL USUARIO:
     * Si en la pantalla aparece escrito un código de sociedad (por ejemplo 'VOLC'), un número de documento/solicitud (ej. '100007'), un monto, una fecha o un usuario: DEBES IDENTIFICARLO CLARAMENTE y mencionarlo tanto en el 'title' como en la 'description'.
     * Si la acción es de tipo 'type', redacta el título y la descripción indicando con exactitud el valor ingresado y el nombre del campo.
   - Si el usuario interactúa con un botón (ej. 'Aceptar', 'Ejecutar', 'Grabar', 'Buscar', 'Continuar'), identifícalo con su nombre exacto en 'targetElement' y describe la acción.

2. UBICACIÓN GEOMÉTRICA EXACTA DEL PUNTERO / PUNTO FOCAL ('hotspotX', 'hotspotY'):
   - Calcula con PRECISIÓN (coordenadas porcentuales de 0 a 100 de izquierda a derecha y de arriba a abajo) el centro del elemento operado:
     * Si se digitó en un campo de texto: 'hotspotX' y 'hotspotY' DEBEN apuntar al centro de esa caja de texto específica, NO al centro de la pantalla.
     * Si se presionó un botón: 'hotspotX' y 'hotspotY' DEBEN apuntar al centro exacto de ese botón.
     * Si la captura de pantalla incluye una indicación de zona de acción detectada (focalX, focalY), úsala como referencia primordial para ubicar el puntero visual.

3. TÍTULO ACCIONABLE (Orientado a metas con verbo en imperativo)
4. PROPÓSITO Y JUSTIFICACIÓN ('purpose' - El "Por qué")
5. DESCRIPCIÓN CLARA
6. ELEMENTO DE ATENCIÓN ('targetElement')
7. RESULTADO ESPERADO ('expectedResult')

CAPA DE ANONIMIZACIÓN Y PRIVACIDAD AUTOMÁTICA (DETECCIÓN DE PII):
Inspecciona detenidamente los datos que aparecen visibles en cada captura.
Si identificas datos sensibles reales o confidenciales como:
- Direcciones de correo electrónico personales
- Números de tarjeta bancaria o cuentas bancarias
- Contraseñas o tokens expuestos
- Nombres de personas físicas protegidos
- Claves de identificación fiscal personales (RUT, DNI, SSN) o saldos altamente confidenciales
Genera en 'sensitiveDataRegions' las coordenadas aproximadas de la caja que contiene ese dato (x, y, width, height) para aplicar difuminado automático (blur) de protección.

Además, genera basándote ÚNICAMENTE en el flujo analizado:
- Un título atractivo y preciso para el manual
- Un subtítulo conciso
- Resumen general (overview) enriquecido con el propósito explicado por el instructor
- Tiempo estimado en minutos
- Nivel de dificultad ('Principiante' | 'Intermedio' | 'Avanzado')
- Lista de requisitos previos coherentes con el proceso grabado (prerequisites)
- Resolución de incidencias ('troubleshooting'): Si el flujo se completó con normalidad, dejar []
- Checklist de verificación final ('summaryChecklist'): 2 a 4 comprobaciones clave de éxito.

Asegúrate de responder estrictamente en el formato JSON estructurado solicitado.`;

    const parts: any[] = [{ text: instructionPrompt }];

    selectedImages.forEach((img, idx) => {
      if (img.dataUrl && typeof img.dataUrl === 'string') {
        const matches = img.dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
          const focalInfo =
            (img as any).focalX !== undefined && (img as any).focalY !== undefined
              ? ` - Zona de acción física detectada en torno a (${(img as any).focalX}%, ${(img as any).focalY}%)`
              : '';
          parts.push({
            text: `[Captura de Pantalla ${idx + 1}${img.timestamp !== undefined ? ` - Minuto ${img.timestamp}s` : ''}${img.label ? ` - Nota: ${img.label}` : ''}${focalInfo}]`,
          });
        }
      }
    });

    const schemaConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Título general claro del manual' },
          subtitle: { type: Type.STRING, description: 'Subtítulo conciso' },
          overview: { type: Type.STRING, description: 'Resumen introductorio del procedimiento' },
          estimatedMinutes: { type: Type.INTEGER, description: 'Minutos estimados para completar' },
          difficulty: { type: Type.STRING, description: 'Principiante, Intermedio o Avanzado' },
          prerequisites: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Requisitos previos antes de comenzar',
          },
          steps: {
            type: Type.ARRAY,
            description: 'Pasos cronológicos correspondientes a las capturas analizadas',
            items: {
              type: Type.OBJECT,
              properties: {
                stepIndex: { type: Type.INTEGER, description: 'Índice de la captura (0 a N-1)' },
                title: { type: Type.STRING, description: 'Título de la acción' },
                actionType: { type: Type.STRING, description: 'click, type, enter, save, navigate, select, verify o info' },
                description: { type: Type.STRING, description: 'Descripción detallada paso a paso' },
                purpose: {
                  type: Type.STRING,
                  description: 'Propósito funcional del paso: justificación del por qué se realiza esta acción en el flujo de negocio',
                },
                targetElement: { type: Type.STRING, description: 'Nombre o etiqueta del elemento interactivo' },
                expectedResult: { type: Type.STRING, description: 'Lo que el usuario verá o conseguirá tras el paso' },
                tip: { type: Type.STRING, description: 'Consejo o atajo útil opcional' },
                warning: { type: Type.STRING, description: 'Advertencia sobre precaución importante si aplica' },
                sensitiveDataRegions: {
                  type: Type.ARRAY,
                  description: 'Regiones con información personal identificable o sensible (PII) que deben difuminarse',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER, description: 'Posición X porcentual (0 a 100) del centro del dato sensible' },
                      y: { type: Type.NUMBER, description: 'Posición Y porcentual (0 a 100) del centro del dato sensible' },
                      width: { type: Type.NUMBER, description: 'Ancho porcentual (5 a 50) de la caja' },
                      height: { type: Type.NUMBER, description: 'Alto porcentual (3 a 20) de la caja' },
                      label: { type: Type.STRING, description: 'Tipo de dato detectado' },
                    },
                    required: ['x', 'y', 'width', 'height'],
                  },
                },
                instructorNotes: {
                  type: Type.STRING,
                  description: 'Argumentos de fondo o ejemplos prácticos que da el instructor',
                },
                instructorAudioQuote: {
                  type: Type.STRING,
                  description: 'Cita textual del instructor destacando un argumento o ejemplo clave',
                },
                hotspotX: { type: Type.NUMBER, description: 'Posición X porcentual (0 a 100) del elemento' },
                hotspotY: { type: Type.NUMBER, description: 'Posición Y porcentual (0 a 100) del elemento' },
                sapTransaction: {
                  type: Type.STRING,
                  description: 'Código de transacción de SAP si aplica o vacío ("")',
                },
                sapModule: {
                  type: Type.STRING,
                  description: 'Módulo de SAP si aplica o vacío ("")',
                },
              },
              required: ['stepIndex', 'title', 'actionType', 'description'],
            },
          },
          troubleshooting: {
            type: Type.ARRAY,
            description: 'Posibles errores y soluciones comunes',
            items: {
              type: Type.OBJECT,
              properties: {
                problem: { type: Type.STRING },
                solution: { type: Type.STRING },
              },
              required: ['problem', 'solution'],
            },
          },
          summaryChecklist: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Puntos clave para verificar que el manual se completó con éxito',
          },
        },
        required: ['title', 'subtitle', 'overview', 'steps'],
      },
    };

    const ai = this.getAiClient();
    let parsedData: any = null;

    if (ai) {
      const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
      for (const modelName of modelsToTry) {
        try {
          const aiPromise = ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: schemaConfig as any,
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout en ${modelName} tras 30 segundos`)), 30000)
          );

          const response = (await Promise.race([aiPromise, timeoutPromise])) as any;
          const rawJson = response.text || '{}';
          parsedData = JSON.parse(rawJson);
          if (parsedData && parsedData.steps) {
            break;
          }
        } catch (err: any) {
          console.warn(`[AiManualService] Falló modelo ${modelName}:`, err.message || err);
        }
      }
    }

    // Deterministic fallback if AI is unavailable or timed out: preserves all captured steps
    if (!parsedData || !parsedData.steps) {
      const fallbackSteps = deduplicatedImages.map((img, idx) => {
        const label = img.label || `Paso ${idx + 1}`;
        let actionType = 'click';
        if (label.toLowerCase().includes('enter')) actionType = 'enter';
        else if (label.toLowerCase().includes('dato') || label.toLowerCase().includes('escribir')) actionType = 'type';
        else if (label.toLowerCase().includes('grabar') || label.toLowerCase().includes('guardar')) actionType = 'save';

        let stepInstructorNote = '';
        let stepInstructorQuote = '';
        if (transcriptItems.length > 0) {
          const matchedTrans =
            img.timestamp !== undefined
              ? transcriptItems.find((t: any) => Math.abs(t.timestamp - img.timestamp!) <= 4)
              : transcriptItems[idx] || transcriptItems[0];
          if (matchedTrans) {
            stepInstructorNote = matchedTrans.text;
            stepInstructorQuote = matchedTrans.text;
          }
        }

        const focalX = typeof (img as any).focalX === 'number' ? (img as any).focalX : 50;
        const focalY = typeof (img as any).focalY === 'number' ? (img as any).focalY : 50;

        return {
          stepIndex: idx,
          title: `Paso ${idx + 1}: ${label}`,
          actionType,
          description: `Realiza la acción correspondiente en la pantalla para continuar con el flujo de ${topic || 'la tarea'}.`,
          targetElement: label,
          expectedResult: 'El sistema valida la acción y avanza al siguiente paso.',
          instructorNotes: stepInstructorNote,
          instructorAudioQuote: stepInstructorQuote,
          hotspotX: focalX,
          hotspotY: focalY,
        };
      });

      parsedData = {
        title: topic ? `Manual: ${topic}` : 'Manual de Usuario',
        subtitle: 'Guía paso a paso generada a partir de capturas de pantalla',
        overview: context || `Guía operativa para completar el procedimiento de ${topic || 'sistema'}.`,
        estimatedMinutes: Math.max(3, deduplicatedImages.length * 2),
        difficulty: 'Principiante',
        prerequisites: ['Acceso con credenciales al sistema'],
        steps: fallbackSteps,
        troubleshooting: [
          {
            problem: 'El sistema no avanza tras completar el paso',
            solution: 'Verifica que todos los campos obligatorios estén completos antes de continuar.',
          },
        ],
        summaryChecklist: ['Pasos de la secuencia completados con éxito'],
        isFallbackDueToHighDemand: true,
      };
    }

    // Map AI steps with the actual image data and generate annotations
    const mappedSteps = (parsedData.steps || []).map((s: any, idx: number) => {
      const sourceImageIndex =
        typeof s.stepIndex === 'number' && s.stepIndex < deduplicatedImages.length ? s.stepIndex : idx;
      const matchedImage = deduplicatedImages[sourceImageIndex] || deduplicatedImages[idx];

      const annotations: any[] = [];

      let targetX = typeof s.hotspotX === 'number' ? s.hotspotX : undefined;
      let targetY = typeof s.hotspotY === 'number' ? s.hotspotY : undefined;

      if ((targetX === undefined || targetY === undefined || (targetX === 50 && targetY === 50)) && matchedImage) {
        if (typeof (matchedImage as any).focalX === 'number' && typeof (matchedImage as any).focalY === 'number') {
          targetX = (matchedImage as any).focalX;
          targetY = (matchedImage as any).focalY;
        }
      }

      if (targetX !== undefined && targetY !== undefined) {
        annotations.push({
          id: `ann-${idx}-${Date.now()}`,
          x: Math.max(5, Math.min(95, targetX)),
          y: Math.max(5, Math.min(95, targetY)),
          shape: 'circle' as const,
          color: '#ef4444',
          label: s.targetElement || `Paso ${idx + 1}`,
        });
      }

      if (autoAnonymizePii && Array.isArray(s.sensitiveDataRegions)) {
        s.sensitiveDataRegions.forEach((region: any, rIdx: number) => {
          if (typeof region.x === 'number' && typeof region.y === 'number') {
            annotations.push({
              id: `blur-${idx}-${rIdx}-${Date.now()}`,
              x: Math.max(5, Math.min(95, region.x)),
              y: Math.max(5, Math.min(95, region.y)),
              width: Math.max(6, Math.min(60, region.width || 18)),
              height: Math.max(4, Math.min(30, region.height || 10)),
              shape: 'blur' as const,
              color: '#f59e0b',
              label: region.label ? `Privado: ${region.label}` : 'Dato Confidencial (PII)',
            });
          }
        });
      }

      let finalInstructorNote = s.instructorNotes || '';
      let finalInstructorQuote = s.instructorAudioQuote || '';
      if (!finalInstructorNote && transcriptItems.length > 0) {
        const matchedTrans =
          matchedImage?.timestamp !== undefined
            ? transcriptItems.find((t: any) => Math.abs(t.timestamp - matchedImage.timestamp!) <= 4)
            : transcriptItems[idx];
        if (matchedTrans) {
          finalInstructorNote = matchedTrans.text;
          if (!finalInstructorQuote) finalInstructorQuote = matchedTrans.text;
        }
      }

      return {
        id: `step-${idx + 1}-${Date.now()}`,
        stepNumber: idx + 1,
        title: s.title || `Paso ${idx + 1}`,
        actionType: (['click', 'type', 'enter', 'save', 'navigate', 'select', 'verify', 'info'].includes(s.actionType)
          ? s.actionType
          : 'click') as any,
        description: s.description || '',
        purpose: s.purpose || '',
        targetElement: s.targetElement || '',
        expectedResult: s.expectedResult || '',
        tip: s.tip || '',
        warning: s.warning || '',
        instructorNotes: finalInstructorNote,
        instructorAudioQuote: finalInstructorQuote,
        sapTransaction: s.sapTransaction ? String(s.sapTransaction).trim().toUpperCase() : undefined,
        sapModule: s.sapModule ? String(s.sapModule).trim().toUpperCase() : undefined,
        image: matchedImage?.dataUrl,
        imageName: matchedImage?.label,
        timestamp: matchedImage?.timestamp,
        annotations,
      };
    });

    // Ensure all deduplicated images are represented
    if (mappedSteps.length < deduplicatedImages.length) {
      for (let i = mappedSteps.length; i < deduplicatedImages.length; i++) {
        const fallbackImg = deduplicatedImages[i];
        const label = fallbackImg?.label || `Paso ${i + 1}`;
        let fallbackAction: 'click' | 'type' | 'enter' | 'save' = 'click';
        if (label.toLowerCase().includes('enter')) fallbackAction = 'enter';
        else if (label.toLowerCase().includes('dato') || label.toLowerCase().includes('escribir')) fallbackAction = 'type';
        else if (label.toLowerCase().includes('grabar') || label.toLowerCase().includes('guardar')) fallbackAction = 'save';

        let stepInstructorNote = '';
        if (transcriptItems.length > 0) {
          const matchedTrans =
            fallbackImg?.timestamp !== undefined
              ? transcriptItems.find((t: any) => Math.abs(t.timestamp - fallbackImg.timestamp!) <= 4)
              : transcriptItems[i] || transcriptItems[0];
          if (matchedTrans) {
            stepInstructorNote = matchedTrans.text;
          }
        }

        const focalX = typeof (fallbackImg as any)?.focalX === 'number' ? (fallbackImg as any).focalX : 50;
        const focalY = typeof (fallbackImg as any)?.focalY === 'number' ? (fallbackImg as any).focalY : 50;

        mappedSteps.push({
          id: `step-${i + 1}-${Date.now()}`,
          stepNumber: i + 1,
          title: `Paso ${i + 1}: ${label}`,
          actionType: fallbackAction,
          description: `Realiza la acción correspondiente en la pantalla para continuar con el flujo de ${topic || 'la tarea'}.`,
          purpose: `Asegurar la ejecución exitosa de la etapa ${i + 1}.`,
          targetElement: label,
          expectedResult: 'El sistema valida la acción y avanza al siguiente paso.',
          instructorNotes: stepInstructorNote,
          instructorAudioQuote: stepInstructorNote,
          image: fallbackImg?.dataUrl,
          imageName: fallbackImg?.label,
          timestamp: fallbackImg?.timestamp,
          annotations: [
            {
              id: `ann-${i}-${Date.now()}`,
              x: Math.max(5, Math.min(95, focalX)),
              y: Math.max(5, Math.min(95, focalY)),
              shape: 'circle' as const,
              color: '#ef4444',
              label,
            },
          ],
        });
      }
    }

    return {
      id: `manual-${Date.now()}`,
      title: parsedData.title || (topic ? `Manual: ${topic}` : 'Manual de Usuario'),
      subtitle: parsedData.subtitle || 'Guía paso a paso generada automáticamente',
      overview: parsedData.overview || 'Guía de instrucciones claras para ejecutar este procedimiento.',
      targetAudience: parsedData.targetAudience || targetAudience,
      estimatedMinutes: parsedData.estimatedMinutes || Math.max(3, mappedSteps.length * 2),
      difficulty: parsedData.difficulty || 'Principiante',
      prerequisites: parsedData.prerequisites || ['Acceso al sistema', 'Credenciales activas'],
      steps: mappedSteps,
      troubleshooting: parsedData.troubleshooting || [],
      summaryChecklist: parsedData.summaryChecklist || [],
      instructorTranscript: transcriptItems,
      fullTranscriptionText: transcriptFullText,
      pedagogicalApproach,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0',
    };
  }

  /**
   * AI-powered step rewriting and enrichment.
   */
  static async enhanceStep(step: any, instruction?: string, context?: string) {
    const ai = this.getAiClient();
    if (!ai) {
      throw new Error('GEMINI_API_KEY no configurada');
    }

    const prompt = `Actúa como redactor técnico profesional.
Dado el siguiente paso de un manual de usuario:
- Título actual: "${step.title}"
- Descripción actual: "${step.description}"
- Elemento objetivo: "${step.targetElement || ''}"
- Tipo de acción: "${step.actionType || 'click'}"

Instrucción de mejora del usuario: "${instruction || 'Mejora la redacción, hazlo más claro, conciso y añade un consejo útil'}"
Contexto del manual: "${context || ''}"

Responde en formato JSON con la versión mejorada del paso.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            actionType: { type: Type.STRING },
            targetElement: { type: Type.STRING },
            expectedResult: { type: Type.STRING },
            purpose: { type: Type.STRING },
            tip: { type: Type.STRING },
            warning: { type: Type.STRING },
          },
          required: ['title', 'description', 'actionType'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  }
}
