import express, { Request, Response } from 'express';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// High performance Gzip/Deflate compression for all responses
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// Performance & Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-DNS-Prefetch-Control', 'on');
  next();
});

// Limit body parsing to prevent memory exhaustion from oversized requests
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Safe Gemini client factory
function getAiClient(): GoogleGenAI | null {
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

// Endpoint: Healthcheck
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Endpoint: Generate Manual from Screenshots / Video frames
app.post('/api/generate-manual', async (req: Request, res: Response) => {
  try {
    const {
      topic = '',
      context = '',
      targetAudience = 'Usuarios finales y clientes',
      images = [], // Array<{ dataUrl: string, label?: string, timestamp?: number }>
      instructorTranscription = null, // { fullText?: string, items?: Array<{ timestamp: number, text: string }> }
      language = 'es',
    } = req.body;

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY no está configurada en las variables de entorno.',
      });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: 'Se requiere al menos una captura de pantalla o fotograma para analizar.',
      });
    }

    // Build multimodal parts for Gemini
    // Limit to max 12 frames to prevent timeout and ensure high fidelity
    const selectedImages = images.slice(0, 12);

    const parts: any[] = [];

    // Format instructor audio transcript if provided
    let transcriptBlock = '';
    const transcriptItems = Array.isArray(instructorTranscription?.items) ? instructorTranscription.items : [];
    const transcriptFullText = instructorTranscription?.fullText || transcriptItems.map((t: any) => `[${t.timestamp}s] ${t.text}`).join('\n');

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
2. En cada paso ('steps'), correlaciona la pantalla con el audio del instructor correspondiente a ese momento y completa:
   - "instructorNotes": La explicación verbal detallada que dio el instructor para esa pantalla o acción.
   - "instructorAudioQuote": Cita textual destacada o consejo clave dicho por el instructor en ese punto.
3. Si el instructor mencionó precauciones o trucos ("tips"), intégralos directamente en "warning" y "tip".
4. El manual debe reflejar el valor pedagógico del instructor como si se tratara de una minuta técnica de reunión ejecutiva.
===================================================================`;
    }

    // System prompt & user guidelines
    const instructionPrompt = `Eres un redactor técnico de nivel mundial (Technical Writer & UX Documentation Specialist) experto en crear manuales de usuario interactivos y guías paso a paso tipo Scribe, Tango o GitBook.
Analiza detenidamente la secuencia cronológica de capturas de pantalla/fotogramas proporcionados para el tema: "${topic || 'Proceso de Sistema / Flujo de Software'}".
Contexto adicional proporcionado por el autor: "${context || 'Ninguno'}".
Público objetivo: "${targetAudience}".
Idioma de respuesta: ${language === 'es' ? 'Español' : language}.
${transcriptBlock}

CAPACIDAD CRÍTICA DE IDENTIFICACIÓN DE ACCIONES:
Identifica con alta precisión:
1. CUÁNDO SE HACE UN CLIC: Identifica botones, pestañas, iconos o menús seleccionados (Ej. "Haz clic en 'Guardar'", "Haz clic en la pestaña 'Clientes'").
2. CUÁNDO SE COMPLETA UN DATO: Identifica campos de entrada de texto, números, contraseñas o selectores que fueron rellenados (Ej. "Ingresa el nombre del cliente en el campo 'Razón Social'").
3. CUÁNDO SE PRESIONA ENTER: Identifica cuando el usuario presiona la tecla Enter para buscar, enviar o confirmar un formulario (Ej. "Presiona la tecla Enter para ejecutar la búsqueda").
4. CUÁNDO SE DA EN GRABAR / GUARDAR / CONFIRMAR: Identifica el botón de confirmación o guardado final (Ej. "Haz clic en el botón 'Grabar / Guardar Cambios' para persistir la información").

