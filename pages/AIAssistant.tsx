import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  User as UserIcon,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Local type definition for AI Chat to avoid conflict with P2P ChatMessage
interface AIChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const PAWPAL_AVATAR = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

const AIAssistant: React.FC = () => {
  // State for Credits (Managed locally since not passed from App)
  const [currentCredits, setCurrentCredits] = useState(10);

  /* ---------------------------- STATE ----------------------------- */
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: "model",
      text: "Hi! I’m PawPal AI 🐾, your assistant from SS Paw Pal. How can I help you and your pet today?",
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /* ---------------------------- REFS ------------------------------ */
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ------------------------- INIT CHAT ---------------------------- */
  useEffect(() => {
    if (!chatSessionRef.current) {
       try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatSessionRef.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: "You are SS Paw Pal, a friendly and knowledgeable AI pet care assistant. Provide helpful, accurate advice about pet health, training, and nutrition. Always advise users to consult a veterinarian for serious medical issues. Keep responses concise and engaging.",
          },
        });
       } catch (e) {
         console.error("Failed to init AI chat", e);
         setError("Failed to initialize AI service.");
       }
    }
  }, []);

  /* ---------------------- AUTO SCROLL ----------------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ------------------------------------------------------------------ */
  /* VOICE INPUT                                                        */
  /* ------------------------------------------------------------------ */
  const toggleVoiceInput = () => {
    if (isListening) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  /* ------------------------------------------------------------------ */
  /* SEND MESSAGE TO AI                                                 */
  /* ------------------------------------------------------------------ */
  const sendMessageToAi = async (text: string) => {
    if (!text.trim() || !chatSessionRef.current) return;

    setError(null);

    /* ---- Credit logic ---- */
    if (currentCredits < 1) {
      setError("Insufficient credits. 1 credit is required per message.");
      return;
    }
    
    // Deduct credit
    setCurrentCredits(prev => prev - 1);

    const userMessage: AIChatMessage = {
      role: "user",
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Use sendMessageStream directly on the chat session
      const streamResult = await chatSessionRef.current.sendMessageStream({
        message: text,
      });

      let fullText = "";
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "", timestamp: Date.now() },
      ]);

      // Iterate over the stream
      for await (const chunk of streamResult) {
        // chunk is GenerateContentResponse
        const res = chunk as GenerateContentResponse;
        if (res.text) {
          fullText += res.text;
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1].text = fullText;
            return copy;
          });
        }
      }
    } catch (err: any) {
      console.error("PawPal AI Error:", err);

      let msg = "Something went wrong. Please try again.";
      if (err?.message?.includes("PERMISSION_DENIED")) {
         msg = "API Key Permission Denied. Please check your configuration.";
      }

      setMessages((prev) => [
        ...prev,
        { role: "model", text: msg, timestamp: Date.now() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  /* ----------------------- HANDLERS ------------------------------- */
  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    sendMessageToAi(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ------------------------------------------------------------------ */
  /* UI                                                                 */
  /* ------------------------------------------------------------------ */
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
      {/* HEADER */}
      <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          SS Paw Pal · AI Specialist
        </span>
        <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 text-[10px] font-black uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          Credits: {currentCredits}
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-4 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "model" && (
              <img
                src={PAWPAL_AVATAR}
                alt="PawPal AI"
                className="w-10 h-10 rounded-2xl border border-slate-100 shadow-sm shrink-0 bg-white p-1 object-contain"
              />
            )}

            <div
              className={`max-w-[85%] rounded-[2rem] px-6 py-4 text-sm font-medium leading-relaxed ${
                msg.role === "user"
                  ? "bg-slate-900 text-white rounded-br-sm shadow-xl"
                  : "bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-sm"
              }`}
            >
              {msg.role === "model" ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                <UserIcon className="w-5 h-5 text-slate-400" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-4 animate-in fade-in">
            <img src={PAWPAL_AVATAR} className="w-10 h-10 rounded-2xl border border-slate-100 shadow-sm p-1 object-contain bg-white" alt="AI" />
            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] rounded-bl-sm px-6 py-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span className="text-xs font-bold text-slate-400">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="p-4 bg-white border-t border-slate-100">
        {error && (
          <div className="mb-3 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-100">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex gap-2 items-end bg-slate-50 p-2 rounded-[2rem] border border-slate-100 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all focus-within:bg-white focus-within:border-indigo-100">
          <button 
            onClick={toggleVoiceInput}
            className={`p-3 rounded-full transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-white'}`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your pet..."
            className="flex-1 bg-transparent border-none px-2 py-3 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none resize-none max-h-32"
            rows={1}
            style={{ minHeight: '44px' }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-black transition-all active:scale-90 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
        
        <div className="text-center mt-3">
           <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
             Powered by Google Gemini 2.5 Flash
           </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;