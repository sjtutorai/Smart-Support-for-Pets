import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Bot, MessageSquareText, Send, Loader2, User as UserIcon, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hello! I'm SS Paw Pal, your dedicated pet care specialist. How can I help you and your companion today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Prepare history for API - filter out initial welcome message if needed or keep it
      // The API expects parts format: { role, parts: [{ text }] }
      // We slice(1) to skip the hardcoded welcome message to save tokens/context if desired,
      // or keep it if it helps context. Here we replicate the user's logic.
      const history = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: history,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.reply) {
        setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the network. Please check your connection and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'model', text: "Chat cleared. How can I help with your pet?" }]);
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-lg border border-slate-50 flex-shrink-0 flex items-center justify-center">
            <img src={LOGO_URL} alt="SS Paw Pal Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">AI Care Portal</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Specialist Engine Online</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Strict Pet Protocol</span>
          </div>
          <button 
            onClick={clearChat} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden relative flex flex-col">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Bot size={200} />
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 custom-scrollbar scroll-smooth">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-4 max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm mt-1 ${isUser ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    {isUser ? 
                      (user?.photoURL ? <img src={user.photoURL} className="w-full h-full rounded-full object-cover" /> : <UserIcon size={14} className="text-indigo-500" />) : 
                      <Bot size={16} className="text-emerald-600" />
                    }
                  </div>
                  
                  <div className={`p-5 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm relative whitespace-pre-wrap ${isUser ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="flex gap-4 max-w-[75%]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm mt-1 bg-emerald-50 border-emerald-100">
                  <Bot size={16} className="text-emerald-600" />
                </div>
                <div className="p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 rounded-tl-none flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 md:p-6 bg-white border-t border-slate-50 z-10">
          <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-center gap-3">
            <div className="relative flex-1 group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-theme transition-colors">
                <MessageSquareText size={20} />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about diet, training, or health..."
                disabled={isLoading}
                className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-4 bg-slate-900 text-white rounded-full shadow-xl hover:bg-black hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
            >
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
            </button>
          </form>
          <div className="text-center mt-3">
            <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1.5">
              <AlertCircle size={10} />
              AI can make mistakes. Always consult a vet for medical emergencies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;