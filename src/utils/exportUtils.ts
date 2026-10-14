import { UserManual, VisualAnnotation, getActionTypeSpanish } from '../types/manual';
import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  HeadingLevel,
} from 'docx';

/**
 * Converts a base64 / dataUrl string to Uint8Array for docx ImageRun
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(',');
  const base64 = parts[1] || parts[0];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Downloads a text or html file to the user's browser
 */
function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports manual to clean markdown format
 */
export function exportToMarkdown(manual: UserManual) {
  let md = `# ${manual.title}\n\n`;
  if (manual.subtitle) md += `*${manual.subtitle}*\n\n`;
  md += `**Tiempo estimado:** ${manual.estimatedMinutes || 5} min | **Dificultad:** ${manual.difficulty || 'Principiante'}\n\n`;
  if (manual.targetAudience) md += `**Audiencia:** ${manual.targetAudience}\n\n`;
  md += `## 📋 Resumen\n\n${manual.overview}\n\n`;

  if (manual.prerequisites && manual.prerequisites.length > 0) {
    md += `## ⚡ Requisitos Previos\n\n`;
    manual.prerequisites.forEach((p) => {
      md += `- [ ] ${p}\n`;
    });
    md += `\n`;
  }

  md += `## 🚀 Procedimiento Paso a Paso\n\n`;
  manual.steps.forEach((step, index) => {
    md += `### Paso ${index + 1}: ${step.title}\n\n`;
    md += `**Acción:** \`${getActionTypeSpanish(step.actionType)}\` | **Elemento:** ${step.targetElement || 'N/A'}\n\n`;
    md += `${step.description}\n\n`;
    if (step.expectedResult) {
      md += `> **Resultado Esperado:** ${step.expectedResult}\n\n`;
    }
    if (step.tip) {
      md += `💡 **Consejo Pro:** ${step.tip}\n\n`;
    }
    if (step.warning) {
      md += `⚠️ **Precaución:** ${step.warning}\n\n`;
    }
    if (step.image) {
      md += `![Captura de Pantalla Paso ${index + 1}](${step.image})\n\n`;
    }
    md += `---\n\n`;
  });

  if (manual.troubleshooting && manual.troubleshooting.length > 0) {
    md += `## 🛠️ Resolución de Problemas\n\n`;
    manual.troubleshooting.forEach((t) => {
      md += `#### Problema: ${t.problem}\n`;
      md += `**Solución:** ${t.solution}\n\n`;
    });
  }

  if (manual.summaryChecklist && manual.summaryChecklist.length > 0) {
    md += `## ✅ Lista de Verificación Final\n\n`;
    manual.summaryChecklist.forEach((c) => {
      md += `- [ ] ${c}\n`;
    });
    md += `\n`;
  }

  const safeName = manual.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  downloadFile(`${safeName || 'manual'}.md`, md, 'text/markdown;charset=utf-8');
}

/**
 * Exports manual to JSON
 */
export function exportToJson(manual: UserManual) {
  const json = JSON.stringify(manual, null, 2);
  const safeName = manual.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  downloadFile(`${safeName || 'manual'}.json`, json, 'application/json;charset=utf-8');
}

/**
 * Renders an image with visual annotations directly onto an HTML Canvas
 * and returns a high-fidelity PNG DataURL ready for jsPDF
 */
async function renderAnnotatedScreenshotForPdf(
  imageSrc: string,
  annotations: VisualAnnotation[] = []
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const origW = img.naturalWidth || 960;
        const origH = img.naturalHeight || 540;
        canvas.width = origW;
        canvas.height = origH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: imageSrc, width: origW, height: origH });
          return;
        }

        // Draw base image
        ctx.drawImage(img, 0, 0, origW, origH);

        // Draw visual annotations
        annotations.forEach((ann) => {
          const cx = (ann.x / 100) * origW;
          const cy = (ann.y / 100) * origH;
          const color = ann.color || '#ef4444';

          if (ann.shape === 'rect') {
            const w = ((ann.width || 22) / 100) * origW;
            const h = ((ann.height || 14) / 100) * origH;
            const left = cx - w / 2;
            const top = cy - h / 2;

            // Box highlight
            ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
            ctx.fillRect(left, top, w, h);

            // Border
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(3.5, origW * 0.0035);
            ctx.strokeRect(left, top, w, h);

            // Label
            if (ann.label) {
              drawCanvasLabelForPdf(ctx, ann, left, top, w, h, origW, color);
            }
          } else if (ann.shape === 'blur') {
            const w = ((ann.width || 20) / 100) * origW;
            const h = ((ann.height || 12) / 100) * origH;
            const left = cx - w / 2;
            const top = cy - h / 2;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(left, top, w, h);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(left, top, w, h);
          } else {
            // Circle hotspot
            const radius = Math.max(16, origW * 0.02);
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(3.5, origW * 0.0035);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            if (ann.label) {
              drawCanvasLabelForPdf(ctx, ann, cx - radius, cy - radius, radius * 2, radius * 2, origW, color);
            }
          }
        });

        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          width: origW,
          height: origH,
        });
      } catch (err) {
        resolve({ dataUrl: imageSrc, width: 960, height: 540 });
      }
    };
    img.onerror = () => {
      resolve({ dataUrl: imageSrc, width: 960, height: 540 });
    };
    img.src = imageSrc;
  });
}

function drawCanvasLabelForPdf(
  ctx: CanvasRenderingContext2D,
  ann: VisualAnnotation,
  boxLeft: number,
  boxTop: number,
  boxW: number,
  boxH: number,
  origW: number,
  color: string
) {
  const fontSize = Math.max(12, Math.round(origW * 0.016));
  ctx.font = `bold ${fontSize}px sans-serif`;
  const text = ann.label || '';
  const textMetrics = ctx.measureText(text);
  const padX = 8;
  const padY = 5;
  const badgeW = textMetrics.width + padX * 2;
  const badgeH = fontSize + padY * 2;

  let badgeX = boxLeft;
  let badgeY = boxTop - badgeH - 6;

  if (ann.labelPosition === 'custom' && (ann.labelOffsetX !== undefined || ann.labelOffsetY !== undefined)) {
    badgeX = boxLeft + (ann.labelOffsetX || 0);
    badgeY = boxTop + (ann.labelOffsetY || 0);
  } else if (ann.labelPosition === 'inside') {
    badgeX = boxLeft + 8;
    badgeY = boxTop + 8;
  } else if (ann.labelPosition === 'bottom' || badgeY < 0) {
    badgeX = boxLeft;
    badgeY = boxTop + (boxW ? boxW * 0.6 : 30) + 6;
  } else if (ann.labelPosition === 'right') {
    badgeX = boxLeft + boxW + 8;
    badgeY = boxTop;
  }

  // Draw badge
  ctx.fillStyle = color;
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(badgeX, badgeY, badgeW, badgeH, 4);
  } else {
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
  }
  ctx.fill();

  // Draw text
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, badgeX + padX, badgeY + badgeH / 2);
}

/**
 * Generates and downloads an authentic, high-resolution PDF document using jsPDF
 */
