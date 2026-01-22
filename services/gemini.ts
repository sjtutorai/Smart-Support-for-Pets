import { GoogleGenAI } from "@google/genai";

// Ensure process.env.API_KEY is handled gracefully even if Vite define fails
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';

/**
 * Direct initialization as required by coding guidelines.
 * We use a lazy accessor pattern internally to handle potential init errors without crashing the module load.
 */
export const ai = new GoogleGenAI({ apiKey });

export const PAWPAL_SYSTEM_INSTRUCTION = `You are SS Paw Pal, a professional AI assistant dedicated exclusively to pets and companion animals.

STRICT RULES:
1. Answer ONLY pet-related questions.
2. If NOT pet-related, reply exactly: "I am a pet care assistant and can only answer questions related to pets."
3. Keep responses concise, engaging, and professional.

HEALTH:
- Provide general guidance only.
- Always recommend consulting a licensed veterinarian for serious symptoms or medical emergencies.`;

/**
 * Creates a new chat session with Paw Pal system instructions.
 */
export const createPawPalChat = () => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will be limited.");
  }
  
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: PAWPAL_SYSTEM_INSTRUCTION,
    },
  });
};

/**
 * Convenience method for single-turn content generation with Paw Pal context.
 */
export const generatePawPalContent = async (prompt: string, model: string = 'gemini-3-flash-preview') => {
  return ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: PAWPAL_SYSTEM_INSTRUCTION,
    },
  });
};