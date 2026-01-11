
import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Search, 
  Stethoscope, 
  Brain, 
  Activity, 
  AlertCircle, 
  ChevronRight, 
  ClipboardCheck, 
  Loader2,
  CheckCircle2,
  FileText,
  Clock,
  Zap,
  ShieldAlert,
  ArrowLeft,
  RefreshCcw
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../context/AuthContext';

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Form State
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
    const saved = localStorage.getItem(`pet_${user?.uid}`);
    if (saved) setPet(JSON.parse(saved));
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
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        PET CARE TRIAGE REQUEST:
        Pet Name: ${pet?.name || 'Companion'}
        Species: ${pet?.species || 'Unknown'}
        Breed: ${pet?.breed || 'Unknown'}
        Age: ${pet?.ageYears}y ${pet?.ageMonths}m
        Inquiry Category: ${formData.type}
        Urgency Context: ${formData.urgency}
        Selected Symptoms: ${formData.symptoms.join(', ') || 'General Checkup'}
        Detailed Observations: ${formData.details}

        Please generate a professional triage report for the owner. 
        Ensure you focus on educational guidance and next steps.
        Headers to include:
        ## Executive Summary
        ## Potential Context & Considerations
        ## Recommended At-Home Care
        ## Clinical Observation Guide (When to visit a vet)
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a professional Veterinary Triage Assistant for the 'Smart Support for Pets' platform. Your goal is to provide owners with structured educational information based on their pet's symptoms. You are NOT a veterinarian, you do not diagnose, and you do not prescribe. Always start by stating you are an AI support tool. If any symptoms sound urgent (difficulty breathing, severe trauma, unconsciousness), your top priority is directing them to the nearest 24/7 ER immediately.",
          temperature: 0.6,
          topP: 0.9,
          topK: 40
        },
      });

      const text = response.text;
      if (!text) throw new Error("The AI could not generate a report based on the safety protocols. Please try rephrasing your observations.");
      
      setReport(text);
    } catch (err: any) {
      console.error("AI Assistant Error:", err);
      setErrorMessage(err.message || "We encountered an unexpected error. This can sometimes happen if our safety filters detect a highly sensitive medical situation. Please try again with different details or consult a professional.");
    } finally {
      setIsLoading(false);
    }
  };

  if (report || errorMessage) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
        <button 
          onClick={() => { setReport(null); setErrorMessage(null); }}
          className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          Start New Consultation
        </button>

        <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className={`${errorMessage ? 'bg-rose-600' : 'bg-indigo-600'} p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6 transition-colors duration-500`}>
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-xl">
                {errorMessage ? <ShieldAlert size={40} /> : <FileText size={40} />}
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">{errorMessage ? 'Consultation Error' : 'Analysis Report'}</h2>
                <p className="text-white/80 font-medium">
                  {errorMessage ? 'Process Interrupted' : `Professional Intake for ${pet?.name || 'Companion'}`}
                </p>
              </div>
            </div>
            {!errorMessage && (
              <div className="flex items-center gap-2 px-6 py-2 bg-white/10 rounded-full border border-white/20 text-xs font-black uppercase tracking-widest">
                <CheckCircle2 size={14} /> AI-Verified Triage
              </div>
            )}
          </div>

          <div className="p-10 md:p-16">
            {errorMessage ? (
              <div className="space-y-8 text-center py-10">
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem] max-w-xl mx-auto">
                   <h3 className="text-rose-900 font-black text-xl mb-3">Generation Failed</h3>
                   <p className="text-rose-700 font-medium leading-relaxed">{errorMessage}</p>
                </div>
                <button 
                  onClick={handleConsultation}
                  className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all active:scale-95"
                >
                  <RefreshCcw size={18} /> Try Re-Generating
                </button>
              </div>
            ) : (
              <div className="prose prose-indigo max-w-none">
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-10 flex gap-6 items-start">
                   <div className="p-3 bg-white rounded-2xl shadow-sm">
                     <Bot className="text-indigo-600" size={24} />
                   </div>
                   <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Platform Summary</h4>
                      <p className="text-slate-600 leading-relaxed font-medium italic">
                        Our intelligence engine has processed the inputs for your {pet?.breed || pet?.species || 'pet'}. Review the findings below.
                      </p>
                   </div>
                </div>
                
                <div className="markdown-content text-slate-800 space-y-6">
                  {report?.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('##')) return <h3 key={i} className="text-2xl font-black text-slate-900 mt-10 mb-4">{trimmed.replace('##', '')}</h3>;
                    if (trimmed.startsWith('#')) return <h2 key={i} className="text-3xl font-black text-slate-900 mt-12 mb-6">{trimmed.replace('#', '')}</h2>;
                    if (trimmed.startsWith('*') || trimmed.startsWith('-')) return <li key={i} className="ml-4 mb-2 font-medium text-slate-600 list-disc">{trimmed.replace(/^[\*\-]\s/, '')}</li>;
                    if (trimmed === '') return null;
                    return <p key={i} className="text-slate-600 leading-relaxed text-lg">{trimmed}</p>;
                  })}
                </div>
              </div>
            )}

            <div className="mt-16 p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-start gap-6">
               <div className="p-4 bg-white rounded-3xl text-amber-500 shadow-sm flex-shrink-0">
                 <ShieldAlert size={32} />
               </div>
               <div>
                  <h4 className="text-xl font-black text-amber-900 tracking-tight mb-2">Legal Disclaimer</h4>
                  <p className="text-amber-700/90 text-sm font-medium leading-relaxed">
                    This consultation is generated by an Artificial Intelligence and is meant for <b>educational support only</b>. It is not a replacement for professional veterinary diagnosis or treatment. If your pet is in distress, please contact a 24/7 emergency clinic immediately.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest mb-2">
            Professional AI Consultation
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Diagnostic Intake</h2>
          <p className="text-slate-500 font-medium text-lg">Structured health assessment for {pet?.name || 'your pet'}.</p>
        </div>
        {!pet && (
           <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-3xl">
              <AlertCircle className="text-amber-500" />
              <p className="text-sm font-bold text-amber-900">Limited accuracy: Missing pet profile data.</p>
           </div>
        )}
      </div>

      <form onSubmit={handleConsultation} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-100 shadow-sm space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Stethoscope size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Main Concern</h3>
              </div>
              <textarea 
                required
                value={formData.details}
                onChange={e => setFormData({...formData, details: e.target.value})}
                placeholder="Ex: My pet is refusing food and hiding under the bed. This behavior started this morning after breakfast..."
                className="w-full h-64 bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 text-lg font-medium focus:ring-8 focus:ring-indigo-100 focus:bg-white outline-none transition-all resize-none shadow-inner"
              />
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                  <Activity size={24} />
                </div>
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
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-400'
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
            className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-2xl flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={32} />
                Synthesizing Data...
              </>
            ) : (
              <>
                Analyze & Generate Report
                <ChevronRight size={32} />
              </>
            )}
          </button>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Intake Metadata</h4>
            
            <div className="space-y-4">
              <label className="text-sm font-black text-slate-700 block">Consultation Mode</label>
              <div className="grid grid-cols-1 gap-2">
                {['Health', 'Behavior', 'Nutrition'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, type})}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 font-bold transition-all ${
                      formData.type === type 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {type}
                    {formData.type === type && <CheckCircle2 size={18} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <label className="text-sm font-black text-slate-700 block">Pet Parent Urgency</label>
              <div className="flex flex-col gap-2">
                {['Routine', 'Moderate', 'Urgent'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({...formData, urgency: level})}
                    className={`p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                      formData.urgency === level 
                      ? level === 'Urgent' ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-6 relative overflow-hidden shadow-2xl">
             <Brain className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5" />
             <div className="flex items-center gap-3">
               <Zap className="text-amber-400" size={24} />
               <h4 className="font-black text-lg">AI Triage Active</h4>
             </div>
             <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Our model specifically checks for breed-specific predispositions and common life-stage risks for {pet?.breed || 'your pet'}.
             </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AIAssistant;
