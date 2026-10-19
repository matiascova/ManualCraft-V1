import { UserManual } from '../types/manual';
import {
  getSapStep1Screenshot,
  getSapStep2Screenshot,
  getSapStep3Screenshot,
  getSapStep4Screenshot,
  getSapStep5Screenshot,
  getSapStep6Screenshot,
} from './sapScreenshots';

// Helper to create realistic SVG mock screenshots for samples
function createMockScreenshot(title: string, subtitle: string, highlightText: string, themeColor = '#3b82f6'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="960" height="540">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#334155"/>
      </linearGradient>
    </defs>
    <!-- Window Frame -->
    <rect width="960" height="540" rx="12" fill="url(#bg)"/>
    <!-- Top Window Bar -->
    <rect width="960" height="42" fill="url(#headerGrad)"/>
    <circle cx="24" cy="21" r="6" fill="#ef4444"/>
    <circle cx="44" cy="21" r="6" fill="#f59e0b"/>
    <circle cx="64" cy="21" r="6" fill="#10b981"/>
    <!-- Search / URL bar -->
    <rect x="180" y="8" width="600" height="26" rx="6" fill="#0f172a" stroke="#475569" stroke-width="1"/>
    <text x="320" y="25" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">https://app.sistemaempresarial.com/dashboard</text>
    
    <!-- Sidebar -->
    <rect x="0" y="42" width="220" height="498" fill="#1e293b" opacity="0.95"/>
    <rect x="20" y="65" width="180" height="34" rx="6" fill="${themeColor}" opacity="0.15"/>
    <rect x="20" y="65" width="4" height="34" rx="2" fill="${themeColor}"/>
    <text x="38" y="87" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="600" font-size="13">✦ Panel de Control</text>
    
    <text x="38" y="135" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">📄 Documentos &amp; Ventas</text>
    <text x="38" y="175" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">👥 Clientes &amp; Contactos</text>
    <text x="38" y="215" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">💳 Pagos &amp; Facturación</text>
    <text x="38" y="255" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">⚙️ Configuración</text>
    
    <!-- Main Content Area -->
    <rect x="250" y="70" width="680" height="440" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1"/>
    
    <!-- Header of Main Content -->
    <text x="280" y="115" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="700" font-size="20">${title}</text>
    <text x="280" y="140" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">${subtitle}</text>
    
    <!-- Mock UI Elements -->
    <rect x="280" y="170" width="310" height="60" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <text x="295" y="195" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">CLIENTE / RFC</text>
    <text x="295" y="218" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13">ACME Corp - RFC: ACM920101XYZ</text>

    <rect x="610" y="170" width="310" height="60" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <text x="625" y="195" fill="#64748b" font-family="system-ui, sans-serif" font-size="11">FECHA DE EMISIÓN</text>
    <text x="625" y="218" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13">13 de Octubre de 2026</text>

    <!-- Table mock -->
    <rect x="280" y="250" width="640" height="150" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <rect x="280" y="250" width="640" height="34" fill="#334155" opacity="0.6"/>
    <text x="295" y="272" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12" font-weight="600">Concepto / Servicio</text>
    <text x="650" y="272" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12" font-weight="600">Cant.</text>
    <text x="820" y="272" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12" font-weight="600">Total</text>
    
    <text x="295" y="310" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13">Suscripción Anual Plataforma Pro</text>
    <text x="660" y="310" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">1</text>
    <text x="820" y="310" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="600">$1,450.00 USD</text>

    <line x1="280" y1="330" x2="920" y2="330" stroke="#334155" stroke-width="1"/>
    <text x="295" y="360" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13">Módulo Adicional Reportes Avanzados</text>
    <text x="660" y="360" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">1</text>
    <text x="820" y="360" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="600">$290.00 USD</text>

    <!-- Main action button with highlight -->
    <rect x="730" y="425" width="190" height="42" rx="8" fill="${themeColor}"/>
    <text x="760" y="451" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="600" font-size="14">${highlightText}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_MANUALS: UserManual[] = [
  {
    id: 'manual-sap-comex',
    projectId: 'prj-weber-wms-hu',
    code: 'ZMMT0033',
    title: 'Distribución de Facturas de Importación Comex en Órdenes de Compra (SAP)',
    subtitle: 'Guía práctica paso a paso para consultar, validar y grabar la distribución de facturas de comercio exterior mediante la transacción ZMMT0033',
    overview: 'Este manual describe el procedimiento estándar para distribuir facturas de importación (Comex) asociadas a Órdenes de Compra en el sistema SAP S/4HANA. El usuario aprenderá a acceder a la transacción personalizada, filtrar por sociedad y número de solicitud, revisar los importes y condiciones comerciales, y guardar de forma segura los registros en el sistema.',
    targetAudience: 'Usuarios finales y colaboradores',
    estimatedMinutes: 3,
    difficulty: 'Intermedio',
    version: '1.0',
    category: 'SAP S/4HANA & Operaciones Comex',
    createdAt: '2026-10-13T10:25:00.000Z',
    updatedAt: '2026-10-14T08:00:00.000Z',
    prerequisites: [
      'Tener acceso y credenciales activas en SAP S/4HANA',
      'Permisos de ejecución para la transacción ZMMT0033 (Generador distribución facturas Comex)',
      'Contar con el número de Solicitud de Despacho (DI) y la Sociedad correspondiente',
      'Órdenes de compra y facturas Comex previamente creadas y asociadas en el sistema',
    ],
    steps: [
      {
        id: 'step-sap-1',
        stepNumber: 1,
        title: 'Ingresar el código de transacción en la barra de comandos',
        sapTransaction: 'ZMMT0033',
        sapModule: 'MM',
        actionType: 'type',
        targetElement: 'Campo de comandos de SAP',
        description: "Haz clic en el campo de comandos de SAP ubicado en la barra de herramientas superior e introduce el código de transacción 'ZMMT0033' y presiona Enter.",
        expectedResult: "Se abre la pantalla del 'Generador distribución facturas Comex en OC'.",
        tip: "Puedes agregar esta transacción a tu carpeta de 'Favoritos' en SAP Easy Access para accesos rápidos posteriores.",
        image: getSapStep1Screenshot(),
        annotations: [
          {
            id: 'ann-sap-1',
            x: 21,
            y: 11,
            width: 14,
            height: 6,
            shape: 'rect',
            color: '#ef4444',
            label: 'Ingresar ZMMT0033',
            labelPosition: 'bottom',
          },
        ],
      },
      {
        id: 'step-sap-2',
        stepNumber: 2,
        title: "Completar el campo 'Sociedad'",
        sapTransaction: 'ZMMT0033',
        sapModule: 'MM',
        actionType: 'type',
        targetElement: "Campo de texto 'Sociedad'",
        description: "Ubícate en la sección superior de filtros de búsqueda y escribe el código de la sociedad (por ejemplo, 'VOLC') en el campo 'Sociedad'.",
        expectedResult: 'El código de la sociedad queda ingresado en el campo correspondiente.',
        warning: 'Verifica que el código de la sociedad esté escrito en mayúsculas y corresponda a la razón social autorizada.',
        image: getSapStep2Screenshot(),
        annotations: [
          {
            id: 'ann-sap-2',
            x: 17,
            y: 25,
            width: 14,
            height: 7,
            shape: 'rect',
            color: '#ef4444',
            label: 'Sociedad: VOLC',
            labelPosition: 'top',
          },
          {
            id: 'ann-sap-2-btn',
            x: 5,
            y: 11,
            width: 8,
            height: 5,
            shape: 'rect',
            color: '#10b981',
            label: 'Botón ✓ Aceptar',
            labelPosition: 'bottom',
          },
        ],
      },
      {
        id: 'step-sap-3',
        stepNumber: 3,
        title: "Ingresar el número de 'Solicitud' y ejecutar la consulta",
        sapTransaction: 'ZMMT0033',
        sapModule: 'MM',
        actionType: 'type',
        targetElement: "Campo de texto 'Solicitud'",
        description: "Haz clic en el campo 'Solicitud' e ingresa el número identificador correspondiente (por ejemplo, '100007'). Posteriormente, presiona la tecla Enter o haz clic en el botón 'Aceptar'.",
        expectedResult: 'El sistema procesa los criterios de búsqueda y recupera las facturas y órdenes de compra asociadas.',
        tip: 'Si necesitas consultar varias solicitudes simultáneamente, puedes utilizar el botón de selección múltiple situado a la derecha del campo.',
        image: getSapStep3Screenshot(),
        annotations: [
          {
            id: 'ann-sap-3',
            x: 52,
            y: 25,
            width: 17,
            height: 7,
            shape: 'rect',
            color: '#2563eb',
            label: 'Solicitud: 100007',
            labelPosition: 'top',
          },
          {
            id: 'ann-sap-3-btn',
            x: 5,
            y: 11,
            width: 8,
            height: 5,
            shape: 'rect',
            color: '#10b981',
            label: 'Presionar ✓ Aceptar',
            labelPosition: 'bottom',
          },
        ],
      },
      {
        id: 'step-sap-4',
        stepNumber: 4,
        title: 'Revisar los registros cargados en la grilla',
        sapTransaction: 'ZMMT0033',
        sapModule: 'MM',
        actionType: 'verify',
        targetElement: "Grilla de datos 'Generador distribución facturas Comex'",
        description: 'Verifica visualmente en la tabla superior e inferior la información recuperada: número de documento de compras, posiciones, proveedor, número de despacho, facturas e importes en moneda SAP y moneda API.',
        expectedResult: 'Las líneas de factura y sus condiciones de documento se despliegan correctamente en las tablas de trabajo.',
        tip: 'Comprueba que la sumatoria total de los importes en moneda SAP coincida con los totales calculados en la franja amarilla.',
        image: getSapStep4Screenshot(),
        annotations: [
          {
            id: 'ann-sap-4',
            x: 19,
            y: 35,
            width: 25,
            height: 8,
            shape: 'rect',
            color: '#10b981',
            label: 'Seleccionar líneas de factura',
            labelPosition: 'top',
          },
        ],
      },
      {
        id: 'step-sap-5',
        stepNumber: 5,
        title: "Seleccionar el primer registro y hacer clic en 'Grabar Datos'",
        sapTransaction: 'ZMMT0033',
        sapModule: 'MM',
        actionType: 'click',
        targetElement: "Botón 'Grabar Datos'",
        description: "Haz clic sobre el selector de la primera fila correspondiente a la factura a distribuir y luego presiona el botón 'Grabar Datos' ubicado en la esquina superior izquierda.",
        expectedResult: 'La fila queda seleccionada en azul y se inicia el proceso de almacenamiento del registro.',
        warning: 'Asegúrate de marcar exactamente la posición que deseas contabilizar antes de presionar Grabar.',
        image: getSapStep5Screenshot(),
        annotations: [
          {
            id: 'ann-sap-5',
            x: 23,
            y: 11,
            width: 13,
            height: 6,
            shape: 'rect',
            color: '#ef4444',
            label: 'Grabar datos',
            labelPosition: 'bottom',
          },
        ],
      },
      {
        id: 'step-sap-6',
        stepNumber: 6,
        title: "Confirmar la grabación haciendo clic en 'Sí'",
        sapTransaction: 'ZMMT0033',
        sapModule: 'MM',
        actionType: 'click',
        targetElement: "Botón 'Sí'",
        description: "Haz clic en el botón 'Sí' dentro del cuadro de diálogo para ratificar y persistir definitivamente la distribución de la factura en el sistema.",
        expectedResult: 'La ventana emergente se cierra, los datos quedan grabados de manera definitiva y el sistema retorna el mensaje de éxito.',
        tip: "También puedes presionar la tecla 'Enter' cuando el foco se encuentre en el botón 'Sí' para confirmar rápidamente.",
        image: getSapStep6Screenshot(),
        annotations: [
          {
            id: 'ann-sap-6',
            x: 21,
            y: 46,
            shape: 'circle',
            color: '#ef4444',
            label: "Presionar 'Sí'",
            labelPosition: 'bottom',
          },
        ],
      },
    ],
    troubleshooting: [
      {
        problem: 'El sistema arroja error de que la Solicitud no existe o no tiene registros asociados.',
        solution: 'Comprueba que el número de solicitud y el código de sociedad ingresados sean exactos y que las órdenes de compra asociadas se encuentren vigentes y liberadas.',
      },
      {
        problem: "El botón 'Grabar Datos' no genera ninguna acción o no almacena.",
        solution: 'Asegúrate de haber seleccionado previamente la fila correspondiente en la grilla izquierda (debe resaltar en color azul) antes de presionar el botón.',
      },
      {
        problem: 'Los importes en moneda SAP no cuadran con el total de la factura.',
        solution: 'Revisa las condiciones comerciales (&ICL, &ICP, &ICH, &ICK) en la tabla inferior y coordina con el área de Comex para actualizar el tipo de cambio o regla de cálculo.',
      },
    ],
    summaryChecklist: [
      'Transacción ZMMT0033 ejecutada correctamente',
      'Parámetros de Sociedad y Solicitud completados con datos válidos',
      'Líneas de factura e importes validados contra la documentación de comercio exterior',
      "Botón 'Grabar Datos' presionado para cada factura a distribuir",
      "Confirmación 'Sí' aceptada en el cuadro de diálogo modal",
      "Mensaje de éxito 'Datos han sido almacenados...' verificado en la barra de estado",
    ],
  },
  {
    id: 'manual-facturacion',
    projectId: 'prj-weber-wms-hu',
    title: 'Guía de Emisión y Timbrado de Facturas Electrónicas',
    subtitle: 'Procedimiento paso a paso para generar y certificar comprobantes fiscales en la plataforma web',
    overview: 'Este manual describe el flujo estándar para emitir una nueva factura electrónica con desglose de impuestos, adjuntar notas de crédito y enviar el comprobante automáticamente por correo al cliente.',
    targetAudience: 'Personal administrativo, contabilidad y gerencia de facturación',
    estimatedMinutes: 5,
    difficulty: 'Principiante',
    prerequisites: [
      'Credenciales de acceso con rol de Emisor o Administrador',
      'Certificados de Sello Digital (CSD) vigentes cargados en la empresa',
      'Cliente registrado con RFC o ID fiscal válido',
    ],
    createdAt: '2026-10-10T14:30:00.000Z',
    updatedAt: '2026-10-12T09:15:00.000Z',
    version: '2.1',
    category: 'Finanzas & Facturación',
    steps: [
      {
        id: 'step-f1',
        stepNumber: 1,
        title: 'Accede al módulo de Pagos & Facturación',
        actionType: 'navigate',
        description: 'Desde la barra de navegación lateral izquierda del panel principal, haz clic en la sección "Pagos & Facturación" para desplegar las opciones contables.',
        targetElement: 'Menú lateral: Pagos & Facturación',
        expectedResult: 'Se cargará la vista general del tablero con el listado de facturas recientes y el botón para nueva emisión.',
        tip: 'Puedes utilizar el atajo de teclado Ctrl+Shift+F para abrir directamente el listado de comprobantes.',
        instructorNotes: 'El instructor explicó: "Siempre ingresamos por el panel lateral en Pagos & Facturación; eviten usar los accesos directos viejos para que se cargue la versión 4.0 del SAT".',
        instructorAudioQuote: 'Siempre ingresamos por el panel lateral en Pagos & Facturación para cargar la versión actualizada.',
        image: createMockScreenshot('Panel de Facturación', 'Vista consolidada de comprobantes fiscales emitidos', 'Nueva Factura', '#6366f1'),
        annotations: [
          {
            id: 'ann-1',
            x: 12,
            y: 40,
            shape: 'circle',
            color: '#ef4444',
            label: '1. Clic en Facturación',
          },
        ],
      },
      {
        id: 'step-f2',
        stepNumber: 2,
        title: 'Haz clic en el botón "Nueva Factura"',
        actionType: 'click',
        description: 'Ubica el botón principal de acción situado en la esquina inferior derecha del panel y presiona para abrir el asistente de creación.',
        targetElement: 'Botón primario "Nueva Factura"',
        expectedResult: 'Se abrirá el formulario modular para capturar los datos del receptor y las partidas.',
        warning: 'Verifica tener conexión estable a internet para asegurar la validación en tiempo real con el proveedor de certificación (PAC).',
        instructorNotes: 'El instructor enfatizó: "Fíjense que el botón azul está abajo a la derecha; si no les aparece activo es porque les falta el permiso de timbrado en su perfil".',
        instructorAudioQuote: 'Fíjense que el botón azul está abajo a la derecha; requiere permiso de timbrado activo.',
        image: createMockScreenshot('Nueva Factura Electrónica', 'Ingreso de partida y selección de cliente', 'Timbrar Factura', '#6366f1'),
        annotations: [
          {
            id: 'ann-2',
            x: 85,
            y: 83,
            shape: 'circle',
            color: '#ef4444',
            label: '2. Clic en Nueva Factura',
          },
        ],
      },
      {
        id: 'step-f3',
        stepNumber: 3,
        title: 'Selecciona el Cliente y verifica el Régimen Fiscal',
        actionType: 'select',
        description: 'Escribe el nombre o RFC de la empresa en el campo "Cliente / RFC". El autocompletado desplegará las opciones coincidentes registradas en tu catálogo.',
        targetElement: 'Campo de búsqueda de Cliente',
        expectedResult: 'Los datos de domicilio fiscal, correo electrónico y método de pago se rellenarán automáticamente.',
        tip: 'Si el cliente es nuevo, puedes presionar el icono "+" dentro del campo para darlo de alta sin salir del formulario.',
        instructorNotes: 'El instructor indicó: "Aquí mucho cuidado con el código postal y el régimen 601 General de Ley; si no coinciden exactamente con la Constancia de Situación Fiscal del cliente, el PAC rechazará el timbrado".',
        instructorAudioQuote: 'Mucho cuidado con el código postal y el régimen; deben coincidir exactamente con la Constancia Fiscal.',
        image: createMockScreenshot('Detalle del Cliente', 'Validación de razón social y código postal fiscal', 'Continuar a Conceptos', '#6366f1'),
        annotations: [
          {
            id: 'ann-3',
            x: 45,
            y: 38,
            shape: 'rect',
            color: '#10b981',
            label: '3. Seleccionar Cliente',
          },
        ],
      },
      {
        id: 'step-f4',
        stepNumber: 4,
        title: 'Revisa las partidas y presiona "Timbrar Factura"',
        actionType: 'verify',
        description: 'Inspecciona que las cantidades, precios unitarios e IVA desglosado concuerden con la orden de compra. Luego, haz clic en el botón azul "Timbrar Factura".',
        targetElement: 'Botón final "Timbrar Factura"',
        expectedResult: 'El sistema enviará el XML al SAT/PAC y devolverá el folio fiscal UUID con su código QR certificado.',
        warning: 'Una vez timbrada la factura, cualquier modificación requerirá emitir una nota de crédito o cancelación formal.',
        instructorNotes: 'El instructor concluyó: "Una vez presionado Timbrar Factura, esperen tres segundos a que aparezca el folio fiscal UUID verde antes de cerrar la pestaña del navegador".',
        instructorAudioQuote: 'Esperen tres segundos a que aparezca el folio fiscal UUID verde antes de cerrar la pestaña.',
        image: createMockScreenshot('Confirmación de Timbrado', 'Generación de XML y PDF oficial', 'Descargar PDF / XML', '#10b981'),
        annotations: [
          {
            id: 'ann-4',
            x: 82,
            y: 83,
            shape: 'circle',
            color: '#ef4444',
            label: '4. Clic en Timbrar Factura',
          },
        ],
      },
    ],
    troubleshooting: [
      {
        problem: 'Error "CSD caducado o inválido" al intentar timbrar',
        solution: 'Ve a Configuración > Certificados y carga el archivo .cer y .key actualizado con su contraseña correspondiente.',
      },
      {
        problem: 'El cliente no recibe el correo electrónico con el PDF',
        solution: 'Comprueba en el historial de envíos si el correo fue rebotado o activa el reenvío manual desde el menú de opciones de la factura.',
      },
    ],
    summaryChecklist: [
      'Cliente seleccionado con RFC y código postal vigentes',
      'Líneas de productos con clave de producto/servicio correcta',
      'Desglose de impuestos revisado',
      'Folio fiscal UUID generado con éxito',
    ],
  },
  {
    id: 'manual-2fa-seguridad',
    projectId: 'prj-weber-wms-hu',
    title: 'Activación de Autenticación en Dos Pasos (2FA)',
    subtitle: 'Protege tu cuenta corporativa mediante códigos temporales TOTP en Google Authenticator',
    overview: 'Instrucciones obligatorias para que los colaboradores activen el segundo factor de seguridad en sus dispositivos móviles y protejan la información confidencial de la organización.',
    targetAudience: 'Todos los colaboradores y usuarios de la plataforma',
    estimatedMinutes: 3,
    difficulty: 'Principiante',
    prerequisites: [
      'Teléfono móvil con cámara funcional',
      'Aplicación Google Authenticator, Authy o 1Password instalada',
    ],
    createdAt: '2026-10-08T11:00:00.000Z',
    updatedAt: '2026-10-09T18:00:00.000Z',
    version: '1.2',
    category: 'Seguridad & Cuenta',
    steps: [
      {
        id: 'step-2fa-1',
        stepNumber: 1,
        title: 'Ingresa a Ajustes de Seguridad',
        actionType: 'navigate',
        description: 'Haz clic sobre tu avatar en la esquina superior derecha y selecciona la opción "Seguridad & Contraseña".',
        targetElement: 'Menú de Perfil > Seguridad',
        expectedResult: 'Aparecerá la ventana de configuración de credenciales y dispositivos autorizados.',
        image: createMockScreenshot('Seguridad de la Cuenta', 'Gestión de contraseñas y accesos protegidos', 'Activar 2FA', '#0ea5e9'),
        annotations: [
          {
            id: 'ann-2fa-1',
            x: 80,
            y: 82,
            shape: 'circle',
            color: '#ef4444',
            label: '1. Activar 2FA',
          },
        ],
      },
      {
        id: 'step-2fa-2',
        stepNumber: 2,
        title: 'Escanea el Código QR con tu App Móvil',
        actionType: 'info',
        description: 'Abre Google Authenticator o Authy en tu celular, pulsa en "+" y enfoca la cámara sobre el código QR que se muestra en pantalla.',
        targetElement: 'Código QR de vinculación TOTP',
        expectedResult: 'Tu aplicación móvil mostrará una nueva cuenta llamada "Plataforma Pro" con un código de 6 dígitos que cambia cada 30 segundos.',
        tip: 'Guarda también la clave de texto alternativa en tu gestor de contraseñas seguro por si cambias de celular.',
        image: createMockScreenshot('Vincular Dispositivo', 'Escaneo de código QR mediante app TOTP', 'Verificar Código', '#0ea5e9'),
        annotations: [
          {
            id: 'ann-2fa-2',
            x: 50,
            y: 50,
            shape: 'rect',
            color: '#3b82f6',
            label: '2. Escanear Código QR',
          },
        ],
      },
      {
        id: 'step-2fa-3',
        stepNumber: 3,
        title: 'Introduce el código de 6 dígitos y confirma',
        actionType: 'type',
        description: 'Ingresa el código temporal actual mostrado en tu teléfono móvil y presiona el botón "Confirmar y Activar".',
        targetElement: 'Campo de código numérico de 6 dígitos',
        expectedResult: 'El sistema marcará la autenticación en dos pasos como ACTIVA y generará 5 códigos de recuperación de emergencia.',
        warning: 'Descarga e imprime los códigos de emergencia de un solo uso; serán tu único salvavidas si pierdes el móvil.',
        image: createMockScreenshot('2FA Activado Exitosamente', 'Códigos de recuperación y estado seguro', 'Descargar Códigos', '#10b981'),
        annotations: [
          {
            id: 'ann-2fa-3',
            x: 80,
            y: 82,
            shape: 'circle',
            color: '#10b981',
            label: '3. Descargar Códigos',
          },
        ],
      },
    ],
    troubleshooting: [
      {
        problem: 'El código de 6 dígitos es rechazado repetidamente',
        solution: 'Comprueba que la hora de tu teléfono esté sincronizada automáticamente por red (Ajustes > Fecha y Hora > Automática).',
      },
    ],
    summaryChecklist: [
      'App de autenticación configurada',
      'Código de prueba verificado',
      'Códigos de recuperación guardados en lugar seguro',
    ],
  },
];
