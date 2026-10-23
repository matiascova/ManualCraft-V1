import express from 'express';
import type { Request, Response } from 'express';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AiManualService } from './aiService';

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
  }) as any
);

// Performance & Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-DNS-Prefetch-Control', 'on');
  next();
});

// Generous body parsing limits for multi-screenshot recording payloads
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Dedicated error handler for body-parser to ensure JSON errors are returned instead of HTML error pages
app.use((err: any, req: Request, res: Response, next: any) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    console.error('Payload too large error (413):', err.message);
    return res.status(413).json({
      success: false,
      error: 'El volumen de capturas supera el límite del servidor (Error 413). Se ha activado la compresión automática.',
    });
  }
  if (err && (err instanceof SyntaxError || err.status === 400)) {
    return res.status(400).json({
      success: false,
      error: 'Formato de datos no válido en la solicitud.',
    });
  }
  next(err);
});



// Endpoint: Healthcheck with Container Telemetry
app.get('/api/health', (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.json({
    status: 'ok',
    uptimeSec: Math.round(process.uptime()),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    memoryMb: {
      rss: Math.round(mem.rss / (1024 * 1024)),
      heapUsed: Math.round(mem.heapUsed / (1024 * 1024)),
    },
  });
});

// =========================================================================
// Endpoints Jerárquicos: Cliente -> Proyecto -> Manuales
// =========================================================================

// Endpoint: List all clients (Nivel Superior de la Jerarquía)
app.get('/api/clients', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json({
    status: 'ok',
    total: 0,
    clients: [],
  });
});

// Endpoint: List projects for a specific client
app.get('/api/clients/:clientId/projects', (req: Request, res: Response) => {
  const { clientId } = req.params;
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.json({
    status: 'ok',
    clientId,
    total: 0,
    projects: [],
  });
});

// Endpoint: Generate or stream Master Index HTML for a specific client
app.get('/api/clients/:clientId/master-index', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Índice Maestro</title></head><body><h1>Índice Maestro SAP</h1></body></html>');
});

// Endpoint: Generate Manual from Screenshots / Video frames
app.post('/api/generate-manual', async (req: Request, res: Response) => {
  try {
    if (req.destroyed || res.writableEnded) {
      return;
    }
    const {
      topic = '',
      context = '',
      targetAudience = 'Usuarios finales y colaboradores',
      images = [],
      instructorTranscription = null,
      language = 'es',
      pedagogicalApproach = 'sop',
      autoAnonymizePii = true,
    } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere al menos una captura de pantalla o fotograma para analizar.',
      });
    }

    const manual = await AiManualService.generateManual({
      topic,
      context,
      targetAudience,
      images,
      instructorTranscription,
      language,
      pedagogicalApproach,
      autoAnonymizePii,
    });

    res.json({ success: true, manual });
  } catch (error: any) {
    console.error('Error generating manual with Gemini:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar el manual con inteligencia artificial',
    });
  }
});

// Endpoint: AI Enhance / Rewrite a Single Step
app.post('/api/enhance-step', async (req: Request, res: Response) => {
  try {
    const { step, instruction, context } = req.body;
    if (!step) {
      return res.status(400).json({ success: false, error: 'Se requiere el objeto step.' });
    }

    const enhanced = await AiManualService.enhanceStep(step, instruction, context);
    res.json({ success: true, enhanced });
  } catch (error: any) {
    console.error('Error enhancing step:', error);
    res.status(500).json({ success: false, error: error.message || 'Error al mejorar el paso' });
  }
});

// Explicit Error Handler for all API routes - Guarantees JSON response, NEVER HTML
app.use('/api', (err: any, req: Request, res: Response, next: any) => {
  console.error('API Error handler:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error en el servidor de inteligencia artificial.',
  });
});

// Explicit 404 for API routes so unmatched endpoints never serve index.html
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Ruta API no encontrada: ${req.method} ${req.path}`,
  });
});

// Serve frontend with Vite in development or static in production
async function startServer() {
  const distDir = path.join(__dirname, 'dist');
  const hasDist = fs.existsSync(distDir);

  if (process.env.NODE_ENV === 'production' || (hasDist && process.env.NODE_ENV !== 'development')) {
    // Highly optimized static asset serving for production
    app.use(
      '/assets',
      express.static(path.join(distDir, 'assets'), {
        maxAge: '1y',
        immutable: true,
        etag: true,
      })
    );

    app.use(
      express.static(distDir, {
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
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`ManualCraft AI server running on http://0.0.0.0:${PORT}`);
  });

  // Tune keep-alive timeouts for GCP / AWS / Cloudflare reverse proxy resilience
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

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
