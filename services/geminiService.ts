import { GoogleGenAI, Type, Schema, Chat, Modality, LiveServerMessage } from "@google/genai";
import { JLPTLevel, UnitContent, GrammarPoint, GrammarDetail, VocabularyItem, FlashcardData, PracticeSentenceData } from '../types';
import { UNIT_THEMES } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = 'gemini-2.5-flash';
const imageModelId = 'gemini-2.5-flash-image';
const ttsModelId = 'gemini-2.5-flash-preview-tts';
const liveModelId = 'gemini-2.5-flash-native-audio-preview-09-2025';

// --- Audio Utilities ---

let audioContext: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    // IMPORTANT: Do not force sampleRate here. Let the browser pick the native hardware rate (e.g. 44.1k or 48k).
    // Forcing it can cause silence or errors on some mobile devices/browsers.
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// CRITICAL: Call this immediately on button click
export const resumeAudioContext = async () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
};

export const decodeAudioData = (base64String: string, sampleRate: number = 24000): AudioBuffer => {
  const ctx = getAudioContext();
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const int16Data = new Int16Array(bytes.buffer);
  const float32Data = new Float32Array(int16Data.length);
  
  // Convert Int16 to Float32
  for (let i = 0; i < int16Data.length; i++) {
    float32Data[i] = int16Data[i] / 32768.0;
  }

  // We specify the sample rate of the SOURCE audio here (24000 for Gemini TTS).
  // The AudioContext (running at system rate, e.g., 48000) will handle the resampling automatically.
  const buffer = ctx.createBuffer(1, float32Data.length, sampleRate);
  buffer.getChannelData(0).set(float32Data);
  return buffer;
};

export const playPcmData = (base64String: string, sampleRate: number = 24000): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      const buffer = decodeAudioData(base64String, sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => resolve();
      source.start(0);
    } catch (e) {
      console.error("Error playing audio:", e);
      resolve();
    }
  });
};

export const createPcmBlob = (data: Float32Array): { data: string, mimeType: string } => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
};

// --- Schemas ---

const unitSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A creative title for this unit (e.g. 'Ordering Sushi')" },
    description: { type: Type.STRING, description: "Short description of what you will learn" },
    grammar: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pattern: { type: Type.STRING, description: "The grammar point (e.g. ～ている)" },
          meaning: { type: Type.STRING },
          romaji: { type: Type.STRING },
          formation: { type: Type.STRING, description: "Brief connection rule (e.g. Verb-Te form + iru)" },
          explanation: { type: Type.STRING, description: "1-2 sentence explanation" },
          example: {
            type: Type.OBJECT,
            properties: {
              japanese: { type: Type.STRING },
              romaji: { type: Type.STRING },
              english: { type: Type.STRING }
            }
          }
        },
        required: ["pattern", "meaning", "romaji", "formation", "explanation", "example"]
      }
    },
    vocabulary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          kanji: { type: Type.STRING },
          kana: { type: Type.STRING },
          meaning: { type: Type.STRING }
        },
        required: ["kanji", "kana", "meaning"]
      }
    },
    quiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "The question text (can be fill-in-the-blank in Japanese or translation)" },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 possible answers" },
          correctIndex: { type: Type.INTEGER, description: "Index of the correct answer (0-3)" },
          explanation: { type: Type.STRING, description: "Why the answer is correct" }
        },
        required: ["question", "options", "correctIndex", "explanation"]
      }
    }
  },
  required: ["title", "description", "grammar", "vocabulary", "quiz"]
};

// Reference Mode Schemas
const grammarListSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      pattern: { type: Type.STRING, description: "The grammar point" },
      meaning: { type: Type.STRING },
      romaji: { type: Type.STRING }
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
    formation: { type: Type.STRING },
    explanation: { type: Type.STRING },
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
          kanji: { type: Type.STRING },
          kana: { type: Type.STRING },
          meaning: { type: Type.STRING }
      },
      required: ["kanji", "kana", "meaning"]
  }
}

// Exercise Schemas

const flashcardListSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      kanji: { type: Type.STRING },
      kana: { type: Type.STRING },
      meaning: { type: Type.STRING },
      imagePrompt: { type: Type.STRING, description: "A simple, concrete visual description to generate an image for this word." }
    },
    required: ["kanji", "kana", "meaning", "imagePrompt"]
  }
}

const sentenceListSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      japanese: { type: Type.STRING },
      romaji: { type: Type.STRING },
      english: { type: Type.STRING },
      grammarPoint: { type: Type.STRING, description: "The specific N1-N5 grammar point used in this sentence" }
    },
    required: ["japanese", "romaji", "english", "grammarPoint"]
  }
}

// --- API Calls ---

