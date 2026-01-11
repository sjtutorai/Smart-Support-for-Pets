
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
  Clock,
  Bell,
  BellOff,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleGenAI } from "@google/genai";

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

interface Reminder {
  id: string;
  type: 'feed' | 'walk' | 'sleep' | 'play';
  time: string;
  enabled: boolean;
}

const PetCare: React.FC = () => {
  const { user } = useAuth();
  const [pet, setPet] = useState<any>(null);
  const [stats, setStats] = useState({ hunger: 70, energy: 40, happiness: 85 });
  const [isAnimating, setIsAnimating] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  
  // Reminder State
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem(`reminders_${user?.uid}`);
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'feed', time: '08:00', enabled: true },
      { id: '2', type: 'walk', time: '17:30', enabled: true },
    ];
  });

  useEffect(() => {
    const saved = localStorage.getItem(`pet_${user?.uid}`);
    if (saved) setPet(JSON.parse(saved));
    
    // Request Notification Permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user]);

  // Sync reminders to localStorage
  useEffect(() => {
    localStorage.setItem(`reminders_${user?.uid}`, JSON.stringify(reminders));
  }, [reminders, user]);

  // Background Reminder Checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      reminders.forEach(reminder => {
        if (reminder.enabled && reminder.time === currentTime && !activeAlert) {
          triggerReminder(reminder);
        }
      });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders, activeAlert]);

  const triggerReminder = (reminder: Reminder) => {
    const labels = { feed: 'Meal Time', walk: 'Outdoor Walk', sleep: 'Nap Time', play: 'Play Session' };
    const msg = `It's time for ${pet?.name || 'your pet'}'s ${labels[reminder.type]}!`;
    
    setActiveAlert(msg);
    
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Smart Support Reminder", {
        body: msg,
        icon: "https://res.cloudinary.com/dazlddxht/image/upload/v1768111415/Smart_Support_for_Pets_tpteed.png"
      });
    }
  };

  const handleAction = (type: string) => {
    setIsAnimating(type);
    setTimeout(() => setIsAnimating(null), 2000);

    if (type === 'feed') setStats(s => ({ ...s, hunger: Math.min(100, s.hunger + 20) }));
    if (type === 'sleep') setStats(s => ({ ...s, energy: Math.min(100, s.energy + 30) }));
    if (type === 'walk') setStats(s => ({ ...s, happiness: Math.min(100, s.happiness + 20), energy: Math.max(0, s.energy - 15) }));
    if (type === 'play') setStats(s => ({ ...s, happiness: Math.min(100, s.happiness + 25), energy: Math.max(0, s.energy - 10) }));
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const addReminder = () => {
    const newR: Reminder = {
      id: Date.now().toString(),
      type: 'play',
      time: '12:00',
      enabled: true
    };
    setReminders([...reminders, newR]);
  };

  const removeReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const getAgeMessage = () => {
    if (!pet) return null;
    const years = parseInt(pet.ageYears || '0');
    const months = parseInt(pet.ageMonths || '0');
    const totalMonths = (years * 12) + months;

    if (totalMonths === 4 || totalMonths === 5) {
      return {
        title: "🌟 Critical 4-5 Month Window",
        content: `Development Alert: ${pet.name} needs frequent reminders! At this age, bladder control is still developing. Set a 'Walk' reminder every 3-4 hours and a 'Feed' reminder for smaller, frequent meals (3x daily).`,
        icon: Baby,
        color: "bg-amber-100 border-amber-200 text-amber-900"
      };
    } else if (totalMonths < 4) {
      return {
        title: "🍼 Early Development",
        content: "Reminders should be focused on short play bursts and long naps. Sleep is when they grow!",
        icon: Heart,
        color: "bg-indigo-50 border-indigo-100 text-indigo-900"
      };
    } else {
      return {
        title: "🐕 Adult Maintenance",
        content: "Stick to a routine. Adult pets thrive on consistency. Ensure at least one vigorous walk reminder per day.",
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

  const ageData = getAgeMessage();

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
      {/* Alert Banner */}
      {activeAlert && (
        <div className="bg-indigo-600 text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between animate-bounce-subtle">
           <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl"><Bell className="animate-ring" /></div>
              <p className="font-bold text-lg">{activeAlert}</p>
           </div>
           <button onClick={() => setActiveAlert(null)} className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-colors">Got it!</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Pet Care & Fun</h2>
          <p className="text-slate-500 font-medium">Interactive care, developmental goals, and smart reminders.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={askAiForTreat}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <Bot size={18} className="text-indigo-600" />
            AI Treat Finder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Interaction Zone */}
        <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden relative min-h-[500px] flex flex-col">
          <div className="p-10 text-center relative z-10 flex-1 flex flex-col justify-center">
            <div className="mb-10 relative inline-block mx-auto">
               <div className={`w-64 h-64 rounded-[5rem] bg-indigo-50 border-4 border-white shadow-2xl overflow-hidden mx-auto transition-all duration-500 ${isAnimating ? 'scale-110 rotate-3' : 'hover:scale-105'}`}>
                  <img src={`https://picsum.photos/seed/${pet?.name || 'buddy'}/600`} alt="Pet" className="w-full h-full object-cover" />
               </div>
               {isAnimating && (
                 <div className="absolute -top-6 -right-6 bg-white p-5 rounded-full shadow-2xl animate-bounce-subtle border border-slate-50">
                    {isAnimating === 'feed' && <Utensils className="text-indigo-600 w-8 h-8" />}
                    {isAnimating === 'sleep' && <Moon className="text-indigo-600 w-8 h-8" />}
                    {isAnimating === 'walk' && <Map className="text-indigo-600 w-8 h-8" />}
                    {isAnimating === 'play' && <Zap className="text-indigo-600 w-8 h-8" />}
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto w-full">
              {[
                { id: 'feed', icon: Utensils, label: 'Feed' },
                { id: 'sleep', icon: Moon, label: 'Sleep' },
                { id: 'walk', icon: Map, label: 'Walk' },
                { id: 'play', icon: Zap, label: 'Play' }
              ].map(action => (
                <button 
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className="p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-indigo-600 hover:text-white hover:shadow-2xl hover:shadow-indigo-100 transition-all group flex flex-col items-center gap-3 active:scale-90"
                >
                  <action.icon className="text-indigo-600 group-hover:text-white transition-colors" />
                  <span className="font-black text-[10px] uppercase tracking-widest">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {aiTip && (
            <div className="p-8 bg-slate-900 text-white animate-in slide-in-from-bottom-full duration-500 rounded-t-[3rem]">
               <div className="flex items-start gap-4 max-w-2xl mx-auto">
                 <div className="p-3 bg-white/20 rounded-2xl"><Bot size={24} /></div>
                 <div>
                    <h5 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-1">AI Recommendation</h5>
                    <p className="text-sm font-medium leading-relaxed italic">"{aiTip}"</p>
                 </div>
                 <button onClick={() => setAiTip(null)} className="text-white/40 hover:text-white ml-auto">✕</button>
               </div>
            </div>
          )}
        </div>

        {/* Sidebar: Reminders & Stats */}
        <div className="lg:col-span-4 space-y-10">
          {/* Smart Reminders */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xl text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Clock className="text-indigo-600 w-5 h-5" />
                Schedule
              </h3>
              <button 
                onClick={addReminder}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div className="space-y-3">
              {reminders.map(reminder => (
                <div key={reminder.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-200 transition-all">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    {reminder.type === 'feed' && <Utensils size={16} className="text-amber-500" />}
                    {reminder.type === 'walk' && <Map size={16} className="text-emerald-500" />}
                    {reminder.type === 'sleep' && <Moon size={16} className="text-indigo-500" />}
                    {reminder.type === 'play' && <Zap size={16} className="text-rose-500" />}
                  </div>
                  <div className="flex-1">
                    <select 
                      value={reminder.type}
                      onChange={(e) => updateReminder(reminder.id, { type: e.target.value as any })}
                      className="bg-transparent text-[10px] font-black uppercase text-slate-400 block outline-none mb-1"
                    >
                      <option value="feed">Feed</option>
                      <option value="walk">Walk</option>
                      <option value="sleep">Sleep</option>
                      <option value="play">Play</option>
                    </select>
                    <input 
                      type="time" 
                      value={reminder.time}
                      onChange={(e) => updateReminder(reminder.id, { time: e.target.value })}
                      className="bg-transparent font-bold text-slate-800 focus:text-indigo-600 outline-none text-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateReminder(reminder.id, { enabled: !reminder.enabled })}
                      className={`p-2 rounded-xl transition-all ${reminder.enabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}
                    >
                      {reminder.enabled ? <Bell size={16} /> : <BellOff size={16} />}
                    </button>
                    <button 
                      onClick={() => removeReminder(reminder.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {reminders.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4 italic">No reminders set. Click + to add one.</p>
              )}
            </div>
          </div>

          {/* Developmental Advice Card */}
          {ageData && (
            <div className={`p-8 rounded-[3rem] border-2 shadow-sm ${ageData.color} transition-all duration-500 hover:shadow-xl relative overflow-hidden group`}>
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <ageData.icon size={24} className="text-slate-800" />
                </div>
                <h4 className="font-black text-lg leading-tight tracking-tight">{ageData.title}</h4>
              </div>
              <p className="text-sm font-medium leading-relaxed opacity-90 relative z-10">{ageData.content}</p>
              
              <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 relative z-10">
                 <AlertCircle size={12} />
                 Adaptive Scheduling enabled
              </div>
            </div>
          )}

          {/* Stats Card */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <h3 className="font-black text-xl text-slate-800 uppercase tracking-widest">Companion Vitals</h3>
            <div className="space-y-6">
              <ProgressBar label="Fullness" value={stats.hunger} color="bg-amber-500" />
              <ProgressBar label="Energy" value={stats.energy} color="bg-indigo-600" />
              <ProgressBar label="Happiness" value={stats.happiness} color="bg-rose-500" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ring {
          0% { transform: rotate(0); }
          5% { transform: rotate(15deg); }
          10% { transform: rotate(-15deg); }
          15% { transform: rotate(10deg); }
          20% { transform: rotate(-10deg); }
          25% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        .animate-ring {
          animation: ring 2s infinite;
        }
        .animate-bounce-subtle {
          animation: bounceSubtle 3s infinite ease-in-out;
        }
        @keyframes bounceSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default PetCare;
