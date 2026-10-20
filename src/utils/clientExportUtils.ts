import JSZip from 'jszip';
import { Client } from '../types/client';
import { Project } from '../types/project';
import { UserManual, getActionTypeSpanish } from '../types/manual';
import { OrganizationBranding } from '../types/branding';
import { generateClientMasterIndexHtml } from './masterIndexGenerator';

/**
 * Escapes characters for HTML embedding
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Downloads a Blob directly to the user's browser
 */
function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a text or HTML file
 */
export function downloadHtmlFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8;' });
  downloadBlob(filename, blob);
}

/**
 * Genera el HTML interactivo autónomo de un manual individual con soporte de navegación
 * hacia el portal maestro del cliente.
 */
export function generateIndividualManualInteractiveHtml(
  manual: UserManual,
  project?: Project,
  clientName?: string,
  backToPortalLink?: string
): string {
  const manualJson = JSON.stringify(manual);
  const title = manual.title || 'Manual de Usuario SAP';
  const subtitle = manual.subtitle || '';
  const clientLabel = clientName || project?.clientName || 'Cliente Corporativo';
  const projectName = project?.name || 'Proyecto SAP';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | ${escapeHtml(clientLabel)}</title>
  <meta name="description" content="${escapeHtml(subtitle || manual.overview || '')}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #005596;
      --primary-hover: #004075;
      --secondary: #183B6C;
      --bg-main: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
      --accent-green: #10b981;
      --accent-amber: #f59e0b;
      --accent-red: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: var(--bg-main);
      color: var(--text-main);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    header {
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(8px);
      background-color: rgba(255, 255, 255, 0.95);
    }
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.85rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .nav-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.85rem;
      background: #f1f5f9;
      color: #334155;
      text-decoration: none;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-weight: 700;
      transition: all 0.2s;
      border: 1px solid var(--border-color);
    }
    .back-btn:hover {
      background: #e2e8f0;
      color: var(--primary);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 800;
      font-size: 1rem;
      color: var(--secondary);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      background: #e0f2fe;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .header-controls {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.5rem 0.9rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
    }
    .btn-primary { background: var(--primary); color: #ffffff; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-outline { background: #ffffff; border-color: var(--border-color); color: var(--text-main); }
    .btn-outline:hover { background: #f1f5f9; }
    .container {
      max-width: 1100px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }
    .hero {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      padding: 2.25rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      border-top: 4px solid var(--primary);
    }
    .hero-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }
    .hero h1 {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      line-height: 1.25;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }
    .hero p.subtitle {
      font-size: 1.05rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
    }
    .hero p.overview {
      font-size: 0.95rem;
      color: #334155;
      background: #f8fafc;
      padding: 1rem 1.25rem;
      border-radius: 0.75rem;
      border-left: 4px solid var(--primary);
      margin-bottom: 1rem;
    }
    .prereqs-box {
      margin-top: 1.25rem;
      padding: 1rem 1.25rem;
      background: #f1f5f9;
      border-radius: 0.75rem;
    }
    .prereqs-title {
      font-weight: 700;
      font-size: 0.85rem;
      color: #1e293b;
      margin-bottom: 0.4rem;
    }
    .prereqs-list { list-style: none; display: flex; flex-direction: column; gap: 0.35rem; }
    .prereqs-list li { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: #475569; }
    
    /* Steps */
    .steps-container { display: flex; flex-direction: column; gap: 1.75rem; margin-bottom: 3rem; }
    .step-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: all 0.2s;
    }
    .step-card:hover { border-color: #cbd5e1; box-shadow: 0 8px 16px -4px rgba(0,0,0,0.06); }
    .step-header {
      padding: 1.25rem 1.75rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      background: #fafafa;
    }
    .step-title-area { display: flex; align-items: center; gap: 0.85rem; }
    .step-num-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: var(--primary);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.9rem;
      flex-shrink: 0;
    }
    .step-header h3 { font-size: 1.15rem; font-weight: 700; color: #0f172a; }
    .step-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .tag {
      padding: 0.2rem 0.55rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .tag-click { background: #e0e7ff; color: #4338ca; }
    .tag-input { background: #fef3c7; color: #b45309; }
    .tag-sap { background: #dbeafe; color: #1e40af; font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; }
    .step-body { padding: 1.5rem 1.75rem; }
    .step-desc { font-size: 0.95rem; color: #334155; margin-bottom: 1.25rem; line-height: 1.6; }
    .step-img-container {
      position: relative;
      background: #0f172a;
      border-radius: 0.75rem;
      overflow: hidden;
      margin-bottom: 1.25rem;
      border: 1px solid var(--border-color);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .step-img-container img { max-width: 100%; height: auto; display: block; object-fit: contain; }
    .step-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      background: #f8fafc;
      padding: 1rem 1.25rem;
      border-radius: 0.75rem;
      border: 1px solid #f1f5f9;
      font-size: 0.85rem;
    }
    .meta-item strong { display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.2rem; }
    
    /* Interactive Player Modal */
    #interactive-player {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(8px);
      z-index: 100;
      padding: 1.5rem;
      overflow-y: auto;
    }
    .player-dialog {
      max-width: 1100px;
      margin: 1.5rem auto;
      background: #ffffff;
      border-radius: 1.25rem;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .player-header {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .player-title { font-weight: 800; font-size: 1.05rem; }
    .player-content { padding: 1.5rem; }
    .player-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <div class="nav-left">
        ${
          backToPortalLink
            ? `<a href="${backToPortalLink}" class="back-btn">
                ← Volver al Portal de ${escapeHtml(clientLabel)}
              </a>`
            : ''
        }
        <div class="brand">
          <span>ManualCraft AI</span>
          <span class="badge">${escapeHtml(clientLabel)}</span>
        </div>
      </div>
      <div class="header-controls">
        <button class="btn btn-primary" onclick="openInteractivePlayer(0)">
          ▶ Iniciar Simulador Interactivo
        </button>
        <button class="btn btn-outline" onclick="window.print()">
          🖨 Imprimir
        </button>
      </div>
    </div>
  </header>

  <main class="container">
    <div class="hero">
      <div class="hero-meta">
        <span>🏢 <strong>Cliente:</strong> ${escapeHtml(clientLabel)}</span>
        <span>·</span>
        <span>📁 <strong>Proyecto:</strong> ${escapeHtml(projectName)}</span>
        <span>·</span>
        <span>⏱ <strong>Tiempo estimado:</strong> ${manual.estimatedMinutes || 5} min</span>
        <span>·</span>
        <span>🎯 <strong>Dificultad:</strong> ${escapeHtml(manual.difficulty || 'Principiante')}</span>
      </div>
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
      ${manual.overview ? `<p class="overview">${escapeHtml(manual.overview)}</p>` : ''}

      ${
        manual.prerequisites && manual.prerequisites.length > 0
          ? `<div class="prereqs-box">
              <div class="prereqs-title">⚡ Requisitos Previos</div>
              <ul class="prereqs-list">
                ${manual.prerequisites.map((p) => `<li>✓ ${escapeHtml(p)}</li>`).join('')}
              </ul>
            </div>`
          : ''
      }
    </div>

    <div class="steps-container">
      ${(manual.steps || [])
        .map(
          (step, index) => `
        <article class="step-card" id="step-${index}">
          <div class="step-header">
            <div class="step-title-area">
              <span class="step-num-pill">${index + 1}</span>
              <div>
                <h3>${escapeHtml(step.title)}</h3>
                ${step.targetElement ? `<p style="font-size:0.8rem;color:#64748b;margin-top:2px;">Elemento: <strong>${escapeHtml(step.targetElement)}</strong></p>` : ''}
              </div>
            </div>
            <div class="step-tags">
              <span class="tag tag-${step.actionType || 'click'}">${escapeHtml(getActionTypeSpanish(step.actionType))}</span>
              ${step.sapTransaction ? `<span class="tag tag-sap">Tx: ${escapeHtml(step.sapTransaction)}</span>` : ''}
            </div>
          </div>
          <div class="step-body">
            <p class="step-desc">${escapeHtml(step.description)}</p>
            ${
              step.image
                ? `<div class="step-img-container">
                    <img src="${step.image}" alt="Paso ${index + 1}">
                  </div>`
                : ''
            }
            <div class="step-meta-grid">
              ${step.expectedResult ? `<div class="meta-item"><strong>Resultado Esperado:</strong><span>${escapeHtml(step.expectedResult)}</span></div>` : ''}
              ${step.tip ? `<div class="meta-item"><strong>💡 Consejo Pro:</strong><span style="color:#0369a1;">${escapeHtml(step.tip)}</span></div>` : ''}
              ${step.warning ? `<div class="meta-item"><strong>⚠️ Precaución:</strong><span style="color:#b45309;">${escapeHtml(step.warning)}</span></div>` : ''}
            </div>
          </div>
        </article>
      `
        )
        .join('')}
    </div>
  </main>

  <!-- Interactive Player Modal -->
  <div id="interactive-player">
    <div class="player-dialog">
      <div class="player-header">
        <div class="player-title" id="player-title">Simulador Paso a Paso</div>
        <button class="btn btn-outline" onclick="closeInteractivePlayer()" style="padding:0.3rem 0.6rem;">✕ Cerrar</button>
      </div>
      <div class="player-content">
        <div id="player-instruction" style="font-size:1.05rem;font-weight:600;margin-bottom:1rem;color:#0f172a;"></div>
        <div id="player-image-wrap" style="position:relative;background:#0f172a;border-radius:0.75rem;overflow:hidden;min-height:300px;display:flex;align-items:center;justify-content:center;">
          <img id="player-img" src="" alt="" style="max-width:100%;max-height:65vh;object-fit:contain;">
        </div>
      </div>
      <div class="player-footer">
        <button class="btn btn-outline" id="player-prev-btn" onclick="prevStep()">← Paso Anterior</button>
        <span id="player-step-counter" style="font-weight:700;font-size:0.85rem;color:#64748b;"></span>
        <button class="btn btn-primary" id="player-next-btn" onclick="nextStep()">Siguiente Paso →</button>
      </div>
    </div>
  </div>

  <script>
    const manualData = ${manualJson};
    let currentStepIndex = 0;

    function openInteractivePlayer(stepIdx = 0) {
      currentStepIndex = stepIdx;
      document.getElementById('interactive-player').style.display = 'block';
      document.body.style.overflow = 'hidden';
      renderPlayerStep();
    }

    function closeInteractivePlayer() {
      document.getElementById('interactive-player').style.display = 'none';
      document.body.style.overflow = 'auto';
    }

    function renderPlayerStep() {
      const step = manualData.steps[currentStepIndex];
      if (!step) return;
      document.getElementById('player-title').innerText = manualData.title + ' · ' + (step.title || ('Paso ' + (currentStepIndex + 1)));
      document.getElementById('player-instruction').innerText = (currentStepIndex + 1) + '. ' + step.description;
      const img = document.getElementById('player-img');
      if (step.image) {
        img.src = step.image;
        img.style.display = 'block';
      } else {
        img.style.display = 'none';
      }
      document.getElementById('player-step-counter').innerText = 'Paso ' + (currentStepIndex + 1) + ' de ' + manualData.steps.length;
      document.getElementById('player-prev-btn').disabled = currentStepIndex === 0;
      document.getElementById('player-next-btn').innerText = currentStepIndex === manualData.steps.length - 1 ? 'Finalizar Tutorial ✓' : 'Siguiente Paso →';
    }

    function prevStep() {
      if (currentStepIndex > 0) {
        currentStepIndex--;
        renderPlayerStep();
      }
    }

    function nextStep() {
      if (currentStepIndex < manualData.steps.length - 1) {
        currentStepIndex++;
        renderPlayerStep();
      } else {
        closeInteractivePlayer();
      }
    }

    window.addEventListener('keydown', (e) => {
      const player = document.getElementById('interactive-player');
      if (player && player.style.display === 'block') {
        if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
        if (e.key === 'ArrowLeft') prevStep();
        if (e.key === 'Escape') closeInteractivePlayer();
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Descarga el Portal Maestro Interactivo HTML autónomo para un cliente.
 */
export function exportClientMasterPortalHtml(
  client: Client,
  projects: Project[],
  manuals: UserManual[],
  branding?: OrganizationBranding
): void {
  const clientProjects =
    client.id === 'all' ? projects : projects.filter((p) => p.clientId === client.id);
  const clientManuals = manuals.filter((m) => clientProjects.some((p) => p.id === m.projectId));

  const htmlContent = generateClientMasterIndexHtml(client, clientProjects, clientManuals, branding);
  const safeClientName = client.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadHtmlFile(`Portal_Maestro_Manuales_${safeClientName}_SAP.html`, htmlContent);
}

/**
 * Exporta TODOS los manuales interactivos del cliente en formato HTML empaquetados en un archivo ZIP.
 * Contiene:
 * - index.html (Portal Maestro Interactivo)
 * - manuales/ (Cada manual individual como HTML autónomo e interactivo con enlace de retorno)
 * - LEEME_PUBLICACION.txt (Instrucciones para Intranet / SharePoint o uso Offline)
 */
export async function exportClientAllManualsHtmlZip(
  client: Client,
  projects: Project[],
  manuals: UserManual[],
  branding?: OrganizationBranding,
  onProgress?: (message: string) => void
): Promise<void> {
  const clientProjects =
    client.id === 'all' ? projects : projects.filter((p) => p.clientId === client.id);
  const clientManuals = manuals.filter((m) => clientProjects.some((p) => p.id === m.projectId));

  if (clientManuals.length === 0) {
    throw new Error(`El cliente "${client.name}" no tiene manuales creados para exportar.`);
  }

  onProgress?.('Iniciando empaquetador ZIP para exportación por cliente...');

  const zip = new JSZip();

  // 1. Generar Portal Maestro index.html
  onProgress?.(`Generando Portal Maestro HTML para ${client.name}...`);
  const masterIndexHtml = generateClientMasterIndexHtml(
    client,
    clientProjects,
    clientManuals,
    branding
  );
  zip.file('index.html', masterIndexHtml);

  // 2. Carpeta de manuales interactivos individuales
  const manualesFolder = zip.folder('manuales');

  clientManuals.forEach((m, idx) => {
    onProgress?.(`Compilando manual interactivo [${idx + 1}/${clientManuals.length}]: ${m.title}...`);
    const project = clientProjects.find((p) => p.id === m.projectId);
    const safeTitle = (m.code || m.title || `manual_${idx + 1}`)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const filename = `${String(idx + 1).padStart(2, '0')}_${safeTitle}.html`;

    const individualHtml = generateIndividualManualInteractiveHtml(
      m,
      project,
      client.name,
      '../index.html'
    );

    manualesFolder?.file(filename, individualHtml);
  });

  // 3. Documento de instrucciones institucionales
  const readmeContent = `======================================================================
PORTAL DE MANUALES INTERACTIVOS SAP · CLIENTE: ${client.name.toUpperCase()}
Empresa Emisora: ${branding?.companyName || 'HSBT'}
Generado por: ManualCraft AI
Fecha de Generación: ${new Date().toLocaleString('es-ES')}
Total Proyectos: ${clientProjects.length}
Total Manuales: ${clientManuals.length}
======================================================================

ESTRUCTURA DEL PAQUETE EXPORTADO:
1. index.html
   - Portal Maestro Interactivo de ${client.name}.
   - Abre este archivo con doble clic en cualquier navegador web moderno (Google Chrome, Microsoft Edge, Firefox, Safari).
   - Incluye motor de búsqueda en tiempo real, matriz unificada de transacciones SAP (#/Tx/Módulo), estadísticas y accesos directos interactivos.

2. manuales/
   - Contiene los ${clientManuals.length} manuales interactivos independientes en formato HTML.
   - Cada manual cuenta con capturas de pantalla de alta resolución, franjas de acción por transacción, simulador paso a paso y enlace de retorno al portal maestro (index.html).

MODO DE PUBLICACIÓN Y DISTRIBUCIÓN:
- 100% Autónomo y Offline: No requiere servidor web, Node.js ni conexión a internet. Puede abrirse directamente desde una memoria USB o disco local.
- SharePoint / Microsoft Teams: Puedes subir la carpeta completa a una biblioteca de documentos de SharePoint o Teams y fijar "index.html" como página inicial.
- Intranet Corporativa / Servidor IIS / Apache / Nginx: Copia el contenido de este archivo ZIP en la raíz de tu sitio o intranet para habilitar el portal para todos los usuarios clave de ${client.name}.

© ${new Date().getFullYear()} ${branding?.companyName || 'HSBT'} & ${client.name}. Todos los derechos reservados.
`;

  zip.file('LEEME_INSTRUCCIONES.txt', readmeContent);

  // 4. Compilar archivo ZIP
  onProgress?.('Comprimiendo paquete ZIP institucional...');
  const blob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.(`Comprimiendo archivos: ${Math.round(metadata.percent)}% completado`);
    }
  );

  onProgress?.('¡Archivo ZIP listo! Iniciando descarga...');
  const safeClientName = client.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadBlob(`${safeClientName}_Manuales_Interactivos_HTML.zip`, blob);
}
