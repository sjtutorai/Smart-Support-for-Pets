
import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Stethoscope, 
  Brain, 
  Activity, 
  AlertCircle, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  FileText,
  Zap,
  ShieldAlert,
  ArrowLeft,
  RefreshCcw,
  ExternalLink,
  Search
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../context/AuthContext';
import { PetProfile } from '../types';

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'Health',
    urgency: 'Routine',
    details: '',
    symptoms: [] as string[]
  });

  const commonSymptoms = [
    'Loss of Appetite', 'Lethargy', 'Itching/Biting', 'Coughing', 
    'Vomiting', 'Diarrhea', 'Excessive Thirst', 'Limping', 
    'Anxiety', 'Aggression'
  ];

  useEffect(() => {
    const saved = localStorage.getItem(`ssp_pets_${user?.uid}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) setPet(parsed[0]);
    }
  }, [user]);

  const toggleSymptom = (s: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(s) 
        ? prev.symptoms.filter(item => item !== s) 
        : [...prev.symptoms, s]
    }));
  };

  const handleConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.details && formData.symptoms.length === 0) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    setReport(null);
    setGroundingChunks([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const petContext = pet ? `
        PET PROFILE CONTEXT:
        - Species: ${pet.species}
        - Breed: ${pet.breed}
        - Age: ${pet.ageYears}y ${pet.ageMonths}m
        - Health History: ${pet.healthNotes || 'None'}
      ` : 'Minimal pet data available.';

      const prompt = `
        DEEP CARE ANALYSIS REQUEST:
        ${petContext}
        Inquiry Category: ${formData.type}
        Urgency: ${formData.urgency}
        Symptoms: ${formData.symptoms.join(', ') || 'General'}
        Observations: ${formData.details}

        Generate a triage report using Google Search grounding for up-to-date vet standards.
        Include sections: ## Executive Summary, ## Potential Context, ## Recommended Steps, ## Red Flags.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: "You are a professional Pet Care Triage Assistant. Use Google Search to verify current veterinary standards. Do not diagnose; provide educational guidance and red flags.",
          temperature: 0.7,
        },
      });

      setReport(response.text || "Report generated without text.");
      setGroundingChunks(response.candidates?.[0]?.groundingMetadata?.groundingChunks || []);
    } catch (err: any) {
      console.error("AI Assistant Error:", err);
      setErrorMessage("Analysis interrupted. Please refine your query and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20">
      {report || errorMessage ? (
        <div className="space-y-8 animate-fade-in">
          <button 
            onClick={() => { setReport(null); setErrorMessage(null); }}
            className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all"
          >
            <ArrowLeft size={18} /> New Consultation
          </button>

          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className={`${errorMessage ? 'bg-rose-600' : 'bg-theme'} p-10 text-white flex justify-between items-center`}>
              <div className="flex items-center gap-6">
                <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-xl">
                  {errorMessage ? <ShieldAlert size={40} /> : <FileText size={40} />}
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">{errorMessage ? 'Error' : 'Triage Report'}</h2>
                  <p className="text-white/80 font-medium">Context: {pet?.name || 'Companion'}</p>
                </div>
              </div>
            </div>

            <div className="p-10 md:p-16">
              {errorMessage ? (
                <div className="text-center py-10">
                  <p className="text-rose-600 font-bold">{errorMessage}</p>
                  <button onClick={handleConsultation} className="mt-6 bg-slate-900 text-white px-8 py-4 rounded-2xl">Retry</button>
                </div>
              ) : (
                <div className="prose prose-indigo max-w-none">
                  <div className="text-slate-800 space-y-6">
                    {report?.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      if (trimmed.startsWith('##')) return <h3 key={i} className="text-2xl font-black text-slate-900 mt-8 mb-4">{trimmed.replace('##', '')}</h3>;
                      if (trimmed.startsWith('*') || trimmed.startsWith('-')) return <li key={i} className="ml-4 mb-2 font-medium text-slate-600 list-disc">{trimmed.replace(/^[\*\-]\s/, '')}</li>;
                      return <p key={i} className="text-slate-600 leading-relaxed text-lg">{trimmed}</p>;
                    })}
                  </div>

                  {/* Grounding Sources */}
                  {groundingChunks.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-slate-100 space-y-6">
                      <div className="flex items-center gap-3">
                        <Search size={20} className="text-theme" />
                        <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Verified Sources & Grounding</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groundingChunks.map((chunk, idx) => chunk.web && (
                          <a 
                            key={idx} 
                            href={chunk.web.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-theme hover:bg-white transition-all group flex items-start justify-between gap-4"
                          >
                            <span className="text-xs font-bold text-slate-600 line-clamp-2">{chunk.web.title || 'Medical Source'}</span>
                            <ExternalLink size={14} className="text-slate-300 group-hover:text-theme shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleConsultation} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-100 shadow-sm space-y-12">
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-theme-light rounded-2xl text-theme"><Stethoscope size={24} /></div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Consultation Details</h3>
                </div>
                <textarea 
                  required
                  value={formData.details}
                  onChange={e => setFormData({...formData, details: e.target.value})}
                  placeholder="Describe your observations..."
                  className="w-full h-64 bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 text-lg font-medium focus:ring-8 focus:ring-theme/10 outline-none transition-all resize-none shadow-inner"
                />
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><Activity size={24} /></div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Observed Symptoms</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {commonSymptoms.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSymptom(s)}
                      className={`px-6 py-3 rounded-full font-bold text-sm transition-all border ${
                        formData.symptoms.includes(s) 
                        ? 'bg-theme border-theme text-white shadow-lg' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-theme'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <button 
              type="submit"
              disabled={isLoading || (!formData.details && formData.symptoms.length === 0)}
              className="w-full py-8 bg-theme text-white rounded-[3rem] font-black text-2xl flex items-center justify-center gap-4 hover:bg-theme-hover transition-all shadow-2xl active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={32} /> : <>Generate Analysis <ChevronRight size={32} /></>}
            </button>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Model Config</h4>
              <div className="p-4 bg-theme-light rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-theme font-bold uppercase tracking-widest">
                  <Zap size={12} /> Gemini 3 Pro
                </div>
                <p className="font-black text-slate-800">Grounding Enabled</p>
                <p className="text-[10px] text-slate-500 font-medium">Verified by Google Search</p>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AIAssistant;
