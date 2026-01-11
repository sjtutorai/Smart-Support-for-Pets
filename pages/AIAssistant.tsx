
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
  ArrowLeft
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../context/AuthContext';

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  
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
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        PROFESSIONAL PET CONSULTATION REQUEST:
        Pet Name: ${pet?.name || 'Unknown'}
        Species: ${pet?.species || 'Unknown'}
        Breed: ${pet?.breed || 'Unknown'}
        Age: ${pet?.ageYears}y ${pet?.ageMonths}m
        Consultation Type: ${formData.type}
        Urgency Level: ${formData.urgency}
        Observed Symptoms: ${formData.symptoms.join(', ') || 'None selected'}
        Detailed Situation: ${formData.details}

        Please provide a structured report in Markdown. 
        Include:
        1. **Assessment Summary**
        2. **Potential Causes**
        3. **Immediate At-Home Steps**
        4. **Clinical Signs to Watch For**
        5. **Professional Recommendation** (Be clear if a vet visit is needed).
        Keep the tone professional, authoritative yet empathetic.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });

      setReport(response.text || "Could not generate report.");
    } catch (err) {
      console.error(err);
      setReport("## Error Generating Report\nPlease try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  if (report) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
        <button 
          onClick={() => setReport(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all"
        >
          <ArrowLeft size={18} /> New Consultation
        </button>

        <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-xl">
                <FileText size={40} />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">Consultation Report</h2>
                <p className="text-indigo-100 font-medium">Generated for {pet?.name} • {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div className="px-6 py-2 bg-white/10 rounded-full border border-white/20 text-xs font-black uppercase tracking-widest">
              AI Analysis Verified
            </div>
          </div>

          <div className="p-10 md:p-16 prose prose-indigo max-w-none">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-10 flex gap-6 items-start">
               <div className="p-3 bg-white rounded-2xl shadow-sm">
                 <Bot className="text-indigo-600" size={24} />
               </div>
               <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Executive Summary</h4>
                  <p className="text-slate-600 leading-relaxed font-medium italic">
                    Based on the provided symptoms (${formData.symptoms.join(', ') || 'General concerns'}), our AI has compiled the following assessment for your ${pet?.breed}.
                  </p>
               </div>
            </div>
            
            <div className="markdown-content text-slate-800 space-y-4">
              {report.split('\n').map((line, i) => {
                if (line.startsWith('##')) return <h3 key={i} className="text-2xl font-black text-slate-900 mt-8 mb-4">{line.replace('##', '')}</h3>;
                if (line.startsWith('#')) return <h2 key={i} className="text-3xl font-black text-slate-900 mt-10 mb-6">{line.replace('#', '')}</h2>;
                if (line.startsWith('*') || line.startsWith('-')) return <li key={i} className="ml-4 mb-2 font-medium text-slate-600">{line.replace(/^[\*\-]\s/, '')}</li>;
                return <p key={i} className="text-slate-600 leading-relaxed mb-4">{line}</p>;
              })}
            </div>

            <div className="mt-16 p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 flex items-start gap-6">
               <div className="p-4 bg-white rounded-3xl text-rose-500 shadow-sm flex-shrink-0">
                 <ShieldAlert size={32} />
               </div>
               <div>
                  <h4 className="text-xl font-black text-rose-900 tracking-tight mb-2">Disclaimer</h4>
                  <p className="text-rose-700/80 text-sm font-medium leading-relaxed">
                    This report is for informational purposes only and does not constitute veterinary medical advice. If {pet?.name} is experiencing a life-threatening emergency, proceed to the nearest emergency clinic immediately.
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
            Intelligence v3.0
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">AI Pet Intake</h2>
          <p className="text-slate-500 font-medium text-lg">Detailed consultation for {pet?.name || 'your pet'}.</p>
        </div>
        {!pet && (
           <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-3xl">
              <AlertCircle className="text-amber-500" />
              <p className="text-sm font-bold text-amber-900">Please register a pet profile for better accuracy.</p>
           </div>
        )}
      </div>

      <form onSubmit={handleConsultation} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Main Context Card */}
          <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-slate-100 shadow-sm space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Stethoscope size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Describe the Situation</h3>
              </div>
              <textarea 
                required
                value={formData.details}
                onChange={e => setFormData({...formData, details: e.target.value})}
                placeholder="Ex: My pet has been acting lethargic for the past 2 days and isn't eating their usual kibble..."
                className="w-full h-64 bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 text-lg font-medium focus:ring-8 focus:ring-indigo-50 focus:bg-white outline-none transition-all resize-none"
              />
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                  <Activity size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Select Symptoms</h3>
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
            disabled={isLoading}
            className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-2xl flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 active:scale-95 disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={32} />
                Analyzing Data...
              </>
            ) : (
              <>
                Generate Assessment Report
                <ChevronRight size={32} />
              </>
            )}
          </button>
        </div>

        {/* Configuration Sidebar */}
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Consultation Parameters</h4>
            
            <div className="space-y-4">
              <label className="text-sm font-black text-slate-700 block">Inquiry Type</label>
              <div className="grid grid-cols-1 gap-2">
                {['Health', 'Behavior', 'Diet', 'Training'].map(type => (
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
              <label className="text-sm font-black text-slate-700 block">Urgency Level</label>
              <div className="flex flex-col gap-2">
                {['Routine', 'Moderate', 'Urgent'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({...formData, urgency: level})}
                    className={`p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                      formData.urgency === level 
                      ? level === 'Urgent' ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
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
               <h4 className="font-black text-lg">Smart Insights</h4>
             </div>
             <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Our AI uses pet-specific medical datasets to provide reasoning. For {pet?.breed || 'your pet'}, factors like age and typical breed concerns are weighted heavily in the assessment.
             </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AIAssistant;
