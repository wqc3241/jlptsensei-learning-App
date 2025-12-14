export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export enum ContentType {
  GRAMMAR = 'GRAMMAR',
  VOCABULARY = 'VOCABULARY',
}

export interface GrammarPoint {
  id: string;
  pattern: string;
  meaning: string;
  romaji: string;
  formation?: string;
  explanation?: string;
  // Used in Game Mode (single example)
  example?: {
    japanese: string;
    romaji: string;
    english: string;
  };
}

export interface GrammarDetail extends GrammarPoint {
  formation: string;
  explanation: string;
  // Used in Reference Mode (multiple examples)
  examples: {
    japanese: string;
    romaji: string;
    english: string;
  }[];
  synonyms?: string[];
  relatedGrammar?: string[];
}

export interface VocabularyItem {
  id: string;
  kanji: string;
  kana: string;
  meaning: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface UnitContent {
  id: string;
  title: string;
  description: string;
  grammar: GrammarPoint[];
  vocabulary: VocabularyItem[];
  quiz: QuizQuestion[];
}

export type UnitStatus = 'LOCKED' | 'ACTIVE' | 'COMPLETED';

// --- Exercise Types ---

export type ExerciseMode = 'MENU' | 'SCENARIO' | 'FLASHCARDS' | 'SENTENCES';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  audioData?: string; // Base64 audio
}

export interface FlashcardData {
  id: string;
  kanji: string;
  kana: string;
  meaning: string;
  imagePrompt: string;
  imageUrl?: string; // Base64 image
}

export interface PracticeSentenceData {
  id: string;
  japanese: string;
  romaji: string;
  english: string;
  grammarPoint: string;
}
