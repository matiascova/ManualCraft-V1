import { Project, DEFAULT_DOCUMENT_OPTIONS } from '../types/project';

// Saint-Gobain Weber SVG Logo
export const SAINT_GOBAIN_WEBER_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" width="320" height="100">
  <defs>
    <linearGradient id="sgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#005596" />
      <stop offset="100%" stop-color="#0f3a60" />
    </linearGradient>
  </defs>
  <!-- Background badge -->
  <rect width="320" height="100" rx="12" fill="#ffffff" />
  
  <!-- Saint-Gobain Curved Bridge / Rainbow Symbol -->
  <g transform="translate(16, 18)">
    <path d="M 0 54 A 36 36 0 0 1 72 54" fill="none" stroke="#e01020" stroke-width="5" stroke-linecap="round"/>
    <path d="M 8 54 A 28 28 0 0 1 64 54" fill="none" stroke="#f0a500" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M 16 54 A 20 20 0 0 1 56 54" fill="none" stroke="#009640" stroke-width="4" stroke-linecap="round"/>
    <path d="M 24 54 A 12 12 0 0 1 48 54" fill="none" stroke="#005596" stroke-width="3.5" stroke-linecap="round"/>
  </g>
  
  <!-- SAINT-GOBAIN Text -->
  <text x="96" y="38" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="19" fill="#0f3a60" letter-spacing="1.2">SAINT-GOBAIN</text>
  
  <!-- weber brand in lowercase with blue accent -->
  <g transform="translate(96, 46)">
    <rect x="0" y="4" width="102" height="28" rx="6" fill="#005596" />
    <text x="14" y="24" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="18" fill="#ffffff" letter-spacing="0.5">weber</text>
    <text x="110" y="24" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="13" fill="#64748b">Chile</text>
  </g>
</svg>
`)}`;

export const ACME_CORP_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" width="320" height="100">
  <rect width="320" height="100" rx="12" fill="#ffffff" />
  <circle cx="50" cy="50" r="32" fill="#4f46e5" />
  <polygon points="50,26 68,66 32,66" fill="#ffffff" />
  <text x="96" y="46" font-family="system-ui, sans-serif" font-weight="800" font-size="20" fill="#0f172a" letter-spacing="1">ACME CORP</text>
  <text x="96" y="68" font-family="system-ui, sans-serif" font-weight="500" font-size="12" fill="#64748b">Industrial &amp; Logistics</text>
</svg>
`)}`;

export const GLOBAL_TECH_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" width="320" height="100">
  <rect width="320" height="100" rx="12" fill="#ffffff" />
  <rect x="22" y="22" width="56" height="56" rx="14" fill="#0ea5e9" />
  <path d="M 38 42 L 50 32 L 62 42 L 50 68 Z" fill="#ffffff" />
  <text x="96" y="46" font-family="system-ui, sans-serif" font-weight="800" font-size="19" fill="#0f172a">NEXUS GLOBAL</text>
  <text x="96" y="68" font-family="system-ui, sans-serif" font-weight="500" font-size="12" fill="#64748b">Financial Systems &amp; Cloud</text>
</svg>
`)}`;

export const HSBT_OFFICIAL_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" width="320" height="100">
  <rect width="320" height="100" rx="12" fill="#ffffff" />
  <rect x="18" y="20" width="70" height="60" rx="8" fill="#183B6C" />
  <line x1="41" y1="20" x2="41" y2="80" stroke="#2563EB" stroke-width="2.5" />
  <line x1="64" y1="20" x2="64" y2="80" stroke="#2563EB" stroke-width="2.5" />
  <text x="53" y="58" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle">HSBT</text>
  <text x="102" y="48" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="20" fill="#183B6C">HSBT</text>
  <text x="102" y="68" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="11" fill="#64748B" letter-spacing="1.5">COMPROMISO &amp; CALIDAD</text>
</svg>
`)}`;

export const WEBER_OFFICIAL_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" width="320" height="100">
  <rect width="320" height="100" rx="12" fill="#ffffff" />
  <g transform="translate(18, 15)">
    <polygon points="0,62 38,0 76,62" fill="#fedb00" />
    <polygon points="21,24 55,24 48,62 28,62" fill="#1e293b" />
    <text x="88" y="44" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="44" fill="#0f172a" letter-spacing="-1">weber</text>
    <text x="90" y="60" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="12" fill="#475569" letter-spacing="2">SAINT-GOBAIN</text>
  </g>
