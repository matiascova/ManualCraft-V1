import { Client } from '../types/client';
import { Project } from '../types/project';
import { UserManual, getActionTypeSpanish } from '../types/manual';
import { OrganizationBranding } from '../types/branding';

/**
 * Genera el Índice Maestro Interactivo HTML autónomo para un Cliente Corporativo.
 * Consolida todos los proyectos del cliente, sus manuales operativos SAP,
 * matriz transaccional global y estadísticas ejecutivas en un único archivo HTML autocontenido.
 */
export function generateClientMasterIndexHtml(
  client: Client,
  projects: Project[],
  manuals: UserManual[],
  branding?: OrganizationBranding
): string {
  const brandColor = client.brandColor || '#005596';
  const orgName = branding?.companyName || 'HSBT';
  const orgLogo = branding?.logo || '';

  // Agrupar manuales por proyecto
  const manualsByProject = new Map<string, UserManual[]>();
  projects.forEach((p) => {
    manualsByProject.set(p.id, manuals.filter((m) => m.projectId === p.id));
  });

  const totalProjects = projects.length;
  const totalManuals = manuals.length;
  const totalSteps = manuals.reduce((sum, m) => sum + (m.steps?.length || 0), 0);
  const totalMinutes = manuals.reduce((sum, m) => sum + (m.estimatedMinutes || 3), 0);

  // Recolectar transacciones SAP únicas
  const sapTransactions = new Map<string, { code: string; module: string; count: number; manuals: string[] }>();
  manuals.forEach((m) => {
    (m.steps || []).forEach((s) => {
      if (s.sapTransaction) {
        const code = s.sapTransaction.toUpperCase().trim();
        const mod = s.sapModule || 'SAP';
        const cur = sapTransactions.get(code) || { code, module: mod, count: 0, manuals: [] };
        cur.count++;
        if (!cur.manuals.includes(m.title)) {
          cur.manuals.push(m.title);
        }
        sapTransactions.set(code, cur);
      }
    });
  });

  const transactionsList = Array.from(sapTransactions.values()).sort((a, b) => b.count - a.count);

  const serializedData = JSON.stringify({
    client,
    projects,
    manuals: manuals.map((m) => ({
      id: m.id,
      projectId: m.projectId,
      code: m.code,
      title: m.title,
      subtitle: m.subtitle,
      overview: m.overview,
      difficulty: m.difficulty,
      estimatedMinutes: m.estimatedMinutes,
      stepsCount: m.steps?.length || 0,
      steps: (m.steps || []).map((s) => ({
        stepNumber: s.stepNumber,
        title: s.title,
        actionType: getActionTypeSpanish(s.actionType),
        sapTransaction: s.sapTransaction,
        targetElement: s.targetElement,
        description: s.description,
        image: s.image,
      })),
    })),
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Índice Maestro de Manuales SAP · ${client.name}</title>
  <style>
    :root {
      --primary: ${brandColor};
      --primary-dark: #0f172a;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .header-banner {
      background: linear-gradient(135deg, ${brandColor} 0%, #0f172a 100%);
      color: white;
      padding: 3rem 1.5rem 2rem;
      border-bottom: 4px solid rgba(255,255,255,0.1);
    }
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
    }
    .client-identity {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .client-logo-box {
      width: 110px;
      height: 70px;
      background: white;
      border-radius: 12px;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }
    .client-logo-box img {
      max-width: 100%;
      max-height: 100%;
      object-contain: fit;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 9999px;
      background: rgba(255,255,255,0.15);
      color: white;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-top: -3.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
      border: 1px solid var(--border);
    }
    .stat-num {
      font-size: 2rem;
      font-weight: 800;
      color: var(--primary);
      line-height: 1;
    }
    .stat-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.35rem;
      font-weight: 600;
    }
    .search-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      background: white;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      border: 1px solid var(--border);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 1rem;
      color: var(--text);
    }
    .project-section {
      background: var(--card-bg);
      border-radius: 16px;
      border: 1px solid var(--border);
      margin-bottom: 2rem;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0,0,0,0.03);
    }
    .project-header {
      padding: 1.25rem 1.75rem;
      background: #f1f5f9;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .project-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .manual-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
      padding: 1.5rem;
    }
    .manual-card {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      background: white;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .manual-card:hover {
      border-color: var(--primary);
      box-shadow: 0 10px 20px rgba(0,0,0,0.06);
      transform: translateY(-2px);
    }
    .tx-pill {
      font-family: monospace;
      font-weight: 700;
      font-size: 0.75rem;
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 0.5rem;
    }
    .tx-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
      font-size: 0.85rem;
    }
    .tx-table th, .tx-table td {
      padding: 0.6rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    .tx-table th {
      background: #f8fafc;
      font-weight: 700;
      color: var(--text-muted);
    }
    /* Modal */
    .modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      z-index: 100;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-box {
      background: white;
      border-radius: 16px;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }
    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
    }
    .modal-body {
      padding: 1.5rem;
    }
    .step-item {
      display: flex;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border);
    }
    .step-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      font-weight: 800;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .step-img {
      max-width: 100%;
      border-radius: 8px;
      margin-top: 0.75rem;
      border: 1px solid var(--border);
    }
    .footer {
      border-top: 1px solid var(--border);
      padding: 2rem 1.5rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
      background: white;
      margin-top: 4rem;
    }
  </style>
