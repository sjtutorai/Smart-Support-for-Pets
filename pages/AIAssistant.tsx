import React from 'react';
import { Sparkles, ShieldCheck, Zap, Bot, MessageSquareText } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const LOGO_URL = "https://res.cloudinary.com/dazlddxht/image/upload/v1768234409/SS_Paw_Pal_Logo_aceyn8.png";

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-10 animate-fade-in">
      {/* Branded Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white rounded-3xl p-3 shadow-xl border border-slate-50 flex-shrink-0 flex items-center justify-center animate-pulse">
            <img src={LOGO_URL} alt="SS Paw Pal Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">AI Care Portal</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Specialist Engine Online</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">HIPAA Compliant Protocol</span>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-xl">
            <Sparkles size={16} className="text-theme" />
            <span className="text-[10px] font-black uppercase tracking-widest">ThinkStack v2.4</span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface Container */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden relative min-h-[750px] flex flex-col group">
        {/* Portal Decorative Accents */}
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
          <Bot size={120} />
        </div>
        
        {/* Branded Bar */}
        <div className="h-14 bg-slate-50 border-b border-slate-100 flex items-center px-8 justify-between shrink-0">
          <div className="flex items-center gap-3">
             <MessageSquareText size={18} className="text-theme" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Secure Consultation Session</span>
          </div>
          <div className="flex gap-1.5">
             <div className="w-2 h-2 rounded-full bg-slate-200"></div>
             <div className="w-2 h-2 rounded-full bg-slate-200"></div>
             <div className="w-2 h-2 rounded-full bg-slate-200"></div>
          </div>
        </div>

        {/* The Inline Iframe */}
        <div className="flex-1 w-full relative">
          <iframe
            src="https://app.thinkstack.ai/bot/index.html?chatbot_id=6969f265adff167a1b7b759e&type=inline"
            frameBorder="0"
            width="100%"
            height="100%"
            className="absolute inset-0 w-full h-full"
            style={{ minHeight: '700px' }}
            title="SS Paw Pal AI Specialist"
          ></iframe>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col items-center gap-4 pt-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instant Response Mode</span>
          </div>
          <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Encrypted Environment</span>
          </div>
        </div>
        <p className="text-[9px] font-medium text-slate-400 max-w-md text-center leading-relaxed">
          Our AI uses advanced pet health models to provide support. For emergency medical conditions, please contact your local veterinarian immediately.
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;