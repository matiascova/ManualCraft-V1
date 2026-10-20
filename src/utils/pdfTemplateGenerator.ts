import { jsPDF } from 'jspdf';
import { UserManual, getActionTypeSpanish, formatStepOperativeTitle } from '../types/manual';
import { Project } from '../types/project';
import { OrganizationBranding } from '../types/branding';
import { renderAnnotatedScreenshotForPdf } from './exportUtils';
import { getEffectiveInstructorContent } from './instructorUtils';
import {
  isSapManual,
  detectSapTransactionCode,
  detectSapModuleCode,
  isZMMT0020Transaction,
} from './sapProcessMatrix';

export interface LogoDim {
  width: number;
  height: number;
  aspect: number;
}

/**
 * Accurately measures natural image dimensions in browser to preserve aspect ratio
 */
export function getImageDimensions(src?: string): Promise<LogoDim | null> {
  if (!src || typeof src !== 'string' || src.length < 10) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
            aspect: img.naturalWidth / img.naturalHeight,
          });
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Synchronous fallback: parses PNG header to get natural aspect ratio
 */
function getAspectFromBase64Sync(dataUrl?: string): number | null {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const commaIdx = dataUrl.indexOf(',');
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  if (base64.length < 40) return null;
  try {
    const bin = atob(base64.slice(0, 100));
    // PNG check: 0x89 0x50 0x4E 0x47
    if (bin.charCodeAt(0) === 0x89 && bin.charCodeAt(1) === 0x50) {
      const w =
        (bin.charCodeAt(16) << 24) |
        (bin.charCodeAt(17) << 16) |
        (bin.charCodeAt(18) << 8) |
        bin.charCodeAt(19);
      const h =
        (bin.charCodeAt(20) << 24) |
        (bin.charCodeAt(21) << 16) |
        (bin.charCodeAt(22) << 8) |
        bin.charCodeAt(23);
      if (w > 0 && h > 0) return w / h;
    }
  } catch {}
  return null;
}

/**
 * Draws high-precision vector or bitmap corporate logos matching the official template:
 * - Preserves exact aspect ratio for bitmap logos (no squashing or distortion)
 * - Nuestro Logo (Organización Emisora / Weber / HSBT) on the left
 * - Logo del Cliente (o Sello HSBT Compromiso & Calidad) on the right
 */
function drawCorporateLogos(
  doc: jsPDF,
  leftX: number,
  rightX: number,
  y: number,
  isMini = false,
  branding?: OrganizationBranding,
  clientLogo?: string,
  clientName?: string,
  ourLogoDim?: LogoDim | null,
  clientLogoDim?: LogoDim | null
) {
  const scale = isMini ? 0.65 : 1;
  const ourLogoUrl = branding?.logo;
  const ourCompanyName = branding?.companyName || clientName || 'ORGANIZACIÓN';
  const ourSlogan = branding?.companySlogan || 'DOCUMENTACIÓN DE PROCESOS';

  // 1. LEFT SIDE: NUESTRO LOGO (Organización Emisora)
  let ourDrawn = false;
  if (ourLogoUrl && typeof ourLogoUrl === 'string' && ourLogoUrl.length > 10) {
    try {
      const maxW = isMini ? 26 : 52;
      const maxH = isMini ? 8 : 22;

      let aspect = ourLogoDim?.aspect;
      if (!aspect || isNaN(aspect) || aspect <= 0) {
        try {
          const props = (doc as any).getImageProperties?.(ourLogoUrl);
          if (props && props.width > 0 && props.height > 0) {
            aspect = props.width / props.height;
          }
        } catch {}
      }
      if (!aspect || isNaN(aspect) || aspect <= 0) {
        aspect = getAspectFromBase64Sync(ourLogoUrl) || 2.5;
      }

      let renderW: number;
      let renderH: number;
      if (aspect >= maxW / maxH) {
        renderW = maxW;
        renderH = maxW / aspect;
      } else {
        renderH = maxH;
        renderW = maxH * aspect;
      }

      const drawY = y + (maxH - renderH) / 2;
      doc.addImage(ourLogoUrl, leftX, drawY, renderW, renderH, undefined, 'FAST');
      ourDrawn = true;
    } catch {
      ourDrawn = false;
    }
  }

  if (!ourDrawn) {
    // Elegant Corporate Crest fallback (Navy / Indigo)
    doc.setFillColor(24, 59, 108); // Corporate Navy #183B6C
    doc.roundedRect(leftX, y + 1 * scale, 7 * scale, 7 * scale, 1.2 * scale, 1.2 * scale, 'F');
    doc.setFillColor(37, 99, 235); // Blue Accent
    doc.rect(leftX + 1.8 * scale, y + 2.2 * scale, 3.4 * scale, 4.5 * scale, 'F');
    doc.setFillColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isMini ? 5 : 7);
    doc.text((ourCompanyName || 'O').charAt(0).toUpperCase(), leftX + 3.5 * scale, y + 5.5 * scale, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isMini ? 8.5 : 12.5);
    doc.setTextColor(15, 23, 42);
    doc.text(ourCompanyName, leftX + 9.5 * scale, y + 5 * scale);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(isMini ? 4.5 : 5.8);
    doc.setTextColor(71, 85, 105);
    const line2 = ourSlogan.length > 25 ? ourSlogan.slice(0, 24) + '...' : ourSlogan;
    doc.text(line2.toUpperCase(), leftX + 9.5 * scale, y + 8.2 * scale);
  }

  // 2. RIGHT SIDE: LOGO DEL CLIENTE / SELLO HSBT
  let rightDrawn = false;
  if (clientLogo && typeof clientLogo === 'string' && clientLogo.length > 10) {
    try {
      const maxW = isMini ? 26 : 52;
      const maxH = isMini ? 8 : 22;

      let aspect = clientLogoDim?.aspect;
      if (!aspect || isNaN(aspect) || aspect <= 0) {
        try {
          const props = (doc as any).getImageProperties?.(clientLogo);
          if (props && props.width > 0 && props.height > 0) {
            aspect = props.width / props.height;
          }
        } catch {}
      }
      if (!aspect || isNaN(aspect) || aspect <= 0) {
        aspect = getAspectFromBase64Sync(clientLogo) || 2.5;
      }

      let renderW: number;
      let renderH: number;
      if (aspect >= maxW / maxH) {
        renderW = maxW;
        renderH = maxW / aspect;
      } else {
        renderH = maxH;
        renderW = maxH * aspect;
      }

      const drawX = rightX - renderW;
      const drawY = y + (maxH - renderH) / 2;
      doc.addImage(clientLogo, drawX, drawY, renderW, renderH, undefined, 'FAST');
      rightDrawn = true;
    } catch {
      rightDrawn = false;
    }
  }

  if (!rightDrawn) {
    // HSBT / Partner block
    const hsbtBoxW = isMini ? 12 : 18;
    const hsbtBoxH = isMini ? 7 : 10.5;
    const hsbtBoxX = rightX - hsbtBoxW;

    // Navy block
    doc.setFillColor(24, 59, 108); // #183B6C
    doc.rect(hsbtBoxX, y, hsbtBoxW, hsbtBoxH, 'F');

    // Vertical brand lines
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.3);
    doc.line(hsbtBoxX + hsbtBoxW * 0.33, y, hsbtBoxX + hsbtBoxW * 0.33, y + hsbtBoxH);
    doc.line(hsbtBoxX + hsbtBoxW * 0.66, y, hsbtBoxX + hsbtBoxW * 0.66, y + hsbtBoxH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isMini ? 6.5 : 8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(branding?.secondaryName || 'HSBT', hsbtBoxX + hsbtBoxW / 2, y + (isMini ? 4.8 : 6.8), {
      align: 'center',
    });

    if (!isMini) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4);
      doc.setTextColor(71, 85, 105);
      doc.text(branding?.secondarySlogan || 'COMPROMISO & CALIDAD', hsbtBoxX + hsbtBoxW / 2, y + hsbtBoxH + 2.5, {
        align: 'center',
      });
    }
  }
}

