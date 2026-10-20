import React, { useState } from 'react';
import { Client } from '../types/client';
import { Project } from '../types/project';
import { UserManual } from '../types/manual';
import { OrganizationBranding } from '../types/branding';
import {
  FolderKanban,
  Building2,
  BookOpen,
  ArrowRight,
  Sparkles,
  Download,
  FileCode2,
  FileText,
  Award,
  Layers,
  CheckCircle2,
  MonitorPlay,
  Package,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Laptop,
  Check,
  Zap,
  Eye,
  Play,
  Users,
  RefreshCw,
  BarChart3,
  HelpCircle,
  ArrowUpRight,
  Sliders,
  CheckCircle,
} from 'lucide-react';

interface LandingPageProps {
  clients: Client[];
  projects: Project[];
  manuals: UserManual[];
  branding?: OrganizationBranding;
  onEnterApp: (clientId?: string, projectId?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  clients = [],
  projects = [],
  manuals = [],
  branding,
  onEnterApp,
}) => {
  // Active tab in hero showcase
  const [activeHeroTab, setActiveHeroTab] = useState<'hierarchy' | 'simulator' | 'matrix' | 'export'>('hierarchy');

  // Mini interactive simulator state for live demo section
  const [demoStepIndex, setDemoStepIndex] = useState(0);

  const demoSteps = [
    {
      step: 1,
      title: 'Monitoreo de Unidades de Manipulación (HU)',
      action: 'Ejecutar Transacción',
      element: 'Campo de comandos SAP GUI',
      tx: 'HUMO',
      module: 'SAP WMS / LE',
      client: 'Weber',
      description: 'En el menú inicial SAP Easy Access, ingrese la transacción HUMO en el campo de comandos superior y presione Enter para acceder a la gestión de pallets y bultos.',
      expected: 'Se despliega la pantalla de selección con filtros por Almacén, Centro logístico y Rango de HUs.',
      tip: 'Guarde una variante de usuario si consulta habitualmente el mismo centro de distribución.',
    },
    {
      step: 2,
      title: 'Ingreso de Parámetros de Selección y Centro',
      action: 'Seleccionar Valores',
      element: 'Centro 1000 / Almacén W01',
      tx: 'HUMO',
      module: 'SAP WMS / LE',
      client: 'Weber',
      description: 'Especifique el Centro 1000 (Weber Planta Central) y el almacén W01 (Pulmón de Producción). Ingrese el estado de la HU en "Libre utilización".',
      expected: 'Se habilitan los botones de acción masiva en la barra de herramientas superior.',
      tip: 'Deje el rango de números en blanco para listar todas las unidades pendientes de confirmación.',
    },
    {
      step: 3,
      title: 'Embalaje y Asignación de Código SSCC',
      action: 'Clic en Botón Embalar (F6)',
      element: 'Icono Embalar Material',
      tx: 'HUMO',
      module: 'SAP WMS / LE',
      client: 'Weber',
      description: 'Seleccione las líneas de producto terminado y haga clic en "Embalar". El sistema generará automáticamente la etiqueta con código de barras GS1-128 y SSCC.',
      expected: 'Barra de estado inferior muestra mensaje verde: "Unidad de Manipulación 184920401 creada y contabilizada".',
      tip: 'Puede reimprimir la etiqueta física inmediatamente con el botón Impresión Directa sin salir de la sesión.',
    },
  ];

  const totalClients = clients.length || 3;
  const totalProjects = projects.length || 6;
  const totalManuals = manuals.length || 10;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      {/* ============================================================== */}
      {/* 1. TOP BAR CONTRACT (Strict 3-zone, one-row layout) */}
      {/* Zone 1: Single text wordmark | Zone 2: 4-5 text links | Zone 3: 1 primary CTA */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="w-[96%] max-w-7xl mx-auto h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark (single element, whitespace-nowrap) */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <FolderKanban className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              ManualCraft <span className="text-indigo-400 font-semibold">AI</span>
            </span>
          </div>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#bondades" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Bondades Clave
            </a>
            <a href="#jerarquia" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Jerarquía 3 Niveles
            </a>
            <a href="#simulador" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Simulador Interactivo
            </a>
            <a href="#formatos" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Exportación &amp; HTML
            </a>
            <a href="#clientes" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Casos de Clientes
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onEnterApp()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <span>Entrar a la Herramienta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. HERO SECTION */}
      {/* Dominant focal carrier, headline clamp(2.25rem, 4vw, 3.75rem), value proposition, primary CTA */}
      {/* ============================================================== */}
      <section className="relative pt-16 pb-20 px-4 overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.22),rgba(255,255,255,0))] pointer-events-none" />

        <div className="w-[96%] max-w-6xl mx-auto relative z-10 text-center space-y-6">
          {/* Unboxed editorial kicker */}
          <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 font-semibold tracking-wide">
            <span>Solución Empresarial</span>
            <span aria-hidden="true">·</span>
            <span>Documentación Operativa SAP S/4HANA &amp; ECC</span>
            <span aria-hidden="true">·</span>
            <span>Edición &amp; Exportación Viva</span>
          </div>

          {/* Main Headline with balanced wrap */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15] text-balance">
            De Manuales Estáticos a Guías Interactivas y Vivas para el Ecosistema{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-300">
              SAP S/4HANA
            </span>
          </h1>

          {/* Value Proposition Description */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Estandariza procedimientos operativos, capacita a Key Users con simuladores interactivos paso a paso y exporta automáticamente portales web HTML autónomos, paquetes offline para SharePoint y dossiers corporativos foliados para cada cliente.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onEnterApp()}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Entrar a la Herramienta de Manuales</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onEnterApp('cli-weber', 'prj-weber-wms-hu')}
              className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm rounded-xl border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Explorar Caso Weber (WMS &amp; PP)</span>
            </button>

            <button
              onClick={() => onEnterApp('cli-acme', 'prj-acme-finanzas')}
              className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm rounded-xl border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Explorar Caso ACME (Facturación)</span>
            </button>
          </div>

          {/* Unboxed Quantitative Proof Strip (Tabular numerals, explicit units) */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <div className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">3 Niveles</div>
              <div className="text-xs text-slate-400 mt-0.5">Jerarquía Estricta: Cliente → Proyecto → Manual</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <div className="font-mono text-xl sm:text-2xl font-bold text-indigo-400 tabular-nums">100% Offline</div>
              <div className="text-xs text-slate-400 mt-0.5">Portales HTML Autónomos sin Dependencia de Servidor</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <div className="font-mono text-xl sm:text-2xl font-bold text-sky-400 tabular-nums">Doble Marca</div>
              <div className="text-xs text-slate-400 mt-0.5">Co-Branding Oficial: Tu Empresa + Logo del Cliente</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums">-65% Tiempo</div>
              <div className="text-xs text-slate-400 mt-0.5">Reducción en Curva de Aprendizaje de Key Users</div>
            </div>
          </div>

          {/* Dominant Hero Focal Carrier: Interactive Workspace Mockup Frame */}
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-950 p-2 sm:p-4 shadow-2xl relative overflow-hidden text-left max-w-5xl mx-auto">
            {/* Top Bar of the Mockup */}
            <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800 text-xs text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-slate-400">
                  manualcraft.enterprise / weber / sap-wms-hu
                </span>
              </div>

              {/* Interactive Showcase Mode Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => setActiveHeroTab('hierarchy')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    activeHeroTab === 'hierarchy' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Jerarquía
                </button>
                <button
                  onClick={() => setActiveHeroTab('simulator')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    activeHeroTab === 'simulator' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Simulador
                </button>
                <button
                  onClick={() => setActiveHeroTab('matrix')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    activeHeroTab === 'matrix' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Matriz SAP
                </button>
                <button
                  onClick={() => setActiveHeroTab('export')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    activeHeroTab === 'export' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Exportación
                </button>
              </div>
            </div>

            {/* Inner Interactive Content depending on Tab */}
            <div className="p-4 sm:p-6 bg-slate-900 rounded-xl mt-3 min-h-[300px]">
              {activeHeroTab === 'hierarchy' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Client Identity & Hierarchy */}
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Nivel 1: Cliente Activo
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center">
                          <span className="text-slate-900 font-black text-xs">weber</span>
                        </div>
                        <div>
                          <div className="font-extrabold text-white text-sm">Weber Saint-Gobain</div>
                          <div className="text-[11px] text-slate-400 font-mono">Mandante S/4HANA 100 · 4 Proyectos</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                        Nivel 2: Proyectos del Cliente
                      </div>
                      <div className="p-2.5 bg-indigo-950/60 rounded-lg border border-indigo-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-indigo-400" />
                          <span className="font-bold text-white">SAP WMS con HU</span>
                        </div>
                        <span className="text-[10px] text-indigo-300 font-mono">3 Manuales</span>
                      </div>
                      <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80 flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-slate-500" />
                          <span>SAP PP - Producción</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">2 Manuales</span>
                      </div>
                      <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80 flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-slate-500" />
                          <span>SAP QM - Calidad</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">2 Manuales</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Two Columns: Operational Manual Detail */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                            1
                          </span>
                          <h4 className="font-bold text-sm text-white">
                            Creación de Unidad de Manipulación HU en Almacén
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                          Tx: HUMO
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        En el monitor de unidades de manipulación (HUMO), seleccione el almacén origen y el material de embalaje. Asigne el código SSCC para la trazabilidad completa en pallets de expedición.
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                        <div>
                          <span className="block text-slate-500 font-bold text-[10px] uppercase">Acción Requerida</span>
                          <span className="text-indigo-300 font-semibold">Clic en "Generar HU" / F6</span>
                        </div>
                        <div>
                          <span className="block text-slate-500 font-bold text-[10px] uppercase">Resultado Esperado</span>
                          <span className="text-emerald-400 font-semibold">HU asignada con código SSCC</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] text-slate-400">
                          Consejo: Verifique que el lote cuente con estatus de Libre Utilización.
                        </span>
                        <button
                          onClick={() => onEnterApp('cli-weber', 'prj-weber-wms-hu')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Abrir Workspace Completo</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeHeroTab === 'simulator' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="font-bold text-sm text-white">Simulador Paso a Paso para Key Users</h4>
                      <p className="text-xs text-slate-400">Entrenamiento activo guiado con atajos de teclado y retroalimentación inmediata</p>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-950 border border-indigo-800 rounded text-indigo-300 text-xs font-mono font-bold">
                      Modo Interactivo
                    </span>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-indigo-400 font-bold">Paso 01/05:</span>
                      <span className="font-semibold text-white">Ingreso de Datos de Cabecera en Transacción MIGO</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
                      &gt; Tipo de movimiento: 101 (Entrada de mercancías por pedido de compras)
                      <br />
                      &gt; Pedido: 4500019284 · Almacén: 0001
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>Atajos: [Enter] Validar datos · [Flecha Derecha] Siguiente paso</span>
                      <button
                        onClick={() => onEnterApp('cli-weber', 'prj-weber-wms-hu')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        <span>Lanzar Simulador Completo</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeHeroTab === 'matrix' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="font-bold text-sm text-white">Matriz de Transacciones SAP &amp; Cobertura</h4>
                      <p className="text-xs text-slate-400">Trazabilidad de T-Codes por módulo y rol operativo</p>
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Auditable SOX / ISO
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                          <th className="py-2 px-3">T-Code</th>
                          <th className="py-2 px-3">Descripción Transaccional</th>
                          <th className="py-2 px-3">Módulo</th>
                          <th className="py-2 px-3">Rol Responsable</th>
                          <th className="py-2 px-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-indigo-400">HUMO</td>
                          <td className="py-2.5 px-3 font-sans text-slate-200">Monitor de Unidades de Manipulación</td>
                          <td className="py-2.5 px-3 text-slate-400">LE-WM</td>
                          <td className="py-2.5 px-3 text-slate-400">Operador Almacén</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-sans font-semibold">Documentado</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-indigo-400">MIGO</td>
                          <td className="py-2.5 px-3 font-sans text-slate-200">Entrada de Mercancías por Pedido</td>
                          <td className="py-2.5 px-3 text-slate-400">MM-IM</td>
                          <td className="py-2.5 px-3 text-slate-400">Recepción Materias Primas</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-sans font-semibold">Documentado</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-indigo-400">CO01</td>
                          <td className="py-2.5 px-3 font-sans text-slate-200">Creación de Orden de Fabricación</td>
                          <td className="py-2.5 px-3 text-slate-400">PP-SFC</td>
                          <td className="py-2.5 px-3 text-slate-400">Planificador de Planta</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-sans font-semibold">Documentado</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeHeroTab === 'export' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="font-bold text-sm text-white">Exportación Masiva &amp; Portales Autónomos</h4>
                      <p className="text-xs text-slate-400">Genera entregables en segundos para TI, auditoría y usuarios finales</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <div className="font-bold text-indigo-400">Portal HTML por Cliente</div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        1 archivo HTML offline con todos los manuales, buscador y simulador embebido.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <div className="font-bold text-purple-400">Paquete ZIP Completo</div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Estructura organizada para subir directamente a SharePoint corporativo.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <div className="font-bold text-amber-400">Dossier PDF Oficial</div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Portada institucional, ficha técnica de 4 columnas e índice foliado.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <div className="font-bold text-sky-400">Word (.docx) Editable</div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Documento listo para personalizaciones de formato y versionamiento interno.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. CORE PILLARS & FEATURES (Asymmetric Bento Grid) */}
      {/* ============================================================== */}
      <section id="bondades" className="py-20 px-4 border-b border-slate-800 bg-slate-950">
        <div className="w-[96%] max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <div className="text-xs font-semibold text-indigo-400 tracking-wide">
              Capacidades &amp; Arquitectura de Software
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-balance">
              Las 6 Grandes Bondades de ManualCraft AI
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Supera la fricción de la documentación estática tradicional con una arquitectura pensada para consultores SAP, gerentes de procesos y Key Users.
            </p>
          </div>

          {/* Asymmetric Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Hierarchy (Col-span 2 for Marquee visual dominance) */}
            <div className="md:col-span-2 p-6 sm:p-8 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-indigo-400">
                  01. GOBERNANZA MULTI-CLIENTE
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Jerarquía Corporativa Estricta de 3 Niveles
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Estructuración rigurosa para consultoras y corporativos: <strong>Cliente</strong> (ej. Weber, ACME, Nexus) → <strong>Proyectos y Módulos SAP</strong> (WMS con HU, Facturación Electrónica, Seguridad) → <strong>Manuales Operativos Paso a Paso</strong>. Permite mantener aislamiento de datos o navegar el portafolio consolidado en un solo clic.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="font-bold text-white mb-0.5">Nivel 1: Clientes</div>
                  <span className="text-slate-400 text-[11px]">Logo, código ERP, industria y proyectos asignados.</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="font-bold text-white mb-0.5">Nivel 2: Proyectos</div>
                  <span className="text-slate-400 text-[11px]">Mandante, release SAP, equipo consultor y T-Codes.</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div className="font-bold text-white mb-0.5">Nivel 3: Manuales</div>
                  <span className="text-slate-400 text-[11px]">Pasos interactivos, capturas marcadas y notas operativas.</span>
                </div>
              </div>
            </div>

            {/* Card 2: Interactive Simulator */}
            <div className="p-6 sm:p-8 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-indigo-400">
                  02. SIMULADOR PASO A PASO
                </div>
                <h3 className="text-xl font-bold text-white">
                  Capacitación Guiada para Key Users
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Los operadores no aprenden leyendo PDFs de 200 páginas; aprenden interactuando. El simulador recrea el flujo operativo con navegación por teclado, campos de acción destacados y mensajes de respuesta del sistema SAP.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Navegación con teclas de dirección</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Destacado de campos críticos en pantalla</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Validación de mensajes de retorno (F8)</span>
                </div>
              </div>
            </div>

            {/* Card 3: Offline HTML Portals */}
            <div className="p-6 sm:p-8 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-indigo-400">
                  03. PORTALES HTML OFFLINE
                </div>
                <h3 className="text-xl font-bold text-white">
                  Exportación por Cliente en 1 Clic
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Genera un portal interactivo empaquetado en un único archivo HTML por cliente. Abre directamente en cualquier navegador moderno sin requerir conexión a internet, NodeJS ni bases de datos.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="text-white font-semibold">Portabilidad Absoluta:</div>
                <div>Llévalo en una memoria USB, compártelo por correo o móntalo en la Intranet de tu cliente en segundos.</div>
              </div>
            </div>

            {/* Card 4: Co-Branding Dual & Plantilla Oficial */}
            <div className="p-6 sm:p-8 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-indigo-400">
                  04. CO-BRANDING CORPORATIVO
                </div>
                <h3 className="text-xl font-bold text-white">
                  Doble Logotipo &amp; Ficha Técnica
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Portada con identidad conjunta: Tu firma de consultoría (ej. HSBT) junto al logotipo oficial de tu cliente (Weber, ACME). Incluye tabla de control documental de 4 columnas (Código, Versión, Aprobador, Fecha).
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="text-white font-semibold">Aprobación Institucional:</div>
                <div>Cumple las directrices de entrega de los principales comités de TI y auditorías de calidad.</div>
              </div>
            </div>

            {/* Card 5: SAP Transaction Matrix */}
            <div className="p-6 sm:p-8 bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-indigo-400">
                  05. MATRIZ DE TRANSACCIONES
                </div>
                <h3 className="text-xl font-bold text-white">
                  Trazabilidad por T-Code &amp; Rol
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Catalogación inteligente de transacciones SAP (MIGO, HUMO, VL01N, CO01, etc.) vinculadas directamente a cada paso del manual, permitiendo búsquedas rápidas por código o rol operativo.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="text-white font-semibold">Trazabilidad Total:</div>
                <div>Localiza inmediatamente qué manual cubre cada transacción antes de una salida en vivo.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. LIVE INTERACTIVE WALKTHROUGH DEMO */}
      {/* ============================================================== */}
      <section id="simulador" className="py-20 px-4 border-b border-slate-800 bg-slate-900/50">
        <div className="w-[96%] max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="text-xs font-semibold text-sky-400 tracking-wide">
              Demostración en Vivo
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Experimenta el Flujo Interactivo Paso a Paso
            </h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              Comprueba cómo los usuarios navegan y comprenden una transacción SAP en cuestión de segundos:
            </p>
          </div>

          {/* Interactive Step Card */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs font-mono">
                  {demoStepIndex + 1}
                </span>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {demoSteps[demoStepIndex].title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>Transacción: {demoSteps[demoStepIndex].tx}</span>
                    <span aria-hidden="true">·</span>
                    <span>Módulo: {demoSteps[demoStepIndex].module}</span>
                    <span aria-hidden="true">·</span>
                    <span>Cliente: {demoSteps[demoStepIndex].client}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium font-mono">
                  Paso {demoStepIndex + 1} de {demoSteps.length}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-200 leading-relaxed">
                {demoSteps[demoStepIndex].description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Acción &amp; Elemento en Pantalla
                  </span>
                  <div className="font-bold text-indigo-300">
                    {demoSteps[demoStepIndex].action} · {demoSteps[demoStepIndex].element}
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Resultado del Sistema SAP
                  </span>
                  <div className="font-semibold text-emerald-400">
                    {demoSteps[demoStepIndex].expected}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-sky-950/40 rounded-xl border border-sky-900/60 text-xs text-sky-200">
                <strong>Consejo del Consultor:</strong> {demoSteps[demoStepIndex].tip}
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setDemoStepIndex((i) => Math.max(0, i - 1))}
                disabled={demoStepIndex === 0}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                ← Anterior
              </button>

              <div className="flex items-center gap-1.5">
                {demoSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDemoStepIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      idx === demoStepIndex ? 'bg-indigo-500 w-5' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setDemoStepIndex((i) => Math.min(demoSteps.length - 1, i + 1))}
                disabled={demoStepIndex === demoSteps.length - 1}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                Siguiente Paso →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. COMPARISON SECTION: TRADITIONAL MANUALS VS MANUALCRAFT AI */}
      {/* ============================================================== */}
      <section className="py-20 px-4 border-b border-slate-800 bg-slate-950">
        <div className="w-[96%] max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="text-xs font-semibold text-indigo-400 tracking-wide">
              Análisis Comparativo
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              ¿Por Qué las Empresas Eligen ManualCraft AI?
            </h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              Comparativa frente al modelo tradicional de manuales estáticos en PDF o carpetas compartidas:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old Way */}
            <div className="p-6 bg-slate-900/60 rounded-2xl border border-rose-950/60 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <span>Manuales Tradicionales (PDF / Word Sueltos)</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Documentos de más de 150 páginas que nadie lee ni consulta.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Capturas de pantalla estáticas, sin interacción ni contexto de acción.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Desactualización inmediata tras la primera actualización de versión SAP.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Archivos pesados difíciles de compartir o restringidos por correo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Formatos heterogéneos sin estándar visual entre consultores.</span>
                </li>
              </ul>
            </div>

            {/* ManualCraft AI Way */}
            <div className="p-6 bg-slate-900 rounded-2xl border border-indigo-900/60 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>ManualCraft AI Suite</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Simulador interactivo donde el usuario practica haciendo ("learning by doing").</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Portales web HTML autónomos offline con motor de búsqueda en tiempo real.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Jerarquía estricta por Cliente y Proyecto con filtrado instantáneo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Doble marca institucional (Emisor + Cliente) y ficha de auditoría de 4 columnas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Exportación masiva en HTML, paquetes ZIP para SharePoint, PDF y Word editable.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. REAL CLIENT SHOWCASE & INSTANT LAUNCH CARDS */}
      {/* ============================================================== */}
      <section id="clientes" className="py-20 px-4 border-b border-slate-800 bg-slate-900/30">
        <div className="w-[96%] max-w-6xl mx-auto space-y-10 text-center">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-indigo-400 tracking-wide">
              Portafolio Preconfigurado
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Explora Espacios de Clientes Listos para Usar
            </h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              Selecciona cualquiera de los clientes preconfigurados para ingresar directamente a su espacio con proyectos y manuales filtrados:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {clients.map((c) => {
              const clientProjs = projects.filter((p) => p.clientId === c.id);
              const clientMans = manuals.filter((m) =>
                clientProjs.some((p) => p.id === m.projectId)
              );

              return (
                <div
                  key={c.id}
                  onClick={() => onEnterApp(c.id, clientProjs[0]?.id)}
                  className="p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-indigo-500/80 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-9 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden">
                        {c.logo ? (
                          <img
                            src={c.logo}
                            alt={c.name}
                            referrerPolicy="no-referrer"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <Building2 className="w-4 h-4 text-slate-900" />
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800 font-bold">
                        {c.code || 'ERP'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white text-base group-hover:text-indigo-400 transition-colors">
                        {c.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {c.industry || c.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium font-mono">
                      <span>{clientProjs.length} Proyecto(s)</span>
                      <span aria-hidden="true">·</span>
                      <span>{clientMans.length} Manual(es)</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                    <span>Entrar a {c.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. FINAL CALL TO ACTION */}
      {/* ============================================================== */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900 text-center relative overflow-hidden">
        <div className="w-[96%] max-w-4xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-balance">
            Comienza a Documentar tus Procesos SAP con Rigor Corporativo
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Accede ahora mismo a la herramienta, administra tus proyectos, prueba el simulador y genera manuales interactivos en HTML, PDF y Word listos para entregar.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onEnterApp()}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-indigo-600/30 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <span>Entrar a la Herramienta de Manuales</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. QUIET FOOTER */}
      {/* ============================================================== */}
      <footer className="py-8 px-4 border-t border-slate-800 bg-slate-950 text-xs text-slate-500">
        <div className="w-[96%] max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">ManualCraft AI</span>
            <span aria-hidden="true">·</span>
            <span>Documentación Operativa Especializada para SAP S/4HANA &amp; ECC</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Emisor: <strong className="text-slate-300">{branding?.companyName || 'HSBT'}</strong></span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => onEnterApp()}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
            >
              Acceso Directo a la Herramienta →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