Para cada imagen en orden (Imagen 1, Imagen 2, etc.):
1. Identifica qué elemento clave de la interfaz interactuó el usuario.
2. Genera un título de acción claro y conciso (Ejemplo: "Haz clic en 'Grabar Cambios'", "Completa el campo 'Email'", "Presiona Enter para confirmar").
3. Asigna un tipo de acción: 'click' | 'type' | 'enter' | 'save' | 'navigate' | 'select' | 'verify' | 'info'.
4. Redacta una descripción clara, amigable y profesional orientada a resolver la tarea sin fricción, enriquecida con lo indicado por el instructor.
5. Estima las coordenadas aproximadas del elemento principal de atención (coordenadas hotspotX y hotspotY en porcentaje de 0 a 100, donde 0,0 es esquina superior izquierda y 100,100 es inferior derecha).
6. Agrega un consejo pro ("tip") o advertencia ("warning") si corresponde para evitar errores comunes.
7. Explica el resultado esperado ("expectedResult") tras realizar la acción.
8. Si hay transcripción de audio del instructor, incluye "instructorNotes" e "instructorAudioQuote".

Además, genera:
- Un título atractivo para el manual
- Un subtítulo explicativo
- Resumen general (overview) enriquecido con el propósito explicado por el instructor
- Tiempo estimado en minutos
- Nivel de dificultad ('Principiante' | 'Intermedio' | 'Avanzado')
- Lista de requisitos previos (prerequisites)
- Lista de preguntas frecuentes o resolución de problemas (troubleshooting: problem & solution)
- Checklist de verificación final (summaryChecklist)

