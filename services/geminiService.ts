import { GoogleGenAI, Type, Schema } from "@google/genai";
import { JLPTLevel, GrammarPoint, GrammarDetail, VocabularyItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = 'gemini-2.5-flash';

// --- Schemas ---

const grammarListSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      pattern: { type: Type.STRING, description: "The grammar point in Japanese (e.g., ～てはいけません)" },
      meaning: { type: Type.STRING, description: "Concise English meaning" },
      romaji: { type: Type.STRING, description: "Romaji reading of the pattern" }
    },
    required: ["pattern", "meaning", "romaji"]
  }
};

const grammarDetailSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    pattern: { type: Type.STRING },
    meaning: { type: Type.STRING },
    romaji: { type: Type.STRING },
    formation: { type: Type.STRING, description: "How to form this grammar (e.g. Verb-Te form + ...)" },
    explanation: { type: Type.STRING, description: "Detailed explanation of usage and nuance." },
    examples: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          japanese: { type: Type.STRING },
          romaji: { type: Type.STRING },
          english: { type: Type.STRING }
        },
        required: ["japanese", "romaji", "english"]
      }
    },
    synonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["pattern", "meaning", "romaji", "formation", "explanation", "examples"]
};

const vocabularyListSchema: Schema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            kanji: { type: Type.STRING, description: "The word in Kanji/Kana" },
            kana: { type: Type.STRING, description: "The reading in Hiragana/Katakana" },
            meaning: { type: Type.STRING, description: "English definition" }
        },
        required: ["kanji", "kana", "meaning"]
    }
}

// --- API Calls ---

export const fetchGrammarList = async (level: JLPTLevel, offset: number = 0): Promise<GrammarPoint[]> => {
  const prompt = `
    Act as a JLPT expert like 'JLPT Sensei'.
    List 15 distinct and popular JLPT ${level} grammar points.
    Do not repeat points.
    Return only the JSON array.
    This is batch #${Math.floor(offset / 15) + 1} of points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: grammarListSchema,
        temperature: 0.3 // Low temperature for factual consistency
      }
    });

    const rawData = JSON.parse(response.text || "[]");
    
    // Enrich with IDs and level
    return rawData.map((item: any, index: number) => ({
      ...item,
      id: `${level}-gram-${offset + index}`,
      level
    }));
  } catch (error) {
    console.error("Failed to fetch grammar list:", error);
    return [];
  }
};

export const fetchGrammarDetail = async (pattern: string, level: JLPTLevel): Promise<GrammarDetail | null> => {
  const prompt = `
    Act as a Japanese teacher. Provide a detailed lesson for the JLPT ${level} grammar point: "${pattern}".
    Include formation rules, clear explanation, 3 native-sounding example sentences, and synonyms if any.
    Return strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: grammarDetailSchema
      }
    });

    const rawData = JSON.parse(response.text || "{}");
    return {
      ...rawData,
      id: `${level}-detail-${Date.now()}`,
      level
    };
  } catch (error) {
    console.error("Failed to fetch grammar detail:", error);
    return null;
  }
};

export const fetchVocabularyList = async (level: JLPTLevel): Promise<VocabularyItem[]> => {
    const prompt = `
      List 20 essential JLPT ${level} vocabulary words (Kanji, Kana, Meaning).
      Focus on words that frequently appear in exams.
      Return strictly JSON.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: vocabularyListSchema
        }
      });
  
      const rawData = JSON.parse(response.text || "[]");
      
      return rawData.map((item: any, index: number) => ({
        ...item,
        id: `${level}-vocab-${index}`,
        level
      }));
    } catch (error) {
      console.error("Failed to fetch vocabulary:", error);
      return [];
    }
  };
