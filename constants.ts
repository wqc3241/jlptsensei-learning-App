import { JLPTLevel } from './types';

export const LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const LEVEL_COLORS: Record<JLPTLevel, { base: string; bg: string; text: string; border: string; accent: string }> = {
  N5: { base: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', accent: 'bg-blue-500' },
  N4: { base: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', accent: 'bg-emerald-500' },
  N3: { base: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', accent: 'bg-amber-500' },
  N2: { base: 'orange', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', accent: 'bg-orange-500' },
  N1: { base: 'rose', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', accent: 'bg-rose-500' },
};

export const LEVEL_DESCRIPTIONS: Record<JLPTLevel, string> = {
  N5: "Basic Japanese. Understanding basic sentences and typical daily expressions.",
  N4: "Elementary. Understanding basic Japanese in daily life contexts.",
  N3: "Intermediate. Understanding Japanese used in everyday situations.",
  N2: "Pre-Advanced. Understanding Japanese in specialized contexts.",
  N1: "Advanced. Understanding Japanese in complex circumstances."
};

// Simplified themes to guide the generative AI
export const UNIT_THEMES = [
  "Introductions & Greetings",
  "Daily Routine",
  "Shopping & Prices",
  "Time & Dates",
  "Travel & Directions",
  "Food & Dining",
  "Family & Friends",
  "School & Study",
  "Work & Office",
  "Health & Body",
  "Hobbies & Interests",
  "Weather & Seasons",
  "Feelings & Emotions",
  "Nature & Environment",
  "News & Society"
];

export const TOTAL_UNITS_PER_LEVEL = 15;