export const fetchUnitContent = async (level: JLPTLevel, unitNumber: number): Promise<UnitContent | null> => {
  const themeIndex = (unitNumber - 1) % UNIT_THEMES.length;
  const theme = UNIT_THEMES[themeIndex];
  
  const prompt = `
    Create a "Duolingo-style" learning unit for JLPT Level ${level}, Unit #${unitNumber}.
    Theme: "${theme}".
    
    The unit must contain:
    1. 3 distinct Grammar points appropriate for ${level} (related to the theme if possible).
    2. 4 Vocabulary words appropriate for ${level}.
    3. 3 Multiple-choice Quiz questions that test the user on the grammar and vocabulary provided in THIS unit.

    Ensure the difficulty matches JLPT ${level} exactly.
    Return strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: unitSchema,
        temperature: 0.4 
      }
    });

    const rawData = JSON.parse(response.text || "{}");
    
    // Enrich with IDs
    return {
      ...rawData,
      id: `${level}-unit-${unitNumber}`,
      grammar: rawData.grammar?.map((g: any, i: number) => ({ ...g, id: `g-${i}` })) || [],
      vocabulary: rawData.vocabulary?.map((v: any, i: number) => ({ ...v, id: `v-${i}` })) || [],
      quiz: rawData.quiz?.map((q: any, i: number) => ({ ...q, id: `q-${i}`, type: 'multiple-choice' })) || []
    };
  } catch (error) {
    console.error("Failed to fetch unit:", error);
    return null;
  }
};

// --- Reference Mode API Calls ---

export const fetchGrammarList = async (level: JLPTLevel, offset: number = 0): Promise<GrammarPoint[]> => {
  const prompt = `
    Act as a JLPT expert.
    List 15 distinct and popular JLPT ${level} grammar points.
    Do not repeat points.
    Return only the JSON array.
    Batch #${Math.floor(offset / 15) + 1}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: grammarListSchema,
        temperature: 0.3
      }
    });

    const rawData = JSON.parse(response.text || "[]");
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
    Include formation rules, clear explanation, 3 native-sounding example sentences, and synonyms.
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

// --- Exercise API Calls ---

export const fetchFlashcards = async (level: JLPTLevel, count: number = 5): Promise<FlashcardData[]> => {
  const prompt = `
    List ${count} interesting JLPT ${level} vocabulary words.
    Include meaning and a simple visual description for an image prompt.
    Return strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: flashcardListSchema
      }
    });

    const rawData = JSON.parse(response.text || "[]");
    return rawData.map((item: any, i: number) => ({ ...item, id: `flash-${Date.now()}-${i}` }));
  } catch (error) {
    console.error("Error fetching flashcards", error);
    return [];
  }
};

export const fetchPracticeSentences = async (level: JLPTLevel, count: number = 5): Promise<PracticeSentenceData[]> => {
  const prompt = `
    Generate ${count} Japanese practice sentences using JLPT ${level} grammar and vocabulary.
    Include the grammar point used, Romaji, and English translation.
    Return strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: sentenceListSchema
      }
    });

    const rawData = JSON.parse(response.text || "[]");
    return rawData.map((item: any, i: number) => ({ ...item, id: `sent-${Date.now()}-${i}` }));
  } catch (error) {
    console.error("Error fetching sentences", error);
    return [];
  }
};

export const generateImage = async (imagePrompt: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: imageModelId,
      contents: { parts: [{ text: imagePrompt }] },
    });
    
    // Find the image part in the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    return undefined;
  } catch (error) {
    console.error("Image generation failed", error);
    return undefined;
  }
};

// Generates PCM audio data (base64)
export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: ttsModelId,
      contents: { parts: [{ text: text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS failed", error);
    return undefined;
  }
};

// --- Live API (Real-time Voice) ---

interface LiveSessionCallbacks {
  onAudioData: (base64: string) => void;
  onTranscription: (text: string, isUser: boolean) => void;
  onClose: () => void;
}

export const connectToLiveScenario = async (
  level: JLPTLevel,
  scenario: string,
  callbacks: LiveSessionCallbacks
): Promise<{ disconnect: () => void }> => {
  
  const stream = await navigator.mediaDevices.getUserMedia({ audio: {
    sampleRate: 16000,
    channelCount: 1
  }});
  
  // Audio Context for Input (Microphone)
  // Use 16k to match the Gemini Live requirement for input
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
  const source = inputAudioContext.createMediaStreamSource(stream);
  const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
  
  let sessionPromise: Promise<any> | null = null;

  scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
    const pcmBlob = createPcmBlob(inputData);
    
    if (sessionPromise) {
      sessionPromise.then((session) => {
         session.sendRealtimeInput({ media: pcmBlob });
      });
    }
  };

  source.connect(scriptProcessor);
  scriptProcessor.connect(inputAudioContext.destination);

  // Initialize Live Session
  sessionPromise = ai.live.connect({
    model: liveModelId,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: `You are a native Japanese roleplay partner for a JLPT ${level} student. 
      Scenario: "${scenario}". 
      IMPORTANT: You are the initiator. You MUST start the conversation immediately by greeting the user or asking a question related to the scenario. Do NOT wait for the user to speak first.
      Converse naturally in Japanese. Adjust difficulty to JLPT ${level}.
      If the user makes a mistake, politely correct it briefly in Japanese, then continue the roleplay.`,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      }
    },
    callbacks: {
      onopen: () => console.log("Live session connected"),
      onmessage: (message: LiveServerMessage) => {
        // Handle Audio Output
        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData) {
          callbacks.onAudioData(audioData);
        }

        // Handle Transcriptions
        if (message.serverContent?.outputTranscription?.text) {
           callbacks.onTranscription(message.serverContent.outputTranscription.text, false);
        }
        if (message.serverContent?.inputTranscription?.text) {
           callbacks.onTranscription(message.serverContent.inputTranscription.text, true);
        }
      },
      onclose: () => {
        console.log("Live session closed");
        callbacks.onClose();
      },
      onerror: (e) => console.error("Live session error", e)
    }
  });

  // Trigger the start of the conversation by sending a text signal
  sessionPromise.then((session) => {
    // We send a text part to the model to force it to start, acting as a "system event" or user prompt to kick it off.
    session.send({ parts: [{ text: "Start the roleplay now." }], turnComplete: true });
  });

  return {
    disconnect: () => {
      source.disconnect();
      scriptProcessor.disconnect();
      inputAudioContext.close();
      stream.getTracks().forEach(track => track.stop());
      sessionPromise?.then(session => session.close());
    }
  };
};