export async function exportToPdf(manual: UserManual, onProgress?: (msg: string) => void): Promise<void> {
  if (onProgress) onProgress('Preparando documento PDF de alta fidelidad...');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2; // 178mm
  const maxY = pageHeight - 20; // 277mm max Y before footer

  let currentY = 18;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > maxY) {
      doc.addPage();
      currentY = 22; // Start below running header on pages 2+
    }
  };

  // ==========================================
  // --- 1. COVER / HEADER SECTION (PAGE 1) ---
  // ==========================================

  // Top corporate brand bar
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(marginX, currentY, 32, 2.5, 'F');
  currentY += 7;

  // Category Overline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229);
  doc.text('GUÍA OPERATIVA & MANUAL TÉCNICO DE USUARIO', marginX, currentY);
  currentY += 6;

  // Manual Title (Bold, Slate-900)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  const titleLines = doc.splitTextToSize(manual.title, contentWidth);
  doc.text(titleLines, marginX, currentY + 1);
  currentY += titleLines.length * 6.5 + 2;

  // Subtitle
  if (manual.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    const subLines = doc.splitTextToSize(manual.subtitle, contentWidth);
    doc.text(subLines, marginX, currentY + 1);
    currentY += subLines.length * 4.6 + 3;
  }

  // Metadata Strip (Estimated Time, Difficulty, Audience, Version)
  const metaPills: Array<{ label: string; value: string }> = [
    { label: 'DURACIÓN', value: `${manual.estimatedMinutes || 5} min` },
    { label: 'DIFICULTAD', value: manual.difficulty || 'Principiante' },
  ];
  if (manual.targetAudience) {
    metaPills.push({ label: 'AUDIENCIA', value: manual.targetAudience });
  }
  if (manual.version) {
    metaPills.push({ label: 'VERSIÓN', value: `v${manual.version}` });
  }

  let pillX = marginX;
  metaPills.forEach((p) => {
    const textStr = `${p.label}: ${p.value}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const pillW = doc.getTextWidth(textStr) + 6;

    if (pillX + pillW <= marginX + contentWidth) {
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(pillX, currentY, pillW, 5.5, 1.2, 1.2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(textStr, pillX + pillW / 2, currentY + 3.8, { align: 'center' });

      pillX += pillW + 3;
    }
  });
  currentY += 9;

  // Executive Overview Box
  if (manual.overview) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const overLines = doc.splitTextToSize(manual.overview, contentWidth - 14);
    const boxHeight = 7 + overLines.length * 4.4 + 4;
    checkPageBreak(boxHeight + 5);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, currentY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

    // Left indigo bar
    doc.setFillColor(79, 70, 229);
    doc.rect(marginX, currentY, 2.5, boxHeight, 'F');

    // Overline title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(67, 56, 202);
    doc.text('RESUMEN DEL PROCEDIMIENTO', marginX + 6, currentY + 4.8);

    // Body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(overLines, marginX + 6, currentY + 9.2);

    currentY += boxHeight + 6;
  }

  // Prerequisites Box
  if (manual.prerequisites && manual.prerequisites.length > 0) {
    const prereqLinesHeight = manual.prerequisites.length * 4.6;
    const boxHeight = 7 + prereqLinesHeight + 4;
    checkPageBreak(boxHeight + 5);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, currentY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

    // Left emerald bar
    doc.setFillColor(16, 185, 129);
    doc.rect(marginX, currentY, 2.5, boxHeight, 'F');

    // Overline title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text('REQUISITOS PREVIOS REQUERIDOS', marginX + 6, currentY + 4.8);

    // Items with emerald checkmarks
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    let itemY = currentY + 9.2;
    manual.prerequisites.forEach((p) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('✓', marginX + 6, itemY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(p, marginX + 10.5, itemY);
      itemY += 4.6;
    });

    currentY += boxHeight + 7;
  }

  // --- COVER SECTION: TABLE / MAP OF PROCEDURE STEPS ---
  // Renders the executive step index according to the corporate template,
  // dynamically adapting whether the manual has 2, 6, 12, or 25 steps.
  const stepIndexPageMarkers: Array<{ page: number; x: number; y: number; stepIdx: number }> = [];
  const stepStartPages: number[] = [];

  if (manual.steps.length > 0) {
    const remainingCoverH = maxY - currentY;
    const isMultiColumn = manual.steps.length > 6 && manual.steps.length <= 14;
    const numRows = isMultiColumn ? Math.ceil(manual.steps.length / 2) : Math.min(manual.steps.length, 6);
    const stepRowH = 7.5;
    const indexBoxH = Math.min(remainingCoverH, 10 + numRows * stepRowH + 5);

    // Render Box Container
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, currentY, contentWidth, indexBoxH, 1.5, 1.5, 'FD');

    // Top Indigo Accent Line
    doc.setFillColor(79, 70, 229);
    doc.rect(marginX, currentY, contentWidth, 2, 'F');

    // Section Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(67, 56, 202);
    doc.text('ESTRUCTURA DEL PROCEDIMIENTO · ÍNDICE DE PASOS', marginX + 6, currentY + 6.2);

    if (isMultiColumn) {
      // 2-Column Adaptive Layout for 7-14 steps
      const colWidth = (contentWidth - 10) / 2;
      const midPoint = Math.ceil(manual.steps.length / 2);

      for (let sIdx = 0; sIdx < manual.steps.length; sIdx++) {
        const st = manual.steps[sIdx];
        const isRightCol = sIdx >= midPoint;
        const rowInCol = isRightCol ? sIdx - midPoint : sIdx;
        const colStartX = isRightCol ? marginX + colWidth + 10 : marginX + 4;
        const rowY = currentY + 11.5 + rowInCol * stepRowH;

        // Step number pill
        doc.setFillColor(79, 70, 229);
        doc.roundedRect(colStartX, rowY - 3.2, 7.5, 4.8, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text(`${sIdx + 1 < 10 ? '0' : ''}${sIdx + 1}`, colStartX + 3.75, rowY, { align: 'center' });

        // Action tag pill (TYPE, CLICK, VERIFY, etc.)
        const actTag = (st.actionType || 'action').toUpperCase();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        const actTagW = doc.getTextWidth(actTag) + 3.5;
        doc.setFillColor(238, 242, 255);
        doc.setDrawColor(199, 210, 254);
        doc.roundedRect(colStartX + 9, rowY - 3.2, actTagW, 4.8, 1, 1, 'FD');
        doc.setTextColor(67, 56, 202);
        doc.text(actTag, colStartX + 9 + actTagW / 2, rowY, { align: 'center' });

        // Step title
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        const titleX = colStartX + 10.5 + actTagW;
        const availW = colWidth - (titleX - colStartX) - 15;
        const shortTitle = doc.splitTextToSize(st.title, Math.max(20, availW))[0];
        doc.text(shortTitle, titleX, rowY);

        // Marker for exact page reference to be filled after procedural steps pass
        stepIndexPageMarkers.push({
          page: doc.getNumberOfPages(),
          x: colStartX + colWidth - 2,
          y: rowY,
          stepIdx: sIdx,
        });
      }
    } else {
      // Standard Single-Column Layout (up to 6 steps or first page batch)
      const maxOnCover = Math.min(manual.steps.length, Math.floor((indexBoxH - 12) / stepRowH));
      let rowY = currentY + 11.5;

      for (let sIdx = 0; sIdx < maxOnCover; sIdx++) {
        const st = manual.steps[sIdx];

        // Step number pill
        doc.setFillColor(79, 70, 229);
        doc.roundedRect(marginX + 6, rowY - 3.2, 7.5, 4.8, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text(`${sIdx + 1 < 10 ? '0' : ''}${sIdx + 1}`, marginX + 9.75, rowY, { align: 'center' });

        // Action tag pill (TYPE, CLICK, VERIFY, etc.)
        const actTag = (st.actionType || 'action').toUpperCase();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        const actTagW = doc.getTextWidth(actTag) + 4;
        doc.setFillColor(238, 242, 255);
        doc.setDrawColor(199, 210, 254);
        doc.roundedRect(marginX + 16, rowY - 3.2, actTagW, 4.8, 1, 1, 'FD');
        doc.setTextColor(67, 56, 202);
        doc.text(actTag, marginX + 16 + actTagW / 2, rowY, { align: 'center' });

        // Step title
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        const titleX = marginX + 18 + actTagW;
        const availableTitleW = contentWidth - (titleX - marginX) - 20;
        const shortTitle = doc.splitTextToSize(st.title, availableTitleW)[0];
        doc.text(shortTitle, titleX, rowY);

        // Marker for exact page reference to be filled after procedural steps pass
        stepIndexPageMarkers.push({
          page: doc.getNumberOfPages(),
          x: marginX + contentWidth - 6,
          y: rowY,
          stepIdx: sIdx,
        });

        rowY += stepRowH;
      }
    }
  }

  // --- TRANSITION TO PROCEDURAL PAGES ---
  // Every procedural step starts on a dedicated page or atomic block,
  // guaranteeing instructions and screenshots are NEVER split.
  doc.addPage();
  currentY = 22;

  // ==========================================
  // --- 2. PROCEDURAL STEPS (CLAUDE ATOMIC) ---
  // ==========================================
  for (let i = 0; i < manual.steps.length; i++) {
    const step = manual.steps[i];
    if (onProgress) {
      onProgress(`Diseñando paso ${i + 1} de ${manual.steps.length}...`);
    }

    // 1. Calculate Badges & Header height
    const headerRowHeight = 8;

    // 2. Calculate Title height
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const stepTitleLines = doc.splitTextToSize(step.title, contentWidth);
    const titleHeight = stepTitleLines.length * 5.4 + 2;

    // 3. Calculate Description height
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    const descLines = doc.splitTextToSize(step.description, contentWidth);
    const descHeight = descLines.length * 4.6 + 3.5;

    // 4. Calculate Callouts heights with premium card layout
    let expHeight = 0;
    let expLines: string[] = [];
    if (step.expectedResult) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      expLines = doc.splitTextToSize(step.expectedResult, contentWidth - 14);
      expHeight = 6 + expLines.length * 4.2 + 3.5 + 3.5; // header + text + padding + gap
    }

    let tipHeight = 0;
    let tipLines: string[] = [];
    if (step.tip) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      tipLines = doc.splitTextToSize(step.tip, contentWidth - 14);
      tipHeight = 6 + tipLines.length * 4.2 + 3.5 + 3.5;
    }

    let warnHeight = 0;
    let warnLines: string[] = [];
    if (step.warning) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      warnLines = doc.splitTextToSize(step.warning, contentWidth - 14) as string[];
      warnHeight = 6 + warnLines.length * 4.2 + 3.5 + 3.5;
    }

    let instructorHeight = 0;
    let instructorLines: string[] = [];
    const instructorSpeechText = step.instructorAudioQuote
      ? `"${step.instructorAudioQuote}"${step.instructorNotes && step.instructorNotes !== step.instructorAudioQuote ? ` — ${step.instructorNotes}` : ''}`
      : (step.instructorNotes || '');

    if (instructorSpeechText) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      instructorLines = doc.splitTextToSize(instructorSpeechText, contentWidth - 14) as string[];
      instructorHeight = 6 + instructorLines.length * 4.2 + 3.5 + 3.5;
    }

    const textBlockHeight = headerRowHeight + titleHeight + descHeight + expHeight + tipHeight + warnHeight + instructorHeight;

    // 5. Calculate Screenshot dimensions with browser mockup window header
    let preparedImage: { dataUrl: string; renderW: number; renderH: number } | null = null;
    let imageTotalHeight = 0;
    const windowBarH = 6; // macOS-style window header bar

    if (step.image) {
      const { dataUrl, width: imgW, height: imgH } = await renderAnnotatedScreenshotForPdf(
        step.image,
        step.annotations
      );

      const usablePageHeight = maxY - 22; // 255mm total available on a sheet
      const aspect = imgH && imgW ? imgH / imgW : 0.5625;

      // Ensure the screenshot dynamically scales so text + callouts + screenshot ALWAYS fit on ONE page
      const maxAllowedImgH = Math.min(130, Math.max(55, usablePageHeight - textBlockHeight - windowBarH - 14));

      let renderW = contentWidth;
      let renderH = renderW * aspect;

      if (renderH > maxAllowedImgH) {
        renderH = maxAllowedImgH;
        renderW = Math.min(contentWidth, renderH / aspect);
      }

      preparedImage = {
        dataUrl,
        renderW,
        renderH,
      };

      imageTotalHeight = renderH + windowBarH + 8;
    }

    const totalStepHeight = textBlockHeight + imageTotalHeight + 6;

    // --- ATOMIC STEP VALIDATION (CLAUDE-STYLE INTEGRITY) ---
    // If the step (text + callouts + screenshot) cannot fit on the current page,
    // execute page break NOW so instructions and screen are NEVER separated.
    if (currentY > 22 && currentY + totalStepHeight > maxY) {
      doc.addPage();
      currentY = 22; // Start below running header on clean page
    }

    // Record the exact page where this step starts
    stepStartPages[i] = doc.getNumberOfPages();

    // ==========================================
    // --- DRAW UNIFIED, ALIGNED STEP BLOCK ---
    // ==========================================

    // --- ROW 1: BADGES (PASO NUMERO + TIPO DE ACCIÓN + ELEMENTO) ---
    const stepNumStr = `PASO ${i + 1 < 10 ? '0' : ''}${i + 1}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const stepNumW = doc.getTextWidth(stepNumStr) + 7;

    // Step Number Pill Badge
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.roundedRect(marginX, currentY, stepNumW, 5.5, 1.2, 1.2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(stepNumStr, marginX + stepNumW / 2, currentY + 3.8, { align: 'center' });

    // Action Tag Pill (TYPE, CLICK, VERIFY, ENTER, etc.)
    const actionStr = (step.actionType || 'action').toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const actionW = doc.getTextWidth(actionStr) + 6;
    const actionX = marginX + stepNumW + 2.5;

    doc.setFillColor(238, 242, 255); // indigo-50
    doc.setDrawColor(199, 210, 254); // indigo-200
    doc.roundedRect(actionX, currentY, actionW, 5.5, 1.2, 1.2, 'FD');
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text(actionStr, actionX + actionW / 2, currentY + 3.8, { align: 'center' });

    // Target Element text label
    if (step.targetElement) {
      const targetX = actionX + actionW + 3;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      const maxTargetW = contentWidth - (targetX - marginX);
      const truncatedTarget = doc.splitTextToSize(`·  ${step.targetElement}`, maxTargetW)[0];
      doc.text(truncatedTarget, targetX, currentY + 3.8);
    }

    currentY += headerRowHeight;

    // --- ROW 2: STEP TITLE (ALIGNED ON MARGINX) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // slate-900
    stepTitleLines.forEach((tl: string, tlIdx: number) => {
      doc.text(tl, marginX, currentY + 4.2 + tlIdx * 5.4);
    });
    currentY += titleHeight;

    // --- ROW 3: STEP DESCRIPTION (ALIGNED ON MARGINX) ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(51, 65, 85); // slate-700
    descLines.forEach((dl: string, dlIdx: number) => {
      doc.text(dl, marginX, currentY + 3.8 + dlIdx * 4.6);
    });
    currentY += descHeight;

    // --- ROW 4: CALLOUT CARDS (RESULT, TIP, WARNING) ---
    const drawEditorialCallout = (
      label: string,
      lines: string[],
      cardHeight: number,
      barColor: [number, number, number],
      bgColor: [number, number, number],
      borderColor: [number, number, number],
      labelColor: [number, number, number],
      textColor: [number, number, number]
    ) => {
      // Main Card Box
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.roundedRect(marginX, currentY, contentWidth, cardHeight - 3.5, 1.5, 1.5, 'FD');

      // Left Accent Solid Bar
      doc.setFillColor(barColor[0], barColor[1], barColor[2]);
      doc.rect(marginX, currentY, 2.5, cardHeight - 3.5, 'F');

      // Top Tag Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
      doc.text(label, marginX + 6, currentY + 4.4);

      // Body Text with exact line-by-line positioning
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      lines.forEach((ln, lIdx) => {
        doc.text(ln, marginX + 6, currentY + 8.8 + lIdx * 4.2);
      });

      currentY += cardHeight;
    };

    // 1. Expected Result Card
    if (step.expectedResult && expLines.length > 0) {
      drawEditorialCallout(
        '✓  RESULTADO ESPERADO',
        expLines,
        expHeight,
        [79, 70, 229],   // indigo-600
        [248, 250, 252], // slate-50
        [226, 232, 240], // slate-200
        [67, 56, 202],   // indigo-700
        [51, 65, 85]     // slate-700
      );
    }

    // 2. Tip Card
    if (step.tip && tipLines.length > 0) {
      drawEditorialCallout(
        '✦  CONSEJO DE EXPERTO',
        tipLines,
        tipHeight,
        [16, 185, 129],  // emerald-500
        [240, 253, 244], // emerald-50
        [187, 247, 208], // emerald-200
        [4, 120, 87],    // emerald-700
        [22, 101, 52]    // emerald-800
      );
    }

    // 3. Warning Card
    if (step.warning && warnLines.length > 0) {
      drawEditorialCallout(
        '⚠  PRECAUCIÓN / ATENCIÓN',
        warnLines,
        warnHeight,
        [245, 158, 11],  // amber-500
        [255, 251, 235], // amber-50
        [254, 230, 138], // amber-200
        [180, 83, 9],    // amber-700
        [146, 64, 14]    // amber-800
      );
    }

    // 4. Instructor Audio Guidance Card (Teams Style)
    if (instructorSpeechText && instructorLines.length > 0) {
      drawEditorialCallout(
        '🎙  EXPLICACIÓN DEL INSTRUCTOR (AUDIO EN VIVO · MS TEAMS)',
        instructorLines,
        instructorHeight,
        [147, 51, 234],  // purple-600
        [250, 245, 255], // purple-50
        [233, 213, 255], // purple-200
        [126, 34, 206],  // purple-700
        [88, 28, 135]    // purple-900
      );
    }

    // --- ROW 5: SCREENSHOT WITH BROWSER MOCKUP FRAME ---
    if (preparedImage) {
      const imgX = marginX + (contentWidth - preparedImage.renderW) / 2;
      const totalImgBoxH = preparedImage.renderH + windowBarH;

      // Mockup window frame background & border
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.roundedRect(imgX, currentY, preparedImage.renderW, totalImgBoxH, 2, 2, 'FD');

      // Window top bar
      doc.setFillColor(226, 232, 240); // slate-200
      doc.rect(imgX, currentY, preparedImage.renderW, windowBarH, 'F');
      doc.line(imgX, currentY + windowBarH, imgX + preparedImage.renderW, currentY + windowBarH);

      // 3 Window traffic light dots
      doc.setFillColor(239, 68, 68); // red
      doc.circle(imgX + 3.5, currentY + 3, 1.1, 'F');
      doc.setFillColor(245, 158, 11); // amber
      doc.circle(imgX + 7, currentY + 3, 1.1, 'F');
      doc.setFillColor(16, 185, 129); // emerald
      doc.circle(imgX + 10.5, currentY + 3, 1.1, 'F');

      // Caption in window bar
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Paso ${i + 1} — Captura del Sistema`, imgX + 15, currentY + 4);

      // Embedded screenshot image
      try {
        doc.addImage(
          preparedImage.dataUrl,
          'PNG',
          imgX,
          currentY + windowBarH,
          preparedImage.renderW,
          preparedImage.renderH
        );
      } catch (err) {
        console.warn('Failed to embed image:', err);
      }

      currentY += totalImgBoxH + 6;

      // If there are more steps, and this step had a screenshot, start the next step on a fresh page
      if (i < manual.steps.length - 1) {
        doc.addPage();
        currentY = 22;
      }
    } else {
      currentY += 4;
      // If step has no image, only add page if next step wouldn't fit
      if (i < manual.steps.length - 1 && currentY > maxY - 40) {
        doc.addPage();
        currentY = 22;
      }
    }
  }

  // ==========================================
  // --- 3. TROUBLESHOOTING & FAQ SECTION ---
  // ==========================================
  if (manual.troubleshooting && manual.troubleshooting.length > 0) {
    checkPageBreak(35);

    // Section Header
    doc.setFillColor(79, 70, 229);
    doc.rect(marginX, currentY, 20, 2, 'F');
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('Resolución de Problemas Frecuentes', marginX, currentY);
    currentY += 7;

    manual.troubleshooting.forEach((item) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const solLines = doc.splitTextToSize(item.solution, contentWidth - 14);
      const itemH = 6 + solLines.length * 4.2 + 3.5;
      checkPageBreak(itemH + 4);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(marginX, currentY, contentWidth, itemH, 1.5, 1.5, 'FD');

      doc.setFillColor(245, 158, 11); // amber bar
      doc.rect(marginX, currentY, 2.5, itemH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`Problema: ${item.problem}`, marginX + 6, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(solLines, marginX + 6, currentY + 8.8);

      currentY += itemH + 3.5;
    });
  }

  // ==========================================
  // --- 4. CHECKLIST SECTION ---
  // ==========================================
  if (manual.summaryChecklist && manual.summaryChecklist.length > 0) {
    checkPageBreak(30);

    doc.setFillColor(16, 185, 129); // emerald bar
    doc.rect(marginX, currentY, 20, 2, 'F');
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('Lista de Verificación Final', marginX, currentY);
    currentY += 7;

    manual.summaryChecklist.forEach((chk) => {
      checkPageBreak(10);
      doc.setDrawColor(148, 163, 184);
      doc.rect(marginX, currentY - 3, 3.5, 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(chk, marginX + 6, currentY);
      currentY += 5.5;
    });
  }

  // ==========================================
  // --- 4.5. FILL IN DYNAMIC PAGE REFERENCES IN TABLE OF CONTENTS ---
  // ==========================================
  stepIndexPageMarkers.forEach((marker) => {
    doc.setPage(marker.page);
    const actualPage = stepStartPages[marker.stepIdx] || (marker.stepIdx + 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Pág. ${actualPage}`, marker.x, marker.y, { align: 'right' });
  });

  // ==========================================
  // --- 5. RUNNING HEADERS & FOOTERS ---
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Running Header on pages 2+
    if (p > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      const headerTitle = manual.title.length > 45 ? `${manual.title.substring(0, 45)}...` : manual.title;
      doc.text(headerTitle.toUpperCase(), marginX, 12);
      doc.text('MANUAL TÉCNICO DE USUARIO', pageWidth - marginX, 12, { align: 'right' });

      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, 14, pageWidth - marginX, 14);
    }

    // Running Footer on all pages
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('ManualCraft AI · Documentación Operativa de Sistemas', marginX, pageHeight - 9);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - marginX, pageHeight - 9, {
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

  doc.save(`${safeName || 'manual-usuario'}.pdf`);
}