</svg>
`)}`;

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'prj-weber-wms-hu',
    clientId: 'cli-weber',
    name: 'Implementación SAP WMS con HU',
    code: 'WEBER_CL_2026_WM001',
    organizationName: 'HSBT',
    organizationLogo: HSBT_OFFICIAL_LOGO,
    organizationSlogan: 'COMPROMISO & CALIDAD',
    clientName: 'Weber',
    clientLogo: WEBER_OFFICIAL_LOGO,
    description: 'Conjunto estructurado de manuales operativos y procedimientos estándar para el sistema de gestión de almacenes con unidades de manipulación (HU).',
    status: 'En Progreso',
    category: 'Gestión de Almacenes & ERP SAP',
    version: '1.0',
    author: 'Equipo de Consultoría y Procesos HSBT & Weber',
    targetAudience: 'Operadores de Bodega, Supervisores Logísticos y Key Users',
    scope: 'Implementación de Warehouse Management System (WMS) con Handling Units (HU)',
    colorTheme: '#183B6C',
    documentOptions: {
      ...DEFAULT_DOCUMENT_OPTIONS,
      includeOurLogo: true,
      includeClientLogo: true,
      includeCoverPage: true,
      includeExecutiveSummary: true,
      includeDocumentControl: true,
      includeTableOfContents: true,
      includeProcessMatrix: true,
      includePrerequisites: true,
      includeStepScreenshots: true,
      includeActionBadges: true,
      includeTroubleshooting: true,
      includeChecklists: true,
      includeInstructorNotes: true,
    },
    createdAt: '2026-10-12T10:00:00.000Z',
    updatedAt: '2026-10-14T11:00:00.000Z',
  },
  {
    id: 'prj-weber-produccion',
    clientId: 'cli-weber',
    name: 'SAP PP - Producción y Órdenes de Fabricación',
    code: 'WEBER_CL_2026_PP002',
    organizationName: 'HSBT',
    organizationLogo: HSBT_OFFICIAL_LOGO,
    organizationSlogan: 'COMPROMISO & CALIDAD',
    clientName: 'Weber',
    clientLogo: WEBER_OFFICIAL_LOGO,
    description: 'Manuales operativos y procedimientos para la creación, liberación, notificación y cierre técnico de órdenes de fabricación en plantas de producción Weber.',
    status: 'En Progreso',
    category: 'Producción & Manufactura SAP',
    version: '1.0',
    author: 'Consultoría SAP PP & Operaciones de Planta',
    targetAudience: 'Jefes de Turno, Planificadores y Operadores de Línea',
    scope: 'Procesos del módulo SAP PP: Notificación CO11N, Gestión de listas de materiales (BOM) y consumo de materias primas',
    colorTheme: '#005596',
    documentOptions: {
      ...DEFAULT_DOCUMENT_OPTIONS,
      includeOurLogo: true,
      includeClientLogo: true,
      includeCoverPage: true,
      includeExecutiveSummary: true,
      includeDocumentControl: true,
      includeProcessMatrix: true,
    },
    createdAt: '2026-10-13T09:00:00.000Z',
    updatedAt: '2026-10-14T10:00:00.000Z',
  },
  {
    id: 'prj-weber-calidad',
    clientId: 'cli-weber',
    name: 'SAP QM - Control de Calidad y Lotes de Inspección',
    code: 'WEBER_CL_2026_QM003',
    organizationName: 'HSBT',
    organizationLogo: HSBT_OFFICIAL_LOGO,
    organizationSlogan: 'COMPROMISO & CALIDAD',
    clientName: 'Weber',
    clientLogo: WEBER_OFFICIAL_LOGO,
    description: 'Protocolos y guías paso a paso para el muestreo, registro de resultados y toma de decisión de empleo (UD) en lotes de inspección de laboratorio y materias primas.',
    status: 'En Progreso',
    category: 'Gestión de Calidad & Laboratorio',
    version: '1.0',
    author: 'Equipo de Aseguramiento de Calidad & Consultoría SAP',
    targetAudience: 'Analistas de Calidad, Inspectores de Laboratorio y Jefatura QM',
    scope: 'Módulo SAP QM: Transacciones QA32, QA11, inspección en recepción y liberación a libre utilización',
    colorTheme: '#059669',
    documentOptions: {
      ...DEFAULT_DOCUMENT_OPTIONS,
      includeOurLogo: true,
      includeClientLogo: true,
      includeCoverPage: true,
      includeExecutiveSummary: true,
      includeDocumentControl: true,
      includeProcessMatrix: true,
    },
    createdAt: '2026-10-13T11:00:00.000Z',
    updatedAt: '2026-10-14T10:30:00.000Z',
  },
  {
    id: 'prj-weber-sap',
    clientId: 'cli-weber',
    name: 'Implementación SAP S/4HANA: Supply Chain, Ventas & Logística',
    code: 'PRJ-2026-WEBER-01',
    organizationName: 'HSBT',
    organizationLogo: HSBT_OFFICIAL_LOGO,
    organizationSlogan: 'COMPROMISO & CALIDAD',
    clientName: 'Weber',
    clientLogo: SAINT_GOBAIN_WEBER_LOGO,
    description: 'Solución integral de manuales y procedimientos operativos estándar para los módulos de Gestión Comercial (SD), Compras y Abastecimiento (MM) y Comercio Exterior (Comex). Diseñado para la capacitación de usuarios y soporte de puesta en marcha.',
    status: 'En Progreso',
    category: 'Supply Chain & ERP SAP',
    version: '1.0',
    author: 'Equipo de Consultoría y Procesos Saint-Gobain Weber',
    targetAudience: 'Key Users, Operadores Logísticos y Personal Administrativo',
    scope: 'Documentación de procesos críticos transaccionales SAP (ZMMT0033, pedidos externos y entrega directa)',
    colorTheme: '#0f3a60',
    documentOptions: {
      ...DEFAULT_DOCUMENT_OPTIONS,
      includeOurLogo: true,
      includeClientLogo: true,
      includeCoverPage: true,
      includeExecutiveSummary: true,
      includeDocumentControl: true,
      includeTableOfContents: true,
      includeProcessMatrix: true,
      includePrerequisites: true,
      includeStepScreenshots: true,
      includeActionBadges: true,
      includeTroubleshooting: true,
      includeChecklists: true,
      includeInstructorNotes: true,
    },
    createdAt: '2026-10-10T08:00:00.000Z',
    updatedAt: '2026-10-14T09:30:00.000Z',
  },
  {
    id: 'prj-acme-finanzas',
    clientId: 'cli-acme',
    name: 'Modernización de Facturación Electrónica y Cumplimiento Tributario',
    code: 'PRJ-2026-ACME-02',
    clientName: 'Grupo Industrial ACME',
    clientLogo: ACME_CORP_LOGO,
    description: 'Paquete de manuales de usuario y procedimientos para la emisión, timbrado fiscal 4.0, notas de crédito y automatización de envío contable a clientes.',
    status: 'Aprobado',
    category: 'Finanzas & Facturación',
    version: '2.1',
    author: 'Departamento de TI & Contabilidad',
    targetAudience: 'Analistas Contables y Auxiliares de Facturación',
    scope: 'Plataforma web de facturación, emisión y conciliación de CFDI',
    colorTheme: '#4f46e5',
    documentOptions: {
      ...DEFAULT_DOCUMENT_OPTIONS,
      includeClientLogo: true,
      includeCoverPage: true,
      includeExecutiveSummary: true,
      includeProcessMatrix: true,
    },
    createdAt: '2026-10-05T09:00:00.000Z',
    updatedAt: '2026-10-12T14:15:00.000Z',
  },
  {
    id: 'prj-nexus-seguridad',
    clientId: 'cli-nexus',
    name: 'Programa de Seguridad de la Información y Gestión de Identidades',
    code: 'PRJ-2026-SEC-03',
    clientName: 'Nexus Global Systems',
    clientLogo: GLOBAL_TECH_LOGO,
    description: 'Guías operativas para el despliegue del doble factor de autenticación (2FA), gestión segura de credenciales y protocolos de acceso a datos confidenciales.',
    status: 'Publicado',
    category: 'Seguridad Informática & IT',
    version: '1.2',
    author: 'Equipo de Ciberseguridad Corporativa',
    targetAudience: 'Todos los colaboradores de la organización',
    scope: 'Despliegue de TOTP corporativo y auditoría de accesos',
    colorTheme: '#0ea5e9',
    documentOptions: {
      ...DEFAULT_DOCUMENT_OPTIONS,
      includeClientLogo: true,
      includeCoverPage: true,
      includeExecutiveSummary: true,
    },
    createdAt: '2026-10-02T11:00:00.000Z',
    updatedAt: '2026-10-09T18:00:00.000Z',
  },
];
