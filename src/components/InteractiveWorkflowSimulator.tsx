import React, { useState, useRef } from 'react';
import {
  MousePointer,
  Keyboard,
  Save,
  CheckCircle2,
  Sparkles,
  Play,
  RotateCcw,
  Zap,
  ArrowRight,
  Eye,
  Trash2,
} from 'lucide-react';
import { UserManual, ManualStep } from '../types/manual';

interface CapturedAction {
  id: string;
  type: 'click' | 'type' | 'enter' | 'save';
  title: string;
  description: string;
  targetElement: string;
  dataUrl: string;
  x: number; // percentage
  y: number; // percentage
  timestamp: number;
}

interface InteractiveWorkflowSimulatorProps {
  onManualGeneratedFromActions: (manual: UserManual) => void;
  onClose: () => void;
}

export const InteractiveWorkflowSimulator: React.FC<InteractiveWorkflowSimulatorProps> = ({
  onManualGeneratedFromActions,
  onClose,
}) => {
  // Simulator form fields
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [docType, setDocType] = useState('Factura');
  const [amount, setAmount] = useState('450.00');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'datos' | 'partidas' | 'resumen'>('datos');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // List of automatically captured user actions
  const [capturedActions, setCapturedActions] = useState<CapturedAction[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to take an SVG snapshot of the simulator element
  const takeSnapshot = (
    type: 'click' | 'type' | 'enter' | 'save',
    title: string,
    description: string,
    targetElement: string,
    xPercent = 50,
    yPercent = 50
  ) => {
    // Generate clean SVG representation of simulator state
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="800" height="480">
      <defs>
        <linearGradient id="simBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      <rect width="800" height="480" rx="10" fill="url(#simBg)"/>
      <rect width="800" height="38" fill="#1e293b"/>
      <circle cx="20" cy="19" r="5" fill="#ef4444"/>
      <circle cx="36" cy="19" r="5" fill="#f59e0b"/>
      <circle cx="52" cy="19" r="5" fill="#10b981"/>
      <text x="75" y="23" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11">ERP Empresarial Pro · Sistema en Vivo</text>

      <!-- Content -->
      <rect x="25" y="55" width="750" height="400" rx="8" fill="#ffffff"/>
      <text x="50" y="95" fill="#0f172a" font-family="system-ui, sans-serif" font-weight="700" font-size="16">Formulario de Registro y Facturación</text>
      
      <!-- Tabs -->
      <rect x="50" y="115" width="100" height="26" rx="4" fill="${activeTab === 'datos' ? '#4f46e5' : '#f1f5f9'}"/>
      <text x="68" y="132" fill="${activeTab === 'datos' ? '#ffffff' : '#64748b'}" font-family="system-ui, sans-serif" font-size="11" font-weight="600">1. Datos</text>

      <rect x="160" y="115" width="100" height="26" rx="4" fill="${activeTab === 'partidas' ? '#4f46e5' : '#f1f5f9'}"/>
      <text x="175" y="132" fill="${activeTab === 'partidas' ? '#ffffff' : '#64748b'}" font-family="system-ui, sans-serif" font-size="11" font-weight="600">2. Partidas</text>

      <!-- Fields -->
      <rect x="50" y="160" width="340" height="50" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="65" y="180" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">RAZÓN SOCIAL / CLIENTE</text>
      <text x="65" y="200" fill="#0f172a" font-family="system-ui, sans-serif" font-size="13">${clientName || '(Vacío)'}</text>

      <rect x="410" y="160" width="340" height="50" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="425" y="180" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">CORREO ELECTRÓNICO</text>
      <text x="425" y="200" fill="#0f172a" font-family="system-ui, sans-serif" font-size="13">${clientEmail || '(Vacío)'}</text>

      <rect x="50" y="230" width="340" height="50" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="65" y="250" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">TIPO DE COMPROBANTE</text>
      <text x="65" y="270" fill="#0f172a" font-family="system-ui, sans-serif" font-size="13">${docType}</text>

      <rect x="410" y="230" width="340" height="50" rx="6" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="425" y="250" fill="#64748b" font-family="system-ui, sans-serif" font-size="10">IMPORTE TOTAL</text>
      <text x="425" y="270" fill="#4f46e5" font-family="system-ui, sans-serif" font-size="13" font-weight="700">$${amount} USD</text>

      <!-- Save Button -->
      <rect x="580" y="380" width="170" height="42" rx="6" fill="${savedSuccess ? '#10b981' : '#4f46e5'}"/>
      <text x="610" y="406" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="13">${savedSuccess ? '✓ Registrado' : '💾 Grabar Datos'}</text>
    </svg>`;

    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    const newAction: CapturedAction = {
      id: `act-${Date.now()}-${Math.random()}`,
      type,
      title,
      description,
      targetElement,
      dataUrl,
      x: xPercent,
      y: yPercent,
      timestamp: Date.now(),
    };

    setCapturedActions((prev) => [...prev, newAction]);
  };

  // 1. CLICK EVENT
  const handleTabClick = (tab: 'datos' | 'partidas' | 'resumen') => {
    setActiveTab(tab);
    takeSnapshot(
      'click',
      `Haz clic en la pestaña '${tab.toUpperCase()}'`,
      `El usuario navega entre las secciones del formulario seleccionando la pestaña correspondiente.`,
      `Pestaña '${tab}'`,
      tab === 'datos' ? 15 : 30,
      27
    );
  };

  // 2. INPUT COMPLETION EVENT
  const handleInputBlur = (field: string, value: string) => {
    if (!value.trim()) return;
    takeSnapshot(
      'type',
      `Completa el campo '${field}'`,
      `Introduce el valor "${value}" en el campo de entrada '${field}' para continuar con el registro.`,
      `Campo '${field}'`,
      field === 'Razón Social' ? 25 : 65,
      39
    );
  };

  // 3. ENTER KEY EVENT
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, fieldName: string) => {
    if (e.key === 'Enter') {
      takeSnapshot(
        'enter',
        `Presiona la tecla [Enter] en '${fieldName}'`,
        `Al presionar Enter en el campo '${fieldName}', el sistema valida el dato y enfoca automáticamente el siguiente paso.`,
        `Input '${fieldName}' (Tecla Enter)`,
        fieldName === 'Búsqueda de Catálogo' ? 45 : 30,
        42
      );
    }
  };

  // 4. GRABAR / SAVE EVENT
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    takeSnapshot(
      'save',
      `Haz clic en el botón 'Grabar / Guardar'`,
      `Confirma y persiste la información registrada en la base de datos haciendo clic en el botón principal de Guardar.`,
      `Botón 'Grabar Datos'`,
      85,
      85
    );
  };

  // Generate complete user manual from captured actions
  const handleCompileToManual = () => {
    if (capturedActions.length === 0) {
      alert('Primero interactúa con el formulario para registrar al menos una acción.');
      return;
    }

    const steps: ManualStep[] = capturedActions.map((act, idx) => ({
      id: `step-auto-${idx + 1}-${Date.now()}`,
      stepNumber: idx + 1,
      title: act.title,
      actionType: act.type,
      interactionTrigger: act.type as any,
      description: act.description,
      targetElement: act.targetElement,
      expectedResult:
        act.type === 'save'
          ? 'El sistema guardará la transacción y mostrará confirmación de éxito.'
          : 'El dato o acción quedará registrado en la interfaz.',
      image: act.dataUrl,
      annotations: [
        {
          id: `ann-${idx}`,
          x: act.x,
          y: act.y,
          shape: 'circle',
          color: act.type === 'save' ? '#10b981' : '#ef4444',
          label: act.targetElement,
        },
      ],
    }));

    const newManual: UserManual = {
      id: `manual-auto-${Date.now()}`,
      title: 'Manual de Flujo: Registro y Guardado de Transacción',
      subtitle: 'Guía paso a paso generada automáticamente por detección de clics, inputs y eventos Enter',
      overview:
        'Este manual documenta el flujo completo ejecutado por el usuario, capturando automáticamente cada llenado de campo, tecla Enter y confirmación de guardado.',
      targetAudience: 'Operadores de sistema y nuevos colaboradores',
      estimatedMinutes: 3,
      difficulty: 'Principiante',
      prerequisites: ['Acceso con credenciales al sistema de facturación'],
      steps,
      summaryChecklist: [
        'Datos del cliente completados',
        'Importes validados',
        'Botón Grabar presionado con confirmación exitosa',
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0',
    };

    onManualGeneratedFromActions(newManual);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-1 sm:p-2 overflow-hidden select-none">
      <div className="bg-white rounded-2xl shadow-2xl w-[98vw] max-w-[98vw] h-[96vh] max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Capturador Inteligente de Acciones (Clics, Inputs, Enter y Grabar)
              </h3>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Interactúa con la interfaz. Cada acción toma una captura automática con coordenadas precisas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-200/60"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Left: Live Interactive App Simulator */}
          <div className="flex-1 p-3 sm:p-4 bg-slate-100 overflow-y-auto lg:overflow-hidden flex flex-col justify-center" ref={containerRef}>
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
              {/* App Bar */}
              <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ERP Empresarial · Modo Captura Activo</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Detectando eventos del mouse y teclado...
                </span>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveSubmit} className="p-4 flex flex-col gap-3">
                {/* Tabs for click detection */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    type="button"
                    onClick={() => handleTabClick('datos')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      activeTab === 'datos'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    1. Datos Generales
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabClick('partidas')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      activeTab === 'partidas'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    2. Partidas & Precios
                  </button>
                </div>

                {/* Search input with Enter detection */}
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <label className="text-xs font-bold text-indigo-950 block mb-1">
                    🔍 Búsqueda Rápida en Catálogo (Presiona [Enter] al escribir)
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'Búsqueda de Catálogo')}
                    placeholder="Escribe 'Suscripción Pro' y presiona ENTER..."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Form fields for input completion */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Razón Social / Cliente *
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      onBlur={() => handleInputBlur('Razón Social', clientName)}
                      onKeyDown={(e) => handleKeyDown(e, 'Razón Social')}
                      placeholder="Ej. Industrias Apex S.A."
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Detecta cuando sales del campo o presionas Enter
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      onBlur={() => handleInputBlur('Correo Electrónico', clientEmail)}
                      placeholder="contacto@empresa.com"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tipo de Comprobante
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => {
                        setDocType(e.target.value);
                        takeSnapshot(
                          'click',
                          `Selecciona '${e.target.value}'`,
                          `El usuario cambia el tipo de documento a ${e.target.value}.`,
                          `Selector 'Tipo de Comprobante'`,
                          25,
                          60
                        );
                      }}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Factura">Factura de Ingreso (A)</option>
                      <option value="Recibo">Recibo de Honorarios</option>
                      <option value="Nota de Crédito">Nota de Crédito</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Importe Total (USD)
                    </label>
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onBlur={() => handleInputBlur('Importe Total', amount)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700"
                    />
                  </div>
                </div>

                {/* Save button */}
                <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {savedSuccess ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> ¡Datos grabados con éxito!
                      </span>
                    ) : (
                      'Presiona Grabar para capturar el paso final de confirmación'
                    )}
                  </div>

                  <button
                    type="submit"
                    className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>💾 Grabar y Guardar Datos</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Live Action Log & Snapshot Stream */}
          <div className="w-full lg:w-84 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white p-3.5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Acciones Capturadas ({capturedActions.length})
                </span>
                {capturedActions.length > 0 && (
                  <button
                    onClick={() => {
                      setCapturedActions([]);
                      setSavedSuccess(false);
                    }}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Reiniciar
                  </button>
                )}
              </div>

              {capturedActions.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-400">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <MousePointer className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">
                    Aún no hay acciones registradas.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Haz clic en una pestaña, llena un campo, presiona Enter o dale a Grabar.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {capturedActions.map((action, idx) => (
                    <div
                      key={action.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 shadow-xs"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                          action.type === 'save'
                            ? 'bg-emerald-600'
                            : action.type === 'enter'
                            ? 'bg-amber-600'
                            : action.type === 'type'
                            ? 'bg-blue-600'
                            : 'bg-indigo-600'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {action.type === 'save'
                              ? '💾 GRABAR'
                              : action.type === 'enter'
                              ? '⌨️ ENTER'
                              : action.type === 'type'
                              ? '📝 INPUT'
                              : '🖱️ CLIC'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {action.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {action.targetElement}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 mt-4">
              <button
                type="button"
                onClick={handleCompileToManual}
                disabled={capturedActions.length === 0}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generar Manual con Estas Acciones</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
