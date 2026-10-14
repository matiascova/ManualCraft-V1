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
import { UserManual, getActionTypeSpanish } from '../types/manual';
import { Project } from '../types/project';
import { OrganizationBranding } from '../types/branding';
import { renderAnnotatedScreenshotForPdf } from './exportUtils';

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

interface BrandHeaderOptions {
  ourLogoUrl?: string;
  ourCompanyName?: string;
  ourSlogan?: string;
  clientLogoUrl?: string;
  clientName?: string;
  secondaryLogoUrl?: string;
  secondaryName?: string;
  secondarySlogan?: string;
}

/**
 * Loads an image from URL / dataUrl safely
 */
function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Renders the corporate brand header banner (Nuestro Logo + Logo del Cliente / HSBT)
 * onto an in-memory canvas and converts to PNG Uint8Array for native Word embedding.
 */
async function generateCorporateBrandHeaderPng(
  options: BrandHeaderOptions | string | undefined,
  clientNameLegacy?: string
): Promise<Uint8Array | null> {
  // Normalize parameters for backward compatibility
  const config: BrandHeaderOptions =
    typeof options === 'object' && options !== null
      ? options
      : {
          clientLogoUrl: typeof options === 'string' ? options : undefined,
          clientName: clientNameLegacy,
        };

  return new Promise(async (resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 420;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Background pure white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const ourLogoSrc = config.ourLogoUrl;
      const clientLogoSrc = config.clientLogoUrl;

      // 1. Draw Left Side (Nuestro Logo / Organización Emisora)
      let ourImgLoaded = false;
      if (ourLogoSrc) {
        const ourImg = await loadImageElement(ourLogoSrc);
        if (ourImg && ourImg.width > 0 && ourImg.height > 0) {
          const maxW = 640;
          const maxH = 360;
          const ratio = Math.min(maxW / ourImg.width, maxH / ourImg.height);
          const drawW = ourImg.width * ratio;
          const drawH = ourImg.height * ratio;
          const drawX = 40;
          const drawY = (canvas.height - drawH) / 2;
          ctx.drawImage(ourImg, drawX, drawY, drawW, drawH);
          ourImgLoaded = true;
        }
      }

      if (!ourImgLoaded) {
        // Fallback: draw crisp vector Weber / Company scaled up
        const startX = 40;
        const startY = (canvas.height - 180) / 2;
        ctx.fillStyle = '#FEDB00'; // Yellow
        ctx.beginPath();
        ctx.moveTo(startX, startY + 140);
        ctx.lineTo(startX + 90, startY);
        ctx.lineTo(startX + 180, startY + 140);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1E293B';
        ctx.fillRect(startX + 50, startY + 56, 80, 84);

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 96px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const brandName = config.ourCompanyName || 'weber';
        ctx.fillText(brandName.toLowerCase(), startX + 210, startY + 10);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 38px Arial, sans-serif';
        ctx.fillText(
          (config.ourSlogan || 'SAINT-GOBAIN CHILE').toUpperCase(),
          startX + 210,
          startY + 115
        );
      }

      // 2. Draw Right Side (Logo del Cliente o Sello HSBT)
      let rightSideDrawn = false;
      if (clientLogoSrc) {
        const clientImg = await loadImageElement(clientLogoSrc);
        if (clientImg && clientImg.width > 0 && clientImg.height > 0) {
          const maxW = 640;
          const maxH = 360;
          const ratio = Math.min(maxW / clientImg.width, maxH / clientImg.height);
          const drawW = clientImg.width * ratio;
          const drawH = clientImg.height * ratio;
          const drawX = canvas.width - drawW - 40;
          const drawY = (canvas.height - drawH) / 2;
          ctx.drawImage(clientImg, drawX, drawY, drawW, drawH);
          rightSideDrawn = true;
        }
      }

      if (!rightSideDrawn) {
        // Draw HSBT / Partner Badge scaled up proportionally
        const hsbtW = 360;
        const hsbtH = 160;
        const hsbtX = canvas.width - hsbtW - 40;
        const hsbtY = (canvas.height - hsbtH - 30) / 2;

        ctx.fillStyle = '#183B6C'; // Corporate Navy
        ctx.fillRect(hsbtX, hsbtY, hsbtW, hsbtH);

        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(hsbtX + hsbtW * 0.33, hsbtY);
        ctx.lineTo(hsbtX + hsbtW * 0.33, hsbtY + hsbtH);
        ctx.moveTo(hsbtX + hsbtW * 0.66, hsbtY);
        ctx.lineTo(hsbtX + hsbtW * 0.66, hsbtY + hsbtH);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 58px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.secondaryName || 'HSBT', hsbtX + hsbtW / 2, hsbtY + hsbtH / 2);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          config.secondarySlogan || 'COMPROMISO & CALIDAD',
          hsbtX + hsbtW / 2,
          hsbtY + hsbtH + 34
        );
      }

      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrlToUint8Array(dataUrl));
    } catch {
      resolve(null);
    }
  });
}

// Helpers for Word styling
const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
const tableBordersAll = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
};
const noBorders = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
};

/**
 * Creates a professional callout box in Word with thick left border
 */
function createDocxCallout(
  title: string,
  body: string,
  borderColor: string,
  bgColor: string,
  titleColor: string,
  textColor: string = '1E293B'
): Table {
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
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
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
}

