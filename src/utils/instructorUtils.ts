import { ManualStep } from '../types/manual';

/**
 * Normalizes text by removing punctuation, extra spaces and accents for reliable comparison.
 */
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()"'«»“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determines whether an instructor note or quote is redundant with the step's detailed description.
 * Rules:
 * 1. If empty or whitespace only -> redundant (don't display).
 * 2. If already included or identical to the detailed description -> redundant (user rule: "Si la información de la explicación del instructor ya está en la descripción detallada, no es necesario ponerlo").
 * 3. The instructor explanation should contain arguments, reasoning, practical examples or business tips, not merely the physical action already described.
 */
export function isInstructorExplanationRedundant(
  instructorText?: string | null,
  description?: string | null
): boolean {
  if (!instructorText || !instructorText.trim()) return true;
  if (!description || !description.trim()) return false;

  const normInst = normalizeForComparison(instructorText);
  const normDesc = normalizeForComparison(description);

  if (!normInst) return true;
  if (!normDesc) return false;

  // Exact match or mutual substring containment
  if (normDesc === normInst) return true;
  if (normDesc.includes(normInst)) return true;
  if (normInst.includes(normDesc)) return true;

  // Check word overlap ratio: if over 75% of instructor words already appear in the description
  const instWords = normInst.split(' ').filter((w) => w.length > 3);
  if (instWords.length > 0) {
    const descWordsSet = new Set(normDesc.split(' '));
    const matchingCount = instWords.filter((w) => descWordsSet.has(w)).length;
    const ratio = matchingCount / instWords.length;
    if (ratio >= 0.8) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluates a step and returns the effective, non-redundant instructor audio quote and notes.
 * If the information is already in the detailed description, it filters it out so it won't be displayed.
 */
export function getEffectiveInstructorContent(step: Partial<ManualStep>): {
  quote: string;
  notes: string;
  shouldShow: boolean;
} {
  const rawQuote = (step.instructorAudioQuote || '').trim();
  const rawNotes = (step.instructorNotes || '').trim();
  const desc = step.description || '';

  const quoteIsRedundant = isInstructorExplanationRedundant(rawQuote, desc);
  const notesIsRedundant = isInstructorExplanationRedundant(rawNotes, desc);

  const cleanQuote = quoteIsRedundant ? '' : rawQuote;
  let cleanNotes = notesIsRedundant ? '' : rawNotes;

  // If notes and quote are identical, avoid displaying them twice
  if (cleanNotes && cleanQuote && normalizeForComparison(cleanNotes) === normalizeForComparison(cleanQuote)) {
    cleanNotes = '';
  }

  const shouldShow = Boolean(cleanQuote || cleanNotes);

  return {
    quote: cleanQuote,
    notes: cleanNotes,
    shouldShow,
  };
}
