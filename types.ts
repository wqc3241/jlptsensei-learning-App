export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export enum ContentType {
  GRAMMAR = 'GRAMMAR',
  VOCABULARY = 'VOCABULARY',
}

export interface GrammarPoint {
  id: string;
  pattern: string; // The grammar point itself (e.g., ～ています)
  meaning: string;
  romaji: string;
  level: JLPTLevel;
}

export interface ExampleSentence {
  japanese: string;
  romaji: string;
  english: string;
}

export interface GrammarDetail extends GrammarPoint {
  formation: string; // Usage rules (e.g., Verb-TE form + imasu)
  explanation: string;
  examples: ExampleSentence[];
  synonyms?: string[];
  relatedGrammar?: string[];
}

export interface VocabularyItem {
  id: string;
  kanji: string;
  kana: string;
  meaning: string;
  level: JLPTLevel;
}