/**
 * Generates an executive corporate SAP User Manual PDF matching the exact structure
 * of the 18-page reference template:
 *
 * 1. Portada Dedicada con Logotipos Duales, Gran Banner Azul Marino y Ficha Técnica de Control Documental.
 * 2. Índice Formal con Guías de Puntos y Numeración Dinámica Exacta.
 * 3. Sección 1: Introducción, Objetivo, Matriz de Escenarios y Datos de Referencia SAP.
 * 4. Sección 2: Flujo del Proceso en Tabla Matriz Completa (#, Paso, Transacción, Módulo, Observación).
 * 5. Secciones Procedurales Detalladas con Franja de Transacción, Pasos Numerados, Captura Enmarcada y Cajas de Llamado (Importante, Escenario, Consejo).
 * 6. Resolución de Problemas y Lista de Verificación.
 * 7. Encabezado y Pie de Página Corporativo con "Página X de Y" en todas las hojas.
 */
export async function exportToPdfWithTemplateStructure(
  manual: UserManual,
  onProgress?: (msg: string) => void,
  project?: Project,
  branding?: OrganizationBranding
): Promise<void> {
  if (onProgress) onProgress('Iniciando generación con estructura oficial del template...');

  const effectiveBranding = branding;
  const effectiveClientLogo = project?.clientLogo;
  const effectiveClientName = project?.clientName;

  const isSap = isSapManual(manual, project);
  const isZ20 = isZMMT0020Transaction(manual);

  // Measure natural dimensions of logos to eliminate any stretching or distortion
  const [ourLogoDim, clientLogoDim] = await Promise.all([
    getImageDimensions(effectiveBranding?.logo),
    getImageDimensions(effectiveClientLogo),
  ]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2; // 178mm
  const maxY = pageHeight - 20; // 277mm max Y before running footer

  const navyColor: [number, number, number] = [24, 59, 108]; // #183B6C
  const blueRuleColor: [number, number, number] = [37, 99, 235];

  const stepStartPages: Record<number, number> = {};

  // =========================================================================
  // --- PÁGINA 1: PORTADA EJECUTIVA CORPORATIVA (TEMPLATE PÁGINA 1) ---
  // =========================================================================
  if (onProgress) onProgress('Renderizando Portada Ejecutiva con Ficha Técnica...');

  // Top Corporate Logos (Nuestro Logo + Logo del Cliente / HSBT)
  drawCorporateLogos(
    doc,
    marginX,
    marginX + contentWidth,
    16,
    false,
    effectiveBranding,
    effectiveClientLogo,
    effectiveClientName,
    ourLogoDim,
    clientLogoDim
  );

  // Large Navy Blue Banner
  const bannerY = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const titleLines = doc.splitTextToSize(manual.title, contentWidth - 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const subtitleText =
    manual.subtitle ||
    manual.overview ||
    'Procedimiento técnico y operativo paso a paso · Documentación estándar de procesos';
  const subLines = doc.splitTextToSize(subtitleText, contentWidth - 16);

  const bannerHeight = Math.max(
    48,
    14 + titleLines.length * 8.5 + subLines.length * 4.8 + 8
  );

  // Navy banner rectangle
  doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.rect(marginX, bannerY, contentWidth, bannerHeight, 'F');

  // Kicker inside banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(
    isSap
      ? 'MANUAL DE USUARIO SAP'
      : (manual.category ? `MANUAL DE PROCEDIMIENTO · ${manual.category.toUpperCase()}` : 'MANUAL DE PROCEDIMIENTO OPERATIVO'),
    marginX + 8,
    bannerY + 11
  );

  // Main Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  let titleY = bannerY + 20;
  titleLines.forEach((tLine: string) => {
    doc.text(tLine, marginX + 8, titleY);
    titleY += 8.2;
  });

  // Subtitle / Scope
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(147, 197, 253); // Light cyan #93C5FD
  let subY = titleY + 1;
  subLines.forEach((sLine: string) => {
    doc.text(sLine, marginX + 8, subY);
    subY += 4.6;
  });

  // Technical Control Table (Ficha Técnica de Control Documental)
  const tableY = bannerY + bannerHeight + 22;
  const col1W = 28;
  const col2W = 61;
  const col3W = 28;
  const col4W = 61;
  const rowH = 8.2;

  const dateStr = new Date(manual.updatedAt || manual.createdAt || Date.now()).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const metaRows: Array<[string, string, string, string]> = [
    [
      'Cliente',
      project?.clientName || 'Cliente',
      'Documento',
      'Manual de usuario',
    ],
    [
      'Proceso',
      manual.title.length > 32 ? `${manual.title.substring(0, 30)}...` : manual.title,
      'Módulo',
      manual.category || project?.category || 'ERP / Sistema',
    ],
    [
      'Proyecto',
      project?.name ? (project.name.length > 28 ? `${project.name.substring(0, 26)}...` : project.name) : 'Implementación',
      'Código',
      manual.code || project?.code || 'MAN-01',
    ],
    [
      'Versión',
      `v${manual.version || '1.0'}`,
      'Fecha',
      formattedDate,
    ],
    [
      'Elaborado por',
      manual.author || project?.author || effectiveBranding?.companyName || 'HSBT',
      'Estado',
      project?.status || 'Aprobado',
    ],
  ];

  doc.setDrawColor(209, 213, 219); // #D1D5DB
  doc.setLineWidth(0.25);

  metaRows.forEach((row, rIdx) => {
    const curRowY = tableY + rIdx * rowH;

    // Col 1
    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, curRowY, col1W, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(row[0], marginX + 3.5, curRowY + 5.2);

    // Col 2
    doc.setFillColor(255, 255, 255);
    doc.rect(marginX + col1W, curRowY, col2W, rowH, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(row[1], marginX + col1W + 3.5, curRowY + 5.2);

    // Col 3
    doc.setFillColor(241, 245, 249);
    doc.rect(marginX + col1W + col2W, curRowY, col3W, rowH, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(row[2], marginX + col1W + col2W + 3.5, curRowY + 5.2);

    // Col 4
    doc.setFillColor(255, 255, 255);
    doc.rect(marginX + col1W + col2W + col3W, curRowY, col4W, rowH, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(row[3], marginX + col1W + col2W + col3W + 3.5, curRowY + 5.2);
  });

  // Page 1 End -> Add Page 2
  doc.addPage();
  const tocPage = 2;

  // =========================================================================
  // --- PÁGINA 2: ÍNDICE FORMAL (TEMPLATE PÁGINA 2) ---
  // =========================================================================
  if (onProgress) onProgress('Preparando Índice con estructura jerárquica...');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.text('ÍNDICE', marginX, 26);

  doc.setDrawColor(blueRuleColor[0], blueRuleColor[1], blueRuleColor[2]);
  doc.setLineWidth(0.8);
  doc.line(marginX, 29, marginX + contentWidth, 29);

  const tocStartY = 38;

  // Page 2 End -> Add Page 3
  doc.addPage();

  // =========================================================================
  // --- PÁGINA 3: 1. INTRODUCCIÓN & PARÁMETROS (TEMPLATE PÁGINA 3) ---
  // =========================================================================
  if (onProgress) onProgress('Generando Sección 1: Introducción, Escenarios y Referencias...');
  const introPage = 3;

  let currentY = 25;

  // Section Heading: 1. INTRODUCCIÓN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.text('1. INTRODUCCIÓN', marginX, currentY);

  doc.setDrawColor(blueRuleColor[0], blueRuleColor[1], blueRuleColor[2]);
  doc.setLineWidth(0.6);
  doc.line(marginX, currentY + 2.5, marginX + contentWidth, currentY + 2.5);
  currentY += 10;

  // 1.1 Objetivo y Alcance
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.text('1.1 Objetivo y Alcance Operativo', marginX, currentY);
  currentY += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const overviewText =
    manual.overview ||
    `El presente manual describe el procedimiento para ${manual.title} en ${project?.clientName || 'la organización'}: una operativa que enlaza las transacciones y pasos requeridos garantizando total trazabilidad e integridad.`;
  const introLines = doc.splitTextToSize(overviewText, contentWidth);
  doc.text(introLines, marginX, currentY);
  currentY += introLines.length * 4.4 + 5;

  if (manual.subtitle) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const subLines = doc.splitTextToSize(manual.subtitle, contentWidth);
    doc.text(subLines, marginX, currentY);
    currentY += subLines.length * 4.0 + 5;
  }

  // 1.2 Requisitos Previos del Proceso
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  // 1.2 Requisitos Previos (Only if present in manual data)
  if (manual.prerequisites && manual.prerequisites.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.text('1.2 Requisitos Previos y Destinatarios', marginX, currentY);
    currentY += 5.5;

    manual.prerequisites.forEach((reqText) => {
      doc.setFillColor(37, 99, 235); // Blue square bullet
      doc.rect(marginX + 1, currentY - 2.8, 2.2, 2.2, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(51, 65, 85);
      const rLines = doc.splitTextToSize(reqText, contentWidth - 8);
      doc.text(rLines, marginX + 6, currentY);
      currentY += rLines.length * 4.2 + 2;
    });
    currentY += 4;
  }

  // Ficha Técnica del Proceso (1.3 if prereqs exist, 1.2 if not)
  const pdfFichaNum = (manual.prerequisites && manual.prerequisites.length > 0) ? '1.3' : '1.2';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.text(`${pdfFichaNum} Ficha Técnica del Proceso`, marginX, currentY);
  currentY += 5.5;

  const realFichaData: Array<[string, string]> = [
    ['Proyecto Asociado', project?.name || 'Procedimiento Operativo'],
    ['Código de Identificación', manual.code || project?.code || 'MAN-PROC-001'],
    ['Cliente / Entidad', project?.clientName || 'Organización'],
    ['Audiencia y Destinatarios', manual.targetAudience || project?.targetAudience || 'Usuarios finales y operativos'],
    ['Tiempo Estimado de Ejecución', `${manual.estimatedMinutes || 5} minutos (Nivel ${manual.difficulty || 'Operativo'})`],
    ['Módulo / Categoría de Sistema', manual.category || project?.category || 'ERP / Gestión de Procesos'],
    ['Autor / Responsable', manual.author || project?.author || effectiveBranding?.companyName || 'Equipo de Procesos'],
    ['Secuencia Operativa', `${manual.steps.length} pasos procedimentales estructurados`],
  ];

  const fichaCol1W = 60;
  const fichaRowH = 6.8;

  // Ficha Table Header
  doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.rect(marginX, currentY, contentWidth, fichaRowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Parámetro / Elemento', marginX + 3, currentY + 4.5);
  doc.text('Valor Configurado para este Manual', marginX + fichaCol1W + 3, currentY + 4.5);
  currentY += fichaRowH;

  realFichaData.forEach((r, rIdx) => {
    const isEven = rIdx % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(marginX, currentY, contentWidth, fichaRowH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(r[0], marginX + 3, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(r[1], marginX + fichaCol1W + 3, currentY + 4.5);

    currentY += fichaRowH;
  });

  // Page 3 End -> Add Page 4
  doc.addPage();
  const flowPage = 4;

  // =========================================================================
  // --- PÁGINA 4: 2. FLUJO DEL PROCESO (TEMPLATE PÁGINA 4) ---
  // =========================================================================
  if (onProgress) onProgress('Generando Sección 2: Matriz de Flujo del Proceso...');

  currentY = 25;

  // Section Heading: 2. FLUJO DEL PROCESO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.text('2. FLUJO DEL PROCESO', marginX, currentY);

  doc.setDrawColor(blueRuleColor[0], blueRuleColor[1], blueRuleColor[2]);
  doc.setLineWidth(0.6);
  doc.line(marginX, currentY + 2.5, marginX + contentWidth, currentY + 2.5);
  currentY += 10;

  // Explanatory note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    isSap
      ? isZ20
        ? 'La siguiente tabla resume la secuencia completa del proceso y la transacción a utilizar en cada paso (Transacción ZMMT0020).'
        : 'La siguiente tabla resume el módulo SAP, la secuencia cronológica de pasos y la transacción a utilizar en cada paso.'
      : 'La siguiente tabla resume la secuencia cronológica de pasos, acciones e interacciones registradas en el sistema.',
    marginX,
    currentY
  );
  currentY += 6;

  // Process Flow Table Header
  // REGLA: Adicionar el módulo de SAP para presentarlo en esta página y dejarlo como primera columna.
  // Si estamos en la transacción ZMMT0020, no es necesario que se muestre esa columna.
  const flowColW = isSap
    ? isZ20
      ? [12, 74, 38, 54] // ZMMT0020: Módulo omitido (# [12], Paso [74], Transacción [38], Observación [54]) = 178
      : [18, 10, 64, 32, 54] // SAP estándar: Módulo como PRIMERA COLUMNA (Módulo [18], # [10], Paso [64], Transacción [32], Observación [54]) = 178
    : [10, 68, 28, 32, 40];
  const flowH = 7.5;

  const renderFlowHeader = (targetY: number) => {
    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(marginX, targetY, contentWidth, flowH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let fX = marginX;
    if (isSap) {
      if (!isZ20) {
        // Columna 1: Módulo SAP
        doc.text('Módulo', fX + 3.5, targetY + 4.8);
        fX += flowColW[0];
        // Columna 2: #
        doc.text('#', fX + 3.5, targetY + 4.8);
        fX += flowColW[1];
        // Columna 3: Paso
        doc.text('Paso Operativo', fX + 2.5, targetY + 4.8);
        fX += flowColW[2];
        // Columna 4: Transacción
        doc.text('Transacción', fX + 2.5, targetY + 4.8);
        fX += flowColW[3];
        // Columna 5: Observación
        doc.text('Observación / Campo Clave', fX + 2.5, targetY + 4.8);
      } else {
        // ZMMT0020: Sin columna de módulo
        doc.text('#', fX + 4.5, targetY + 4.8);
        fX += flowColW[0];
        doc.text('Paso Operativo', fX + 2.5, targetY + 4.8);
        fX += flowColW[1];
        doc.text('Transacción', fX + 2.5, targetY + 4.8);
        fX += flowColW[2];
        doc.text('Observación / Campo Clave', fX + 2.5, targetY + 4.8);
      }
    } else {
      doc.text('#', fX + 3.5, targetY + 4.8);
      fX += flowColW[0];
      doc.text('Paso', fX + 2.5, targetY + 4.8);
      fX += flowColW[1];
      doc.text('Acción', fX + 2.5, targetY + 4.8);
      fX += flowColW[2];
      doc.text('Elemento / Interfaz', fX + 2.5, targetY + 4.8);
      fX += flowColW[3];
      doc.text('Resultado Esperado', fX + 2.5, targetY + 4.8);
    }
  };

  renderFlowHeader(currentY);
  currentY += flowH;

  // Build sequence matrix from manual.steps
  manual.steps.forEach((step, sIdx) => {
    // Pagination check to avoid overflowing process flow table
    if (currentY + flowH > maxY - 15) {
      doc.addPage();
      currentY = 25;
      renderFlowHeader(currentY);
      currentY += flowH;
    }

    const isEven = sIdx % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(marginX, currentY, contentWidth, flowH, 'FD');

    if (isSap) {
      const txCode = detectSapTransactionCode(manual, step);
      const modStr = detectSapModuleCode(manual, step, txCode);
      const obsText = step.expectedResult || step.description;

      if (!isZ20) {
        // Columna 1: Módulo SAP (PRIMERA COLUMNA)
        let curColX = marginX;
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(curColX + 2, currentY + 1.5, 14, 4.5, 0.8, 0.8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text(modStr.slice(0, 5), curColX + 9, currentY + 4.6, { align: 'center' });

        // Columna 2: #
        curColX += flowColW[0];
        doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
        doc.roundedRect(curColX + 1.5, currentY + 1.5, 7, 4.5, 0.8, 0.8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text(`${sIdx + 1}`, curColX + 5, currentY + 4.6, { align: 'center' });

        // Columna 3: Paso
        curColX += flowColW[1];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        const opTitle1 = formatStepOperativeTitle(step.title, sIdx + 1);
        const stepShortTitle = doc.splitTextToSize(opTitle1, flowColW[2] - 4)[0];
        doc.text(stepShortTitle, curColX + 2, currentY + 4.8);

        // Columna 4: Transacción
        curColX += flowColW[2];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(24, 59, 108);
        doc.text(txCode, curColX + 2, currentY + 4.8);

        // Columna 5: Observación
        curColX += flowColW[3];
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        const shortObs = doc.splitTextToSize(obsText, flowColW[4] - 4)[0];
        doc.text(shortObs, curColX + 2, currentY + 4.8);
      } else {
        // ZMMT0020: Módulo omitido
        // Columna 1: #
        let curColX = marginX;
        doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
        doc.roundedRect(curColX + 2, currentY + 1.5, 8, 4.5, 0.8, 0.8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text(`${sIdx + 1}`, curColX + 6, currentY + 4.6, { align: 'center' });

        // Columna 2: Paso
        curColX += flowColW[0];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        const opTitle2 = formatStepOperativeTitle(step.title, sIdx + 1);
        const stepShortTitle = doc.splitTextToSize(opTitle2, flowColW[1] - 4)[0];
        doc.text(stepShortTitle, curColX + 2, currentY + 4.8);

        // Columna 3: Transacción
        curColX += flowColW[1];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(24, 59, 108);
        doc.text(txCode || 'ZMMT0020', curColX + 2, currentY + 4.8);

        // Columna 4: Observación
        curColX += flowColW[2];
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        const shortObs = doc.splitTextToSize(obsText, flowColW[3] - 4)[0];
        doc.text(shortObs, curColX + 2, currentY + 4.8);
      }
    } else {
      // Number Badge
      doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.roundedRect(marginX + 1.5, currentY + 1.5, 7, 4.5, 0.8, 0.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`${sIdx + 1}`, marginX + 5, currentY + 4.6, { align: 'center' });

      // Step Title
      let curColX = marginX + flowColW[0];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      const opTitle3 = formatStepOperativeTitle(step.title, sIdx + 1);
      const stepShortTitle = doc.splitTextToSize(opTitle3, flowColW[1] - 4)[0];
      doc.text(stepShortTitle, curColX + 2, currentY + 4.8);

      // Action Type Badge
      curColX += flowColW[1];
      const actionName = getActionTypeSpanish(step.actionType);
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(curColX + 1.5, currentY + 1.5, flowColW[2] - 3, 4.5, 0.8, 0.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(255, 255, 255);
      doc.text(actionName, curColX + flowColW[2] / 2, currentY + 4.6, { align: 'center' });

      // Target Element / Screen
      curColX += flowColW[2];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(24, 59, 108);
      const elemText = step.targetElement || 'Interfaz';
      const shortElem = doc.splitTextToSize(elemText, flowColW[3] - 4)[0];
      doc.text(shortElem, curColX + 2, currentY + 4.8);

      // Expected Result
      curColX += flowColW[3];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const obsText = step.expectedResult || step.description;
      const shortObs = doc.splitTextToSize(obsText, flowColW[4] - 4)[0];
      doc.text(shortObs, curColX + 2, currentY + 4.8);
    }

    currentY += flowH;
  });

  // Footnote
  currentY += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    isSap
      ? 'Nota: las transacciones indicadas corresponden a la parametrización estándar y personalizada en SAP S/4HANA.'
      : 'Nota: la matriz resume la secuencia de interacciones y resultados registrados durante la ejecución del proceso.',
    marginX,
    currentY
  );

  // Page 4 End -> Add Page 5
  doc.addPage();

  // =========================================================================
  // --- PÁGINAS PROCEDURALES DETALLADAS (TEMPLATE PÁGINAS 5 A 18) ---
  // =========================================================================
  let figureCounter = 1;
  let sectionCounter = 3;

  for (let i = 0; i < manual.steps.length; i++) {
    const step = manual.steps[i];
    if (onProgress) {
      onProgress(`Diseñando sección técnica ${i + 1} de ${manual.steps.length}...`);
    }

    currentY = 25;

    // Record exact starting page
    const stepPageNum = doc.getNumberOfPages();
    stepStartPages[i] = stepPageNum;

    // 1. SECTION TITLE (Matching Template: "3. DATOS MAESTROS")
    const sectionTitleText = `${sectionCounter}. ${formatStepOperativeTitle(step.title, i + 1).toUpperCase()}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.text(sectionTitleText, marginX, currentY);

    // Blue Rule Under Title
    doc.setDrawColor(blueRuleColor[0], blueRuleColor[1], blueRuleColor[2]);
    doc.setLineWidth(0.6);
    doc.line(marginX, currentY + 2.5, marginX + contentWidth, currentY + 2.5);
    currentY += 8;

    // 2. TRANSACTION / ACTION RIBBON STRIP (Matching Template Style)
    if (isSap) {
      // Dark Navy badge: "TRANSACCIÓN"
      doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.rect(marginX, currentY, 26, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('TRANSACCIÓN', marginX + 13, currentY + 4.2, { align: 'center' });

      // Transaction Code Badge
      const txTag = step.sapTransaction || 'GUI';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const txTagW = doc.getTextWidth(txTag) + 8;
      doc.setFillColor(239, 246, 255); // #EFF6FF
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(marginX + 28, currentY, txTagW, 6, 0.8, 0.8, 'FD');
      doc.setTextColor(29, 78, 216);
      doc.text(txTag, marginX + 28 + txTagW / 2, currentY + 4.2, { align: 'center' });

      // Transaction description text to the right
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const txDesc = `${step.targetElement || step.title}${step.sapModule ? ` · Módulo ${step.sapModule}` : ''}`;
      doc.text(txDesc, marginX + 30 + txTagW, currentY + 4.2);
    } else {
      // Dark Navy badge: "ACCIÓN"
      const actionBadgeW = 20;
      doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.rect(marginX, currentY, actionBadgeW, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('ACCIÓN', marginX + actionBadgeW / 2, currentY + 4.2, { align: 'center' });

      // Action Name Badge
      const actionName = getActionTypeSpanish(step.actionType);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const actTagW = doc.getTextWidth(actionName) + 8;
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(marginX + actionBadgeW + 2, currentY, actTagW, 6, 0.8, 0.8, 'FD');
      doc.setTextColor(29, 78, 216);
      doc.text(actionName, marginX + actionBadgeW + 2 + actTagW / 2, currentY + 4.2, { align: 'center' });

      // Element text to the right
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const elemDesc = `${step.targetElement || step.title} · Procedimiento Operativo`;
      doc.text(elemDesc, marginX + actionBadgeW + 4 + actTagW, currentY + 4.2);
    }

    currentY += 10;

    // 3. STEP DETAILED INSTRUCTIONS (Numbered 1, 2, 3 or bulleted)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    const descParagraphs = step.description.split('\n').filter((p) => p.trim());
    if (descParagraphs.length === 1) {
      const wrappedDesc = doc.splitTextToSize(step.description, contentWidth);
      doc.text(wrappedDesc, marginX, currentY);
      currentY += wrappedDesc.length * 4.4 + 4;
    } else {
      descParagraphs.forEach((p, pIdx) => {
        const pLines = doc.splitTextToSize(`${pIdx + 1}. ${p}`, contentWidth);
        doc.text(pLines, marginX, currentY);
        currentY += pLines.length * 4.4 + 2;
      });
      currentY += 3;
    }

    // 4. SCREENSHOT PRESENTATION WITH PIXEL-PERFECT ANNOTATIONS
    if (step.image) {
      const { dataUrl, width: imgW, height: imgH } = await renderAnnotatedScreenshotForPdf(
        step.image,
        step.annotations
      );

      const aspect = imgH && imgW ? imgH / imgW : 0.5625;
      const maxAllowedH = Math.min(105, maxY - currentY - 32);
      let renderW = contentWidth;
      let renderH = renderW * aspect;

      if (renderH > maxAllowedH) {
        renderH = maxAllowedH;
        renderW = Math.min(contentWidth, renderH / aspect);
      }

      const imgX = marginX + (contentWidth - renderW) / 2;

      // Clean corporate picture frame
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.3);
      doc.rect(imgX - 0.5, currentY - 0.5, renderW + 1, renderH + 1);

      try {
        const isPng = dataUrl.startsWith('data:image/png');
        const format = isPng ? 'PNG' : 'JPEG';
        doc.addImage(dataUrl, format, imgX, currentY, renderW, renderH, undefined, 'FAST');
      } catch (err) {
        console.warn('Failed to embed screenshot:', err);
      }

      currentY += renderH + 4;

      // Centered Figure Caption (Matching Template: "Figura X. [Descripción]")
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      const figCaption = `Figura ${figureCounter}. ${step.title}${step.targetElement ? ` (${step.targetElement})` : ''}.`;
      doc.text(figCaption, marginX + contentWidth / 2, currentY, { align: 'center' });
      currentY += 8;
      figureCounter++;
    }

    // 5. CORPORATE CALLOUT CARDS (Matching Template)
    // 5.1 IMPORTANTE / ALERTA (Amber)
    // 5.1 PROPÓSITO & JUSTIFICACIÓN (4C/ID Pedagogical Intent) (Indigo)
    if (step.purpose) {
      const purpLines = doc.splitTextToSize(step.purpose, contentWidth - 14);
      const cardH = 8 + purpLines.length * 4.2 + 2;

      doc.setFillColor(238, 242, 255); // indigo-50
      doc.setDrawColor(199, 210, 254); // indigo-200
      doc.roundedRect(marginX, currentY, contentWidth, cardH, 1, 1, 'FD');

      doc.setFillColor(79, 70, 229); // indigo-600 #4F46E5
      doc.rect(marginX, currentY, 2.5, cardH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(67, 56, 202);
      doc.text('PROPÓSITO Y JUSTIFICACIÓN FUNCIONAL (EL POR QUÉ)', marginX + 6, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(49, 46, 129);
      purpLines.forEach((ln: string, lIdx: number) => {
        doc.text(ln, marginX + 6, currentY + 9 + lIdx * 4.2);
      });

      currentY += cardH + 4;
    }

    if (step.warning) {
      const warnLines = doc.splitTextToSize(step.warning, contentWidth - 14);
      const cardH = 8 + warnLines.length * 4.2 + 2;

      doc.setFillColor(255, 251, 235); // amber-50
      doc.setDrawColor(253, 230, 138); // amber-200
      doc.roundedRect(marginX, currentY, contentWidth, cardH, 1, 1, 'FD');

      doc.setFillColor(217, 119, 6); // amber-600 #D97706
      doc.rect(marginX, currentY, 2.5, cardH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9);
      doc.text('IMPORTANTE · Precaución Operativa', marginX + 6, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(146, 64, 14);
      warnLines.forEach((ln: string, lIdx: number) => {
        doc.text(ln, marginX + 6, currentY + 9 + lIdx * 4.2);
      });

      currentY += cardH + 5;
    }

    // 5.2 ESCENARIO / NOTA O CONSEJO (Green/Blue)
    if (step.tip || step.expectedResult) {
      const noteTitle = step.tip ? 'CONSEJO DE EXPERTO' : 'RESULTADO ESPERADO';
      const noteBody = step.tip || step.expectedResult || '';
      const noteLines = doc.splitTextToSize(noteBody, contentWidth - 14);
      const cardH = 8 + noteLines.length * 4.2 + 2;

      const isTip = !!step.tip;
      const barCol: [number, number, number] = isTip ? [5, 150, 105] : [37, 99, 235];
      const bgCol: [number, number, number] = isTip ? [240, 253, 244] : [239, 246, 255];
      const borderCol: [number, number, number] = isTip ? [187, 247, 208] : [191, 219, 254];

      doc.setFillColor(bgCol[0], bgCol[1], bgCol[2]);
      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.roundedRect(marginX, currentY, contentWidth, cardH, 1, 1, 'FD');

      doc.setFillColor(barCol[0], barCol[1], barCol[2]);
      doc.rect(marginX, currentY, 2.5, cardH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(barCol[0], barCol[1], barCol[2]);
      doc.text(noteTitle, marginX + 6, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      noteLines.forEach((ln: string, lIdx: number) => {
        doc.text(ln, marginX + 6, currentY + 9 + lIdx * 4.2);
      });

      currentY += cardH + 5;
    }

    // 5.3 AUDIO DEL INSTRUCTOR (Purple) - Non-redundant arguments & examples only
    const effectiveInst = getEffectiveInstructorContent(step);
    const audioQuote = effectiveInst.shouldShow
      ? (effectiveInst.quote
        ? `"${effectiveInst.quote}"${effectiveInst.notes ? ` — ${effectiveInst.notes}` : ''}`
        : effectiveInst.notes)
      : '';

    if (audioQuote) {
      const audLines = doc.splitTextToSize(audioQuote, contentWidth - 14);
      const cardH = 8 + audLines.length * 4.2 + 2;

      doc.setFillColor(250, 245, 255);
      doc.setDrawColor(233, 213, 255);
      doc.roundedRect(marginX, currentY, contentWidth, cardH, 1, 1, 'FD');

      doc.setFillColor(126, 34, 206);
      doc.rect(marginX, currentY, 2.5, cardH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(126, 34, 206);
      doc.text('EXPLICACIÓN DEL INSTRUCTOR (ARGUMENTOS & EJEMPLOS)', marginX + 6, currentY + 5);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(88, 28, 135);
      audLines.forEach((ln: string, lIdx: number) => {
        doc.text(ln, marginX + 6, currentY + 9 + lIdx * 4.2);
      });

      currentY += cardH + 5;
    }

    sectionCounter++;

    // Dedicated page per procedural step
    if (i < manual.steps.length - 1) {
      doc.addPage();
    }
  }

  // =========================================================================
  // --- SECCIÓN FINAL: RESOLUCIÓN DE PROBLEMAS & CHECKLIST ---
  // =========================================================================
  let troubleStartPage = 0;
  if (manual.troubleshooting && manual.troubleshooting.length > 0) {
    doc.addPage();
    troubleStartPage = doc.getNumberOfPages();
    currentY = 25;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.text(`${sectionCounter}. RESOLUCIÓN DE PROBLEMAS FRECUENTES`, marginX, currentY);

    doc.setDrawColor(blueRuleColor[0], blueRuleColor[1], blueRuleColor[2]);
    doc.setLineWidth(0.6);
    doc.line(marginX, currentY + 2.5, marginX + contentWidth, currentY + 2.5);
    currentY += 10;

    manual.troubleshooting.forEach((item) => {
      const solLines = doc.splitTextToSize(item.solution, contentWidth - 14);
      const itemH = 8 + solLines.length * 4.2 + 3;

      if (currentY + itemH > maxY) {
        doc.addPage();
        currentY = 25;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, currentY, contentWidth, itemH, 1, 1, 'FD');

      doc.setFillColor(217, 119, 6);
      doc.rect(marginX, currentY, 2.5, itemH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`Problema: ${item.problem}`, marginX + 6, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      solLines.forEach((sl: string, sIdx: number) => {
        doc.text(sl, marginX + 6, currentY + 9 + sIdx * 4.2);
      });

      currentY += itemH + 4;
    });

    sectionCounter++;
  }

  let checklistStartPage = 0;
  if (manual.summaryChecklist && manual.summaryChecklist.length > 0) {
    if (currentY > maxY - 40) {
      doc.addPage();
      currentY = 25;
    } else {
      currentY += 8;
    }
    checklistStartPage = doc.getNumberOfPages();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.text(`${sectionCounter}. LISTA DE VERIFICACIÓN FINAL`, marginX, currentY);

    doc.setDrawColor(blueRuleColor[0], blueRuleColor[1], blueRuleColor[2]);
    doc.setLineWidth(0.6);
    doc.line(marginX, currentY + 2.5, marginX + contentWidth, currentY + 2.5);
    currentY += 10;

    manual.summaryChecklist.forEach((chk) => {
      if (currentY + 8 > maxY) {
        doc.addPage();
        currentY = 25;
      }

      doc.setDrawColor(148, 163, 184);
      doc.rect(marginX + 2, currentY - 2.5, 3.5, 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(chk, marginX + 9, currentY);
      currentY += 6;
    });
  }

  // =========================================================================
  // --- SECOND PASS: RENDER EXACT TABLE OF CONTENTS ON PAGE 2 ---
  // =========================================================================
  if (onProgress) onProgress('Finalizando Índice con numeración de páginas exactas...');
  doc.setPage(tocPage);

  let curTocY = tocStartY;

  const drawTocItem = (
    title: string,
    pageNum: number,
    level: 1 | 2 = 1
  ) => {
    const isLevel1 = level === 1;
    doc.setFont('helvetica', isLevel1 ? 'bold' : 'normal');
    doc.setFontSize(isLevel1 ? 9 : 8.5);
    doc.setTextColor(isLevel1 ? navyColor[0] : 71, isLevel1 ? navyColor[1] : 85, isLevel1 ? navyColor[2] : 105);

    const xPos = isLevel1 ? marginX : marginX + 6;
    doc.text(title, xPos, curTocY);

    // Calculate dotted leaders
    const titleWidth = doc.getTextWidth(title);
    const startDotsX = xPos + titleWidth + 3;
    const endDotsX = marginX + contentWidth - 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    const dotStr = '.';
    const dotW = doc.getTextWidth(dotStr);
    const numDots = Math.floor((endDotsX - startDotsX) / (dotW * 1.5));
    if (numDots > 3) {
      const dots = Array(numDots).fill('.').join(' ');
      doc.text(dots, startDotsX, curTocY);
    }

    // Right-aligned page number
    doc.setFont('helvetica', isLevel1 ? 'bold' : 'normal');
    doc.setFontSize(isLevel1 ? 9 : 8.5);
    doc.setTextColor(isLevel1 ? navyColor[0] : 71, isLevel1 ? navyColor[1] : 85, isLevel1 ? navyColor[2] : 105);
    doc.text(`${pageNum}`, marginX + contentWidth, curTocY, { align: 'right' });

    curTocY += isLevel1 ? 6.8 : 5.8;
  };

  // Section 1
  drawTocItem('1 INTRODUCCIÓN', introPage, 1);
  drawTocItem('1.1 Objetivo y Alcance', introPage, 2);
  if (manual.prerequisites && manual.prerequisites.length > 0) {
    drawTocItem('1.2 Requisitos Previos', introPage, 2);
    drawTocItem('1.3 Ficha Técnica del Proceso', introPage, 2);
  } else {
    drawTocItem('1.2 Ficha Técnica del Proceso', introPage, 2);
  }

  // Section 2
  drawTocItem('2 FLUJO DEL PROCESO', flowPage, 1);

  // Sections 3..N (Procedural steps)
  let tocSecNum = 3;
  manual.steps.forEach((st, sIdx) => {
    const pNum = stepStartPages[sIdx] || 5 + sIdx;
    drawTocItem(`${tocSecNum} ${formatStepOperativeTitle(st.title, sIdx + 1).toUpperCase()}`, pNum, 1);
    tocSecNum++;
  });

  if (troubleStartPage > 0) {
    drawTocItem(`${tocSecNum} RESOLUCIÓN DE PROBLEMAS`, troubleStartPage, 1);
    tocSecNum++;
  }
  if (checklistStartPage > 0) {
    drawTocItem(`${tocSecNum} LISTA DE VERIFICACIÓN`, checklistStartPage, 1);
  }

  // =========================================================================
  // --- THIRD PASS: RUNNING HEADERS & FOOTERS (ALL PAGES 2 TO TOTAL) ---
  // =========================================================================
  const totalPages = doc.getNumberOfPages();

  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);

    // 1. RUNNING HEADER (Matching Template with Nuestro Logo & Client Logo)
    drawCorporateLogos(
      doc,
      marginX,
      marginX + contentWidth,
      10,
      true,
      effectiveBranding,
      effectiveClientLogo,
      effectiveClientName,
      ourLogoDim,
      clientLogoDim
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const centerTitle = isSap ? `Manual de Usuario SAP · ${manual.title}` : `Manual de Procedimiento · ${manual.title}`;
    const shortCenterTitle = doc.splitTextToSize(centerTitle, 110)[0];
    doc.text(shortCenterTitle, marginX + contentWidth / 2, 16.5, { align: 'center' });

    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);
    doc.line(marginX, 19.5, marginX + contentWidth, 19.5);

    // 2. RUNNING FOOTER (Matching Template)
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 14, marginX + contentWidth, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const partnerName = branding?.secondaryName || 'HSBT';
    const partnerSlogan = branding?.secondarySlogan || 'Compromiso y Calidad';
    const clientFooter = project?.clientName || manual.author || 'Documentación Operativa';
    doc.text(
      `${partnerName} · ${partnerSlogan} | ${clientFooter}`,
      marginX,
      pageHeight - 9.5
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`Página ${p} de ${totalPages}`, marginX + contentWidth, pageHeight - 9.5, {
      align: 'right',
    });
  }

  // Download PDF file
  const safeName = manual.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  doc.save(`${safeName || (isSap ? 'manual-usuario-sap' : 'manual-procedimiento')}.pdf`);
}

/**
 * Genera el Dossier Consolidado del Proyecto con todos los manuales que forman parte
 * de la solución final, incorporando el nombre del cliente, logo y las características
 * seleccionadas en las opciones del proyecto.
 */
export async function exportProjectDossierPdf(
  project: Project,
  manuals: UserManual[],
  onProgress?: (msg: string) => void,
  branding?: OrganizationBranding
): Promise<void> {
  if (onProgress) onProgress(`Iniciando generación del Dossier de Solución para ${project.clientName}...`);

  const effectiveBranding: OrganizationBranding | undefined = branding
    ? {
        ...branding,
        companyName: project.organizationName || branding.companyName,
        logo: project.organizationLogo || branding.logo,
        companySlogan: project.organizationSlogan || branding.companySlogan,
      }
    : project.organizationLogo
    ? ({
        companyName: project.organizationName || 'Nuestra Organización',
        companySlogan: project.organizationSlogan,
        logo: project.organizationLogo,
        showOurLogoInCover: true,
        showOurLogoInHeader: true,
      } as OrganizationBranding)
    : undefined;

  const docOpts = project.documentOptions || {};
  const effectiveClientLogo = docOpts.includeClientLogo !== false ? project.clientLogo : undefined;

  // Measure natural dimensions of logos to eliminate any stretching or distortion
  const [ourLogoDim, clientLogoDim] = await Promise.all([
    getImageDimensions(effectiveBranding?.logo),
    getImageDimensions(effectiveClientLogo),
  ]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2; // 178mm
  const maxY = pageHeight - 20;

  const navyColor: [number, number, number] = [24, 59, 108]; // #183B6C

  // =========================================================================
  // --- PÁGINA 1: PORTADA OFICIAL DEL PROYECTO ---
  // =========================================================================
  if (docOpts.includeCoverPage !== false) {
    if (onProgress) onProgress('Generando portada institucional del proyecto...');

    // Draw logos or client header
    if (docOpts.includeClientLogo !== false || docOpts.includeOurLogo !== false) {
      drawCorporateLogos(
        doc,
        marginX,
        marginX + contentWidth,
        16,
        false,
        effectiveBranding,
        effectiveClientLogo,
        project.clientName,
        ourLogoDim,
        clientLogoDim
      );
    }

    // Title banner
    const bannerY = 50;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    const titleLines = doc.splitTextToSize(project.name, contentWidth - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const subText =
      project.description ||
      `Dossier Consolidado de Solución y Manuales de Usuario · Cliente: ${project.clientName}`;
    const subLines = doc.splitTextToSize(subText, contentWidth - 16);

    const bannerH = Math.max(50, 16 + titleLines.length * 8 + subLines.length * 4.8 + 8);
    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(marginX, bannerY, contentWidth, bannerH, 'F');

    // Title text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    let curTextY = bannerY + 12;
    titleLines.forEach((tl: string) => {
      doc.text(tl, marginX + 8, curTextY);
      curTextY += 7.5;
    });

    curTextY += 1.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    subLines.forEach((sl: string) => {
      doc.text(sl, marginX + 8, curTextY);
      curTextY += 4.5;
    });

    // Subtitle bar
    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, bannerY + bannerH, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const clientUpper = (project.clientName || 'Cliente').toUpperCase();
    doc.text(
      `DOSSIER DE SOLUCIÓN TÉCNICA · ${clientUpper} · ${manuals.length} MANUALES INCLUIDOS`,
      marginX + 6,
      bannerY + bannerH + 5.5
    );

    // Document Control Table
    if (docOpts.includeDocumentControl !== false) {
      const tableY = bannerY + bannerH + 16;
      doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.rect(marginX, tableY, contentWidth, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text('CONTROL DEL DOCUMENTO Y FICHA TÉCNICA DEL PROYECTO', marginX + 5, tableY + 5.5);

      const metaRows: [string, string][] = [
        ['Cliente / Organización', project.clientName || 'Organización'],
        ['Código de Proyecto', project.code || 'PRJ-CORP-01'],
        ['Área / Módulos', project.category || 'Gestión Operativa y Procesos'],
        ['Versión de Solución', `Versión ${project.version || '1.0'}`],
        ['Estado del Proyecto', project.status || 'Aprobado'],
        ['Consultor Líder / Autor', project.author || 'Equipo de Procesos & Consultoría'],
        ['Audiencia Objetivo', project.targetAudience || 'Usuarios finales, Key Users y Administradores'],
        ['Fecha de Emisión', new Date(project.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })],
        ['Manuales Consolidados', `${manuals.length} procedimiento(s) operativos`],
      ];

      let rowY = tableY + 8;
      const rowHeight = 7;
      metaRows.forEach(([lbl, val], rIdx) => {
        const isEven = rIdx % 2 === 0;
        doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
        doc.rect(marginX, rowY, contentWidth, rowHeight, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(marginX, rowY, contentWidth, rowHeight, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(lbl, marginX + 4, rowY + 4.8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(val, marginX + 58, rowY + 4.8);

        rowY += rowHeight;
      });
    }

    doc.addPage();
  }

  // =========================================================================
  // --- PÁGINA 2: ÍNDICE DE LA SOLUCIÓN Y RESUMEN EJECUTIVO ---
  // =========================================================================
  let curY = 26;

  if (docOpts.includeTableOfContents !== false) {
    if (onProgress) onProgress('Compilando índice consolidado de manuales...');

    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(marginX, curY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('ÍNDICE CONSOLIDADO DE MANUALES DEL PROYECTO', marginX + 4, curY + 5.5);
    curY += 12;

    manuals.forEach((m, mIdx) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const title = `${mIdx + 1}. ${m.title}`;
      doc.text(title, marginX + 4, curY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`${m.steps.length} pasos · v${m.version || '1.0'}`, marginX + contentWidth - 4, curY, { align: 'right' });
      curY += 5;

      if (m.subtitle) {
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text(`   ↳ ${m.subtitle.slice(0, 95)}`, marginX + 4, curY);
        curY += 4.5;
      }
    });

    curY += 6;
  }

  // Executive Summary
  if (docOpts.includeExecutiveSummary !== false) {
    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(marginX, curY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('RESUMEN EJECUTIVO Y ALCANCE DE LA SOLUCIÓN', marginX + 4, curY + 5.5);
    curY += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const summaryText =
      project.description ||
      `La presente documentación técnica y operativa ha sido elaborada especialmente para ${project.clientName}. Incluye todos los procedimientos estándar, pantallas del sistema y validaciones requeridas para la ejecución sin errores de los procesos comerciales y de abastecimiento.`;
    const sumLines = doc.splitTextToSize(summaryText, contentWidth - 8);
    doc.text(sumLines, marginX + 4, curY);
    curY += sumLines.length * 4.5 + 4;

    if (project.scope) {
      doc.setFont('helvetica', 'bold');
      doc.text('Alcance de la Entrega:', marginX + 4, curY);
      curY += 4.5;
      doc.setFont('helvetica', 'normal');
      const scopeLines = doc.splitTextToSize(project.scope, contentWidth - 8);
      doc.text(scopeLines, marginX + 4, curY);
      curY += scopeLines.length * 4.5 + 6;
    }
  }

  // Process matrix
  if (docOpts.includeProcessMatrix !== false) {
    if (curY > maxY - 40) {
      doc.addPage();
      curY = 26;
    }

    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(marginX, curY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('MATRIZ DE PROCESOS Y MANUALES OPERATIVOS', marginX + 4, curY + 5.5);
    curY += 10;

    // Table header
    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, curY, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('#', marginX + 3, curY + 4.2);
    doc.text('Manual / Proceso', marginX + 12, curY + 4.2);
    doc.text('Pasos', marginX + 115, curY + 4.2);
    doc.text('Dificultad', marginX + 135, curY + 4.2);
    doc.text('Versión', marginX + 160, curY + 4.2);
    curY += 7;

    manuals.forEach((m, mIdx) => {
      const isEven = mIdx % 2 === 0;
      doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
      doc.rect(marginX, curY, contentWidth, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(String(mIdx + 1), marginX + 3, curY + 4.5);
      doc.text(m.title.slice(0, 55), marginX + 12, curY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${m.steps.length} pasos`, marginX + 115, curY + 4.5);
      doc.text(m.difficulty || 'Intermedio', marginX + 135, curY + 4.5);
      doc.text(`v${m.version || '1.0'}`, marginX + 160, curY + 4.5);
      curY += 6.5;
    });
  }

  // =========================================================================
  // --- PROCEDIMIENTOS DETALLADOS DE CADA MANUAL ---
  // =========================================================================
  for (let mIdx = 0; mIdx < manuals.length; mIdx++) {
    const man = manuals[mIdx];
    if (onProgress) onProgress(`Renderizando Manual ${mIdx + 1}/${manuals.length}: ${man.title}...`);

    doc.addPage();
    curY = 26;

    // Header banner for this manual inside the project dossier
    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(marginX, curY, contentWidth, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`MANUAL ${mIdx + 1}: ${man.title.toUpperCase()}`, marginX + 5, curY + 8);
    curY += 16;

    if (man.overview) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      const ovLines = doc.splitTextToSize(man.overview, contentWidth - 6);
      doc.text(ovLines, marginX + 3, curY);
      curY += ovLines.length * 4.2 + 6;
    }

    // Steps
    for (let sIdx = 0; sIdx < man.steps.length; sIdx++) {
      const step = man.steps[sIdx];
      const stepH = 95; // Approximate height for step + screenshot

      if (curY + stepH > maxY) {
        doc.addPage();
        curY = 26;
      }

      // Step title & action badge
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, curY, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(formatStepOperativeTitle(step.title, sIdx + 1), marginX + 4, curY + 4.8);

      if (step.actionType) {
        doc.setFillColor(37, 99, 235);
        doc.rect(marginX + contentWidth - 28, curY + 1.2, 26, 4.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text(step.actionType.toUpperCase(), marginX + contentWidth - 15, curY + 4.2, { align: 'center' });
      }

      curY += 9;

      // Description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const descLines = doc.splitTextToSize(step.description, contentWidth - 6);
      doc.text(descLines, marginX + 3, curY);
      curY += descLines.length * 3.8 + 3;

      // Screenshot
      if (step.image && docOpts.includeStepScreenshots !== false) {
        try {
          const renderedImg = await renderAnnotatedScreenshotForPdf(
            step.image,
            step.annotations || []
          );
          const imgH = 65;
          const imgW = 120;
          doc.setDrawColor(203, 213, 225);
          doc.rect(marginX + 20, curY, imgW, imgH, 'S');
          doc.addImage(renderedImg.dataUrl, 'JPEG', marginX + 20.5, curY + 0.5, imgW - 1, imgH - 1);
          curY += imgH + 6;
        } catch (e) {
          curY += 4;
        }
      } else {
        curY += 4;
      }
    }
  }

  // =========================================================================
  // --- RUNNING HEADERS & FOOTERS (ALL PAGES 2 TO TOTAL) ---
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);

    if (docOpts.includeClientLogo !== false || docOpts.includeOurLogo !== false) {
      drawCorporateLogos(
        doc,
        marginX,
        marginX + contentWidth,
        10,
        true,
        effectiveBranding,
        effectiveClientLogo,
        project.clientName,
        ourLogoDim,
        clientLogoDim
      );
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(
      `${project.clientName} · ${project.name}`,
      marginX + contentWidth / 2,
      16,
      { align: 'center' }
    );

    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);
    doc.line(marginX, 19, marginX + contentWidth, 19);

    doc.line(marginX, pageHeight - 14, marginX + contentWidth, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Dossier de Solución Técnica · ${project.clientName}`,
      marginX,
      pageHeight - 9.5
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`Página ${p} de ${totalPages}`, marginX + contentWidth, pageHeight - 9.5, {
      align: 'right',
    });
  }

  const safeClientName = (project.clientName || 'cliente')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  doc.save(`dossier-proyecto-${safeClientName || 'solucion'}.pdf`);
}