/**
 * Generates and downloads an authentic, beautifully styled Microsoft Word (.docx) document
 * complete with annotated screenshots, executive summary, callouts, tables, and standard SOP structure.
 */
export async function exportToDocx(
  manual: UserManual,
  onProgress?: (msg: string) => void
): Promise<void> {
  if (onProgress) onProgress('Preparando documento Word (.docx) corporativo...');

  // Helper for Callout Boxes in Word
  const createCalloutBox = (
    title: string,
    body: string,
    borderColor: string,
    bgColor: string,
    titleColor: string,
    textColor: string
  ): Table => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: {
                left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
                top: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
              },
              shading: { fill: bgColor },
              margins: { top: 120, bottom: 120, left: 180, right: 180 },
              children: [
                new Paragraph({
                  spacing: { after: 60 },
                  children: [
                    new TextRun({
                      text: title,
                      bold: true,
                      color: titleColor,
                      size: 19,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: body,
                      color: textColor,
                      size: 21,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  };

  const docChildren: (Paragraph | Table)[] = [];

  // ==========================================
  // --- 1. COVER / HEADER SECTION ---
  // ==========================================

  // Supertitle
  docChildren.push(
    new Paragraph({
      spacing: { before: 100, after: 80 },
      children: [
        new TextRun({
          text: 'GUÍA OPERATIVA & MANUAL TÉCNICO DE USUARIO',
          bold: true,
          color: '4F46E5', // indigo-600
          size: 19,
        }),
      ],
    })
  );

  // Main Title
  docChildren.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: manual.title,
          bold: true,
          color: '0F172A', // slate-900
          size: 44, // 22pt
        }),
      ],
    })
  );

  // Subtitle
  if (manual.subtitle) {
    docChildren.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: manual.subtitle,
            italics: true,
            color: '64748B', // slate-500
            size: 22, // 11pt
          }),
        ],
      })
    );
  }

  // Metadata Table (Duración, Dificultad, Audiencia, Versión)
  const metaCells: TableCell[] = [
    new TableCell({
      shading: { fill: 'F8FAFC' },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
      },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: 'DURACIÓN', bold: true, size: 15, color: '64748B' }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${manual.estimatedMinutes || 5} min`, bold: true, size: 20, color: '0F172A' }),
          ],
        }),
      ],
    }),
    new TableCell({
      shading: { fill: 'F8FAFC' },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
      },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: 'DIFICULTAD', bold: true, size: 15, color: '64748B' }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: manual.difficulty || 'Principiante', bold: true, size: 20, color: '0F172A' }),
          ],
        }),
      ],
    }),
    new TableCell({
      shading: { fill: 'F8FAFC' },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
      },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: 'AUDIENCIA', bold: true, size: 15, color: '64748B' }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: manual.targetAudience || 'Usuarios del Sistema', bold: true, size: 20, color: '0F172A' }),
          ],
        }),
      ],
    }),
    new TableCell({
      shading: { fill: 'F8FAFC' },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        left: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
        right: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' },
      },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text: 'VERSIÓN', bold: true, size: 15, color: '64748B' }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `v${manual.version || '1.0'}`, bold: true, size: 20, color: '0F172A' }),
          ],
        }),
      ],
    }),
  ];

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: metaCells })],
    })
  );

  docChildren.push(new Paragraph({ spacing: { after: 180 } }));

  // Executive Overview Box
  if (manual.overview) {
    docChildren.push(
      createCalloutBox(
        '📋 RESUMEN DEL PROCEDIMIENTO',
        manual.overview,
        '4F46E5', // indigo
        'F8FAFC',
        '4338CA',
        '334155'
      )
    );
    docChildren.push(new Paragraph({ spacing: { after: 160 } }));
  }

  // Prerequisites Box
  if (manual.prerequisites && manual.prerequisites.length > 0) {
    const prereqParas: Paragraph[] = [
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: '⚡ REQUISITOS PREVIOS REQUERIDOS',
            bold: true,
            color: '059669',
            size: 19,
          }),
        ],
      }),
    ];

    manual.prerequisites.forEach((p) => {
      prereqParas.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: '✓  ', bold: true, color: '10B981', size: 20 }),
            new TextRun({ text: p, color: '1E293B', size: 21 }),
          ],
        })
      );
    });

    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: {
                  left: { style: BorderStyle.SINGLE, size: 24, color: '10B981' },
                  top: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                },
                shading: { fill: 'F0FDF4' },
                margins: { top: 120, bottom: 120, left: 180, right: 180 },
                children: prereqParas,
              }),
            ],
          }),
        ],
      })
    );
    docChildren.push(new Paragraph({ spacing: { after: 180 } }));
  }

  // Table of Contents / Step Index
  if (manual.steps && manual.steps.length > 0) {
    docChildren.push(
      new Paragraph({
        spacing: { before: 100, after: 100 },
        children: [
          new TextRun({
            text: 'ESTRUCTURA DEL PROCEDIMIENTO · ÍNDICE DE PASOS',
            bold: true,
            color: '4338CA',
            size: 20,
          }),
        ],
      })
    );

    const indexRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: 'EEF2FF' },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: 'PASO', bold: true, size: 16, color: '4338CA' })] })],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            shading: { fill: 'EEF2FF' },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: 'ACCIÓN', bold: true, size: 16, color: '4338CA' })] })],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            shading: { fill: 'EEF2FF' },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: 'DESCRIPCIÓN DEL PASO', bold: true, size: 16, color: '4338CA' })] })],
          }),
        ],
      }),
    ];

    manual.steps.forEach((st, sIdx) => {
      indexRows.push(
        new TableRow({
          children: [
            new TableCell({
              margins: { top: 70, bottom: 70, left: 100, right: 100 },
              borders: {
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                top: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `Paso ${sIdx + 1 < 10 ? '0' : ''}${sIdx + 1}`, bold: true, size: 18, color: '4F46E5' }),
                  ],
                }),
              ],
            }),
            new TableCell({
              margins: { top: 70, bottom: 70, left: 100, right: 100 },
              borders: {
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                top: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: getActionTypeSpanish(st.actionType), bold: true, size: 17, color: '475569' }),
                  ],
                }),
              ],
            }),
            new TableCell({
              margins: { top: 70, bottom: 70, left: 100, right: 100 },
              borders: {
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                top: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: st.title, bold: true, size: 18, color: '0F172A' }),
                    ...(st.targetElement ? [new TextRun({ text: ` (Elemento: ${st.targetElement})`, size: 16, color: '64748B' })] : []),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    });

    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: indexRows,
      })
    );
  }

  // Cover finishes with Page Break
  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // ==========================================
  // --- 2. PROCEDURAL STEPS (1 STEP = 1 PAGE) ---
  // ==========================================
  for (let i = 0; i < manual.steps.length; i++) {
    const step = manual.steps[i];
    if (onProgress) {
      onProgress(`Preparando paso ${i + 1} de ${manual.steps.length} en Word...`);
    }

    if (i > 0) {
      // In Word, insert a clean page break before each step to guarantee 100% cohesion between instructions and screenshot!
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    // Step Header Badge & Action
    const stepBadgeRuns: TextRun[] = [
      new TextRun({
        text: `PASO ${i + 1 < 10 ? '0' : ''}${i + 1}`,
        bold: true,
        color: '4F46E5',
        size: 22,
      }),
      new TextRun({
        text: `   |   ACCIÓN: ${getActionTypeSpanish(step.actionType)}`,
        bold: true,
        color: '475569',
        size: 19,
      }),
    ];
    if (step.targetElement) {
      stepBadgeRuns.push(
        new TextRun({
          text: `   |   ELEMENTO: ${step.targetElement}`,
          color: '64748B',
          size: 19,
        })
      );
    }

    docChildren.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: stepBadgeRuns,
      })
    );

    // Step Title (Heading 2)
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: step.title,
            bold: true,
            color: '0F172A',
            size: 30, // 15pt
          }),
        ],
      })
    );

    // Step Description
    docChildren.push(
      new Paragraph({
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: step.description,
            color: '334155',
            size: 22, // 11pt
          }),
        ],
      })
    );

    // Callout: Expected Result
    if (step.expectedResult) {
      docChildren.push(
        createCalloutBox(
          '✓ RESULTADO ESPERADO',
          step.expectedResult,
          '4F46E5',
          'EEF2FF',
          '4338CA',
          '334155'
        )
      );
      docChildren.push(new Paragraph({ spacing: { after: 100 } }));
    }

    // Callout: Tip
    if (step.tip) {
      docChildren.push(
        createCalloutBox(
          '✦ CONSEJO DE EXPERTO',
          step.tip,
          '10B981',
          'ECFDF5',
          '047857',
          '065F46'
        )
      );
      docChildren.push(new Paragraph({ spacing: { after: 100 } }));
    }

    // Callout: Warning
    if (step.warning) {
      docChildren.push(
        createCalloutBox(
          '⚠ PRECAUCIÓN / ATENCIÓN',
          step.warning,
          'F59E0B',
          'FFFBEB',
          'B45309',
          '78350F'
        )
      );
      docChildren.push(new Paragraph({ spacing: { after: 100 } }));
    }

    // Callout: Instructor Audio Guidance (Teams Style)
    const docxInstructorSpeechText = step.instructorAudioQuote
      ? `"${step.instructorAudioQuote}"${step.instructorNotes && step.instructorNotes !== step.instructorAudioQuote ? ` — ${step.instructorNotes}` : ''}`
      : (step.instructorNotes || '');

    if (docxInstructorSpeechText) {
      docChildren.push(
        createCalloutBox(
          '🎙 EXPLICACIÓN DEL INSTRUCTOR (AUDIO EN VIVO · MS TEAMS)',
          docxInstructorSpeechText,
          '9333EA',
          'FAF5FF',
          '7E22CE',
          '581C87'
        )
      );
      docChildren.push(new Paragraph({ spacing: { after: 100 } }));
    }

    // Screenshot with Annotated Visual Highlights
    if (step.image) {
      try {
        const { dataUrl, width: imgW, height: imgH } = await renderAnnotatedScreenshotForPdf(
          step.image,
          step.annotations
        );

        const imgBytes = dataUrlToUint8Array(dataUrl);

        // Word printable width ~560px
        const wordImgW = 560;
        const aspect = imgH && imgW ? imgH / imgW : 0.5625;
        const wordImgH = Math.min(360, Math.round(wordImgW * aspect));

        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 140, after: 60 },
            children: [
              new ImageRun({
                type: 'png',
                data: imgBytes,
                transformation: {
                  width: wordImgW,
                  height: wordImgH,
                },
              }),
            ],
          })
        );

        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `Figura ${i + 1}: Captura del sistema para "${step.title}" con indicadores visuales.`,
                italics: true,
                size: 17,
                color: '64748B',
              }),
            ],
          })
        );
      } catch (err) {
        console.warn('Failed to embed step image in Word:', err);
      }
    }
  }

  // ==========================================
  // --- 3. TROUBLESHOOTING & FAQ SECTION ---
  // ==========================================
  if (manual.troubleshooting && manual.troubleshooting.length > 0) {
    docChildren.push(new Paragraph({ children: [new PageBreak()] }));

    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 100, after: 120 },
        children: [
          new TextRun({
            text: 'Resolución de Problemas Frecuentes',
            bold: true,
            color: '0F172A',
            size: 28,
          }),
        ],
      })
    );

    const faqRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { fill: 'F1F5F9' },
            margins: { top: 90, bottom: 90, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'PROBLEMA O SÍNTOMA', bold: true, size: 17, color: '334155' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            shading: { fill: 'F1F5F9' },
            margins: { top: 90, bottom: 90, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'SOLUCIÓN OPERATIVA RECOMENDADA', bold: true, size: 17, color: '334155' })],
              }),
            ],
          }),
        ],
      }),
    ];

    manual.troubleshooting.forEach((item) => {
      faqRows.push(
        new TableRow({
          children: [
            new TableCell({
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              borders: {
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                top: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: item.problem, bold: true, size: 19, color: 'B45309' })],
                }),
              ],
            }),
            new TableCell({
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              borders: {
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                top: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: item.solution, size: 19, color: '334155' })],
                }),
              ],
            }),
          ],
        })
      );
    });

    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: faqRows,
      })
    );
  }

  // ==========================================
  // --- 4. VERIFICATION CHECKLIST ---
  // ==========================================
  if (manual.summaryChecklist && manual.summaryChecklist.length > 0) {
    docChildren.push(new Paragraph({ spacing: { before: 180, after: 100 } }));

    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: 'Lista de Verificación Final',
            bold: true,
            color: '0F172A',
            size: 28,
          }),
        ],
      })
    );

    manual.summaryChecklist.forEach((chk) => {
      docChildren.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '☐  ', bold: true, size: 24, color: '64748B' }),
            new TextRun({ text: chk, size: 21, color: '1E293B' }),
          ],
        })
      );
    });
  }

  // Create Document with Headers, Footers, and standard margins
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
            color: '334155',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${manual.title.substring(0, 50).toUpperCase()} · MANUAL TÉCNICO`,
                    size: 16,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'ManualCraft AI · Documentación Operativa   |   Página ',
                    size: 16,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    text: ' de ',
                    size: 16,
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: docChildren,
      },
    ],
  });

  if (onProgress) onProgress('Empaquetando archivo Word (.docx)...');

  const blob = await Packer.toBlob(doc);
  const safeName = manual.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName || 'manual-usuario'}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports the manual as a completely autonomous, responsive, interactive single-file HTML page.
 * Anyone can open this file in Chrome, Safari, Edge, or mobile without internet connection.
 * It contains both Document View and Step-by-Step Interactive Guide Mode.
 */
