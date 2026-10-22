import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Project, ProjectDocumentOptions } from '../types/project';
import { UserManual, ManualStep } from '../types/manual';
import { Client } from '../types/client';
import { OrganizationBranding } from '../types/branding';
import {
  FolderKanban,
  Building2,
  BookOpen,
  Plus,
  Settings,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FileText,
  Sliders,
  Shield,
  Trash2,
  ArrowRight,
  FolderOpen,
  Eye,
  Check,
  Image,
  X,
  Unlink,
  AlertTriangle,
  Save,
  FileCode2,
  Zap,
  Upload,
  ArrowUp,
  ArrowDown,
  Copy,
  LayoutGrid,
  List,
  Camera,
  RotateCcw,
} from 'lucide-react';

interface ProjectWorkspaceProps {
  project: Project;
  client?: Client | null;
  activeClientId?: string;
  allProjects: Project[];
  manualsInProject: UserManual[];
  allManuals: UserManual[];
  onSelectProject: (projectId: string) => void;
  onOpenManual: (manualId: string) => void;
  onOpenCreateManualForProject: (projectId: string) => void;
  onManualCreated?: (manual: UserManual) => void;
  onOpenProjectSettings: (project: Project) => void;
  onOpenExportProject: (project: Project) => void;
  onUpdateProject: (updatedProject: Project) => void;
  onLinkManualToProject: (manualId: string, projectId: string) => void;
  onUnlinkManualFromProject: (manualId: string) => void;
  onDeleteManual?: (manualId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onOpenManageClientsModal?: () => void;
  onDownloadMasterIndex?: (client: Client) => void;
  branding?: OrganizationBranding;
  onOpenOurLogoModal?: () => void;
}

// Helper to read and compress image files
const readFileAsDataUrl = (fileOrBlob: File | Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1400;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(fileOrBlob);
  });
};

const AGILE_SAP_PRESETS = [
  {
    key: 'SD_VA01',
    label: 'SD: Pedido VA01',
    icon: '📦',
    title: 'Creación de Pedido de Ventas Estándar (VA01)',
    module: 'SD',
    txCode: 'VA01',
    duration: 5,
    steps: [
      {
        title: 'Acceder a la transacción VA01 e indicar clase de pedido',
        actionType: 'type' as const,
        targetElement: 'Campo de Transacción / Clase de Pedido',
        description: 'Ingrese el comando /nVA01 en el campo de transacciones. En el campo "Clase de pedido", digite "ZOR" (Pedido Estándar) y confirme Organización de Ventas (1000), Canal de Distribución (10) y Sector (00).',
        expectedResult: 'El sistema despliega la pantalla principal de pedido: Cabecera y Grilla de Posiciones.',
        instructorNotes: 'Consejo: Verifique que la combinación de área de ventas coincida con el cliente asignado.',
      },
      {
        title: 'Ingresar Solicitante, Destinatario y Número de Pedido de Compra',
        actionType: 'type' as const,
        targetElement: 'Cabecera de Pedido / Solicitante',
        description: 'En el campo "Solicitante", ingrese el código del cliente corporativo. Complete el campo "Pedido cliente" con la referencia de la orden de compra y verifique la fecha preferente de entrega.',
        expectedResult: 'El sistema valida la dirección comercial del cliente y calcula las condiciones de pago.',
        instructorNotes: 'Si el cliente presenta bloqueo por crédito o entrega, el sistema emitirá un aviso en la barra inferior.',
      },
      {
        title: 'Cargar posiciones de material, cantidad y centro suministrador',
        actionType: 'type' as const,
        targetElement: 'Grilla de Posiciones / Material y Cantidad',
        description: 'En la tabla de posiciones, ingrese los códigos de material correspondientes y las cantidades requeridas en la unidad de medida base. Presione Enter para calcular precios e impuestos.',
        expectedResult: 'El sistema determina el esquema de precios, calcula el importe neto total y valida el stock disponible.',
        instructorNotes: 'Valide que el semáforo de disponibilidad ATP marque color verde en todas las líneas.',
      },
      {
        title: 'Verificar estado de documento y grabar (Ctrl+S)',
        actionType: 'click' as const,
        targetElement: 'Botón Guardar / Barra Estándar',
        description: 'Haga clic en el botón Grabar o presione la combinación Ctrl+S. Espere la confirmación del sistema.',
        expectedResult: 'Se genera el mensaje: "El pedido de ventas estándar 10XXXXXX ha sido grabado exitosamente".',
        instructorNotes: 'Copie el número de pedido generado para adjuntarlo a la orden de picking en bodega.',
      },
    ],
  },
  {
    key: 'MM_MIGO',
    label: 'MM: Entrada MIGO',
    icon: '📥',
    title: 'Recepción de Mercancía con Referencia a Pedido (MIGO)',
    module: 'MM',
    txCode: 'MIGO',
    duration: 6,
    steps: [
      {
        title: 'Acceder a MIGO y seleccionar "Entrada de mercancías - Pedido"',
        actionType: 'select' as const,
        targetElement: 'Transacción MIGO / Menú de Operación',
        description: 'En la pantalla inicial de MIGO, seleccione en el primer desplegable "A01 Entrada de mercancías" y en el segundo "R01 Pedido". Digite el número de pedido de compras (45XXXXXXXX).',
        expectedResult: 'El sistema carga automáticamente todas las posiciones del pedido pendientes de recepción.',
        instructorNotes: 'Verifique que la fecha de documento corresponda a la recepción física en el andén.',
      },
      {
        title: 'Verificar cantidad física recibida, lote y almacén de destino',
        actionType: 'type' as const,
        targetElement: 'Detalle de Posición / Pestaña Cantidad y Almacén',
        description: 'Verifique las unidades contadas físicamente contra la guía de despacho del proveedor. Si hay lote, ingrese el código del fabricante y asigne el almacén correspondiente.',
        expectedResult: 'El sistema valida que la cantidad no exceda la tolerancia de sobreentrega configurada.',
        instructorNotes: 'En caso de discrepancia menor, registre la cantidad real recibida para generar recepción parcial.',
      },
      {
        title: 'Marcar casilla "Posición OK" para cada material recepcionado',
        actionType: 'click' as const,
        targetElement: 'Casilla Posición OK',
        description: 'En la parte inferior de cada posición validada, marque la casilla de verificación "Posición OK".',
        expectedResult: 'El indicador de estado de la posición cambia a verificado (color verde).',
        instructorNotes: 'No es posible contabilizar si al menos una posición no cuenta con el check de conformidad.',
      },
      {
        title: 'Verificar documento y presionar "Contabilizar"',
        actionType: 'click' as const,
        targetElement: 'Botón Contabilizar / Barra de Herramientas MIGO',
        description: 'Haga clic en el botón "Verificar" para una última auditoría de consistencia y posteriormente presione "Contabilizar".',
        expectedResult: 'El sistema genera el documento de material 50XXXXXXXX y actualiza el stock contable.',
        instructorNotes: 'El documento de material es el comprobante oficial para el área de Cuentas por Pagar (MIRO).',
      },
    ],
  },
  {
    key: 'WM_HU',
    label: 'WM/HU: Ubicación LT01',
    icon: '🏷️',
    title: 'Creación de Orden de Transporte para Ubicación de HU (LT01)',
    module: 'WM',
    txCode: 'LT01',
    duration: 4,
    steps: [
      {
        title: 'Iniciar transacción LT01 y definir número de almacén',
        actionType: 'type' as const,
        targetElement: 'Transacción LT01 / Número de Almacén',
        description: 'Ingrese a la transacción LT01. Indique el número de almacén (ej. 100), la clase de movimiento (ej. 999 o 101) y el código de material o número de Unidad de Manipulación (HU).',
        expectedResult: 'El sistema despliega la pantalla de preparación de orden de transporte.',
        instructorNotes: 'Asegúrese de contar con la pistola o terminal de radiofrecuencia sincronizada si opera en bodega.',
      },
      {
        title: 'Ingresar tipo de almacén y ubicación técnica de destino',
        actionType: 'type' as const,
        targetElement: 'Ubicación de Destino / Tipo de Almacén',
        description: 'Indique el tipo de almacén de destino (ej. 001 - Estantería alta) y la coordenada exacta de ubicación (ej. PASILLO-04-NIVEL-02).',
        expectedResult: 'El sistema valida la capacidad física y restricciones de peso de la ubicación seleccionada.',
        instructorNotes: 'Si la ubicación está ocupada por otro lote incompatible, el sistema alertará el bloqueo de casilla.',
      },
      {
        title: 'Confirmar y generar la Orden de Transporte (OT)',
        actionType: 'click' as const,
        targetElement: 'Botón Guardar OT (F11)',
        description: 'Presione el botón Guardar o presione F11 para generar el número correlativo de la Orden de Transporte.',
        expectedResult: 'Se genera el mensaje en pantalla: "Orden de transporte XXXXXXXX creada".',
        instructorNotes: 'La OT queda lista para su posterior confirmación en la transacción LT12.',
      },
    ],
  },
  {
    key: 'FI_FB01',
    label: 'FI: Asiento FB01',
    icon: '💼',
    title: 'Contabilización de Documento Contable General (FB01)',
    module: 'FI',
    txCode: 'FB01',
    duration: 5,
    steps: [
      {
        title: 'Completar datos de cabecera del documento',
        actionType: 'type' as const,
        targetElement: 'Cabecera de Documento / Sociedad y Moneda',
        description: 'Ingrese la fecha de documento, fecha de contabilización, clase de documento (ej. SA), sociedad (ej. 1000) y moneda (ej. CLP o USD). En la primera posición, defina la clave de contabilización (40 Debe / 50 Haber) y la cuenta de mayor.',
        expectedResult: 'El sistema valida que el periodo contable se encuentre abierto en la sociedad.',
        instructorNotes: 'Si el periodo contable está cerrado, contacte al área de Control de Gestión.',
      },
      {
        title: 'Ingresar importe de la posición y asignación de Centro de Costo',
        actionType: 'type' as const,
        targetElement: 'Detalle de Posición / Importe y CeCo',
        description: 'Digite el importe correspondiente a la cuenta, asigne el Centro de Costo (CeCo) obligatorio y agregue el texto descriptivo de la operación.',
        expectedResult: 'El sistema verifica las imputaciones analíticas y reglas de derivación de CO.',
        instructorNotes: 'El texto descriptivo facilitará la conciliación bancaria y auditorías posteriores.',
      },
      {
        title: 'Ingresar contrapartida, simular y contabilizar documento',
        actionType: 'click' as const,
        targetElement: 'Menú Documento / Simular y Grabar',
        description: 'Ingrese la clave de contrapartida (50), cuenta contable e importe. En el menú superior, presione "Documento > Simular". Una vez verificado que el saldo Debe y Haber sea cero, presione "Contabilizar".',
        expectedResult: 'El sistema genera el mensaje: "El documento 1000000XX se contabilizó en la sociedad 1000".',
        instructorNotes: 'Verifique siempre que el saldo final en la ventana de simulación sea exactamente 0,00.',
      },
    ],
  },
];