/**
 * Generates an executive corporate Word (.docx) User Manual
 * strictly adhering to the exact Chilean Weber SAP Template format:
 * - Dual corporate logos header
 * - Large Navy Blue (#183B6C) Title Banner with SAP Kicker and Subtitle
 * - 4-column Technical Control Table (Ficha Técnica)
 * - Formal Table of Contents / Índice
 * - Section 1: Introducción, Objetivo, Matriz de Escenarios y Datos Maestros
 * - Section 2: Matriz de Flujo del Proceso en formato tabular
 * - Section 3: Procedimiento Paso a Paso con Banners de Transacción (#183B6C), Capturas Enmarcadas y Cajas de Llamado
 * - Section 4: Matriz de Errores y Resolución de Problemas SAP
 * - Section 5: Lista de Verificación y Control de Calidad
 * - Running Header & Footer corporativo en todas las páginas con "Página X de Y"
 */
export async function exportToDocxWithTemplateStructure(
  manual: UserManual,
  onProgress?: (msg: string) => void,
  project?: Project,
  branding?: OrganizationBranding
): Promise<void> {
  if (onProgress) onProgress('Preparando plantilla oficial corporativa para Word (.docx)...');

  const clientName = project?.clientName || 'Weber Chile (Saint-Gobain)';
  const clientLogo = project?.clientLogo;
  const authorName = manual.author || project?.author || 'HSBT · Saint-Gobain Weber Chile';
  const docVersion = manual.version || project?.version || '1.0';

  const dateObj = new Date(manual.updatedAt || manual.createdAt || Date.now());
  const dateFormatted =
    dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();

  const docChildren: (Paragraph | Table)[] = [];

  // =========================================================================
  // --- 1. PORTADA CORPORATIVA OFICIAL (PAGE 1) ---
  // =========================================================================
  if (onProgress) onProgress('Generando Portada Corporativa con Banner y Ficha Técnica...');

  // 1.1 Dual Corporate Logo Bar (Nuestro Logo + Logo del Cliente / HSBT)
  try {
    const ourLogoUrl = project?.organizationLogo || branding?.logo;
    const ourCompanyName = project?.organizationName || branding?.companyName;
    const ourSlogan = project?.organizationSlogan || branding?.companySlogan;
    const secondaryName = branding?.secondaryName;
    const secondarySlogan = branding?.secondarySlogan;
    const secondaryLogoUrl = branding?.secondaryLogo;

    const brandHeaderPng = await generateCorporateBrandHeaderPng({
      ourLogoUrl,
      ourCompanyName,
      ourSlogan,
      clientLogoUrl: clientLogo,
      clientName,
      secondaryLogoUrl,
      secondaryName,
      secondarySlogan,
    });
    if (brandHeaderPng) {
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 140 },
          children: [
            new ImageRun({
              type: 'png',
              data: brandHeaderPng,
              transformation: {
                width: 580,
                height: 155,
              },
            }),
          ],
        })
      );
    }
  } catch (err) {
    console.warn('Could not generate brand header png for docx:', err);
  }

  // 1.2 Large Corporate Navy Blue Banner (#183B6C)
  const bannerParagraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: 80, after: 60 },
      children: [
        new TextRun({
          text: 'MANUAL DE USUARIO SAP',
          bold: true,
          color: 'FFFFFF',
          size: 19,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: manual.title,
          bold: true,
          color: 'FFFFFF',
          size: 42, // 21pt
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text:
            manual.subtitle ||
            manual.overview ||
            'Procedimiento técnico y operativo paso a paso · Documentación estándar de procesos corporativos',
          italics: true,
          color: '93C5FD', // Light blue #93C5FD
          size: 21,
        }),
      ],
    }),
  ];

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: noBorders,
              shading: { fill: '183B6C' },
              margins: { top: 220, bottom: 220, left: 240, right: 240 },
              children: bannerParagraphs,
            }),
          ],
        }),
      ],
    })
  );

  docChildren.push(new Paragraph({ spacing: { after: 240 } }));

  // 1.3 Ficha Técnica de Control Documental (4-column Table)
  const metaRowsData: Array<[string, string, string, string]> = [
    ['Cliente', clientName, 'Documento', 'Manual de usuario SAP'],
    [
      'Proceso',
      manual.title.length > 34 ? `${manual.title.substring(0, 32)}...` : manual.title,
      'Módulos',
      'SD · MM',
    ],
    ['Org. ventas', '6100 – Solcrom', 'Sociedad', 'SGCL'],
    ['Versión', `v${docVersion}`, 'Fecha', dateFormatted],
    ['Elaborado por', authorName, 'Estado', 'Productivo / Aprobado'],
  ];

  const controlTableRows: TableRow[] = metaRowsData.map((row) => {
    return new TableRow({
      children: [
        // Col 1 (Header Label)
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          borders: tableBordersAll,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: row[0],
                  bold: true,
                  size: 17,
                  color: '334155',
                }),
              ],
            }),
          ],
        }),
        // Col 2 (Value)
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: 'FFFFFF' },
          borders: tableBordersAll,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: row[1],
                  size: 18,
                  color: '0F172A',
                }),
              ],
            }),
          ],
        }),
        // Col 3 (Header Label)
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          borders: tableBordersAll,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: row[2],
                  bold: true,
                  size: 17,
                  color: '334155',
                }),
              ],
            }),
          ],
        }),
        // Col 4 (Value)
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: 'FFFFFF' },
          borders: tableBordersAll,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: row[3],
                  size: 18,
                  color: '0F172A',
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: controlTableRows,
    })
  );

  // End of Page 1 -> Page Break
  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // =========================================================================
  // --- 2. ÍNDICE FORMAL DEL DOCUMENTO (PAGE 2) ---
  // =========================================================================
  if (onProgress) onProgress('Construyendo Índice Formal y Mapa de Procesos...');

  docChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 100, after: 60 },
      children: [
        new TextRun({
          text: 'ÍNDICE GENERAL DEL DOCUMENTO',
          bold: true,
          color: '183B6C',
          size: 30,
        }),
      ],
    })
  );

  // Subtitle underline
  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 12, color: '2563EB' },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [new Paragraph({})],
            }),
          ],
        }),
      ],
    })
  );

  docChildren.push(new Paragraph({ spacing: { after: 140 } }));

  const tocEntries = [
    { num: '1', title: 'INTRODUCCIÓN Y OBJETIVO GENERAL', page: 'Pág. 3' },
    { num: '1.1', title: 'Objetivo y Alcance Operativo', page: 'Pág. 3' },
    { num: '1.2', title: 'Escenarios Operativos Cubiertos (Entrega Directa vs Almacén)', page: 'Pág. 3' },
    { num: '1.3', title: 'Parámetros de Referencia y Datos Maestros SAP', page: 'Pág. 3' },
    { num: '2', title: 'MATRIZ DE FLUJO DEL PROCESO OPERATIVO', page: 'Pág. 4' },
    { num: '3', title: 'PROCEDIMIENTO DETALLADO PASO A PASO', page: 'Pág. 5' },
    ...manual.steps.map((st, sIdx) => ({
      num: `3.${sIdx + 1}`,
      title: `Paso ${sIdx + 1 < 10 ? '0' : ''}${sIdx + 1}: ${st.title} (${getActionTypeSpanish(st.actionType)})`,
      page: `Pág. ${5 + sIdx}`,
    })),
    { num: '4', title: 'RESOLUCIÓN DE PROBLEMAS Y ERRORES SAP', page: `Pág. ${5 + manual.steps.length}` },
    { num: '5', title: 'LISTA DE VERIFICACIÓN Y CONTROL DE CALIDAD', page: `Pág. ${5 + manual.steps.length}` },
  ];

  const tocRows: TableRow[] = tocEntries.map((item, idx) => {
    const isMajor = !item.num.includes('.');
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          borders: noBorders,
          margins: { top: 60, bottom: 60, left: 60, right: 60 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: item.num,
                  bold: isMajor,
                  size: isMajor ? 20 : 18,
                  color: isMajor ? '183B6C' : '475569',
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 76, type: WidthType.PERCENTAGE },
          borders: noBorders,
          margins: { top: 60, bottom: 60, left: 60, right: 60 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: item.title,
                  bold: isMajor,
                  size: isMajor ? 20 : 18,
                  color: isMajor ? '0F172A' : '334155',
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          borders: noBorders,
          margins: { top: 60, bottom: 60, left: 60, right: 60 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: item.page,
                  bold: isMajor,
                  size: 17,
                  color: '64748B',
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tocRows,
    })
  );

  // End of Page 2 -> Page Break
  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // =========================================================================
  // --- 3. SECCIÓN 1: INTRODUCCIÓN, ESCENARIOS & REFERENCIAS (PAGE 3) ---
  // =========================================================================
  if (onProgress) onProgress('Generando Sección 1: Introducción y Escenarios SAP...');

  docChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 80, after: 40 },
      children: [
        new TextRun({
          text: '1. INTRODUCCIÓN',
          bold: true,
          color: '183B6C',
          size: 28,
        }),
      ],
    })
  );

  // Section 1.1 Objetivo
  docChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 80, after: 60 },
      children: [
        new TextRun({
          text: '1.1 Objetivo y Alcance Operativo',
          bold: true,
          color: '183B6C',
          size: 22,
        }),
      ],
    })
  );

  const introText =
    manual.overview ||
    `El presente manual describe el procedimiento estándar en SAP para ${manual.title} en ${clientName}: una operativa que enlaza las transacciones comerciales, compras y almacenes garantizando total trazabilidad e integridad de los datos.`;

  docChildren.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: introText,
          size: 21,
          color: '334155',
        }),
      ],
    })
  );

  // Section 1.2 Escenarios Cubiertos
  docChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 100, after: 60 },
      children: [
        new TextRun({
          text: '1.2 Escenarios Operativos Cubiertos',
          bold: true,
          color: '183B6C',
          size: 22,
        }),
      ],
    })
  );

  docChildren.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: 'El proceso distingue los escenarios operativos según la modalidad de despacho y recepción en el sistema:',
          size: 20,
          color: '475569',
        }),
      ],
    })
  );

  // Scenarios Comparison Table
  const scenHeaders = [
    'Atributo',
    'Escenario A · Entrega directa al cliente',
    'Escenario B · Entrega en instalaciones Weber',
  ];
  const scenRowsData: Array<[string, string, string]> = [
    [
      'Flujo físico',
      'El proveedor despacha directamente al cliente final.',
      'El proveedor entrega en Weber; luego Weber despacha al cliente.',
    ],
    ['Grupo tipos posición', 'BANS – Posición terceros', 'BANC – Pedido individual'],
    ['Tipo de imputación', 'Según SolPed generada desde el pedido', 'M – IndivClte s/CO PdClt'],
    ['Inventario en Weber', 'No hay movimiento físico de stock en Weber.', 'Stock especial asignado al pedido de venta.'],
    ['Contabilización entrega', 'Confirmación de lo enviado por el proveedor.', 'Descuento real de inventario en almacén.'],
  ];

  const scenDocxRows: TableRow[] = [
    new TableRow({
      children: scenHeaders.map((h, hIdx) => {
        return new TableCell({
          width: { size: hIdx === 0 ? 26 : 37, type: WidthType.PERCENTAGE },
          shading: { fill: '183B6C' },
          borders: tableBordersAll,
          margins: { top: 90, bottom: 90, left: 100, right: 100 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: h,
                  bold: true,
                  size: 16,
                  color: 'FFFFFF',
                }),
              ],
            }),
          ],
        });
      }),
    }),
    ...scenRowsData.map((row, rIdx) => {
      const isEven = rIdx % 2 === 0;
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 26, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: row[0],
                    bold: true,
                    size: 17,
                    color: '334155',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 37, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: row[1],
                    size: 18,
                    color: '475569',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 37, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: row[2],
                    size: 18,
                    color: '475569',
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }),
  ];

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: scenDocxRows,
    })
  );

  docChildren.push(new Paragraph({ spacing: { after: 120 } }));

  // Section 1.3 Parámetros de Referencia SAP
  docChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 80, after: 60 },
      children: [
        new TextRun({
          text: '1.3 Parámetros de Referencia y Datos Maestros SAP',
          bold: true,
          color: '183B6C',
          size: 22,
        }),
      ],
    })
  );

  const paramRowsData = [
    ['Sociedad', 'SGCL', 'Canal de Distribución', '10 – Venta Directa'],
    ['Organización de Ventas', '6100 – Solcrom', 'Sector', '00 – General'],
    ['Moneda Base', 'CLP / USD', 'Punto de Expedición', '6101 – Almacén Central'],
  ];

  const paramTableRows: TableRow[] = paramRowsData.map((pRow) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          borders: tableBordersAll,
          margins: { top: 70, bottom: 70, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: pRow[0], bold: true, size: 17, color: '334155' })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: 'FFFFFF' },
          borders: tableBordersAll,
          margins: { top: 70, bottom: 70, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: pRow[1], size: 18, color: '0F172A' })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          borders: tableBordersAll,
          margins: { top: 70, bottom: 70, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: pRow[2], bold: true, size: 17, color: '334155' })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: 'FFFFFF' },
          borders: tableBordersAll,
          margins: { top: 70, bottom: 70, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: pRow[3], size: 18, color: '0F172A' })] })],
        }),
      ],
    });
  });

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: paramTableRows,
    })
  );

  // End of Page 3 -> Page Break
  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // =========================================================================
  // --- 4. SECCIÓN 2: MATRIZ DE FLUJO DEL PROCESO (PAGE 4) ---
  // =========================================================================
  if (onProgress) onProgress('Renderizando Matriz de Flujo del Proceso en Word...');

  docChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 80, after: 60 },
      children: [
        new TextRun({
          text: '2. MATRIZ DE FLUJO DEL PROCESO OPERATIVO',
          bold: true,
          color: '183B6C',
          size: 28,
        }),
      ],
    })
  );

  docChildren.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: 'A continuación se detalla la secuencia completa de transacciones, módulos y entregables involucrados en el flujo:',
          size: 20,
          color: '475569',
        }),
      ],
    })
  );

  const matrixHeaders = ['#', 'Paso Operativo', 'Transacción', 'Módulo', 'Acción / Campo Clave'];
  const matrixRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: { fill: '183B6C' },
          borders: tableBordersAll,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: '#', bold: true, size: 16, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: { fill: '183B6C' },
          borders: tableBordersAll,
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Paso Operativo', bold: true, size: 16, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: '183B6C' },
          borders: tableBordersAll,
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Transacción', bold: true, size: 16, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          shading: { fill: '183B6C' },
          borders: tableBordersAll,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Módulo', bold: true, size: 16, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: '183B6C' },
          borders: tableBordersAll,
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Acción / Campo', bold: true, size: 16, color: 'FFFFFF' })] })],
        }),
      ],
    }),
    ...manual.steps.map((st, sIdx) => {
      const isEven = sIdx % 2 === 0;
      const sapTx = st.sapTransaction || (manual.title.includes('SAP') ? 'SAP GUI' : 'Web/App');
      const sapMod = st.sapModule || 'SD · MM';

      return new TableRow({
        children: [
          new TableCell({
            width: { size: 8, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 70, bottom: 70, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${sIdx + 1}`,
                    bold: true,
                    size: 17,
                    color: '183B6C',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 70, bottom: 70, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: st.title,
                    bold: true,
                    size: 17,
                    color: '0F172A',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 70, bottom: 70, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: sapTx,
                    bold: true,
                    size: 16,
                    color: '183B6C',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 14, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 70, bottom: 70, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: sapMod,
                    size: 16,
                    color: '475569',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 70, bottom: 70, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${getActionTypeSpanish(st.actionType)}${st.targetElement ? `: ${st.targetElement}` : ''}`,
                    size: 16,
                    color: '64748B',
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }),
  ];

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: matrixRows,
    })
  );

  // End of Page 4 -> Page Break
  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // =========================================================================
  // --- 5. SECCIÓN 3: PROCEDIMIENTO DETALLADO PASO A PASO (1 PASO = 1 PÁGINA) ---
  // =========================================================================
  for (let i = 0; i < manual.steps.length; i++) {
    const step = manual.steps[i];
    if (onProgress) {
      onProgress(`Maquetando Paso ${i + 1} de ${manual.steps.length} con franja oficial SAP...`);
    }

    if (i > 0) {
      // 1 Page per Step for 100% cohesion between instructions and screenshot
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    const sapTx = step.sapTransaction || (manual.title.includes('SAP') ? 'ME22N / MIRO / SAP GUI' : 'SISTEMA');
    const sapMod = step.sapModule || 'SD · MM';

    // Step Navy Blue Header Box (#183B6C)
    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: noBorders,
                shading: { fill: '183B6C' },
                margins: { top: 140, bottom: 140, left: 180, right: 180 },
                children: [
                  new Paragraph({
                    spacing: { after: 40 },
                    children: [
                      new TextRun({
                        text: `PASO ${i + 1 < 10 ? '0' : ''}${i + 1} DE ${manual.steps.length < 10 ? '0' : ''}${manual.steps.length}   ·   TRANSACCIÓN: ${sapTx}   ·   MÓDULO: ${sapMod}`,
                        bold: true,
                        color: '93C5FD', // light blue
                        size: 17,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: step.title,
                        bold: true,
                        color: 'FFFFFF',
                        size: 30, // 15pt
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    docChildren.push(new Paragraph({ spacing: { after: 80 } }));

    // Metadata Strip (Acción, Campo, Tiempo)
    const actionStripCells: TableCell[] = [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9' },
        borders: tableBordersAll,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'ACCIÓN: ', bold: true, size: 16, color: '183B6C' }),
              new TextRun({ text: getActionTypeSpanish(step.actionType), bold: true, size: 16, color: '0F172A' }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9' },
        borders: tableBordersAll,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'CAMPO / ELEM: ', bold: true, size: 16, color: '183B6C' }),
              new TextRun({ text: step.targetElement || 'Pantalla principal', size: 16, color: '334155' }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9' },
        borders: tableBordersAll,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'TIEMPO: ', bold: true, size: 16, color: '183B6C' }),
              new TextRun({ text: '~30 seg', size: 16, color: '334155' }),
            ],
          }),
        ],
      }),
    ];

    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: actionStripCells })],
      })
    );

    docChildren.push(new Paragraph({ spacing: { after: 100 } }));

    // Detailed Step Description
    docChildren.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: step.description,
            size: 21,
            color: '1E293B',
          }),
        ],
      })
    );

    // Callout: Expected Result
    if (step.expectedResult) {
      docChildren.push(
        createDocxCallout(
          '✓ RESULTADO ESPERADO EN EL SISTEMA',
          step.expectedResult,
          '2563EB', // blue
          'EFF6FF',
          '1D4ED8'
        )
      );
      docChildren.push(new Paragraph({ spacing: { after: 80 } }));
    }

    // Callout: Tip
    if (step.tip) {
      docChildren.push(
        createDocxCallout(
          '✦ CONSEJO DE EXPERTO SAP',
          step.tip,
          '10B981', // emerald
          'ECFDF5',
          '047857'
        )
      );
      docChildren.push(new Paragraph({ spacing: { after: 80 } }));
    }

    // Callout: Warning
    if (step.warning) {
      docChildren.push(
        createDocxCallout(
          '⚠ PRECAUCIÓN / ATENCIÓN SAP',
          step.warning,
          'F59E0B', // amber
          'FFFBEB',
          'B45309'
        )
      );
      docChildren.push(new Paragraph({ spacing: { after: 80 } }));
    }

    // Callout: Instructor live audio quote (Teams)
    const docxAudioQuote = step.instructorAudioQuote
      ? `"${step.instructorAudioQuote}"${step.instructorNotes && step.instructorNotes !== step.instructorAudioQuote ? ` — ${step.instructorNotes}` : ''}`
      : (step.instructorNotes || '');

    if (docxAudioQuote) {
      docChildren.push(
        createDocxCallout(
          '🎙 EXPLICACIÓN DEL INSTRUCTOR (AUDIO EN VIVO · MS TEAMS)',
          docxAudioQuote,
          '9333EA', // purple
          'FAF5FF',
          '7E22CE'
        )
      );
      docChildren.push(new Paragraph({ spacing: { after: 80 } }));
    }

    // Centered Framed Screenshot with Visual Annotations
    if (step.image) {
      try {
        const { dataUrl, width: imgW, height: imgH } = await renderAnnotatedScreenshotForPdf(
          step.image,
          step.annotations
        );

        const imgBytes = dataUrlToUint8Array(dataUrl);
        const wordImgW = 550;
        const aspect = imgH && imgW ? imgH / imgW : 0.5625;
        const wordImgH = Math.min(340, Math.round(wordImgW * aspect));

        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                    },
                    shading: { fill: 'FAFAFA' },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
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
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );

        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 50, after: 120 },
            children: [
              new TextRun({
                text: `Figura ${i + 1}: Captura del sistema para "${step.title}" con indicadores visuales y guía interactiva.`,
                italics: true,
                size: 16,
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

  // =========================================================================
  // --- 6. SECCIÓN 4: RESOLUCIÓN DE PROBLEMAS Y ERRORES SAP ---
  // =========================================================================
  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  docChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 80, after: 60 },
      children: [
        new TextRun({
          text: '4. RESOLUCIÓN DE PROBLEMAS Y ERRORES SAP',
          bold: true,
          color: '183B6C',
          size: 28,
        }),
      ],
    })
  );

  docChildren.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: 'Guía de contingencia y soluciones recomendadas ante incidencias o bloqueos en las transacciones:',
          size: 20,
          color: '475569',
        }),
      ],
    })
  );

  const troubleshootingList =
    manual.troubleshooting && manual.troubleshooting.length > 0
      ? manual.troubleshooting
      : [
          {
            problem: 'Error en determinación de precio o condición obligatoria faltante',
            solution: 'Verificar en la pestaña de Condiciones del pedido (VK11/ME22N) que el esquema de cálculo contenga el precio base y recargos.',
          },
          {
            problem: 'Bloqueo por verificación de crédito en entrega (VKM3)',
            solution: 'Notificar al área de Crédito y Cobranzas para liberar el documento de venta en caso de superación del límite asignado.',
          },
          {
            problem: 'Material sin lote asignado o stock insuficiente en centro',
            solution: 'Corroborar en la MMBE la disponibilidad física de stock en el centro 6100 o solicitar reposición de almacén.',
          },
        ];

  const faqTableRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          shading: { fill: '183B6C' },
          borders: tableBordersAll,
          margins: { top: 90, bottom: 90, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: 'PROBLEMA O SÍNTOMA EN SAP', bold: true, size: 16, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 65, type: WidthType.PERCENTAGE },
          shading: { fill: '183B6C' },
          borders: tableBordersAll,
          margins: { top: 90, bottom: 90, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: 'SOLUCIÓN OPERATIVA RECOMENDADA', bold: true, size: 16, color: 'FFFFFF' })] })],
        }),
      ],
    }),
    ...troubleshootingList.map((item, idx) => {
      const isEven = idx % 2 === 0;
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: item.problem,
                    bold: true,
                    size: 17,
                    color: 'B45309', // amber dark
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: item.solution,
                    size: 18,
                    color: '1E293B',
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }),
  ];

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: faqTableRows,
    })
  );

  docChildren.push(new Paragraph({ spacing: { after: 160 } }));

  // =========================================================================
  // --- 7. SECCIÓN 5: LISTA DE VERIFICACIÓN FINAL (CHECKLIST) ---
  // =========================================================================
  docChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 100, after: 60 },
      children: [
        new TextRun({
          text: '5. LISTA DE VERIFICACIÓN Y CONTROL DE CALIDAD',
          bold: true,
          color: '183B6C',
          size: 28,
        }),
      ],
    })
  );

  const checklistItems =
    manual.summaryChecklist && manual.summaryChecklist.length > 0
      ? manual.summaryChecklist
      : [
          'Verificar que el cliente cuente con código activo y sin bloqueos comerciales en SGCL.',
          'Comprobar que las posiciones del pedido contengan el centro expedidor 6100 y almacén asignado.',
          'Validar que la entrega de salida refleje el número de documento generado correctamente.',
          'Confirmar que la contabilización de mercancías actualice el estatus del flujo de documentos.',
          'Archivar la documentación física y electrónica según el estándar de auditoría interna de Weber.',
        ];

  checklistItems.forEach((chk) => {
    docChildren.push(
      new Paragraph({
        spacing: { after: 70 },
        children: [
          new TextRun({ text: '☐  ', bold: true, size: 22, color: '183B6C' }),
          new TextRun({ text: chk, size: 20, color: '1E293B' }),
        ],
      })
    );
  });

  // =========================================================================
  // --- BUILD WORD DOCUMENT WITH CORPORATE HEADERS & FOOTERS ---
  // =========================================================================
  if (onProgress) onProgress('Compilando encabezados y pie de página corporativos...');

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
            color: '1E293B',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch (72pt * 20 dxa = 1440)
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 65, type: WidthType.PERCENTAGE },
                        borders: {
                          top: { style: BorderStyle.NONE },
                          left: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE },
                          bottom: { style: BorderStyle.SINGLE, size: 6, color: '183B6C' },
                        },
                        margins: { bottom: 60 },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `${clientName.toUpperCase()}   ·   ${manual.title.substring(0, 36).toUpperCase()}`,
                                size: 15,
                                bold: true,
                                color: '183B6C',
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 35, type: WidthType.PERCENTAGE },
                        borders: {
                          top: { style: BorderStyle.NONE },
                          left: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE },
                          bottom: { style: BorderStyle.SINGLE, size: 6, color: '183B6C' },
                        },
                        margins: { bottom: 60 },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                text: 'MANUAL DE USUARIO SAP',
                                size: 15,
                                bold: true,
                                color: '64748B',
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 65, type: WidthType.PERCENTAGE },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                          left: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE },
                          bottom: { style: BorderStyle.NONE },
                        },
                        margins: { top: 60 },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `Documentación Oficial y Confidencial · ${clientName}`,
                                size: 15,
                                color: '94A3B8',
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 35, type: WidthType.PERCENTAGE },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                          left: { style: BorderStyle.NONE },
                          right: { style: BorderStyle.NONE },
                          bottom: { style: BorderStyle.NONE },
                        },
                        margins: { top: 60 },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                text: 'Página ',
                                size: 15,
                                color: '64748B',
                              }),
                              new TextRun({
                                children: [PageNumber.CURRENT],
                                size: 15,
                                bold: true,
                                color: '183B6C',
                              }),
                              new TextRun({
                                text: ' de ',
                                size: 15,
                                color: '64748B',
                              }),
                              new TextRun({
                                children: [PageNumber.TOTAL_PAGES],
                                size: 15,
                                bold: true,
                                color: '183B6C',
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
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
 * Generates and downloads a unified Project Solution Dossier in Microsoft Word (.docx)
 * compiling all user manuals in the project with a master cover, executive summary,
 * cross-process matrix, detailed step-by-step documentation, and consolidated quality control.
 */
export async function exportProjectDossierDocx(
  project: Project,
  manuals: UserManual[],
  onProgress?: (msg: string) => void,
  branding?: OrganizationBranding
): Promise<void> {
  if (onProgress) onProgress(`Iniciando Dossier Word para "${project.name}" (${manuals.length} manuales)...`);

  const clientName = project.clientName || 'Weber Chile (Saint-Gobain)';
  const dateObj = new Date(project.updatedAt || project.createdAt || Date.now());
  const dateFormatted = dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();

  const docChildren: (Paragraph | Table)[] = [];

  // Master Brand Header (Nuestro Logo + Logo del Cliente / HSBT)
  const ourLogoUrl = project.organizationLogo || branding?.logo;
  const ourCompanyName = project.organizationName || branding?.companyName;
  const ourSlogan = project.organizationSlogan || branding?.companySlogan;
  const secondaryName = branding?.secondaryName;
  const secondarySlogan = branding?.secondarySlogan;
  const secondaryLogoUrl = branding?.secondaryLogo;

  const brandHeaderPng = await generateCorporateBrandHeaderPng({
    ourLogoUrl,
    ourCompanyName,
    ourSlogan,
    clientLogoUrl: project.clientLogo,
    clientName,
    secondaryLogoUrl,
    secondaryName,
    secondarySlogan,
  });
  if (brandHeaderPng) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 140 },
        children: [
          new ImageRun({
            type: 'png',
            data: brandHeaderPng,
            transformation: { width: 580, height: 155 },
          }),
        ],
      })
    );
  }

  // Master Banner
  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: noBorders,
              shading: { fill: '183B6C' },
              margins: { top: 240, bottom: 240, left: 240, right: 240 },
              children: [
                new Paragraph({
                  spacing: { after: 60 },
                  children: [
                    new TextRun({
                      text: `DOSSIER TÉCNICO DE SOLUCIÓN · PROYECTO: ${project.code || 'PRJ-CORP'}`,
                      bold: true,
                      color: 'FFFFFF',
                      size: 19,
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { after: 80 },
                  children: [
                    new TextRun({
                      text: project.name,
                      bold: true,
                      color: 'FFFFFF',
                      size: 42,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text:
                        project.description ||
                        'Compendio maestro de manuales de procedimientos técnicos y operativos de la solución.',
                      italics: true,
                      color: '93C5FD',
                      size: 21,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  docChildren.push(new Paragraph({ spacing: { after: 240 } }));

  // Master Project Control Table
  const projectControlRows: TableRow[] = [
    ['Cliente', clientName, 'Código Proyecto', project.code || 'PRJ-SAP'],
    ['Proyecto', project.name, 'Manuales Incluidos', `${manuals.length} Procedimientos`],
    ['Versión', `v${project.version || '1.0'}`, 'Fecha Emisión', dateFormatted],
    ['Elaborado por', project.author || 'Equipo de Proyecto', 'Estado', project.status || 'Productivo'],
  ].map((row) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 22, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          borders: tableBordersAll,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: row[0], bold: true, size: 17, color: '334155' })] })],
        }),
        new TableCell({
          width: { size: 28, type: WidthType.PERCENTAGE },
          shading: { fill: 'FFFFFF' },
          borders: tableBordersAll,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: row[1], size: 18, color: '0F172A' })] })],
        }),
        new TableCell({
          width: { size: 22, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          borders: tableBordersAll,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: row[2], bold: true, size: 17, color: '334155' })] })],
        }),
        new TableCell({
          width: { size: 28, type: WidthType.PERCENTAGE },
          shading: { fill: 'FFFFFF' },
          borders: tableBordersAll,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: row[3], size: 18, color: '0F172A' })] })],
        }),
      ],
    });
  });

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: projectControlRows,
    })
  );

  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // Master Table of Manuals
  docChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 80, after: 60 },
      children: [
        new TextRun({
          text: 'COMPENDIO DE MANUALES Y PROCEDIMIENTOS INCLUIDOS',
          bold: true,
          color: '183B6C',
          size: 28,
        }),
      ],
    })
  );

  const manualsTableRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: '183B6C' },
          borders: tableBordersAll,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: 'MANUAL', bold: true, size: 16, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          shading: { fill: '183B6C' },
          borders: tableBordersAll,
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Título del Procedimiento', bold: true, size: 16, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: '183B6C' },
          borders: tableBordersAll,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Pasos', bold: true, size: 16, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: '183B6C' },
          borders: tableBordersAll,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Duración', bold: true, size: 16, color: 'FFFFFF' })] })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: '183B6C' },
          borders: tableBordersAll,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Versión', bold: true, size: 16, color: 'FFFFFF' })] })],
        }),
      ],
    }),
    ...manuals.map((man, mIdx) => {
      const isEven = mIdx % 2 === 0;
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 70, bottom: 70, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: `#${mIdx + 1}`, bold: true, size: 17, color: '183B6C' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 70, bottom: 70, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: man.title, bold: true, size: 17, color: '0F172A' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 70, bottom: 70, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: `${man.steps.length} pasos`, size: 17, color: '475569' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 70, bottom: 70, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: `${man.estimatedMinutes || 10} min`, size: 17, color: '475569' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: isEven ? 'F8FAFC' : 'FFFFFF' },
            borders: tableBordersAll,
            margins: { top: 70, bottom: 70, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: `v${man.version || '1.0'}`, size: 17, color: '475569' })],
              }),
            ],
          }),
        ],
      });
    }),
  ];

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: manualsTableRows,
    })
  );

  // Append each manual's complete documentation
  for (let m = 0; m < manuals.length; m++) {
    const manual = manuals[m];
    docChildren.push(new Paragraph({ children: [new PageBreak()] }));

    // Manual Section Divider Banner
    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: noBorders,
                shading: { fill: '183B6C' },
                margins: { top: 160, bottom: 160, left: 200, right: 200 },
                children: [
                  new Paragraph({
                    spacing: { after: 40 },
                    children: [
                      new TextRun({
                        text: `MANUAL ${m + 1} DE ${manuals.length}   ·   ${clientName.toUpperCase()}`,
                        bold: true,
                        color: '93C5FD',
                        size: 17,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: manual.title,
                        bold: true,
                        color: 'FFFFFF',
                        size: 34,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    docChildren.push(new Paragraph({ spacing: { after: 120 } }));

    if (manual.overview) {
      docChildren.push(
        createDocxCallout('📋 OBJETIVO DEL PROCEDIMIENTO', manual.overview, '183B6C', 'F8FAFC', '183B6C')
      );
      docChildren.push(new Paragraph({ spacing: { after: 120 } }));
    }

    // Steps of manual
    for (let s = 0; s < manual.steps.length; s++) {
      const step = manual.steps[s];
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));

      const sapTx = step.sapTransaction || (manual.title.includes('SAP') ? 'SAP GUI' : 'SISTEMA');

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  shading: { fill: '183B6C' },
                  margins: { top: 120, bottom: 120, left: 160, right: 160 },
                  children: [
                    new Paragraph({
                      spacing: { after: 40 },
                      children: [
                        new TextRun({
                          text: `PASO ${s + 1} DE ${manual.steps.length}   ·   TRANSACCIÓN: ${sapTx}`,
                          bold: true,
                          color: '93C5FD',
                          size: 16,
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: step.title,
                          bold: true,
                          color: 'FFFFFF',
                          size: 28,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );

      docChildren.push(new Paragraph({ spacing: { after: 80 } }));

      docChildren.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: step.description, size: 21, color: '1E293B' })],
        })
      );

      if (step.expectedResult) {
        docChildren.push(createDocxCallout('✓ RESULTADO ESPERADO', step.expectedResult, '2563EB', 'EFF6FF', '1D4ED8'));
        docChildren.push(new Paragraph({ spacing: { after: 80 } }));
      }

      if (step.tip) {
        docChildren.push(createDocxCallout('✦ CONSEJO SAP', step.tip, '10B981', 'ECFDF5', '047857'));
        docChildren.push(new Paragraph({ spacing: { after: 80 } }));
      }

      if (step.image) {
        try {
          const { dataUrl, width: imgW, height: imgH } = await renderAnnotatedScreenshotForPdf(
            step.image,
            step.annotations
          );
          const imgBytes = dataUrlToUint8Array(dataUrl);
          const wordImgW = 550;
          const aspect = imgH && imgW ? imgH / imgW : 0.5625;
          const wordImgH = Math.min(340, Math.round(wordImgW * aspect));

          docChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 40 },
              children: [
                new ImageRun({
                  type: 'png',
                  data: imgBytes,
                  transformation: { width: wordImgW, height: wordImgH },
                }),
              ],
            })
          );
        } catch (err) {
          console.warn('Failed to embed dossier step image in Word:', err);
        }
      }
    }
  }

  // Create unified Dossier Document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: '1E293B' },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${clientName.toUpperCase()}   ·   DOSSIER DE PROYECTO: ${project.name.toUpperCase()}`,
                    size: 15,
                    bold: true,
                    color: '183B6C',
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
                    text: `Documento Confidencial · ${clientName}   |   Página `,
                    size: 15,
                    color: '64748B',
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 15, bold: true, color: '183B6C' }),
                  new TextRun({ text: ' de ', size: 15, color: '64748B' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 15, bold: true, color: '183B6C' }),
                ],
              }),
            ],
          }),
        },
        children: docChildren,
      },
    ],
  });

  if (onProgress) onProgress('Finalizando y descargando Dossier Word (.docx)...');

  const blob = await Packer.toBlob(doc);
  const safeName = `${project.clientName || 'cliente'}-${project.name || 'proyecto'}-dossier`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
