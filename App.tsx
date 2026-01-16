import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import Layout from './components/Layout';
import { AppRoutes, PetProfile, WeightRecord, VaccinationRecord } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { GoogleGenAI } from "@google/genai";
import { syncPetToDb, getPetById } from './services/firebase';
import { 
  Dog, Plus, PawPrint, Weight, Palette, Fingerprint, 
  AlertCircle, Camera, Check, CheckCircle2, ChevronRight, Cat, Bird, Rabbit, 
  Trash2, Edit3, ArrowLeft, Stethoscope, Search, Star, MessageCircle,
  Heart, Fish, Bug, Thermometer, Droplets, Calendar, LineChart, Syringe, TrendingUp,
  Sparkles, Info, Quote, Upload, Loader2, Wand2, QrCode, Scan, X, ExternalLink, Save,
  Key, ShieldCheck, Globe, User as UserIconLucide, Brain, RefreshCcw, Image as ImageIcon,
  Send, UserPlus, Info as InfoIcon, Hash, ArrowRight
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const PageLoader = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <Loader2 className="animate-spin text-theme" size={48} />
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
  Rabbit: ['Holland Lop', 'Mini Rex', 'Dutch Rabbit', 'Lionhead'],
  Hamster: ['Syrian Hamster', 'Dwarf Hamster', 'Roborovski Hamster'],
  'Guinea Pig': ['Abyssinian', 'American', 'Peruvian', 'Teddy'],
  Mouse: ['Fancy Mouse', 'Spiny Mouse'],
  Rat: ['Fancy Rat', 'Dumbo Rat', 'Hairless Rat'],
  Ferret: ['Sable', 'Albino', 'Silver Mitt'],
  Horse: ['Thoroughbred', 'Quarter Horse', 'Arabian', 'Appaloosa'],
  Goat: ['Nigerian Dwarf', 'Pygmy Goat', 'Alpine'],
  Pig: ['Mini Pig', 'Pot-bellied Pig', 'Kunekune'],
  Parrot: ['African Grey', 'Amazon Parrot', 'Macaw', 'Cockatoo'],
  Parakeet: ['Budgie', 'Monk Parakeet', 'Indian Ringneck'],
  Cockatiel: ['Grey', 'Lutino', 'Pied', 'Pearl'],
  Lovebird: ['Peach-faced', 'Fischer\'s Lovebird', 'Masked Lovebird'],
  Canary: ['Yellow Canary', 'Red Factor Canary', 'Gloster Canary'],
  Finch: ['Zebra Finch', 'Society Finch', 'Gouldian Finch'],
  Pigeon: ['Homing Pigeon', 'Fantail Pigeon', 'Racing Homer'],
  Goldfish: ['Comet', 'Fantail', 'Oranda', 'Shubunkin'],
  'Betta Fish': ['Veiltail', 'Crowntail', 'Halfmoon'],
  Guppy: ['Fancy Guppy', 'Endler Guppy', 'Cobra Guppy'],
  Angelfish: ['Marble Angelfish', 'Silver Angelfish', 'Koi Angelfish'],
  Koi: ['Kohaku', 'Sanke', 'Showa'],
  Tetra: ['Neon Tetra', 'Cardinal Tetra', 'Rummy Nose Tetra'],
  Turtle: ['Red-eared Slider', 'Painted Turtle', 'Box Turtle'],
  Tortoise: ['Sulcata Tortoise', 'Russian Tortoise', 'Hermann\'s Tortoise'],
  Lizard: ['Bearded Dragon', 'Iguana', 'Blue-tongued Skink'],
  Gecko: ['Leopard Gecko', 'Crested Gecko', 'Tokay Gecko'],
  Snake: ['Ball Python', 'Corn Snake', 'King Snake', 'Garter Snake'],
  Chameleon: ['Veiled Chameleon', 'Panther Chameleon', 'Jackson\'s Chameleon'],
  Frog: ['Tree Frog', 'Bullfrog', 'Pacman Frog'],
  Toad: ['Common Toad', 'Fire-bellied Toad', 'Cane Toad'],
  Salamander: ['Axolotl', 'Tiger Salamander', 'Fire Salamander'],
  Newt: ['Fire-bellied Newt', 'Eastern Newt', 'Ribbed Newt'],
  'Ant Farm': ['Harvester Ant', 'Carpenter Ant', 'Garden Ant'],
  'Stick Insect': ['Stick Insect'],
  Tarantula: ['Mexican Red Knee', 'Rose Hair', 'Pink Toe'],
  Beetle: ['Hercules Beetle', 'Stag Beetle', 'Rhino Beetle'],
  Other: ['Exotic Pet', 'Wild Animal', 'Invertebrate']
};

