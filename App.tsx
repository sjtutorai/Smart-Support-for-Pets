import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import Layout from './components/Layout';
import { AppRoutes, PetProfile, WeightRecord, VaccinationRecord } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { GoogleGenAI } from "@google/genai";
import { syncPetToDb, getPetById } from './services/firebase';
import jsQR from 'jsqr';
import { 
  Dog, Plus, PawPrint, Weight, Palette, Fingerprint, 
  AlertCircle, Camera, Check, CheckCircle2, ChevronRight, Cat, Bird, Rabbit, 
  Trash2, Edit3, ArrowLeft, Stethoscope, Search, Star, MessageCircle,
  Heart, Fish, Bug, Thermometer, Droplets, Calendar, LineChart, Syringe, TrendingUp,
  Sparkles, Info, Quote, Upload, Loader2, Wand2, QrCode, Scan, X, ExternalLink, Save,
  Key, ShieldCheck, Globe, Brain, RefreshCcw, Image as ImageIcon,
  Send, UserPlus, Info as InfoIcon, Hash, ArrowRight, Activity, Trash
} from 'lucide-react';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const PetCare = lazy(() => import('./pages/PetCare'));
const Login = lazy(() => import('./pages/Login'));
const Settings = lazy(() => import('./pages/Settings'));
const Community = lazy(() => import('./pages/Community'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Chat = lazy(() => import('./pages/Chat'));
const FindFriends = lazy(() => import('./pages/FindFriends'));
const PublicPetProfile = lazy(() => import('./pages/PublicPetProfile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const UsernameDataStore = lazy(() => import('./pages/UsernameDataStore'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-theme" size={40} />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Authenticating Portal</span>
    </div>
  </div>
);

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

export const BREED_DATA: Record<string, string[]> = {
  Dog: ['Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'French Bulldog', 'Poodle', 'Beagle', 'Mixed Breed'],
  Cat: ['Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal', 'Mixed Breed'],
  Bird: ['African Grey Parrot', 'Cockatiel', 'Budgerigar', 'Macaw', 'Conure', 'Lovebird', 'Cockatoo'],
  Rabbit: ['Holland Lop', 'Mini Rex', 'Dutch Rabbit', 'Lionhead'],
  Hamster: ['Syrian Hamster', 'Dwarf Hamster', 'Roborovski Hamster'],
  'Guinea Pig': ['Abyssinian', 'American', 'Peruvian', 'Teddy'],
  Other: ['Exotic Pet', 'Wild Animal', 'Invertebrate']
};

export const PET_CATEGORIES = [
  { id: 'mammal', name: 'Mammals', icon: Dog, species: ['Dog', 'Cat', 'Rabbit', 'Hamster', 'Guinea Pig'] },
  { id: 'bird', name: 'Birds', icon: Bird, species: ['African Grey Parrot', 'Cockatiel', 'Budgerigar', 'Macaw', 'Conure'] },
  { id: 'fish', name: 'Fish', icon: Fish, species: ['Goldfish', 'Betta Fish', 'Guppy'] },
  { id: 'reptile', name: 'Reptiles', icon: Thermometer, species: ['Turtle', 'Tortoise', 'Lizard'] },
];

const calculateAge = (birthday: string) => {
  if (!birthday) return { years: 0, months: 0 };
  const birthDate = new Date(birthday);
  const today = new Date();
  if (birthDate > today) return { years: 0, months: 0 };
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0) { years--; months += 12; }
  return { years: Math.max(0, years), months: Math.max(0, months) };
};

const PetProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetProfile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingRecord, setIsAddingRecord] = useState<'vaccine' | 'weight' | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [newPet, setNewPet] = useState<Partial<PetProfile>>({ name: '', breed: '', birthday: '', bio: '', species: 'Dog', weightHistory: [], vaccinations: [] });
  const [newRecord, setNewRecord] = useState({ name: '', date: new Date().toISOString().split('T')[0], weight: '', nextDueDate: '' });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const saved = localStorage.getItem(`ssp_pets_${user.uid}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPets(parsed);
        if (parsed.length > 0 && !selectedPet) setSelectedPet(parsed[0]);
      } catch (e) { /* silent fail */ }
    }
  }, [user?.uid]);

  const savePetsToStorage = async (updatedPets: PetProfile[]) => {
    if (!user?.uid) return;
    localStorage.setItem(`ssp_pets_${user.uid}`, JSON.stringify(updatedPets));
    setPets(updatedPets);
    for (const pet of updatedPets) await syncPetToDb(pet);
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const id = `SSP-${Date.now()}`;
    const { years, months } = calculateAge(newPet.birthday || '');
    const completePet: PetProfile = { 
        ...newPet as PetProfile, 
        id, 
        ownerId: user.uid, 
        ownerName: user.displayName || 'Parent', 
        ageYears: String(years), 
        ageMonths: String(months), 
        weightHistory: [], 
        vaccinations: [], 
        isPublic: true,
        lowercaseName: newPet.name?.toLowerCase() || ''
    };
    const updatedPets = [...pets, completePet];
    await savePetsToStorage(updatedPets);
    setSelectedPet(completePet);
    setSaveSuccess(true);
    setTimeout(() => { setIsAdding(false); setSaveSuccess(false); setStep(1); }, 1500);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return;

    let updatedPet = { ...selectedPet };
    if (isAddingRecord === 'vaccine') {
      const v: VaccinationRecord = { name: newRecord.name, date: newRecord.date, nextDueDate: newRecord.nextDueDate };
      updatedPet.vaccinations = [...(updatedPet.vaccinations || []), v];
    } else {
      const w: WeightRecord = { date: newRecord.date, weight: parseFloat(newRecord.weight) };
      updatedPet.weightHistory = [...(updatedPet.weightHistory || []), w];
    }

    const updatedPets = pets.map(p => p.id === selectedPet.id ? updatedPet : p);
    await savePetsToStorage(updatedPets);
    setSelectedPet(updatedPet);
    setIsAddingRecord(null);
    setNewRecord({ name: '', date: new Date().toISOString().split('T')[0], weight: '', nextDueDate: '' });
    addNotification('Record Added', 'Health logs updated successfully.', 'success');
  };

  const generateAIAvatar = async (base64Source?: string) => {
    if (!selectedPet) return;
    
    setIsGeneratingAvatar(true);
    setShowKeyPrompt(false);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const petDetails = `${selectedPet.breed || ''} ${selectedPet.species}`.trim();
      const prompt = `A cinematic, ultra-high-quality professional studio avatar portrait of a ${petDetails} named ${selectedPet.name}. Detailed feathers, vibrant colors, studio lighting, blurred background, 4K detail.`;
      
      const parts: any[] = [{ text: prompt }];
      if (base64Source) {
        parts.push({ inlineData: { data: base64Source.split(',')[1], mimeType: 'image/png' } });
      }

      const response = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash-image', 
        contents: { parts }, 
        config: { imageConfig: { aspectRatio: "1:1" } } 
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const avatarUrl = `data:image/png;base64,${part.inlineData.data}`;
            const updatedPet = { ...selectedPet, avatarUrl };
            const updatedPets = pets.map(p => p.id === selectedPet.id ? updatedPet : p);
            await savePetsToStorage(updatedPets);
            setSelectedPet(updatedPet);
            addNotification('AI Magic', 'Custom avatar generated!', 'success');
            break;
          }
        }
      }
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      addNotification('Studio Error', 'Check connection and try again.', 'error');
    } finally { 
      setIsGeneratingAvatar(false); 
    }
  };

  const handleScanClick = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      qrFileInputRef.current?.click();
    } else {
      qrFileInputRef.current?.click();
    }
  };

  const handleFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsScanning(false);
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          const petId = code.data;
          try {
            const petData = await getPetById(petId);
            if (petData) {
              addNotification('ID Identified', `Profile retrieved for ${petData.name}`, 'success');
              const userPet = pets.find(p => p.id === petData.id);
              if (userPet) {
                setSelectedPet(userPet);
                setIsAdding(false);
              } else {
                navigate(`/pet/${petData.id}`);
              }
            }
          } catch (err) {
            addNotification('Retrieval Failed', 'Could not verify ID.', 'error');
          }
        }
        setIsScanning(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Companion Registry</h2>
          <p className="text-slate-500 font-medium text-sm">Manage profiles and wellness records.</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="file" ref={qrFileInputRef} className="hidden" accept="image/*" onChange={handleFileScan} />
          <button onClick={handleScanClick} disabled={isScanning} className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50">
            {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Scan size={18} />} 
            {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Scan ID' : 'Upload ID'}
          </button>
          <button onClick={() => { setStep(1); setIsAdding(true); }} className="flex items-center gap-2 px-6 py-3.5 bg-theme text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-theme-hover transition-all shadow-xl shadow-theme/10 active:scale-95">
            <Plus size={18} /> Register Companion
          </button>
        </div>
      </div>

      <div className="gap-3 overflow-x-auto pb-4 scroll-hide flex">
        {pets.map(p => (
          <button 
            key={p.id} 
            onClick={() => { setSelectedPet(p); setIsAdding(false); setShowKeyPrompt(false); setIsAddingRecord(null); }} 
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all shrink-0 ${selectedPet?.id === p.id && !isAdding ? 'bg-theme-light border-theme shadow-sm scale-105' : 'bg-white border-transparent hover:bg-slate-50'}`}
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
              {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : <PawPrint size={14} className="text-slate-300" />}
            </div>
            <span className={`font-black text-[10px] uppercase tracking-widest ${selectedPet?.id === p.id && !isAdding ? 'text-theme' : 'text-slate-500'}`}>{p.name}</span>
          </button>
        ))}
      </div>

      {isAdding ? (
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
          {saveSuccess && <div className="absolute inset-0 bg-theme/95 flex flex-col items-center justify-center z-50 text-white animate-in fade-in"><CheckCircle2 size={48} /><h3 className="text-2xl font-black mt-2">Companion Registered</h3></div>}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900">Step {step}: {step === 1 ? 'Select Domain' : step === 2 ? 'Species' : 'Identity'}</h2>
            <button onClick={() => setIsAdding(false)} className="p-2 text-slate-300 hover:text-slate-500"><X size={20} /></button>
          </div>
          {step === 1 ? (
            <div className="grid grid-cols-2 gap-4">
              {PET_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCategory(cat); setStep(2); }} className="p-10 rounded-3xl bg-slate-50 hover:bg-theme-light hover:text-theme transition-all flex flex-col items-center gap-4 group">
                  <cat.icon size={48} className="group-hover:scale-110 transition-transform" />
                  <span className="font-black text-[10px] uppercase tracking-widest">{cat.name}</span>
                </button>
              ))}
            </div>
          ) : step === 2 ? (
            <div className="grid grid-cols-2 gap-3">
              {selectedCategory?.species.map((s: string) => (
                <button key={s} onClick={() => { setNewPet({ ...newPet, species: s, breed: BREED_DATA[s]?.[0] || 'Unknown' }); setStep(3); }} className="p-4 rounded-xl border border-slate-100 hover:bg-slate-50 font-bold text-slate-700 text-sm">{s}</button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleAddPet} className="space-y-6">
              <input required value={newPet.name} onChange={e => setNewPet({ ...newPet, name: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-theme/5 font-bold" placeholder="Companion's Name" />
              <input type="date" required value={newPet.birthday} onChange={e => setNewPet({ ...newPet, birthday: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-theme/5 font-bold" />
              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all">Complete Registration</button>
            </form>
          )}
        </div>
      ) : selectedPet ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-xl text-center space-y-6 relative overflow-hidden group">
              <div className="w-52 h-52 rounded-[3.5rem] overflow-hidden mx-auto shadow-2xl relative border-4 border-white transition-all duration-500 hover:scale-[1.02]">
                {selectedPet.avatarUrl ? (
                  <img src={selectedPet.avatarUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                    <Dog size={64} />
                  </div>
                )}
                
                {isGeneratingAvatar && (
                  <div className="absolute inset-0 bg-white/40 flex flex-col items-center justify-center backdrop-blur-md">
                    <Loader2 size={32} className="animate-spin text-theme mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-theme">Designing...</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-center">
                <button onClick={() => fileInputRef.current?.click()} className="p-3.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 shadow-sm text-slate-500 transition-all hover:text-theme" title="Upload Reference">
                  <Camera size={20} />
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => generateAIAvatar(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </button>
                <button onClick={() => generateAIAvatar()} disabled={isGeneratingAvatar} className="p-3.5 rounded-xl shadow-lg transition-all bg-slate-900 text-theme hover:bg-black" title="Generate AI Avatar">
                  <Wand2 size={20} />
                </button>
              </div>

              <div className="space-y-1 pb-4">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedPet.name}</h3>
                <p className="text-[10px] font-black text-theme uppercase tracking-[0.2em]">{selectedPet.breed} · {selectedPet.species}</p>
                <div className="inline-block mt-4 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  ID: {selectedPet.id}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm min-h-[500px] flex flex-col">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-slate-900 text-theme rounded-xl shadow-md"><Brain size={24} /></div>
                 <div>
                   <h4 className="font-black text-xl text-slate-900 leading-none">Health Intelligence</h4>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Medical records & AI Insights</p>
                 </div>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => setIsAddingRecord('weight')} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">+ Log Weight</button>
                 <button onClick={() => setIsAddingRecord('vaccine')} className="px-4 py-2 bg-theme text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-theme/10 hover:bg-theme-hover">+ Add Vaccine</button>
               </div>
             </div>

             {isAddingRecord ? (
               <form onSubmit={handleAddRecord} className="flex-1 bg-slate-50/50 rounded-3xl p-8 border border-slate-100 space-y-6 animate-in slide-in-from-top-4">
                 <div className="flex items-center justify-between mb-2">
                   <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest">Add {isAddingRecord === 'vaccine' ? 'Vaccination' : 'Weight Entry'}</h5>
                   <button type="button" onClick={() => setIsAddingRecord(null)}><X size={16} className="text-slate-400" /></button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Date</label>
                     <input type="date" required value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-100 font-bold text-sm" />
                   </div>
                   {isAddingRecord === 'vaccine' ? (
                     <>
                       <div className="space-y-1.5">
                         <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Vaccine Name</label>
                         <input required placeholder="e.g. Parvovirus" value={newRecord.name} onChange={e => setNewRecord({...newRecord, name: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-100 font-bold text-sm" />
                       </div>
                       <div className="space-y-1.5">
                         <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Next Due Date</label>
                         <input type="date" required value={newRecord.nextDueDate} onChange={e => setNewRecord({...newRecord, nextDueDate: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-100 font-bold text-sm" />
                       </div>
                     </>
                   ) : (
                     <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Weight (KG)</label>
                       <input type="number" step="0.1" required placeholder="0.0" value={newRecord.weight} onChange={e => setNewRecord({...newRecord, weight: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-100 font-bold text-sm" />
                     </div>
                   )}
                 </div>
                 <button type="submit" className="w-full py-4 bg-slate-900 text-theme rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Save Health Record</button>
               </form>
             ) : (selectedPet.vaccinations?.length || 0) + (selectedPet.weightHistory?.length || 0) > 0 ? (
               <div className="flex-1 space-y-6">
                 {selectedPet.vaccinations && selectedPet.vaccinations.length > 0 && (
                   <div className="space-y-3">
                     <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Syringe size={14}/> Vaccinations</h5>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {selectedPet.vaccinations.map((v, i) => (
                         <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div>
                              <p className="font-black text-slate-800 text-sm">{v.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Admin: {v.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-black text-theme uppercase tracking-widest">Next Due</p>
                              <p className="text-[10px] font-black text-slate-700 mt-0.5">{v.nextDueDate}</p>
                            </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 {selectedPet.weightHistory && selectedPet.weightHistory.length > 0 && (
                   <div className="space-y-3">
                     <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><TrendingUp size={14}/> Weight Logs</h5>
                     <div className="flex gap-3 overflow-x-auto pb-2 scroll-hide">
                       {selectedPet.weightHistory.map((w, i) => (
                         <div key={i} className="p-4 bg-white rounded-2xl border border-slate-100 flex flex-col items-center shrink-0 min-w-[100px] shadow-sm">
                            <p className="text-xl font-black text-slate-900">{w.weight} <span className="text-[10px] text-slate-400">kg</span></p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{w.date}</p>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-200">
                    <Stethoscope size={32} />
                  </div>
                  <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-[10px]">No medical logs recorded for {selectedPet.name}</p>
                  <button onClick={() => setIsAddingRecord('vaccine')} className="mt-6 text-theme font-black text-[10px] uppercase tracking-widest hover:underline">+ Add First Record</button>
               </div>
             )}
          </div>
        </div>
      ) : (
        <div className="py-40 text-center animate-in zoom-in-95 duration-500">
          <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner">
            <Dog size={48} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Companion Network Offline</h3>
          <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto text-sm leading-relaxed">
            Register your first companion to unlock AI health tracking.
          </p>
          <button onClick={() => { setStep(1); setIsAdding(true); }} className="bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95">
            Start Registration
          </button>
        </div>
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  useEffect(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('fade-out');
      setTimeout(() => preloader.remove(), 500);
    }
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path={AppRoutes.HOME} element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path={AppRoutes.AI_ASSISTANT} element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path={AppRoutes.PET_CARE} element={<ProtectedRoute><PetCare /></ProtectedRoute>} />
        <Route path={AppRoutes.HEALTH_CHECKUP} element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path={AppRoutes.SETTINGS} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path={AppRoutes.PET_PROFILE} element={<ProtectedRoute><PetProfilePage /></ProtectedRoute>} />
        <Route path={AppRoutes.CREATE_POST} element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path={AppRoutes.CHAT} element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path={AppRoutes.FIND_FRIENDS} element={<ProtectedRoute><FindFriends /></ProtectedRoute>} />
        <Route path="/pet/:petId" element={<ProtectedRoute><PublicPetProfile /></ProtectedRoute>} />
        <Route path="/user/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/usernamedatastore" element={<ProtectedRoute><UsernameDataStore /></ProtectedRoute>} />
        <Route path={AppRoutes.TERMS} element={<ProtectedRoute><Terms /></ProtectedRoute>} />
        <Route path={AppRoutes.PRIVACY} element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => (
  <Router>
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  </Router>
);

export default App;
