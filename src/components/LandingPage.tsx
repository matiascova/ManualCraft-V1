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
      title: 'Monitoreo de Unidades de Manipulación y Carga (HU)',
      action: 'Ejecutar Transacción',
      element: 'Línea de Comandos del Sistema ERP',
      tx: 'TRX-WMS-01',
      module: 'Logística & Gestión de Almacenes',
      client: 'Weber',
      description: 'En el menú principal del sistema central, ingrese el código de transacción TRX-WMS-01 en el campo de comandos superior y presione Enter para acceder a la consola de gestión de pallets y bultos.',
      expected: 'Se despliega la pantalla de selección con filtros por Centro Operativo, Almacén y Rango de Unidades.',
      tip: 'Guarde una variante de usuario si consulta habitualmente el mismo centro de distribución.',
    },
    {
      step: 2,
      title: 'Ingreso de Parámetros de Selección y Centro',
      action: 'Seleccionar Valores',
      element: 'Centro 1000 / Almacén W01',
      tx: 'TRX-WMS-01',
      module: 'Logística & Gestión de Almacenes',
      client: 'Weber',
      description: 'Especifique el Centro 1000 (Planta Central) y el almacén W01 (Pulmón de Producción). Ingrese el estado de la unidad en "Libre utilización".',
      expected: 'Se habilitan los botones de acción masiva en la barra de herramientas superior.',
      tip: 'Deje el rango de números en blanco para listar todas las unidades pendientes de confirmación.',
    },
    {
      step: 3,
      title: 'Embalaje y Asignación de Código SSCC',
      action: 'Confirmar Acción (F6)',
      element: 'Icono Embalar Material',
      tx: 'TRX-WMS-01',
      module: 'Logística & Gestión de Almacenes',
      client: 'Weber',
      description: 'Seleccione las líneas de producto terminado y haga clic en "Embalar". El sistema generará automáticamente la etiqueta con código de barras GS1-128 y estándar SSCC.',
      expected: 'Barra de estado inferior muestra mensaje de confirmación: "Unidad de Manipulación 184920401 creada y contabilizada".',
      tip: 'Puede reimprimir la etiqueta física inmediatamente con el botón Impresión Directa sin salir de la sesión activa.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1320] text-[#D2DFEC] flex flex-col font-sans selection:bg-[#0070F2] selection:text-white antialiased">
      {/* ============================================================== */}
      {/* 1. TOP BAR (Strict 3-zone, one-row layout with Horizon styling) */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-50 bg-[#0B1320]/90 backdrop-blur-md border-b border-[#1C2C42]">
        <div className="w-[96%] max-w-7xl mx-auto h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#0070F2] flex items-center justify-center text-white shadow-sm shadow-[#0070F2]/30">
              <FolderKanban className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              ManualCraft <span className="text-[#4DB1FF] font-semibold">Enterprise</span>
            </span>
          </div>

          {/* Zone 2: Navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#8FA6BF]">
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
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0070F2] rounded-lg hover:bg-[#0064D9] transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-md shadow-[#0070F2]/30 cursor-pointer"
            >
              <span>Entrar a la Herramienta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. HERO SECTION */}
      {/* Dominant focal carrier, Horizon Sapphire & Petrol radial glows */}
      {/* ============================================================== */}
      <section className="relative pt-16 pb-20 px-4 overflow-hidden border-b border-[#1C2C42] bg-gradient-to-b from-[#0B1320] via-[#111C2E] to-[#0B1320]">
        {/* Subtle Horizon Sapphire & Cyan radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,112,242,0.22),rgba(0,168,181,0.06),rgba(0,0,0,0))] pointer-events-none" />

        <div className="w-[96%] max-w-6xl mx-auto relative z-10 text-center space-y-6">
          {/* Editorial kicker */}
          <div className="flex items-center justify-center gap-2 text-xs text-[#4DB1FF] font-semibold tracking-wide">
            <span>Solución de Misión Crítica</span>
            <span aria-hidden="true" className="text-[#1C2C42]">·</span>
            <span>Documentación Operativa para Sistemas ERP &amp; Procesos Core</span>
            <span aria-hidden="true" className="text-[#1C2C42]">·</span>
            <span>Edición &amp; Exportación Viva</span>
          </div>

          {/* Main Headline with Horizon Sapphire/Cyan gradient */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15] text-balance">
            De Manuales Estáticos a Guías Interactivas y Vivas para{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4DB1FF] via-[#00C3D8] to-[#99D5FF]">
              Sistemas Empresariales Core
            </span>
          </h1>

          {/* Value Proposition Description */}
          <p className="text-sm sm:text-base lg:text-lg text-[#D2DFEC] max-w-3xl mx-auto leading-relaxed font-normal">
            Estandariza procedimientos operativos, capacita a usuarios clave con simuladores interactivos paso a paso y exporta automáticamente portales web HTML autónomos, paquetes offline para entornos corporativos y dossiers foliados con control documental formal.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => onEnterApp()}
              className="px-6 py-3.5 bg-[#0070F2] hover:bg-[#0064D9] text-white font-bold text-sm rounded-xl shadow-xl shadow-[#0070F2]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Entrar a la Herramienta de Manuales</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onEnterApp('cli-weber', 'prj-weber-wms-hu')}
              className="px-5 py-3.5 bg-[#16243A] hover:bg-[#1B2A41] text-[#D2DFEC] hover:text-white font-semibold text-sm rounded-xl border border-[#23354E] hover:border-[#0070F2]/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-[#4DB1FF]" />
              <span>Explorar Caso Weber (Almacenes &amp; Carga)</span>
            </button>

            <button
              onClick={() => onEnterApp('cli-acme', 'prj-acme-finanzas')}
              className="px-5 py-3.5 bg-[#16243A] hover:bg-[#1B2A41] text-[#D2DFEC] hover:text-white font-semibold text-sm rounded-xl border border-[#23354E] hover:border-[#0070F2]/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-[#00C3D8]" />
              <span>Explorar Caso ACME (Facturación)</span>
            </button>
          </div>

          {/* Quantitative Proof Strip */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-3 bg-[#111C2E]/80 rounded-xl border border-[#1C2C42]">
              <div className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">3 Niveles</div>
              <div className="text-xs text-[#8FA6BF] mt-0.5">Jerarquía Estricta: Cliente → Proyecto → Manual</div>
            </div>
            <div className="p-3 bg-[#111C2E]/80 rounded-xl border border-[#1C2C42]">
              <div className="font-mono text-xl sm:text-2xl font-bold text-[#4DB1FF] tabular-nums">100% Offline</div>
              <div className="text-xs text-[#8FA6BF] mt-0.5">Portales HTML Autónomos sin Servidores Externos</div>
            </div>
            <div className="p-3 bg-[#111C2E]/80 rounded-xl border border-[#1C2C42]">
              <div className="font-mono text-xl sm:text-2xl font-bold text-[#00C3D8] tabular-nums">Doble Marca</div>
              <div className="text-xs text-[#8FA6BF] mt-0.5">Co-Branding Oficial: Tu Empresa + Logo del Cliente</div>
            </div>
            <div className="p-3 bg-[#111C2E]/80 rounded-xl border border-[#1C2C42]">
              <div className="font-mono text-xl sm:text-2xl font-bold text-[#10B981] tabular-nums">-65% Tiempo</div>
              <div className="text-xs text-[#8FA6BF] mt-0.5">Reducción en Curva de Adopción de Usuarios Clave</div>
            </div>
          </div>

          {/* Dominant Hero Focal Carrier: Horizon Workspace Mockup Frame */}
          <div className="mt-10 rounded-2xl border border-[#1C2C42] bg-[#0B1320] p-2 sm:p-4 shadow-2xl relative overflow-hidden text-left max-w-5xl mx-auto">
            {/* Top Bar of the Mockup */}
            <div className="flex items-center justify-between pb-3 px-2 border-b border-[#1C2C42] text-xs text-[#8FA6BF] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]/80" />
                <div className="w-3 h-3 rounded-full bg-[#10B981]/80" />
                <span className="ml-2 font-mono text-[11px] text-[#8FA6BF]">
                  manualcraft.enterprise / weber / logistica-wms-hu
                </span>
              </div>

              {/* Interactive Showcase Mode Tabs */}
              <div className="flex items-center gap-1 bg-[#111C2E] p-1 rounded-lg border border-[#1C2C42] text-[11px]">
                <button
                  onClick={() => setActiveHeroTab('hierarchy')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    activeHeroTab === 'hierarchy' ? 'bg-[#0070F2] text-white font-bold' : 'text-[#8FA6BF] hover:text-white'
                  }`}
                >
                  Jerarquía
                </button>
                <button
                  onClick={() => setActiveHeroTab('simulator')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    activeHeroTab === 'simulator' ? 'bg-[#0070F2] text-white font-bold' : 'text-[#8FA6BF] hover:text-white'
                  }`}
                >
                  Simulador
                </button>
                <button
                  onClick={() => setActiveHeroTab('matrix')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    activeHeroTab === 'matrix' ? 'bg-[#0070F2] text-white font-bold' : 'text-[#8FA6BF] hover:text-white'
                  }`}
                >
                  Matriz Operativa
                </button>
                <button
                  onClick={() => setActiveHeroTab('export')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    activeHeroTab === 'export' ? 'bg-[#0070F2] text-white font-bold' : 'text-[#8FA6BF] hover:text-white'
                  }`}
                >
                  Exportación
                </button>
              </div>
            </div>

            {/* Inner Interactive Content depending on Tab */}
            <div className="p-4 sm:p-6 bg-[#111C2E] rounded-xl mt-3 min-h-[300px]">
              {activeHeroTab === 'hierarchy' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Client Identity & Hierarchy */}
                  <div className="space-y-4">
                    <div className="p-4 bg-[#0B1320] rounded-xl border border-[#1C2C42]">
                      <div className="text-[10px] font-bold text-[#8FA6BF] uppercase tracking-wider mb-2">
                        Nivel 1: Cliente Activo
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center">
                          <span className="text-slate-900 font-black text-xs">weber</span>
                        </div>
                        <div>
                          <div className="font-extrabold text-white text-sm">Weber Saint-Gobain</div>
                          <div className="text-[11px] text-[#8FA6BF] font-mono">Ambiente Productivo Enterprise · 4 Proyectos</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="text-[10px] font-bold text-[#8FA6BF] uppercase tracking-wider px-1">
                        Nivel 2: Proyectos del Cliente
                      </div>
                      <div className="p-2.5 bg-[#0070F2]/15 rounded-lg border border-[#0070F2]/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-[#4DB1FF]" />
                          <span className="font-bold text-white">Logística WMS con HU</span>
                        </div>
                        <span className="text-[10px] text-[#4DB1FF] font-mono">3 Manuales</span>
                      </div>
                      <div className="p-2.5 bg-[#0B1320]/60 rounded-lg border border-[#1C2C42] flex items-center justify-between text-[#8FA6BF]">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-[#8FA6BF]" />
                          <span>Planificación de Producción</span>
                        </div>
                        <span className="text-[10px] text-[#8FA6BF] font-mono">2 Manuales</span>
                      </div>
                      <div className="p-2.5 bg-[#0B1320]/60 rounded-lg border border-[#1C2C42] flex items-center justify-between text-[#8FA6BF]">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-[#8FA6BF]" />
                          <span>Aseguramiento de Calidad</span>
                        </div>
                        <span className="text-[10px] text-[#8FA6BF] font-mono">2 Manuales</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Two Columns: Operational Manual Detail */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="p-4 bg-[#0B1320] rounded-xl border border-[#1C2C42] space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#0070F2] text-white flex items-center justify-center font-bold text-xs font-mono">
                            1
                          </span>
                          <h4 className="font-bold text-sm text-white">
                            Creación de Unidad de Manipulación HU en Almacén
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-[#0070F2]/15 text-[#4DB1FF] border border-[#0070F2]/40 font-bold">
                          Código: TRX-WMS-01
                        </span>
                      </div>

                      <p className="text-xs text-[#D2DFEC] leading-relaxed">
                        En el monitor de unidades de manipulación y expedición, seleccione el almacén origen y el material de embalaje. Asigne el código SSCC para la trazabilidad completa en pallets terminados.
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-xs bg-[#111C2E] p-3 rounded-lg border border-[#1C2C42]">
                        <div>
                          <span className="block text-[#8FA6BF] font-bold text-[10px] uppercase">Acción Requerida</span>
                          <span className="text-[#4DB1FF] font-semibold">Clic en "Generar Unidad" / F6</span>
                        </div>
                        <div>
                          <span className="block text-[#8FA6BF] font-bold text-[10px] uppercase">Resultado Esperado</span>
                          <span className="text-[#10B981] font-semibold">Unidad asignada con código SSCC</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] text-[#8FA6BF]">
                          Consejo: Verifique que el lote cuente con estatus de Libre Utilización antes del despacho.
                        </span>
                        <button
                          onClick={() => onEnterApp('cli-weber', 'prj-weber-wms-hu')}
                          className="px-3 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Abrir Espacio de Trabajo</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeHeroTab === 'simulator' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1C2C42]">
                    <div>
                      <h4 className="font-bold text-sm text-white">Simulador Paso a Paso para Usuarios Clave</h4>
                      <p className="text-xs text-[#8FA6BF]">Entrenamiento guiado con navegación por teclado y retroalimentación inmediata</p>
                    </div>
                    <span className="px-2.5 py-1 bg-[#0070F2]/15 border border-[#0070F2]/40 rounded text-[#4DB1FF] text-xs font-mono font-bold">
                      Modo Interactivo
                    </span>
                  </div>

                  <div className="p-4 bg-[#0B1320] rounded-xl border border-[#1C2C42] space-y-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-[#4DB1FF] font-bold">Paso 01/05:</span>
                      <span className="font-semibold text-white">Ingreso de Datos de Cabecera en Transacción TRX-INV-02</span>
                    </div>
                    <div className="p-3 bg-[#111C2E] rounded-lg border border-[#1C2C42] font-mono text-xs text-[#D2DFEC]">
                      &gt; Tipo de movimiento: 101 (Entrada de mercancías por pedido de compras)
                      <br />
                      &gt; Pedido: 4500019284 · Almacén: 0001
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#8FA6BF] pt-1">
                      <span>Atajos: [Enter] Validar datos · [Flecha Derecha] Siguiente paso</span>
                      <button
                        onClick={() => onEnterApp('cli-weber', 'prj-weber-wms-hu')}
                        className="px-3 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
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
                  <div className="flex items-center justify-between pb-3 border-b border-[#1C2C42]">
                    <div>
                      <h4 className="font-bold text-sm text-white">Matriz de Transacciones Operativas &amp; Cobertura</h4>
                      <p className="text-xs text-[#8FA6BF]">Trazabilidad de códigos de transacción por proceso y rol operativo</p>
                    </div>
                    <span className="text-xs text-[#10B981] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Auditable ISO / Gobierno TI
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#1C2C42] text-[#8FA6BF] font-semibold">
                          <th className="py-2 px-3">Código de Transacción</th>
                          <th className="py-2 px-3">Descripción Operativa</th>
                          <th className="py-2 px-3">Proceso</th>
                          <th className="py-2 px-3">Rol Responsable</th>
                          <th className="py-2 px-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1C2C42]/60 font-mono text-[11px]">
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-[#4DB1FF]">TRX-WMS-01</td>
                          <td className="py-2.5 px-3 font-sans text-white">Monitor de Unidades Logísticas y Embalaje</td>
                          <td className="py-2.5 px-3 text-[#8FA6BF]">Almacenes &amp; Expedición</td>
                          <td className="py-2.5 px-3 text-[#8FA6BF]">Operador de Almacén</td>
                          <td className="py-2.5 px-3 text-[#10B981] font-sans font-semibold">Documentado</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-[#4DB1FF]">TRX-INV-02</td>
                          <td className="py-2.5 px-3 font-sans text-white">Entrada de Mercancías por Pedido de Compras</td>
                          <td className="py-2.5 px-3 text-[#8FA6BF]">Inventarios &amp; Compras</td>
                          <td className="py-2.5 px-3 text-[#8FA6BF]">Recepción de Materias Primas</td>
                          <td className="py-2.5 px-3 text-[#10B981] font-sans font-semibold">Documentado</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-[#4DB1FF]">TRX-PRD-05</td>
                          <td className="py-2.5 px-3 font-sans text-white">Creación y Liberación de Orden de Fabricación</td>
                          <td className="py-2.5 px-3 text-[#8FA6BF]">Fabricación &amp; Planta</td>
                          <td className="py-2.5 px-3 text-[#8FA6BF]">Planificador de Planta</td>
                          <td className="py-2.5 px-3 text-[#10B981] font-sans font-semibold">Documentado</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeHeroTab === 'export' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1C2C42]">
                    <div>
                      <h4 className="font-bold text-sm text-white">Exportación Masiva &amp; Portales Autónomos</h4>
                      <p className="text-xs text-[#8FA6BF]">Genera entregables en segundos para áreas de TI, auditoría y usuarios finales</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-[#0B1320] rounded-xl border border-[#1C2C42] space-y-1">
                      <div className="font-bold text-[#4DB1FF]">Portal HTML por Cliente</div>
                      <p className="text-[11px] text-[#8FA6BF] leading-normal">
                        1 archivo HTML offline con todos los manuales, motor de búsqueda y simulador interactivo embebido.
                      </p>
                    </div>
                    <div className="p-3 bg-[#0B1320] rounded-xl border border-[#1C2C42] space-y-1">
                      <div className="font-bold text-[#00C3D8]">Paquete ZIP Completo</div>
                      <p className="text-[11px] text-[#8FA6BF] leading-normal">
                        Estructura limpia para almacenar y distribuir en repositorios y plataformas internas compartidas.
                      </p>
                    </div>
                    <div className="p-3 bg-[#0B1320] rounded-xl border border-[#1C2C42] space-y-1">
                      <div className="font-bold text-[#F59E0B]">Dossier PDF Oficial</div>
                      <p className="text-[11px] text-[#8FA6BF] leading-normal">
                        Portada institucional, ficha técnica de 4 columnas de auditoría e índice foliado automático.
                      </p>
                    </div>
                    <div className="p-3 bg-[#0B1320] rounded-xl border border-[#1C2C42] space-y-1">
                      <div className="font-bold text-[#99D5FF]">Word (.docx) Editable</div>
                      <p className="text-[11px] text-[#8FA6BF] leading-normal">
                        Documento listo para ajustes de estilo editorial corporativo y versionamiento documental interno.
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
      <section id="bondades" className="py-20 px-4 border-b border-[#1C2C42] bg-[#0B1320]">
        <div className="w-[96%] max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3">
            <div className="text-xs font-semibold text-[#4DB1FF] tracking-wide">
              Capacidades &amp; Arquitectura de Software
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-balance">
              Las Grandes Bondades de ManualCraft Enterprise
            </h2>
            <p className="text-sm text-[#8FA6BF] max-w-2xl mx-auto">
              Supera la fricción de la documentación estática con una arquitectura pensada para consultores de procesos, líderes funcionales y usuarios operativos.
            </p>
          </div>

          {/* Asymmetric Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Hierarchy (Col-span 2 for Marquee visual dominance) */}
            <div id="jerarquia" className="md:col-span-2 p-6 sm:p-8 bg-[#111C2E] rounded-2xl border border-[#1C2C42] hover:border-[#273B56] transition-colors flex flex-col justify-between space-y-4 scroll-mt-24">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#4DB1FF]">
                  01. GOBERNANZA MULTI-CLIENTE
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Jerarquía Corporativa Estricta de 3 Niveles
                </h3>
                <p className="text-sm text-[#D2DFEC] leading-relaxed max-w-2xl">
                  Estructuración rigurosa para consultoras y organizaciones corporativas: <strong>Cliente</strong> (ej. Weber, ACME, Nexus) → <strong>Proyectos y Procesos Transaccionales</strong> (Logística WMS, Facturación Electrónica, Gestión de Planta) → <strong>Manuales Operativos Paso a Paso</strong>. Permite mantener aislamiento de datos o navegar el portafolio consolidado en un solo clic.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#1C2C42] text-xs">
                <div className="p-3 bg-[#0B1320] rounded-xl border border-[#1C2C42]">
                  <div className="font-bold text-white mb-0.5">Nivel 1: Clientes</div>
                  <span className="text-[#8FA6BF] text-[11px]">Logo corporativo, código ERP, industria y proyectos asignados.</span>
                </div>
                <div className="p-3 bg-[#0B1320] rounded-xl border border-[#1C2C42]">
                  <div className="font-bold text-white mb-0.5">Nivel 2: Proyectos</div>
                  <span className="text-[#8FA6BF] text-[11px]">Ambiente productivo, versión del sistema, equipo consultor y códigos de proceso.</span>
                </div>
                <div className="p-3 bg-[#0B1320] rounded-xl border border-[#1C2C42]">
                  <div className="font-bold text-white mb-0.5">Nivel 3: Manuales</div>
                  <span className="text-[#8FA6BF] text-[11px]">Pasos guiados interactivos, capturas marcadas y notas operativas.</span>
                </div>
              </div>
            </div>

            {/* Card 2: Interactive Simulator */}
            <div className="p-6 sm:p-8 bg-[#111C2E] rounded-2xl border border-[#1C2C42] hover:border-[#273B56] transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#4DB1FF]">
                  02. SIMULADOR PASO A PASO
                </div>
                <h3 className="text-xl font-bold text-white">
                  Capacitación Guiada para Usuarios
                </h3>
                <p className="text-xs text-[#D2DFEC] leading-relaxed">
                  Los operadores no adquieren destreza leyendo manuales estáticos interminables; aprenden interactuando. El simulador recrea el flujo operativo con navegación por teclado, campos de acción destacados y respuestas del sistema central.
                </p>
              </div>

              <div className="p-3 bg-[#0B1320] rounded-xl border border-[#1C2C42] text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-[#D2DFEC] font-semibold">
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Navegación con teclas de dirección</span>
                </div>
                <div className="flex items-center gap-2 text-[#D2DFEC] font-semibold">
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Destacado de campos críticos en pantalla</span>
                </div>
                <div className="flex items-center gap-2 text-[#D2DFEC] font-semibold">
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Validación de mensajes de respuesta operativa</span>
                </div>
              </div>
            </div>

            {/* Card 3: Offline HTML Portals */}
            <div id="formatos" className="p-6 sm:p-8 bg-[#111C2E] rounded-2xl border border-[#1C2C42] hover:border-[#273B56] transition-colors flex flex-col justify-between space-y-4 scroll-mt-24">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#4DB1FF]">
                  03. PORTALES HTML OFFLINE
                </div>
                <h3 className="text-xl font-bold text-white">
                  Exportación por Cliente en 1 Clic
                </h3>
                <p className="text-xs text-[#D2DFEC] leading-relaxed">
                  Genera un portal interactivo empaquetado en un único archivo HTML por cliente. Abre directamente en cualquier navegador moderno sin requerir servidores web, NodeJS ni bases de datos activas.
                </p>
              </div>

              <div className="p-3 bg-[#0B1320] rounded-xl border border-[#1C2C42] text-xs text-[#8FA6BF] space-y-1">
                <div className="text-white font-semibold">Portabilidad Absoluta:</div>
                <div>Llévalo en una memoria física, compártelo por correo o publícalo en la intranet corporativa en segundos.</div>
              </div>
            </div>

            {/* Card 4: Co-Branding Dual & Plantilla Oficial */}
            <div className="p-6 sm:p-8 bg-[#111C2E] rounded-2xl border border-[#1C2C42] hover:border-[#273B56] transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#4DB1FF]">
                  04. CO-BRANDING CORPORATIVO
                </div>
                <h3 className="text-xl font-bold text-white">
                  Doble Logotipo &amp; Ficha de Auditoría
                </h3>
                <p className="text-xs text-[#D2DFEC] leading-relaxed">
                  Portada con identidad conjunta: Tu firma emisora (ej. {branding?.companyName || 'HSBT'}) junto al logotipo oficial de tu cliente (Weber, ACME). Incluye tabla de control documental de 4 columnas (Código, Versión, Aprobador, Fecha).
                </p>
              </div>

              <div className="p-3 bg-[#0B1320] rounded-xl border border-[#1C2C42] text-xs text-[#8FA6BF] space-y-1">
                <div className="text-white font-semibold">Aprobación Institucional:</div>
                <div>Cumple con directrices estrictas de comités de TI, control interno y auditorías de calidad.</div>
              </div>
            </div>

            {/* Card 5: Operational Process Matrix */}
            <div className="p-6 sm:p-8 bg-[#111C2E] rounded-2xl border border-[#1C2C42] hover:border-[#273B56] transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-[#4DB1FF]">
                  05. MATRIZ DE PROCESOS Y TRANSACCIONES
                </div>
                <h3 className="text-xl font-bold text-white">
                  Trazabilidad por Código &amp; Rol
                </h3>
                <p className="text-xs text-[#D2DFEC] leading-relaxed">
                  Catalogación inteligente de transacciones y operaciones operativas vinculadas a cada paso del manual, permitiendo búsquedas rápidas por código de proceso o rol funcional.
                </p>
              </div>

              <div className="p-3 bg-[#0B1320] rounded-xl border border-[#1C2C42] text-xs text-[#8FA6BF] space-y-1">
                <div className="text-white font-semibold">Trazabilidad Total:</div>
                <div>Localiza de inmediato qué manual cubre cada transacción antes de una salida en productivo.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. LIVE INTERACTIVE WALKTHROUGH DEMO */}
      {/* ============================================================== */}
      <section id="simulador" className="py-20 px-4 border-b border-[#1C2C42] bg-[#111C2E]/50">
        <div className="w-[96%] max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="text-xs font-semibold text-[#00C3D8] tracking-wide">
              Demostración en Vivo
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Experimenta el Flujo Interactivo Paso a Paso
            </h2>
            <p className="text-xs text-[#8FA6BF] max-w-xl mx-auto">
              Comprueba cómo los usuarios navegan y comprenden una transacción operativa en cuestión de segundos:
            </p>
          </div>

          {/* Interactive Step Card */}
          <div className="bg-[#0B1320] rounded-2xl border border-[#1C2C42] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 bg-[#111C2E] border-b border-[#1C2C42] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-[#0070F2] text-white font-bold flex items-center justify-center text-xs font-mono">
                  {demoStepIndex + 1}
                </span>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {demoSteps[demoStepIndex].title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#8FA6BF] font-mono">
                    <span>Transacción: {demoSteps[demoStepIndex].tx}</span>
                    <span aria-hidden="true" className="text-[#1C2C42]">·</span>
                    <span>Proceso: {demoSteps[demoStepIndex].module}</span>
                    <span aria-hidden="true" className="text-[#1C2C42]">·</span>
                    <span>Cliente: {demoSteps[demoStepIndex].client}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8FA6BF] font-medium font-mono">
                  Paso {demoStepIndex + 1} de {demoSteps.length}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#D2DFEC] leading-relaxed">
                {demoSteps[demoStepIndex].description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#111C2E] rounded-xl border border-[#1C2C42]">
                  <span className="block text-[10px] uppercase font-bold text-[#8FA6BF] mb-1">
                    Acción &amp; Elemento en Pantalla
                  </span>
                  <div className="font-bold text-[#4DB1FF]">
                    {demoSteps[demoStepIndex].action} · {demoSteps[demoStepIndex].element}
                  </div>
                </div>

                <div className="p-3 bg-[#111C2E] rounded-xl border border-[#1C2C42]">
                  <span className="block text-[10px] uppercase font-bold text-[#8FA6BF] mb-1">
                    Respuesta del Sistema Central
                  </span>
                  <div className="font-semibold text-[#10B981]">
                    {demoSteps[demoStepIndex].expected}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#0070F2]/10 rounded-xl border border-[#0070F2]/30 text-xs text-[#4DB1FF]">
                <strong>Consejo del Especialista:</strong> {demoSteps[demoStepIndex].tip}
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="p-4 bg-[#111C2E]/80 border-t border-[#1C2C42] flex items-center justify-between">
              <button
                onClick={() => setDemoStepIndex((i) => Math.max(0, i - 1))}
                disabled={demoStepIndex === 0}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-[#23354E] text-[#D2DFEC] hover:bg-[#1B2A41] disabled:opacity-40 transition-colors cursor-pointer"
              >
                ← Anterior
              </button>

              <div className="flex items-center gap-1.5">
                {demoSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDemoStepIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      idx === demoStepIndex ? 'bg-[#0070F2] w-5' : 'bg-[#1C2C42]'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setDemoStepIndex((i) => Math.min(demoSteps.length - 1, i + 1))}
                disabled={demoStepIndex === demoSteps.length - 1}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#0070F2] hover:bg-[#0064D9] text-white disabled:opacity-40 transition-colors cursor-pointer"
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
      <section className="py-20 px-4 border-b border-[#1C2C42] bg-[#0B1320]">
        <div className="w-[96%] max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="text-xs font-semibold text-[#4DB1FF] tracking-wide">
              Análisis Comparativo
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              ¿Por Qué las Empresas Eligen ManualCraft Enterprise?
            </h2>
            <p className="text-xs text-[#8FA6BF] max-w-xl mx-auto">
              Comparativa frente al modelo tradicional de manuales estáticos en PDF o carpetas compartidas:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old Way */}
            <div className="p-6 bg-[#111C2E]/60 rounded-2xl border border-rose-950/60 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <span>Manuales Tradicionales (PDF / Word Sueltos)</span>
              </div>
              <ul className="space-y-3 text-xs text-[#8FA6BF]">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Documentos de más de 150 páginas que nadie lee ni consulta al operar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Capturas de pantalla estáticas, sin interacción ni contexto de acción operativa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Desactualización inmediata tras cambios o actualizaciones del sistema ERP.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Archivos pesados difíciles de compartir o restringidos por buzones de correo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Formatos heterogéneos sin estándar visual entre diferentes especialistas.</span>
                </li>
              </ul>
            </div>

            {/* ManualCraft AI Way */}
            <div className="p-6 bg-[#111C2E] rounded-2xl border border-[#0070F2]/40 space-y-4">
              <div className="flex items-center gap-2 text-[#4DB1FF] font-bold text-sm">
                <Sparkles className="w-4 h-4 text-[#4DB1FF]" />
                <span>ManualCraft Enterprise Suite</span>
              </div>
              <ul className="space-y-3 text-xs text-[#D2DFEC]">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Simulador interactivo donde el usuario practica haciendo ("learning by doing").</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Portales web HTML autónomos offline con motor de búsqueda en tiempo real.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Jerarquía estricta por Cliente y Proyecto con filtrado instantáneo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Doble marca institucional (Emisor + Cliente) y ficha de auditoría de 4 columnas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>Exportación masiva en HTML, paquetes ZIP corporativos, PDF y Word editable.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. REAL CLIENT SHOWCASE & INSTANT LAUNCH CARDS */}
      {/* ============================================================== */}
      <section id="clientes" className="py-20 px-4 border-b border-[#1C2C42] bg-[#111C2E]/30">
        <div className="w-[96%] max-w-6xl mx-auto space-y-10 text-center">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#4DB1FF] tracking-wide">
              Portafolio Preconfigurado
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Explora Espacios de Clientes Listos para Usar
            </h2>
            <p className="text-xs text-[#8FA6BF] max-w-xl mx-auto">
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
                  className="p-6 bg-[#0B1320] rounded-2xl border border-[#1C2C42] hover:border-[#0070F2]/70 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
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
                      <span className="text-[11px] font-mono text-[#4DB1FF] bg-[#0070F2]/15 px-2 py-0.5 rounded border border-[#0070F2]/40 font-bold">
                        {c.code || 'ERP'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white text-base group-hover:text-[#4DB1FF] transition-colors">
                        {c.name}
                      </h4>
                      <p className="text-xs text-[#8FA6BF] line-clamp-2 mt-1">
                        {c.industry || c.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#8FA6BF] font-medium font-mono">
                      <span>{clientProjs.length} Proyecto(s)</span>
                      <span aria-hidden="true" className="text-[#1C2C42]">·</span>
                      <span>{clientMans.length} Manual(es)</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1C2C42] flex items-center justify-between text-xs font-semibold text-[#4DB1FF] group-hover:text-[#99D5FF]">
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
      <section className="py-20 px-4 bg-gradient-to-b from-[#0B1320] to-[#111C2E] text-center relative overflow-hidden">
        <div className="w-[96%] max-w-4xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-balance">
            Comienza a Documentar tus Procesos Empresariales con Rigor Corporativo
          </h2>
          <p className="text-sm sm:text-base text-[#D2DFEC] max-w-2xl mx-auto">
            Accede a la herramienta, administra tus proyectos, prueba el simulador y genera manuales interactivos en HTML, PDF y Word listos para entregar.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onEnterApp()}
              className="px-8 py-4 bg-[#0070F2] hover:bg-[#0064D9] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-[#0070F2]/30 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer"
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
      <footer className="py-8 px-4 border-t border-[#1C2C42] bg-[#0B1320] text-xs text-[#8FA6BF]">
        <div className="w-[96%] max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">ManualCraft Enterprise</span>
            <span aria-hidden="true" className="text-[#1C2C42]">·</span>
            <span>Documentación Operativa Especializada para Sistemas ERP &amp; Gestión Core</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Emisor: <strong className="text-white">{branding?.companyName || 'HSBT'}</strong></span>
            <span aria-hidden="true" className="text-[#1C2C42]">·</span>
            <button
              onClick={() => onEnterApp()}
              className="text-[#4DB1FF] hover:text-[#99D5FF] font-semibold transition-colors cursor-pointer"
            >
              Acceso Directo a la Herramienta →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
