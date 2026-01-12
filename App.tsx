
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from './components/Layout';
import Home from './pages/Home';
import AIAssistant from './pages/AIAssistant';
import PetCare from './pages/PetCare';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Community from './pages/Community';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Chat from './pages/Chat';
import { AppRoutes, PetProfile, WeightRecord, VaccinationRecord } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { GoogleGenAI } from "@google/genai";
import { 
  Dog, Plus, PawPrint, Weight, Palette, Fingerprint, 
  AlertCircle, Camera, Check, ChevronRight, Cat, Bird, Rabbit, 
  Trash2, Edit3, ArrowLeft, Stethoscope, Search, Star, MessageCircle,
  Heart, Fish, Bug, Thermometer, Droplets, Calendar, LineChart, Syringe, TrendingUp,
  Sparkles, Info, Quote, Upload, Loader2, Wand2, QrCode, Scan, X, ExternalLink, Save,
  Key
} from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

// Extracted from system rules - mandatory checks for high-quality models
// Define the shape of aistudio to match internal expectations and avoid type conflicts
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
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
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months };
};

const PetProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetProfile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showKeyRequirement, setShowKeyRequirement] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [newPet, setNewPet] = useState<Partial<PetProfile>>({ 
    name: '', breed: '', birthday: '', bio: '', species: 'Dog', healthNotes: '', 
    weightHistory: [], vaccinations: [] 
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newWeight, setNewWeight] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(`ssp_pets_${user?.uid}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setPets(parsed);
      if (parsed.length > 0 && !selectedPet) {
        setSelectedPet(parsed[0]);
      }
    }
  }, [user, selectedPet]);

  const savePetsToStorage = (updatedPets: PetProfile[]) => {
    localStorage.setItem(`ssp_pets_${user?.uid}`, JSON.stringify(updatedPets));
    setPets(updatedPets);
  };

  const handleAddPet = (e: React.FormEvent) => {
    e.preventDefault();
    const id = crypto.randomUUID();
    const { years, months } = calculateAge(newPet.birthday || '');
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ssp_pet_${id}`;
    
    const completePet: PetProfile = {
      ...newPet as PetProfile,
      id,
      qrCodeUrl,
      ageYears: String(years),
      ageMonths: String(months),
      weightHistory: [],
      vaccinations: []
    };

    const updatedPets = [...pets, completePet];
    savePetsToStorage(updatedPets);
    setSelectedPet(completePet);
    setSaveSuccess(true);
    setTimeout(() => { setIsAdding(false); setSaveSuccess(false); setStep(1); }, 1500);
  };

  const handleUpdatePet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return;
    const { years, months } = calculateAge(selectedPet.birthday || '');
    const updatedPet = { ...selectedPet, ageYears: String(years), ageMonths: String(months) };
    const updatedPets = pets.map(p => p.id === selectedPet.id ? updatedPet : p);
    savePetsToStorage(updatedPets);
    setSelectedPet(updatedPet);
    setSaveSuccess(true);
    setTimeout(() => { setIsEditing(false); setSaveSuccess(false); }, 1500);
  };

  const generateAIAvatar = async () => {
    if (!selectedPet) return;
    
    // Check for required API Key selection for high-quality models
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      setShowKeyRequirement(true);
      return;
    }

    setIsGeneratingAvatar(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `A professional, high-quality 2K portrait of a ${selectedPet.breed} ${selectedPet.species} named ${selectedPet.name}. Cinematic lighting, adorable expression, soft-focus natural background.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        const avatarUrl = `data:image/png;base64,${part.inlineData.data}`;
        const updatedPets = pets.map(p => p.id === selectedPet.id ? { ...p, avatarUrl } : p);
        savePetsToStorage(updatedPets);
        setSelectedPet({ ...selectedPet, avatarUrl });
      }
    } catch (err: any) {
      console.error("Avatar Generation Error:", err);
      if (err.message?.includes("Requested entity was not found")) {
        setShowKeyRequirement(true);
      }
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleConnectKey = async () => {
    await window.aistudio.openSelectKey();
    setShowKeyRequirement(false);
    // Proceed to generate after selection
    generateAIAvatar();
  };

  const handleAddWeight = () => {
    if (!newWeight || isNaN(Number(newWeight)) || !selectedPet) return;
    const updatedHistory: WeightRecord[] = [...(selectedPet.weightHistory || []), { date: new Date().toISOString(), weight: Number(newWeight) }];
    const updatedPets = pets.map(p => p.id === selectedPet.id ? { ...p, weightHistory: updatedHistory } : p);
    savePetsToStorage(updatedPets);
    setSelectedPet({ ...selectedPet, weightHistory: updatedHistory });
    setNewWeight('');
  };

  const healthSummary = useMemo(() => {
    if (!selectedPet) return null;
    const lastWeight = selectedPet.weightHistory[selectedPet.weightHistory.length - 1];
    const nextVaccine = selectedPet.vaccinations
      ?.filter(v => v.nextDueDate && new Date(v.nextDueDate) > new Date())
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())[0];
    return { lastWeight, nextVaccine };
  }, [selectedPet]);

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">My Pet Family</h2>
          <p className="text-slate-500 font-medium">Manage and identify your registered companions.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsScanning(true)} className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Scan size={20} className="text-theme" /> Scan QR
          </button>
          <button onClick={() => { setStep(1); setIsAdding(true); }} className="flex items-center gap-3 px-8 py-4 bg-theme text-white rounded-2xl font-black text-sm uppercase tracking-widest bg-theme-hover transition-all shadow-xl shadow-theme/10">
            <Plus size={20} /> Add New Pet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {pets.map(p => (
          <button 
            key={p.id} 
            onClick={() => { setSelectedPet(p); setIsAdding(false); setIsEditing(false); }}
            className={`flex flex-col items-center gap-3 p-4 rounded-[2.5rem] border-2 transition-all ${selectedPet?.id === p.id && !isAdding ? 'bg-theme-light border-theme scale-105 shadow-lg' : 'bg-white border-transparent hover:border-slate-200'}`}
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-inner bg-slate-100">
              <img src={p.avatarUrl || `https://picsum.photos/seed/${p.id}/200`} className="w-full h-full object-cover" />
            </div>
            <span className={`font-black text-xs uppercase tracking-widest ${selectedPet?.id === p.id && !isAdding ? 'text-theme' : 'text-slate-500'}`}>{p.name}</span>
          </button>
        ))}
      </div>

      {(isAdding || isEditing) ? (
        <div className="max-w-3xl mx-auto animate-fade-in bg-white p-14 rounded-[3.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
          {saveSuccess && <div className="absolute inset-0 bg-theme/95 flex flex-col items-center justify-center z-50 text-white"><Check size={48} className="mb-4" /><h3 className="text-2xl font-black">{isEditing ? 'Updated Successfully!' : 'Added to Family!'}</h3></div>}
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black text-slate-900">
              {isAdding ? (step === 1 ? 'Pet Category' : step === 2 ? 'Which Species?' : 'Final Details') : 'Edit Profile'}
            </h2>
            <button onClick={() => { setIsAdding(false); setIsEditing(false); setStep(1); }} className="text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1"><X size={20} /> Cancel</button>
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
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birthday</label>
                <input type="date" required value={isAdding ? newPet.birthday : selectedPet?.birthday} onChange={e => isAdding ? setNewPet({ ...newPet, birthday: e.target.value }) : setSelectedPet({...selectedPet!, birthday: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none ring-theme focus:ring-4 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Short Biography</label>
                <textarea value={isAdding ? newPet.bio : selectedPet?.bio} onChange={e => isAdding ? setNewPet({ ...newPet, bio: e.target.value }) : setSelectedPet({...selectedPet!, bio: e.target.value})} className="w-full h-32 bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none ring-theme focus:ring-4 transition-all resize-none" placeholder="Short bio..." />
              </div>
              <button type="submit" className="w-full bg-theme text-white py-5 rounded-[2.5rem] font-black text-lg bg-theme-hover transition-all shadow-xl shadow-theme/20 flex items-center justify-center gap-3">
                <Save size={20} /> {isAdding ? 'Register Pet' : 'Save Changes'}
              </button>
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
                  <div className="w-48 h-48 rounded-[3.5rem] overflow-hidden border-4 border-white shadow-2xl transition-transform group-hover:scale-[1.02] bg-slate-50">
                    <img 
                      src={selectedPet.avatarUrl || `https://picsum.photos/seed/${selectedPet.id}/400`} 
                      className={`w-full h-full object-cover ${isGeneratingAvatar ? 'opacity-30 grayscale' : ''}`} 
                      alt={selectedPet.name} 
                    />
                    {isGeneratingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-theme" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 flex gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-slate-600 hover:text-theme transition-all border border-slate-50"
                      title="Upload Photo"
                    >
                      <Camera size={20} />
                    </button>
                    <button 
                      onClick={generateAIAvatar} 
                      disabled={isGeneratingAvatar} 
                      className="w-12 h-12 bg-theme text-white rounded-2xl shadow-xl flex items-center justify-center bg-theme-hover transition-all disabled:opacity-50"
                      title="AI Generate High-Quality Avatar"
                    >
                      <Wand2 size={20} />
                    </button>
                  </div>
                </div>

                {showKeyRequirement && (
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 animate-in zoom-in space-y-4">
                    <div className="flex items-center gap-3 text-amber-700">
                      <Key size={20} />
                      <h4 className="font-black text-sm uppercase">Paid API Key Required</h4>
                    </div>
                    <p className="text-xs text-amber-800 font-medium">To generate professional-grade 2K/4K avatars, you must select your own paid API key from a Google Cloud project.</p>
                    <button onClick={handleConnectKey} className="w-full bg-theme text-white py-3 rounded-xl font-bold text-xs uppercase shadow-lg shadow-theme/20">Connect Key</button>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block text-[10px] font-bold text-theme hover:underline">View Billing Documentation</a>
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedPet.name}</h3>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{selectedPet.breed} • {selectedPet.species}</p>
                </div>

                <div className="w-full p-4 bg-slate-50 rounded-[2rem] flex flex-col items-center gap-4 border border-slate-100/50">
                  <img src={selectedPet.qrCodeUrl} className="w-40 h-40 bg-white p-2 rounded-2xl shadow-inner border border-slate-100" alt="QR ID" />
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">SSP-ID: {selectedPet.id.slice(0, 8)}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-[3rem] p-8 text-white space-y-4 shadow-2xl relative overflow-hidden">
              <Quote className="absolute -top-2 -left-2 w-12 h-12 text-white/5" />
              <h4 className="font-black text-lg tracking-tight">AI Care Context</h4>
              <p className="text-slate-400 text-sm leading-relaxed italic">"{selectedPet.bio || 'This companion is currently undergoing deep behavioral analysis.'}"</p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Weight size={24} /></div>
                  <h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Recent Weight (kg)</h4>
                </div>
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-6xl font-black tracking-tighter">{healthSummary?.lastWeight?.weight || '--'}</span>
                  <span className="text-slate-400 font-bold mb-2">KG</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    value={newWeight} 
                    onChange={e => setNewWeight(e.target.value)} 
                    type="number" 
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 outline-none ring-theme focus:ring-4 transition-all" 
                    placeholder="Log weight..." 
                  />
                  <button onClick={handleAddWeight} className="p-3 bg-theme text-white rounded-xl shadow-lg bg-theme-hover transition-all"><Plus size={20} /></button>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Syringe size={24} /></div>
                  <h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Next Vaccination</h4>
                </div>
                <div className="mb-6">
                  <p className="text-2xl font-black text-slate-700 truncate">{healthSummary?.nextVaccine?.name || 'All Current'}</p>
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-1">
                    {healthSummary?.nextVaccine ? `Due Date: ${healthSummary.nextVaccine.nextDueDate}` : 'Vaccination record is healthy'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-2xl font-black text-slate-800 flex items-center gap-3"><LineChart className="text-theme" /> Vital Statistics</h4>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {selectedPet.weightHistory.length > 0 ? selectedPet.weightHistory.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-theme opacity-60"></div>
                      <span className="font-black text-slate-400 text-xs uppercase tracking-widest">{new Date(w.date).toLocaleDateString()}</span>
                    </div>
                    <span className="font-black text-slate-800 text-xl">{w.weight} kg</span>
                  </div>
                )) : <div className="py-20 text-center text-slate-400 font-medium italic">No vital records found.</div>}
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button onClick={() => { if(window.confirm("Permanently remove this pet profile?")) { const updated = pets.filter(p => p.id !== selectedPet.id); savePetsToStorage(updated); setSelectedPet(updated[0] || null); } }} className="flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-widest hover:text-rose-700 transition-all">
                <Trash2 size={16} /> Delete Companion Profile
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-32 text-center">
           <div className="bg-theme-light w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-8 text-theme shadow-inner">
             <Dog size={48} />
           </div>
           <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Family Registry Empty</h3>
           <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">Register your companions to track their health and generate unique identification codes.</p>
           <button onClick={() => { setStep(1); setIsAdding(true); }} className="bg-theme text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl shadow-theme/20 bg-theme-hover transition-all active:scale-95">Add First Pet</button>
        </div>
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  useEffect(() => {
    const applyTheme = () => {
      const savedTheme = localStorage.getItem('ssp_theme_color') || '#4f46e5';
      const root = document.documentElement;
      root.style.setProperty('--theme-color', savedTheme);
      root.style.setProperty('--theme-color-hover', savedTheme + 'dd'); 
      root.style.setProperty('--theme-color-light', savedTheme + '15');
    };
    applyTheme();
    const interval = setInterval(applyTheme, 500);
    return () => clearInterval(interval);
  }, []);

  return (
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
      <Route path={AppRoutes.TERMS} element={<ProtectedRoute><Terms /></ProtectedRoute>} />
      <Route path={AppRoutes.PRIVACY} element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