export const PET_CATEGORIES = [
  { id: 'mammal', name: 'Mammals', icon: Dog, species: ['Dog', 'Cat', 'Rabbit', 'Hamster', 'Guinea Pig', 'Mouse', 'Rat', 'Ferret', 'Horse', 'Goat', 'Pig'] },
  { id: 'bird', name: 'Birds', icon: Bird, species: ['Parrot', 'Parakeet', 'Cockatiel', 'Lovebird', 'Canary', 'Finch', 'Pigeon'] },
  { id: 'fish', name: 'Fish', icon: Fish, species: ['Goldfish', 'Betta Fish', 'Guppy', 'Angelfish', 'Koi', 'Tetra'] },
  { id: 'reptile', name: 'Reptiles', icon: Thermometer, species: ['Turtle', 'Tortoise', 'Lizard', 'Gecko', 'Snake', 'Chameleon'] },
  { id: 'amphibian', name: 'Amphibians', icon: Droplets, species: ['Frog', 'Toad', 'Salamander', 'Newt'] },
  { id: 'insect', name: 'Insects', icon: Bug, species: ['Ant Farm', 'Stick Insect', 'Tarantula', 'Beetle'] },
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
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetProfile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isGeneratingHealthReport, setIsGeneratingHealthReport] = useState(false);
  const [healthReport, setHealthReport] = useState<string | null>(null);
  const [showKeyRequirement, setShowKeyRequirement] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [newPet, setNewPet] = useState<Partial<PetProfile>>({ name: '', breed: '', birthday: '', bio: '', species: 'Dog', healthNotes: '', weightHistory: [], vaccinations: [] });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newWeight, setNewWeight] = useState('');

  // Optimized pet loading effect to prevent unnecessary loops
  useEffect(() => {
    if (!user?.uid) return;
    const saved = localStorage.getItem(`ssp_pets_${user.uid}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPets(parsed);
        if (parsed.length > 0 && (!selectedPet || !parsed.find((p: PetProfile) => p.id === selectedPet.id))) {
          setSelectedPet(parsed[0]);
        }
      } catch (e) {
        console.error("Storage error:", e);
      }
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
    setError(null);
    if (!newPet.birthday || new Date(newPet.birthday) > new Date()) { setError("Birth date cannot be in the future."); return; }
    
    const ownerInitial = user.displayName?.charAt(0).toUpperCase() || 'X';
    const petInitial = newPet.name?.charAt(0).toUpperCase() || 'X';
    const birthDate = newPet.birthday?.replace(/-/g, '') || '00000000';
    const uniqueSuffix = user.uid.slice(0, 4).toUpperCase();
    const id = `${ownerInitial}${petInitial}${birthDate}-${uniqueSuffix}`;
    
    const { years, months } = calculateAge(newPet.birthday || '');
    const completePet: PetProfile = { ...newPet as PetProfile, id, ownerId: user.uid, ownerName: user.displayName || 'Pet Parent', ageYears: String(years), ageMonths: String(months), weightHistory: [], vaccinations: [], isPublic: true };
    const updatedPets = [...pets, completePet];
    await savePetsToStorage(updatedPets);
    setSelectedPet(completePet);
    setSaveSuccess(true);
    setTimeout(() => { setIsAdding(false); setSaveSuccess(false); setStep(1); }, 1500);
  };

  const handleUpdatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return;
    setError(null);
    if (!selectedPet.birthday || new Date(selectedPet.birthday) > new Date()) { setError("Birth date cannot be in the future."); return; }
    const { years, months } = calculateAge(selectedPet.birthday || '');
    const updatedPet = { ...selectedPet, ageYears: String(years), ageMonths: String(months) };
    const updatedPets = pets.map(p => p.id === selectedPet.id ? updatedPet : p);
    await savePetsToStorage(updatedPets);
    setSelectedPet(updatedPet);
    setSaveSuccess(true);
    setTimeout(() => { setIsEditing(false); setSaveSuccess(false); }, 1500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedPet) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const updatedPet = { ...selectedPet, avatarUrl: base64 };
        const updatedPets = pets.map(p => p.id === selectedPet.id ? updatedPet : p);
        await savePetsToStorage(updatedPets);
        setSelectedPet(updatedPet);
        if (confirm("Generate high-quality AI avatar for your companion?")) generateAIAvatar(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAIAvatar = async (base64Source?: string) => {
    if (!selectedPet) return;
    const hasKey = await window.aistudio?.hasSelectedApiKey();
    if (!hasKey) { setShowKeyRequirement(true); return; }
    setIsGeneratingAvatar(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `A professional, high-quality, close-up studio portrait avatar of a ${selectedPet.breed} ${selectedPet.species} named ${selectedPet.name}. 4K, realistic, sharp details, warm lighting.`;
      const contents: any = { parts: [{ text: prompt }] };
      if (base64Source) contents.parts.push({ inlineData: { data: base64Source.split(',')[1], mimeType: 'image/png' } });
      const response = await ai.models.generateContent({ model: 'gemini-3-pro-image-preview', contents, config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } } });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const avatarUrl = `data:image/png;base64,${part.inlineData.data}`;
          const updatedPet = { ...selectedPet, avatarUrl };
          const updatedPets = pets.map(p => p.id === selectedPet.id ? updatedPet : p);
          await savePetsToStorage(updatedPets);
          setSelectedPet(updatedPet);
          break;
        }
      }
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) setShowKeyRequirement(true);
    } finally { setIsGeneratingAvatar(false); }
  };

  const generateHealthInsights = async () => {
    if (!selectedPet) return;
    setIsGeneratingHealthReport(true);
    setHealthReport(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as a veterinarian analysis bot. Analyze the record of: ${selectedPet.name}, ${selectedPet.breed}, ${selectedPet.ageYears}y. Recent Weights: ${selectedPet.weightHistory.map(w => w.weight).join(',')}kg. Provide sections: ## Health Status, ## Critical Observations, ## Wellness Path.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setHealthReport(response.text || "Report creation failed.");
    } catch (err) { setHealthReport("AI Service busy. Try again."); } finally { setIsGeneratingHealthReport(false); }
  };

  const handleAddWeight = async () => {
    if (!newWeight || isNaN(Number(newWeight)) || !selectedPet) return;
    const updatedHistory: WeightRecord[] = [...(selectedPet.weightHistory || []), { date: new Date().toISOString(), weight: Number(newWeight) }];
    const updatedPets = pets.map(p => p.id === selectedPet.id ? { ...p, weightHistory: updatedHistory } : p);
    await savePetsToStorage(updatedPets);
    setSelectedPet({ ...selectedPet, weightHistory: updatedHistory });
    setNewWeight('');
  };

  const healthSummary = useMemo(() => {
    if (!selectedPet) return null;
    const lastWeight = selectedPet.weightHistory[selectedPet.weightHistory.length - 1];
    const nextVaccine = selectedPet.vaccinations?.filter(v => v.nextDueDate && new Date(v.nextDueDate) > new Date()).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())[0];
    return { lastWeight, nextVaccine };
  }, [selectedPet]);

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">My Pet Family</h2>
          <p className="text-slate-500 font-medium">Manage your companions and track their wellness.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setStep(1); setIsAdding(true); }} 
            className="flex items-center gap-3 px-8 py-4 bg-theme text-white rounded-2xl font-black text-sm uppercase tracking-widest bg-theme-hover transition-all shadow-xl shadow-theme/10 active:scale-95"
          >
            <Plus size={20} /> Add New Pet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {pets.map(p => (
          <button 
            key={p.id} 
            onClick={() => { setSelectedPet(p); setIsAdding(false); setIsEditing(false); setHealthReport(null); setError(null); }} 
            className={`flex flex-col items-center gap-3 p-4 rounded-[2.5rem] border-2 transition-all ${selectedPet?.id === p.id && !isAdding ? 'bg-theme-light border-theme scale-105 shadow-lg' : 'bg-white border-transparent hover:border-slate-200'}`}
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-inner bg-slate-100 flex items-center justify-center">
              {p.avatarUrl ? <img src={p.avatarUrl} className="w-full h-full object-cover" /> : <PawPrint size={24} className="text-slate-200" />}
            </div>
            <span className={`font-black text-xs uppercase tracking-widest truncate w-full px-2 ${selectedPet?.id === p.id && !isAdding ? 'text-theme' : 'text-slate-500'}`}>{p.name}</span>
          </button>
        ))}
      </div>

      {(isAdding || isEditing) ? (
        <div className="max-w-3xl mx-auto animate-fade-in bg-white p-14 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
          {saveSuccess && <div className="absolute inset-0 bg-theme/95 flex flex-col items-center justify-center z-50 text-white"><Check size={48} className="mb-4" /><h3 className="text-2xl font-black">{isEditing ? 'Updated Successfully!' : 'Added to Family!'}</h3></div>}
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-slate-900">{isAdding ? (step === 1 ? 'Pet Category' : step === 2 ? 'Which Species?' : 'Final Details') : 'Edit Profile'}</h2>
            <button onClick={() => { setIsAdding(false); setIsEditing(false); setStep(1); setError(null); }} className="text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1"><X size={20} /> Cancel</button>
          </div>
          {isAdding && step === 1 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {PET_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCategory(cat); setStep(2); }} className="p-8 rounded-[2.5rem] bg-slate-50 border border-transparent hover:border-theme hover:bg-white hover:shadow-xl transition-all flex flex-col items-center gap-4 group">
                  <cat.icon className="w-12 h-12 text-theme" />
                  <span className="font-black text-xs uppercase tracking-widest">{cat.name}</span>
                </button>
              ))}
            </div>
          ) : isAdding && step === 2 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {selectedCategory?.species.map((s: string) => (
                <button key={s} onClick={() => { setNewPet({ ...newPet, species: s, breed: BREED_DATA[s]?.[0] || 'Unknown' }); setStep(3); }} className="p-4 rounded-2xl border hover:border-theme hover:bg-theme-light transition-all font-bold text-slate-700">{s}</button>
              ))}
            </div>
          ) : (
            <form onSubmit={isAdding ? handleAddPet : handleUpdatePet} className="space-y-6">
              {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2"><AlertCircle size={18} /> {error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pet Name</label>
                  <input required value={isAdding ? newPet.name : selectedPet?.name} onChange={e => isAdding ? setNewPet({ ...newPet, name: e.target.value }) : setSelectedPet({...selectedPet!, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none ring-theme focus:ring-4 transition-all" placeholder="Pet Name" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Breed / Variety</label>
                  <select value={isAdding ? newPet.breed : selectedPet?.breed} onChange={e => isAdding ? setNewPet({ ...newPet, breed: e.target.value }) : setSelectedPet({...selectedPet!, breed: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none ring-theme focus:ring-4 transition-all">
                    {BREED_DATA[(isAdding ? newPet.species : selectedPet?.species) || 'Dog']?.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birthday</label>
                    <input type="date" required max={todayStr} value={isAdding ? newPet.birthday : selectedPet?.birthday} onChange={e => isAdding ? setNewPet({ ...newPet, birthday: e.target.value }) : setSelectedPet({...selectedPet!, birthday: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none ring-theme focus:ring-4 transition-all" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase ml-1 mt-1">Cannot be a future date</p>
                  </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Short Biography</label>
                <textarea value={isAdding ? newPet.bio : selectedPet?.bio} onChange={e => isAdding ? setNewPet({ ...newPet, bio: e.target.value }) : setSelectedPet({...selectedPet!, bio: e.target.value})} className="w-full h-32 bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none ring-theme focus:ring-4 transition-all resize-none" placeholder="Short bio..." />
              </div>
              <button type="submit" className="w-full bg-theme text-white py-5 rounded-[2.5rem] font-black text-lg bg-theme-hover transition-all shadow-xl shadow-theme/20 flex items-center justify-center gap-3"><Save size={20} /> {isAdding ? 'Register Pet' : 'Save Changes'}</button>
            </form>
          )}
        </div>
      ) : selectedPet ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-theme"></div>
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="w-48 h-48 rounded-[3.5rem] overflow-hidden border-4 border-white shadow-2xl transition-transform group-hover:scale-[1.02] bg-slate-50 flex items-center justify-center">
                    {selectedPet.avatarUrl ? <img src={selectedPet.avatarUrl} className={`w-full h-full object-cover ${isGeneratingAvatar ? 'opacity-30 blur-sm grayscale' : ''}`} alt={selectedPet.name} /> : <Dog size={64} className="text-slate-200" />}
                    {isGeneratingAvatar && <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40"><Loader2 size={32} className="animate-spin text-theme mb-2" /><p className="text-[8px] font-black uppercase tracking-widest text-theme">AI Generating...</p></div>}
                  </div>
                  <div className="absolute -bottom-2 -right-2 flex gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-slate-600 hover:text-theme transition-all border border-slate-100" title="Upload Photo"><Camera size={20} /><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} /></button>
                    <button onClick={() => generateAIAvatar()} disabled={isGeneratingAvatar} className="w-12 h-12 bg-theme text-white rounded-2xl shadow-xl flex items-center justify-center bg-theme-hover transition-all disabled:opacity-50" title="Generate AI Avatar"><Wand2 size={20} /></button>
                  </div>
                </div>
                {showKeyRequirement && (
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 animate-in zoom-in space-y-4">
                    <div className="flex items-center gap-3 text-amber-700"><Key size={20} /><h4 className="font-black text-sm uppercase">Paid API Key Required</h4></div>
                    <p className="text-xs text-amber-800 font-medium">To use high-quality AI avatar generation, you must select your own paid API key from a Google Cloud project.</p>
                    <button onClick={() => { window.aistudio?.openSelectKey(); setShowKeyRequirement(false); }} className="w-full bg-theme text-white py-3 rounded-xl font-bold text-xs uppercase shadow-lg shadow-theme/20">Connect Key</button>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block text-[10px] font-bold text-theme hover:underline">View Billing Documentation</a>
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedPet.name}</h3>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{selectedPet.breed} • {selectedPet.species}</p>
                  <p className="text-xs font-black text-theme uppercase tracking-widest">{selectedPet.ageYears}y {selectedPet.ageMonths}m Old</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 rounded-[3rem] p-8 text-white space-y-4 shadow-2xl relative overflow-hidden"><Quote className="absolute -top-2 -left-2 w-12 h-12 text-white/5" /><h4 className="font-black text-lg tracking-tight">AI Care Context</h4><p className="text-slate-400 text-sm leading-relaxed italic">"{selectedPet.bio || 'This companion is currently undergoing deep behavioral analysis.'}"</p></div>
          </div>
          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-6"><div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Weight size={24} /></div><h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Recent Weight (kg)</h4></div>
                <div className="flex items-end gap-3 mb-6"><span className="text-6xl font-black tracking-tighter">{healthSummary?.lastWeight?.weight || '--'}</span><span className="text-slate-400 font-bold mb-2">KG</span></div>
                <div className="flex gap-2"><input value={newWeight} onChange={e => setNewWeight(e.target.value)} type="number" className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none ring-theme focus:ring-4 transition-all" placeholder="Log weight..." /><button onClick={handleAddWeight} className="p-3 bg-theme text-white rounded-xl shadow-lg bg-theme-hover transition-all"><Plus size={20} /></button></div>
              </div>
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-6"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Syringe size={24} /></div><h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Next Vaccination</h4></div>
                <div className="mb-6"><p className="text-2xl font-black text-slate-700 truncate">{healthSummary?.nextVaccine?.name || 'All Current'}</p><p className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-1">{healthSummary?.nextVaccine ? `Due Date: ${healthSummary.nextVaccine.nextDueDate}` : 'Vaccination record is healthy'}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-10 border-b border-slate-50 bg-gradient-to-r from-indigo-50/50 to-white flex items-center justify-between"><div className="flex items-center gap-4"><div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><Brain size={24} /></div><div><h4 className="text-2xl font-black text-slate-800 tracking-tight">AI Health Advisor</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Automated Clinical Insights</p></div></div>{!healthReport && !isGeneratingHealthReport && (<button onClick={generateHealthInsights} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">Analyze Health</button>)}</div>
              <div className="p-10 min-h-[150px] flex flex-col items-center justify-center">
                {isGeneratingHealthReport ? (<div className="text-center space-y-4 py-10"><Loader2 size={48} className="animate-spin text-theme mx-auto" /><div className="space-y-1"><p className="font-black text-slate-800 text-lg">Consulting AI Veterinarian...</p></div></div>) : healthReport ? (<div className="w-full prose prose-slate prose-indigo max-w-none text-slate-600"><div className="space-y-6">{healthReport.split('\n').map((line, i) => { const trimmed = line.trim(); if (trimmed.startsWith('##')) return <h5 key={i} className="text-xl font-black text-slate-900 mt-6 mb-2 border-b-2 border-theme-light inline-block">{trimmed.replace('##', '')}</h5>; if (trimmed.startsWith('*') || trimmed.startsWith('-')) return <li key={i} className="ml-4 mb-2 font-medium list-disc leading-relaxed">{trimmed.replace(/^[\*\-]\s/, '')}</li>; return <p key={i} className="leading-relaxed font-medium">{trimmed}</p>; })}</div><button onClick={generateHealthInsights} className="mt-10 text-[10px] font-black text-theme uppercase tracking-widest flex items-center gap-2 hover:underline"><RefreshCcw size={12} /> Refresh Medical Insights</button></div>) : (<div className="text-center space-y-4 py-6"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto"><Sparkles className="text-slate-200" size={32} /></div><p className="text-slate-400 font-medium italic">No recent analysis. Tap 'Analyze Health' to process your pet's record.</p></div>)}
              </div>
            </div>
            <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm"><div className="flex items-center justify-between mb-8"><h4 className="text-2xl font-black text-slate-800 flex items-center gap-3"><LineChart className="text-theme" /> Vital Statistics</h4></div><div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">{selectedPet.weightHistory.length > 0 ? selectedPet.weightHistory.map((w, idx) => (<div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-white hover:bg-slate-50 transition-colors"><div className="flex items-center gap-4"><div className="w-2 h-2 rounded-full bg-theme opacity-60"></div><span className="font-black text-slate-400 text-xs uppercase tracking-widest">{new Date(w.date).toLocaleDateString()}</span></div><span className="font-black text-slate-800 text-xl">{w.weight} kg</span></div>)) : <div className="py-20 text-center text-slate-400 font-medium italic">No vital records found.</div>}</div></div>
            <div className="flex justify-end pt-4"><button onClick={() => { if(window.confirm("Permanently remove this pet profile?")) { const updated = pets.filter(p => p.id !== selectedPet.id); savePetsToStorage(updated); setSelectedPet(updated[0] || null); } }} className="flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-widest hover:text-rose-700 transition-all"><Trash2 size={16} /> Delete Companion Profile</button></div>
          </div>
        </div>
      ) : (
        <div className="py-32 text-center"><div className="bg-theme-light w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-8 text-theme shadow-inner"><Dog size={48} /></div><h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Family Registry Empty</h3><p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">Register your companions to track their health and behavior.</p><button onClick={() => { setStep(1); setIsAdding(true); }} className="bg-theme text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl shadow-theme/20 bg-theme-hover transition-all active:scale-95">Add First Pet</button></div>
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  useEffect(() => {
    // Immediate dismissal of preloader to avoid FOUC and stuck state
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('fade-out');
      const timer = setTimeout(() => {
        if (preloader.parentNode) preloader.remove();
      }, 500);
      return () => clearTimeout(timer);
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