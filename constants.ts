import { JLPTLevel } from './types';

export const LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const LEVEL_COLORS: Record<JLPTLevel, { base: string; bg: string; text: string; border: string }> = {
  N5: { base: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  N4: { base: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  N3: { base: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  N2: { base: 'orange', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  N1: { base: 'rose', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
};

export const LEVEL_DESCRIPTIONS: Record<JLPTLevel, string> = {
  N5: "Basic Japanese. Understanding basic sentences and typical daily expressions.",
  N4: "Elementary. Understanding basic Japanese in daily life contexts.",
  N3: "Intermediate. Understanding Japanese used in everyday situations to a certain degree.",
  N2: "Pre-Advanced. Understanding Japanese used in everyday situations and specialized contexts.",
  N1: "Advanced. Understanding Japanese used in a variety of complex circumstances."
};