const ProjectWorkspaceComponent: React.FC<ProjectWorkspaceProps> = ({
  project,
  client,
  activeClientId = '',
  allProjects,
  manualsInProject,
  allManuals,
  onSelectProject,
  onOpenManual,
  onOpenCreateManualForProject,
  onManualCreated,
  onOpenProjectSettings,
  onOpenExportProject,
  onUpdateProject,
  onLinkManualToProject,
  onUnlinkManualFromProject,
  onDeleteManual,
  onDeleteProject,
  onOpenManageClientsModal,
  onDownloadMasterIndex,
  branding,
  onOpenOurLogoModal,
}) => {
  const [activeTab, setActiveTab] = useState<'manuals' | 'features' | 'info'>('manuals');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [manualToDelete, setManualToDelete] = useState<UserManual | null>(null);
  const [isDeleteProjectConfirmOpen, setIsDeleteProjectConfirmOpen] = useState(false);
  const [isBlockedProjectModalOpen, setIsBlockedProjectModalOpen] = useState(false);

  // Agile Ingestion Workspace state (Active by default if project has 0 manuals)
  const [isAgileEntryMode, setIsAgileEntryMode] = useState<boolean>(() => manualsInProject.length === 0);
  const [catalogViewMode, setCatalogViewMode] = useState<'grid' | 'table'>('grid');

  const [agileTitle, setAgileTitle] = useState('');
  const [agileModule, setAgileModule] = useState('SD');
  const [agileTxCode, setAgileTxCode] = useState('');
  const [agileAudience, setAgileAudience] = useState('Usuarios operativos y analistas');
  const [agileMinutes, setAgileMinutes] = useState(5);
  const [activeStepForPaste, setActiveStepForPaste] = useState<string | null>(null);
  const [isSavingAgile, setIsSavingAgile] = useState(false);
  const [agileSaveSuccess, setAgileSaveSuccess] = useState<string | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState(false);
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);

  const [agileSteps, setAgileSteps] = useState<ManualStep[]>([
    {
      id: `step-init-1`,
      stepNumber: 1,
      title: 'Ingresar a la transacción y definir parámetros iniciales',
      actionType: 'type',
      targetElement: 'Pantalla de acceso / Campo de Transacción',
      description: 'Acceda a la transacción operativa e indique los criterios organizativos correspondientes a la sociedad y centro.',
      expectedResult: 'El sistema despliega el formulario operativo principal.',
      annotations: [],
    },
    {
      id: `step-init-2`,
      stepNumber: 2,
      title: 'Completar datos de cabecera y posiciones operativas',
      actionType: 'type',
      targetElement: 'Grilla de posiciones / Datos de entrega',
      description: 'Ingrese los códigos de material, cantidades solicitadas y almacén de expedición. Valide que los valores obligatorios no contengan advertencias.',
      expectedResult: 'Las posiciones se validan con estado conforme.',
      annotations: [],
    },
    {
      id: `step-init-3`,
      stepNumber: 3,
      title: 'Verificar consistencia y contabilizar documento',
      actionType: 'click',
      targetElement: 'Botón Guardar / Contabilizar (Ctrl+S / F11)',
      description: 'Presione el botón Grabar o Contabilizar en la barra de herramientas estándar para consolidar el documento.',
      expectedResult: 'El sistema genera el número de documento oficial en la barra de estado inferior.',
      annotations: [],
    },
  ]);

  // Keep isAgileEntryMode synced when manuals count changes
  useEffect(() => {
    if (manualsInProject.length === 0) {
      setIsAgileEntryMode(true);
    }
  }, [manualsInProject.length]);

  // Window paste listener for instant screenshot capture anywhere on the screen
  useEffect(() => {
    if (!isAgileEntryMode || activeTab !== 'manuals') return;

    const handleWindowPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            const dataUrl = await readFileAsDataUrl(blob);
            if (dataUrl) {
              setAgileSteps((prev) => {
                if (activeStepForPaste) {
                  return prev.map((s) => (s.id === activeStepForPaste ? { ...s, image: dataUrl } : s));
                }
                const firstEmpty = prev.findIndex((s) => !s.image);
                if (firstEmpty !== -1) {
                  const copy = [...prev];
                  copy[firstEmpty] = { ...copy[firstEmpty], image: dataUrl };
                  return copy;
                }
                const nextNum = prev.length + 1;
                return [
                  ...prev,
                  {
                    id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    stepNumber: nextNum,
                    title: `Paso ${nextNum}: Operación capturada desde portapapeles`,
                    actionType: 'click',
                    targetElement: 'Elemento en pantalla',
                    description: 'Paso registrado con captura de pantalla. Complete las validaciones operativas.',
                    expectedResult: 'El sistema avanza a la siguiente pantalla.',
                    image: dataUrl,
                    annotations: [],
                  },
                ];
              });
            }
          }
        }
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [isAgileEntryMode, activeTab, activeStepForPaste]);

  const handleBatchImagesDropped = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const loadedDataUrls = await Promise.all(fileArray.map((f) => readFileAsDataUrl(f)));

    setAgileSteps((prev) => {
      const updated = [...prev];
      let dataUrlIdx = 0;
      for (let i = 0; i < updated.length && dataUrlIdx < loadedDataUrls.length; i++) {
        if (!updated[i].image) {
          updated[i] = { ...updated[i], image: loadedDataUrls[dataUrlIdx] };
          dataUrlIdx++;
        }
      }
      while (dataUrlIdx < loadedDataUrls.length) {
        const nextNum = updated.length + 1;
        const file = fileArray[dataUrlIdx];
        const fileNameClean = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        updated.push({
          id: `step-${Date.now()}-${dataUrlIdx}-${Math.random().toString(36).substring(2, 6)}`,
          stepNumber: nextNum,
          title: `Paso ${nextNum}: ${fileNameClean || 'Confirmar pantalla'}`,
          actionType: 'click',
          targetElement: 'Pantalla operativa',
          description: `Acción correspondiente a la captura «${file.name}». Complete las validaciones requeridas.`,
          expectedResult: 'El sistema procesa la operación satisfactoriamente.',
          image: loadedDataUrls[dataUrlIdx],
          annotations: [],
        });
        dataUrlIdx++;
      }
      return updated;
    });
  };

  const handleLoadPreset = (presetKey: string) => {
    const preset = AGILE_SAP_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    setAgileTitle(preset.title);
    setAgileModule(preset.module);
    setAgileTxCode(preset.txCode);
    setAgileMinutes(preset.duration);
    setAgileSteps(
      preset.steps.map((st, idx) => ({
        id: `step-preset-${idx + 1}-${Date.now()}`,
        stepNumber: idx + 1,
        title: st.title,
        actionType: st.actionType,
        targetElement: st.targetElement,
        description: st.description,
        expectedResult: st.expectedResult,
        instructorNotes: st.instructorNotes,
        annotations: [],
      }))
    );
  };

  const handleAddAgileStep = () => {
    const nextNum = agileSteps.length + 1;
    const newStep: ManualStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stepNumber: nextNum,
      title: `Paso ${nextNum}: Acción procedimental en el sistema`,
      actionType: 'click',
      targetElement: 'Elemento / Campo en pantalla',
      description: 'Detalle las instrucciones que el operador debe realizar en este paso.',
      expectedResult: 'El sistema valida la información ingresada.',
      annotations: [],
    };
    setAgileSteps((prev) => [...prev, newStep]);
  };

  const handleMoveStep = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === agileSteps.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const copy = [...agileSteps];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setAgileSteps(copy.map((s, i) => ({ ...s, stepNumber: i + 1 })));
  };

  const handleDuplicateStep = (idx: number) => {
    const source = agileSteps[idx];
    const duplicated: ManualStep = {
      ...source,
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${source.title} (Copia)`,
      stepNumber: idx + 2,
    };
    const copy = [...agileSteps];
    copy.splice(idx + 1, 0, duplicated);
    setAgileSteps(copy.map((s, i) => ({ ...s, stepNumber: i + 1 })));
  };

  const handleDeleteAgileStep = (stepId: string) => {
    if (agileSteps.length <= 1) return;
    setAgileSteps((prev) => prev.filter((s) => s.id !== stepId).map((s, i) => ({ ...s, stepNumber: i + 1 })));
  };

  const handleSaveAgileManual = async () => {
    const finalTitle = agileTitle.trim() || `${agileTxCode ? agileTxCode + ' - ' : ''}Procedimiento Operativo ${project.clientName}`;
    setIsSavingAgile(true);
    try {
      const cleanSteps = agileSteps.map((s, idx) => ({
        ...s,
        stepNumber: idx + 1,
        id: s.id || `step-${Date.now()}-${idx + 1}`,
      }));

      const newManual: UserManual = {
        id: `man-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        projectId: project.id,
        title: finalTitle,
        subtitle: `Manual procedimental y guía de usuario para ${project.clientName}. Módulo: ${agileModule}${agileTxCode ? ` · TX: ${agileTxCode}` : ''}`,
        overview: `Documento procedimental para la ejecución y control de actividades en ${project.name}. Incluye instrucciones secuenciales, validaciones y recomendaciones operativas.`,
        targetAudience: agileAudience,
        estimatedMinutes: Number(agileMinutes) || 5,
        version: '1.0',
        status: 'published',
        pedagogicalApproach: 'sop',
        prerequisites: [],
        steps: cleanSteps,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (onManualCreated) {
        onManualCreated(newManual);
      } else {
        onOpenCreateManualForProject(project.id);
      }

      setAgileSaveSuccess(`¡Manual «${finalTitle}» guardado con éxito!`);
      setTimeout(() => {
        setAgileSaveSuccess(null);
        setIsAgileEntryMode(false);
      }, 1400);
    } finally {
      setIsSavingAgile(false);
    }
  };

  // Handle image upload for a single step
  const handleStepImageUpload = async (stepId: string, file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    setAgileSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, image: dataUrl } : s))
    );
  };

  // Unlinked manuals or manuals from other projects (memoized)
  const availableManualsToLink = useMemo(() => {
    return allManuals.filter((m: UserManual) => m.projectId !== project.id);
  }, [allManuals, project.id]);

  // Statistics (memoized)
  const totalSteps = useMemo(() => {
    return manualsInProject.reduce((acc, m) => acc + (m.steps?.length || 0), 0);
  }, [manualsInProject]);

  const totalMinutes = useMemo(() => {
    return manualsInProject.reduce((acc, m) => acc + (m.estimatedMinutes || 3), 0);
  }, [manualsInProject]);

  const activeFeaturesCount = useMemo(() => {
    return Object.values(project.documentOptions || {}).filter(Boolean).length;
  }, [project.documentOptions]);

  const handleToggleDocOption = useCallback((key: keyof ProjectDocumentOptions) => {
    const updatedOptions = {
      ...project.documentOptions,
      [key]: !project.documentOptions[key],
    };
    onUpdateProject({
      ...project,
      documentOptions: updatedOptions,
      updatedAt: new Date().toISOString(),
    });
  }, [project, onUpdateProject]);

  // Live 24-hour clock (hora, minuto y segundo en formato 24H: HH:mm:ss)
  const [currentClockTime, setCurrentClockTime] = useState<string>(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentClockTime(`${h}:${m}:${s}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-[98%] max-w-[98vw] mx-auto px-1 sm:px-3 py-3 space-y-4">
      {/* Project Hero Banner - Compact Widescreen High Density */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
        {/* Top Accent Line */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: project.colorTheme || '#0f3a60' }}
        />

        {/* 24-Hour Live Real-Time Clock */}
        <div
          className="absolute top-3 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-slate-50/95 hover:bg-slate-100 border border-slate-200/90 rounded-xl shadow-2xs backdrop-blur-xs transition-colors select-none"
          title="Reloj en tiempo real (formato 24 horas: HH:mm:ss)"
        >
          <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span className="font-mono text-xs sm:text-sm font-black text-slate-800 tracking-wider tabular-nums">
            {currentClockTime}
          </span>
          <span className="text-[9px] font-bold text-slate-500 bg-slate-200/80 px-1 py-0.5 rounded font-mono uppercase tracking-wide">
            24H
          </span>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2 sm:pt-0">
          {/* Dual Branding & Project Title */}
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Dual Logos Showcase */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Nuestro Logo Card */}
              <div className="w-20 sm:w-24 h-14 sm:h-16 bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex flex-col items-center justify-center flex-shrink-0 shadow-2xs group relative">
                {(project.organizationLogo || branding?.logo) ? (
                  <img
                    src={project.organizationLogo || branding?.logo}
                    alt={project.organizationName || branding?.companyName || 'Nuestro Logo'}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <Building2 className="w-4 h-4 text-slate-300" />
                    <span className="text-[8px] font-semibold">Sin logo</span>
                  </div>
                )}
                <span className="absolute bottom-0.5 right-1 text-[7px] bg-indigo-700 text-white px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                  Nuestro
                </span>
                {onOpenOurLogoModal && (
                  <button
                    onClick={onOpenOurLogoModal}
                    title="Definir Nuestro Logo e Identidad Emisora"
                    className="absolute inset-0 bg-indigo-950/75 text-white text-[10px] font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-xs cursor-pointer"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Definir</span>
                  </button>
                )}
              </div>

              {/* Client Logo Card */}
              <div className="w-20 sm:w-24 h-14 sm:h-16 bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex flex-col items-center justify-center flex-shrink-0 shadow-2xs group relative">
                {project.clientLogo ? (
                  <img
                    src={project.clientLogo}
                    alt={project.clientName}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <Building2 className="w-4 h-4 text-slate-300" />
                    <span className="text-[8px] font-semibold">Sin logo</span>
                  </div>
                )}
                <span className="absolute bottom-0.5 right-1 text-[7px] bg-slate-800 text-white px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                  Cliente
                </span>
                <button
                  onClick={() => onOpenProjectSettings(project)}
                  title="Cambiar logo del cliente"
                  className="absolute inset-0 bg-slate-900/65 text-white text-[10px] font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-xs cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>Cambiar</span>
                </button>
              </div>
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {project.clientName}
                </span>
                {project.code && (
                  <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {project.code}
                  </span>
                )}
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    project.status === 'Aprobado' || project.status === 'Publicado'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : project.status === 'En Progreso'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  ● {project.status}
                </span>
                <span className="text-[11px] text-slate-400">·</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Versión {project.version}
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                {project.name}
              </h1>

              <p className="text-xs text-slate-600 line-clamp-1 max-w-4xl">
                {project.description ||
                  'Conjunto estructurado de manuales operativos y procedimientos estándar para este proyecto.'}
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end shrink-0 pt-1">
            {/* Quick Agile Entry Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsAgileEntryMode((prev) => !prev);
                setActiveTab('manuals');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer ${
                isAgileEntryMode && activeTab === 'manuals'
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-600'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              title="Alternar modo de ingreso ágil a pantalla completa (≥95%)"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isAgileEntryMode && activeTab === 'manuals' ? 'Modo Ágil Activo' : '⚡ Ingreso Ágil'}</span>
            </button>

            {/* Delete Project Button */}
            {onDeleteProject && (
              manualsInProject.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setIsDeleteProjectConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 rounded-xl shadow-2xs transition-all cursor-pointer"
                  title="Eliminar este proyecto (disponible porque no tiene manuales asignados)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Borrar Proyecto</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsBlockedProjectModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer"
                  title={`Este proyecto contiene ${manualsInProject.length} manual(es). Haz clic para ver cómo eliminarlo.`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Borrar Proyecto ({manualsInProject.length})</span>
                </button>
              )
            )}

            <button
              onClick={() => onOpenExportProject(project)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl shadow-2xs transition-all cursor-pointer"
              title="Exportar manuales en HTML por cliente, ZIP, PDF oficial y Word"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Exportar</span>
            </button>

            <button
              onClick={() => onOpenProjectSettings(project)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Configuración y metadatos del proyecto"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Configuración</span>
            </button>
          </div>
        </div>

        {/* Project KPI Stats bar (Single continuous horizontal widescreen bar) */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
          <div className="px-2 py-1 bg-slate-50/80 rounded-lg border border-slate-200/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Manuales del Proyecto
              </div>
              <div className="text-base font-black text-slate-800 tabular-nums flex items-center gap-1">
                <span>{manualsInProject.length}</span>
                <span className="text-xs font-normal text-slate-500">manual(es)</span>
              </div>
            </div>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="px-2 py-1 bg-slate-50/80 rounded-lg border border-slate-200/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Pasos Procedimentales
              </div>
              <div className="text-base font-black text-slate-800 tabular-nums flex items-center gap-1">
                <span>{totalSteps}</span>
                <span className="text-xs font-normal text-slate-500">pasos</span>
              </div>
            </div>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="px-2 py-1 bg-slate-50/80 rounded-lg border border-slate-200/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Tiempo Total Estimado
              </div>
              <div className="text-base font-black text-slate-800 tabular-nums flex items-center gap-1">
                <span>~{totalMinutes} min</span>
              </div>
            </div>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="px-2 py-1 bg-slate-50/80 rounded-lg border border-slate-200/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Características del Doc.
              </div>
              <div className="text-base font-black text-slate-800 tabular-nums flex items-center gap-1">
                <span>{activeFeaturesCount} / 12</span>
                <span className="text-xs font-normal text-slate-500">activas</span>
              </div>
            </div>
            <Sliders className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 font-bold text-xs">
        <button
          onClick={() => setActiveTab('manuals')}
          className={`pb-2.5 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'manuals'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Manuales del Proyecto ({manualsInProject.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('features')}
          className={`pb-2.5 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'features'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Características del Documento ({activeFeaturesCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`pb-2.5 px-3.5 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'info'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Ficha Técnica &amp; Alcance</span>
        </button>
      </div>

      {/* TAB 1: MANUALS LIST / AGILE INGESTION STUDIO */}
      {activeTab === 'manuals' && (
        <div className="space-y-4">
          {/* ========================================================= */}
          {/* AGILE INGESTION STUDIO (WIDESCREEN >=95% VIEWPORT SPACE) */}
          {/* ========================================================= */}
          {isAgileEntryMode ? (
            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
              {/* Studio Header Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Ingreso Ágil de Manual &amp; Pasos Operativos</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                        Widescreen 98%
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ingreso directo y secuencial. Pega capturas con <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">Ctrl+V</kbd>, arrastra imágenes o carga una plantilla predeterminada.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenCreateManualForProject(project.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="Abrir la grabadora de video y micrófono con transcripción IA"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Grabar con IA</span>
                  </button>

                  {manualsInProject.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAgileEntryMode(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ver Catálogo ({manualsInProject.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Success Alert Banner */}
              {agileSaveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{agileSaveSuccess}</span>
                </div>
              )}

              {/* Fast Metadata Inputs Grid (Spans Full Width) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                <div className="md:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Título del Manual Operativo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={agileTitle}
                    onChange={(e) => setAgileTitle(e.target.value)}
                    placeholder={`Ej. Creación de Pedido de Ventas (${project.clientName})`}
                    className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Módulo
                  </label>
                  <select
                    value={agileModule}
                    onChange={(e) => setAgileModule(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SD">SD - Ventas</option>
                    <option value="MM">MM - Compras &amp; Stock</option>
                    <option value="WM">WM - Almacenes &amp; HU</option>
                    <option value="FI">FI - Finanzas</option>
                    <option value="CO">CO - Costos</option>
                    <option value="PP">PP - Producción</option>
                    <option value="QM">QM - Calidad</option>
                    <option value="PM">PM - Mantenimiento</option>
                    <option value="General">Operaciones Generales</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Transacción (TX)
                  </label>
                  <input
                    type="text"
                    value={agileTxCode}
                    onChange={(e) => setAgileTxCode(e.target.value)}
                    placeholder="Ej. VA01 / MIGO"
                    className="w-full text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Minutos
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={agileMinutes}
                    onChange={(e) => setAgileMinutes(Number(e.target.value))}
                    className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2 py-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Audiencia
                  </label>
                  <input
                    type="text"
                    value={agileAudience}
                    onChange={(e) => setAgileAudience(e.target.value)}
                    placeholder="Usuarios operativos"
                    className="w-full text-xs text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
                  />
                </div>

                {/* Quick Presets Strip */}
                <div className="md:col-span-12 flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Cargar Plantilla Rápida:
                  </span>
                  {AGILE_SAP_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => handleLoadPreset(preset.key)}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      title={`Cargar estructura procedimental predefinida para ${preset.title}`}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Universal Drag & Drop & Paste Zone (Full Widescreen Strip) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropZoneActive(true);
                }}
                onDragLeave={() => setDropZoneActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropZoneActive(false);
                  if (e.dataTransfer.files) {
                    handleBatchImagesDropped(e.dataTransfer.files);
                  }
                }}
                className={`p-3 sm:p-4 rounded-xl border-2 border-dashed transition-all flex flex-col md:flex-row items-center justify-between gap-3 ${
                  dropZoneActive
                    ? 'border-indigo-500 bg-indigo-50/60'
                    : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      Arrastra capturas de pantalla aquí o presiona <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[11px] font-bold text-indigo-700">Ctrl + V</kbd>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Cada captura pegada o subida se asignará automáticamente en orden secuencial como un paso del procedimiento.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    ref={hiddenFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleBatchImagesDropped(e.target.files);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => hiddenFileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Seleccionar Imágenes</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddAgileStep}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Añadir Paso</span>
                  </button>
                </div>
              </div>

              {/* Visual Strip of Loaded Screenshots */}
              {agileSteps.some((s) => s.image) && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                    Capturas vinculadas:
                  </span>
                  {agileSteps.map((step, idx) => (
                    step.image ? (
                      <div
                        key={step.id}
                        className="relative group w-14 h-10 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden shrink-0 shadow-2xs"
                        title={`Paso ${idx + 1}: ${step.title}`}
                      >
                        <img src={step.image} alt={step.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-slate-900/80 text-white px-1 rounded font-bold">
                          #{idx + 1}
                        </span>
                      </div>
                    ) : null
                  ))}
                </div>
              )}

              {/* Agile Steps Sequencer Rows (Spanning 100% of Widescreen) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-800">
                    Secuencia de Pasos Operativos ({agileSteps.length} pasos)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Usa las flechas para reordenar o presiona Enter para crear el siguiente paso
                  </span>
                </div>

                <div className="space-y-2">
                  {agileSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col lg:flex-row items-start lg:items-center gap-3 ${
                        activeStepForPaste === step.id
                          ? 'border-indigo-400 bg-indigo-50/30 ring-1 ring-indigo-300'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Step Number & Reorder */}
                      <div className="flex lg:flex-col items-center gap-1 shrink-0">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div className="flex lg:flex-row items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                            title="Mover arriba"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStep(idx, 'down')}
                            disabled={idx === agileSteps.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                            title="Mover abajo"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Step Screenshot Thumbnail / Slot */}
                      <div className="w-24 h-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center relative overflow-hidden shrink-0 group">
                        {step.image ? (
                          <>
                            <img src={step.image} alt={step.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <label className="p-1 bg-white/90 text-slate-700 rounded hover:bg-white cursor-pointer" title="Cambiar captura">
                                <Upload className="w-3 h-3" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleStepImageUpload(step.id, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setAgileSteps((prev) =>
                                    prev.map((s) => (s.id === step.id ? { ...s, image: undefined } : s))
                                  );
                                }}
                                className="p-1 bg-white/90 text-rose-600 rounded hover:bg-white cursor-pointer"
                                title="Quitar captura"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <label
                            onClick={() => setActiveStepForPaste(step.id)}
                            className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors cursor-pointer p-1"
                            title="Haz clic para seleccionar imagen o pega con Ctrl+V"
                          >
                            <Camera className="w-4 h-4 text-slate-300" />
                            <span className="text-[9px] font-bold">Pegar / Subir</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleStepImageUpload(step.id, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {/* Step Main Operative Content */}
                      <div className="flex-1 min-w-0 space-y-1.5 w-full">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          {/* Action Type Select */}
                          <select
                            value={step.actionType}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setAgileSteps((prev) =>
                                prev.map((s) => (s.id === step.id ? { ...s, actionType: val } : s))
                              );
                            }}
                            className="text-[11px] font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded px-2 py-1 shrink-0 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="click">Clic en Botón</option>
                            <option value="input">Entrada de Texto / Datos</option>
                            <option value="select">Seleccionar de Lista</option>
                            <option value="navigate">Ejecutar Transacción</option>
                            <option value="verify">Verificación de Datos</option>
                            <option value="warning">Advertencia / Nota Crítica</option>
                          </select>

                          {/* Operative Step Title Input */}
                          <input
                            type="text"
                            value={step.title}
                            onFocus={() => setActiveStepForPaste(step.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddAgileStep();
                              }
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAgileSteps((prev) =>
                                prev.map((s) => (s.id === step.id ? { ...s, title: val } : s))
                              );
                            }}
                            placeholder="Título operativo (ej. Ingresar Solicitante y Pedido Cliente)"
                            className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Description & Detailed Instructions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={step.description}
                            onFocus={() => setActiveStepForPaste(step.id)}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAgileSteps((prev) =>
                                prev.map((s) => (s.id === step.id ? { ...s, description: val } : s))
                              );
                            }}
                            placeholder="Instrucciones paso a paso y valores de campos..."
                            className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />

                          <input
                            type="text"
                            value={step.instructorNotes || ''}
                            onFocus={() => setActiveStepForPaste(step.id)}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAgileSteps((prev) =>
                                prev.map((s) => (s.id === step.id ? { ...s, instructorNotes: val } : s))
                              );
                            }}
                            placeholder="Tip de operación o validación del instructor..."
                            className="w-full text-xs text-indigo-800 bg-indigo-50/40 border border-indigo-100 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Step Actions */}
                      <div className="flex items-center gap-1 self-end lg:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDuplicateStep(idx)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Duplicar paso"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAgileStep(step.id)}
                          disabled={agileSteps.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar paso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Ingestion Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddAgileStep}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Añadir Paso (Enter)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadPreset('SD_VA01')}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Recargar plantilla inicial
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  {onDeleteProject && manualsInProject.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setIsDeleteProjectConfirmOpen(true)}
                      className="px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar este proyecto vacío"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 inline mr-1" />
                      <span>Borrar Proyecto Vacío</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveAgileManual}
                    disabled={isSavingAgile}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.01]"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingAgile ? 'Guardando en Proyecto...' : 'Guardar Manual en Proyecto'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* ========================================================= */}
          {/* CATALOG VIEW: WIDESCREEN GRID & TABLE (When Not in Agile) */}
          {/* ========================================================= */}
          {!isAgileEntryMode && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Manuales asignados a este proyecto ({manualsInProject.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Procedimientos operativos estándar para el cliente <span className="font-semibold text-slate-700">{project.clientName}</span>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Grid vs Table View Mode Switch */}
                  <div className="flex items-center gap-1 p-0.5 bg-white border border-slate-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setCatalogViewMode('grid')}
                      className={`p-1 rounded text-xs transition-colors ${
                        catalogViewMode === 'grid'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Vista Cuadrícula Widescreen"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogViewMode('table')}
                      className={`p-1 rounded text-xs transition-colors ${
                        catalogViewMode === 'table'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Vista Tabla de Alta Densidad"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setIsAgileEntryMode(true)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>+ Ingreso Ágil</span>
                  </button>

                  <button
                    onClick={() => onOpenCreateManualForProject(project.id)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo con IA</span>
                  </button>
                </div>
              </div>

              {/* Grid Layout: Expands cleanly to 4-5 columns across widescreen */}
              {catalogViewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
                  {manualsInProject.map((manual, idx) => (
                    <div
                      key={manual.id}
                      className="bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 font-medium">
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            #{idx + 1}
                          </span>
                          <span>v{manual.version || '1.0'}</span>
                        </div>

                        <div>
                          <h3
                            onClick={() => onOpenManual(manual.id)}
                            className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 cursor-pointer line-clamp-2 transition-colors"
                          >
                            {manual.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {manual.subtitle || manual.overview}
                          </p>
                        </div>

                        {/* Step thumbnails */}
                        <div className="pt-1 flex items-center gap-2">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {manual.steps.slice(0, 3).map((st, sIdx) => (
                              <div
                                key={st.id || sIdx}
                                className="w-7 h-7 rounded-md border-2 border-white bg-slate-100 overflow-hidden shadow-2xs flex-shrink-0"
                              >
                                {st.image ? (
                                  <img src={st.image} alt={st.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-slate-400">
                                    {sIdx + 1}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-slate-600 tabular-nums">
                            {manual.steps.length} pasos
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-500 tabular-nums">
                            ~{manual.estimatedMinutes || 3}m
                          </span>
                        </div>
                      </div>

                      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setManualToDelete(manual);
                          }}
                          className="p-1 -ml-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar este manual"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>

                        <button
                          onClick={() => onOpenManual(manual.id)}
                          className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          <span>Abrir</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Manual CTA Card */}
                  <button
                    onClick={() => setIsAgileEntryMode(true)}
                    className="rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 p-4 flex flex-col items-center justify-center text-center transition-all group min-h-[140px] cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mb-1.5 transition-colors">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                      + Ingreso Ágil de Manual
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Pega capturas y escribe directamente
                    </span>
                  </button>
                </div>
              ) : (
                /* High-Density Table View for Widescreen Data Entry */
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Título del Manual</th>
                        <th className="py-2.5 px-3">Módulo / Ámbito</th>
                        <th className="py-2.5 px-3 text-center">Pasos</th>
                        <th className="py-2.5 px-3 text-center">Duración</th>
                        <th className="py-2.5 px-3 text-center">Versión</th>
                        <th className="py-2.5 px-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {manualsInProject.map((manual, idx) => (
                        <tr key={manual.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                            #{idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 hover:text-indigo-600 cursor-pointer" onClick={() => onOpenManual(manual.id)}>
                            {manual.title}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {manual.subtitle || manual.overview || 'Estándar'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-800 tabular-nums">
                            {manual.steps.length}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 tabular-nums">
                            ~{manual.estimatedMinutes || 3} min
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                            v{manual.version || '1.0'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onOpenManual(manual.id)}
                                className="px-2 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              >
                                Abrir
                              </button>
                              <button
                                onClick={() => setManualToDelete(manual)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Eliminar manual"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOCUMENT CHARACTERISTICS SELECTION */}
      {activeTab === 'features' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Características del Documento para {project.clientName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona qué componentes y secciones se incorporarán dentro del documento formal del proyecto y en los manuales generados.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                {activeFeaturesCount} de 13 activas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: 'includeOurLogo' as keyof ProjectDocumentOptions,
                title: 'Nuestro Logo (Organización Emisora) en Documentos',
                desc: `Inserta el logotipo oficial de ${project.organizationName || branding?.companyName || 'nuestra empresa'} en la carátula y el membrete de todas las páginas foliadas.`,
                badge: 'Identidad Emisora',
              },
              {
                key: 'includeClientLogo' as keyof ProjectDocumentOptions,
                title: 'Logo del Cliente en Portada y Encabezados',
                desc: `Inserta el logo oficial de ${project.clientName} en la portada del documento y en el encabezado de todas las páginas foliadas.`,
                badge: 'Identidad Visual',
              },
              {
                key: 'includeCoverPage' as keyof ProjectDocumentOptions,
                title: 'Portada Oficial con Membrete y Control de Cambios',
                desc: 'Genera la carátula institucional con título de la solución, cliente, versión, autor, aprobador y fecha formal.',
                badge: 'Estructura Corporativa',
              },
              {
                key: 'includeExecutiveSummary' as keyof ProjectDocumentOptions,
                title: 'Resumen Ejecutivo y Alcance del Proyecto',
                desc: 'Sección introductoria con objetivos, justificación del sistema, destinatarios y descripción funcional.',
                badge: 'Contenido Ejecutivo',
              },
              {
                key: 'includeDocumentControl' as keyof ProjectDocumentOptions,
                title: 'Tabla de Control de Versiones y Aprobaciones',
                desc: 'Ficha técnica formal con historial de revisiones, autoría y validaciones de calidad.',
                badge: 'Gobierno de TI',
              },
              {
                key: 'includeTableOfContents' as keyof ProjectDocumentOptions,
                title: 'Índice de Contenidos Unificado',
                desc: 'Tabla jerárquica con numeración automática y páginas calculadas dinámicamente.',
                badge: 'Navegación',
              },
              {
                key: 'includeProcessMatrix' as keyof ProjectDocumentOptions,
                title: 'Matriz de Flujos de Proceso y Transacciones',
                desc: 'Cuadro sinóptico de transacciones (SAP, módulos, códigos, roles responsables e inputs requeridos).',
                badge: 'Flujo de Proceso',
              },
              {
                key: 'includePrerequisites' as keyof ProjectDocumentOptions,
                title: 'Requisitos y Accesos Previos',
                desc: 'Listado exhaustivo de permisos, roles, transacciones y condiciones del sistema para ejecutar los manuales.',
                badge: 'Requisitos',
              },
              {
                key: 'includeStepScreenshots' as keyof ProjectDocumentOptions,
                title: 'Capturas de Pantalla con Señalizaciones Visuales',
                desc: 'Imágenes nítidas con recuadros rojos, flechas y círculos que guían con exactitud al usuario.',
                badge: 'Guía Visual',
              },
              {
                key: 'includeActionBadges' as keyof ProjectDocumentOptions,
                title: 'Insignias de Acción Normalizadas (CLIC, INGRESAR, etc.)',
                desc: 'Estandarización de verbos de acción en español para uniformidad de procedimiento.',
                badge: 'Terminología',
              },
              {
                key: 'includeTroubleshooting' as keyof ProjectDocumentOptions,
                title: 'Resolución de Problemas (Troubleshooting)',
                desc: 'Matriz de fallas o mensajes de advertencia habituales con su correspondiente solución de desbloqueo.',
                badge: 'Soporte al Usuario',
              },
              {
                key: 'includeChecklists' as keyof ProjectDocumentOptions,
                title: 'Listas de Verificación de Conformidad (Checklist)',
                desc: 'Puntos de comprobación rápida para validar la correcta ejecución antes del pase a producción.',
                badge: 'Auditoría & Calidad',
              },
              {
                key: 'includeInstructorNotes' as keyof ProjectDocumentOptions,
                title: 'Notas Orales y Citas del Instructor',
                desc: 'Explicaciones verbales y recomendaciones transcriptas durante la captura de las grabaciones.',
                badge: 'Capacitación',
              },
            ].map((feat) => {
              const isChecked = !!project.documentOptions?.[feat.key];
              return (
                <div
                  key={feat.key}
                  onClick={() => handleToggleDocOption(feat.key)}
                  className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-4 ${
                    isChecked
                      ? 'bg-indigo-50/30 border-indigo-300 ring-1 ring-indigo-200'
                      : 'bg-white border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{feat.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {feat.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Document Section Preview Pipeline */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Esquema de Salida del Documento del Proyecto</span>
            </h3>
            <p className="text-xs text-slate-500">
              Así se ordenará el documento final cuando se exporte la solución completa:
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {project.documentOptions?.includeCoverPage && (
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-xs">
                  1. Portada con Logo {project.clientName}
                </span>
              )}
              {project.documentOptions?.includeTableOfContents && (
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-xs">
                  2. Índice General
                </span>
              )}
              {project.documentOptions?.includeExecutiveSummary && (
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-xs">
                  3. Resumen Ejecutivo &amp; Alcance
                </span>
              )}
              {project.documentOptions?.includeProcessMatrix && (
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-xs">
                  4. Matriz de Procesos y Transacciones
                </span>
              )}
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-lg shadow-xs">
                5. Procedimientos Detallados ({manualsInProject.length} manuales)
              </span>
              {project.documentOptions?.includeTroubleshooting && (
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-xs">
                  6. Resolución de Problemas
                </span>
              )}
              {project.documentOptions?.includeChecklists && (
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-xs">
                  7. Lista de Verificación
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROJECT INFO & SCOPE */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Datos del Cliente &amp; Organización
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Nombre de la Empresa / Cliente:</span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">{project.clientName}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Identificador del Proyecto:</span>
                  <div className="font-mono font-semibold text-slate-700 mt-0.5">{project.code || 'N/A'}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Área / Categoría:</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{project.category || 'General'}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Estado del Proyecto:</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{project.status}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Gobierno &amp; Alcance de la Solución
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Consultor / Autor Líder:</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{project.author}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Audiencia Objetivo:</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{project.targetAudience}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Alcance Declarado:</span>
                  <div className="font-semibold text-slate-700 mt-0.5">{project.scope}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Fecha de Creación:</span>
                  <div className="font-semibold text-slate-700 mt-0.5">
                    {new Date(project.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal to link existing manuals */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Vincular manual a {project.clientName}
            </h3>
            <p className="text-xs text-slate-500">
              Selecciona uno de los manuales existentes para incorporarlo a este proyecto:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableManualsToLink.map((man) => (
                <div
                  key={man.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-xs"
                >
                  <div className="flex-1 pr-3">
                    <div className="font-bold text-slate-800 line-clamp-1">{man.title}</div>
                    <div className="text-[11px] text-slate-500">{man.steps.length} pasos</div>
                  </div>
                  <button
                    onClick={() => {
                      onLinkManualToProject(man.id, project.id);
                      setIsLinkModalOpen(false);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
                  >
                    Vincular
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Manual Deletion & Unlink Confirmation Modal (100% reliable inside iframe) */}
      {manualToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ¿Eliminar manual?
                  </h3>
                  <span className="text-xs text-slate-500">
                    Confirma qué acción deseas realizar con este manual
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManualToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Manual details card preview */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  v{manualToDelete.version || '1.0'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {manualToDelete.steps?.length || 0} pasos · ~{manualToDelete.estimatedMinutes || 3} min
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm leading-snug">
                {manualToDelete.title}
              </h4>
              {manualToDelete.subtitle && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {manualToDelete.subtitle}
                </p>
              )}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p>
                Puedes eliminar el manual de forma definitiva o solo quitarlo de este proyecto ({project.clientName}).
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onDeleteManual) {
                    onDeleteManual(manualToDelete.id);
                  } else {
                    onUnlinkManualFromProject(manualToDelete.id);
                  }
                  setManualToDelete(null);
                }}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Manual Definitivamente</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUnlinkManualFromProject(manualToDelete.id);
                  setManualToDelete(null);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Unlink className="w-4 h-4 text-slate-500" />
                <span>Solo desvincular de este proyecto</span>
              </button>

              <button
                type="button"
                onClick={() => setManualToDelete(null)}
                className="w-full py-2 px-4 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl transition-colors text-center mt-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {isDeleteProjectConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteProjectConfirmOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                ¿Eliminar proyecto "{project.name}"?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Cliente: <span className="font-semibold text-slate-700">{project.clientName}</span>
                {project.code ? ` · Código: ${project.code}` : ''}
              </p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p>
                Este proyecto <strong>no contiene manuales</strong> (0 manuales), por lo que puede eliminarse de manera segura sin afectar ninguna documentación existente.
              </p>
            </div>

            <p className="text-xs text-slate-600">
              Esta acción eliminará el proyecto y su configuración permanentemente de la base de datos.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteProjectConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteProject) {
                    onDeleteProject(project.id);
                  }
                  setIsDeleteProjectConfirmOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Proyecto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal explicativo cuando el proyecto tiene manuales */}
      {isBlockedProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setIsBlockedProjectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                No se puede borrar el proyecto "{project.name}"
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                El proyecto contiene <strong className="text-slate-800">{manualsInProject.length} manual(es)</strong> asignado(s).
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold">Regla de Protección Operativa:</div>
              <p>
                Para evitar la pérdida accidental de manuales y procedimientos, solo es posible borrar proyectos que tengan <strong>0 manuales</strong> asociados.
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Para eliminar este proyecto, primero elimina sus manuales o vincúlalos a otro proyecto del cliente usando la opción "Vincular".
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBlockedProjectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProjectWorkspace = memo(ProjectWorkspaceComponent);
