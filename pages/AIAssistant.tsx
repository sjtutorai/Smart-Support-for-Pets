import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  User as UserIcon,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Chat, GenerateContentResponse } from "@google/genai";
import { createPawPalChat } from "../services/gemini";

// Local type definition for AI Chat to avoid conflict with P2P ChatMessage
interface AIChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const PAWPAL_AVATAR = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

const AIAssistant: React.FC = () => {
  // State for Credits
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
  const [initError, setInitError] = useState(false);
  
  /* ---------------------------- REFS ------------------------------ */
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ------------------------- INIT CHAT ---------------------------- */
  useEffect(() => {
    let isMounted = true;
    if (!chatSessionRef.current) {
       try {
        const session = createPawPalChat();
        if (isMounted) chatSessionRef.current = session;
       } catch (e) {
         console.error("Failed to init AI chat:", e);
         if (isMounted) {
           setError("Unable to connect to PawPal AI Engine.");
           setInitError(true);
         }
       }
    }
    return () => { isMounted = false; };
  }, []);

  /* ---------------------- AUTO SCROLL ----------------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleVoiceInput = () => {
    if (isListening) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.start();
  };

  const sendMessageToAi = async (text: string) => {
    if (!text.trim() || !chatSessionRef.current) return;
    setError(null);
    if (currentCredits < 1) {
      setError("Insufficient credits. 1 credit is required per message.");
      return;
    }
    
    setCurrentCredits(prev => prev - 1);
    const userMessage: AIChatMessage = { role: "user", text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const streamResult = await chatSessionRef.current.sendMessageStream({ message: text });
      let fullText = "";
      setMessages((prev) => [...prev, { role: "model", text: "", timestamp: Date.now() }]);

      for await (const chunk of streamResult) {
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
      let msg = "Something went wrong. Please check your connection and try again.";
      if (err?.message?.includes("PERMISSION_DENIED")) msg = "API Access Denied. Please contact support.";
      setMessages((prev) => [...prev, { role: "model", text: msg, timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isTyping || initError) return;
    sendMessageToAi(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (initError) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-6 animate-fade-in bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center shadow-sm">
          <AlertCircle size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Engine Offline</h2>
          <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2">We're having trouble connecting to our specialized AI servers. Please refresh or try again later.</p>
        </div>
        <button onClick={() => window.location.reload()} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
          Reload Portal
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in min-h-[500px]">
      {/* HEADER */}
      <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center shrink-0">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          SS Paw Pal · AI Specialist
        </span>
        <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 text-[10px] font-black uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          Credits: {currentCredits}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "model" && (
              <img src={PAWPAL_AVATAR} alt="AI" className="w-10 h-10 rounded-2xl border border-slate-100 shadow-sm shrink-0 bg-white p-1 object-contain" />
            )}
            <div className={`max-w-[85%] rounded-[2rem] px-6 py-4 text-sm font-medium leading-relaxed ${msg.role === "user" ? "bg-slate-900 text-white rounded-br-sm shadow-xl" : "bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-sm"}`}>
              {msg.role === "model" ? (
                <div className="prose prose-sm max-w-none prose-slate">
                  {/* Defensive Markdown rendering */}
                  {ReactMarkdown ? (
                    <ReactMarkdown>{msg.text || "..."}</ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.text || "..."}</div>
                  )}
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

      {/* INPUT AREA */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        {error && (
          <div className="mb-3 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-100">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        <div className="flex gap-2 items-end bg-slate-50 p-2 rounded-[2rem] border border-slate-100 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all focus-within:bg-white focus-within:border-indigo-100">
          <button onClick={toggleVoiceInput} className={`p-3 rounded-full transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-white'}`}>
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
          <button onClick={handleSend} disabled={!input.trim() || isTyping || initError} className="p-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-black transition-all active:scale-90 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100">
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
        <div className="text-center mt-3">
           <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Powered by Google Gemini 3 Flash</p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;