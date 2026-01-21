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
import { Chat, GenerateContentResponse } from "@google/genai";

import { ChatMessage } from "../types";
import { GeminiService } from "../services/geminiService";
import { PAWPAL_AVATAR } from "../App"; // ✅ rename avatar too

/* ------------------------------------------------------------------ */
/* SAMPLE QUESTIONS – SS PAW PAL                                       */
/* ------------------------------------------------------------------ */
const SAMPLE_QUESTIONS = [
  "My dog is not eating food. What should I do?",
  "How often should I bathe my puppy?",
  "What should I feed a 2-month-old kitten?",
  "How can I report an abusive post?",
  "Can I connect with nearby pet owners?",
];

/* ------------------------------------------------------------------ */
/* PROPS                                                               */
/* ------------------------------------------------------------------ */
interface PawPalChatProps {
  onDeductCredit: (amount: number) => boolean;
  currentCredits: number;
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */
const PawPalChat: React.FC<PawPalChatProps> = ({
  onDeductCredit,
  currentCredits,
}) => {
  /* ---------------------------- STATE ----------------------------- */
  const [messages, setMessages] = useState<ChatMessage[]>([
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
  const [isApiDisabled, setIsApiDisabled] = useState(false);

  /* ---------------------------- REFS ------------------------------ */
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ------------------------- INIT CHAT ---------------------------- */
  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = GeminiService.createPawPalChat(); // ✅ renamed
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
    setIsApiDisabled(false);

    /* ---- Credit logic ---- */
    if (!onDeductCredit(1)) {
      setError("Insufficient credits. 1 credit is required per message.");
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const stream = await chatSessionRef.current.sendMessageStream({
        message: text,
      });

      let fullText = "";
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "", timestamp: Date.now() },
      ]);

      for await (const chunk of stream) {
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
        setIsApiDisabled(true);
        msg = "API_DISABLED_BLOCK";
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
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-4 py-2 bg-slate-50 border-b flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          SS Paw Pal · PawPal AI
        </span>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border text-[10px] font-bold">
          <Sparkles className="w-3 h-3" />
          1 Credit / Msg
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "model" && (
              <img
                src={PAWPAL_AVATAR}
                alt="PawPal AI"
                className="w-8 h-8 rounded-full border"
              />
            )}

            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary-600 text-white rounded-br-none"
                  : "bg-slate-50 border text-slate-800 rounded-bl-none"
              }`}
            >
              {msg.text === "API_DISABLED_BLOCK" ? (
                <div className="space-y-2">
                  <p className="font-bold text-red-700">
                    Generative Language API not enabled
                  </p>
                  <a
                    href="https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs bg-red-600 text-white px-3 py-2 rounded-md"
                  >
                    Enable API
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : msg.role === "model" ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-slate-500" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <img src={PAWPAL_AVATAR} className="w-8 h-8 rounded-full" />
            <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 border-t">
        {error && (
          <div className="mb-2 text-xs text-red-600 flex gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <button onClick={toggleVoiceInput}>
            {isListening ? <MicOff /> : <Mic />}
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask PawPal AI about your pet…"
            className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm"
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-primary-600 text-white p-2 rounded-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>1 message = 1 credit</span>
          <span>Balance: {currentCredits}</span>
        </div>
      </div>
    </div>
  );
};

export default PawPalChat;
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
import { Chat, GenerateContentResponse } from "@google/genai";

import { ChatMessage } from "../types";
import { GeminiService } from "../services/geminiService";
import { PAWPAL_AVATAR } from "../App"; // ✅ rename avatar too

/* ------------------------------------------------------------------ */
/* SAMPLE QUESTIONS – SS PAW PAL                                       */
/* ------------------------------------------------------------------ */
const SAMPLE_QUESTIONS = [
  "My dog is not eating food. What should I do?",
  "How often should I bathe my puppy?",
  "What should I feed a 2-month-old kitten?",
  "How can I report an abusive post?",
  "Can I connect with nearby pet owners?",
];

/* ------------------------------------------------------------------ */
/* PROPS                                                               */
/* ------------------------------------------------------------------ */
interface PawPalChatProps {
  onDeductCredit: (amount: number) => boolean;
  currentCredits: number;
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */
const PawPalChat: React.FC<PawPalChatProps> = ({
  onDeductCredit,
  currentCredits,
}) => {
  /* ---------------------------- STATE ----------------------------- */
  const [messages, setMessages] = useState<ChatMessage[]>([
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
  const [isApiDisabled, setIsApiDisabled] = useState(false);

  /* ---------------------------- REFS ------------------------------ */
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ------------------------- INIT CHAT ---------------------------- */
  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = GeminiService.createPawPalChat(); // ✅ renamed
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
    setIsApiDisabled(false);

    /* ---- Credit logic ---- */
    if (!onDeductCredit(1)) {
      setError("Insufficient credits. 1 credit is required per message.");
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const stream = await chatSessionRef.current.sendMessageStream({
        message: text,
      });

      let fullText = "";
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "", timestamp: Date.now() },
      ]);

      for await (const chunk of stream) {
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
        setIsApiDisabled(true);
        msg = "API_DISABLED_BLOCK";
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
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-4 py-2 bg-slate-50 border-b flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          SS Paw Pal · PawPal AI
        </span>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border text-[10px] font-bold">
          <Sparkles className="w-3 h-3" />
          1 Credit / Msg
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "model" && (
              <img
                src={PAWPAL_AVATAR}
                alt="PawPal AI"
                className="w-8 h-8 rounded-full border"
              />
            )}

            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary-600 text-white rounded-br-none"
                  : "bg-slate-50 border text-slate-800 rounded-bl-none"
              }`}
            >
              {msg.text === "API_DISABLED_BLOCK" ? (
                <div className="space-y-2">
                  <p className="font-bold text-red-700">
                    Generative Language API not enabled
                  </p>
                  <a
                    href="https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs bg-red-600 text-white px-3 py-2 rounded-md"
                  >
                    Enable API
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : msg.role === "model" ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-slate-500" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <img src={PAWPAL_AVATAR} className="w-8 h-8 rounded-full" />
            <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 border-t">
        {error && (
          <div className="mb-2 text-xs text-red-600 flex gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <button onClick={toggleVoiceInput}>
            {isListening ? <MicOff /> : <Mic />}
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask PawPal AI about your pet…"
            className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm"
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-primary-600 text-white p-2 rounded-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>1 message = 1 credit</span>
          <span>Balance: {currentCredits}</span>
        </div>
      </div>
    </div>
  );
};

export default PawPalChat;
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
import { Chat, GenerateContentResponse } from "@google/genai";

import { ChatMessage } from "../types";
import { GeminiService } from "../services/geminiService";
import { PAWPAL_AVATAR } from "../App"; // ✅ rename avatar too

/* ------------------------------------------------------------------ */
/* SAMPLE QUESTIONS – SS PAW PAL                                       */
/* ------------------------------------------------------------------ */
const SAMPLE_QUESTIONS = [
  "My dog is not eating food. What should I do?",
  "How often should I bathe my puppy?",
  "What should I feed a 2-month-old kitten?",
  "How can I report an abusive post?",
  "Can I connect with nearby pet owners?",
];

/* ------------------------------------------------------------------ */
/* PROPS                                                               */
/* ------------------------------------------------------------------ */
interface PawPalChatProps {
  onDeductCredit: (amount: number) => boolean;
  currentCredits: number;
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */
const PawPalChat: React.FC<PawPalChatProps> = ({
  onDeductCredit,
  currentCredits,
}) => {
  /* ---------------------------- STATE ----------------------------- */
  const [messages, setMessages] = useState<ChatMessage[]>([
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
  const [isApiDisabled, setIsApiDisabled] = useState(false);

  /* ---------------------------- REFS ------------------------------ */
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ------------------------- INIT CHAT ---------------------------- */
  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = GeminiService.createPawPalChat(); // ✅ renamed
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
    setIsApiDisabled(false);

    /* ---- Credit logic ---- */
    if (!onDeductCredit(1)) {
      setError("Insufficient credits. 1 credit is required per message.");
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const stream = await chatSessionRef.current.sendMessageStream({
        message: text,
      });

      let fullText = "";
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "", timestamp: Date.now() },
      ]);

      for await (const chunk of stream) {
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
        setIsApiDisabled(true);
        msg = "API_DISABLED_BLOCK";
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
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-4 py-2 bg-slate-50 border-b flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          SS Paw Pal · PawPal AI
        </span>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border text-[10px] font-bold">
          <Sparkles className="w-3 h-3" />
          1 Credit / Msg
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "model" && (
              <img
                src={PAWPAL_AVATAR}
                alt="PawPal AI"
                className="w-8 h-8 rounded-full border"
              />
            )}

            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary-600 text-white rounded-br-none"
                  : "bg-slate-50 border text-slate-800 rounded-bl-none"
              }`}
            >
              {msg.text === "API_DISABLED_BLOCK" ? (
                <div className="space-y-2">
                  <p className="font-bold text-red-700">
                    Generative Language API not enabled
                  </p>
                  <a
                    href="https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs bg-red-600 text-white px-3 py-2 rounded-md"
                  >
                    Enable API
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : msg.role === "model" ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-slate-500" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <img src={PAWPAL_AVATAR} className="w-8 h-8 rounded-full" />
            <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 border-t">
        {error && (
          <div className="mb-2 text-xs text-red-600 flex gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <button onClick={toggleVoiceInput}>
            {isListening ? <MicOff /> : <Mic />}
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask PawPal AI about your pet…"
            className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm"
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-primary-600 text-white p-2 rounded-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>1 message = 1 credit</span>
          <span>Balance: {currentCredits}</span>
        </div>
      </div>
    </div>
  );
};

export default PawPalChat;
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
import { Chat, GenerateContentResponse } from "@google/genai";

import { ChatMessage } from "../types";
import { GeminiService } from "../services/geminiService";
import { PAWPAL_AVATAR } from "../App"; // ✅ rename avatar too

/* ------------------------------------------------------------------ */
/* SAMPLE QUESTIONS – SS PAW PAL                                       */
/* ------------------------------------------------------------------ */
const SAMPLE_QUESTIONS = [
  "My dog is not eating food. What should I do?",
  "How often should I bathe my puppy?",
  "What should I feed a 2-month-old kitten?",
  "How can I report an abusive post?",
  "Can I connect with nearby pet owners?",
];

/* ------------------------------------------------------------------ */
/* PROPS                                                               */
/* ------------------------------------------------------------------ */
interface PawPalChatProps {
  onDeductCredit: (amount: number) => boolean;
  currentCredits: number;
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */
const PawPalChat: React.FC<PawPalChatProps> = ({
  onDeductCredit,
  currentCredits,
}) => {
  /* ---------------------------- STATE ----------------------------- */
  const [messages, setMessages] = useState<ChatMessage[]>([
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
  const [isApiDisabled, setIsApiDisabled] = useState(false);

  /* ---------------------------- REFS ------------------------------ */
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ------------------------- INIT CHAT ---------------------------- */
  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = GeminiService.createPawPalChat(); // ✅ renamed
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
    setIsApiDisabled(false);

    /* ---- Credit logic ---- */
    if (!onDeductCredit(1)) {
      setError("Insufficient credits. 1 credit is required per message.");
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const stream = await chatSessionRef.current.sendMessageStream({
        message: text,
      });

      let fullText = "";
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "", timestamp: Date.now() },
      ]);

      for await (const chunk of stream) {
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
        setIsApiDisabled(true);
        msg = "API_DISABLED_BLOCK";
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
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-4 py-2 bg-slate-50 border-b flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          SS Paw Pal · PawPal AI
        </span>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border text-[10px] font-bold">
          <Sparkles className="w-3 h-3" />
          1 Credit / Msg
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "model" && (
              <img
                src={PAWPAL_AVATAR}
                alt="PawPal AI"
                className="w-8 h-8 rounded-full border"
              />
            )}

            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary-600 text-white rounded-br-none"
                  : "bg-slate-50 border text-slate-800 rounded-bl-none"
              }`}
            >
              {msg.text === "API_DISABLED_BLOCK" ? (
                <div className="space-y-2">
                  <p className="font-bold text-red-700">
                    Generative Language API not enabled
                  </p>
                  <a
                    href="https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs bg-red-600 text-white px-3 py-2 rounded-md"
                  >
                    Enable API
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : msg.role === "model" ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-slate-500" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <img src={PAWPAL_AVATAR} className="w-8 h-8 rounded-full" />
            <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 border-t">
        {error && (
          <div className="mb-2 text-xs text-red-600 flex gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <button onClick={toggleVoiceInput}>
            {isListening ? <MicOff /> : <Mic />}
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask PawPal AI about your pet…"
            className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm"
            rows={1}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-primary-600 text-white p-2 rounded-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>1 message = 1 credit</span>
          <span>Balance: {currentCredits}</span>
        </div>
      </div>
    </div>
  );
};

export default PawPalChat;