export function exportToInteractiveHtml(manual: UserManual) {
  const manualJson = JSON.stringify(manual);
  const safeName = manual.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(manual.title)} | Manual de Usuario Interactivo</title>
  <meta name="description" content="${escapeHtml(manual.subtitle || manual.overview)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --bg-main: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
      --accent-green: #10b981;
      --accent-amber: #f59e0b;
      --accent-red: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: var(--bg-main);
      color: var(--text-main);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    header {
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(8px);
      background-color: rgba(255, 255, 255, 0.95);
    }
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--primary);
    }
    .brand svg { width: 24px; height: 24px; }
    .header-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
    }
    .btn-primary { background: var(--primary); color: #ffffff; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-outline { background: #ffffff; border-color: var(--border-color); color: var(--text-main); }
    .btn-outline:hover { background: #f1f5f9; }
    .container {
      max-width: 1100px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }
    .hero {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      padding: 2.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .hero-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .hero h1 {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      line-height: 1.2;
      color: var(--text-main);
      margin-bottom: 0.75rem;
    }
    .hero p.subtitle {
      font-size: 1.15rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
    .hero p.overview {
      font-size: 1rem;
      color: #334155;
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 0.75rem;
      border-left: 4px solid var(--primary);
    }
    .prereqs-box {
      margin-top: 1.5rem;
      padding: 1.25rem;
      background: #f1f5f9;
      border-radius: 0.75rem;
    }
    .prereqs-title {
      font-weight: 700;
      font-size: 0.9rem;
      color: #1e293b;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .prereqs-list { list-style: none; display: flex; flex-direction: column; gap: 0.4rem; }
    .prereqs-list li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #475569; }
    
    /* Step card */
    .steps-container { display: flex; flex-direction: column; gap: 2rem; margin-bottom: 3rem; }
    .step-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .step-card:hover { border-color: #cbd5e1; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .step-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }
    .step-num-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: var(--primary);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.875rem;
      flex-shrink: 0;
    }
    .step-header-text { flex: 1; }
    .step-action-tag {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--primary);
      margin-bottom: 0.25rem;
    }
    .step-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
    }
    .step-body {
      padding: 2rem;
    }
    .step-desc {
      font-size: 1.05rem;
      color: #334155;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }
    .step-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .callout {
      padding: 1rem 1.25rem;
      border-radius: 0.75rem;
      font-size: 0.9rem;
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }
    .callout-tip { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
    .callout-warning { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
    .callout-result { background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; }
    
    .image-wrapper {
      position: relative;
      background: #0f172a;
      border-radius: 0.75rem;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      margin-top: 1rem;
    }
    .image-wrapper img {
      width: 100%;
      height: auto;
      display: block;
      transition: transform 0.3s;
    }
    .hotspot {
      position: absolute;
      transform: translate(-50%, -50%);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid #ef4444;
      background: rgba(239, 68, 68, 0.25);
      animation: pulseHotspot 2s infinite;
      cursor: pointer;
    }
    @keyframes pulseHotspot {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { box-shadow: 0 0 0 14px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    .hotspot-label {
      position: absolute;
      bottom: -28px;
      left: 50%;
      transform: translateX(-50%);
      background: #0f172a;
      color: #ffffff;
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 0.35rem;
      white-space: nowrap;
      pointer-events: none;
    }
    
    /* Interactive Guided Mode Overlay / Modal */
    #interactive-player {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      z-index: 100;
      padding: 1.5rem;
      overflow-y: auto;
    }
    .player-dialog {
      max-width: 980px;
      margin: 2rem auto;
      background: #ffffff;
      border-radius: 1.25rem;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .player-header {
      padding: 1.25rem 2rem;
      background: #f8fafc;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .progress-bar-bg {
      width: 100%;
      height: 6px;
      background: #e2e8f0;
    }
    .progress-bar-fill {
      height: 100%;
      background: var(--primary);
      transition: width 0.3s;
    }
    .player-body { padding: 2.5rem; }
    .player-footer {
      padding: 1.5rem 2rem;
      background: #f8fafc;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    /* Troubleshooting & Checklist */
    .section-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
    }
    .section-card h2 {
      font-size: 1.35rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .trouble-item {
      padding: 1rem;
      border-radius: 0.5rem;
      background: #f8fafc;
      border-left: 3px solid #f59e0b;
      margin-bottom: 1rem;
    }
    .trouble-prob { font-weight: 600; color: #1e293b; margin-bottom: 0.3rem; }
    .trouble-sol { color: #475569; font-size: 0.95rem; }
    
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
    }
    .checklist-item input[type="checkbox"] {
      width: 1.25rem;
      height: 1.25rem;
      accent-color: var(--primary);
      cursor: pointer;
    }
    
    @media print {
      body { background: #ffffff !important; color: #000000 !important; }
      header, .header-controls, #interactive-player, .hotspot { display: none !important; }
      .container { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
      .step-card {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        break-inside: avoid-page !important;
        overflow: visible !important;
        display: block !important;
        border: 1px solid #ccc !important;
        box-shadow: none !important;
        margin-bottom: 1.5rem !important;
      }
      .step-header {
        break-after: avoid !important;
        page-break-after: avoid !important;
      }
      .image-wrapper, .image-wrapper img {
        max-height: 400px;
        object-fit: contain;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>

  <header>
    <div class="header-inner">
      <div class="brand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          <path d="m9 9 2 2 4-4"/>
        </svg>
        <span>ManualCraft AI</span>
      </div>
      <div class="header-controls">
        <button class="btn btn-primary" onclick="openInteractivePlayer(0)">
          <span>▶ Iniciar Modo Interactivo</span>
        </button>
        <button class="btn btn-outline" onclick="window.print()">
          <span>🖨 Imprimir / Guardar PDF</span>
        </button>
      </div>
    </div>
  </header>

  <div class="container">
    <div class="hero">
      <div class="hero-meta">
        <span>⏱ ${manual.estimatedMinutes || 5} min</span>
        <span>·</span>
        <span>🎯 ${escapeHtml(manual.difficulty || 'Principiante')}</span>
        ${manual.targetAudience ? `<span>·</span><span>👤 ${escapeHtml(manual.targetAudience)}</span>` : ''}
        ${manual.version ? `<span>·</span><span>v${escapeHtml(manual.version)}</span>` : ''}
      </div>
      <h1>${escapeHtml(manual.title)}</h1>
      ${manual.subtitle ? `<p class="subtitle">${escapeHtml(manual.subtitle)}</p>` : ''}
      <p class="overview">${escapeHtml(manual.overview)}</p>

      ${
        manual.prerequisites && manual.prerequisites.length > 0
          ? `<div class="prereqs-box">
              <div class="prereqs-title">
                <span>⚡ Requisitos Previos:</span>
              </div>
              <ul class="prereqs-list">
                ${manual.prerequisites
                  .map((p) => `<li><span style="color:var(--primary); font-weight:bold;">✓</span> ${escapeHtml(p)}</li>`)
                  .join('')}
              </ul>
            </div>`
          : ''
      }
    </div>

    <!-- Steps -->
    <div class="steps-container">
      ${manual.steps
        .map(
          (step, idx) => `
        <div class="step-card" id="step-${idx + 1}">
          <div class="step-header">
            <div style="display:flex; gap:1rem; align-items:flex-start;">
              <span class="step-num-pill">${idx + 1}</span>
              <div class="step-header-text">
                <div class="step-action-tag">${escapeHtml(getActionTypeSpanish(step.actionType))} ${step.targetElement ? `· ${escapeHtml(step.targetElement)}` : ''}</div>
                <h3 class="step-title">${escapeHtml(step.title)}</h3>
              </div>
            </div>
          </div>
          <div class="step-body">
            <p class="step-desc">${escapeHtml(step.description)}</p>
            
            <div class="step-meta-grid">
              ${
                step.expectedResult
                  ? `<div class="callout callout-result">
                      <span>🎯</span>
                      <div><strong>Resultado:</strong> ${escapeHtml(step.expectedResult)}</div>
                    </div>`
                  : ''
              }
              ${
                step.tip
                  ? `<div class="callout callout-tip">
                      <span>💡</span>
                      <div><strong>Consejo Pro:</strong> ${escapeHtml(step.tip)}</div>
                    </div>`
                  : ''
              }
              ${
                step.warning
                  ? `<div class="callout callout-warning">
                      <span>⚠️</span>
                      <div><strong>Atención:</strong> ${escapeHtml(step.warning)}</div>
                    </div>`
                  : ''
              }
            </div>

            ${
              step.image
                ? `<div class="image-wrapper">
                    <img src="${step.image}" alt="Captura de paso ${idx + 1}" loading="lazy">
                    ${(step.annotations || [])
                      .map((ann) => {
                        const isNearTop = (ann.y || 0) < 14;
                        const pos = ann.labelPosition || (isNearTop ? 'bottom' : 'top');
                        let labelStyle = '';
                        if (ann.labelPosition === 'custom' && (ann.labelOffsetX !== undefined || ann.labelOffsetY !== undefined)) {
                          labelStyle = `top: 0px; left: 0px; transform: translate(${ann.labelOffsetX || 0}px, ${ann.labelOffsetY || 0}px);`;
                        } else if (pos === 'bottom') {
                          labelStyle = 'bottom: -26px; left: 0;';
                        } else if (pos === 'inside') {
                          labelStyle = 'top: 4px; left: 4px;';
                        } else if (pos === 'right') {
                          labelStyle = 'top: 0; right: -90px;';
                        } else {
                          labelStyle = 'top: -26px; left: 0;';
                        }

                        if (ann.shape === 'blur') {
                          return `
                            <div style="position: absolute; left: ${ann.x}%; top: ${ann.y}%; width: ${ann.width || 20}%; height: ${ann.height || 10}%; transform: translate(-50%, -50%); backdrop-filter: blur(8px); background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.4); border-radius: 4px;"></div>
                          `;
                        }

                        if (ann.shape === 'rect') {
                          return `
                            <div style="position: absolute; left: ${ann.x}%; top: ${ann.y}%; width: ${ann.width || 20}%; height: ${ann.height || 12}%; transform: translate(-50%, -50%); border: 2px solid ${ann.color || '#ef4444'}; background: rgba(239, 68, 68, 0.15); border-radius: 6px;">
                              ${ann.label ? `<span style="position: absolute; ${labelStyle} background: ${ann.color || '#ef4444'}; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${escapeHtml(ann.label)}</span>` : ''}
                            </div>
                          `;
                        }

                        return `
                          <div class="hotspot" style="left: ${ann.x}%; top: ${ann.y}%; border-color: ${ann.color || '#ef4444'};">
                            ${ann.label ? `<span class="hotspot-label" style="${ann.labelPosition === 'custom' ? `top: 0px; left: 0px; transform: translate(${ann.labelOffsetX || 0}px, ${ann.labelOffsetY || 0}px);` : (pos === 'bottom' || isNearTop ? 'bottom: -28px;' : 'top: -28px;')}">${escapeHtml(ann.label)}</span>` : ''}
                          </div>
                        `;
                      })
                      .join('')}
                  </div>`
                : ''
            }
          </div>
        </div>
      `
        )
        .join('')}
    </div>

    <!-- Troubleshooting -->
    ${
      manual.troubleshooting && manual.troubleshooting.length > 0
        ? `<div class="section-card">
            <h2>🛠️ Preguntas Frecuentes & Resolución de Problemas</h2>
            ${manual.troubleshooting
              .map(
                (t) => `
              <div class="trouble-item">
                <div class="trouble-prob">❓ ${escapeHtml(t.problem)}</div>
                <div class="trouble-sol">💡 ${escapeHtml(t.solution)}</div>
              </div>
            `
              )
              .join('')}
          </div>`
        : ''
    }

    <!-- Checklist -->
    ${
      manual.summaryChecklist && manual.summaryChecklist.length > 0
        ? `<div class="section-card">
            <h2>✅ Lista de Verificación Final</h2>
            <div>
              ${manual.summaryChecklist
                .map(
                  (item) => `
                <label class="checklist-item">
                  <input type="checkbox">
                  <span>${escapeHtml(item)}</span>
                </label>
              `
                )
                .join('')}
            </div>
          </div>`
        : ''
    }
  </div>

  <!-- Interactive Guided Walkthrough Modal -->
  <div id="interactive-player">
    <div class="player-dialog">
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="player-progress" style="width: 0%;"></div>
      </div>
      <div class="player-header">
        <div>
          <span style="font-size:0.8rem; font-weight:700; color:var(--primary); text-transform:uppercase;" id="player-step-counter">PASO 1 DE 4</span>
          <h3 style="font-size:1.25rem; font-weight:700; margin-top:0.25rem;" id="player-step-title">Título del paso</h3>
        </div>
        <button class="btn btn-outline" onclick="closeInteractivePlayer()" style="padding:0.35rem 0.75rem;">✕ Salir</button>
      </div>
      <div class="player-body">
        <p style="font-size:1.15rem; color:#1e293b; margin-bottom:1.5rem; line-height:1.6;" id="player-step-desc"></p>
        <div id="player-image-container" class="image-wrapper" style="max-height:480px; display:flex; align-items:center; justify-content:center;"></div>
      </div>
      <div class="player-footer">
        <button class="btn btn-outline" id="player-prev-btn" onclick="prevStep()">← Paso Anterior</button>
        <div style="font-size:0.85rem; color:var(--text-muted);">Usa las teclas de flecha ← y →</div>
        <button class="btn btn-primary" id="player-next-btn" onclick="nextStep()">Siguiente Paso →</button>
      </div>
    </div>
  </div>

  <script>
    const manualData = ${manualJson};
    let currentStepIndex = 0;

    function openInteractivePlayer(stepIdx = 0) {
      currentStepIndex = stepIdx;
      document.getElementById('interactive-player').style.display = 'block';
      document.body.style.overflow = 'hidden';
      renderPlayerStep();
    }

    function closeInteractivePlayer() {
      document.getElementById('interactive-player').style.display = 'none';
      document.body.style.overflow = 'auto';
    }

    function renderPlayerStep() {
      const step = manualData.steps[currentStepIndex];
      if (!step) return;

      const total = manualData.steps.length;
      const pct = Math.round(((currentStepIndex + 1) / total) * 100);

      document.getElementById('player-progress').style.width = pct + '%';
      document.getElementById('player-step-counter').textContent = 'PASO ' + (currentStepIndex + 1) + ' DE ' + total + ' (' + pct + '%)';
      document.getElementById('player-step-title').textContent = step.title;
      document.getElementById('player-step-desc').textContent = step.description;

      const imgContainer = document.getElementById('player-image-container');
      if (step.image) {
        let annotationsHtml = '';
        if (step.annotations && step.annotations.length > 0) {
          annotationsHtml = step.annotations.map(a => \`
            <div class="hotspot" style="left:\${a.x}%; top:\${a.y}%; border-color:\${a.color || '#ef4444'}">
              \${a.label ? \`<span class="hotspot-label">\${a.label}</span>\` : ''}
            </div>
          \`).join('');
        }
        imgContainer.innerHTML = \`<img src="\${step.image}" alt="\${step.title}">\${annotationsHtml}\`;
        imgContainer.style.display = 'block';
      } else {
        imgContainer.innerHTML = '';
        imgContainer.style.display = 'none';
      }

      document.getElementById('player-prev-btn').disabled = currentStepIndex === 0;
      document.getElementById('player-prev-btn').style.opacity = currentStepIndex === 0 ? '0.5' : '1';

      const nextBtn = document.getElementById('player-next-btn');
      if (currentStepIndex === total - 1) {
        nextBtn.textContent = '🎉 ¡Finalizar Guía!';
        nextBtn.onclick = function() {
          alert('¡Felicidades! Has completado todos los pasos de este manual.');
          closeInteractivePlayer();
        };
      } else {
        nextBtn.textContent = 'Siguiente Paso →';
        nextBtn.onclick = nextStep;
      }
    }

    function prevStep() {
      if (currentStepIndex > 0) {
        currentStepIndex--;
        renderPlayerStep();
      }
    }

    function nextStep() {
      if (currentStepIndex < manualData.steps.length - 1) {
        currentStepIndex++;
        renderPlayerStep();
      }
    }

    window.addEventListener('keydown', (e) => {
      const player = document.getElementById('interactive-player');
      if (player.style.display === 'block') {
        if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
        if (e.key === 'ArrowLeft') prevStep();
        if (e.key === 'Escape') closeInteractivePlayer();
      }
    });
  </script>
</body>
</html>`;

  downloadFile(`${safeName || 'manual'}-interactivo.html`, htmlContent, 'text/html;charset=utf-8');
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
