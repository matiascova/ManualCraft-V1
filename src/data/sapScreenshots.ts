/**
 * High-fidelity SVG generators for SAP S/4HANA GUI Comex distribution workflow
 * Accurately represents the SAP Easy Access and ZMMT0033 transaction screens.
 */

function createSapBaseWindow(contentSvg: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 600" width="1024" height="600">
    <defs>
      <linearGradient id="sapTitleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#2d3748"/>
        <stop offset="100%" stop-color="#1a202c"/>
      </linearGradient>
      <linearGradient id="sapToolbarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#e2e8f0"/>
      </linearGradient>
      <linearGradient id="sapHeaderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f1f5f9"/>
        <stop offset="100%" stop-color="#cbd5e1"/>
      </linearGradient>
    </defs>
    <!-- Window Frame -->
    <rect width="1024" height="600" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1"/>
    
    <!-- SAP GUI Main Titlebar -->
    <rect width="1024" height="26" fill="url(#sapTitleGrad)"/>
    <text x="12" y="17" fill="#ffffff" font-family="'Segoe UI', Tahoma, sans-serif" font-size="12" font-weight="600">SAP GUI for Windows 770 / S/4HANA</text>
    <rect x="944" y="5" width="16" height="16" rx="2" fill="#475569"/>
    <text x="948" y="17" fill="#ffffff" font-family="sans-serif" font-size="10">_</text>
    <rect x="968" y="5" width="16" height="16" rx="2" fill="#475569"/>
    <rect x="971" y="8" width="10" height="10" fill="none" stroke="#ffffff" stroke-width="1.2"/>
    <rect x="992" y="5" width="20" height="16" rx="2" fill="#ef4444"/>
    <text x="998" y="17" fill="#ffffff" font-family="sans-serif" font-size="11">✕</text>

    <!-- Menu Bar -->
    <rect y="26" width="1024" height="24" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
    <text x="16" y="42" fill="#1e293b" font-family="'Segoe UI', Tahoma, sans-serif" font-size="12">Menú</text>
    <text x="64" y="42" fill="#1e293b" font-family="'Segoe UI', Tahoma, sans-serif" font-size="12">Tratar</text>
    <text x="114" y="42" fill="#1e293b" font-family="'Segoe UI', Tahoma, sans-serif" font-size="12">Favoritos</text>
    <text x="180" y="42" fill="#1e293b" font-family="'Segoe UI', Tahoma, sans-serif" font-size="12">Detalles</text>
    <text x="240" y="42" fill="#1e293b" font-family="'Segoe UI', Tahoma, sans-serif" font-size="12">Sistema</text>
    <text x="300" y="42" fill="#1e293b" font-family="'Segoe UI', Tahoma, sans-serif" font-size="12">Ayuda</text>

    ${contentSvg}

    <!-- Bottom Status Bar -->
    <rect y="574" width="1024" height="26" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1"/>
    <circle cx="16" cy="587" r="5" fill="#10b981"/>
    <text x="28" y="591" fill="#334155" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11">Sistema listo · S4H Mandante 100</text>
    <rect x="760" y="578" width="80" height="18" fill="#ffffff" stroke="#cbd5e1" rx="2"/>
    <text x="768" y="591" fill="#475569" font-family="'JetBrains Mono', monospace" font-size="10">ZMMT0033</text>
    <rect x="850" y="578" width="60" height="18" fill="#ffffff" stroke="#cbd5e1" rx="2"/>
    <text x="856" y="591" fill="#475569" font-family="'JetBrains Mono', monospace" font-size="10">INS</text>
    <rect x="920" y="578" width="90" height="18" fill="#ffffff" stroke="#cbd5e1" rx="2"/>
    <text x="926" y="591" fill="#475569" font-family="'Segoe UI', Tahoma, sans-serif" font-size="10">s4hprd01</text>
  </svg>`;
}

export function getSapStep1Screenshot(): string {
  const content = `
    <!-- Standard Toolbar with Command bar -->
    <rect y="50" width="1024" height="34" fill="url(#sapToolbarGrad)" stroke="#cbd5e1" stroke-width="1"/>
    
    <!-- Enter / Check circle -->
    <circle cx="24" cy="67" r="10" fill="#10b981" stroke="#059669" stroke-width="1"/>
    <path d="M19 67 l3 4 l7 -8" stroke="#ffffff" stroke-width="2" fill="none"/>
    
    <!-- Command Input Box -->
    <rect x="42" y="56" width="150" height="22" rx="2" fill="#ffffff" stroke="#3b82f6" stroke-width="2"/>
    <text x="48" y="72" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700">ZMMT0033</text>

    <!-- Toolbar Icons -->
    <g transform="translate(205, 57)">
      <rect x="0" y="0" width="20" height="20" rx="2" fill="#f8fafc" stroke="#cbd5e1"/>
      <path d="M4 4 h12 v12 h-12 z M6 4 v5 h8 v-5" fill="#3b82f6"/>
      <rect x="28" y="0" width="20" height="20" rx="2" fill="#f8fafc" stroke="#cbd5e1"/>
      <path d="M40 10 l-6 -6 v4 h-4 v4 h4 v4 z" fill="#10b981"/>
      <rect x="56" y="0" width="20" height="20" rx="2" fill="#f8fafc" stroke="#cbd5e1"/>
      <circle cx="66" cy="10" r="7" fill="#f59e0b"/>
      <rect x="84" y="0" width="20" height="20" rx="2" fill="#f8fafc" stroke="#cbd5e1"/>
      <circle cx="94" cy="10" r="7" fill="#ef4444"/>
      <text x="91" y="14" fill="#fff" font-size="11" font-weight="700">✕</text>
      <rect x="112" y="0" width="20" height="20" rx="2" fill="#f8fafc" stroke="#cbd5e1"/>
      <path d="M116 8 h12 v8 h-12 z M119 5 h6 v3 h-6 z" fill="#475569"/>
    </g>

    <!-- Application Area: Split into Left Menu Tree and Right S4HANA Welcome Screen -->
    <g transform="translate(0, 84)">
      <!-- Left Tree Panel -->
      <rect width="320" height="490" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
      <text x="16" y="24" fill="#0f172a" font-family="'Segoe UI', Tahoma, sans-serif" font-size="12" font-weight="700">SAP Easy Access</text>
      
      <!-- Tree Items -->
      <text x="24" y="52" fill="#475569" font-family="'Segoe UI', sans-serif" font-size="11">▾ 📁 Menú SAP</text>
      <text x="44" y="74" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">▸ Conector para Multi-Bank Connectivity</text>
      <text x="44" y="96" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">▸ Oficina</text>
      <text x="44" y="118" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">▸ Componentes multiaplicaciones</text>
      <text x="44" y="140" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">▸ Logística</text>
      <text x="44" y="162" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">▸ Finanzas</text>
      <text x="44" y="184" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">▸ Recursos Humanos</text>
      <text x="44" y="206" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">▸ Sistemas info</text>
      <text x="44" y="228" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">▸ Herramientas</text>
      <text x="44" y="250" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">▸ WebClient-UI-Framework</text>

      <text x="24" y="280" fill="#475569" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600">▾ ★ Favoritos</text>
      <rect x="36" y="292" width="270" height="24" rx="4" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
      <text x="44" y="308" fill="#1d4ed8" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600">★ ZMMT0033 - Generador dist. facturas Comex</text>
      <text x="44" y="332" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">★ ME23N - Visualizar Pedido Compra</text>
      <text x="44" y="354" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">★ MIRO - Entrada Factura Logística</text>

      <!-- Right Wallpaper Panel (Volcan / Horizonte Branding) -->
      <g transform="translate(320, 0)">
        <rect width="704" height="490" fill="#0f172a"/>
        <circle cx="352" cy="220" r="140" fill="none" stroke="#1e293b" stroke-width="3"/>
        <circle cx="352" cy="220" r="100" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="8 4"/>
        
        <!-- Center Gear Icon -->
        <g transform="translate(320, 190) scale(1.4)">
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="#38bdf8"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="#0284c7"/>
        </g>

        <!-- Project Title -->
        <text x="352" y="320" fill="#38bdf8" font-family="'Segoe UI', Tahoma, sans-serif" font-size="28" font-weight="800" text-anchor="middle">Proyecto Horizonte</text>
        <rect x="282" y="335" width="140" height="28" rx="14" fill="#0369a1"/>
        <text x="352" y="354" fill="#ffffff" font-family="'Segoe UI', Tahoma, sans-serif" font-size="13" font-weight="700" text-anchor="middle">SAP S/4HANA</text>

        <!-- Corporate Logo Volcan -->
        <g transform="translate(560, 400)">
          <polygon points="10,0 20,20 0,20" fill="#dc2626"/>
          <polygon points="30,0 40,20 20,20" fill="#2563eb"/>
          <text x="50" y="18" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-size="18" font-weight="900" letter-spacing="1">VOLCAN</text>
        </g>
      </g>
    </g>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(createSapBaseWindow(content))}`;
}

export function getSapStep2Screenshot(): string {
  const content = `
    <!-- Standard Toolbar with Program Title -->
    <rect y="50" width="1024" height="34" fill="url(#sapToolbarGrad)" stroke="#cbd5e1" stroke-width="1"/>
    
    <!-- Execute / Accept Button -->
    <rect x="12" y="55" width="80" height="24" rx="3" fill="#10b981" stroke="#059669"/>
    <text x="22" y="71" fill="#ffffff" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11" font-weight="700">✓ Aceptar</text>

    <text x="110" y="72" fill="#0f172a" font-family="'Segoe UI', Tahoma, sans-serif" font-size="13" font-weight="700">Generador distribución facturas Comex en OC</text>

    <!-- Filter Criteria Box -->
    <g transform="translate(16, 96)">
      <rect width="992" height="110" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" rx="4"/>
      <rect width="992" height="24" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="4"/>
      <text x="12" y="16" fill="#475569" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Criterios de Búsqueda y Filtro de Operación Comex</text>

      <!-- Sociedad Field -->
      <text x="24" y="52" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="600">Sociedad:</text>
      <rect x="100" y="38" width="120" height="24" rx="2" fill="#ffffff" stroke="#ef4444" stroke-width="2"/>
      <text x="108" y="54" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700">VOLC</text>

      <!-- Proveedor Field -->
      <text x="24" y="86" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="12">Proveedor:</text>
      <rect x="100" y="72" width="160" height="22" rx="2" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>

      <!-- Solicitud Field -->
      <text x="320" y="52" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="12">Solicitud Despacho:</text>
      <rect x="440" y="38" width="140" height="22" rx="2" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>

      <!-- Factura Field -->
      <text x="320" y="86" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="12">Nº Factura Comex:</text>
      <rect x="440" y="72" width="140" height="22" rx="2" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
    </g>

    <!-- Empty Table Placeholders waiting for query -->
    <g transform="translate(16, 218)">
      <!-- Upper Grid -->
      <rect width="992" height="160" fill="#ffffff" stroke="#cbd5e1" rx="4"/>
      <rect width="992" height="26" fill="url(#sapHeaderGrad)"/>
      <text x="12" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Solicitud DI</text>
      <text x="100" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Doc.compras</text>
      <text x="190" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Posición</text>
      <text x="250" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Proveedor</text>
      <text x="340" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Número Despacho</text>
      <text x="460" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Nº Factura</text>
      <text x="560" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Clase condic.</text>
      <text x="660" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Importe SAP Moneda</text>
      <text x="810" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Importe Factura API</text>

      <text x="496" y="90" fill="#94a3b8" font-family="'Segoe UI', sans-serif" font-size="13" text-anchor="middle">Ingrese los filtros de búsqueda y presione Aceptar</text>
    </g>

    <g transform="translate(16, 390)">
      <!-- Lower Grid -->
      <rect width="992" height="170" fill="#ffffff" stroke="#cbd5e1" rx="4"/>
      <rect width="992" height="26" fill="url(#sapHeaderGrad)"/>
      <text x="12" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Solicitud DI</text>
      <text x="100" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Pos. DI</text>
      <text x="160" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Doc.compras</text>
      <text x="250" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Posición</text>
      <text x="310" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Proveedor</text>
      <text x="400" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Condición doc.</text>
      <text x="500" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Clase condic.</text>
      <text x="600" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Regla cálculo</text>
      <text x="710" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Importe SAP Moneda</text>
    </g>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(createSapBaseWindow(content))}`;
}

export function getSapStep3Screenshot(): string {
  const content = `
    <!-- Standard Toolbar with Program Title -->
    <rect y="50" width="1024" height="34" fill="url(#sapToolbarGrad)" stroke="#cbd5e1" stroke-width="1"/>
    
    <!-- Execute / Accept Button with click aura -->
    <rect x="12" y="55" width="80" height="24" rx="3" fill="#10b981" stroke="#059669"/>
    <text x="22" y="71" fill="#ffffff" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11" font-weight="700">✓ Aceptar</text>

    <text x="110" y="72" fill="#0f172a" font-family="'Segoe UI', Tahoma, sans-serif" font-size="13" font-weight="700">Generador distribución facturas Comex en OC</text>

    <!-- Filter Criteria Box with Solicitud highlighted -->
    <g transform="translate(16, 96)">
      <rect width="992" height="110" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" rx="4"/>
      <rect width="992" height="24" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1" rx="4"/>
      <text x="12" y="16" fill="#475569" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Criterios de Búsqueda y Filtro de Operación Comex</text>

      <!-- Sociedad Field -->
      <text x="24" y="52" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="12">Sociedad:</text>
      <rect x="100" y="38" width="120" height="24" rx="2" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
      <text x="108" y="54" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="13">VOLC</text>

      <!-- Solicitud Field Highlighted -->
      <text x="320" y="52" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700">Solicitud Despacho:</text>
      <rect x="440" y="38" width="150" height="24" rx="2" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
      <text x="448" y="54" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700">100007</text>
      <!-- Multiple selection button -->
      <rect x="594" y="38" width="24" height="24" rx="2" fill="#e2e8f0" stroke="#94a3b8"/>
      <path d="M599 44 h14 M599 50 h14 M599 56 h14" stroke="#475569" stroke-width="1.5"/>
    </g>

    <!-- Query Loading state indicator -->
    <g transform="translate(16, 218)">
      <rect width="992" height="160" fill="#ffffff" stroke="#cbd5e1" rx="4"/>
      <rect width="992" height="26" fill="url(#sapHeaderGrad)"/>
      <text x="12" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Solicitud DI</text>
      <text x="100" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Doc.compras</text>
      <text x="190" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Posición</text>
      <text x="250" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Proveedor</text>
      <text x="340" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Número Despacho</text>
      <text x="460" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Nº Factura</text>
      <text x="560" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Clase condic.</text>
      <text x="660" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Importe SAP Moneda</text>
      <text x="810" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Importe Factura API</text>

      <circle cx="496" cy="90" r="14" fill="none" stroke="#2563eb" stroke-width="3" stroke-dasharray="30 10"/>
      <text x="496" y="120" fill="#2563eb" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="600" text-anchor="middle">Ejecutando consulta de solicitud 100007...</text>
    </g>

    <g transform="translate(16, 390)">
      <rect width="992" height="170" fill="#ffffff" stroke="#cbd5e1" rx="4"/>
      <rect width="992" height="26" fill="url(#sapHeaderGrad)"/>
      <text x="12" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Solicitud DI</text>
      <text x="100" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Pos. DI</text>
      <text x="160" y="17" fill="#1e293b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Doc.compras</text>
    </g>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(createSapBaseWindow(content))}`;
}

export function getSapStep4Screenshot(): string {
  const content = `
    <!-- Standard Toolbar with Action Buttons -->
    <rect y="50" width="1024" height="34" fill="url(#sapToolbarGrad)" stroke="#cbd5e1" stroke-width="1"/>
    
    <!-- Grabar Datos button in toolbar -->
    <rect x="12" y="55" width="100" height="24" rx="3" fill="#f1f5f9" stroke="#94a3b8"/>
    <text x="24" y="71" fill="#1e293b" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11" font-weight="600">💾 Grabar Datos</text>

    <text x="125" y="72" fill="#0f172a" font-family="'Segoe UI', Tahoma, sans-serif" font-size="13" font-weight="700">Generador distribución facturas Comex en OC</text>

    <!-- Compact Filter Bar -->
    <g transform="translate(16, 90)">
      <rect width="992" height="42" fill="#ffffff" stroke="#cbd5e1" rx="3"/>
      <text x="16" y="26" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">Sociedad: <tspan fill="#0f172a" font-weight="700">VOLC</tspan></text>
      <text x="160" y="26" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">Solicitud: <tspan fill="#0f172a" font-weight="700">100007</tspan></text>
      <text x="320" y="26" fill="#10b981" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">✓ 4 Registros de Factura recuperados</text>
    </g>

    <!-- Upper ALV Grid with Rows and Yellow Summary -->
    <g transform="translate(16, 138)">
      <rect width="992" height="230" fill="#ffffff" stroke="#cbd5e1" rx="3"/>
      <rect width="992" height="24" fill="url(#sapHeaderGrad)"/>
      <text x="12" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Solicitud DI</text>
      <text x="90" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Doc.compras</text>
      <text x="165" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Pos.</text>
      <text x="205" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Proveedor</text>
      <text x="285" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Nº Despacho</text>
      <text x="375" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Nº Factura</text>
      <text x="450" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Clase</text>
      <text x="500" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Importe SAP Moneda</text>
      <text x="640" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Importe Factura API</text>
      <text x="780" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Ctd. Solicitada</text>

      <!-- Row 1 -->
      <rect y="24" width="992" height="24" fill="#ffffff"/>
      <line x1="0" y1="48" x2="992" y2="48" stroke="#e2e8f0"/>
      <text x="12" y="40" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">100007</text>
      <text x="90" y="40" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">4609931</text>
      <text x="165" y="40" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">100</text>
      <text x="205" y="40" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">5091902</text>
      <text x="285" y="40" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">1222367</text>
      <text x="375" y="40" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">228188</text>
      <text x="450" y="40" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">&amp;ICL</text>
      <text x="500" y="40" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600">245,00 USD</text>
      <text x="640" y="40" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="11">198.334 CLP</text>
      <text x="780" y="40" fill="#64748b" font-family="'JetBrains Mono', monospace" font-size="11">20.708 M2</text>

      <!-- Row 2 -->
      <rect y="48" width="992" height="24" fill="#f8fafc"/>
      <line x1="0" y1="72" x2="992" y2="72" stroke="#e2e8f0"/>
      <text x="12" y="64" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">100007</text>
      <text x="90" y="64" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">4609931</text>
      <text x="165" y="64" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">110</text>
      <text x="205" y="64" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">5091903</text>
      <text x="285" y="64" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">1222367</text>
      <text x="375" y="64" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">228188</text>
      <text x="450" y="64" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11"></text>
      <text x="500" y="64" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600">245,00 USD</text>
      <text x="640" y="64" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="11">211.588 CLP</text>
      <text x="780" y="64" fill="#64748b" font-family="'JetBrains Mono', monospace" font-size="11">20.350 M2</text>

      <!-- Yellow Subtotal 1 -->
      <rect y="72" width="992" height="22" fill="#fef08a" stroke="#fde047" stroke-width="1"/>
      <text x="285" y="87" fill="#854d0e" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="700">SUBTOTAL FACTURA 228188</text>
      <text x="500" y="87" fill="#713f12" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">490,00 USD</text>
      <text x="640" y="87" fill="#713f12" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">410.922 CLP</text>
      <text x="780" y="87" fill="#713f12" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">55.058 M2</text>

      <!-- Row 3 -->
      <rect y="94" width="992" height="24" fill="#ffffff"/>
      <line x1="0" y1="118" x2="992" y2="118" stroke="#e2e8f0"/>
      <text x="12" y="110" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">100007</text>
      <text x="90" y="110" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">4609933</text>
      <text x="165" y="110" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">100</text>
      <text x="205" y="110" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">5091903</text>
      <text x="285" y="110" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">1222367</text>
      <text x="375" y="110" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">1823338</text>
      <text x="450" y="110" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">&amp;ICP</text>
      <text x="500" y="110" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600">250,00 USD</text>
      <text x="640" y="110" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="11">86.588 CLP</text>
      <text x="780" y="110" fill="#64748b" font-family="'JetBrains Mono', monospace" font-size="11">20.708 M2</text>

      <!-- Row 4 -->
      <rect y="118" width="992" height="24" fill="#f8fafc"/>
      <line x1="0" y1="142" x2="992" y2="142" stroke="#e2e8f0"/>
      <text x="12" y="134" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">100007</text>
      <text x="90" y="134" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">4609931</text>
      <text x="165" y="134" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">110</text>
      <text x="205" y="134" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">5091902</text>
      <text x="285" y="134" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">1222367</text>
      <text x="375" y="134" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">1823338</text>
      <text x="450" y="134" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11"></text>
      <text x="500" y="134" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="600">250,00 USD</text>
      <text x="640" y="134" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="11">91.912 CLP</text>
      <text x="780" y="134" fill="#64748b" font-family="'JetBrains Mono', monospace" font-size="11">20.350 M2</text>

      <!-- Yellow Subtotal 2 -->
      <rect y="142" width="992" height="22" fill="#fef08a" stroke="#fde047" stroke-width="1"/>
      <text x="285" y="157" fill="#854d0e" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="700">SUBTOTAL FACTURA 1823338</text>
      <text x="500" y="157" fill="#713f12" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">500,00 USD</text>
      <text x="640" y="157" fill="#713f12" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">178.500 CLP</text>
      <text x="780" y="157" fill="#713f12" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">55.058 M2</text>

      <!-- Bright Yellow Grand Total -->
      <rect y="164" width="992" height="26" fill="#facc15" stroke="#eab308" stroke-width="1.5"/>
      <text x="285" y="181" fill="#713f12" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="800">TOTAL GENERAL OPERACIÓN COMEX</text>
      <text x="500" y="181" fill="#451a03" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="800">990,00 USD</text>
      <text x="640" y="181" fill="#451a03" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="800">589.422 CLP</text>
      <text x="780" y="181" fill="#451a03" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="800">110.116 M2</text>
    </g>

    <!-- Lower Table Conditions -->
    <g transform="translate(16, 380)">
      <rect width="992" height="180" fill="#ffffff" stroke="#cbd5e1" rx="3"/>
      <rect width="992" height="24" fill="url(#sapHeaderGrad)"/>
      <text x="12" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Solicitud DI</text>
      <text x="90" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Pos. DI</text>
      <text x="150" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Doc.compras</text>
      <text x="235" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Posición</text>
      <text x="290" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Proveedor</text>
      <text x="370" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Nº Despacho</text>
      <text x="460" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Condición doc.</text>
      <text x="560" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Pos. Cond</text>
      <text x="640" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Clase</text>
      <text x="700" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Regla cálculo</text>
      <text x="810" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Importe SAP Moneda</text>

      <rect y="24" width="992" height="22" fill="#ffffff"/>
      <text x="12" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">100007</text>
      <text x="90" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">10</text>
      <text x="150" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">4609931</text>
      <text x="235" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">100</text>
      <text x="290" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">5091902</text>
      <text x="370" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">1222367</text>
      <text x="460" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">1000408082</text>
      <text x="560" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">100</text>
      <text x="640" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">&amp;ICH</text>
      <text x="700" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">B</text>
      <text x="810" y="39" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600">44,00 USD</text>
    </g>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(createSapBaseWindow(content))}`;
}

export function getSapStep5Screenshot(): string {
  const content = `
    <!-- Standard Toolbar with Highlighted Grabar Datos Button -->
    <rect y="50" width="1024" height="34" fill="url(#sapToolbarGrad)" stroke="#cbd5e1" stroke-width="1"/>
    
    <!-- Grabar Datos button with prominent red highlight border -->
    <rect x="12" y="55" width="110" height="24" rx="3" fill="#3b82f6" stroke="#1d4ed8"/>
    <text x="24" y="71" fill="#ffffff" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11" font-weight="700">💾 Grabar Datos</text>

    <text x="135" y="72" fill="#0f172a" font-family="'Segoe UI', Tahoma, sans-serif" font-size="13" font-weight="700">Generador distribución facturas Comex en OC</text>

    <!-- Compact Filter Bar -->
    <g transform="translate(16, 90)">
      <rect width="992" height="42" fill="#ffffff" stroke="#cbd5e1" rx="3"/>
      <text x="16" y="26" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">Sociedad: <tspan fill="#0f172a" font-weight="700">VOLC</tspan></text>
      <text x="160" y="26" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11">Solicitud: <tspan fill="#0f172a" font-weight="700">100007</tspan></text>
      <text x="320" y="26" fill="#2563eb" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">► Fila 1 seleccionada para distribución contable</text>
    </g>

    <!-- Upper Table with Row 1 Highlighted in Blue Selection -->
    <g transform="translate(16, 138)">
      <rect width="992" height="230" fill="#ffffff" stroke="#cbd5e1" rx="3"/>
      <rect width="992" height="24" fill="url(#sapHeaderGrad)"/>
      <text x="12" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Solicitud DI</text>
      <text x="90" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Doc.compras</text>
      <text x="165" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Pos.</text>
      <text x="205" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Proveedor</text>
      <text x="285" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Nº Despacho</text>
      <text x="375" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Nº Factura</text>
      <text x="450" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Clase</text>
      <text x="500" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Importe SAP Moneda</text>
      <text x="640" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Importe Factura API</text>

      <!-- ROW 1 SELECTED IN SAP BLUE -->
      <rect y="24" width="992" height="24" fill="#2563eb"/>
      <text x="12" y="40" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">100007</text>
      <text x="90" y="40" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">4609931</text>
      <text x="165" y="40" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">100</text>
      <text x="205" y="40" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">5091902</text>
      <text x="285" y="40" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">1222367</text>
      <text x="375" y="40" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">228188</text>
      <text x="450" y="40" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">&amp;ICL</text>
      <text x="500" y="40" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">245,00 USD</text>
      <text x="640" y="40" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">198.334 CLP</text>

      <!-- Row 2 -->
      <rect y="48" width="992" height="24" fill="#ffffff"/>
      <line x1="0" y1="72" x2="992" y2="72" stroke="#e2e8f0"/>
      <text x="12" y="64" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">100007</text>
      <text x="90" y="64" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">4609931</text>
      <text x="165" y="64" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">110</text>
      <text x="205" y="64" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">5091903</text>
      <text x="285" y="64" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">1222367</text>
      <text x="375" y="64" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="11">228188</text>
      <text x="500" y="64" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="11">245,00 USD</text>

      <!-- Totals Yellow -->
      <rect y="72" width="992" height="22" fill="#fef08a"/>
      <text x="285" y="87" fill="#854d0e" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="700">TOTAL FACTURA 228188</text>
      <text x="500" y="87" fill="#713f12" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">490,00 USD</text>
      <text x="640" y="87" fill="#713f12" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">410.922 CLP</text>
    </g>

    <!-- Lower Table Conditions -->
    <g transform="translate(16, 380)">
      <rect width="992" height="180" fill="#ffffff" stroke="#cbd5e1" rx="3"/>
      <rect width="992" height="24" fill="url(#sapHeaderGrad)"/>
      <text x="12" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Solicitud DI</text>
      <text x="90" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Pos. DI</text>
      <text x="150" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Doc.compras</text>
      <text x="235" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Posición</text>
      <text x="290" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Proveedor</text>
      <text x="370" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Nº Despacho</text>
      <text x="460" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Condición doc.</text>
      <text x="560" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Clase</text>
      <text x="640" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">Importe SAP Moneda</text>

      <rect y="24" width="992" height="22" fill="#ffffff"/>
      <text x="12" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">100007</text>
      <text x="90" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">10</text>
      <text x="150" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">4609931</text>
      <text x="235" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">100</text>
      <text x="290" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">5091902</text>
      <text x="370" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">1222367</text>
      <text x="460" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">1000408082</text>
      <text x="560" y="39" fill="#334155" font-family="'JetBrains Mono', monospace" font-size="10">&amp;ICH</text>
      <text x="640" y="39" fill="#0f172a" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="600">44,00 USD</text>
    </g>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(createSapBaseWindow(content))}`;
}

export function getSapStep6Screenshot(): string {
  const content = `
    <!-- Standard Toolbar -->
    <rect y="50" width="1024" height="34" fill="url(#sapToolbarGrad)" stroke="#cbd5e1" stroke-width="1"/>
    <text x="24" y="72" fill="#0f172a" font-family="'Segoe UI', Tahoma, sans-serif" font-size="13" font-weight="700">Generador distribución facturas Comex en OC</text>

    <!-- Dimmed background tables -->
    <g transform="translate(16, 96)" opacity="0.45">
      <rect width="992" height="460" fill="#ffffff" stroke="#cbd5e1" rx="4"/>
      <rect width="992" height="24" fill="url(#sapHeaderGrad)"/>
      <text x="16" y="16" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="11">Registros de factura Comex preparados</text>
      <rect y="24" width="992" height="24" fill="#2563eb"/>
      <text x="16" y="40" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="11">100007  4609931  100  5091902  1222367  228188  &amp;ICL  245,00 USD</text>
    </g>

    <!-- Semi-transparent overlay backdrop -->
    <rect y="84" width="1024" height="490" fill="rgba(15, 23, 42, 0.35)"/>

    <!-- SAP Modal Confirmation Dialog Box -->
    <g transform="translate(312, 210)">
      <!-- Dialog Shadow & Frame -->
      <rect width="400" height="170" rx="4" fill="#ffffff" stroke="#475569" stroke-width="1" filter="drop-shadow(0 10px 15px rgba(0,0,0,0.3))"/>
      
      <!-- Dialog Titlebar -->
      <rect width="400" height="26" fill="#1e293b" rx="4"/>
      <rect y="22" width="400" height="4" fill="#1e293b"/>
      <text x="14" y="18" fill="#ffffff" font-family="'Segoe UI', Tahoma, sans-serif" font-size="11" font-weight="700">Grabar Datos</text>
      <text x="380" y="18" fill="#94a3b8" font-family="'Segoe UI', Tahoma, sans-serif" font-size="12">✕</text>

      <!-- Question Icon & Text -->
      <g transform="translate(24, 52)">
        <circle cx="16" cy="16" r="16" fill="#3b82f6"/>
        <text x="12" y="22" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-size="18" font-weight="700">?</text>
        <text x="44" y="20" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="600">¿Está seguro de grabar los registros?</text>
      </g>

      <!-- Buttons -->
      <g transform="translate(180, 115)">
        <!-- [ Sí ] Button with red highlight indicator -->
        <rect x="0" y="0" width="85" height="28" rx="3" fill="#ffffff" stroke="#ef4444" stroke-width="2"/>
        <text x="35" y="18" fill="#0f172a" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="700">Sí</text>

        <!-- [ No ] Button -->
        <rect x="105" y="0" width="85" height="28" rx="3" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
        <text x="140" y="18" fill="#475569" font-family="'Segoe UI', sans-serif" font-size="12">No</text>
      </g>
    </g>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(createSapBaseWindow(content))}`;
}