Asegúrate de responder estrictamente en el formato JSON estructurado solicitado.`;

    parts.push({ text: instructionPrompt });

    selectedImages.forEach((img, idx) => {
      if (img.dataUrl && typeof img.dataUrl === 'string') {
        const matches = img.dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          parts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
          parts.push({
            text: `[Captura de Pantalla ${idx + 1}${img.timestamp !== undefined ? ` - Minuto ${img.timestamp}s` : ''}${img.label ? ` - Nota: ${img.label}` : ''}]`,
          });
        }
      }
    });

    // Robust call with retry and fallback model for 503 / 429 errors
    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
    let lastError: any = null;
    let parsedData: any = null;

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
                targetElement: { type: Type.STRING, description: 'Nombre o etiqueta del elemento interactivo' },
                expectedResult: { type: Type.STRING, description: 'Lo que el usuario verá o conseguirá tras el paso' },
                tip: { type: Type.STRING, description: 'Consejo o atajo útil opcional' },
                warning: { type: Type.STRING, description: 'Advertencia sobre precaución importante si aplica' },
                instructorNotes: {
                  type: Type.STRING,
                  description: 'Explicación verbal y técnica que el instructor indicó durante la grabación para este paso',
                },
                instructorAudioQuote: {
                  type: Type.STRING,
                  description: 'Cita textual destacada o frase clave que dijo el instructor en este paso',
                },
                hotspotX: { type: Type.NUMBER, description: 'Posición X porcentual (0 a 100) del elemento' },
                hotspotY: { type: Type.NUMBER, description: 'Posición Y porcentual (0 a 100) del elemento' },
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

    for (const modelName of modelsToTry) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: schemaConfig as any,
          });

          const rawJson = response.text || '{}';
          parsedData = JSON.parse(rawJson);
          if (parsedData && parsedData.steps) {
            break; // Success!
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Attempt ${attempts} with ${modelName} failed:`, err.message || err);
          const isUnavailable =
            err.status === 503 ||
            err.code === 503 ||
            (err.message && (err.message.includes('503') || err.message.includes('high demand') || err.message.includes('UNAVAILABLE')));

          if (isUnavailable && attempts < maxAttempts) {
            // Wait 1.5s with backoff before retry
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          } else {
            break; // Try next model
          }
        }
      }

      if (parsedData) break;
    }

    // If Gemini still failed due to temporary high demand (503), construct a structured fallback
    // using the extracted frame labels, instructor transcripts, and user topic so the user never loses their screenshots!
    if (!parsedData || !parsedData.steps) {
      const fallbackSteps = selectedImages.map((img, idx) => {
        const label = img.label || `Paso ${idx + 1}`;
        let actionType = 'click';
        if (label.toLowerCase().includes('enter')) actionType = 'enter';
        else if (label.toLowerCase().includes('dato') || label.toLowerCase().includes('escribir')) actionType = 'type';
        else if (label.toLowerCase().includes('grabar') || label.toLowerCase().includes('guardar')) actionType = 'save';

        // Match closest transcript item by timestamp if available
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

        return {
          stepIndex: idx,
          title: `Paso ${idx + 1}: ${label}`,
          actionType,
          description: `Realiza la acción correspondiente en la pantalla para continuar con el flujo de ${topic || 'la tarea'}.`,
          targetElement: label,
          expectedResult: 'El sistema valida la acción y avanza al siguiente paso.',
          instructorNotes: stepInstructorNote,
          instructorAudioQuote: stepInstructorQuote,
          hotspotX: 50,
          hotspotY: 50,
        };
      });

      parsedData = {
        title: topic ? `Manual: ${topic}` : 'Manual de Usuario',
        subtitle: 'Guía paso a paso generada a partir de capturas de pantalla',
        overview: context || `Guía operativa para completar el procedimiento de ${topic || 'sistema'}.`,
        estimatedMinutes: Math.max(3, selectedImages.length * 2),
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

    // Map AI steps back with the actual image data
    const mappedSteps = (parsedData.steps || []).map((s: any, idx: number) => {
      const sourceImageIndex = typeof s.stepIndex === 'number' && s.stepIndex < selectedImages.length ? s.stepIndex : idx;
      const matchedImage = selectedImages[sourceImageIndex] || selectedImages[idx];

      const annotations = [];
      if (typeof s.hotspotX === 'number' && typeof s.hotspotY === 'number') {
        annotations.push({
          id: `ann-${idx}-${Date.now()}`,
          x: Math.max(5, Math.min(95, s.hotspotX)),
          y: Math.max(5, Math.min(95, s.hotspotY)),
          shape: 'circle' as const,
          color: '#ef4444',
          label: s.targetElement || `Paso ${idx + 1}`,
        });
      }

      // If AI didn't return an instructor note but we have transcript items, match by timestamp or index
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
        targetElement: s.targetElement || '',
        expectedResult: s.expectedResult || '',
        tip: s.tip || '',
        warning: s.warning || '',
        instructorNotes: finalInstructorNote,
        instructorAudioQuote: finalInstructorQuote,
        image: matchedImage?.dataUrl,
        imageName: matchedImage?.label,
        timestamp: matchedImage?.timestamp,
        annotations,
      };
    });

    // If fewer AI steps than images, create fallback steps for the remaining images
    if (mappedSteps.length < selectedImages.length) {
      for (let i = mappedSteps.length; i < selectedImages.length; i++) {
        mappedSteps.push({
          id: `step-${i + 1}-${Date.now()}`,
          stepNumber: i + 1,
          title: `Paso ${i + 1}: Continuar con el proceso`,
          actionType: 'click',
          description: 'Sigue las indicaciones mostradas en la pantalla.',
          image: selectedImages[i]?.dataUrl,
          imageName: selectedImages[i]?.label,
          timestamp: selectedImages[i]?.timestamp,
          annotations: [],
        });
      }
    }

    const completeManual = {
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0',
    };

    res.json({ success: true, manual: completeManual });
  } catch (error: any) {
    console.error('Error generating manual with Gemini:', error);
    res.status(500).json({
      error: error.message || 'Error al procesar el manual con inteligencia artificial',
    });
  }
});

// Endpoint: AI Enhance / Rewrite a Single Step
app.post('/api/enhance-step', async (req: Request, res: Response) => {
  try {
    const { step, instruction, context } = req.body;

    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });
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
            tip: { type: Type.STRING },
            warning: { type: Type.STRING },
          },
          required: ['title', 'description', 'actionType'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, enhanced: parsed });
  } catch (error: any) {
    console.error('Error enhancing step:', error);
    res.status(500).json({ error: error.message || 'Error al mejorar el paso' });
  }
});

// Serve frontend with Vite in development or static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Highly optimized static asset serving for production
    app.use(
      '/assets',
      express.static(path.join(__dirname, 'dist', 'assets'), {
        maxAge: '1y',
        immutable: true,
        etag: true,
      })
    );

    app.use(
      express.static(path.join(__dirname, 'dist'), {
        maxAge: '1h',
        etag: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            // Never cache index.html long-term to ensure immediate version rollouts
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );

    app.get('*', (req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`ManualCraft AI server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handling for container orchestrators (Cloud Run, Kubernetes)
  const shutdown = () => {
    console.log('Received termination signal. Closing HTTP server gracefully...');
    server.close(() => {
      console.log('HTTP server closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
