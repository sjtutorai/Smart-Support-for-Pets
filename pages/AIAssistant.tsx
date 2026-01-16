import React, { useEffect } from 'react';
import { Bot, Sparkles, ShieldCheck, Zap } from 'lucide-react';

const AIAssistant: React.FC = () => {
  useEffect(() => {
    // Dynamically inject the ThinkStack Chatbot Loader
    const script = document.createElement('script');
    script.setAttribute('chatbot_id', '6969f265adff167a1b7b759e');
    script.setAttribute('data-type', 'default');
    script.src = 'https://app.thinkstack.ai/bot/thinkstackai-loader.min.js';
    script.async = true;
    
    document.body.appendChild(script);

    // Cleanup logic to remove the chatbot UI when leaving the page
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      
      // ThinkStack injects specific IDs into the DOM
      const elementsToCleanup = [
        'thinkstack-chat-window',
        'thinkstack-chat-window-toggler',
        'tcw-floatingWrapper'
      ];
      
      elementsToCleanup.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });

      if ((window as any).thinkstackai) {
        delete (window as any).thinkstackai;
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-20 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10 animate-fade-in">
      <div className="relative">
        {/* Visual representation of the AI Engine */}
        <div className="w-36 h-36 bg-theme-light rounded-[3.5rem] flex items-center justify-center text-theme shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] animate-pulse">
          <Bot size={72} />
        </div>
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
           <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">AI Concierge Live</h2>
        <p className="text-slate-500 font-medium max-w-lg mx-auto leading-relaxed text-lg">
          Our specialized pet health expert is ready to assist. 
          Please tap the <span className="text-theme font-black">Chat Bubble</span> in the bottom right corner to start your consultation.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <Sparkles size={16} className="text-theme" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ThinkStack v2.4</span>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Secure Protocol</span>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <Zap size={16} className="text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">High Priority</span>
        </div>
      </div>

      <div className="pt-12 flex flex-col items-center gap-4">
        <div className="flex gap-2">
           {[0, 1, 2].map(i => (
             <div 
                key={i} 
                className="w-2 h-2 rounded-full bg-theme/30 animate-bounce" 
                style={{ animationDelay: `${i * 0.15}s` }}
             />
           ))}
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Synchronizing with Specialist Engine</p>
      </div>
    </div>
  );
};

export default AIAssistant;