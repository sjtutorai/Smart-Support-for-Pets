
import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Moon, 
  CloudRain, 
  Wind, 
  Heart, 
  Baby, 
  Bot, 
  Zap,
  CheckCircle,
  AlertCircle,
  Map,
  Loader2,
  Dog
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleGenAI } from "@google/genai";
import { getPetsByOwnerId } from '../services/firebase';
// FIX: Import AppRoutes to resolve the reference error on line 141
import { AppRoutes } from '../types';

const ProgressBar: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-1000 ease-out`} 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const PetCare: React.FC = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<any>(null);
  const [stats, setStats] = useState({ hunger: 70, energy: 40, happiness: 85 });
  const [isAnimating, setIsAnimating] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const syncRegistry = async () => {
      setLoading(true);
      try {
        const remotePets = await getPetsByOwnerId(user.uid);
        if (remotePets.length > 0) {
          setPet(remotePets[0]);
        } else {
          // Fallback to local check
          const saved = localStorage.getItem(`pet_${user.uid}`) || localStorage.getItem(`ssp_pets_${user.uid}`);
          if (saved) {
             const parsed = JSON.parse(saved);
             setPet(Array.isArray(parsed) ? parsed[0] : parsed);
          }
        }
      } catch (err) {
        console.warn("Registry sync failed:", err);
      } finally {
        setLoading(false);
      }
    };

    syncRegistry();
  }, [user?.uid]);

  const handleAction = (type: string) => {
    setIsAnimating(type);
    setTimeout(() => setIsAnimating(null), 2000);

    if (type === 'feed') setStats(s => ({ ...s, hunger: Math.min(100, s.hunger + 20) }));
    if (type === 'sleep') setStats(s => ({ ...s, energy: Math.min(100, s.energy + 30) }));
    if (type === 'walk') setStats(s => ({ ...s, happiness: Math.min(100, s.happiness + 20), energy: Math.max(0, s.energy - 15) }));
    if (type === 'play') setStats(s => ({ ...s, happiness: Math.min(100, s.happiness + 25), energy: Math.max(0, s.energy - 10) }));
  };

  const getAgeMessage = () => {
    if (!pet) return null;
    const years = parseInt(pet.ageYears || '0');
    const months = parseInt(pet.ageMonths || '0');
    const totalMonths = (years * 12) + months;

    if (totalMonths === 4 || totalMonths === 5) {
      return {
        title: "🌟 Special Milestone: 4-5 Months Phase",
        content: `Your ${pet.species} is currently in a critical developmental stage! At ${totalMonths} months, expect significant teething behavior. Focus on gentle socialization, consistent potty training, and switching to high-protein juvenile food if you haven't already. Watch out for 'fear periods'—keep training positive and patient!`,
        icon: Baby,
        color: "bg-amber-100 border-amber-200 text-amber-900"
      };
    } else if (totalMonths < 4) {
      return {
        title: "🍼 Early Development",
        content: "Young pets need lots of sleep and small, frequent meals. Focus on bond-building and basic safety.",
        icon: Heart,
        color: "bg-indigo-50 border-indigo-100 text-indigo-900"
      };
    } else {
      return {
        title: "🐕 Growing Up Strong",
        content: "Maintain a steady exercise routine and watch for adult behavioral changes. Annual checkups are key!",
        icon: CheckCircle,
        color: "bg-emerald-50 border-emerald-100 text-emerald-900"
      };
    }
  };

  const askAiForTreat = async () => {
    if (!pet) return;
    setAiTip("Asking the experts...");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `My pet is a ${pet.breed} ${pet.species}, aged ${pet.ageYears} years and ${pet.ageMonths} months. What is a healthy, species-appropriate treat or activity I can give them right now? Keep it under 50 words.`,
      });
      setAiTip(response.text || "Fresh water and a gentle brush are always great!");
    } catch (e) {
      setAiTip("A simple cuddle is the best treat for any age!");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="animate-spin text-theme" size={40} />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="py-40 text-center animate-in zoom-in-95 duration-500">
        <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner"><Dog size={48} /></div>
        <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">No Registry Data</h3>
        <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto text-sm leading-relaxed">You must register a pet in the registry before accessing the care hub.</p>
        <button onClick={() => window.location.hash = AppRoutes.PET_PROFILE} className="bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95">
          Go to Registry
        </button>
      </div>
    );
  }

  const ageData = getAgeMessage();

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Pet Care Hub</h2>
          <p className="text-slate-500 font-medium">Keep {pet.name} happy, healthy, and energized.</p>
        </div>
        <button 
          onClick={askAiForTreat}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-xl"
        >
          <Bot size={18} />
          AI Treat Suggester
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Interaction Zone */}
        <div className="lg:col-span-2 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
          <div className="p-10 text-center relative z-10">
            <div className="mb-10 relative inline-block">
               <div className={`w-56 h-56 rounded-[5rem] bg-indigo-50 border-4 border-white shadow-2xl overflow-hidden mx-auto transition-all duration-500 ${isAnimating ? 'scale-110 rotate-3' : ''}`}>
                  <img src={pet.avatarUrl || `https://picsum.photos/seed/${pet.name}/600`} alt="Pet" className="w-full h-full object-cover" />
               </div>
               {isAnimating && (
                 <div className="absolute -top-4 -right-4 bg-white p-4 rounded-full shadow-2xl animate-bounce">
                    {isAnimating === 'feed' && <Utensils className="text-indigo-600" />}
                    {isAnimating === 'sleep' && <Moon className="text-indigo-600" />}
                    {isAnimating === 'walk' && <Map className="text-indigo-600" />}
                    {isAnimating === 'play' && <Zap className="text-indigo-600" />}
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => handleAction('feed')}
                className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-indigo-600 hover:text-white hover:shadow-xl hover:shadow-indigo-100 transition-all group flex flex-col items-center gap-3"
              >
                <Utensils className="text-indigo-600 group-hover:text-white" />
                <span className="font-black text-xs uppercase tracking-widest">Feed</span>
              </button>
              <button 
                onClick={() => handleAction('sleep')}
                className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-indigo-600 hover:text-white hover:shadow-xl hover:shadow-indigo-100 transition-all group flex flex-col items-center gap-3"
              >
                <Moon className="text-indigo-600 group-hover:text-white" />
                <span className="font-black text-xs uppercase tracking-widest">Sleep</span>
              </button>
              <button 
                onClick={() => handleAction('walk')}
                className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-indigo-600 hover:text-white hover:shadow-xl hover:shadow-indigo-100 transition-all group flex flex-col items-center gap-3"
              >
                <Map className="text-indigo-600 group-hover:text-white" />
                <span className="font-black text-xs uppercase tracking-widest">Walk</span>
              </button>
              <button 
                onClick={() => handleAction('play')}
                className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-indigo-600 hover:text-white hover:shadow-xl hover:shadow-indigo-100 transition-all group flex flex-col items-center gap-3"
              >
                <Zap className="text-indigo-600 group-hover:text-white" />
                <span className="font-black text-xs uppercase tracking-widest">Play</span>
              </button>
            </div>
          </div>
          
          {aiTip && (
            <div className="absolute inset-x-0 bottom-0 p-6 bg-slate-900 text-white animate-in slide-in-from-bottom-full duration-500">
               <div className="flex items-start gap-4 max-w-2xl mx-auto">
                 <div className="p-2 bg-white/20 rounded-xl"><Bot size={20} /></div>
                 <p className="text-sm font-medium leading-relaxed italic">"{aiTip}"</p>
                 <button onClick={() => setAiTip(null)} className="text-white/40 hover:text-white">✕</button>
               </div>
            </div>
          )}
        </div>

        {/* Stats and Age Advice */}
        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="font-black text-xl text-slate-800 uppercase tracking-widest">Current Vitals</h3>
            <div className="space-y-6">
              <ProgressBar label="Fullness" value={stats.hunger} color="bg-amber-500" />
              <ProgressBar label="Energy" value={stats.energy} color="bg-indigo-600" />
              <ProgressBar label="Happiness" value={stats.happiness} color="bg-rose-500" />
            </div>
          </div>

          {ageData && (
            <div className={`p-8 rounded-[3rem] border-2 shadow-sm ${ageData.color} transition-all duration-500 hover:shadow-md`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <ageData.icon size={24} className="text-slate-800" />
                </div>
                <h4 className="font-black text-lg leading-tight tracking-tight">{ageData.title}</h4>
              </div>
              <p className="text-sm font-medium leading-relaxed opacity-90">{ageData.content}</p>
              
              <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                 <AlertCircle size={12} />
                 Special developmental guidance
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="bg-indigo-50 p-10 rounded-[3.5rem] flex items-center gap-8">
            <div className="p-6 bg-white rounded-[2rem] shadow-xl text-indigo-600">
               <CloudRain size={40} />
            </div>
            <div>
               <h4 className="font-black text-2xl text-indigo-900 tracking-tight">Weather Check</h4>
               <p className="text-indigo-700 font-medium text-sm mt-1">Looks like it's a great day for an outdoor {pet.species === 'Dog' ? 'run' : 'patio session'}.</p>
            </div>
         </div>
         <div className="bg-slate-50 p-10 rounded-[3.5rem] flex items-center gap-8 border border-slate-100">
            <div className="p-6 bg-white rounded-[2rem] shadow-xl text-slate-400">
               <Wind size={40} />
            </div>
            <div>
               <h4 className="font-black text-2xl text-slate-800 tracking-tight">Clean Air Notice</h4>
               <p className="text-slate-500 font-medium text-sm mt-1">Indoor air quality is optimal. Perfect for a cozy long nap for {pet.name}.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PetCare;
