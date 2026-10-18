import { UserManual, ManualStep } from '../types/manual';
import { Project } from '../types/project';

/**
 * Utility to identify SAP context and manage SAP Transaction and Module attributes.
 *
 * Rule requirement:
 * "Adicionar el módulo de SAP para presentarlo en esta página y dejarlo como primera columna.
 * Si estamos en la transacción ZMMT0020, no es necesario que se muestre esa columna."
 */

export function isSapManual(manual: UserManual, project?: Project): boolean {
  if (!manual) return false;
  const inTitle = (manual.title || '').toUpperCase().includes('SAP');
  const inSubtitle = (manual.subtitle || '').toUpperCase().includes('SAP');
  const inOverview = (manual.overview || '').toUpperCase().includes('SAP');
  const inCat = (manual.category || '').toUpperCase().includes('SAP');
  const inProjCat = (project?.category || '').toUpperCase().includes('SAP');
  const hasStepSap = (manual.steps || []).some(
    (s) => Boolean(s.sapTransaction) || Boolean(s.sapModule) || (s.title || '').toUpperCase().includes('ZMMT')
  );

  return inTitle || inSubtitle || inOverview || inCat || inProjCat || hasStepSap;
}

export function detectSapTransactionCode(manual: UserManual, step?: ManualStep): string {
  if (step?.sapTransaction && step.sapTransaction.trim()) {
    return step.sapTransaction.trim().toUpperCase();
  }

  // Check other steps
  const anyTx = (manual.steps || []).find((s) => s.sapTransaction && s.sapTransaction.trim());
  if (anyTx?.sapTransaction) {
    return anyTx.sapTransaction.trim().toUpperCase();
  }

  // Check text in step
  if (step) {
    const stepText = `${step.title || ''} ${step.description || ''} ${step.targetElement || ''}`;
    const stepMatch = stepText.match(/\b(ZMMT\d{4}|Z[A-Z0-9_]{3,8}|ME\d{2}[A-Z]?|VA\d{2}|MIRO|MIGO|FB\d{2}|MM\d{2})\b/i);
    if (stepMatch) return stepMatch[1].toUpperCase();
  }

  // Check text in manual
  const fullText = `${manual.title || ''} ${manual.subtitle || ''} ${manual.overview || ''} ${(manual.prerequisites || []).join(' ')}`;
  const mMatch = fullText.match(/\b(ZMMT\d{4}|Z[A-Z0-9_]{3,8}|ME\d{2}[A-Z]?|VA\d{2}|MIRO|MIGO|FB\d{2}|MM\d{2})\b/i);
  if (mMatch) return mMatch[1].toUpperCase();

  return 'ZMMT0033';
}

export function detectSapModuleCode(manual: UserManual, step?: ManualStep, txCode?: string): string {
  if (step?.sapModule && step.sapModule.trim()) {
    return step.sapModule.trim().toUpperCase();
  }

  const anyMod = (manual.steps || []).find((s) => s.sapModule && s.sapModule.trim());
  if (anyMod?.sapModule) {
    return anyMod.sapModule.trim().toUpperCase();
  }

  const tx = (txCode || detectSapTransactionCode(manual, step)).toUpperCase();
  if (tx.startsWith('ZMM') || tx.startsWith('ME') || tx.startsWith('MIGO') || tx.includes('COMEX') || tx.includes('COMPRA')) {
    return 'MM';
  }
  if (tx.startsWith('ZSD') || tx.startsWith('VA') || tx.startsWith('VF') || tx.includes('VENTA')) {
    return 'SD';
  }
  if (tx.startsWith('ZFI') || tx.startsWith('FB') || tx.startsWith('FS') || tx.includes('FINAN') || tx.includes('CONTAB')) {
    return 'FI';
  }
  if (tx.startsWith('ZCO') || tx.includes('COSTO')) {
    return 'CO';
  }
  if (tx.startsWith('ZPP')) {
    return 'PP';
  }
  if (tx.startsWith('ZPM')) {
    return 'PM';
  }

  return 'MM';
}

/**
 * Checks whether the manual or transaction corresponds to ZMMT0020.
 * In this transaction, displaying the SAP Module column is NOT required.
 */
export function isZMMT0020Transaction(manual: UserManual, explicitTx?: string): boolean {
  if (explicitTx && explicitTx.toUpperCase().includes('ZMMT0020')) {
    return true;
  }
  if (!manual) return false;

  const currentCode = (manual.code || '').toUpperCase();
  const title = (manual.title || '').toUpperCase();
  const subtitle = (manual.subtitle || '').toUpperCase();
  const overview = (manual.overview || '').toUpperCase();

  if (
    currentCode.includes('ZMMT0020') ||
    title.includes('ZMMT0020') ||
    subtitle.includes('ZMMT0020') ||
    overview.includes('ZMMT0020')
  ) {
    return true;
  }

  // Check if all or majority of steps have ZMMT0020
  const stepsWithTx = (manual.steps || []).filter((s) => s.sapTransaction);
  if (stepsWithTx.length > 0 && stepsWithTx.every((s) => (s.sapTransaction || '').toUpperCase().includes('ZMMT0020'))) {
    return true;
  }

  return false;
}
