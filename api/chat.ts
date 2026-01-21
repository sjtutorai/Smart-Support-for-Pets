import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are SS Paw Pal, a professional AI assistant dedicated exclusively to pets and companion animals.

STRICT RULES:
1. Answer ONLY pet-related questions.
2. If NOT pet-related, reply exactly:
"I am a pet care assistant and can only answer questions related to pets."

HEALTH:
- Give general guidance only.
- Recommend a veterinarian for serious symptoms.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history || []
    });

    const result = await chat.sendMessage({ message });
    const reply = result.text;

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      reply: "I'm having trouble connecting to the network. Please try again.",
    });
  }
}