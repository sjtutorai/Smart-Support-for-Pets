import { GoogleGenAI } from "@google/genai";

// The API key is obtained exclusively from the environment variable as per security guidelines.
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
