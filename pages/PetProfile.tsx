import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { GoogleGenAI } from "@google/genai";
import { syncPetToDb, getPetById, deletePet, getPetsByOwnerId } from '../services/firebase';
import jsQR from 'jsqr';
import { 
  Dog, Plus, PawPrint, Camera, CheckCircle2, Bird, Fish, Thermometer,  
  Trash2, Stethoscope, Brain, Wand2, Scan, X, Syringe, TrendingUp, Loader2, QrCode, ArrowRight, Palette, Sparkles, AlertTriangle, Bot, Heart, Bug, Waves,
  Star, 
  Sparkle,
  Zap,
  Download,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { PetProfile, WeightRecord, VaccinationRecord, AppRoutes } from '../types';

export const BREED_DATA: Record<string, string[]> = {
  // Mammals
  Dog: ['Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'French Bulldog', 'Poodle', 'Beagle', 'Mixed Breed'],
  Cat: ['Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal', 'Mixed Breed'],
  Rabbit: ['Holland Lop', 'Mini Rex', 'Dutch Rabbit', 'Lionhead'],
  Hamster: ['Syrian Hamster', 'Dwarf Hamster', 'Roborovski Hamster'],
  'Guinea pig': ['Abyssinian', 'American', 'Peruvian', 'Teddy'],
  // Birds
  'Budgie (Parakeet)': ['Standard', 'English'],
  Cockatiel: ['Grey', 'Lutino', 'Pied', 'Pearl'],
  'Parrot (African Grey)': ['African Grey', 'Amazon', 'Eclectus', 'Macaw', 'Conure'],
  Canary: ['Yellow', 'Red Factor', 'Gloster'],
  // Fish
  Goldfish: ['Common', 'Comet', 'Shubunkin', 'Fantail'],
  'Betta fish': ['Veiltail', 'Crowntail', 'Halfmoon'],
  Guppy: ['Fancy', 'Endler'],
  Koi: ['Kohaku', 'Taisho Sanke', 'Showa Sanshoku'],
  // Reptiles
  Turtle: ['Red-Eared Slider', 'Box Turtle', 'Painted Turtle'],
  Tortoise: ['Sulcata', 'Russian', 'Hermann\'s'],
  Gecko: ['Leopard Gecko', 'Crested Gecko'],
  Snake: ['Ball Python', 'Corn Snake', 'King Snake'],
  // Amphibians
  Frog: ['Tree Frog', 'Bullfrog', 'Pacman Frog'],
  Salamander: ['Axolotl', 'Tiger Salamander', 'Fire Salamander'],
  Newt: ['Fire-bellied Newt', 'Eastern Newt'],
  // Invertebrates
  'Hermit crab': ['Caribbean', 'Ecuadorian'],
  Tarantula: ['Mexican Red Knee', 'Chilean Rose', 'Pink Toe'],
  Snail: ['Garden Snail', 'Giant African Land Snail'],
  'Ant farm': ['Queen Ant Colony'],
  Other: ['Exotic Pet', 'Wild Animal', 'Invertebrate']
};

export const PET_CATEGORIES = [
  { id: 'mammal', name: 'Mammals', icon: Dog, species: ['Dog', 'Cat', 'Rabbit', 'Hamster', 'Guinea pig'] },
  { id: 'bird', name: 'Birds', icon: Bird, species: ['Budgie (Parakeet)', 'Cockatiel', 'Parrot (African Grey)', 'Canary'] },
  { id: 'fish', name: 'Fish', icon: Fish, species: ['Goldfish', 'Betta fish', 'Guppy', 'Koi'] },
  { id: 'reptile', name: 'Reptiles', icon: Thermometer, species: ['Turtle', 'Tortoise', 'Gecko', 'Snake'] },
  { id: 'amphibian', name: 'Amphibians', icon: Waves, species: ['Frog', 'Salamander', 'Newt'] },
  { id: 'invertebrate', name: 'Invertebrates', icon: Bug, species: ['Hermit crab', 'Tarantula', 'Snail', 'Ant farm'] },
];

const AVATAR_STYLES = [
  { 
    id: 'premium-elite', 
    name: 'Elite Portrait Studio', 
    description: 'Ultra-polished digital kawaii aesthetic', 
    isPremium: true,
    prompt: `Generate a high-quality digital pet avatar optimized for a mobile application profile picture. 
    Art Direction: Cute, friendly, and modern cartoon aesthetic; soft pastel color palette with smooth gradient lighting and subtle glow highlights; big expressive eyes and a rounded, chubby face; clean, smooth vector-style outlines with a polished digital finish; soft natural shading and gentle shadows for depth; subtle rim lighting around the edges to make the character pop. 
    Composition: Perfectly front-facing and symmetrically centered; clearly framed inside a clean circular border suitable for profile icons; simple light or pastel gradient background with a slight depth blur; minimal background elements so focus stays on the pet. 
    Mood: Warm, welcoming, and playful but polished; friendly and approachable expression with a soft gentle smile; clean startup-style digital polish.`
  },
  { id: 'realistic-studio', name: 'Studio Realism', description: 'Hyper-detailed cinematic lighting', prompt: 'A cinematic, ultra-high-quality professional studio avatar portrait. Detailed fur, vibrant lighting, 4K resolution, macro photography style.' },
  { id: 'pixar-3d', name: '3D Animator', description: 'Pixar-inspired 3D character', prompt: 'A cute, 3D animated style character portrait. Pixar/Disney style, expressive eyes, vibrant colors, clean lines, high-end CGI.' },
  { id: 'watercolor-dream', name: 'Watercolor Dream', description: 'Dreamy & soft brushstrokes', prompt: 'A beautiful, delicate watercolor painting. Soft brushstrokes, artistic splatters, dreamy atmosphere, elegant paper texture background.' },
  { id: 'synth-future', name: 'Cyber Wave', description: 'Neon lights & futuristic tech', prompt: 'A futuristic cyberpunk themed portrait. Neon lights, synthwave aesthetic, dark city background, high-tech glow.' },
];

const calculateAge = (birthday: string) => {
  if (!birthday) return { years: 0, months: 0 };
  const birthDate = new Date(birthday);
  const today = new Date();
  
  // Biological limit check (e.g., 50 years)
  const maxAgeLimit = 50;
  if (birthDate > today || today.getFullYear() - birthDate.getFullYear() > maxAgeLimit) {
    return { years: 0, months: 0, invalid: true };
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0) { years--; months += 12; }
  return { years: Math.max(0, years), months: Math.max(0, months) };
};

const WeightChart: React.FC<{ data: WeightRecord[] }> = ({ data }) => {
  if (!data || data.length < 2) return (
    <div className="h-32 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
      <TrendingUp size={24} className="text-slate-200 mb-2" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Need 2+ records for trend data</p>
    </div>
  );

  const padding = 20;
  const width = 400;
  const height = 150;

  const weights = data.map(d => d.weight);
  const minW = Math.min(...weights) * 0.95;
  const maxW = Math.max(...weights) * 1.05;
  const rangeW = maxW - minW || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.weight - minW) / rangeW) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative w-full bg-slate-50/30 rounded-3xl p-4 overflow-hidden border border-slate-50">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 drop-shadow-sm">
        <polyline
          fill="none"
          stroke="var(--theme-color)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="transition-all duration-1000"
        />
        {data.map((d, i) => {
           const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
           const y = height - padding - ((d.weight - minW) / rangeW) * (height - 2 * padding);
           return (
             <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="var(--theme-color)" strokeWidth="2" />
           );
        })}
      </svg>
      <div className="mt-2 flex justify-between px-2">
         <span className="text-[8px] font-bold text-slate-400 uppercase">{data[0].date}</span>
         <span className="text-[8px] font-bold text-slate-400 uppercase">{data[data.length-1].date}</span>
      </div>
    </div>
  );
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
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [newPet, setNewPet] = useState<Partial<PetProfile>>({ name: '', breed: '', birthday: '', bio: '', species: 'Dog', weightHistory: [], vaccinations: [] });
  const [newRecord, setNewRecord] = useState({ name: '', date: new Date().toISOString().split('T')[0], weight: '', nextDueDate: '' });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(false);
  const [healthInsights, setHealthInsights] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const minDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 50); // Set absolute minimum to 50 years ago
    return d.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    
    const loadPetsData = async () => {
      setIsSyncing(true);
      const saved = localStorage.getItem(`ssp_pets_${user.uid}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPets(parsed);
          if (parsed.length > 0 && !selectedPet) setSelectedPet(parsed[0]);
        } catch (e) { }
      }

      try {
        const remotePets = await getPetsByOwnerId(user.uid);
        if (remotePets.length > 0) {
          setPets(remotePets);
          localStorage.setItem(`ssp_pets_${user.uid}`, JSON.stringify(remotePets));
          setSelectedPet(prev => {
            if (!prev) return remotePets[0];
            const found = remotePets.find(p => p.id === prev.id);
            return found || remotePets[0];
          });
        }
      } catch (err) {
        console.warn("Cloud sync failed, using local registry:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    loadPetsData();
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
    
    if (!newPet.name?.trim()) {
       addNotification('Validation Error', 'Companion name is required.', 'warning');
       return;
    }
    if (!newPet.birthday) {
       addNotification('Validation Error', 'Birthday is required for age calculation.', 'warning');
       return;
    }

    const { years, months, invalid } = calculateAge(newPet.birthday);
    if (invalid) {
       addNotification('Biological Limit', 'Age exceeds biological limits (max 50 years).', 'error');
       return;
    }

    const id = `SSP-${Date.now()}`;
    const completePet: PetProfile = { 
        ...newPet as PetProfile, 
        id, 
        ownerId: user.uid, 
        ownerName: user.displayName || 'Parent', 
        ageYears: String(years), 
        ageMonths: String(months), 
        weightHistory: [], 
        vaccinations: [], 
        isPublic: false,
        lowercaseName: newPet.name?.toLowerCase() || ''
    };
    const updatedPets = [...pets, completePet];
    await savePetsToStorage(updatedPets);
    setSelectedPet(completePet);
    setSaveSuccess(true);
    
    setTimeout(() => { 
      setIsAdding(false); 
      setSaveSuccess(false); 
      setStep(1);
      addNotification('Success', `${completePet.name} is now registered!`, 'success');
    }, 1800);
  };

  const handleDeletePet = async () => {
    if (!selectedPet || !user) return;
    
    setIsDeleting(true);
    try {
      await deletePet(selectedPet.id);
      const updatedPets = pets.filter(p => p.id !== selectedPet.id);
      
      localStorage.setItem(`ssp_pets_${user.uid}`, JSON.stringify(updatedPets));
      setPets(updatedPets);
      
      if (updatedPets.length > 0) {
        setSelectedPet(updatedPets[0]);
      } else {
        setSelectedPet(null);
      }

      addNotification('Profile Removed', `${selectedPet.name}'s registry has been purged.`, 'info');
      setShowDeleteModal(false);
      setIsAdding(false); 
    } catch (err) {
      addNotification('System Error', 'Failed to remove pet from registry.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const generateHealthInsights = async () => {
    if (!selectedPet) return;
    setIsAnalyzingHealth(true);
    setHealthInsights(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze the following pet data and provide health insights and recommendations:
      Pet Name: ${selectedPet.name}
      Species: ${selectedPet.species}
      Breed: ${selectedPet.breed}
      Age: ${selectedPet.ageYears} years, ${selectedPet.ageMonths} months
      Weight History: ${JSON.stringify(selectedPet.weightHistory)}
      Vaccinations: ${JSON.stringify(selectedPet.vaccinations)}
      Health Notes: ${selectedPet.healthNotes || 'None provided'}
      
      Provide 3-4 bullet points of high-level advice focusing on weight trends, vaccination status, and general wellness. Keep it under 100 words.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setHealthInsights(response.text || "No insights available at this time.");
      addNotification('AI Health Insight', 'Analysis complete.', 'success');
    } catch (err) {
      addNotification('AI Error', 'Failed to generate health insights.', 'error');
    } finally {
      setIsAnalyzingHealth(false);
    }
  };

  const downloadQrCode = () => {
    if (!selectedPet) return;
    const canvas = document.createElement('canvas');
    const qrImg = document.getElementById('pet-qr-img') as HTMLImageElement;
    if (!qrImg) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = qrImg.naturalWidth || 200;
    canvas.height = qrImg.naturalHeight || 200;
    if (ctx) {
       ctx.fillStyle = "white";
       ctx.fillRect(0,0, canvas.width, canvas.height);
       ctx.drawImage(qrImg, 0, 0);
       const link = document.createElement('a');
       link.download = `${selectedPet.name}-digital-id.png`;
       link.href = canvas.toDataURL('image/png');
       link.click();
       addNotification('Identity Exported', 'PNG downloaded.', 'success');
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return;

    if (isAddingRecord === 'weight' && (!newRecord.weight || isNaN(parseFloat(newRecord.weight)))) {
      addNotification('Validation Error', 'Please enter a valid weight.', 'warning');
      return;
    }
    if (isAddingRecord === 'vaccine' && !newRecord.name.trim()) {
      addNotification('Validation Error', 'Vaccine name is required.', 'warning');
      return;
    }

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
    addNotification('Record Added', 'Health logs updated.', 'success');
  };

  const handleDeleteRecord = async (type: 'vaccine' | 'weight', index: number) => {
    if (!selectedPet) return;
    let updatedPet = { ...selectedPet };
    if (type === 'vaccine') {
      updatedPet.vaccinations.splice(index, 1);
    } else {
      updatedPet.weightHistory.splice(index, 1);
    }
    const updatedPets = pets.map(p => p.id === selectedPet.id ? updatedPet : p);
    await savePetsToStorage(updatedPets);
    setSelectedPet(updatedPet);
    addNotification('Record Deleted', 'Health log removed.', 'info');
  };

  const generateAIAvatar = async (styleId: string, base64Source?: string) => {
    if (!selectedPet) return;
    const style = AVATAR_STYLES.find(s => s.id === styleId) || AVATAR_STYLES[0];
    setShowStyleModal(false);
    setIsGeneratingAvatar(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stylePrompt = style.prompt;
      const corePrompt = `${stylePrompt} Subject: a ${selectedPet.breed} ${selectedPet.species} named ${selectedPet.name}. High resolution, 1:1 aspect ratio.`;
      
      const contents: any = { parts: [{ text: corePrompt }] };
      if (base64Source) {
        contents.parts.push({ inlineData: { data: base64Source.split(',')[1], mimeType: 'image/png' } });
      }
      
      const response = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash-image', 
        contents, 
        config: { imageConfig: { aspectRatio: "1:1" } } 
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const avatarUrl = `data:image/png;base64,${part.inlineData.data}`;
          const updatedPet = { ...selectedPet, avatarUrl };
          const updatedPets = pets.map(p => p.id === selectedPet.id ? updatedPet : p);
          await savePetsToStorage(updatedPets);
          setSelectedPet(updatedPet);
          addNotification('AI Artwork Complete', `${selectedPet.name}'s ${style.name} avatar is ready!`, 'success');
          break;
        }
      }
    } catch (err: any) {
      addNotification('AI Studio Error', 'Generation failed.', 'error');
    } finally { setIsGeneratingAvatar(false); }
  };

  const handleScanClick = () => {
    qrFileInputRef.current?.click();
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
              addNotification('ID Verified', `Found registry for ${petData.name}.`, 'success');
              const userPet = pets.find(p => p.id === petData.id);
              if (userPet) {
                setSelectedPet(userPet);
                setIsAdding(false);
              } else {
                navigate(`/pet/${petData.id}`);
              }
            } else {
              addNotification('Registry Missing', 'Invalid QR signature.', 'warning');
            }
          } catch (err) {
            addNotification('Network Failure', 'Could not verify.', 'error');
          }
        } else {
          addNotification('Scan Interrupted', 'No valid digital signature found.', 'error');
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
          <p className="text-slate-500 font-medium text-sm">Manage profiles and medical intelligence for your pets.</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="file" ref={qrFileInputRef} className="hidden" accept="image/*" onChange={handleFileScan} />
          <button onClick={handleScanClick} disabled={isScanning} className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50">
            {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Scan size={18} />} 
            Scan Identity
          </button>
          <button onClick={() => { setStep(1); setIsAdding(true); }} className="flex items-center gap-2 px-6 py-3.5 bg-theme text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-theme-hover transition-all shadow-xl shadow-theme/10 active:scale-95">
            <Plus size={18} /> Register Companion
          </button>
        </div>
      </div>

      {isSyncing && pets.length === 0 ? (
        <div className="py-40 flex flex-col items-center justify-center animate-pulse">
           <Loader2 size={48} className="text-theme animate-spin mb-6" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing Cloud Registry...</p>
        </div>
      ) : (
        <>
          <div className="gap-3 overflow-x-auto pb-4 scroll-hide flex">
            {pets.map(p => (
              <button 
                key={p.id} 
                onClick={() => { setSelectedPet(p); setIsAdding(false); }} 
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
              {saveSuccess && (
                <div className="absolute inset-0 bg-theme/95 flex flex-col items-center justify-center z-50 text-white animate-in fade-in">
                  <div className="p-6 bg-white/20 rounded-full animate-pulse mb-4">
                    <CheckCircle2 size={64} />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight">Registration Complete</h3>
                  <p className="mt-2 text-white/80 font-bold">Synchronizing with Core Directory...</p>
                </div>
              )}
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
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Companion Name</label>
                    <input required value={newPet.name} onChange={e => setNewPet({ ...newPet, name: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-theme/5 font-bold" placeholder="e.g. Luna" />
                    {newPet.name && newPet.name.length < 2 && <p className="text-[9px] text-rose-400 font-black uppercase tracking-widest ml-1 animate-pulse">Name too short</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Species Detail</label>
                    <select value={newPet.breed} onChange={e => setNewPet({...newPet, breed: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-theme/5 font-bold appearance-none">
                      {BREED_DATA[newPet.species || 'Dog']?.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Birthday</label>
                    <input type="date" required min={minDate} max={todayStr} value={newPet.birthday} onChange={e => setNewPet({ ...newPet, birthday: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-theme/5 font-bold" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Maximum age limit: 50 years</p>
                  </div>
                  <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all">Initialize Profile</button>
                </form>
              )}
            </div>
          ) : selectedPet ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl text-center space-y-6 relative overflow-hidden group">
                  <div className="w-52 h-52 rounded-[3.5rem] overflow-hidden mx-auto shadow-2xl relative border-4 border-white transition-all duration-500 hover:scale-[1.02]">
                    {selectedPet.avatarUrl ? (
                      <img src={selectedPet.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                        <Dog size={64} />
                      </div>
                    )}
                    
                    {isGeneratingAvatar && (
                      <div className="absolute inset-0 bg-white/40 flex flex-col items-center justify-center backdrop-blur-md z-20">
                        <Loader2 size={32} className="animate-spin text-theme mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-theme">Rendering AI Artwork...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-center relative z-10">
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="p-3.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 shadow-sm text-slate-500 transition-all hover:text-theme" 
                      title="Upload Reference Photo"
                    >
                      <Camera size={20} />
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => generateAIAvatar(AVATAR_STYLES[0].id, reader.result as string); reader.readAsDataURL(file); } }} />
                    </button>
                    <button 
                      onClick={() => setShowStyleModal(true)} 
                      disabled={isGeneratingAvatar} 
                      className="p-3.5 rounded-xl shadow-lg transition-all bg-slate-900 text-theme hover:bg-black flex items-center gap-2" 
                      title="Open AI Portrait Studio"
                    >
                      <Wand2 size={20} />
                      {!isGeneratingAvatar && <span className="text-[10px] font-black uppercase tracking-widest pr-1">Portrait Studio</span>}
                    </button>
                  </div>

                  <div className="space-y-1 pb-4 relative z-20">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedPet.name}</h3>
                    <p className="text-[10px] font-black text-theme uppercase tracking-[0.2em]">{selectedPet.breed} · {selectedPet.species}</p>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="mt-6 flex items-center gap-2 mx-auto text-rose-400 hover:text-rose-600 font-bold text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} /> Purge Profile
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                   
                   <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                         <QrCode size={20} className="text-indigo-400" />
                         <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Digital Identity</h4>
                      </div>
                      <button onClick={downloadQrCode} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all" title="Share Digital ID">
                        <Download size={14} className="text-indigo-300" />
                      </button>
                   </div>

                   <div className="bg-white p-6 rounded-[2rem] mx-auto w-44 h-44 flex items-center justify-center shadow-inner group relative overflow-hidden">
                      <img 
                        id="pet-qr-img"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${selectedPet.id}`} 
                        alt="Pet QR ID" 
                        className="w-full h-full object-contain mix-blend-multiply"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-full h-1 bg-indigo-500/30 animate-scan-beam absolute top-0 left-0" />
                      </div>
                   </div>

                   <div className="space-y-4 pt-2 relative z-10">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Registry ID</span>
                        <span className="text-white">{selectedPet.id.split('-')[1]}</span>
                      </div>
                      <div className="h-px bg-white/10" />
                      <button onClick={() => navigate(`/pet/${selectedPet.id}`)} className="w-full flex items-center justify-center gap-2 py-3 bg-white text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-50 transition-all">
                         View Public Profile <ArrowRight size={12} />
                      </button>
                   </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm flex flex-col">
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
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Log Date</label>
                          <input type="date" required min={selectedPet.birthday} max={todayStr} value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-100 font-bold text-sm" />
                        </div>
                        {isAddingRecord === 'vaccine' ? (
                          <>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Vaccine Name</label>
                              <input required placeholder="e.g. Rabies" value={newRecord.name} onChange={e => setNewRecord({...newRecord, name: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-100 font-bold text-sm" />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Next Due Date</label>
                              <input type="date" required value={newRecord.nextDueDate} onChange={e => setNewRecord({...newRecord, nextDueDate: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-100 font-bold text-sm" />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Weight (KG)</label>
                            <input type="number" step="0.1" required placeholder="0.0" value={newRecord.weight} onChange={e => setNewRecord({...newRecord, weight: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-100 font-bold text-sm" />
                          </div>
                        )}
                      </div>
                      <button type="submit" className="w-full py-4 bg-slate-900 text-theme rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Save Health Record</button>
                    </form>
                  ) : (selectedPet.vaccinations?.length || 0) + (selectedPet.weightHistory?.length || 0) > 0 ? (
                    <div className="flex-1 space-y-8">
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><TrendingUp size={14}/> Weight Trends</h5>
                        <WeightChart data={selectedPet.weightHistory} />
                      </div>

                      {selectedPet.vaccinations && selectedPet.vaccinations.length > 0 && (
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Syringe size={14}/> Vaccinations</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedPet.vaccinations.map((v, i) => (
                              <div key={i} className="group relative p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                 <div><p className="font-black text-slate-800 text-sm">{v.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Admin: {v.date}</p></div>
                                 <div className="text-right"><p className="text-[8px] font-black text-theme uppercase tracking-widest">Next Due</p><p className="text-[10px] font-black text-slate-700 mt-0.5">{v.nextDueDate}</p></div>
                                 <button onClick={() => handleDeleteRecord('vaccine', i)} className="absolute top-1 right-1 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                       <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-200"><Stethoscope size={32} /></div>
                       <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-[10px]">No medical logs recorded</p>
                       <button onClick={() => setIsAddingRecord('vaccine')} className="mt-6 text-theme font-black text-[10px] uppercase tracking-widest hover:underline">+ Add First Record</button>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-xl overflow-hidden relative group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 text-theme group-hover:scale-110 transition-transform"><Bot size={120}/></div>
                   <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-theme-light text-theme rounded-xl"><Sparkles size={20}/></div>
                         <div>
                            <h4 className="font-black text-xl text-white leading-none">AI Health Insights</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Smart wellness analysis</p>
                         </div>
                      </div>
                      <button 
                        onClick={generateHealthInsights} 
                        disabled={isAnalyzingHealth}
                        className="px-6 py-2.5 bg-theme text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-theme-hover transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isAnalyzingHealth ? <Loader2 size={14} className="animate-spin"/> : <Brain size={14}/>}
                        Generate Insights
                      </button>
                   </div>

                   <div className="relative z-10">
                      {isAnalyzingHealth ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                           <div className="flex gap-2">
                              <div className="w-2 h-2 rounded-full bg-theme animate-bounce"></div>
                              <div className="w-2 h-2 rounded-full bg-theme animate-bounce delay-100"></div>
                              <div className="w-2 h-2 rounded-full bg-theme animate-bounce delay-200"></div>
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scanning bio-records...</p>
                        </div>
                      ) : healthInsights ? (
                        <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 animate-in fade-in slide-in-from-bottom-2">
                           <div className="prose prose-invert prose-sm max-w-none">
                              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line font-medium">{healthInsights}</p>
                           </div>
                           <div className="mt-6 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-500 border-t border-white/5 pt-4">
                              <ShieldCheck size={12} className="text-emerald-500"/>
                              AI generated wellness analysis based on provided records
                           </div>
                        </div>
                      ) : (
                        <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-[2rem]">
                           <Bot size={32} className="mx-auto text-slate-700 mb-4"/>
                           <p className="text-slate-500 font-bold text-xs">Run analysis to see specialized care recommendations.</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-40 text-center animate-in zoom-in-95 duration-500">
              <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner"><Dog size={48} /></div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Registry Offline</h3>
              <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto text-sm leading-relaxed">Register your first companion to unlock AI health tracking and digital identities.</p>
              <button onClick={() => { setStep(1); setIsAdding(true); }} className="bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95">
                Begin Registration Cycle
              </button>
            </div>
          )}
        </>
      )}

      {/* AI Portrait Studio Modal */}
      {showStyleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[3.5rem] w-full max-w-5xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-12 border-b border-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-theme-light text-theme rounded-[2rem] shadow-sm">
                  <Zap size={32} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    Portrait Studio
                    <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">Premium Access</span>
                  </h3>
                  <p className="text-slate-500 font-medium text-sm">Designing a premium world-class identity for {selectedPet?.name}.</p>
                </div>
              </div>
              <button onClick={() => setShowStyleModal(false)} className="p-4 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">
                <X size={28} />
              </button>
            </div>
            
            <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/20">
              {AVATAR_STYLES.map(style => (
                <button 
                  key={style.id}
                  onClick={() => generateAIAvatar(style.id)}
                  className={`group relative flex flex-col p-8 rounded-[2.5rem] border transition-all text-left overflow-hidden h-full ${style.isPremium ? 'bg-slate-900 border-slate-800 text-white ring-8 ring-indigo-500/5' : 'bg-white border-slate-100 hover:border-theme hover:shadow-2xl hover:-translate-y-1'}`}
                >
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className={`p-3 rounded-2xl ${style.isPremium ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-50 text-slate-400 group-hover:bg-theme-light group-hover:text-theme'}`}>
                      {style.isPremium ? <Sparkles size={20} /> : <Palette size={20} />}
                    </div>
                    {style.isPremium && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full">
                         <Star size={12} className="text-indigo-400 fill-indigo-400" />
                         <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-400">Elite Model</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative z-10">
                    <h4 className={`font-black text-2xl mb-2 transition-colors ${style.isPremium ? 'text-white' : 'text-slate-900 group-hover:text-theme'}`}>
                      {style.name}
                    </h4>
                    <p className={`text-sm font-medium leading-relaxed mb-6 ${style.isPremium ? 'text-slate-400' : 'text-slate-500'}`}>
                      {style.description}
                    </p>
                  </div>
                  
                  <div className="mt-auto relative z-10 flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${style.isPremium ? 'bg-white/10 text-white group-hover:bg-white/20' : 'bg-slate-900 text-white group-hover:bg-theme'}`}>
                      Generate {style.name.split(' ')[0]} <ArrowRight size={12} />
                    </div>
                  </div>

                  <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full transition-all duration-1000 blur-3xl group-hover:scale-150 ${style.isPremium ? 'bg-indigo-500/20' : 'bg-theme/5 opacity-0 group-hover:opacity-100'}`}></div>
                </button>
              ))}
            </div>
            
            <div className="p-8 bg-white border-t border-slate-50 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <Sparkle size={20} className="text-theme animate-spin duration-[4000ms]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Synchronized with Gemini Hub</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Unlimited Registry Generations</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPet && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-8 bg-rose-50 border-b border-rose-100 flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl text-rose-500 shadow-sm">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-rose-900 tracking-tight">Purge Registry?</h3>
                <p className="text-rose-700/80 font-medium text-xs">This cycle is irreversible.</p>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                <p className="text-slate-600 font-medium text-sm leading-relaxed text-center">
                  Are you sure you want to permanently delete <strong className="text-slate-900 font-black">{selectedPet.name}</strong> from the guardian network?
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Abort
                </button>
                <button 
                  onClick={handleDeletePet}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Confirm Purge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetProfilePage;