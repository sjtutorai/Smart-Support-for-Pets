
import React, { useState } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const AIAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I am your AI Pet Assistant. How can I help you today?' }
  ]);

  // Handle sending message using Gemini API
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // Initialize GoogleGenAI right before making an API call to ensure fresh configuration
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Use gemini-3-flash-preview for general Q&A as per guidelines
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: "You are a specialized AI Pet Assistant for the 'Smart Support for Pets' application. Your role is to provide helpful, empathetic, and accurate advice on pet health, nutrition, behavior, and general care. If a user describes a medical emergency, prioritize advising them to see a veterinarian immediately. Keep responses concise and practical.",
        }
      });

      // Extract generated text from the response object's text property
      const botResponse = response.text || "I'm sorry, I couldn't generate a response at the moment.";
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    } catch (error) {
      console.error("Gemini API error:", error);
      setMessages(prev => [...prev, { role: 'bot', text: "I'm having trouble connecting to my AI services. Please try again in a few seconds." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Pet AI Assistant</h2>
        <p className="text-slate-500">Ask anything about pet care, health, or behavior.</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'bot' ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                {msg.role === 'bot' ? <Bot size={20} className="text-white" /> : <User size={20} className="text-slate-600" />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'bot' ? 'bg-slate-50 text-slate-800' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'}`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {/* Visual feedback while waiting for Gemini response */}
          {isLoading && (
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot size={20} className="text-white" />
              </div>
              <div className="max-w-[80%] p-4 rounded-2xl bg-slate-50 flex items-center gap-3">
                <Loader2 size={18} className="text-indigo-600 animate-spin" />
                <span className="text-sm text-slate-400">Assistant is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <div className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..."
              disabled={isLoading}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-60"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
