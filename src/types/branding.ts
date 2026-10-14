import { SAINT_GOBAIN_WEBER_LOGO } from '../data/sampleProjects';

export interface OrganizationBranding {
  companyName: string; // Nombre de nuestra empresa u organización emisora
  companySlogan?: string; // Slogan o descripción institucional
  logo: string; // Data URL o URL del logo de NUESTRA empresa
  secondaryLogo?: string; // Logo secundario opcional (ej. Partner, HSBT, certificación)
  secondaryName?: string; // Nombre del partner o certificación
  secondarySlogan?: string; // Slogan secundario (ej. "COMPROMISO & CALIDAD")
  showOurLogoInCover: boolean;
  showOurLogoInHeader: boolean;
  primaryColor?: string; // Color corporativo primario (ej. #183B6C)
  updatedAt?: string;
}

export const HSBT_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" width="320" height="100">
  <rect width="320" height="100" rx="12" fill="#ffffff" />
  <rect x="18" y="20" width="70" height="60" rx="8" fill="#183B6C" />
  <line x1="41" y1="20" x2="41" y2="80" stroke="#2563EB" stroke-width="2.5" />
  <line x1="64" y1="20" x2="64" y2="80" stroke="#2563EB" stroke-width="2.5" />
  <text x="53" y="58" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle">HSBT</text>
  <text x="102" y="48" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="20" fill="#183B6C">HSBT CONSULTING</text>
  <text x="102" y="68" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="11" fill="#64748B" letter-spacing="1.5">COMPROMISO &amp; CALIDAD</text>
</svg>
`)}`;

export const TECHCONSULT_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" width="320" height="100">
  <rect width="320" height="100" rx="12" fill="#ffffff" />
  <rect x="20" y="20" width="60" height="60" rx="14" fill="#4F46E5" />
  <circle cx="50" cy="50" r="16" fill="#ffffff" />
  <text x="96" y="48" font-family="system-ui, sans-serif" font-weight="800" font-size="20" fill="#0F172A">TECHCONSULT</text>
  <text x="96" y="68" font-family="system-ui, sans-serif" font-weight="600" font-size="11" fill="#6366F1" letter-spacing="1">PROCESS ENGINEERING &amp; SAP</text>
</svg>
`)}`;

export const INNOVA_SYSTEMS_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" width="320" height="100">
  <rect width="320" height="100" rx="12" fill="#ffffff" />
  <polygon points="50,18 78,74 22,74" fill="#0284C7" />
  <circle cx="50" cy="55" r="10" fill="#ffffff" />
  <text x="96" y="48" font-family="system-ui, sans-serif" font-weight="900" font-size="19" fill="#0F172A">INNOVA SOLUTIONS</text>
  <text x="96" y="68" font-family="system-ui, sans-serif" font-weight="600" font-size="11" fill="#0284C7" letter-spacing="1.2">ENTERPRISE CLOUD &amp; ERP</text>
</svg>
`)}`;

export const DEFAULT_ORGANIZATION_BRANDING: OrganizationBranding = {
  companyName: 'Saint-Gobain Weber',
  companySlogan: 'Soluciones Integrales para la Construcción y Procesos Industriales',
  logo: SAINT_GOBAIN_WEBER_LOGO,
  secondaryLogo: HSBT_LOGO,
  secondaryName: 'HSBT',
  secondarySlogan: 'COMPROMISO & CALIDAD',
  showOurLogoInCover: true,
  showOurLogoInHeader: true,
  primaryColor: '#183B6C',
  updatedAt: new Date().toISOString(),
};
