import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { GoogleGenAI } from "@google/genai";
import { syncPetToDb, getPetById, deletePet } from '../services/firebase';
import jsQR from 'jsqr';
import { 
  Dog, Plus, PawPrint, Camera, CheckCircle2, Bird, Fish, Thermometer,  
  Trash2, Stethoscope, Brain, Wand2, Scan, X, Syringe, TrendingUp, Loader2, QrCode, ArrowRight, Palette, Sparkles, Download, AlertTriangle, Bot, Heart
} from 'lucide-react';
import { PetProfile, WeightRecord, VaccinationRecord, AppRoutes } from '../types';

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
  { id: 'bird', name: 'Birds', icon: Bird, species: ['Parrot', 'Parakeet', 'Cockatiel', 'Lovebird'] },
  { id: 'fish', name: 'Fish', icon: Fish, species: ['Goldfish', 'Betta Fish', 'Guppy'] },
  { id: 'reptile', name: 'Reptiles', icon: Thermometer, species: ['Turtle', 'Tortoise', 'Lizard'] },
];

const AVATAR_STYLES = [
  { id: 'realistic', name: 'Realistic', description: 'Studio lighting & 4K textures', prompt: 'A cinematic, ultra-high-quality professional studio avatar portrait. Detailed fur, vibrant lighting, 4K resolution, macro photography style.' },
  { id: 'cartoon', name: 'Cartoon', description: 'Pixar-inspired 3D character', prompt: 'A cute, 3D animated style character portrait. Pixar/Disney style, expressive eyes, vibrant colors, clean lines, high-end CGI.' },
  { id: 'watercolor', name: 'Watercolor', description: 'Dreamy & soft brushstrokes', prompt: 'A beautiful, delicate watercolor painting. Soft brushstrokes, artistic splatters, dreamy atmosphere, elegant paper texture background.' },
  { id: 'pixel-art', name: 'Pixel Art', description: 'Retro 16-bit aesthetic', prompt: 'A charming 16-bit retro pixel art portrait. Clean pixels, limited color palette, game-boy aesthetic, nostalgic video game character style.' },
  { id: 'oil', name: 'Oil Painting', description: 'Majestic classical portrait', prompt: 'A classic, majestic oil painting portrait. Rich textures, deep colors, masterful lighting, baroque museum style, heavy canvas feel.' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon lights & futuristic tech', prompt: 'A futuristic cyberpunk themed portrait. Neon lights, mechanical enhancements, synthwave aesthetic, dark city background, high-tech glow.' },
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
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [healthInsights, setHealthInsights] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [newPet, setNewPet] = useState<Partial<PetProfile>>({ name: '', breed: '', birthday: '', bio: '', temperament: '', species: 'Dog', weightHistory: [], vaccinations: [] });
  const [newRecord, setNewRecord] = useState({ name: '', date: new Date().toISOString().split('T')[0], weight: '', nextDueDate: '' });
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Delete States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
    
    // Simple inline validation
    if (!newPet.name || !newPet.birthday || !newPet.species) {
      addNotification('Validation Error', 'Please fill in all required fields.', 'warning');
      return;
    }

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
      navigate(AppRoutes.HOME);
    }, 1800);
  };

  const handleDeletePet = async () => {
    if (!selectedPet || !user || deleteConfirmation !== selectedPet.name) return;
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
      
      addNotification('Profile Deleted', `${selectedPet.name}'s profile has been removed.`, 'info');
    } catch (error) {
      console.error("Delete error:", error);
      addNotification('Error', 'Failed to delete profile.', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return;

    // Inline validation
    if (isAddingRecord === 'weight' && !newRecord.weight) {
      addNotification('Validation Error', 'Weight value is required.', 'warning');
      return;
    }
    if (isAddingRecord === 'vaccine' && (!newRecord.name || !newRecord.nextDueDate)) {
      addNotification('Validation Error', 'Vaccine name and next due date are required.', 'warning');
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
    addNotification('Record Added', 'Health logs updated successfully.', 'success');
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

  const handleGenerateHealthInsights = async () => {
    if (!selectedPet) return;
    setIsAnalyzing(true);
    setHealthInsights(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const weightData = selectedPet.weightHistory.map(w => `${w.date}: ${w.weight}kg`).join(', ');
      const vaxData = selectedPet.vaccinations.map(v => `${v.name} (Due: ${v.nextDueDate})`).join(', ');

      const prompt = `Act as a professional veterinarian. Analyze the following pet's records:
      Pet: ${selectedPet.name} (${selectedPet.species}, ${selectedPet.breed})
      Weight History: ${weightData || 'None'}
      Vaccinations: ${vaxData || 'None'}
      
      Provide a concise analysis (max 150 words) including:
      1. Evaluation of weight trends.
      2. Status of preventative care.
      3. One specific health tip for this pet type.
      Use a friendly, professional tone.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setHealthInsights(response.text);
      addNotification('Insights Ready', 'AI has analyzed your pet\'s health data.', 'success');
    } catch (error) {
      console.error("AI Insight Error:", error);
      addNotification('AI Error', 'Failed to generate health insights.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadQRCode = () => {
    if (!selectedPet) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.origin + '/#/pet/' + selectedPet.id)}`;
    
    // Fetch image as blob to trigger download
    fetch(qrUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SS_Paw_Pal_ID_${selectedPet.name}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        addNotification('ID Downloaded', 'Digital ID saved as PNG.', 'success');
      })
      .catch(() => addNotification('Download Error', 'Could not save Digital ID.', 'error'));
  };

  const generateAIAvatar = async (styleId: string, base64Source?: string) => {
    if (!selectedPet) return;
    const style = AVATAR_STYLES.find(s => s.id === styleId) || AVATAR_STYLES[0];
    setShowStyleModal(false);
    setIsGeneratingAvatar(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stylePrompt = style.prompt;
      const corePrompt = `${stylePrompt} Subject: a ${selectedPet.breed} ${selectedPet.species} named ${selectedPet.name}. Elegant composition, focus on facial features.`;
      
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
          const updatedPet = { ...selectedPet, avatarUrl, preferredStyle: style.id };
          const updatedPets = pets.map(p => p.id === selectedPet.id ? updatedPet : p);
          await savePetsToStorage(updatedPets);
          setSelectedPet(updatedPet);
          addNotification('AI Masterpiece', `A new ${style.name} avatar has been created!`, 'success');
          break;
        }
      }
    } catch (err: any) {
      console.error("Avatar error:", err);
      addNotification('AI Studio Error', 'Avatar generation failed. Please try again.', 'error');
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
              addNotification('ID Identified', `Profile for ${petData.name} retrieved.`, 'success');
              const userPet = pets.find(p => p.id === petData.id);
              if (userPet) {
                setSelectedPet(userPet);
                setIsAdding(false);
              } else {
                navigate(`/pet/${petData.id}`);
              }
            } else {
              addNotification('No Data', 'The scanned ID does not exist in our registry.', 'warning');
            }
          } catch (err) {
            addNotification('Retrieval Failed', 'Could not verify ID.', 'error');
          }
        } else {
          addNotification('Scan Failed', 'No valid QR code found in the image.', 'error');
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
          <p className="text-slate-500 font-medium text-sm">Manage profiles and wellness records for your pets.</p>
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

      <div className="gap-3 overflow-x-auto pb-4 scroll-hide flex">
        {pets.map(p => (
          <button 
            key={p.id} 
            onClick={() => { setSelectedPet(p); setHealthInsights(null); setIsAdding(false); }} 
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
              <p className="mt-2 text-white/80 font-bold">Synchronizing with Dashboard...</p>
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
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Name</label>
                <input required value={newPet.name} onChange={e => setNewPet({ ...newPet, name: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-theme/5 font-bold" placeholder="Companion's Name" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Birthday</label>
                <input type="date" required value={newPet.birthday} onChange={e => setNewPet({ ...newPet, birthday: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-theme/5 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Temperament & Habits</label>
                <textarea 
                  value={newPet.temperament} 
                  onChange={e => setNewPet({ ...newPet, temperament: e.target.value })} 
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-theme/5 font-medium min-h-[100px] resize-none" 
                  placeholder="Describe your pet's personality..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Story / Bio</label>
                <textarea 
                  value={newPet.bio} 
                  onChange={e => setNewPet({ ...newPet, bio: e.target.value })} 
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-theme/5 font-medium min-h-[100px] resize-none" 
                  placeholder="Share a short story about your companion..."
                />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all">Complete Registration</button>
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-theme">Designing...</span>
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
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => generateAIAvatar(selectedPet.preferredStyle || AVATAR_STYLES[0].id, reader.result as string); reader.readAsDataURL(file); } }} />
                </button>
                <button 
                  onClick={() => setShowStyleModal(true)} 
                  disabled={isGeneratingAvatar} 
                  className="p-3.5 rounded-xl shadow-lg transition-all bg-slate-900 text-theme hover:bg-black flex items-center gap-2" 
                  title="Open AI Avatar Studio"
                >
                  <Wand2 size={20} />
                  {!isGeneratingAvatar && <span className="text-[10px] font-black uppercase tracking-widest pr-1">AI Studio</span>}
                </button>
              </div>

              <div className="space-y-1 pb-4">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedPet.name}</h3>
                <p className="text-[10px] font-black text-theme uppercase tracking-[0.2em]">{selectedPet.breed} · {selectedPet.species}</p>
                {selectedPet.temperament && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl text-left border border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5"><Heart size={10} className="text-rose-400" /> Temperament</p>
                    <p className="text-xs text-slate-600 font-medium italic">"{selectedPet.temperament}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
               
               <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                     <QrCode size={20} className="text-indigo-400" />
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Digital Identity</h4>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={downloadQRCode} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-indigo-300" title="Download Digital ID">
                      <Download size={14} />
                    </button>
                    <button onClick={handleScanClick} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                      <Scan size={14} className="text-indigo-300" />
                    </button>
                  </div>
               </div>

               <div className="bg-white p-6 rounded-[2rem] mx-auto w-44 h-44 flex items-center justify-center shadow-inner group relative overflow-hidden">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/#/pet/' + selectedPet.id)}`} 
                    alt="Pet QR ID" 
                    className="w-full h-full object-contain mix-blend-multiply"
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
                     View Public Portal <ArrowRight size={12} />
                  </button>
                  
                  {/* Delete Button */}
                  <button 
                    onClick={() => setShowDeleteModal(true)} 
                    className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 text-rose-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                  >
                     <Trash2 size={12} /> Remove Profile
                  </button>
               </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm min-h-[400px] flex flex-col">
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
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Log Date</label>
                        <input type="date" required value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-theme/5" />
                     </div>
                   {isAddingRecord === 'vaccine' ? (
                     <>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Vaccine Name</label>
                          <input required placeholder="e.g. Rabies" value={newRecord.name} onChange={e => setNewRecord({...newRecord, name: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-theme/5" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Next Due Date</label>
                          <input type="date" required value={newRecord.nextDueDate} onChange={e => setNewRecord({...newRecord, nextDueDate: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-theme/5" />
                        </div>
                     </>
                   ) : (
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Weight Value (KG)</label>
                        <input type="number" step="0.1" required placeholder="e.g. 12.5" value={newRecord.weight} onChange={e => setNewRecord({...newRecord, weight: e.target.value})} className="w-full p-4 rounded-xl bg-white border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-theme/5" />
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
                         <div key={i} className="group relative p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div><p className="font-black text-slate-800 text-sm">{v.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Admin: {v.date}</p></div>
                            <div className="text-right"><p className="text-[8px] font-black text-theme uppercase tracking-widest">Next Due</p><p className="text-[10px] font-black text-slate-700 mt-0.5">{v.nextDueDate}</p></div>
                            <button onClick={() => handleDeleteRecord('vaccine', i)} className="absolute top-1 right-1 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
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
                         <div key={i} className="group relative p-4 bg-white rounded-2xl border border-slate-100 flex flex-col items-center shrink-0 min-w-[100px] shadow-sm">
                            <p className="text-xl font-black text-slate-900">{w.weight} <span className="text-[10px] text-slate-400">kg</span></p><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{w.date}</p>
                            <button onClick={() => handleDeleteRecord('weight', i)} className="absolute top-1 right-1 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
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

             {/* AI Health Insights Section */}
             <div className="mt-8 pt-8 border-t border-slate-50">
               <div className="flex flex-col gap-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Sparkles size={20} className="text-amber-500" />
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Wellness Analysis</h4>
                    </div>
                    <button 
                      onClick={handleGenerateHealthInsights} 
                      disabled={isAnalyzing || (!selectedPet.vaccinations?.length && !selectedPet.weightHistory?.length)}
                      className="px-6 py-3 bg-slate-900 text-theme rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50 flex items-center gap-2"
                    >
                      {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                      {isAnalyzing ? 'Processing Intelligence' : 'Generate Health Insights'}
                    </button>
                 </div>

                 {healthInsights ? (
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 animate-in fade-in slide-in-from-top-4">
                     <div className="flex items-center gap-3 mb-4">
                        <Bot size={20} className="text-theme" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gemini Veterinary Intelligence</span>
                     </div>
                     <div className="prose prose-sm max-w-none">
                        <p className="text-slate-600 font-medium leading-relaxed italic whitespace-pre-wrap">
                          {healthInsights}
                        </p>
                     </div>
                     <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg text-amber-600 text-[8px] font-black uppercase tracking-widest">
                        <AlertTriangle size={12} /> AI Analysis is for informational purposes. Always consult your local vet.
                     </div>
                   </div>
                 ) : (
                   !isAnalyzing && (selectedPet.vaccinations?.length || 0) + (selectedPet.weightHistory?.length || 0) > 0 && (
                    <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Ready to analyze medical history</p>
                    </div>
                   )
                 )}
               </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="py-40 text-center animate-in zoom-in-95 duration-500">
          <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner"><Dog size={48} /></div>
          <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Companion Network Offline</h3>
          <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto text-sm leading-relaxed">Register your first companion to unlock AI health tracking.</p>
          <button onClick={() => { setStep(1); setIsAdding(true); }} className="bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95">
            Start Registration
          </button>
        </div>
      )}

      {showStyleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-theme-light text-theme rounded-2xl">
                  <Palette size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI Avatar Studio</h3>
                  <p className="text-slate-500 font-medium text-sm">Choose an artistic style for {selectedPet?.name}'s new look.</p>
                </div>
              </div>
              <button onClick={() => setShowStyleModal(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {AVATAR_STYLES.map(style => (
                <button 
                  key={style.id}
                  onClick={() => generateAIAvatar(style.id)}
                  className={`group relative flex flex-col p-6 rounded-3xl border transition-all text-left ${selectedPet?.preferredStyle === style.id ? 'border-theme bg-theme-light' : 'border-slate-100 hover:border-theme hover:bg-theme-light'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-theme transition-opacity ${selectedPet?.preferredStyle === style.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {selectedPet?.preferredStyle === style.id ? 'Current Style' : 'Select Style'}
                    </span>
                    <Sparkles size={14} className={`transition-colors ${selectedPet?.preferredStyle === style.id ? 'text-theme' : 'text-slate-200 group-hover:text-theme'}`} />
                  </div>
                  <h4 className={`font-black text-lg mb-1 transition-colors ${selectedPet?.preferredStyle === style.id ? 'text-theme' : 'text-slate-900 group-hover:text-theme'}`}>{style.name}</h4>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{style.description}</p>
                  
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-10 -mt-10 transition-transform ${selectedPet?.preferredStyle === style.id ? 'bg-theme/10 scale-110' : 'bg-theme/5 group-hover:scale-110'}`}></div>
                </button>
              ))}
            </div>
            
            <div className="p-8 bg-slate-50 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Powered by Gemini Visual Engine</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="p-8 bg-rose-50 border-b border-rose-100 flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl text-rose-500 shadow-sm">
                   <AlertTriangle size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-rose-900 tracking-tight">Delete Profile?</h3>
                   <p className="text-rose-700/80 font-medium text-xs">This action is permanent and cannot be undone.</p>
                </div>
             </div>
             
             <div className="p-8 space-y-6">
                <p className="text-slate-600 font-medium text-sm leading-relaxed">
                   To confirm deletion of <strong>{selectedPet?.name}</strong>, please type their name below.
                </p>
                
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirmation</label>
                   <input 
                      autoFocus
                      type="text" 
                      placeholder={`Type "${selectedPet?.name}" to confirm`} 
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 border border-slate-100 font-bold text-slate-800"
                   />
                </div>

                <div className="flex gap-3">
                   <button 
                      onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(''); }}
                      className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                   >
                      Cancel
                   </button>
                   <button 
                      onClick={handleDeletePet}
                      disabled={deleteConfirmation !== selectedPet?.name || isDeleting}
                      className="flex-1 py-4 bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                   >
                      {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      {isDeleting ? 'Deleting...' : 'Delete Forever'}
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