</head>
<body>

  <!-- Header Banner -->
  <header class="header-banner">
    <div class="header-content">
      <div class="client-identity">
        ${
          client.logo
            ? `<div class="client-logo-box"><img src="${client.logo}" alt="${client.name}"></div>`
            : ''
        }
        <div>
          <span class="badge">Índice Maestro Corporativo SAP</span>
          <h1 style="font-size: 2rem; font-weight: 900; letter-spacing: -0.02em;">${client.name}</h1>
          <p style="opacity: 0.85; font-size: 0.95rem; margin-top: 0.25rem;">
            ${client.legalName || client.name} · ${client.sapMandante || 'Mandante SAP S/4HANA'}
          </p>
        </div>
      </div>
      <div style="text-align: right; opacity: 0.85; font-size: 0.85rem;">
        <div>Solución Integral de Manuales de Usuario</div>
        <div style="font-weight: 700;">Consultoría Emisora: ${orgName}</div>
        <div>Actualizado: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
    </div>
  </header>

  <main class="container">
    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-num">${totalProjects}</div>
        <div class="stat-label">Proyectos SAP Activos</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${totalManuals}</div>
        <div class="stat-label">Manuales Operativos</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${totalSteps}</div>
        <div class="stat-label">Pasos Operativos Detallados</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${transactionsList.length}</div>
        <div class="stat-label">Transacciones SAP Documentadas</div>
      </div>
    </div>

    <!-- Search / Filter -->
    <div class="search-bar">
      <input type="text" id="searchInput" class="search-input" placeholder="Buscar por código de transacción (ej. ZMMT0033, HUMO, CO11N), título o proyecto..." />
      <button onclick="window.print()" style="background:#f1f5f9; border:1px solid #cbd5e1; padding:0.5rem 1rem; border-radius:8px; font-weight:700; cursor:pointer;">
        🖨️ Imprimir / Guardar PDF
      </button>
    </div>

    <!-- Matriz Global de Transacciones SAP -->
    ${
      transactionsList.length > 0
        ? `
      <div class="project-section" style="margin-bottom: 2rem;">
        <div class="project-header" style="background: #eef2ff;">
          <h2 class="project-title" style="color: #3730a3; font-size: 1.1rem;">
            <span>⚡ Matriz Global de Transacciones SAP del Cliente (${transactionsList.length})</span>
          </h2>
        </div>
        <div style="padding: 1.25rem; overflow-x: auto;">
          <table class="tx-table">
            <thead>
              <tr>
                <th>Código Transacción</th>
                <th>Módulo SAP</th>
                <th>Acciones / Pasos</th>
                <th>Manuales Relacionados</th>
              </tr>
            </thead>
            <tbody>
              ${transactionsList
                .map(
                  (tx) => `
                <tr>
                  <td><span class="tx-pill" style="font-size: 0.85rem;">${tx.code}</span></td>
                  <td><strong>${tx.module}</strong></td>
                  <td>${tx.count} paso(s)</td>
                  <td style="color: #475569;">${tx.manuals.join(' · ')}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
        : ''
    }

    <!-- Proyectos y Manuales -->
    <div id="projectsContainer">
      ${projects
        .map((project) => {
          const projectManuals = manualsByProject.get(project.id) || [];
          return `
        <section class="project-section" data-project-id="${project.id}">
          <div class="project-header">
            <div>
              <div class="project-title">
                <span>📁 ${project.name}</span>
                <span class="badge" style="background:#0f172a; color:#fff; font-size:0.7rem;">${project.code || 'PRJ'}</span>
                <span class="badge" style="background:#e0e7ff; color:#3730a3; font-size:0.7rem;">${project.status}</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                ${project.description || 'Manuales de procedimiento operativo estándar para este proyecto.'}
              </p>
            </div>
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted);">
              ${projectManuals.length} Manual(es)
            </div>
          </div>

          <div class="manual-list">
            ${
              projectManuals.length > 0
                ? projectManuals
                    .map(
                      (manual) => `
                <div class="manual-card" onclick="openManualModal('${manual.id}')" data-manual-title="${encodeURIComponent(manual.title)}">
                  <div>
                    ${manual.code ? `<span class="tx-pill">${manual.code}</span>` : ''}
                    <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 0.4rem; color: var(--text);">
                      ${manual.title}
                    </h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      ${manual.subtitle || manual.overview}
                    </p>
                  </div>
                  <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">
                    <span>${manual.steps?.length || 0} pasos · ${manual.estimatedMinutes || 3} min</span>
                    <span style="color: var(--primary); font-weight: 700;">Ver Guía →</span>
                  </div>
                </div>
              `
                    )
                    .join('')
                : `
                <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                  No hay manuales asignados aún a este proyecto.
                </div>
              `
            }
          </div>
        </section>
      `;
        })
        .join('')}
    </div>
  </main>

  <!-- Modal de Detalle de Manual -->
  <div id="manualModal" class="modal-backdrop" onclick="closeManualModal(event)">
    <div class="modal-box" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div>
          <span id="modalCode" class="tx-pill"></span>
          <h2 id="modalTitle" style="font-size: 1.25rem; font-weight: 800;"></h2>
          <p id="modalSubtitle" style="font-size: 0.85rem; color: var(--text-muted);"></p>
        </div>
        <button onclick="closeModalDirect()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); padding: 0.25rem 0.5rem;">✕</button>
      </div>
      <div class="modal-body" id="modalStepsBody">
        <!-- Inyectado dinámicamente -->
      </div>
    </div>
  </div>

  <footer class="footer">
    <p><strong>${client.name}</strong> · Plataforma Oficial de Documentación de Procesos y Manuales de Usuario SAP</p>
    <p style="margin-top: 0.25rem;">Generado por ManualCraft AI · Emisor: ${orgName}</p>
  </footer>

  <script>
    const DATA = ${serializedData};

    function openManualModal(manualId) {
      const manual = DATA.manuals.find(m => m.id === manualId);
      if (!manual) return;

      document.getElementById('modalCode').innerText = manual.code || 'SOP';
      document.getElementById('modalTitle').innerText = manual.title;
      document.getElementById('modalSubtitle').innerText = manual.subtitle || manual.overview;

      const body = document.getElementById('modalStepsBody');
      body.innerHTML = '';

      if (manual.overview) {
        const ov = document.createElement('div');
        ov.style.padding = '0.75rem 1rem';
        ov.style.background = '#f8fafc';
        ov.style.borderRadius = '8px';
        ov.style.marginBottom = '1.5rem';
        ov.style.fontSize = '0.9rem';
        ov.style.color = '#334155';
        ov.innerHTML = '<strong>Resumen Operativo:</strong> ' + manual.overview;
        body.appendChild(ov);
      }

      manual.steps.forEach(step => {
        const item = document.createElement('div');
        item.className = 'step-item';
        item.innerHTML = \`
          <div class="step-badge">\${step.stepNumber}</div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
              <strong style="font-size:0.95rem; color:#0f172a;">\${step.title}</strong>
              <span class="tx-pill" style="font-size:0.7rem;">\${step.actionType}</span>
            </div>
            <p style="font-size:0.85rem; color:#475569; line-height:1.5;">\${step.description}</p>
            \${step.sapTransaction ? '<div style="margin-top:0.35rem; font-size:0.75rem; font-weight:700; color:#0284c7;">Transacción SAP: ' + step.sapTransaction + '</div>' : ''}
            \${step.image ? '<img src="' + step.image + '" class="step-img" alt="Captura paso ' + step.stepNumber + '" />' : ''}
          </div>
        \`;
        body.appendChild(item);
      });

      const modal = document.getElementById('manualModal');
      modal.style.display = 'flex';
    }

    function closeManualModal(event) {
      if (event.target.id === 'manualModal') {
        closeModalDirect();
      }
    }

    function closeModalDirect() {
      document.getElementById('manualModal').style.display = 'none';
    }

    // Filtrado en tiempo real
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const cards = document.querySelectorAll('.manual-card');
      cards.forEach(card => {
        const title = decodeURIComponent(card.getAttribute('data-manual-title') || '').toLowerCase();
        const text = card.innerText.toLowerCase();
        if (title.includes(q) || text.includes(q)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });

    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModalDirect();
    });
  </script>
</body>
</html>`;
}
